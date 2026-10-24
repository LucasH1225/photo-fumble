import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { createRoot } from 'react-dom/client';
import { io, type Socket } from 'socket.io-client';
import {
  MODE_INFO,
  MODES,
  type Command,
  type Envelope,
  type PlayerView,
  type Receipt,
  type Mode,
} from '../shared/types';
import './style.css';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin', ...init });
  const body = await response.json();
  if (!response.ok || body.ok === false)
    throw new Error(body.error || 'Could not save. Please try again.');
  return body;
}
type Send = (command: Command) => Promise<void>;
type ViewGame = NonNullable<PlayerView['game']>;
const nameOf = (view: PlayerView, id?: string) =>
  view.players.find((p) => p.id === id)?.name ?? 'A friend';
function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span className={`avatar${small ? ' small' : ''}`} aria-hidden="true">
      {name.slice(0, 2)}
    </span>
  );
}
function Button({
  children,
  secondary = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return (
    <button className={secondary ? 'button secondary' : 'button'} {...props}>
      {children}
    </button>
  );
}
function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

function App() {
  const [view, setView] = useState<PlayerView>();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const socket = useRef<Socket | undefined>(undefined);
  const latest = useRef(view);
  latest.current = view;
  useEffect(() => {
    let cancelled = false;
    fetch('/api/session')
      .then(async (r) => {
        if (r.status === 401) return;
        if (!r.ok) throw new Error('The game server is unavailable. Try refreshing.');
        const state = await r.json();
        if (!cancelled) setView(state);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const me = view?.me.id;
  useEffect(() => {
    if (!me) return;
    const client = io({ reconnection: true });
    socket.current = client;
    client.on('connect', () => {
      setConnected(true);
      setError((message) => (message.startsWith('Reconnecting to your game.') ? '' : message));
    });
    client.on('disconnect', () => setConnected(false));
    client.on('connect_error', () => {
      setConnected(false);
      setError('Reconnecting to your game. If it was reset, refresh to join again.');
    });
    client.on('state', (state: PlayerView) => {
      setView(state);
    });
    return () => {
      client.disconnect();
      socket.current = undefined;
    };
  }, [me]);
  const send: Send = useCallback(async (command) => {
    const state = latest.current;
    const client = socket.current;
    if (!client?.connected || !state) {
      setError('Wait for the game to reconnect.');
      return;
    }
    const envelope: Envelope = {
      id: crypto.randomUUID(),
      version: state.version,
      gameId: state.game?.id,
      phaseKey: state.game?.phaseKey,
      command,
    };
    if (command.type !== 'loaded') {
      setBusy(true);
      setError('');
    }
    try {
      let receipt: Receipt | undefined;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          receipt = await client.timeout(10_000).emitWithAck('command', envelope);
          break;
        } catch (e) {
          if (attempt === 1) throw e;
        }
      }
      if (!receipt?.ok) throw new Error(receipt?.error || 'Could not save this action.');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Connection interrupted. Reconnect to see whether your action saved.',
      );
    } finally {
      if (command.type !== 'loaded') setBusy(false);
    }
  }, []);
  const phase = view?.game?.phaseKey ?? (view?.hostId ? 'lobby' : 'join');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [phase]);
  if (loading)
    return (
      <main className="boot">
        <span className="brand">
          Photo Fumble<span>✳</span>
        </span>
        <p>Finding your friends…</p>
      </main>
    );
  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Photo Fumble home">
          Photo Fumble<span>✳</span>
        </a>
        <div className="session-meta">
          {view ? (
            <>
              <span className={`connection ${connected ? 'online' : ''}`}>
                {connected ? 'Connected' : 'Reconnecting'}
              </span>
              <span>
                {view.me.name}
                {view.hostId === view.me.id ? ' · Host' : ''}
              </span>
            </>
          ) : (
            <span>A party game for your people</span>
          )}
        </div>
      </header>
      {error ? (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Dismiss error">
            ×
          </button>
        </div>
      ) : null}
      {view ? (
        <div className="sr-only" role="status" aria-live="polite">
          {connected ? 'Connected.' : 'Reconnecting.'}{' '}
          {view.game
            ? `${MODE_INFO[view.game.mode].name}. ${phaseTitle(view.game)} ${view.game.phase === 'prepare' ? `${view.game.ready.length} ready.` : `${view.game.submitted} responses locked.`}`
            : 'Waiting in the shared lobby.'}
        </div>
      ) : null}
      {!view ? (
        <Join onJoin={setView} onError={setError} />
      ) : (
        <main className="app-main">
          <div className="page-heading">
            <div>
              <p className="step-note">
                {view.game
                  ? `${MODE_INFO[view.game.mode].name}${view.game.phase === 'prepare' ? ' · Get ready' : view.game.phase === 'results' ? ' · Final ranking' : ` · Item ${view.game.item} of ${view.game.total}`}`
                  : 'The gathering place'}
              </p>
              <h1 tabIndex={-1} ref={heading}>
                {view.waiting
                  ? 'You’re in for the next one.'
                  : view.game
                    ? phaseTitle(view.game)
                    : view.hostId
                      ? 'What are we playing?'
                      : 'Get the group together.'}
              </h1>
            </div>
            <span className="friend-count">
              {view.players.filter((p) => p.online).length} friends here
            </span>
          </div>
          {!connected ? (
            <p className="notice" role="status">
              Reconnecting… Your saved place is safe. Actions will resume when you’re connected.
            </p>
          ) : null}
          {view.hostId && !view.players.find((p) => p.id === view.hostId)?.online ? (
            <p className="notice">Waiting for host {nameOf(view, view.hostId)} to reconnect.</p>
          ) : null}
          <div className="layout">
            <div className="main-column">
              {view.waiting ? (
                <Panel>
                  <div className="waiting-symbol">✳</div>
                  <h2>We saved you a place.</h2>
                  <p>
                    Your friends are playing {MODE_INFO[view.game!.mode].name}. You’ll join when the
                    host starts the next game.
                  </p>
                </Panel>
              ) : !view.hostId ? (
                <Panel>
                  <h2>One link. All your friends.</h2>
                  <p>
                    Gather at least four people, each on their own device. Then we’ll pick a host at
                    random. The host plays too.
                  </p>
                  <Button
                    disabled={!connected || busy || view.players.filter((p) => p.online).length < 4}
                    onClick={() => void send({ type: 'elect' })}
                  >
                    Everyone’s here · pick a host
                  </Button>
                  <p className="support">
                    Friends can play together or from anywhere. No room code needed.
                  </p>
                </Panel>
              ) : !view.game ? (
                <ModePicker view={view} send={send} disabled={!connected || busy} />
              ) : view.game.phase === 'prepare' ? (
                <Prepare key={view.game.id} view={view} onError={setError} disabled={!connected} />
              ) : view.game.phase === 'results' ? (
                <>
                  <Results view={view} />
                  <ModePicker view={view} send={send} disabled={!connected || busy} />
                </>
              ) : (
                <Play
                  key={`${view.game.id}:${view.game.item}`}
                  view={view}
                  send={send}
                  disabled={!connected || busy}
                />
              )}
            </div>
            <Roster view={view} send={send} disabled={!connected || busy} />
          </div>
        </main>
      )}
      <footer className="footer">
        <span>Good friends. Questionable memories.</span>
        <span>Five ways to remember differently.</span>
      </footer>
    </>
  );
}
function phaseTitle(g: ViewGame) {
  if (g.phase === 'prepare') return 'Bring one good memory.';
  if (g.phase === 'results') return 'That’s one for the album.';
  if (g.phase === 'reveal') return 'Here’s what really happened.';
  if (g.phase === 'judge') return 'Close enough to count?';
  if (g.phase === 'vote') return 'Who’s seeing a different picture?';
  if (g.phase === 'preview') return 'Take a good look.';
  return MODE_INFO[g.mode].task;
}
function Join({
  onJoin,
  onError,
}: {
  onJoin: (view: PlayerView) => void;
  onError: (error: string) => void;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      onJoin(
        await api<PlayerView>('/api/session/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        }),
      );
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="join-layout">
      <section className="join-intro">
        <span className="little-photo" aria-hidden="true">
          ✳
        </span>
        <h1>
          You had
          <br />
          to be there.
        </h1>
        <p>
          Or at least remember it differently.
          <br />
          Bring your photos, voice notes, and forgotten chats. We’ll bring the questions.
        </p>
        <div className="mode-ribbon">
          {MODES.map((m) => (
            <span key={m}>
              {MODE_INFO[m].icon} {MODE_INFO[m].name}
            </span>
          ))}
        </div>
      </section>
      <Panel className="join-panel">
        <span className="paper-mark" aria-hidden="true">
          ↳
        </span>
        <h2>Find your people.</h2>
        <p>One website, one shared game. Join with a nickname your friends will recognize.</p>
        <form onSubmit={submit}>
          <label htmlFor="nickname">Your nickname</label>
          <input
            id="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="What do your friends call you?"
            autoComplete="nickname"
            required
          />
          <Button disabled={busy}>{busy ? 'Joining…' : 'Join friends'}</Button>
        </form>
        <p className="support">
          You’ll need at least four players. Everyone joins on their own phone or computer.
        </p>
      </Panel>
    </main>
  );
}
function ModePicker({ view, send, disabled }: { view: PlayerView; send: Send; disabled: boolean }) {
  const isHost = view.hostId === view.me.id;
  const enough = view.players.filter((p) => p.online).length >= 4;
  return (
    <section className="mode-picker">
      <p>
        {isHost
          ? 'Choose a game. Everyone brings one item after you choose.'
          : `${nameOf(view, view.hostId)} is choosing your next game.`}
      </p>
      <div className="mode-grid">
        {MODES.map((mode) => (
          <button
            className={`mode-card mode-${mode}`}
            key={mode}
            disabled={!isHost || disabled || !enough}
            onClick={() => void send({ type: 'choose', mode })}
          >
            <span className="mode-symbol" aria-hidden="true">
              {MODE_INFO[mode].icon}
            </span>
            <span>
              <strong>{MODE_INFO[mode].name}</strong>
              <span>{MODE_INFO[mode].description}</span>
              <small>One {MODE_INFO[mode].upload} each</small>
            </span>
          </button>
        ))}
      </div>
      {isHost && !enough ? (
        <p className="notice">At least four connected players are needed to start another game.</p>
      ) : null}
    </section>
  );
}
function Roster({ view, send, disabled }: { view: PlayerView; send: Send; disabled: boolean }) {
  const g = view.game;
  const isHost = view.hostId === view.me.id;
  return (
    <aside className="roster">
      <h2>The whole crew</h2>
      <ul>
        {view.players.map((p) => (
          <li key={p.id}>
            <Avatar name={p.name} />
            <div>
              <strong>
                {p.name}
                {p.id === view.me.id ? ' (you)' : ''}
              </strong>
              <small>
                {p.id === view.hostId
                  ? 'Host'
                  : !p.online
                    ? 'Offline'
                    : g && !g.roster.includes(p.id) && g.phase !== 'results'
                      ? 'Next game'
                      : g?.phase === 'prepare'
                        ? g.ready.includes(p.id)
                          ? 'Ready ✓'
                          : 'Preparing'
                        : 'Here'}
              </small>
            </div>
            {g && !view.waiting && g.phase !== 'prepare' && g.roster.includes(p.id) ? (
              <b className="points">{g.scores[p.id] ?? 0}</b>
            ) : (
              <span
                className={`presence ${p.online ? 'here' : ''}`}
                aria-label={p.online ? 'Online' : 'Offline'}
              />
            )}
          </li>
        ))}
      </ul>
      {g?.phase === 'prepare' && isHost ? (
        <div className="host-actions">
          <p>
            {g.ready.length} of {g.roster.length} ready
          </p>
          <Button
            disabled={disabled || g.ready.length !== g.roster.length}
            onClick={() => void send({ type: 'start' })}
          >
            Start playing
          </Button>
          <Button
            secondary
            disabled={disabled}
            onClick={() => {
              if (confirm('Return everyone to mode selection? Stored uploads will stay saved.'))
                void send({ type: 'cancel' });
            }}
          >
            Cancel preparation
          </Button>
        </div>
      ) : null}
      <p className="support">
        {view.hostId
          ? `${nameOf(view, view.hostId)} controls the flow. Scores belong to this game only.`
          : 'Your host will be picked at random and stay with you.'}
      </p>
    </aside>
  );
}
interface Mask {
  x: number;
  y: number;
  width: number;
  height: number;
}
function MaskEditor({
  src,
  masks,
  onChange,
}: {
  src: string;
  masks: Mask[];
  onChange: (masks: Mask[]) => void;
}) {
  const [start, setStart] = useState<{ x: number; y: number }>();
  const [draft, setDraft] = useState<Mask>();
  function point(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  }
  return (
    <div>
      <p className="support">
        Drag over names and avatars to hide them. Dark covers become part of the shared image.
      </p>
      <div
        className="mask-editor"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setStart(point(e));
        }}
        onPointerMove={(e) => {
          if (start) {
            const p = point(e);
            setDraft({
              x: Math.min(start.x, p.x),
              y: Math.min(start.y, p.y),
              width: Math.abs(start.x - p.x),
              height: Math.abs(start.y - p.y),
            });
          }
        }}
        onPointerUp={(e) => {
          if (start) {
            const p = point(e);
            const m = {
              x: Math.min(start.x, p.x),
              y: Math.min(start.y, p.y),
              width: Math.abs(start.x - p.x),
              height: Math.abs(start.y - p.y),
            };
            if (m.width > 0.005 && m.height > 0.005 && masks.length < 32) onChange([...masks, m]);
          }
          setStart(undefined);
          setDraft(undefined);
        }}
        onPointerCancel={() => {
          setStart(undefined);
          setDraft(undefined);
        }}
      >
        <img src={src} alt="Your screenshot with identity covers" draggable={false} />
        {[...masks, ...(draft ? [draft] : [])].map((m, i) => (
          <span
            className="mask"
            key={i}
            style={{
              left: `${m.x * 100}%`,
              top: `${m.y * 100}%`,
              width: `${m.width * 100}%`,
              height: `${m.height * 100}%`,
            }}
          />
        ))}
      </div>
      <div className="mask-tools">
        <Button
          type="button"
          secondary
          disabled={masks.length >= 32}
          onClick={() => onChange([...masks, { x: 0, y: 0, width: 1, height: 0.18 }])}
        >
          Cover top
        </Button>
        <Button
          type="button"
          secondary
          disabled={!masks.length}
          onClick={() => onChange(masks.slice(0, -1))}
        >
          Undo cover
        </Button>
      </div>
    </div>
  );
}
function Prepare({
  view,
  onError,
  disabled,
}: {
  view: PlayerView;
  onError: (message: string) => void;
  disabled: boolean;
}) {
  const g = view.game!;
  const own = g.ownSubmission;
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState('');
  const [answer, setAnswer] = useState(own?.answer ?? '');
  const [falseStory, setFalseStory] = useState(own?.falseStory ?? '');
  const [masks, setMasks] = useState<Mask[]>([]);
  const [redacted, setRedacted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const retryId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    retryId.current = undefined;
  }, [file, answer, falseStory, masks, redacted]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    onError('');
    const data = new FormData();
    data.set('file', file);
    data.set('gameId', g.id);
    data.set('actionId', (retryId.current ??= crypto.randomUUID()));
    data.set('answer', answer);
    data.set('falseStory', falseStory);
    data.set('masks', JSON.stringify(masks));
    data.set('redacted', String(redacted));
    try {
      await api('/api/uploads', { method: 'POST', body: data });
      retryId.current = undefined;
      setFile(undefined);
      setPreview('');
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  const audio = g.mode === 'voice';
  return (
    <Panel className="prepare-panel">
      {own ? (
        <div className="receipt" role="status">
          <strong>✓ Your {MODE_INFO[g.mode].upload} is ready.</strong>
          <p>The host will start when everyone is ready. You can replace it below.</p>
          {audio ? (
            <audio controls preload="metadata" src={`/api/media/${own.assetId}`} />
          ) : (
            <img
              className="saved-preview"
              src={`/api/media/${own.assetId}`}
              alt="Your prepared upload"
            />
          )}
        </div>
      ) : (
        <>
          <h2>Your turn to bring the evidence.</h2>
          <p>
            One {MODE_INFO[g.mode].upload} is all you need.{' '}
            {g.mode !== 'impostor'
              ? 'The answer stays private until the reveal.'
              : 'One friend will see a blurred version.'}
          </p>
        </>
      )}
      <form onSubmit={submit} className="prepare-form">
        <label htmlFor="upload">
          {own ? 'Replace your' : 'Choose one'} {MODE_INFO[g.mode].upload}
        </label>
        <input
          id="upload"
          type="file"
          accept={
            audio
              ? '.mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/wav'
              : 'image/jpeg,image/png,image/webp'
          }
          required={!own}
          onChange={(e) => {
            setFile(e.target.files?.[0]);
            setMasks([]);
            setRedacted(false);
          }}
          disabled={uploading}
        />
        <p className="support">
          {audio
            ? 'MP3, M4A, or WAV · up to 60 seconds and 20 MB'
            : 'JPEG, PNG, or WebP · up to 10 MB. Export HEIC as JPEG.'}
        </p>
        {preview ? (
          audio ? (
            <audio controls src={preview} />
          ) : g.mode === 'chat' ? (
            <MaskEditor src={preview} masks={masks} onChange={setMasks} />
          ) : (
            <img className="upload-preview" src={preview} alt="Photo you are preparing" />
          )
        ) : null}
        {g.mode === 'quiz' ? (
          <>
            <label htmlFor="answer">When was this taken?</label>
            <input
              id="answer"
              type="date"
              value={answer}
              required
              onChange={(e) => setAnswer(e.target.value)}
            />
          </>
        ) : null}
        {['voice', 'chat', 'bluff'].includes(g.mode) ? (
          <>
            <label htmlFor="answer">
              {g.mode === 'bluff' ? 'The true story' : 'What actually happened?'}
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={1500}
              required
              placeholder="Give your friends enough context for the reveal."
            />
          </>
        ) : null}
        {g.mode === 'bluff' ? (
          <>
            <label htmlFor="false-story">The invented story</label>
            <textarea
              id="false-story"
              value={falseStory}
              onChange={(e) => setFalseStory(e.target.value)}
              maxLength={1500}
              required
              placeholder="Make it believable."
            />
          </>
        ) : null}
        {g.mode === 'chat' ? (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={redacted}
              onChange={(e) => setRedacted(e.target.checked)}
              required
            />
            I checked the preview: names, avatars, and identifying details are hidden.
          </label>
        ) : null}
        <Button disabled={disabled || uploading || !file}>
          {uploading ? 'Saving your memory…' : own ? 'Replace my item' : 'My item is ready'}
        </Button>
      </form>
    </Panel>
  );
}
function Media({ view, onLoaded }: { view: PlayerView; onLoaded?: () => void }) {
  const g = view.game!;
  const [retry, setRetry] = useState(0);
  const [failed, setFailed] = useState(false);
  const url = `/api/media/${g.assetId}?view=${g.blurred ? 'blurred' : 'clear'}&retry=${retry}`;
  return (
    <div className="media-area">
      <div className="photo-mount">
        {g.mode === 'voice' ? (
          <div className="audio-stage">
            <div className="wave" aria-hidden="true">
              ▂ ▆ ▃ █ ▅ ▂ ▇ ▄ ▆ ▂ ▅
            </div>
            <audio controls preload="metadata" src={url} onError={() => setFailed(true)} />
            <p>Listen, then tell us what was happening.</p>
          </div>
        ) : (
          <img
            key={url}
            src={url}
            alt={
              g.blurred
                ? 'Your blurred clue: rough shapes and colors'
                : g.mode === 'chat'
                  ? 'An anonymized conversation to investigate'
                  : 'The memory for this turn'
            }
            onLoad={onLoaded}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="media-caption">
        <span>
          <Avatar small name={nameOf(view, g.ownerId)} />
          From {nameOf(view, g.ownerId)}
        </span>
        {g.mode === 'impostor' && !['reveal', 'results'].includes(g.phase) ? (
          <span className="private-tag">Only your view</span>
        ) : null}
      </div>
      {failed ? (
        <div className="notice">
          Couldn’t load this file.{' '}
          <button
            onClick={() => {
              setRetry((n) => n + 1);
              setFailed(false);
            }}
          >
            Try loading again
          </button>
        </div>
      ) : null}
    </div>
  );
}
function Play({ view, send, disabled }: { view: PlayerView; send: Send; disabled: boolean }) {
  const g = view.game!;
  const isHost = view.hostId === view.me.id;
  const [value, setValue] = useState('');
  const loaded = useRef('');
  useEffect(() => {
    setValue('');
  }, [g.phaseKey]);
  function mediaLoaded() {
    if (g.phase === 'preview' && loaded.current !== g.phaseKey && !g.loaded.includes(view.me.id)) {
      loaded.current = g.phaseKey;
      void send({ type: 'loaded' });
    }
  }
  return (
    <>
      <div className="play-grid">
        <Media view={view} onLoaded={mediaLoaded} />
        <Panel className="task-panel">
          {g.phase === 'preview' ? (
            <>
              <h2>A moment to remember.</h2>
              <p>
                The photo is loading on everyone’s device. Guessing opens when the host is ready.
              </p>
              <p className="progress-text">
                {g.loaded.length} of {g.roster.length} photos loaded
              </p>
              {isHost ? (
                <Button
                  disabled={disabled || !g.loaded.includes(view.me.id)}
                  onClick={() => void send({ type: 'open' })}
                >
                  Open guessing
                </Button>
              ) : (
                <p className="receipt">Waiting for {nameOf(view, view.hostId)} to open guessing.</p>
              )}
            </>
          ) : g.phase === 'reveal' ? (
            <Reveal view={view} />
          ) : g.phase === 'judge' ? (
            <>
              <div className="context">
                <strong>The actual context</strong>
                <p>{g.answer}</p>
              </div>
              <h2>Does this explanation count?</h2>
              <blockquote>
                {g.explanation}
                <cite>{nameOf(view, g.judgeAuthorId)}</cite>
              </blockquote>
              {g.canJudge ? (
                <div className="vote-buttons">
                  <Button
                    disabled={disabled}
                    onClick={() => void send({ type: 'judge', yes: true })}
                  >
                    Close enough
                  </Button>
                  <Button
                    secondary
                    disabled={disabled}
                    onClick={() => void send({ type: 'judge', yes: false })}
                  >
                    Not close
                  </Button>
                </div>
              ) : (
                <p className="receipt">
                  {g.ownVote
                    ? '✓ Your vote is locked.'
                    : view.me.id === g.ownerId
                      ? 'You shared this item, so you sit out judging.'
                      : 'This is your explanation, so your friends decide.'}
                </p>
              )}
              <p className="support">
                {g.submitted} of {g.eligible} votes locked. More yes than no earns one point; a tie
                rejects this explanation.
              </p>
            </>
          ) : g.phase === 'discuss' ? (
            <>
              <span className="role-note">
                {g.isImpostor
                  ? 'You are the impostor. Work out the photo without giving yourself away.'
                  : 'You have the clear photo. Describe it without saying too much.'}
              </span>
              <h2>Give a little away.</h2>
              <p>Talk aloud or leave one short clue. The host can move straight to voting.</p>
              {g.clue ? (
                <p className="receipt">✓ Your clue: {g.clue}</p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send({ type: 'clue', value });
                  }}
                >
                  <label htmlFor="clue">Your clue (optional)</label>
                  <input
                    id="clue"
                    maxLength={300}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <Button disabled={disabled || !value.trim()}>Share clue</Button>
                </form>
              )}
              {Object.keys(g.clues ?? {}).length ? (
                <ul className="clue-list">
                  {Object.entries(g.clues!).map(([id, clue]) => (
                    <li key={id}>
                      <strong>{nameOf(view, id)}</strong> {clue}
                    </li>
                  ))}
                </ul>
              ) : null}
              {isHost ? (
                <Button secondary disabled={disabled} onClick={() => void send({ type: 'skip' })}>
                  Skip to vote
                </Button>
              ) : null}
            </>
          ) : g.phase === 'vote' ? (
            <>
              <h2>Who is the impostor?</h2>
              {g.ownVote ? (
                <p className="receipt">✓ Vote locked: {nameOf(view, g.ownVote)}</p>
              ) : (
                <div className="suspect-list">
                  {g.roster
                    .filter((id) => id !== view.me.id)
                    .map((id) => (
                      <button
                        className="suspect"
                        key={id}
                        disabled={disabled}
                        onClick={() => {
                          if (confirm(`Lock your vote for ${nameOf(view, id)}?`))
                            void send({ type: 'vote', targetId: id });
                        }}
                      >
                        <Avatar small name={nameOf(view, id)} />
                        {nameOf(view, id)}
                      </button>
                    ))}
                </div>
              )}
              <p className="support">
                {g.submitted} of {g.eligible} votes locked. A tied vote means the impostor escapes.
              </p>
            </>
          ) : (
            <>
              <h2>{MODE_INFO[g.mode].task}</h2>
              {g.mode === 'quiz' ? (
                <p>
                  Closest date ranks first. Speed breaks an equally close tie. Top three: 3, 2, 1
                  points.
                </p>
              ) : g.mode === 'bluff' ? (
                <p>
                  Pick the true story. Get it right for one point; the storyteller gets two for
                  every friend fooled.
                </p>
              ) : (
                <p>
                  Explain the context in your own words. Your friends will judge after the real
                  story is revealed.
                </p>
              )}
              {g.canGuess ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send({ type: 'guess', value });
                  }}
                >
                  {g.mode === 'bluff' ? (
                    <fieldset className="story-choices">
                      <legend>Choose the true story</legend>
                      {g.options?.map((option, i) => (
                        <label
                          className={`story-option ${value === String(i) ? 'selected' : ''}`}
                          key={i}
                        >
                          <input
                            type="radio"
                            name="story"
                            value={i}
                            checked={value === String(i)}
                            onChange={() => setValue(String(i))}
                            required
                          />
                          <span>
                            <small>Story {i === 0 ? 'A' : 'B'}</small>
                            {option}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  ) : (
                    <>
                      <label htmlFor="guess">
                        {g.mode === 'quiz' ? 'Your date' : 'Your explanation'}
                      </label>
                      {g.mode === 'quiz' ? (
                        <input
                          type="date"
                          id="guess"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          required
                        />
                      ) : (
                        <textarea
                          id="guess"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          maxLength={1000}
                          required
                        />
                      )}
                    </>
                  )}
                  <Button disabled={disabled || !value.trim()}>
                    Lock {g.mode === 'bluff' ? 'choice' : 'guess'}
                  </Button>
                </form>
              ) : (
                <div className="receipt">
                  <strong>
                    {g.ownerId === view.me.id ? 'This is your memory.' : '✓ Your guess is locked.'}
                  </strong>
                  <p>
                    {g.ownerId === view.me.id
                      ? 'Your friends are guessing. You sit this one out.'
                      : g.mode === 'bluff'
                        ? `Story ${g.ownGuess === '0' ? 'A' : 'B'}`
                        : g.ownGuess}
                  </p>
                </div>
              )}
              <p className="support">
                {g.submitted} of {g.eligible} guesses locked
              </p>
            </>
          )}
        </Panel>
      </div>
      {isHost ? (
        <div className="flow-controls">
          {g.phase === 'reveal' ? (
            <Button disabled={disabled} onClick={() => void send({ type: 'next' })}>
              Next item
            </Button>
          ) : ['guess', 'judge', 'vote'].includes(g.phase) ? (
            <Button
              secondary
              disabled={disabled}
              onClick={() => {
                if (
                  confirm(
                    'Close this stage? Missing guesses get zero points and uncast votes abstain.',
                  )
                )
                  void send({ type: 'close' });
              }}
            >
              Close {g.phase === 'guess' ? 'guessing' : 'voting'}
            </Button>
          ) : null}
          {!['reveal', 'results'].includes(g.phase) ? (
            <button
              className="text-button"
              disabled={disabled}
              onClick={() => {
                if (
                  confirm(
                    'Skip this item with no points for anyone? Use this if its media cannot be played.',
                  )
                )
                  void send({ type: 'skipItem' });
              }}
            >
              Skip unusable item
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
function Reveal({ view }: { view: PlayerView }) {
  const g = view.game!;
  const r = g.result;
  if (!r) return null;
  return (
    <div className="reveal-content">
      <h2>
        {r.skipped
          ? 'Item skipped.'
          : g.mode === 'impostor'
            ? r.escaped
              ? 'The impostor escaped.'
              : 'You found the impostor.'
            : g.mode === 'quiz'
              ? r.answer
              : 'The real story'}
      </h2>
      {r.skipped ? (
        <p>No points awarded for this item.</p>
      ) : (
        <>
          {g.mode === 'impostor' ? (
            <>
              <p>
                <strong>{nameOf(view, r.impostorId)}</strong> was the impostor.
              </p>
              <p>
                {r.suspectId
                  ? `The group picked ${nameOf(view, r.suspectId)}.`
                  : 'There was no unique top suspect.'}
              </p>
            </>
          ) : g.mode !== 'quiz' ? (
            <p className="revealed-answer">{r.answer}</p>
          ) : (
            <p>The date behind {nameOf(view, r.ownerId)}’s photo.</p>
          )}
          {r.judgements ? (
            <ul className="judgement-list">
              {r.judgements.map((j) => (
                <li key={j.authorId}>
                  <strong>
                    {nameOf(view, j.authorId)}: {j.accepted ? 'Accepted · +1' : 'Not accepted'}
                  </strong>
                  <p>{r.guesses[j.authorId]?.value}</p>
                  <small>
                    {j.yes} yes / {j.no} no
                  </small>
                </li>
              ))}
            </ul>
          ) : null}
          <ul className="awards-list">
            {Object.entries(r.awards)
              .sort((a, b) => b[1] - a[1])
              .map(([id, points]) => (
                <li key={id}>
                  <span>
                    {nameOf(view, id)}
                    {g.mode === 'quiz' && r.guesses[id] ? (
                      <small>
                        {r.guesses[id].value} ·{' '}
                        {Math.abs(
                          Math.round(
                            (Date.parse(r.guesses[id].value) - Date.parse(r.answer!)) / 86400000,
                          ),
                        )}{' '}
                        days away
                      </small>
                    ) : null}
                  </span>
                  <strong>+{points}</strong>
                </li>
              ))}
          </ul>
          {!Object.keys(r.awards).length ? <p>No points awarded.</p> : null}
        </>
      )}
    </div>
  );
}
function Results({ view }: { view: PlayerView }) {
  const g = view.game!;
  const winners = g.rankings?.filter((p) => p.rank === 1) ?? [];
  return (
    <>
      <Panel className="results">
        <div className="winner-mark" aria-hidden="true">
          ✳
        </div>
        <p>{MODE_INFO[g.mode].name} complete</p>
        <h2>{winners.map((p) => nameOf(view, p.playerId)).join(' & ')}</h2>
        <p>
          {winners.length > 1 ? 'Share the win.' : 'Takes this one.'} {winners[0]?.score ?? 0}{' '}
          points.
        </p>
        <ol className="rankings">
          {g.rankings?.map((p) => (
            <li key={p.playerId} className={p.playerId === view.me.id ? 'you' : ''}>
              <span className="rank">{p.rank}</span>
              <Avatar name={nameOf(view, p.playerId)} />
              <strong>
                {nameOf(view, p.playerId)}
                {p.playerId === view.me.id ? ' (you)' : ''}
              </strong>
              <span>
                {p.score}
                <small> points</small>
              </span>
            </li>
          ))}
        </ol>
        <p className="support">A new game starts fresh. Your uploads stay saved.</p>
      </Panel>
      <details className="last-reveal" open>
        <summary>The final reveal</summary>
        <div className="play-grid final-reveal-grid">
          {g.roster.includes(view.me.id) ? <Media view={view} /> : null}
          <Reveal view={view} />
        </div>
      </details>
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
