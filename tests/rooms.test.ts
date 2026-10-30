import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { LocalRepository } from '../server/repository.js';
import { RoomManager, ROOM_IDLE_MS, roomNamespace, roomView } from '../server/rooms.js';
import { freshSession, phaseKey } from '../server/engine.js';
import type { Command } from '../shared/types.js';

test('room allocation is exclusive, retries collisions, retains leading zeroes, and never overwrites', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'pf-rooms-'));
  try {
    const codes = ['001234', '001234', '005678'];
    const manager = new RoomManager(
      'test',
      (ns) => new LocalRepository(root, ns),
      () => codes.shift()!,
    );
    const id = randomUUID();
    const first = await manager.create('Same nickname', id);
    const next = await manager.create('Same nickname', id);
    assert.equal(first.code, '001234');
    assert.equal(next.code, '005678');
    assert.notEqual(first.service, next.service);
    const concurrent = await Promise.all(
      Array.from({ length: 8 }, () =>
        new LocalRepository(root, 'exclusive').create(freshSession()),
      ),
    );
    assert.equal(concurrent.filter(Boolean).length, 1);
    assert.equal(first.service.state.players[id].name, 'Same nickname');
    assert.equal(roomView(first, id).room?.code, first.code);
    assert.ok(roomNamespace('a'.repeat(64), '001234').length <= 64);
    assert.notEqual(roomNamespace('deploymentA', '001234'), roomNamespace('deploymentB', '001234'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('unknown rooms do not create storage; simultaneous loads share one service and failures can retry', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'pf-rooms-'));
  try {
    const manager = new RoomManager(
      'test',
      (ns) => new LocalRepository(root, ns),
      () => '123456',
    );
    await assert.rejects(manager.get('bad'), /six-digit/);
    await assert.rejects(manager.get('999999'), /not found/);
    assert.deepEqual(await readdir(root), []);
    const room = await manager.create('A', randomUUID());
    assert.ok(
      (await Promise.all(Array.from({ length: 8 }, () => manager.get(room.code)))).every(
        (r) => r === room,
      ),
    );
    let fail = true;
    class FailingRepository extends LocalRepository {
      override async loadExisting() {
        if (fail) throw new Error('Storage unavailable');
        return super.loadExisting();
      }
    }
    const recovered = new RoomManager('test', (ns) => new FailingRepository(root, ns));
    await assert.rejects(recovered.get(room.code), /Storage unavailable/);
    fail = false;
    assert.equal((await recovered.get(room.code)).service.state.version, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rooms persist independently, scope duplicate receipts, require their own three players, and reload after eviction', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'pf-rooms-'));
  try {
    let now = 1000;
    const codes = ['123456', '654321'];
    const repository = (ns: string) => new LocalRepository(root, ns);
    const manager = new RoomManager(
      'test',
      repository,
      () => codes.shift()!,
      () => now,
    );
    const owner = randomUUID();
    const a = await manager.create('A', owner);
    const b = await manager.create('A', owner);
    const secondA = await a.service.join('B');
    const thirdA = await a.service.join('C');
    const secondB = await b.service.join('B');
    const thirdB = await b.service.join('C');
    a.service.online = new Set([owner, secondA]);
    b.service.online = new Set([owner, secondB, thirdB]);
    const command = (room: typeof a, type: Command, id = randomUUID()) => ({
      id,
      version: room.service.state.version,
      gameId: room.service.state.game?.id,
      phaseKey: room.service.state.game ? phaseKey(room.service.state.game) : undefined,
      command: type,
    });
    await assert.rejects(a.service.command(owner, command(a, { type: 'elect' })), /three|3/i);
    a.service.online.add(thirdA);
    const actionId = randomUUID();
    await a.service.command(owner, command(a, { type: 'setHost', targetId: owner }, actionId));
    await b.service.command(owner, command(b, { type: 'setHost', targetId: secondB }, actionId));
    assert.equal(a.service.state.hostId, owner);
    assert.equal(b.service.state.hostId, secondB);
    await a.service.command(owner, command(a, { type: 'choose', mode: 'quiz' }));
    await b.service.command(secondB, command(b, { type: 'choose', mode: 'impostor' }));
    const versions = [a.service.state.version, b.service.state.version];
    const release = manager.retain(a);
    now += ROOM_IDLE_MS + 1;
    await manager.tick();
    assert.equal(await manager.get(a.code), a, 'pending operations prevent eviction');
    release();
    const reloadedB = await manager.get(b.code);
    assert.notEqual(reloadedB, b);
    assert.equal(reloadedB.service.state.game?.mode, 'impostor');
    assert.equal(reloadedB.service.state.version, versions[1]);
    const restarted = new RoomManager('test', repository);
    const restored = await restarted.get(a.code);
    assert.equal(restored.service.state.game?.mode, 'quiz');
    assert.equal(restored.service.state.version, versions[0]);
    assert.equal(restored.service.online.size, 0);
    a.connections = 1;
    now += ROOM_IDLE_MS + 1;
    await manager.tick();
    assert.equal(await manager.get(a.code), a, 'connected rooms are retained');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a slow room clock does not prevent other rooms from ticking again', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'pf-room-clocks-'));
  let unblock!: () => void;
  const blocked = new Promise<void>((resolve) => {
    unblock = resolve;
  });
  try {
    const codes = ['111111', '222222'];
    const manager = new RoomManager(
      'test',
      (ns) => new LocalRepository(root, ns),
      () => codes.shift()!,
    );
    const a = await manager.create('A', randomUUID());
    const b = await manager.create('B', randomUUID());
    let ticks = 0;
    a.service.expireRounds = async () => blocked;
    b.service.expireRounds = async () => {
      ticks++;
    };
    const first = manager.tick();
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(ticks, 1);
    await manager.tick();
    assert.equal(ticks, 2);
    unblock();
    await first;
  } finally {
    unblock();
    await rm(root, { recursive: true, force: true });
  }
});
