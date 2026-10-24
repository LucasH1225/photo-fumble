import { randomUUID } from 'node:crypto';
import type { Envelope, Receipt, Session, Asset } from '../shared/types.js';
import {
  addPlayer,
  applyCommand,
  phaseKey,
  requireRule,
  saveSubmission,
  viewFor,
} from './engine.js';
import type { Repository } from './repository.js';

export class GameService {
  state!: Session;
  online = new Set<string>();
  private queue: Promise<unknown> = Promise.resolve();
  private needsReload = false;
  changed: () => void = () => {};
  constructor(public repository: Repository) {}
  async init() {
    this.state = await this.repository.load();
  }
  async refresh() {
    await this.serialize(() => this.recoverIfNeeded());
  }
  async recoverIfNeeded() {
    if (this.needsReload) {
      this.state = await this.repository.load();
      this.needsReload = false;
      this.changed();
    }
  }
  private serialize<T>(work: () => Promise<T>): Promise<T> {
    const next = this.queue.then(work);
    this.queue = next.catch(() => {});
    return next;
  }
  async mutate(
    playerId: string,
    actionId: string,
    change: (draft: Session) => void,
  ): Promise<Receipt> {
    return this.serialize(async () => {
      await this.recoverIfNeeded();
      const prior = await this.repository.receipt(actionId, playerId);
      if (prior) return prior;
      const draft = structuredClone(this.state);
      change(draft);
      draft.version++;
      const receipt = { ok: true, version: draft.version };
      try {
        await this.repository.commit(this.state.version, draft, {
          id: actionId,
          playerId,
          receipt,
        });
      } catch (error) {
        this.needsReload = true;
        await this.recoverIfNeeded().catch(() => {});
        throw error;
      }
      this.state = draft;
      this.changed();
      return receipt;
    });
  }
  async join(name: string, id: string = randomUUID()) {
    await this.mutate(id, randomUUID(), (draft) => {
      addPlayer(draft, name, id);
    });
    return id;
  }
  async command(playerId: string, envelope: Envelope) {
    return this.mutate(playerId, envelope.id, (draft) => {
      requireRule(
        Number.isInteger(envelope.version) && envelope.version <= draft.version,
        'Refresh the game and retry.',
      );
      if (envelope.command.type !== 'elect') {
        requireRule(envelope.gameId === draft.game?.id, 'The game has changed.');
        requireRule(
          envelope.phaseKey === (draft.game ? phaseKey(draft.game) : undefined),
          'That stage has ended.',
        );
      }
      applyCommand(draft, playerId, envelope.command, this.online);
    });
  }
  async submission(
    playerId: string,
    actionId: string,
    asset: Asset,
    fields: Parameters<typeof saveSubmission>[3],
  ) {
    return this.mutate(playerId, actionId, (draft) =>
      saveSubmission(draft, playerId, asset, fields),
    );
  }
  view(id: string) {
    return viewFor(this.state, id, this.online);
  }
}
