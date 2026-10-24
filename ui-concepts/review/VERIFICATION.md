# Visual concept verification

Completed 24 October 2026. Scope: local HTML mockups, not the multiplayer game.

## Delivered files

- 23 scene groups, each captured in Pocket Prints and After Hours: 46 desktop PNGs.
- Eight phone scenes per direction: 16 PNGs.
- Four additional preparation variants per direction: 8 PNGs.
- Total standalone design stills: 70, recorded in `manifest.json`.
- Seven presentation sheets: comparison, five-mode overviews, phone-flow overviews.
- Eight desktop QA contact sheets plus a few interaction-check screenshots in `qa/`.
- Still images are 1280 × 720. Phone plates include a 375 px app canvas and external
  review notes. Phone contact sheets crop only the presentation surround.

## Visual inspection

Viewed rendered HTML in the browser, all desktop groups through contact sheets, and
representative full-size captures from every mode and both directions. Inspected
the phone flow and play sheets, with full-size checks on preparation, judging,
chat, Bluff reveal, and final ranking.

Corrections made during review:

- Moved phone next-game controls below the complete ranking and fitted all six rows.
- Kept both tied winners equally prominent and made current-viewer labels consistent.
- Compact photo preview on phone preparation leaves the private answer and ready
  action visible together.
- Reduced dense result/prepared rows so the friend strip does not cross content.
- Fitted Chat explanation and Impostor discussion actions into selected phone plates.
- Captured settled reveal states rather than a partly clipped animation frame.
- Matched Voice/Chat prepared waiting to the selected media type.
- Used a separate waiting newcomer (Taylor), outside the six active participants.

## Local interaction checks

- Selecting Story B enables Lock choice; locking replaces choices with a saved
  Story B receipt and a waiting state.
- Selecting Not close shows a judgment receipt containing “Your choice: Not close”.
  An incorrectly quoted template string was traced and corrected at the source.
- Uploader judging view has a sit-out message and no judging buttons.
- Host Skip to vote changes discussion to suspect selection.
- Lock vote is disabled until a suspect is selected.
- Image-index search for “impostor” returns the expected 12 exported images.
- JavaScript syntax check passes with `node --check ui-concepts/concepts.js`.

These checks establish review-control behavior only. No multi-device session,
uploads, persistent storage, voting engine, score engine or production access rules
exist in this artifact.

## Score fixture provenance

Quiz reveal: Sam uploads. Maya's exact date in 18.4 s beats Ollie's 1-day error in
8.1 s. Alex's opposite-side 1-day error in 9.4 s loses that accuracy tie to Ollie.
Award Maya 3, Ollie 2, Alex 1, Ren 0, Leo 0; Sam does not guess.

Bluff reveal: Sam's false story fools Maya, Ollie and Ren. Sam earns 6; Alex and Leo
choose the true story and earn 1 each. This item's award totals 8.

Final score illustrations assume each prepared photo is used once **only as a
proposed completion fixture**, not an adopted product rule. Six players contribute
one item each; there is no fixed five-mode sequence or cross-mode total.

| Bluff storyteller | Fooled players | Correct players | Storyteller points |
| --- | --- | --- | --- |
| Maya | Alex, Ollie, Ren, Leo | Sam | 8 |
| Sam | Maya, Ollie, Ren | Alex, Leo | 6 |
| Alex | Sam, Leo | Maya, Ollie, Ren | 4 |
| Ollie | Ren, Leo | Maya, Sam, Alex | 4 |
| Ren | Maya, Alex | Sam, Ollie, Leo | 4 |
| Leo | Maya, Ollie | Sam, Alex, Ren | 4 |

Each correct guess earns 1. Totals: Sam 10, Maya 10, Alex 7, Ollie 6, Ren 6, Leo 6.
Fifteen fooled choices × 2 plus fifteen correct choices × 1 = 45 total points.

The independent Quiz final fixture awards 3 / 2 / 1 per photo:

| Uploader | First (+3) | Second (+2) | Third (+1) |
| --- | --- | --- | --- |
| Sam | Maya | Ollie | Alex |
| Maya | Sam | Alex | Ollie |
| Alex | Maya | Sam | Ren |
| Ollie | Alex | Ren | Leo |
| Ren | Sam | Leo | Alex |
| Leo | Ollie | Maya | Ren |

Totals: Sam 8, Maya 8, Alex 7, Ollie 6, Ren 4, Leo 3 = 36. The two games' totals
are separate. Voice/Chat points and Impostor outcomes are not invented; their result
variants are explicit review placeholders.

## Limits

Platform font stacks are used; appearance may vary on another operating system.
The waveform is decorative sample content, the chat is synthetic, and audio is a
tone used to demonstrate controls. The exact photo blur still needs testing against
real game material. Production must deliver only the permitted image derivative;
this gallery intentionally permits inspection of all fixtures.
