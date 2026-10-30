# Cinematic river — artwork study v1

Generated on 25 October 2026 with built-in image generation, using both supplied
river screenshots as style/environment references. The original generated output
remains in Codex's generated-images directory; this folder contains the project copy.

- Artwork: `river-study-v1.png` — 1672 × 941, approximately 16:9, 2.71 MB source PNG.
- Exact generation brief: `river-study-v1-prompt.txt`.

## Visual review

The broad silver current dominates the foreground and leads toward a bright,
misty opening. Distinct foreground rocks, middle-distance spires, and softened
distant formations give the landscape depth. Charcoal/slate tones and long silver
reflections follow the reference direction; the winding bright path also reads
clearly when the scene is displayed at a smaller size.

The left bank is darker than the river and offers a potential text area, but its
rock texture is still detailed. A later homepage should verify text contrast and
may need a local scrim or solid form surface. No typography has been tested over
this artwork yet.

The image contains only the landscape: no phone chrome, playback controls,
subtitles, letterboxing, photographs, or interface. This is a still artwork study;
animation, photo integration, responsive crops, and web-optimized image exports
remain later design stages.

No application code, game behavior, or deployment was changed for this study.

## Homepage mockup v1

Open `index.html` through a local static server, for example:
`http://127.0.0.1:8765/ui-concepts/cinematic-river/`.

The standalone HTML/CSS/JavaScript concept uses the original river artwork,
a stationary left-hand nickname form, and sample photo prints that follow the
river toward the foreground. On phones the landscape sits above the form.
The Full width / Phone controls are review tools outside the proposed interface.

A small WebGL shader gently distorts the brighter water inside a river-shaped
mask. This is a motion treatment of the still artwork, not a fluid simulation.
Without WebGL the original artwork remains visible. The Pause motion control
stops water, photos, and mist together; reduced-motion preferences start the
scene paused. Motion also stops when the scene or browser tab is hidden.

The form validates a nickname and shows a local preview receipt. It makes no API
calls, creates no game session, and reads no player uploads. Sample photos reuse
the licensed assets and credits in `../river-join/photo-credits.json`.
The three-player copy follows the current PRD.

Reviewed in the local browser at 1365px desktop and 390px phone widths, including
the shorter phone layout, photo motion, pause/resume, image loading, keyboard
submission, and visible focus. Screenshots are saved under
`output/playwright/cinematic-home/` in the project root. The actual application
remains unchanged.
