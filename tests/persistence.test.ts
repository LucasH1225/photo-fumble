import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { LocalRepository } from '../server/repository.js';
import { GameService } from '../server/service.js';
import { phaseKey } from '../server/engine.js';
import type { Command, Session } from '../shared/types.js';
import type { CommitAction } from '../server/repository.js';

test('saved session survives repository/server recreation, retries do not reroll, stale phases fail', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'photo-fumble-test-'));
  try {
    const service = new GameService(new LocalRepository(root, 'test'));
    await service.init();
    const ids = await Promise.all(['A', 'B', 'C', 'D'].map((name) => service.join(name)));
    ids.forEach((id) => service.online.add(id));
    const command = {
      id: randomUUID(),
      version: service.state.version,
      command: { type: 'elect' as const },
    };
    await service.command(ids[0], command);
    const host = service.state.hostId!;
    const version = service.state.version;
    const recovered = new GameService(new LocalRepository(root, 'test'));
    await recovered.init();
    ids.forEach((id) => recovered.online.add(id));
    const receipt = await recovered.command(ids[0], command);
    assert.equal(receipt.version, version);
    assert.equal(recovered.state.version, version);
    assert.equal(recovered.state.hostId, host);
    await recovered.command(host, {
      id: randomUUID(),
      version,
      command: { type: 'choose', mode: 'quiz' },
    });
    await assert.rejects(
      () => recovered.command(host, { id: randomUUID(), version, command: { type: 'cancel' } }),
      /game has changed/i,
    );
    await recovered.command(host, {
      id: randomUUID(),
      version,
      gameId: recovered.state.game!.id,
      phaseKey: phaseKey(recovered.state.game!),
      command: { type: 'cancel' },
    });
    assert.equal(recovered.state.game, undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('an uncertain commit recovers before retry even if its first recovery read fails', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'photo-fumble-uncertain-'));
  class UncertainRepository extends LocalRepository {
    loseResponse = false;
    failRead = false;
    override async commit(version: number, state: Session, action: CommitAction) {
      await super.commit(version, state, action);
      if (this.loseResponse) {
        this.loseResponse = false;
        this.failRead = true;
        throw new Error('Response lost after durable write');
      }
    }
    override async load() {
      if (this.failRead) {
        this.failRead = false;
        throw new Error('Temporary read failure');
      }
      return super.load();
    }
  }
  try {
    const repository = new UncertainRepository(root, 'test');
    const service = new GameService(repository);
    await service.init();
    const ids = await Promise.all(['A', 'B', 'C', 'D'].map((name) => service.join(name)));
    ids.forEach((id) => service.online.add(id));
    const command = {
      id: randomUUID(),
      version: service.state.version,
      command: { type: 'elect' as const },
    };
    repository.loseResponse = true;
    await assert.rejects(() => service.command(ids[0], command), /Response lost/);
    assert.equal(service.state.hostId, undefined);
    await service.command(ids[0], command);
    assert.ok(service.state.hostId);
    assert.equal(service.state.version, command.version + 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('mid-game recovery retains scores, order, roles, media, and an already saved guess', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'photo-fumble-game-recovery-'));
  try {
    const repository = new LocalRepository(root, 'test');
    const service = new GameService(repository);
    await service.init();
    const ids = await Promise.all(['A', 'B', 'C', 'D'].map((name) => service.join(name)));
    ids.forEach((id) => service.online.add(id));
    const envelope = (command: Command) => ({
      id: randomUUID(),
      version: service.state.version,
      gameId: service.state.game?.id,
      phaseKey: service.state.game ? phaseKey(service.state.game) : undefined,
      command,
    });
    await service.command(ids[0], envelope({ type: 'elect' }));
    const host = service.state.hostId!;
    await service.command(host, envelope({ type: 'choose', mode: 'quiz' }));
    for (const id of ids) {
      await repository.put(`${id}.webp`, Buffer.from('test media'));
      await service.submission(
        id,
        randomUUID(),
        {
          id: `asset-${id}`,
          ownerId: id,
          gameId: service.state.game!.id,
          key: `${id}.webp`,
          mime: 'image/webp',
        },
        { answer: '2023-06-10' },
      );
    }
    await service.command(host, envelope({ type: 'start' }));
    await service.command(host, envelope({ type: 'open' }));
    const owner = service.state.game!.order[0];
    for (const id of ids.filter((id) => id !== owner))
      await service.command(id, envelope({ type: 'guess', value: '2023-06-10' }));
    await service.command(host, envelope({ type: 'next' }));
    await service.command(host, envelope({ type: 'open' }));
    const guesser = ids.find((id) => id !== service.state.game!.order[1])!;
    const guess = envelope({ type: 'guess', value: '2023-06-11' });
    await service.command(guesser, guess);
    const snapshot = structuredClone(service.state);
    const recovered = new GameService(new LocalRepository(root, 'test'));
    await recovered.init();
    ids.forEach((id) => recovered.online.add(id));
    assert.deepEqual(recovered.state, snapshot);
    await recovered.command(guesser, guess);
    assert.equal(recovered.state.version, snapshot.version);
    assert.equal(recovered.view(guesser).game?.ownGuess, '2023-06-11');
    assert.ok(Object.values(recovered.state.game!.scores).some((score) => score > 0));
    assert.deepEqual(await recovered.repository.get(`${ids[0]}.webp`), Buffer.from('test media'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
