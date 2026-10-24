export const MODES = ['quiz', 'voice', 'chat', 'bluff', 'impostor'] as const;
export type Mode = (typeof MODES)[number];
export type Phase =
  'prepare' | 'preview' | 'guess' | 'judge' | 'discuss' | 'vote' | 'reveal' | 'results';
export const MODE_INFO: Record<
  Mode,
  { name: string; icon: string; task: string; upload: string; description: string }
> = {
  quiz: {
    name: 'Memory Quiz',
    icon: '◷',
    task: 'When was this taken?',
    upload: 'photo',
    description: 'Find the date. Closest memory wins.',
  },
  voice: {
    name: 'Voice Detective',
    icon: '♫',
    task: 'What was going on?',
    upload: 'recording',
    description: 'Listen closely. Reconstruct the story.',
  },
  chat: {
    name: 'Chat Archaeology',
    icon: '☷',
    task: 'What is the missing context?',
    upload: 'screenshot',
    description: 'Hidden names. Familiar conversations.',
  },
  bluff: {
    name: 'Memory Bluff',
    icon: '◇',
    task: 'Which story actually happened?',
    upload: 'photo',
    description: 'One photo. Two stories. Pick the truth.',
  },
  impostor: {
    name: 'Memory Impostor',
    icon: '◉',
    task: 'Blend in. Find the impostor.',
    upload: 'photo',
    description: 'One friend sees a blur. Who is bluffing?',
  },
};
export interface Player {
  id: string;
  name: string;
}
export interface Asset {
  id: string;
  ownerId: string;
  gameId: string;
  key: string;
  blurKey?: string;
  mime: string;
}
export interface Submission {
  ownerId: string;
  assetId: string;
  answer: string;
  falseStory?: string;
  options?: string[];
  trueIndex?: number;
}
export interface Guess {
  value: string;
  order: number;
}
export interface Judgement {
  authorId: string;
  yes: number;
  no: number;
  accepted: boolean;
}
export interface ItemResult {
  ownerId: string;
  answer?: string;
  impostorId?: string;
  suspectId?: string;
  escaped?: boolean;
  skipped?: boolean;
  awards: Record<string, number>;
  guesses: Record<string, Guess>;
  judgements?: Judgement[];
  options?: string[];
  trueIndex?: number;
}
export interface Game {
  id: string;
  mode: Mode;
  phase: Phase;
  roster: string[];
  submissions: Record<string, Submission>;
  order: string[];
  index: number;
  scores: Record<string, number>;
  guesses: Record<string, Guess>;
  clues: Record<string, string>;
  votes: Record<string, string>;
  judgeAuthors: string[];
  judgeIndex: number;
  judgements: Judgement[];
  impostors: Record<string, string>;
  results: ItemResult[];
  sequence: number;
  loaded: string[];
}
export interface Session {
  version: number;
  players: Record<string, Player>;
  hostId?: string;
  game?: Game;
  assets: Record<string, Asset>;
}
export type Command =
  | { type: 'elect' }
  | { type: 'choose'; mode: Mode }
  | { type: 'start' | 'cancel' | 'open' | 'close' | 'next' | 'skip' | 'skipItem' | 'loaded' }
  | { type: 'guess'; value: string }
  | { type: 'judge'; yes: boolean }
  | { type: 'clue'; value: string }
  | { type: 'vote'; targetId: string };
export interface Envelope {
  id: string;
  version: number;
  gameId?: string;
  phaseKey?: string;
  command: Command;
}
export interface Receipt {
  ok: boolean;
  version?: number;
  error?: string;
  code?: string;
}
export interface PlayerView {
  version: number;
  me: Player;
  hostId?: string;
  players: (Player & { online: boolean })[];
  waiting: boolean;
  game?: {
    id: string;
    mode: Mode;
    phase: Phase;
    phaseKey: string;
    roster: string[];
    scores: Record<string, number>;
    loaded: string[];
    ready: string[];
    ownSubmission?: { assetId: string; answer: string; falseStory?: string };
    item: number;
    total: number;
    ownerId?: string;
    assetId?: string;
    blurred?: boolean;
    isImpostor?: boolean;
    answer?: string;
    options?: string[];
    ownGuess?: string;
    submitted: number;
    eligible: number;
    canGuess?: boolean;
    canJudge?: boolean;
    ownVote?: string;
    judgeAuthorId?: string;
    explanation?: string;
    judged?: Judgement[];
    clue?: string;
    clues?: Record<string, string>;
    result?: ItemResult;
    rankings?: { playerId: string; score: number; rank: number }[];
  };
}
