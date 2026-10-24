# Photo Fumble

A five-mode browser party game built around friends' photos, recordings, and chat
memories. All five modes are implemented with a shared lobby, a random fixed host,
private uploads, per-game scoring, and automatic final rankings.

## Run locally

Use Node 24 LTS (Node 22.17+ also works). Local play requires no cloud account.

```bash
npm ci
npm run dev
```

Open **http://localhost:5173**. Use four separate browser profiles/private contexts
to test multiplayer on one computer. Tabs in one profile share a player identity.
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
data and four independent browser contexts, including a phone viewport.

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
