# Photo Fumble — local visual concepts

Open `overview.html` for the direction comparison, `index.html` for the interactive
review controls, or `images.html` for the full-size image index. These HTML files use
relative local assets and require no package installation or build step.

A local preview server was started at:

- [Comparison](http://127.0.0.1:8765/ui-concepts/overview.html)
- [Interactive gallery](http://127.0.0.1:8765/ui-concepts/index.html)
- [All images](http://127.0.0.1:8765/ui-concepts/images.html)

If the server has stopped, run from the workspace root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

The preview is local to this computer. It does not provision hosting or publish a
site. Files can also be opened directly in a browser.

Use Screen to choose a state, the two direction cards to switch art direction,
Prepare/result mode for mode-specific preparation or results, Viewer to inspect
player/host/uploader variants, and Desktop/Phone to compare layouts. The controls are
review tools outside the product canvas.

The gallery contains 23 scene groups, with 70 standalone PNG exports and seven
presentation sheets under `review/`. Phone layouts for all scenes are selectable;
eight representative phone states are exported in each direction. Long unexported
states can scroll naturally in the gallery.

Local sample interactions include story/suspect selection, locking, the host's
Skip to vote, an anonymous-chat enlargement dialog, and a synthetic six-second
audio preview with seek. File selection, crop/cover, multiplayer synchronization,
score calculation, persistent storage and secret delivery are not implemented.

The complete rationale and screen inventory are in
[the visual review plan](../docs/UI_REVIEW_PLAN.md). Capture inventory is in
[manifest.json](review/manifest.json), and inspection notes are in
[VERIFICATION.md](review/VERIFICATION.md).

Photo: [Kelvin Zyteng / Unsplash](https://unsplash.com/photos/friends-enjoy-a-sunset-picnic-by-the-sea-b6QEE_6ykp0).
Stories, dates, votes, identities, chat and scores are fictional review fixtures.
The blurred raster is sourced from the same photo; the gallery's access to all
fixtures is not an implementation of production privacy.
