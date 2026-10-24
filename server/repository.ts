import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { freshSession, GameError } from './engine.js';
import type { Receipt, Session } from '../shared/types.js';

export interface CommitAction {
  id: string;
  playerId: string;
  receipt: Receipt;
}
export interface Repository {
  load(): Promise<Session>;
  receipt(id: string, playerId: string): Promise<Receipt | undefined>;
  commit(expectedVersion: number, state: Session, action: CommitAction): Promise<void>;
  put(key: string, data: Buffer, mime: string): Promise<void>;
  get(key: string): Promise<Buffer | string>;
  remove(keys: string[]): Promise<void>;
}
interface LocalData {
  state: Session;
  receipts: Record<string, Receipt>;
}
export class LocalRepository implements Repository {
  private data: LocalData = { state: freshSession(), receipts: {} };
  constructor(
    private root: string,
    private namespace: string,
  ) {}
  private get directory() {
    return path.resolve(this.root, this.namespace);
  }
  async load() {
    await mkdir(this.directory, { recursive: true });
    try {
      this.data = JSON.parse(await readFile(path.join(this.directory, 'session.json'), 'utf8'));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
    return structuredClone(this.data.state);
  }
  async receipt(id: string, playerId: string) {
    return this.data.receipts[`${playerId}:${id}`];
  }
  async commit(expectedVersion: number, state: Session, action: CommitAction) {
    if (this.data.state.version !== expectedVersion)
      throw new GameError('State changed. Reconnect and retry.', 'CONFLICT');
    const next: LocalData = {
      state,
      receipts: { ...this.data.receipts, [`${action.playerId}:${action.id}`]: action.receipt },
    };
    const temp = path.join(this.directory, 'session.tmp');
    await writeFile(temp, JSON.stringify(next), { mode: 0o600 });
    await rename(temp, path.join(this.directory, 'session.json'));
    this.data = structuredClone(next);
  }
  private file(key: string) {
    if (!/^[a-zA-Z0-9_/-]+\.[a-z0-9]+$/.test(key) || key.includes('..'))
      throw new Error('Invalid storage key');
    return path.join(this.directory, 'media', key);
  }
  async put(key: string, data: Buffer) {
    const file = this.file(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data, { mode: 0o600 });
  }
  async get(key: string) {
    return readFile(this.file(key));
  }
  async remove(keys: string[]) {
    await Promise.all(
      keys.map((key) =>
        unlink(this.file(key)).catch((e) => {
          if (e.code !== 'ENOENT') throw e;
        }),
      ),
    );
  }
}
export class SupabaseRepository implements Repository {
  private client: SupabaseClient;
  constructor(
    url: string,
    secret: string,
    private bucket: string,
    private namespace: string,
  ) {
    this.client = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  async load(): Promise<Session> {
    const { data, error } = await this.client
      .from('pf_sessions')
      .select('state')
      .eq('namespace', this.namespace)
      .maybeSingle();
    if (error) throw error;
    return data?.state ?? freshSession();
  }
  async receipt(id: string, playerId: string): Promise<Receipt | undefined> {
    const { data, error } = await this.client
      .from('pf_receipts')
      .select('receipt')
      .eq('namespace', this.namespace)
      .eq('player_id', playerId)
      .eq('action_id', id)
      .maybeSingle();
    if (error) throw error;
    return data?.receipt;
  }
  async commit(expectedVersion: number, state: Session, action: CommitAction) {
    const { error } = await this.client.rpc('pf_commit', {
      p_namespace: this.namespace,
      p_expected: expectedVersion,
      p_state: state,
      p_action_id: action.id,
      p_player_id: action.playerId,
      p_receipt: action.receipt,
    });
    if (error) {
      if (error.message.includes('VERSION_CONFLICT'))
        throw new GameError('State changed. Reconnect and retry.', 'CONFLICT');
      throw error;
    }
  }
  async put(key: string, data: Buffer, mime: string) {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, data, { contentType: mime, upsert: false });
    if (error) throw error;
  }
  async get(key: string): Promise<string> {
    const { data, error } = await this.client.storage.from(this.bucket).createSignedUrl(key, 300);
    if (error) throw error;
    return data.signedUrl;
  }
  async remove(keys: string[]) {
    const { error } = await this.client.storage.from(this.bucket).remove(keys);
    if (error) throw error;
  }
}
export function createRepository(): Repository {
  const namespace = process.env.SESSION_NAMESPACE || 'local';
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(namespace))
    throw new Error('SESSION_NAMESPACE must use letters, numbers, hyphens, or underscores.');
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (Boolean(url) !== Boolean(secret))
    throw new Error('Set both SUPABASE_URL and SUPABASE_SECRET_KEY.');
  if (url && secret)
    return new SupabaseRepository(
      url,
      secret,
      process.env.SUPABASE_STORAGE_BUCKET || 'photo-fumble-media',
      namespace,
    );
  if (process.env.NODE_ENV === 'production')
    throw new Error('Production requires Supabase. Local disk is not durable on Render.');
  return new LocalRepository(process.env.LOCAL_DATA_DIR || '.data', namespace);
}
