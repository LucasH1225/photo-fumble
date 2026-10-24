# Implementation verification

Verified locally on 25 October 2026 using Node 22.17.0. Production is configured for
Node 24 LTS via `.node-version`.

## Passed

- `npm run typecheck`: frontend, shared contracts, backend, scripts, and unit tests.
- `npm test`: 29 tests covering the two-/three-player start boundary, single-judge
  Voice/Chat acceptance and rejection, three-player impostor catches and ties,
  ranking, scoring, judging ties, author/uploader
  exclusion, private media permissions, late arrivals, host controls, result resets,
  pixel-level masking, separate blur encoding, audio byte ranges, persisted recovery,
  duplicate receipts, and a commit whose response and first recovery read are lost.
- `npm run test:e2e`: three- and four-player Chromium walkthroughs each complete
  every item in all five modes using the actual HTTP/Socket.IO backend. Each run
  uses a fresh temporary server. Includes a 390-pixel phone viewport, two-player
  readiness blocking, an arriving late player, refresh identity recovery, recording upload,
  byte-range playback requests, screenshot masking, clear/blur separation, final
  clear-image reveal, and automatic final rankings.
- Production frontend/server compilation, run by the browser test's build step.
- Development preview health endpoint returns `{ "ok": true }` through Vite's proxy.

Result screenshots are generated at `output/playwright/final-ranking-3.png` and
`output/playwright/final-ranking.png`. Set `E2E_PORT` to use a different local port
when another preview or test server occupies the default 4173.

## Public deployment checks — 25 October 2026

The public deployment is **https://photo-fumble.onrender.com**. The initial deployment
of commit `2ad2c02` was verified as Live, with logs confirming Supabase persistence.
The Sharp update in that commit passed all 20 unit tests, typecheck, the production
build, and a production dependency audit with zero reported vulnerabilities.

The Supabase dashboard confirms a private `photo-fumble-media` bucket with a 20 MB
limit and the stored MIME types `image/webp`, `audio/mpeg`, `audio/mp4`, `audio/wav`.
The database migration completed successfully. End-to-end upload, signed-link, and
transaction behavior on this deployed service still requires the rehearsal below.

`npm run test:online` passed all four read-only checks against the public URL:

- HTTPS homepage returns the Photo Fumble application HTML.
- Its deployed JavaScript and CSS return successfully with the correct content types.
- `/api/health` returns `{ "ok": true }` and disables caching.
- `/api/session` returns 401 for an anonymous request, as expected.

The hosted join screen also rendered in Chrome; no console warnings or errors were
captured during that fresh page load. The machine-readable check report is generated
at `output/online-checks.json`. These checks use anonymous GET requests and do not
create players, upload files, reset sessions, or interrupt the shared game.

## Hosted gameplay checks still needed

Use the rehearsal in [DEPLOYMENT.md](DEPLOYMENT.md) with at least three actual devices:

- Join the same public URL, choose the host, and complete all five modes; confirm
  synchronized actions, correct per-mode scores, and final rankings on every device.
- Upload one photo, recording, and masked screenshot; confirm playback, private
  media handling, and the impostor's blurred image on the hosted service.
- Include iPhone Safari and Chrome, with at least one player using cellular data
  while another uses Wi-Fi.
- Refresh or briefly disconnect a player during a game and confirm their identity,
  score, and current phase recover. Check a late arrival waits for the next game.
- Between games, restart Render and confirm Supabase restores the saved state.

The existing full browser walkthrough uses a temporary local server and local file
persistence. Redirecting it unchanged to the shared public game would retain its
test players and uploaded files, and could strand the fixed host when its
temporary browser contexts close. Full hosted automation needs a separate test
instance with its own `SESSION_NAMESPACE` and retained test host access.

The automated phone check uses Chromium at a phone viewport. No physical Safari,
physical-device audio, cross-network multiplayer, or hosted restart-recovery test
has been completed yet.
