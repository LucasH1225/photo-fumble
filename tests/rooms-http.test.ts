import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createHmac, randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { io, type Socket } from 'socket.io-client';
import sharp from 'sharp';
import { LocalRepository } from '../server/repository.js';
import { GameService } from '../server/service.js';
import { phaseKey } from '../server/engine.js';
import type { PlayerView, Command } from '../shared/types.js';

const secret = 'room-integration-test-secret-over-32-characters';
type Jar = { cookie: string };
async function port() {
  const listener = createServer();
  await new Promise<void>((resolve) => listener.listen(0, '127.0.0.1', resolve));
  const chosen = (listener.address() as { port: number }).port;
  await new Promise<void>((resolve) => listener.close(() => resolve()));
  return chosen;
}
async function server(root: string, origin: string) {
  const child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: new URL(origin).port,
      APP_ORIGIN: origin,
      LOCAL_DATA_DIR: root,
      SESSION_NAMESPACE: 'test',
      SESSION_SECRET: secret,
      SUPABASE_URL: '',
      SUPABASE_SECRET_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Test server did not start.'));
    }, 10_000);
    child.stdout.on('data', (chunk) => {
      if (String(chunk).includes('listening on port')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Test server exited: ${code}`));
    });
    child.once('error', reject);
  });
  return async () => {
    if (child.exitCode !== null) return;
    await new Promise<void>((resolve) => {
      child.once('exit', () => resolve());
      child.kill('SIGTERM');
    });
  };
}
async function until(check: () => Promise<boolean>) {
  for (let n = 0; n < 100; n++) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail('Condition did not become true.');
}

test(
  'HTTP/socket room isolation, same-browser identity, media boundaries, restart, and legacy compatibility',
  { timeout: 30_000 },
  async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'pf-room-http-'));
    const origin = `http://127.0.0.1:${await port()}`;
    const sockets: Socket[] = [];
    const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'red' } })
      .webp()
      .toBuffer();
    const legacyRepository = new LocalRepository(root, 'test');
    const legacy = new GameService(legacyRepository);
    await legacy.init();
    const legacyIds = await Promise.all(['Old A', 'Old B', 'Old C'].map((n) => legacy.join(n)));
    legacyIds.forEach((id) => legacy.online.add(id));
    await legacy.command(legacyIds[0], {
      id: randomUUID(),
      version: legacy.state.version,
      command: { type: 'setHost', targetId: legacyIds[0] },
    });
    await legacy.command(legacyIds[0], {
      id: randomUUID(),
      version: legacy.state.version,
      command: { type: 'choose', mode: 'quiz' },
    });
    const legacyAsset = {
      id: randomUUID(),
      gameId: legacy.state.game!.id,
      ownerId: legacyIds[0],
      key: 'old-game/original.webp',
      mime: 'image/webp',
    };
    await legacyRepository.put(legacyAsset.key, image);
    await legacy.submission(legacyIds[0], randomUUID(), legacyAsset, { answer: '2023-06-10' });
    const legacyVersion = legacy.state.version;
    const signature = createHmac('sha256', secret)
      .update(legacyIds[0])
      .digest('base64')
      .replace(/=+$/, '');
    const legacyJar = {
      cookie: `pf_session=${encodeURIComponent(`s:${legacyIds[0]}.${signature}`)}`,
    };
    let stop = await server(root, origin);
    async function request<T = PlayerView>(method: string, route: string, jar: Jar, body?: object) {
      const response = await fetch(origin + route, {
        method,
        headers: { Origin: origin, Cookie: jar.cookie, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const cookie = response.headers.get('set-cookie');
      if (cookie) jar.cookie = cookie.split(';')[0];
      return { status: response.status, body: (await response.json()) as T };
    }
    const state = async (code: string, jar: Jar): Promise<PlayerView> => {
      const result = await request('GET', `/api/rooms/${code}/session`, jar);
      assert.equal(result.status, 200);
      return result.body;
    };
    async function connect(code: string | undefined, jar: Jar) {
      const socket = io(origin, {
        autoConnect: false,
        transports: ['websocket'],
        auth: { roomCode: code },
        extraHeaders: { Cookie: jar.cookie, Origin: origin },
        reconnection: false,
      });
      sockets.push(socket);
      await new Promise<void>((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('connect_error', reject);
        socket.connect();
      });
      return socket;
    }
    async function command(
      socket: Socket,
      code: string,
      jar: Jar,
      command: Command,
      override = {},
    ) {
      const v = await state(code, jar);
      return socket
        .timeout(3000)
        .emitWithAck('command', {
          id: randomUUID(),
          version: v.version,
          gameId: v.game?.id,
          phaseKey: v.game?.phaseKey,
          command,
          ...override,
        });
    }
    async function upload(code: string, jar: Jar, actionId: string) {
      const v = await state(code, jar);
      const form = new FormData();
      form.set('actionId', actionId);
      form.set('gameId', v.game!.id);
      form.set('answer', v.game!.mode === 'quiz' ? '2023-06-10' : 'True story');
      form.set('falseStory', 'Invented story');
      form.set('redacted', 'false');
      form.set('file', new Blob([new Uint8Array(image)], { type: 'image/webp' }), 'memory.webp');
      return fetch(`${origin}/api/rooms/${code}/uploads`, {
        method: 'POST',
        headers: { Origin: origin, Cookie: jar.cookie },
        body: form,
      });
    }
    try {
      const jarsA = Array.from({ length: 3 }, () => ({ cookie: '' }));
      const jarsB = [jarsA[0], { cookie: '' }, { cookie: '' }];
      const a = await request<{ code: string; view: PlayerView }>('POST', '/api/rooms', jarsA[0], {
        name: 'A',
      });
      const b = await request<{ code: string; view: PlayerView }>('POST', '/api/rooms', jarsB[0], {
        name: 'A',
      });
      assert.equal(a.status, 201);
      assert.equal(b.status, 201);
      const codeA: string = a.body.code,
        codeB: string = b.body.code;
      assert.match(codeA, /^\d{6}$/);
      assert.notEqual(codeA, codeB);
      assert.equal(a.body.view.me.id, b.body.view.me.id);
      await request('POST', `/api/rooms/${codeA}/session/join`, jarsA[1], { name: 'B' });
      assert.equal((await request('GET', `/api/rooms/${codeB}/session`, jarsA[1])).status, 401);
      await assert.rejects(connect(codeB, jarsA[1]), /Join/);
      const unknown = ['000000', '000001', '000002'].find((c) => c !== codeA && c !== codeB)!;
      assert.equal(
        (await request('POST', `/api/rooms/${unknown}/session/join`, jarsA[1], { name: 'X' }))
          .status,
        404,
      );
      assert.equal((await request('GET', '/api/rooms/not-a-code/session', jarsA[0])).status, 400);
      assert.equal(
        (await request('POST', '/api/session/join', jarsA[1], { name: 'New legacy' })).status,
        401,
      );
      for (let n = 1; n < 3; n++)
        await request('POST', `/api/rooms/${codeB}/session/join`, jarsB[n], {
          name: ['A', 'B', 'C'][n],
        });
      const aSockets = await Promise.all(jarsA.slice(0, 2).map((j) => connect(codeA, j)));
      const bSockets = await Promise.all(jarsB.map((j) => connect(codeB, j)));
      await until(
        async () => (await state(codeB, jarsB[0])).players.filter((p) => p.online).length === 3,
      );
      assert.equal((await command(aSockets[0], codeA, jarsA[0], { type: 'elect' })).ok, false);
      await request('POST', `/api/rooms/${codeA}/session/join`, jarsA[2], { name: 'C' });
      aSockets.push(await connect(codeA, jarsA[2]));
      assert.equal(
        (
          await command(aSockets[0], codeA, jarsA[0], {
            type: 'setHost',
            targetId: a.body.view.me.id,
          })
        ).ok,
        true,
      );
      assert.equal(
        (
          await command(bSockets[0], codeB, jarsB[0], {
            type: 'setHost',
            targetId: b.body.view.me.id,
          })
        ).ok,
        true,
      );
      assert.equal(
        (await command(aSockets[0], codeA, jarsA[0], { type: 'choose', mode: 'quiz' })).ok,
        true,
      );
      assert.equal(
        (await command(bSockets[0], codeB, jarsB[0], { type: 'choose', mode: 'bluff' })).ok,
        true,
      );
      const beforeB = await state(codeB, jarsB[0]);
      const eventsB: PlayerView[] = [];
      bSockets[0].on('state', (v) => eventsB.push(v));
      assert.equal(
        (
          await command(
            aSockets[0],
            codeA,
            jarsA[0],
            { type: 'start' },
            { gameId: beforeB.game!.id },
          )
        ).ok,
        false,
      );
      const action = randomUUID();
      assert.equal((await upload(codeA, jarsA[0], action)).status, 200);
      assert.equal((await state(codeB, jarsB[0])).version, beforeB.version);
      assert.equal(eventsB.length, 0);
      assert.equal(
        (await upload(codeB, jarsB[0], action)).status,
        200,
        'same action ID is independent in another room',
      );
      const assetA = (await state(codeA, jarsA[0])).game!.ownSubmission!.assetId;
      const assetB = (await state(codeB, jarsB[0])).game!.ownSubmission!.assetId;
      assert.notEqual(assetA, assetB);
      const getMedia = (code: string, asset: string, jar: Jar) =>
        fetch(`${origin}/api/rooms/${code}/media/${asset}`, { headers: { Cookie: jar.cookie } });
      assert.equal((await getMedia(codeA, assetA, jarsA[0])).status, 200);
      assert.equal((await getMedia(codeB, assetA, jarsB[0])).status, 400);
      assert.equal((await getMedia(codeB, assetB, jarsA[1])).status, 401);
      const duplicate = await connect(codeA, jarsA[1]);
      assert.equal((await state(codeA, jarsA[0])).players.filter((p) => p.online).length, 3);
      aSockets[1].disconnect();
      await until(
        async () => (await state(codeA, jarsA[0])).players.filter((p) => p.online).length === 3,
      );
      duplicate.disconnect();
      await until(
        async () => (await state(codeA, jarsA[0])).players.filter((p) => p.online).length === 2,
      );
      assert.equal((await state(codeB, jarsB[0])).players.filter((p) => p.online).length, 3);
      const old = await request('GET', '/api/session', legacyJar);
      assert.equal(old.status, 200);
      assert.equal(old.body.version, legacyVersion);
      assert.equal(
        (
          await fetch(`${origin}/api/media/${legacyAsset.id}`, {
            headers: { Cookie: legacyJar.cookie },
          })
        ).status,
        200,
      );
      sockets.forEach((s) => s.disconnect());
      await stop();
      stop = await server(root, origin);
      assert.equal((await state(codeA, jarsA[0])).game?.ownSubmission?.assetId, assetA);
      assert.equal((await state(codeB, jarsB[0])).game?.mode, 'bluff');
      assert.equal((await getMedia(codeA, assetA, jarsA[0])).status, 200);
      assert.equal((await request('GET', '/api/session', legacyJar)).body.version, legacyVersion);
    } finally {
      sockets.forEach((s) => s.disconnect());
      await stop();
      await rm(root, { recursive: true, force: true });
    }
  },
);
