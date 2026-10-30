# Memory river — isolated join-page mockup

Open <http://127.0.0.1:8765/ui-concepts/river-join/> using the existing workspace
review server. The page is buildless and also opens directly from `index.html`.

This concept uses the agreed After Hours palette and a decorative, nonchronological
river of seven public sample photographs. The join form stays still while the
photos flow. The composition becomes a shallow sideways current on phones.

## Review controls

- **Full width / Phone** previews the available width or a 390px frame.
- **Pause motion / Play motion** stops and resumes at the current position.
- `?still=1` opens an initially still version; `?phone=1` opens the phone frame.
- System reduced-motion preferences start the preview paused. Explicit Play
  allows a reviewer to opt into motion. Background tabs stop animating.
- The nickname form is a local interaction demonstration; it creates no player
  and sends no request to the game server.

The river follows a continuous curve on desktop, with a 118-second cycle. Phones
use a 100-second sideways cycle, fewer visible cards, and a compact composition on
short screens. Frame time is capped after interruptions to avoid jumps.

## Assets and boundaries

Seven local JPGs total approximately 344KB. Photographers, original source pages,
and reuse licenses are recorded in `photo-credits.json` and linked in the preview.
No current or past game uploads are used. No dates imply a chronological archive.

All concept files live in this directory. The actual React client, backend,
protocol, game data, and existing review screens were not edited for this mockup.
Nothing was published.

## Review performed

- Desktop at 1365px; phone at 390×844 and 390×667.
- All sample images loaded; no horizontal page overflow in inspected layouts.
- Photos move while the form's position stays constant; Pause holds their position.
- The Join action remains visible on the short phone viewport, including the
  separate review toolbar. Keyboard Tab reaches the Join button from the field.
- Mock submit gives an adjacent preview receipt without navigating or creating a
  session. Reduced-motion initialization and hidden-tab handling were reviewed in
  the script; no OS preference was changed during review.

Review captures are under `output/playwright/river-join/`.
