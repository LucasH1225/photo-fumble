# After Hours UI implementation

Implemented and verified locally on 25 October 2026. The checks below describe
local validation of the publication candidate. Hosted visual verification and
hosted multiplayer gameplay require separate checks after deployment.

## What changed

- Applied the After Hours plum/lilac palette, geometric display typography,
  curved media frames, pale task panels, and restrained reveal/confirmation motion.
- Replaced the permanent roster sidebar with an expandable participant strip.
  Preparation controls remain outside the collapsed roster; play controls sit
  beside the current task.
- Mode cards select locally. Only **Prepare this game** sends the existing
  `choose` command. Nothing is selected initially, and non-hosts cannot commit.
- Preparation puts media and private inputs side by side on desktop and stacks
  them on phones. Upload, replacement, masks, confirmation, and readiness remain.
- Chat enlargement uses the same authorized image URL in a native dialog, with
  keyboard opening, Escape/close dismissal, and focus restoration.
- Quiz reveals explain equal-distance receipt ordering. Bluff reveals show both
  stories, the truth, player choices, and existing awarded points.
- Final results show winner recognition alongside every player's rank, retain
  shared winners and the final reveal, then offer the next mode.
- Mobile layouts, waiting states, errors, reconnect notices, and reduced motion
  use the same visual system. Photos remain contained and inset from curved
  frames so source-image corners remain visible.

## Compatibility

The UI uses the existing personalized `PlayerView`, command envelopes, media
authorization, upload endpoint, session identity, scoring, and host controls.
No new game API or server rule was introduced by the visual redesign.

The UI uses the published shared `MIN_PLAYERS = 3` constant for both availability
and copy, matching the backend. This UI update leaves the existing engine, scoring,
three-player coverage, deployment checks, and dependency lockfile unchanged.

The server continues to flatten Chat masks and encode Impostor blur. The mask
editor uses the server's mask color; the UI never creates a substitute CSS blur
or requests a hidden clear image.

## Verification

- Type checking passed.
- All 29 current unit tests passed, including scoring, ties, exclusions,
  three-player eligibility, media transformations, persistence, and recovery.
- Separate three- and four-player Chromium walkthroughs passed every item in all
  five modes, including real uploads, late arrivals, refresh identity recovery,
  recipient-specific media, final clear reveals, and automatic rankings.
- Browser checks verify local mode selection before confirmation, guest control
  restrictions, Chat dialog keyboard/focus behavior, long names/stories,
  reduced-motion receipts, and no horizontal overflow at 390px.
- Production builds passed as part of the browser runs. No browser page errors
  were recorded in the successful walkthroughs.

Publication verification runs against an identical source snapshot in a separate
temporary directory, using `E2E_PORT` for an independent local server. All source
files are checked against the publication tree; screenshots and traces remain
ignored generated outputs.

Visual review covered mode selection, preparation, all five play views, reveals,
and phone/results layouts. Generated captures are available at
`output/playwright/after-hours/` (four players) and
`output/playwright/after-hours-three-players/` (three players). Sample names and
media in these captures are test uploads, not content embedded in the game.

## Local review

Run `npm run dev` for a local preview. Run `npm run test:e2e` to regenerate the
three- and four-player review captures listed above. Set `E2E_PORT` if the default
4173 is occupied. Browser tests use separate temporary local storage and disable
cloud persistence; they do not join or modify the shared hosted game.

Phone verification uses Chromium at a phone viewport. Physical iPhone/Safari,
cross-network play, and hosted Supabase gameplay were not exercised by this UI
verification.
