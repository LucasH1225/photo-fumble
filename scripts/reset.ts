import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createRepository } from '../server/repository.js';
import { freshSession } from '../server/engine.js';
import { roomNamespace, validateRoomCode } from '../server/rooms.js';
if (!process.argv.includes('--confirm'))
  throw new Error(
    'Stop the server first. Then run npm run session:reset -- --confirm. Stored media is retained.',
  );
const roomIndex = process.argv.indexOf('--room');
const code = roomIndex >= 0 ? process.argv[roomIndex + 1] : undefined;
if (roomIndex >= 0) validateRoomCode(code);
const namespace = roomNamespace(process.env.SESSION_NAMESPACE || 'local', code);
const repository = createRepository(namespace);
if (code && !(await repository.loadExisting()))
  throw new Error('Room not found; no state changed.');
const old = await repository.load();
const next = freshSession();
next.version = old.version + 1;
next.assets = old.assets;
await repository.commit(old.version, next, {
  id: randomUUID(),
  playerId: 'operator',
  receipt: { ok: true, version: next.version },
});
console.log(
  `Reset ${code ? `room ${code}` : namespace + ' legacy session'}. Media retained. Start or resume the server now.`,
);
