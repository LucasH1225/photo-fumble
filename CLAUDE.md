# Photo Fumble

Browser party game for 3+ friends built from their own photos, voice notes and chat
screenshots. Five modes: Memory Quiz, Voice Detective, Chat Archaeology, Memory Bluff,
Memory Impostor. Live at https://photo-fumble.onrender.com (Render + Supabase).

## Commands

- `npm run dev` — server (tsx, port 3001) + Vite client at http://localhost:5173
- `npm run typecheck` — client and server TypeScript
- `npm test` — unit/integration tests (node --test)
- `npx playwright install chromium && npm run test:e2e` — 3- and 4-player browser walkthroughs
- `npm run build` / `npm start` — production build and server
- Node 24 LTS (22.17+ works). Local play needs no cloud account; state lives in `.data/`.

## Code map

- `shared/types.ts` — modes, phases, commands, `PlayerView` (per-player filtered state)
- `server/engine.ts` — pure game rules and scoring; `service.ts` durable mutations;
  `repository.ts` local-file / Supabase adapters; `media.ts` image/audio processing;
  `rooms.ts` + `room-routes.ts` coded rooms; `index.ts` HTTP, Socket.IO, CSP
- `client/main.tsx` — whole React UI (Home/Join, RoomApp, ModePicker, Prepare, Play,
  Countdown, Media, Reveal, Results, Podium)
- `client/PrintTable.tsx` — homepage table of dealt prints
- `client/style.css`, `client/home.css` — all styling
- `docs/` — PRD, game design, build plan, deployment. `GLOSSARY.md` — vocabulary
  (room, session, mode, game, round). Game rules live in `docs/GAME_DESIGN.md`.

## Current UI direction: "the back of the photo"

Every memory has a front everyone sees and a back only its owner knows. Hidden info
looks like the back of a print or a blur; reveals are a flip, a focus pull or a stamp.

- Colours: table `#f2ece1`, paper `#fffdf8`, ink `#171513`, date-stamp orange `#ff5a1f`
  (text-safe `#c23b0a`), marker blue `#2448d6`. Tokens are CSS variables in `style.css`.
- Type: Archivo (UI), Caveat (anything a player "wrote"), Space Mono (dates, timers).
  Loaded from Google Fonts in `index.html`.
- Motion keyframes are prefixed `pf*` (deal, flip, stamp, rise, pulse). Everything is
  disabled under `prefers-reduced-motion`. Keep animations short (under ~800 ms); the
  one exception is the homepage prints' slow ambient sway (`pfSway`, 7–9 s loops).
- Design doc: https://claude.ai/artifact/8KvCaBazcc4GeTRgJo8f5J
- Interactive prototype: https://claude.ai/artifact/U4bRBXX1pUPoKGDvfgtfCK
- Pre-redesign originals are in `_ui-backup-2026-10-29/`.

## Rules when changing the UI

- Browser tests select by visible labels and a few classes. Keep these unchanged unless
  you update `tests/browser/*.spec.ts`: "Create a room", "Join a room", "Join room",
  "Create room", "Room code", "Your nickname", "Connected", "Everyone’s here · pick a host",
  "Prepare this game", "Start playing", "Open guessing", "Lock guess", "Lock choice",
  "Next item", "Skip to vote", "Share clue", "Close enough", "Copy invite link",
  "Leave room", "My item is ready", "Cover top", "Enlarge screenshot", "Close preview";
  classes `.points .tie-note .story-result.true/.invented .receipt .rankings li
  .photo-mount img .last-reveal .context`; ids `#guess #answer #false-story #clue #upload`.
- "Join a room" must stay the default entry tab (tests fill Room code without clicking).
- No horizontal page overflow at 390 px (tests assert `body.scrollWidth`).
- Players must only see what their role allows (answers, roles, clear vs blurred image).

## Open items

- After the redesign, typecheck, `npm test` (49) and `npm run test:e2e` (3- and 4-player)
  pass as of 2026-10-30. Redesign is uncommitted and not deployed.
- Physical iPhone/Safari and cross-network play are unverified.
- SEO: homepage is an app shell; `robots.txt`, `sitemap.xml`, Open Graph tags missing.
