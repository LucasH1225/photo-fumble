import express, { type Express, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import { z } from 'zod';
import { GameError, mediaKeyFor, requireRule } from './engine.js';
import { byteRange, processMedia } from './media.js';
import { RoomError, RoomManager, roomView, type Room } from './rooms.js';
import type { Asset } from '../shared/types.js';

export function roomPlayer(room: Room, identity: unknown): string {
  if (typeof identity !== 'string' || !room.service.state.players[identity])
    throw new RoomError('Join this room with your nickname first.', 'NOT_JOINED', 401);
  return identity;
}
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

export function registerRoomRoutes(app: Express, rooms: RoomManager, production: boolean) {
  function identity(req: Request, res: Response) {
    const previous = req.signedCookies?.pf_session;
    const id =
      typeof previous === 'string' && z.uuid().safeParse(previous).success
        ? previous
        : randomUUID();
    res.cookie('pf_session', id, {
      signed: true,
      httpOnly: true,
      secure: production,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60_000,
      path: '/',
    });
    return id;
  }
  app.post(
    '/api/rooms',
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 10,
      legacyHeaders: false,
      message: { error: 'Too many new rooms. Wait a few minutes and try again.' },
    }),
    async (req, res) => {
      const name = z.string().max(24).parse(req.body?.name);
      const id = identity(req, res);
      const room = await rooms.create(name, id);
      res.status(201).json({ code: room.code, view: roomView(room, id) });
    },
  );
  const joinLimit = rateLimit({
    windowMs: 15 * 60_000,
    limit: 100,
    legacyHeaders: false,
    message: { error: 'Too many join attempts. Wait a few minutes and try again.' },
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 8, fieldSize: 20_000, parts: 10 },
  });
  // Shared by all routers/rooms, including processing after an HTTP disconnect.
  let activeUploads = 0;
  function routes(scoped: boolean) {
    const router = express.Router({ mergeParams: true });
    const code = (req: Request) => (scoped ? String(req.params.code) : undefined);
    router.get('/session', async (req, res) =>
      rooms.use(code(req), (room) => {
        const id = roomPlayer(room, req.signedCookies?.pf_session);
        res.json(roomView(room, id));
      }),
    );
    router.post('/session/join', joinLimit, async (req, res) =>
      rooms.use(code(req), async (room) => {
        if (!scoped) {
          // Old clients may resume, but the former global lobby accepts no new members.
          const id = roomPlayer(room, req.signedCookies?.pf_session);
          res.json(roomView(room, id));
          return;
        }
        const id = identity(req, res);
        if (!room.service.state.players[id])
          await room.service.join(z.string().max(24).parse(req.body?.name), id);
        res.json(roomView(room, id));
      }),
    );
    router.post('/uploads', async (req, res) =>
      rooms.use(code(req), async (room) => {
        const id = roomPlayer(room, req.signedCookies?.pf_session);
        if (activeUploads >= 3) {
          res.status(429).json({ error: 'Other photos are processing. Try again in a moment.' });
          return;
        }
        activeUploads++;
        try {
          await new Promise<void>((resolve, reject) =>
            upload.single('file')(req, res, (error) => (error ? reject(error) : resolve())),
          );
          const { service } = room;
          const repository = service.repository;
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
          const prefix = `${room.namespace}/${g.id}/${assetId}`;
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
        } finally {
          activeUploads--;
        }
      }),
    );
    router.get('/media/:assetId', async (req, res) =>
      rooms.use(code(req), async (room) => {
        const id = roomPlayer(room, req.signedCookies?.pf_session);
        const permitted = mediaKeyFor(room.service.state, id, String(req.params.assetId));
        const media = await room.service.repository.get(permitted.key);
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
      }),
    );
    return router;
  }
  app.use('/api/rooms/:code', routes(true));
  app.use('/api', routes(false));
}
