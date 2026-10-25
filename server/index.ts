import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import { Server } from 'socket.io';
import { z } from 'zod';
import { GameError, requireRule } from './engine.js';
import { RoomManager, RoomError, roomView, type Room } from './rooms.js';
import { registerRoomRoutes, roomPlayer } from './room-routes.js';
import { MODES, type Envelope } from '../shared/types.js';

const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 3001);
const origin = new URL(
  process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173',
).origin;
let secret = process.env.SESSION_SECRET;
if (!secret) {
  if (production) throw new Error('Set SESSION_SECRET to at least 32 random characters.');
  const root = process.env.LOCAL_DATA_DIR || '.data';
  await mkdir(root, { recursive: true });
  try {
    secret = await readFile(path.join(root, '.session-secret'), 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    secret = randomBytes(48).toString('hex');
    await writeFile(path.join(root, '.session-secret'), secret, { mode: 0o600 });
  }
}
if (secret.length < 32 || (production && secret.startsWith('replace-')))
  throw new Error('SESSION_SECRET must contain at least 32 random characters.');
const rooms = new RoomManager();
await rooms.get();
const app = express();
if (production) app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: [
          "'self'",
          'blob:',
          'data:',
          ...(process.env.SUPABASE_URL ? [new URL(process.env.SUPABASE_URL).origin] : []),
        ],
        mediaSrc: [
          "'self'",
          'blob:',
          ...(process.env.SUPABASE_URL ? [new URL(process.env.SUPABASE_URL).origin] : []),
        ],
        connectSrc: ["'self'", origin.replace(/^http/, 'ws')],
        upgradeInsecureRequests: production ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  }),
);
app.use(cookieParser(secret));
app.use(express.json({ limit: '16kb' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(
  '/api',
  rateLimit({ windowMs: 60_000, limit: 1000, standardHeaders: 'draft-8', legacyHeaders: false }),
);
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' && req.get('origin') !== origin) {
    res.status(403).json({ error: 'Open the game website to submit actions.' });
    return;
  }
  next();
});
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
registerRoomRoutes(app, rooms, production);
const commands = z.discriminatedUnion('type', [
  z.object({
    type: z.enum([
      'elect',
      'start',
      'cancel',
      'lobby',
      'open',
      'close',
      'next',
      'skip',
      'skipItem',
      'loaded',
    ]),
  }),
  z.object({ type: z.literal('choose'), mode: z.enum(MODES) }),
  z.object({ type: z.literal('setHost'), targetId: z.uuid() }),
  z.object({ type: z.literal('guess'), value: z.string().max(1000) }),
  z.object({ type: z.literal('judge'), yes: z.boolean() }),
  z.object({ type: z.literal('clue'), value: z.string().max(300) }),
  z.object({ type: z.literal('vote'), targetId: z.uuid() }),
]);
const envelopeSchema = z.object({
  id: z.uuid(),
  version: z.number().int().min(0),
  gameId: z.uuid().optional(),
  phaseKey: z.string().max(150).optional(),
  command: commands,
});
const http = createServer(app);
const io = new Server(http, {
  maxHttpBufferSize: 16_384,
  allowRequest: (req, callback) =>
    callback(null, !req.headers.origin || req.headers.origin === origin),
});
io.use(async (socket, next) => {
  try {
    const requestedCode = socket.handshake.auth?.roomCode;
    requireRule(
      requestedCode === undefined || typeof requestedCode === 'string',
      'Invalid room code.',
    );
    await rooms.use(requestedCode, (room) => {
      const raw = socket.request.headers.cookie
        ?.split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('pf_session='))
        ?.slice('pf_session='.length);
      const identity = raw ? cookieParser.signedCookie(decodeURIComponent(raw), secret!) : false;
      socket.data.playerId = roomPlayer(room, identity);
      socket.data.room = room;
    });
    next();
  } catch {
    next(new Error('Join the game first.'));
  }
});
rooms.changed = (room) => {
  const members = io.sockets.adapter.rooms.get(room.namespace);
  for (const socketId of members ?? []) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket || socket.data.room !== room) continue;
    if (room.service.state.players[socket.data.playerId])
      socket.emit('state', roomView(room, socket.data.playerId));
    else socket.disconnect(true);
  }
};
const roundClock = setInterval(async () => {
  try {
    await rooms.tick();
  } catch (error) {
    errorReceipt(error);
  }
}, 250);
roundClock.unref();
const actionWindows = new Map<string, { time: number; count: number }>();
function errorReceipt(error: unknown) {
  if (error instanceof GameError) return { ok: false, error: error.message, code: error.code };
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return { ok: false, error: 'Check your input and try again.', code: 'INVALID_INPUT' };
  if (error instanceof multer.MulterError)
    return {
      ok: false,
      error: 'The file is too large. Photos: 10 MB. Recordings: 20 MB.',
      code: 'UPLOAD_LIMIT',
    };
  const provider = error && typeof error === 'object' ? (error as Record<string, unknown>) : {};
  const code =
    typeof provider.code === 'string' && /^[A-Z0-9_]{1,20}$/.test(provider.code)
      ? provider.code
      : undefined;
  console.error('Operation failed:', {
    name: error instanceof Error ? error.name : 'StorageError',
    code,
  });
  return {
    ok: false,
    error: 'The server could not save this. Check the connection and retry.',
    code: 'SAVE_FAILED',
  };
}
io.on('connection', (socket) => {
  const id = socket.data.playerId as string;
  const room = socket.data.room as Room;
  const service = room.service;
  const actionKey = `${room.namespace}:${id}`;
  room.connections++;
  room.lastUsed = Date.now();
  socket.join(room.namespace);
  service.online.add(id);
  service.changed();
  socket.on('command', async (raw, ack) => {
    if (typeof ack !== 'function') return;
    const release = rooms.retain(room);
    try {
      let window = actionWindows.get(actionKey);
      if (!window || Date.now() - window.time > 10_000) {
        window = { time: Date.now(), count: 0 };
        actionWindows.set(actionKey, window);
      }
      requireRule(++window.count <= 120, 'Too many actions. Wait a moment.');
      const envelope = envelopeSchema.parse(raw) as Envelope;
      const receipt = await service.command(id, envelope);
      ack(receipt);
    } catch (error) {
      ack(errorReceipt(error));
      socket.emit('state', roomView(room, id));
    } finally {
      release();
    }
  });
  socket.on('disconnect', () => {
    room.connections--;
    room.lastUsed = Date.now();
    if (
      ![...io.sockets.sockets.values()].some((s) => s.data.room === room && s.data.playerId === id)
    ) {
      service.online.delete(id);
      actionWindows.delete(actionKey);
    }
    service.changed();
  });
});
const client = path.resolve('dist/client');
app.use(express.static(client, { index: false }));
app.get('/{*path}', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }
  res.sendFile(path.join(client, 'index.html'));
});
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const body = errorReceipt(error);
  res
    .status(error instanceof RoomError ? error.status : body.code === 'SAVE_FAILED' ? 503 : 400)
    .json(body);
});
http.listen(port, '0.0.0.0', () => {
  console.log(
    `Photo Fumble listening on port ${port}; ${production ? 'Supabase' : process.env.SUPABASE_URL ? 'Supabase' : 'local file'} persistence.`,
  );
});
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    clearInterval(roundClock);
    io.close();
    http.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
