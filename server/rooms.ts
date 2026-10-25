import { createHash, randomInt } from 'node:crypto';
import { addPlayer, freshSession, GameError } from './engine.js';
import { createRepository, type Repository } from './repository.js';
import { GameService } from './service.js';
import type { PlayerView } from '../shared/types.js';

export const ROOM_IDLE_MS = 15 * 60_000;
export class RoomError extends GameError {
  constructor(
    message: string,
    code: string,
    public status: number,
  ) {
    super(message, code);
  }
}
export function validateRoomCode(code: unknown): asserts code is string {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code))
    throw new RoomError('Enter a six-digit room code.', 'INVALID_ROOM', 400);
}
export function roomNamespace(base: string, code?: string) {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(base)) throw new Error('Invalid session namespace.');
  if (code === undefined) return base;
  validateRoomCode(code);
  return `rooms_${createHash('sha256').update(base).digest('hex').slice(0, 24)}_${code}`;
}
export interface Room {
  code?: string;
  namespace: string;
  service: GameService;
  connections: number;
  pending: number;
  lastUsed: number;
  ticking?: boolean;
}
export function roomView(room: Room, id: string): PlayerView {
  return { ...room.service.view(id), ...(room.code ? { room: { code: room.code } } : {}) };
}
export class RoomManager {
  private rooms = new Map<string, Promise<Room>>();
  private initialized = new Map<string, Room>();
  changed: (room: Room) => void = () => {};
  constructor(
    private base = process.env.SESSION_NAMESPACE || 'local',
    private repositoryFor: (namespace: string) => Repository = createRepository,
    private codeFor = () => String(randomInt(1_000_000)).padStart(6, '0'),
    private now = Date.now,
  ) {
    roomNamespace(base);
  }
  private async initialize(code?: string): Promise<Room> {
    const namespace = roomNamespace(this.base, code);
    const repository = this.repositoryFor(namespace);
    if (code !== undefined && !(await repository.loadExisting()))
      throw new RoomError(
        'That room was not found. Check the code with your friends.',
        'ROOM_NOT_FOUND',
        404,
      );
    const service = new GameService(repository, this.now);
    await service.init();
    const room: Room = {
      code,
      namespace,
      service,
      connections: 0,
      pending: 0,
      lastUsed: this.now(),
    };
    service.changed = () => this.changed(room);
    await service.expireRounds();
    return room;
  }
  async get(code?: string): Promise<Room> {
    if (code !== undefined) validateRoomCode(code);
    const key = code ?? 'legacy';
    let loading = this.rooms.get(key);
    if (!loading) {
      loading = this.initialize(code);
      this.rooms.set(key, loading);
      loading.then(
        (room) => {
          if (this.rooms.get(key) === loading) this.initialized.set(key, room);
        },
        () => {},
      );
      loading.catch(() => {
        if (this.rooms.get(key) === loading) this.rooms.delete(key);
      });
    }
    return loading;
  }
  retain(room: Room) {
    room.pending++;
    room.lastUsed = this.now();
    return () => {
      room.pending--;
      room.lastUsed = this.now();
    };
  }
  async use<T>(code: string | undefined, action: (room: Room) => Promise<T> | T): Promise<T> {
    const room = await this.get(code);
    const release = this.retain(room);
    try {
      await room.service.refresh();
      return await action(room);
    } finally {
      release();
    }
  }
  async create(name: string, playerId: string): Promise<Room> {
    const state = freshSession();
    addPlayer(state, name, playerId);
    state.version = 1;
    for (let attempt = 0; attempt < 20; attempt++) {
      const code = this.codeFor();
      validateRoomCode(code);
      const namespace = roomNamespace(this.base, code);
      const repository = this.repositoryFor(namespace);
      if (!(await repository.create(state))) continue;
      // A guessed code may already be loading; get() still supplies one authority.
      const prior = this.rooms.get(code);
      if (prior) {
        try {
          await prior;
        } catch {
          /* retry the now-reserved room */
        }
      }
      return this.get(code);
    }
    throw new RoomError('Could not allocate a room code. Try again.', 'ROOM_CAPACITY', 503);
  }
  async tick() {
    const results = await Promise.allSettled(
      [...this.initialized.entries()].map(async ([key, room]) => {
        if (room.ticking) return;
        if (!room.connections && !room.pending && this.now() - room.lastUsed >= ROOM_IDLE_MS) {
          this.rooms.delete(key);
          this.initialized.delete(key);
          return;
        }
        room.ticking = true;
        room.pending++;
        try {
          await room.service.expireRounds();
        } finally {
          room.pending--;
          room.ticking = false;
        }
      }),
    );
    const failure = results.find((result) => result.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
  }
}
