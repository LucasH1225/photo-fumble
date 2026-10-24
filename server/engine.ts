import { randomInt, randomUUID } from 'node:crypto';
import {
  MIN_PLAYERS,
  MODES,
  type Asset,
  type Command,
  type Game,
  type ItemResult,
  type PlayerView,
  type Session,
  type Submission,
} from '../shared/types.js';

export class GameError extends Error {
  constructor(
    message: string,
    public code = 'INVALID_ACTION',
  ) {
    super(message);
  }
}
export function requireRule(condition: unknown, message: string): asserts condition {
  if (!condition) throw new GameError(message);
}
export const freshSession = (): Session => ({ version: 0, players: {}, assets: {} });
const shuffle = <T>(items: T[]): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const phaseKey = (g: Game) => `${g.id}:${g.index}:${g.phase}:${g.judgeIndex}`;
export const currentOwner = (g: Game) => g.order[g.index];
export const currentSubmission = (g: Game) => g.submissions[currentOwner(g)];
const guessers = (g: Game) => g.roster.filter((id) => id !== currentOwner(g));
const judges = (g: Game) => guessers(g).filter((id) => id !== g.judgeAuthors[g.judgeIndex]);
const has = (object: object, key: string) => Object.hasOwn(object, key);
export function dateDay(value: string): number {
  requireRule(/^\d{4}-\d{2}-\d{2}$/.test(value), 'Enter a complete date.');
  const time = Date.parse(`${value}T00:00:00Z`);
  requireRule(
    Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value,
    'Enter a valid calendar date.',
  );
  return time / 86_400_000;
}
export function addPlayer(state: Session, name: string, id: string = randomUUID()): string {
  const trimmed = name.trim();
  requireRule(
    trimmed.length > 0 && trimmed.length <= 24 && !/[\p{Cc}\p{Cf}]/u.test(trimmed),
    'Use a nickname between 1 and 24 characters.',
  );
  requireRule(
    !Object.values(state.players).some((p) => p.name.toLowerCase() === trimmed.toLowerCase()),
    'That nickname is taken. Choose another.',
  );
  state.players[id] = { id, name: trimmed };
  return id;
}
export function saveSubmission(
  state: Session,
  playerId: string,
  asset: Asset,
  fields: { answer?: string; falseStory?: string; redacted?: boolean },
): void {
  const g = state.game;
  requireRule(
    g?.phase === 'prepare' &&
      g.roster.includes(playerId) &&
      asset.gameId === g.id &&
      asset.ownerId === playerId,
    'This preparation has ended.',
  );
  const answer = (fields.answer ?? '').trim();
  const falseStory = (fields.falseStory ?? '').trim();
  requireRule(
    answer.length <= 1500 && falseStory.length <= 1500,
    'Keep stories under 1,500 characters.',
  );
  if (g.mode === 'quiz') dateDay(answer);
  if (g.mode === 'voice' || g.mode === 'chat' || g.mode === 'bluff')
    requireRule(answer.length > 0, 'Add the real story or context.');
  if (g.mode === 'chat')
    requireRule(fields.redacted === true, 'Confirm that names and avatars are hidden.');
  const submission: Submission = { ownerId: playerId, assetId: asset.id, answer };
  if (g.mode === 'bluff') {
    requireRule(falseStory.length > 0 && answer !== falseStory, 'Add a different invented story.');
    submission.falseStory = falseStory;
    const truthFirst = randomInt(2) === 0;
    submission.options = truthFirst ? [answer, falseStory] : [falseStory, answer];
    submission.trueIndex = truthFirst ? 0 : 1;
  }
  state.assets[asset.id] = asset;
  g.submissions[playerId] = submission;
}
function beginItem(g: Game): void {
  g.guesses = {};
  g.votes = {};
  g.clues = {};
  g.judgeAuthors = [];
  g.judgeIndex = 0;
  g.judgements = [];
  g.loaded = [];
  g.phase = g.mode === 'impostor' ? 'discuss' : g.mode === 'quiz' ? 'preview' : 'guess';
}
function finish(g: Game, extra: Partial<ItemResult> = {}): void {
  const s = currentSubmission(g);
  const result: ItemResult = {
    ownerId: currentOwner(g),
    answer: s.answer,
    guesses: structuredClone(g.guesses),
    awards: {},
    ...extra,
  };
  if (!extra.skipped) {
    if (g.mode === 'quiz') {
      const ranked = Object.entries(g.guesses).sort(
        (a, b) =>
          Math.abs(dateDay(a[1].value) - dateDay(s.answer)) -
            Math.abs(dateDay(b[1].value) - dateDay(s.answer)) || a[1].order - b[1].order,
      );
      ranked.forEach(([id], i) => {
        result.awards[id] = Math.max(0, 3 - i);
      });
    } else if (g.mode === 'bluff') {
      result.options = s.options;
      result.trueIndex = s.trueIndex;
      for (const [id, guess] of Object.entries(g.guesses)) {
        if (Number(guess.value) === s.trueIndex) result.awards[id] = 1;
        else result.awards[s.ownerId] = (result.awards[s.ownerId] ?? 0) + 2;
      }
    } else if (g.mode === 'voice' || g.mode === 'chat') {
      result.judgements = [...g.judgements];
      for (const j of g.judgements) if (j.accepted) result.awards[j.authorId] = 1;
    } else {
      const counts: Record<string, number> = {};
      for (const target of Object.values(g.votes)) counts[target] = (counts[target] ?? 0) + 1;
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const suspect = sorted[0] && sorted[0][1] !== sorted[1]?.[1] ? sorted[0][0] : undefined;
      result.impostorId = g.impostors[s.ownerId];
      result.suspectId = suspect;
      result.escaped = suspect !== result.impostorId;
      if (result.escaped) result.awards[result.impostorId] = 2;
      else for (const id of g.roster) if (id !== result.impostorId) result.awards[id] = 1;
    }
  }
  for (const [id, points] of Object.entries(result.awards)) g.scores[id] += points;
  g.results.push(result);
  g.phase = g.index === g.order.length - 1 ? 'results' : 'reveal';
}
function judgeNext(g: Game): void {
  const votes = Object.values(g.votes);
  const yes = votes.filter((v) => v === 'yes').length;
  const no = votes.filter((v) => v === 'no').length;
  g.judgements.push({ authorId: g.judgeAuthors[g.judgeIndex], yes, no, accepted: yes > no });
  g.judgeIndex++;
  g.votes = {};
  if (g.judgeIndex >= g.judgeAuthors.length) finish(g);
}
function closeGuesses(g: Game): void {
  if (g.mode === 'voice' || g.mode === 'chat') {
    g.judgeAuthors = g.roster.filter((id) => has(g.guesses, id));
    if (!g.judgeAuthors.length) finish(g);
    else {
      g.phase = 'judge';
      g.judgeIndex = 0;
      g.votes = {};
    }
  } else finish(g);
}
export function applyCommand(
  state: Session,
  playerId: string,
  command: Command,
  online: Set<string>,
): void {
  requireRule(state.players[playerId], 'Join the game first.');
  if (command.type === 'elect') {
    requireRule(
      !state.hostId && online.size >= MIN_PLAYERS,
      `Gather at least ${MIN_PLAYERS} friends before choosing a host.`,
    );
    state.hostId = shuffle([...online])[0];
    return;
  }
  if (command.type === 'choose') {
    requireRule(playerId === state.hostId, 'Only the host can choose a mode.');
    requireRule(!state.game || state.game.phase === 'results', 'Finish the current game first.');
    requireRule(
      MODES.includes(command.mode) && online.size >= MIN_PLAYERS,
      `At least ${MIN_PLAYERS} connected players are needed.`,
    );
    const roster = Object.keys(state.players).filter((id) => online.has(id));
    state.game = {
      id: randomUUID(),
      mode: command.mode,
      phase: 'prepare',
      roster,
      submissions: {},
      order: [],
      index: 0,
      scores: Object.fromEntries(roster.map((id) => [id, 0])),
      guesses: {},
      clues: {},
      votes: {},
      judgeAuthors: [],
      judgeIndex: 0,
      judgements: [],
      impostors: {},
      results: [],
      sequence: 0,
      loaded: [],
    };
    return;
  }
  const g = state.game;
  requireRule(g && g.roster.includes(playerId), 'You are in for the next game.');
  if (['start', 'cancel', 'open', 'close', 'next', 'skip', 'skipItem'].includes(command.type))
    requireRule(playerId === state.hostId, 'Only the host can do that.');
  switch (command.type) {
    case 'start': {
      requireRule(
        g.phase === 'prepare' && g.roster.every((id) => g.submissions[id]),
        'Everyone needs to prepare one item.',
      );
      g.order = shuffle(g.roster);
      const roles = shuffle(g.roster);
      g.order.forEach((owner, i) => {
        g.impostors[owner] = roles[i];
      });
      beginItem(g);
      break;
    }
    case 'cancel':
      requireRule(g.phase === 'prepare', 'Only preparation can be cancelled.');
      delete state.game;
      break;
    case 'loaded':
      requireRule(g.phase === 'preview', 'The preview has ended.');
      if (!g.loaded.includes(playerId)) g.loaded.push(playerId);
      break;
    case 'open':
      requireRule(g.phase === 'preview', 'Guessing is not waiting to open.');
      g.phase = 'guess';
      break;
    case 'guess': {
      requireRule(g.phase === 'guess' && playerId !== currentOwner(g), 'You cannot guess now.');
      requireRule(!has(g.guesses, playerId), 'Your guess is already locked.');
      const value = command.value.trim();
      requireRule(
        value.length > 0 && value.length <= 1000,
        'Enter an answer under 1,000 characters.',
      );
      if (g.mode === 'quiz') dateDay(value);
      if (g.mode === 'bluff')
        requireRule(value === '0' || value === '1', 'Choose one of the two stories.');
      g.guesses[playerId] = { value, order: ++g.sequence };
      if (Object.keys(g.guesses).length === guessers(g).length) closeGuesses(g);
      break;
    }
    case 'judge': {
      requireRule(
        g.phase === 'judge' && judges(g).includes(playerId),
        'You sit out this decision.',
      );
      requireRule(!has(g.votes, playerId), 'Your vote is already locked.');
      g.votes[playerId] = command.yes ? 'yes' : 'no';
      if (Object.keys(g.votes).length === judges(g).length) judgeNext(g);
      break;
    }
    case 'clue':
      requireRule(
        g.phase === 'discuss' && !has(g.clues, playerId),
        'Your clue is already locked or discussion has ended.',
      );
      requireRule(
        command.value.trim().length > 0 && command.value.length <= 300,
        'Keep your clue between 1 and 300 characters.',
      );
      g.clues[playerId] = command.value.trim();
      break;
    case 'skip':
      requireRule(g.phase === 'discuss', 'Discussion has ended.');
      g.phase = 'vote';
      break;
    case 'vote':
      requireRule(
        g.phase === 'vote' && g.roster.includes(command.targetId) && command.targetId !== playerId,
        'Choose another player.',
      );
      requireRule(!has(g.votes, playerId), 'Your vote is already locked.');
      g.votes[playerId] = command.targetId;
      if (Object.keys(g.votes).length === g.roster.length) finish(g);
      break;
    case 'close':
      if (g.phase === 'guess') closeGuesses(g);
      else if (g.phase === 'judge') judgeNext(g);
      else if (g.phase === 'vote') finish(g);
      else throw new GameError('This stage cannot be closed.');
      break;
    case 'next':
      requireRule(g.phase === 'reveal', 'The next item is not ready.');
      g.index++;
      beginItem(g);
      break;
    case 'skipItem':
      requireRule(
        !['prepare', 'reveal', 'results'].includes(g.phase),
        'This item cannot be skipped.',
      );
      finish(g, { skipped: true });
      break;
    default:
      throw new GameError('Unknown action.');
  }
}
export function viewFor(state: Session, id: string, online: Set<string>): PlayerView {
  const me = state.players[id];
  requireRule(me, 'Join the game first.');
  const g = state.game;
  const view: PlayerView = {
    version: state.version,
    me,
    hostId: state.hostId,
    players: Object.values(state.players).map((p) => ({ ...p, online: online.has(p.id) })),
    waiting: Boolean(g && g.phase !== 'results' && !g.roster.includes(id)),
  };
  if (!g) return view;
  const common = {
    id: g.id,
    mode: g.mode,
    phase: g.phase,
    phaseKey: phaseKey(g),
    roster: g.roster,
    scores: g.scores,
    loaded: g.loaded,
    ready: Object.keys(g.submissions),
    item: g.index + 1,
    total: g.roster.length,
    submitted: 0,
    eligible: 0,
  };
  if (view.waiting) {
    view.game = { ...common, ready: [], scores: {}, loaded: [] };
    return view;
  }
  const v: NonNullable<PlayerView['game']> = { ...common };
  view.game = v;
  if (g.phase === 'prepare') {
    const own = g.submissions[id];
    if (own)
      v.ownSubmission = { assetId: own.assetId, answer: own.answer, falseStory: own.falseStory };
    return view;
  }
  const s = currentSubmission(g);
  v.ownerId = s.ownerId;
  v.assetId = s.assetId;
  const revealed = g.phase === 'reveal' || g.phase === 'results';
  if (g.mode === 'impostor' && !revealed) {
    v.isImpostor = g.impostors[s.ownerId] === id;
    v.blurred = v.isImpostor;
  }
  if (g.mode === 'bluff') v.options = s.options;
  v.ownGuess = g.guesses[id]?.value;
  v.canGuess = g.phase === 'guess' && guessers(g).includes(id) && !has(g.guesses, id);
  v.submitted = Object.keys(g.guesses).length;
  v.eligible = guessers(g).length;
  if (g.phase === 'judge') {
    v.answer = s.answer;
    v.judgeAuthorId = g.judgeAuthors[g.judgeIndex];
    v.explanation = g.guesses[v.judgeAuthorId].value;
    v.canJudge = judges(g).includes(id) && !has(g.votes, id);
    v.ownVote = g.votes[id];
    v.submitted = Object.keys(g.votes).length;
    v.eligible = judges(g).length;
    v.judged = g.judgements;
  }
  if (g.phase === 'discuss') {
    v.clue = g.clues[id];
    v.clues = g.clues;
  }
  if (g.phase === 'vote') {
    v.ownVote = g.votes[id];
    v.submitted = Object.keys(g.votes).length;
    v.eligible = g.roster.length;
  }
  if (revealed) {
    v.result = g.results.at(-1);
    v.answer = s.answer;
  }
  if (g.phase === 'results') {
    const sorted = [...g.roster].sort((a, b) => g.scores[b] - g.scores[a]);
    v.rankings = sorted.map((playerId, i) => ({
      playerId,
      score: g.scores[playerId],
      rank: sorted.findIndex((p) => g.scores[p] === g.scores[playerId]) + 1,
    }));
  }
  return view;
}
export function mediaKeyFor(
  state: Session,
  playerId: string,
  assetId: string,
): { key: string; mime: string } {
  const g = state.game;
  const asset = state.assets[assetId];
  requireRule(
    g && asset && asset.gameId === g.id && g.roster.includes(playerId),
    'This media is unavailable to you.',
  );
  if (g.phase === 'prepare') {
    requireRule(
      asset.ownerId === playerId && g.submissions[playerId]?.assetId === assetId,
      'This media is private.',
    );
    return { key: asset.key, mime: asset.mime };
  }
  const current = currentSubmission(g);
  requireRule(current.assetId === assetId, 'This media is not part of the current item.');
  if (
    g.mode === 'impostor' &&
    !['reveal', 'results'].includes(g.phase) &&
    g.impostors[current.ownerId] === playerId
  ) {
    requireRule(asset.blurKey, 'The blurred image is not ready.');
    return { key: asset.blurKey, mime: 'image/webp' };
  }
  return { key: asset.key, mime: asset.mime };
}
