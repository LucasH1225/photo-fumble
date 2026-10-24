import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createRepository } from '../server/repository.js';
import { freshSession } from '../server/engine.js';
if (!process.argv.includes('--confirm'))
  throw new Error(
    'Stop the server first. Then run npm run session:reset -- --confirm. Stored media is retained.',
  );
const repository = createRepository();
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
  `Reset ${process.env.SESSION_NAMESPACE || 'local'} session. Media retained. Start or resume the server now.`,
);
