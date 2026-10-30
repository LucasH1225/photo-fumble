import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { createRoot } from 'react-dom/client';
import { io, type Socket } from 'socket.io-client';
import {
  MIN_PLAYERS,
  MODE_INFO,
  MODES,
  type Command,
  type Envelope,
  type PlayerView,
  type Receipt,
  type Mode,
} from '../shared/types';
import './style.css';
import './home.css';
import { PhotoCredits } from './MemoryRiver';
import { PrintTable, TableSurface } from './PrintTable';

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
  const color = Array.from(name).reduce((sum, letter) => sum + letter.codePointAt(0)!, 0) % 5;
  return (
    <span className={`avatar avatar-${color}${small ? ' small' : ''}`} aria-hidden="true">
      {Array.from(name).slice(0, 2).join('')}
    </span>
  );
}
function Aperture() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect
        x="6"
        y="10"
        width="26"
        height="30"
        rx="2"
        transform="rotate(-10 19 25)"
        fill="#FF5A1F"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <rect
        x="16"
        y="7"
        width="26"
        height="30"
        rx="2"
        fill="#FFFDF8"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <rect x="20" y="11" width="18" height="16" fill="currentColor" />
    </svg>
  );
}
function ModeIcon({ mode }: { mode: Mode }) {
  const paths: Record<Mode, ReactNode> = {
    quiz: (
      <>
        <rect x="12" y="15" width="40" height="37" rx="7" />
        <path d="M12 27h40M23 10v11m18-11v11m-19 16h8v8h-8m17-8h4m-4 8h4" />
      </>
    ),
    voice: (
      <>
        <rect x="25" y="10" width="14" height="29" rx="7" />
        <path d="M18 30v3a14 14 0 0 0 28 0v-3M32 47v8m-9 0h18M10 22v14m44-14v14" />
      </>
    ),
    chat: (
      <>
        <path d="M49 39V17a6 6 0 0 0-6-6H15a6 6 0 0 0-6 6v22a6 6 0 0 0 6 6h5v9l12-9h11a6 6 0 0 0 6-6Z" />
        <path d="M19 23h20M19 32h13" />
      </>
    ),
    bluff: (
      <>
        <path d="m32 9 22 23-22 23L10 32 32 9Z" />
        <path d="M32 9v46M10 32h44m-33-11 22 22m0-22L21 43" />
      </>
    ),
    impostor: (
      <>
        <path d="M7 32s9-17 25-17 25 17 25 17-9 17-25 17S7 32 7 32Z" />
        <circle cx="32" cy="32" r="8" />
        <path d="m12 12 40 40" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[mode]}
    </svg>
  );
}
const HOW_IT_PLAYS: Record<Mode, string> = {
  quiz: 'Bring one photo and its date. Everyone guesses when. Closest wins 3, then 2, then 1.',
  voice:
    'Bring one voice note. Explain what was going on. The group votes: 1 point if they buy it.',
  chat: 'Bring one chat screenshot. Black out the names. Guess the backstory; the group votes.',
  bluff: 'One photo, one true story, one fake. Spot the truth for 1 point. Fool a friend for 2.',
  impostor: 'Everyone gets the photo; one friend gets a blur. 20 seconds each, then vote.',
};
/* Each mode is a physical object on the table; drawn with markup so CSS can animate it. */
function ModeObject({ mode }: { mode: Mode }) {
  if (mode === 'voice')
    return (
      <span className="object object-tape">
        <span className="tape-label" />
        <span className="tape-reels">
          <span className="tape-reel" />
          <span className="tape-reel" />
        </span>
        <span className="tape-wave">
          {[18, 34, 24, 42, 28, 38, 16, 30].map((h, i) => (
            <span key={i} style={{ height: h, animationDelay: `${i * 0.11}s` }} />
          ))}
        </span>
      </span>
    );
  if (mode === 'chat')
    return (
      <span className="object object-chat">
        <span className="ink-bar" />
        <span className="bubble">are you awake</span>
        <span className="ink-bar short" />
        <span className="bubble">it’s 3am. why</span>
        <span className="bubble mine">the goat is back</span>
      </span>
    );
  if (mode === 'bluff')
    return (
      <span className="object object-print object-bluff">
        <span className="object-photo" />
        <span className="sticky a handwritten">A</span>
        <span className="sticky b handwritten">B</span>
      </span>
    );
  if (mode === 'impostor')
    return (
      <span className="object object-stack">
        <span className="object-print copy" />
        <span className="object-print copy" />
        <span className="object-print">
          <span className="object-photo blurry" />
          <span className="handwritten caption">who has the blur?</span>
        </span>
      </span>
    );
  return (
    <span className="object object-print">
      <span className="object-photo" />
      <span className="date-stamp crossed">'?? ?? ??</span>
      <span className="handwritten caption">when?</span>
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

function roomApi(view: PlayerView) {
  return view.room ? `/api/rooms/${view.room.code}` : '/api';
}
function App() {
  const [path, setPath] = useState(location.pathname);
  const navigate = useCallback((next: string) => {
    history.pushState(null, '', next);
    setPath(next);
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const update = () => setPath(location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  const code = /^\/r\/(\d{6})\/?$/.exec(path)?.[1];
  if (code !== undefined || path === '/legacy')
    return <RoomApp key={path} code={code} navigate={navigate} />;
  return <Home navigate={navigate} />;
}
function Home({ navigate }: { navigate: (path: string) => void }) {
  const [error, setError] = useState('');
  const [legacyAvailable, setLegacyAvailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/session')
      .then((r) => {
        if (!cancelled) setLegacyAvailable(r.ok);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="photo-home">
      <header className="topbar">
        <a className="brand" href="/">
          <Aperture />
          Photo Fumble
        </a>
        <span>A party game for {MIN_PLAYERS}+ friends</span>
      </header>
      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}
      <Join onJoin={(view) => navigate(`/r/${view.room!.code}`)} onError={setError} />
      {legacyAvailable ? (
        <div className="legacy-resume">
          <Button secondary onClick={() => navigate('/legacy')}>
            Resume previous game
          </Button>
        </div>
      ) : null}
      <footer className="footer">
        <span>Good friends. Questionable memories.</span>
        <span>Five ways to remember differently.</span>
      </footer>
      <PhotoCredits />
    </div>
  );
}
function RoomTools({ code, navigate }: { code?: string; navigate: (path: string) => void }) {
  const [status, setStatus] = useState('');
  async function copy() {
    const url = new URL(`/r/${code}`, location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Invite link copied.');
    } catch {
      setStatus(`Copy this invite link: ${url}`);
    }
  }
  return (
    <section className="room-toolbar" aria-label="Your room">
      <div>
        {code ? (
          <>
            Room <strong data-testid="room-code">{code}</strong>
          </>
        ) : (
          <strong>Previous shared game</strong>
        )}
      </div>
      <div className="room-toolbar-actions">
        {code ? (
          <Button secondary onClick={() => void copy()}>
            Copy invite link
          </Button>
        ) : null}
        <Button secondary onClick={() => navigate('/')}>
          Leave room
        </Button>
      </div>
      {status ? <p role="status">{status}</p> : null}
    </section>
  );
}
function RoomApp({ code, navigate }: { code?: string; navigate: (path: string) => void }) {
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
    fetch(code === undefined ? '/api/session' : `/api/rooms/${code}/session`)
      .then(async (r) => {
        if (r.status === 401) {
          if (code === undefined) navigate('/');
          return;
        }
        if (!r.ok) {
          const body = await r.json();
          throw new Error(body.error || 'The game server is unavailable. Try refreshing.');
        }
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
    const client = io({ reconnection: true, auth: { roomCode: code } });
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
      if (state.room?.code === code) setView(state);
    });
    return () => {
      client.disconnect();
      socket.current = undefined;
    };
  }, [me, code]);
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
          <Aperture />
          Photo Fumble
        </span>
        <p>Finding your friends…</p>
      </main>
    );
  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Photo Fumble home">
          <Aperture />
          Photo Fumble
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
            : 'Waiting in your room lobby.'}
        </div>
      ) : null}
      {!view ? (
        <Join
          code={code}
          onJoin={(next) =>
            next.room?.code === code ? setView(next) : navigate(`/r/${next.room!.code}`)
          }
          onError={setError}
        />
      ) : (
        <main className="app-main">
          <RoomTools code={code} navigate={navigate} />
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
          <Roster view={view} send={send} disabled={!connected || busy} />
          {!connected ? (
            <p className="notice" role="status">
              Reconnecting… Your saved place is safe. Actions will resume when you’re connected.
            </p>
          ) : null}
          {view.hostId && !view.players.find((p) => p.id === view.hostId)?.online ? (
            <div className="notice">
              <p>{nameOf(view, view.hostId)} is offline. Choose a new host to keep playing.</p>
              <HostControls view={view} send={send} disabled={!connected || busy} />
            </div>
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
                    Gather at least {MIN_PLAYERS} people, each on their own device. Then we’ll pick
                    a host at random, or choose someone below. The host plays too.
                  </p>
                  <HostControls view={view} send={send} disabled={!connected || busy} />
                  <Button
                    disabled={
                      !connected ||
                      busy ||
                      view.players.filter((p) => p.online).length < MIN_PLAYERS
                    }
                    onClick={() => void send({ type: 'elect' })}
                  >
                    Everyone’s here · pick a host
                  </Button>
                  <p className="support">
                    Share your room code or invite link. Friends can play together or from anywhere.
                  </p>
                </Panel>
              ) : !view.game ? (
                <ModePicker view={view} send={send} disabled={!connected || busy} />
              ) : view.game.phase === 'prepare' ? (
                <>
                  <Prepare
                    key={view.game.id}
                    view={view}
                    onError={setError}
                    disabled={!connected || busy}
                  />
                  <PreparationControls view={view} send={send} disabled={!connected || busy} />
                </>
              ) : view.game.phase === 'results' ? (
                <>
                  <Results view={view} />
                  <section className="results-navigation" aria-label="After the game">
                    {view.hostId === view.me.id ? (
                      <Button
                        secondary
                        disabled={!connected || busy}
                        onClick={() => void send({ type: 'lobby' })}
                      >
                        Back to lobby
                      </Button>
                    ) : (
                      <p className="support">
                        The host can return everyone to the lobby or choose the next game below.
                      </p>
                    )}
                  </section>
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
  code,
}: {
  code?: string;
  onJoin: (view: PlayerView) => void;
  onError: (error: string) => void;
}) {
  const [name, setName] = useState('');
  const [entry, setEntry] = useState<'join' | 'create'>('join');
  const [roomCode, setRoomCode] = useState(code ?? '');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (entry === 'create') {
        const result = await api<{ code: string; view: PlayerView }>('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        onJoin(result.view);
      } else {
        onJoin(
          await api<PlayerView>(`/api/rooms/${roomCode}/session/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          }),
        );
      }
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="photo-join">
      <TableSurface />
      <section className="photo-intro">
        <h1>
          You had
          <br />
          to be there.
        </h1>
        <p>
          Bring one photo, voice note or old chat. Your friends guess what’s written on the back.
        </p>
      </section>
      <PrintTable />
      <section className="photo-entry" aria-label="Find your people">
        <div className="room-entry-actions" aria-label="Room action">
          <Button
            type="button"
            secondary
            aria-pressed={entry === 'create'}
            disabled={busy}
            onClick={() => setEntry('create')}
          >
            Create a room
          </Button>
          <Button
            type="button"
            secondary
            aria-pressed={entry === 'join'}
            disabled={busy}
            onClick={() => setEntry('join')}
          >
            Join a room
          </Button>
        </div>
        <form onSubmit={submit}>
          {entry === 'join' ? (
            <>
              <label htmlFor="room-code">Room code</label>
              <input
                id="room-code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="off"
                placeholder="Six-digit code"
                required
              />
            </>
          ) : null}
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
          <Button disabled={busy}>
            {busy
              ? entry === 'create'
                ? 'Creating…'
                : 'Joining…'
              : entry === 'create'
                ? 'Create room'
                : 'Join room'}
          </Button>
        </form>
        <p className="photo-support">
          No accounts. Everyone plays on their own phone. {MIN_PLAYERS} or more friends.
        </p>
      </section>
    </main>
  );
}
function ModePicker({ view, send, disabled }: { view: PlayerView; send: Send; disabled: boolean }) {
  const [selected, setSelected] = useState<Mode>();
  const isHost = view.hostId === view.me.id;
  const enough = view.players.filter((p) => p.online).length >= MIN_PLAYERS;
  return (
    <section className="mode-picker">
      <p>
        {isHost
          ? 'Five ways to remember differently. Choose one, then prepare together.'
          : `${nameOf(view, view.hostId)} is choosing your next game.`}
      </p>
      <div className="mode-grid">
        {MODES.map((mode) => (
          <button
            className={`mode-card mode-${mode}${selected === mode ? ' selected' : ''}`}
            key={mode}
            disabled={!isHost || disabled}
            aria-pressed={selected === mode}
            onClick={() => setSelected(mode)}
          >
            <span className="mode-flip" aria-hidden="true">
              <span className="mode-front">
                <ModeObject mode={mode} />
              </span>
              <span className="mode-back">
                <small>How it plays</small>
                <span className="handwritten">{HOW_IT_PLAYS[mode]}</span>
              </span>
            </span>
            <span className="mode-label">
              <strong>{MODE_INFO[mode].name}</strong>
              <span>{MODE_INFO[mode].description}</span>
              <small>
                {mode === 'bluff'
                  ? 'One photo + two stories each'
                  : mode === 'quiz'
                    ? 'One photo + its date each'
                    : ['voice', 'chat'].includes(mode)
                      ? `One ${MODE_INFO[mode].upload} + context each`
                      : 'One photo each'}
              </small>
            </span>
          </button>
        ))}
      </div>
      {isHost ? (
        <div className="mode-confirm">
          <p role="status">
            {selected ? (
              <>
                <strong>{MODE_INFO[selected].name}</strong> selected. Everyone prepares one item
                next.
              </>
            ) : (
              'Pick the memory you want to play with.'
            )}
          </p>
          <Button
            disabled={disabled || !enough || !selected}
            onClick={() => {
              if (selected) void send({ type: 'choose', mode: selected });
            }}
          >
            Prepare this game
          </Button>
        </div>
      ) : (
        <p className="support">
          You’ll prepare your item once the host chooses. Every game starts with fresh scores.
        </p>
      )}
      {isHost && !enough ? (
        <p className="notice">
          At least {MIN_PLAYERS} connected players are needed to start another game.
        </p>
      ) : null}
    </section>
  );
}
function HostControls({
  view,
  send,
  disabled,
}: {
  view: PlayerView;
  send: Send;
  disabled: boolean;
}) {
  const [targetId, setTargetId] = useState('');
  const selectId = useId();
  const active = view.game && view.game.phase !== 'results' ? view.game : undefined;
  const hostOnline = view.players.some((p) => p.id === view.hostId && p.online);
  const canChange =
    (!view.hostId || view.hostId === view.me.id || !hostOnline) &&
    (!active || active.roster.includes(view.me.id));
  if (!canChange) return null;
  const candidates = view.players.filter(
    (p) => p.online && p.id !== view.hostId && (!active || active.roster.includes(p.id)),
  );
  const validTarget = candidates.some((p) => p.id === targetId);
  return (
    <div className="host-controls">
      <label htmlFor={selectId}>{view.hostId ? 'Change host' : 'Choose a host'}</label>
      <div className="host-select-row">
        <select
          id={selectId}
          value={validTarget ? targetId : ''}
          disabled={disabled || !candidates.length}
          onChange={(e) => setTargetId(e.target.value)}
        >
          <option value="">Select a player</option>
          {candidates.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.id === view.me.id ? ' (you)' : ''}
            </option>
          ))}
        </select>
        <Button
          secondary
          disabled={disabled || !validTarget}
          onClick={() => void send({ type: 'setHost', targetId })}
        >
          {view.hostId ? 'Make host' : 'Choose host'}
        </Button>
        {view.hostId ? (
          <Button
            secondary
            disabled={disabled || !candidates.length}
            onClick={() => void send({ type: 'elect' })}
          >
            Pick a random host
          </Button>
        ) : null}
      </div>
      <p className="support">
        {view.hostId
          ? 'Pass control to a connected player. The game and scores stay in place.'
          : 'The host chooses the mode and controls the flow. You can change hosts later from View players.'}
      </p>
    </div>
  );
}
function Roster({ view, send, disabled }: { view: PlayerView; send: Send; disabled: boolean }) {
  const g = view.game;
  return (
    <details className="roster">
      <summary>
        <span className="crew-avatars">
          {view.players.slice(0, 6).map((p) => (
            <Avatar key={p.id} small name={p.name} />
          ))}
        </span>
        <span>
          The whole crew{' '}
          <small>
            {view.players.length} {view.players.length === 1 ? 'player' : 'players'}
            {g?.phase === 'prepare' ? ` · ${g.ready.length} ready` : ''}
          </small>
        </span>
        <span className="crew-expand">
          View players <span aria-hidden="true">⌄</span>
        </span>
      </summary>
      <div className="roster-content">
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
                  {p.id === view.hostId ? 'Host · ' : ''}
                  {!p.online
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
              {g &&
              !g.scoresHidden &&
              !view.waiting &&
              g.phase !== 'prepare' &&
              g.roster.includes(p.id) ? (
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
        <p className="support">
          {g?.scoresHidden
            ? 'Scores stay hidden until the final ranking.'
            : view.hostId
              ? `${nameOf(view, view.hostId)} controls the flow. Scores belong to this game only.`
              : 'Choose your host below, or let us pick someone at random.'}
        </p>
        {view.hostId ? <HostControls view={view} send={send} disabled={disabled} /> : null}
      </div>
    </details>
  );
}
function PreparationControls({
  view,
  send,
  disabled,
}: {
  view: PlayerView;
  send: Send;
  disabled: boolean;
}) {
  const g = view.game!;
  return (
    <section className="preparation-controls" aria-label="Group readiness">
      <div>
        <strong>
          {g.ready.length} of {g.roster.length} ready
        </strong>
        <p className="support">
          {g.ready.length === g.roster.length
            ? 'Every memory is in. Let’s play.'
            : 'Everyone brings one item before the game begins.'}
        </p>
        <progress value={g.ready.length} max={g.roster.length} aria-label="Players ready" />
      </div>
      {view.hostId === view.me.id ? (
        <div className="host-actions">
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
      ) : (
        <p className="support">{nameOf(view, view.hostId)} will start when everyone is ready.</p>
      )}
    </section>
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
      await api(`${roomApi(view)}/uploads`, { method: 'POST', body: data });
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
        <div className="prepare-media">
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
          ) : own ? (
            audio ? (
              <audio controls preload="metadata" src={`${roomApi(view)}/media/${own.assetId}`} />
            ) : (
              <img
                className="upload-preview"
                src={`${roomApi(view)}/media/${own.assetId}`}
                alt="Your prepared upload"
              />
            )
          ) : (
            <div className="upload-empty" aria-hidden="true">
              <ModeIcon mode={g.mode} />
              <span>Your {MODE_INFO[g.mode].upload} goes here.</span>
            </div>
          )}
        </div>
        <div className="prepare-fields">
          <div className="private-note">
            <span aria-hidden="true">◈</span>
            {g.mode === 'impostor'
              ? 'One friend will get a blurred view of this photo.'
              : 'Your answer stays private until the reveal.'}
          </div>
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
          <p className="support">
            {own
              ? 'Replacing an item updates your contribution to this game.'
              : 'One item each. Your friends bring the rest.'}
          </p>
        </div>
      </form>
    </Panel>
  );
}
function Media({ view, onLoaded }: { view: PlayerView; onLoaded?: () => void }) {
  const g = view.game!;
  const [retry, setRetry] = useState(0);
  const [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const previewTitle = useId();
  const url = `${roomApi(view)}/media/${g.assetId}?view=${g.blurred ? 'blurred' : 'clear'}&retry=${retry}`;
  useEffect(() => {
    dialog.current?.close();
  }, [g.phaseKey, g.assetId]);
  const revealed = g.phase === 'reveal' || g.phase === 'results';
  const stamp =
    g.mode === 'quiz' && g.result?.answer
      ? `'${g.result.answer.slice(2, 4)} ${Number(g.result.answer.slice(5, 7))} ${Number(g.result.answer.slice(8, 10))}`
      : undefined;
  return (
    <div className="media-area">
      <div
        className={`photo-mount${g.mode === 'voice' ? ' tape' : ' print'}${revealed ? ' revealed' : ''}${g.blurred ? ' blurred' : ''}`}
      >
        {g.mode === 'voice' ? (
          <div className="audio-stage">
            <div className="tape-reels" aria-hidden="true">
              <span className="tape-reel" />
              <span className="tape-reel" />
            </div>
            <div className="tape-wave" aria-hidden="true">
              {[18, 40, 26, 52, 34, 46, 20, 38, 28, 44, 16].map((h, i) => (
                <span key={i} style={{ height: h, animationDelay: `${i * 0.09}s` }} />
              ))}
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
        {g.mode === 'quiz' ? (
          stamp && revealed ? (
            <span className="date-stamp burn" aria-hidden="true">
              {stamp}
            </span>
          ) : (
            <span className="date-stamp crossed" aria-hidden="true">
              '?? ?? ??
            </span>
          )
        ) : null}
      </div>
      {g.mode === 'chat' ? (
        <>
          <button
            className="enlarge-button"
            disabled={failed}
            onClick={() => dialog.current?.showModal()}
          >
            Enlarge screenshot
          </button>
          <dialog
            ref={dialog}
            className="media-dialog"
            aria-labelledby={previewTitle}
            onClick={(e) => {
              if (e.target === e.currentTarget) dialog.current?.close();
            }}
          >
            <div className="dialog-heading">
              <h2 id={previewTitle}>The conversation</h2>
              <Button secondary autoFocus onClick={() => dialog.current?.close()}>
                Close preview
              </Button>
            </div>
            <img src={url} alt="Enlarged anonymized conversation" />
          </dialog>
        </>
      ) : null}
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
function Countdown({
  deadlineAt,
  serverTime,
  phase,
  mode,
  speaking = false,
}: {
  deadlineAt: number;
  serverTime: number;
  phase: ViewGame['phase'];
  mode: Mode;
  speaking?: boolean;
}) {
  const initial = Math.max(0, Math.ceil((deadlineAt - serverTime) / 1000));
  const [seconds, setSeconds] = useState(initial);
  useEffect(() => {
    const receivedAt = performance.now();
    const update = () =>
      setSeconds(
        Math.max(0, Math.ceil((deadlineAt - serverTime - (performance.now() - receivedAt)) / 1000)),
      );
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [deadlineAt, serverTime]);
  const label =
    phase === 'guess'
      ? 'Guessing'
      : phase === 'discuss'
        ? speaking
          ? 'Speaking'
          : 'Discussion'
        : 'Voting';
  const total = phase === 'guess' ? (mode === 'voice' ? 90 : 60) : phase === 'discuss' ? 20 : 30;
  const fraction = Math.min(1, seconds / total);
  const circumference = 2 * Math.PI * 26;
  return (
    <div className={`round-countdown${seconds <= 10 ? ' urgent' : ''}`}>
      <div className="countdown-ring" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <circle className="ring-track" cx="32" cy="32" r="26" />
          <circle
            className="ring-fill"
            cx="32"
            cy="32"
            r="26"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - fraction)}
            transform="rotate(-90 32 32)"
          />
        </svg>
        <b>{seconds}</b>
      </div>
      <div>
        <strong>{label} time</strong>
        <p className="support">
          {seconds ? 'Moves on by itself when the clock runs out.' : 'Time’s up. Moving on…'}
        </p>
      </div>
      <span
        className="countdown-text"
        role="timer"
        aria-live="off"
        aria-label={`${label} time remaining`}
      >
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
      </span>
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
          {g.deadlineAt !== undefined ? (
            <Countdown
              key={g.phaseKey}
              deadlineAt={g.deadlineAt}
              serverTime={view.serverTime}
              phase={g.phase}
              mode={g.mode}
              speaking={Boolean(g.speakerId)}
            />
          ) : null}
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
              <h2>
                {g.speakerId
                  ? g.speakerId === view.me.id
                    ? 'Your turn to describe it.'
                    : `${nameOf(view, g.speakerId)}’s turn.`
                  : 'Give a little away.'}
              </h2>
              <p>
                {g.speakerId
                  ? `Turn ${g.speakerTurn} of ${g.roster.length}. Each person has 20 seconds. Talk aloud or share an optional clue during your turn.`
                  : 'Talk aloud or leave one short clue. The host can move straight to voting.'}
              </p>
              {g.speakerOrder ? (
                <ol className="speaking-order" aria-label="Speaking order">
                  {g.speakerOrder.map((id, index) => (
                    <li key={id} aria-current={id === g.speakerId ? 'step' : undefined}>
                      {index + 1}. {nameOf(view, id)}
                      {id === g.speakerId ? ' · Speaking now' : ''}
                    </li>
                  ))}
                </ol>
              ) : null}
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
                    disabled={disabled || g.canClue === false}
                  />
                  <Button disabled={disabled || g.canClue === false || !value.trim()}>
                    Share clue
                  </Button>
                  {g.speakerId && g.speakerId !== view.me.id ? (
                    <p className="support">
                      Wait for your speaking turn. The countdown moves to the next person
                      automatically.
                    </p>
                  ) : null}
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
        </Panel>
      </div>
    </>
  );
}
function Reveal({ view }: { view: PlayerView }) {
  const g = view.game!;
  const r = g.result;
  if (!r) return null;
  const distance = (id: string) =>
    Math.abs(Math.round((Date.parse(r.guesses[id].value) - Date.parse(r.answer!)) / 86400000));
  const longDate = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  return (
    <div className={`reveal-content back-of-photo mode-${g.mode}`}>
      <small className="back-label">The back says</small>
      <h2 className={g.mode === 'quiz' && !r.skipped ? 'handwritten big' : undefined}>
        {r.skipped
          ? 'Item skipped.'
          : g.mode === 'impostor'
            ? r.escaped
              ? 'The impostor escaped.'
              : 'You found the impostor.'
            : g.mode === 'quiz'
              ? longDate(r.answer!)
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
          ) : g.mode === 'bluff' && r.options ? (
            <>
              <div className="story-reveal-list">
                {r.options.map((story, i) => {
                  const voters = Object.entries(r.guesses).filter(
                    ([, guess]) => guess.value === String(i),
                  );
                  return (
                    <div
                      className={`story-result ${i === r.trueIndex ? 'true' : 'invented'}`}
                      key={i}
                    >
                      <strong>
                        Story {i === 0 ? 'A' : 'B'} ·{' '}
                        {i === r.trueIndex ? 'True story' : 'Invented story'}
                      </strong>
                      <p>{story}</p>
                      <small>
                        {voters.length
                          ? `Chosen by ${voters.map(([id]) => nameOf(view, id)).join(', ')}`
                          : 'No one chose this story.'}
                      </small>
                    </div>
                  );
                })}
              </div>
              <div className="score-callout">
                <strong>
                  {
                    Object.values(r.guesses).filter((guess) => guess.value !== String(r.trueIndex))
                      .length
                  }{' '}
                  friends fooled
                </strong>
                <p>
                  {nameOf(view, r.ownerId)} earns {r.awards[r.ownerId] ?? 0} points. Each correct
                  guess earns one.
                </p>
              </div>
            </>
          ) : g.mode !== 'quiz' ? (
            <p className="revealed-answer">{r.answer}</p>
          ) : (
            <>
              <p>The date behind {nameOf(view, r.ownerId)}’s photo.</p>
              <p className="support">
                Closest date first. For equal distances, the server’s receipt order breaks the tie.
              </p>
            </>
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
              .sort(
                (a, b) =>
                  b[1] - a[1] || (r.guesses[a[0]]?.order ?? 0) - (r.guesses[b[0]]?.order ?? 0),
              )
              .map(([id, points], index) => {
                const tied =
                  g.mode === 'quiz' && r.guesses[id]
                    ? Object.keys(r.guesses)
                        .filter((other) => distance(other) === distance(id))
                        .sort((a, b) => r.guesses[a].order - r.guesses[b].order)
                    : [];
                return (
                  <li key={id} style={{ '--i': index } as React.CSSProperties}>
                    <Avatar small name={nameOf(view, id)} />
                    <span>
                      {nameOf(view, id)}
                      {g.mode === 'quiz' && r.guesses[id] ? (
                        <small>
                          {r.guesses[id].value} · {distance(id)} days away
                          {tied.length > 1 ? (
                            <span className="tie-note">
                              Equal distance: received {tied.indexOf(id) + 1} of {tied.length}.
                            </span>
                          ) : null}
                        </small>
                      ) : null}
                    </span>
                    <strong className="stamp">+{points}</strong>
                  </li>
                );
              })}
          </ul>
          {!Object.keys(r.awards).length ? <p>No points awarded.</p> : null}
        </>
      )}
    </div>
  );
}
function Podium({ view }: { view: PlayerView }) {
  const top = (view.game?.rankings ?? []).slice(0, 3);
  if (top.length < 2) return null;
  const order = top.length === 3 ? [top[1], top[0], top[2]] : [top[1], top[0]];
  return (
    <div className="podium" aria-hidden="true">
      {order.map((p, i) => (
        <div
          className={`podium-step place-${p.rank}`}
          key={p.playerId}
          style={{ '--i': i } as React.CSSProperties}
        >
          <Avatar name={nameOf(view, p.playerId)} />
          <b>{nameOf(view, p.playerId)}</b>
          <span className="podium-bar">
            <strong>{p.rank}</strong>
            <small>{p.score} pts</small>
          </span>
        </div>
      ))}
      <span className="stamp winner-stamp">
        {top.filter((p) => p.rank === 1).length > 1 ? 'SHARED WIN' : 'WINNER'}
      </span>
    </div>
  );
}
function Results({ view }: { view: PlayerView }) {
  const g = view.game!;
  const winners = g.rankings?.filter((p) => p.rank === 1) ?? [];
  return (
    <>
      <Panel className="results">
        <div className="winner">
          <div className="winner-mark" aria-hidden="true">
            ✳
          </div>
          <p>{MODE_INFO[g.mode].name} complete</p>
          <h2>{winners.map((p) => nameOf(view, p.playerId)).join(' & ')}</h2>
          <p>
            {winners.length > 1 ? 'Share the win.' : 'Takes this one.'} {winners[0]?.score ?? 0}{' '}
            points.
          </p>
          <p className="support">A new game starts fresh. Your uploads stay saved.</p>
          <Podium view={view} />
        </div>
        <div className="ranking-panel">
          <h3>The full picture</h3>
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
        </div>
      </Panel>
      {!g.hideRoundResults ? (
        <details className="last-reveal" open>
          <summary>The final reveal</summary>
          <div className="play-grid final-reveal-grid">
            {g.roster.includes(view.me.id) ? <Media view={view} /> : null}
            <Reveal view={view} />
          </div>
        </details>
      ) : null}
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
