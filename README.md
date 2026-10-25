# Photo Fumble

A five-mode browser party game built around friends' photos, recordings, and chat
memories. All five modes are implemented with reusable room codes, selectable hosts,
private uploads, round countdowns, per-game scoring, and automatic final rankings.

Choose a host directly or pick one at random. The host can pass control from
**View players**; if they disconnect, an active player can choose a replacement.
Guessing lasts 60 seconds (90 for Voice Detective), discussion lasts 60 seconds,
and each ballot lasts 30 seconds. Expired stages advance automatically; refreshes
keep the same deadline. After the final ranking, the host can use **Back to lobby**
to return everyone to mode selection.

## Run locally

Use Node 24 LTS (Node 22.17+ also works). Local play requires no cloud account.

```bash
npm ci
npm run dev
```

Open **http://localhost:5173**, choose **Create a room**, and share the six-digit code
or invite link. Friends choose **Join a room** and enter that code and a nickname.
Each room needs at least three connected players to start a game. Use separate
browser profiles/private contexts to test distinct players on one computer. Tabs
in one profile share an identity, but can play in different rooms independently.
Rooms are reusable; leaving or refreshing does not reset a game. Existing members
of the old shared game can use **Resume previous game** to open `/legacy`.
Local game state and files persist in the ignored `.data/` directory.

## Verify

```bash
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

For a built local server, set `APP_ORIGIN=http://localhost:3001` and run `npm start`.
The development origin defaults to port 5173. Browser tests use isolated temporary
data and independent browser contexts for both three- and four-player games,
including a phone viewport and two simultaneous isolated rooms.

Check the public deployment with anonymous, read-only requests:

```bash
npm run test:online
# Or check another deployment:
npm run test:online -- https://your-service.onrender.com
```

This checks the homepage, deployed JavaScript/CSS, health API, and anonymous session
response. It writes `output/online-checks.json`. It does not join players, upload
files, or reset the live game. The full multiplayer walkthrough remains a local
test; use a separate hosted test instance for cloud automation and rehearse on real
devices before presenting.

## Hosting

Follow the **[complete Render + Supabase guide](docs/DEPLOYMENT.md)** for account
setup, private storage, SQL migration, deployment, costs, and stopping charges.
Production requires Supabase; local Render disk is never used for durable data.

## Start here

- [Product requirements](docs/PRD.md): audience, all five modes, confirmed behavior,
  adopted defaults, and demo acceptance criteria.
- [Agreed game design](docs/GAME_DESIGN.md): the concise record of decisions from the
  design conversation.
- [Glossary](GLOSSARY.md): shared vocabulary, especially session, game, mode, and round.
- [Build plan](docs/BUILD_PLAN.md): architecture, interfaces, and implementation status.
- [Verification](docs/VERIFICATION.md): completed checks and remaining cloud/device validation.
- [UI handoff](docs/UI_HANDOFF.md): brief for a UI agent or a separate design chat.
- [UI research](docs/UI_RESEARCH.md): completed twelve-product comparison of quiz,
  party, voting, and photo products, with source links and animation evidence.
- [Research synthesis](docs/UI_RESEARCH_SYNTHESIS.md): refreshed feature-first analysis
  of thirteen products, including audio guessing, UI details, and motion evidence.
- [Visual review plan](docs/UI_REVIEW_PLAN.md): 23 screen groups, two directions,
  all five modes, and the completed 70-image inventory.
- [Local concept gallery](ui-concepts/index.html) and [all design images](ui-concepts/images.html).
- [Written UI concepts](docs/UI_CONCEPTS.md): screen/state map and two proposed visual
  directions; accompanied by a local HTML gallery and exported design images.
- [Installed skills](docs/SKILLS.md): available skills and the Game1 comparison.

All five modes are required. Each game has its own fresh score and mandatory final
ranking. There is no combined leaderboard across modes.
