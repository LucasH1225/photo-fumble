import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import { Server } from 'socket.io';
import { z } from 'zod';
import { createRepository } from './repository.js';
import { GameService } from './service.js';
import { GameError, mediaKeyFor, requireRule } from './engine.js';
import { byteRange, processMedia } from './media.js';
import { MODES, type Asset, type Envelope } from '../shared/types.js';

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
const repository = createRepository();
const service = new GameService(repository);
await service.init();
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
function player(req: Request): string {
  const id = req.signedCookies?.pf_session;
  requireRule(typeof id === 'string' && Boolean(service.state.players[id]), 'Join the game first.');
  return id;
}
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.post(
  '/api/session/join',
  rateLimit({ windowMs: 15 * 60_000, limit: 100, legacyHeaders: false }),
  async (req, res) => {
    await service.refresh();
    const oldId = req.signedCookies?.pf_session;
    const existing = typeof oldId === 'string' && Boolean(service.state.players[oldId]);
    const id = existing ? (oldId as string) : randomUUID();
    res.cookie('pf_session', id, {
      signed: true,
      httpOnly: true,
      secure: production,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60_000,
      path: '/',
    });
    if (!existing) await service.join(z.string().max(24).parse(req.body?.name), id);
    res.json(service.view(id));
  },
);
app.get('/api/session', async (req, res) => {
  await service.refresh();
  const id = req.signedCookies?.pf_session;
  if (typeof id !== 'string' || !service.state.players[id]) {
    res.status(401).json({ error: 'Join with your nickname.' });
    return;
  }
  res.json(service.view(id));
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 8, fieldSize: 20_000, parts: 10 },
});
const maskSchema = z
  .array(
    z
      .object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        width: z.number().positive().max(1),
        height: z.number().positive().max(1),
      })
      .refine((m) => m.x + m.width <= 1.001 && m.y + m.height <= 1.001),
  )
  .max(32);
// Limit total buffered uploads before multer allocates them on the small instance.
let activeUploads = 0;
app.post(
  '/api/uploads',
  (req, res, next) => {
    player(req);
    if (activeUploads >= 3) {
      res.status(429).json({ error: 'Other photos are processing. Try again in a moment.' });
      return;
    }
    activeUploads++;
    res.once('close', () => {
      activeUploads--;
    });
    next();
  },
  upload.single('file'),
  async (req, res) => {
    const id = player(req);
    const actionId = z.uuid().parse(req.body.actionId);
    const prior = await repository.receipt(actionId, id);
    if (prior) {
      res.json(prior);
      return;
    }
    const g = service.state.game;
    requireRule(
      g?.phase === 'prepare' && g.roster.includes(id) && req.body.gameId === g.id,
      'This preparation has ended.',
    );
    requireRule(req.file, 'Choose a file to upload.');
    const masks = maskSchema.parse(JSON.parse(req.body.masks || '[]'));
    const fields = z
      .object({
        answer: z.string().max(1500).optional(),
        falseStory: z.string().max(1500).optional(),
        redacted: z.boolean(),
      })
      .parse({
        answer: req.body.answer,
        falseStory: req.body.falseStory,
        redacted: req.body.redacted === 'true',
      });
    const processed = await processMedia(req.file.buffer, g.mode, masks);
    const assetId = randomUUID();
    const prefix = `${process.env.SESSION_NAMESPACE || 'local'}/${g.id}/${assetId}`;
    const asset: Asset = {
      id: assetId,
      gameId: g.id,
      ownerId: id,
      key: `${prefix}.${processed.extension}`,
      mime: processed.mime,
      ...(processed.blur ? { blurKey: `${prefix}-blur.webp` } : {}),
    };
    const keys = [asset.key, ...(asset.blurKey ? [asset.blurKey] : [])];
    let savingState = false;
    try {
      await repository.put(asset.key, processed.data, processed.mime);
      if (processed.blur && asset.blurKey)
        await repository.put(asset.blurKey, processed.blur, 'image/webp');
      savingState = true;
      const receipt = await service.submission(id, actionId, asset, fields);
      if (!service.state.assets[assetId]) await repository.remove(keys).catch(() => {});
      res.json(receipt);
    } catch (error) {
      // A commit can succeed while its HTTP response is lost. Never remove a committed file.
      const committed = await repository.receipt(actionId, id).catch(() => undefined);
      if (committed) {
        res.json(committed);
        return;
      }
      if (
        (!savingState || (error instanceof GameError && error.code === 'INVALID_ACTION')) &&
        !service.state.assets[assetId]
      )
        await repository.remove(keys).catch(() => {});
      throw error;
    }
  },
);
app.get('/api/media/:assetId', async (req, res) => {
  const permitted = mediaKeyFor(service.state, player(req), String(req.params.assetId));
  const media = await repository.get(permitted.key);
  if (typeof media === 'string') {
    res.redirect(302, media);
    return;
  }
  res.type(permitted.mime).setHeader('Accept-Ranges', 'bytes');
  if (req.headers.range) {
    const range = byteRange(req.headers.range, media.length);
    if (!range) {
      res.status(416).setHeader('Content-Range', `bytes */${media.length}`);
      res.end();
      return;
    }
    const [start, end] = range;
    res.status(206).setHeader('Content-Range', `bytes ${start}-${end}/${media.length}`);
    res.send(media.subarray(start, end + 1));
    return;
  }
  res.send(media);
});
const commands = z.discriminatedUnion('type', [
  z.object({
    type: z.enum([
      'elect',
      'start',
      'cancel',
      'open',
      'close',
      'next',
      'skip',
      'skipItem',
      'loaded',
    ]),
  }),
  z.object({ type: z.literal('choose'), mode: z.enum(MODES) }),
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
    await service.refresh();
    const raw = socket.request.headers.cookie
      ?.split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('pf_session='))
      ?.slice('pf_session='.length);
    const id = raw ? cookieParser.signedCookie(decodeURIComponent(raw), secret!) : false;
    requireRule(typeof id === 'string' && service.state.players[id], 'Join the game first.');
    socket.data.playerId = id;
    next();
  } catch {
    next(new Error('Join the game first.'));
  }
});
service.changed = () => {
  for (const socket of io.sockets.sockets.values()) {
    if (service.state.players[socket.data.playerId])
      socket.emit('state', service.view(socket.data.playerId));
    else socket.disconnect(true);
  }
};
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
  service.online.add(id);
  service.changed();
  socket.on('command', async (raw, ack) => {
    if (typeof ack !== 'function') return;
    try {
      let window = actionWindows.get(id);
      if (!window || Date.now() - window.time > 10_000) {
        window = { time: Date.now(), count: 0 };
        actionWindows.set(id, window);
      }
      requireRule(++window.count <= 120, 'Too many actions. Wait a moment.');
      const envelope = envelopeSchema.parse(raw) as Envelope;
      const receipt = await service.command(id, envelope);
      ack(receipt);
    } catch (error) {
      ack(errorReceipt(error));
      socket.emit('state', service.view(id));
    }
  });
  socket.on('disconnect', () => {
    if (![...io.sockets.sockets.values()].some((s) => s.data.playerId === id)) {
      service.online.delete(id);
      actionWindows.delete(id);
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
  res.status(body.code === 'SAVE_FAILED' ? 503 : 400).json(body);
});
http.listen(port, '0.0.0.0', () => {
  console.log(
    `Photo Fumble listening on port ${port}; ${production ? 'Supabase' : process.env.SUPABASE_URL ? 'Supabase' : 'local file'} persistence.`,
  );
});
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    io.close();
    http.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
