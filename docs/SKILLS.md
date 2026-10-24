# Photo Fumble skills

Reviewed and installed on 24 October 2026.

The attached idea describes five modes: memory quiz, voice detective, chat archaeology,
memory bluff, and memory impostor. This setup supports a browser party game with player
media, guessing, voting, hidden information, and shared rounds. The image is a concept
reference; installation does not settle the game rules or authorize implementation.

## Installed for this project

Skills live under `.agents/skills/` and become available on the next assistant turn in
this workspace. They provide development instructions and helper files. They do not add
gameplay features or install application dependencies.

| Skill | Installation source | Useful work for Photo Fumble |
| --- | --- | --- |
| `playwright` | Exact copy of Game1's installed skill; originally OpenAI | Check lobby/join flows, photo and chat uploads, audio playback controls, guesses, votes, results, and mobile layouts in a browser. Separate browser sessions/contexts are needed when verifying private player views. |
| `systematic-debugging` | Exact copy of Game1's installed skill; originally obra/superpowers | Reproduce stale round state, duplicate submissions, scoring errors, upload failures, and reconnect problems before fixing them. |
| `create-game-assets` | Exact copy of Game1's installed skill; originally gamedev-skills/awesome-gamedev-agent-skills | Optional support for coherent mode illustrations, badges, and other game art. Keep interface text and simple icons code-native. |
| `vercel-react-best-practices` | Newly downloaded from Vercel's official agent-skills repository | React component, data-loading, rendering, and bundle performance guidance if React is selected. This installation does not select Next.js or a hosting provider. |
| `security-best-practices` | Newly downloaded from OpenAI's official skills catalog | Available for explicitly requested security guidance or secure-by-default coding, including review of media handling and room access. Read the references matching the eventual frontend/backend. |
| `grill-me` | Downloaded from mattpocock/skills at the user's request | Explicitly start a structured interview to challenge and clarify the game design. Delegates to `grilling`. |
| `grill-with-docs` | Downloaded from mattpocock/skills at the user's request | The requested "grill docs" variant: combines the design interview with documenting settled terminology and significant decisions. Delegates to `grilling` and `domain-modeling`. |
| `grilling` | Required dependency of both interview entry points | Ask questions in rounds as prerequisite decisions are resolved; investigate facts rather than asking the user to look them up. |
| `domain-modeling` | Required dependency of `grill-with-docs` | Clarify terms such as room, player, submission, round, guess, vote, and reveal; record a glossary and warranted architecture decisions as they are resolved. |

The downloaded skills are pinned to the revisions recorded in
[`skill-installation.json`](../.agents/skill-installation.json). That file also records
SHA-256 hashes of every installed file and the exact source paths for the Game1 copies.

Sources:

- [OpenAI Playwright skill](https://github.com/openai/skills/tree/main/skills/.curated/playwright)
- [Systematic debugging](https://github.com/obra/superpowers/tree/main/skills/systematic-debugging)
- [Create game assets](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/main/skills/disciplines/create-game-assets)
- [Vercel React best practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)
- [OpenAI security best practices](https://github.com/openai/skills/tree/main/skills/.curated/security-best-practices)
- [Grill me](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me)
- [Grill with docs](https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs)
- [Grilling](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling)
- [Domain modeling](https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling)

The interview entry points are installed for deliberate use; installation does not start
an interview. Example requests: "Use `$grill-me` to challenge Photo Fumble's rules" or
"Use `$grill-with-docs` to plan Photo Fumble and document the settled terms and decisions."

## Skills already available account-wide

| Skill | Use here |
| --- | --- |
| `frontend-design` | Establish the visual direction and build the responsive lobby, mode picker, round screens, and results. |
| `web-design-guidelines` | Review keyboard access, focus, touch targets, forms, contrast, and reduced-motion behavior. |
| `imagegen` / `image-generation` | Optional original illustrations or branding when requested. Player photos remain player-provided content. |
| `find-skills` and `skill-installer` | Discover and install a focused addition when a concrete need appears. |

These skills are already accessible from this workspace, so no duplicate project
installation was necessary.

## Complete Game1 comparison

Game1 is the existing game-development workspace. Its
`Wankai/docs/SKILLS.md` confirms eight project-specific skills and the globally installed
character pipeline.

| Existing Game1 skill | Decision for this game |
| --- | --- |
| `playwright` | Copied; directly useful for browser interaction checks. |
| `systematic-debugging` | Copied; directly useful for game-state and media bugs. |
| `create-game-assets` | Copied; optional support for 2D visual assets. |
| `grilling` | Installed here from the current upstream source as a dependency of the requested interview skills. |
| `grill-me` | Installed here from the current upstream source at the user's request. |
| `character-design` | Defer unless custom characters or a mascot become part of the scope. |
| `rigging` | Defer; the current concept has no deforming 3D characters. |
| `threejs-loaders` | Defer; the current concept has no 3D models or scenes. |
| `game-character-pipeline` (global) | Already installed; unnecessary for the current photo/audio/chat game concept. |

## Implementation needs beyond these skills

The game will still need an explicit round/state model, room synchronization and
reconnection behavior, scoring rules, and media storage. Private answers and impostor
assignments need player-specific delivery; hiding content visually does not establish
privacy. Chat archaeology also needs a deliberate way to remove identities from the
shared material. These are implementation tasks, not features supplied by installing
skills.

Backend-specific skills and deployment skills are deferred until the backend and hosting
are selected. Voice detective does not inherently require speech recognition or AI
transcription: uploaded recordings can be played to the room.

## Verification and local helper paths

All nine skills have matching frontmatter names and verified file hashes. The three
Game1 copies were compared byte-for-byte with their sources. No game has been built or
tested as part of this setup.

`npx` is available. For this project-local Playwright installation, use the wrapper here
rather than the global example path shown in its upstream instructions:

```sh
bash .agents/skills/playwright/scripts/playwright_cli.sh --help
```

The wrapper obtains `@playwright/cli` through `npx`; the package and browser runtime were
not installed or exercised during skill installation. Browser setup may be needed on
first use. The optional game-asset raster scripts require Python and Pillow; those
dependencies were not installed during this setup. Systematic debugging refers to
separate companion skills in its upstream workflow; those companions are not included
in this installation.
