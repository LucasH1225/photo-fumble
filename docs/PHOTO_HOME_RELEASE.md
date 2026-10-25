# Photo river homepage

The homepage uses the selected After Hours photo-river concept: plum and lilac,
a fixed left entry form, and stock photo prints flowing along a slow curved path.
The current Create a room / Join a room controls and six-digit room codes remain.
Invite-link entry uses the same presentation. In-room gameplay is unchanged.

The seven bundled stock photos have source and license metadata in
`client/assets/memories/credits.json`; the homepage links the photographer credits.
These decorative assets are independent of private game uploads.

Motion is transform-based, capped at 30 frames per second, and runs outside React
render state. It pauses when hidden or offscreen and starts paused for reduced
motion preferences. The visible pause/play control retains the current position.
On phones, the photos follow a shallow horizontal current above the form.

## Validation — 25 October 2026

- Type checking and production build passed.
- All 46 unit tests passed.
- Existing three- and four-player browser walkthroughs passed (four test runs),
  covering all five modes, uploads, refresh recovery, privacy boundaries, late
  arrivals, rankings, simultaneous rooms, invite links, and keyboard room entry.
- Browser visual review at 1365px desktop and 390px phone widths; all images loaded,
  no horizontal page overflow, stationary form while photos move, and pause/resume.
- Reduced-motion initialization and listener cleanup were inspected in source.

The first test run failed to serve the HTML entry from a checkout beneath `.codex`.
Express's absolute `sendFile` treats that hidden path as unavailable. Verification
was rerun successfully from an identical temporary checkout outside hidden folders;
no server code was changed for this local setup issue.
