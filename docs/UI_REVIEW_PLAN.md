# Photo Fumble — visual review plan

Prepared 24 October 2026. **Design previews complete; the multiplayer game is not implemented.**
The deliverable is a local HTML concept gallery with exported screen images. It does
not connect to a game server, provision services, or publish a website. All player
names, answers, votes, stories, and scores are fictional review fixtures.

This plan follows the [PRD](PRD.md), [UI handoff](UI_HANDOFF.md),
[two visual concepts](UI_CONCEPTS.md), and [thirteen-product research](UI_RESEARCH_SYNTHESIS.md).
It uses the frontend-design process: define a subject-specific visual system, review
that system against the brief, build the mockups, then inspect the rendered images.

## What is worth showing

The useful review unit is a **decision or a change in what a player knows**. A separate
image is worthwhile when it tests a different task, role, secret, media format,
payoff, or recovery path. Twenty nearly identical lobby variations would teach less
than one clear lobby and the important gameplay states.

The review therefore covers 23 scene groups. Variants such as uploader versus
guesser, submitted receipts, and per-mode preparation stay selectable in the HTML
gallery. They do not each need a duplicate export. The same content appears in both
visual directions so appearance can be compared without changing the rules.

| Group | Scene worth reviewing | Why it needs a visual | Variants or points to inspect |
| --- | --- | --- | --- |
| 1 | Join with nickname | Establish the tone and smallest possible entry task. | One shared session; no room code or account step. Guest identity is proposed. |
| 2 | Shared lobby and host mode selection | Explain all five activities and show the host's authority. | Five mode descriptions and one required item; other players wait while the fixed host chooses. Bootstrap trigger remains proposed. |
| 3 | Prepare one item | Verify the most demanding form before playing. | Quiz photo/private date; Voice recording/private context; Chat cleaned screenshot/private context; Bluff photo/two stories/private truth; Impostor photo. One contribution per player. |
| 4 | Prepared and waiting | Show the player has finished and why play has not started. | Exact preview, replace action where appropriate, readiness count; no other player's private inputs. |
| 5 | Quiz date guess | Test the core photo-to-answer relationship. | Guesser enters a date; uploader presents without guessing; locked-answer receipt. No speed multiplier or assumed timer. |
| 6 | Quiz date reveal | Make accuracy and points understandable. | Correct date, each guess's gap, equal-distance tie resolved by submission order, 3/2/1/0 points. |
| 7 | Voice listen and explain | Give audio a real play surface. | User-initiated play/pause/seek and duration; proposed typed explanation; saved-answer waiting state. |
| 8 | Voice context revealed, then judging | Test the most important phase boundary. | Real context is already visible before voting controls; uploader sees a sit-out message; self-judging remains undecided. |
| 9 | Voice explanation outcome | Explain acceptance without inventing points. | More yes than no accepts; a tied vote rejects this explanation only; points explicitly pending. |
| 10 | Chat read and explain | Test screenshot legibility and reading order. | Synthetic anonymous speakers, enlarge control, short explanation, locked state; no hidden identity in shared pixels. |
| 11 | Chat context revealed, then judging | Demonstrate consistent behavior across related modes. | Reuses Voice's judging grammar; real context first, uploader excluded, majority/tie rule preserved. |
| 12 | Bluff choose a story | Test two equally credible alternatives. | Exactly two choices, neutral labels, equal emphasis; uploader waits; choice locking does not expose truth. |
| 13 | Bluff truth and fooled-friend reveal | Show the social payoff and exact arithmetic. | True story, who was fooled, storyteller's 2 points per fooled player, correct guesser's 1 point. |
| 14 | Impostor clear private view and discussion | Explain what ordinary players know. | Clear photo and discussion instruction; only host has Skip to vote; no compulsory speaking checklist. |
| 15 | Impostor blurred private view | Compare the same photo under restricted knowledge. | Separate blurred derivative, rough colours/shapes retained; no clear asset or public impostor badge. |
| 16 | Impostor suspect voting | Keep the roster recognizable while hiding choices. | Select suspect, lock vote, participation count. Eligibility and vote aggregation remain open. |
| 17 | Impostor role reveal | Show the payoff without silently defining victory rules. | Reveal identity; clearly annotate that outcome, ties, and points await a decision. No fabricated win/loss result. |
| 18 | Automatic final ranking | Verify the required end of every game. | Full group, equal treatment for tied winners, current player, host's next-mode/repeat controls. Bluff/Quiz can use confirmed score rules; other modes use pending placeholders. |
| 19 | Newcomer waiting for the next game | Prevent accidental mid-game participation. | Host and active mode may be named; no current photo, role, guessing, or voting controls. |
| 20 | Upload failed | Make retry behavior concrete. | Preserve entered context where possible, explain the failure, retry or replace; one contribution remains one contribution. |
| 21 | Connection lost and reconnecting | Show how uncertain actions are handled. | Last confirmed phase, reconnect action, disabled uncertain submission; no false “saved” claim. Identity recovery is proposed. |
| 22 | Host disconnected | Show a group state without inventing host rotation. | Clear waiting message; pausing is a proposed default; reassignment rule remains open. |
| 23 | Chat anonymization preview | Review the shared pixels before sharing. | Proposed crop/cover workflow and exact anonymized preview; no claim of automatic identity detection. |

The gallery's scene and viewer selectors are **review tools outside the product**.
Their ability to jump between states does not imply that players can skip a required
ranking, access another player's private view, or choose their own role.

## Two visual directions

Both directions use a large, stable media frame and one clear current task. Desktop
places the task beside the media; phone layouts stack the media and action in reading
order. Faces, screenshot text, and photo clues remain visible rather than cropped.

| Design axis | A — Pocket Prints | B — After Hours |
| --- | --- | --- |
| Central idea | Opening a friend's envelope of photos. A straight print mount is the distinctive visual object. | A late-night screening of shared memories. A broad viewing aperture is the distinctive visual object. |
| Base and ink | Photo paper `#F7FAFF`, ink `#182443`. | Screening plum `#2D2038`, screen white `#FFF9FF`. |
| Main accent | Album blue `#234BC8`; flash yellow `#F5D765` for result emphasis. | Projection lilac `#D9C9F3`; peach `#F4B69B` for result emphasis. |
| Supporting colour | Rose `#B82954`, sea glass `#DCEFE8`. | Soft mauve `#BDAFC8`, seat violet `#44324F`. |
| Type | DIN Condensed Bold display, Avenir Next body; platform fallbacks. | Futura Medium display, Avenir Next body; platform fallbacks. |
| Layout and shape | Left-aligned task text, generous bright space, restrained hard offset edge on the print only. | Quiet plum surround, large media aperture, pale action panel, rounded primary action. |
| Characteristic response | Locking an answer turns the task panel into a short confirmation receipt. | Revealing context opens the task panel like a small screening aperture. |
| Best question for review | Does it feel social and photo-specific while keeping serious clues readable? | Does it create suspense while remaining clear on an ordinary phone? |

Pocket Prints is the initial recommendation for an in-person party. After Hours is
an equal alternative for comparison, especially for a group playing over a call.
Neither direction selects a rule or a new feature.

The earlier concept review rejected scattered scrapbook decoration, a generic neon
dashboard, podium-only rankings, and speed meters. Those devices would obscure
clues, weaken the product's own identity, or imply the wrong rules. Personal media,
recognizable friends, and clear reveals provide the personality instead.

## Image delivery and review order

The completed set contains **70 standalone stills**, plus seven presentation sheets
and eight internal QA sheets. The export manifest records the actual captured files.

| Deliverable | Completed coverage | Purpose |
| --- | --- | --- |
| Local HTML gallery | All 23 groups, both directions, responsive layouts and selectable role/mode variants | Explore the complete proposal without implementing the website. |
| Desktop exports | 23 groups × 2 directions = 46 images | Review every materially different task and state. |
| Selected phone exports | 8 states × 2 directions = 16 images | Review the entry-to-finale flow, including Chat and Impostor, at phone width. |
| Additional preparation exports | 4 additional modes × 2 directions = 8 images | Show each mode’s distinct private preparation fields. |
| Matching comparison plates | Selected paired scenes | Judge art direction using identical content and state. |
| Contact sheets or image index | As needed | Find a mode or phase without opening every export. |

The eight phone captures are **join, prepare one item, Quiz guess, Voice
context/judging, Chat explanation, Bluff reveal, Impostor blurred view, and final
ranking**. They cover entry, preparation, all five mode families, judging, payoff,
and the ending. Other phone states remain selectable in the local gallery.

Review the images in this order:

1. Compare the same Bluff choice and reveal in both directions. Decide which tone
   fits a game with friends before debating small button details.
2. Follow join → host selection → one-item preparation → prepared waiting. Confirm
   that a newcomer understands who acts next and what they need to bring.
3. Inspect all five modes' play surfaces. Focus on photo visibility, audio controls,
   screenshot readability, equal story choices, and clear/blurred private views.
4. Inspect the reveal sequence. Can a player understand why their answer earned its
   result? Is Voice/Chat context visible before judgment? Is the Bluff calculation
   immediate and readable?
5. Inspect the final ranking and recovery states. Tied winners must share the win;
   a late arrival and a disconnected player must know what happens next.
6. Use the phone captures to review line lengths, long stories, touch targets, and
   whether the primary action stays easy to find.

The first chat handoff should display a small set of useful comparison images inline
and link the complete gallery and image index. Showing dozens of images in one chat
message would make the review harder.

## Role and recovery checks

| Viewer or situation | What the concepts must demonstrate |
| --- | --- |
| Host | Selects modes and advances authorized phases while remaining a player. Host status grants no secret answers. Only this viewer sees Impostor Skip to vote. |
| Quiz uploader | Presents their photo and waits; no date-guess field. |
| Voice/Chat uploader | Supplies private context and later sits out the judging vote. |
| Bluff storyteller | Does not select between their own stories; sees an appropriate waiting state. |
| Guesser or voter after locking | Sees their own saved response and participation count, with no interim answer distribution. Editing remains an open decision. |
| Impostor | Receives a separate blurred rendering of the same photo. The review environment's access to all fixtures is not a production privacy mechanism. |
| Newly joined player | Waits until the next game; is absent from active-game eligibility counts. |
| Failed upload | Can retry or replace without losing required context unnecessarily or creating a second contribution. |
| Reconnecting player | Sees uncertainty honestly and resumes only from confirmed state. |
| Disconnected host | No automatic host replacement is implied. Proposed pause is clearly labeled. |

## Motion to demonstrate

These are original interaction proposals inspired by the research, not copied or
measured animations from the reference products.

| Trigger | Proposed motion and purpose | Reduced motion |
| --- | --- | --- |
| Upload succeeds | Preview/check settles in place, 120–160 ms; confirms that preparation worked. | Immediate completed state. |
| Guess or vote locks | Action becomes a receipt, about 160 ms; confirms the saved response. | Immediate replacement with the same text and status. |
| Truth or context appears | Caption/aperture reveal, 180–220 ms; marks the move from inference to understanding. | Immediate reveal in the same reading order. |
| Host skips discussion | Immediate switch to suspect selection; clarifies the new activity. | Same switch. |
| Game ends | Automatic full ranking with brief, equal winner emphasis, at most 400 ms. | Settled complete ranking immediately. |

Audio requires an explicit play action. Photos do not drift or zoom during guessing.
Motion never delays voting or access to results, animates a secret into public view,
or substitutes for readable confirmation. A still export shows the completed state;
the local HTML is where the proposed interaction can be inspected.

## Confirmed rules preserved

- All five modes belong in one coherent joined-player experience.
- There is one nickname-based shared session, one randomly selected fixed host, and
  no room-code flow or mode-by-mode host rotation.
- Each player prepares one relevant item for the selected game. There is no
  compulsory album or multi-mode upload checklist.
- Scores belong to that game. Completion automatically displays its full final
  ranking; the highest score wins and tied highest scores share the win. Starting
  the next game resets scores. Uploaded files remain stored.
- Quiz ranks date accuracy before speed; speed only breaks equally distant guesses.
  Points are 3/2/1/0 with no furthest-guess penalty. The uploader does not guess.
- Voice and Chat reveal context before judging; the uploader sits out; a majority
  accepts an explanation, a tied vote rejects that explanation alone.
- Chat speaker identities are hidden in the actual shared screenshot.
- Bluff offers exactly one true and one false story; storyteller gets 2 per fooled
  friend and a correct guesser gets 1.
- Impostor uses a blurred version of the same photo. The host can skip directly to
  suspect voting without a required on-screen speaking sequence.
- Late arrivals wait for the next game and do not vote or guess in the active one.

## Decisions that mockups must keep open

| Open product decision | Treatment in the visual concepts |
| --- | --- |
| Bootstrap, minimum players, readiness threshold | Label the bootstrap interaction as proposed; do not invent a confirmed start rule. |
| Finish condition, item order, round count | Do not add a round-count setting or a fixed “round X of Y”. A next-item illustration is conditional. |
| Quiz date precision, edits, timers, simultaneous submissions | Full-date entry is illustrative; omit assumed countdowns and speed-based rewards. |
| Voice/Chat points, self-judging, missing votes, abstentions, answer input | Use pending score annotations. Typed explanations are proposed. Only uploader exclusion is confirmed. |
| Chat anonymization tools | Crop/cover and exact preview are proposed; automatic detection is not assumed. |
| Impostor/photo selection, uploader participation, suspect vote ties, victory and points | Show private views, discussion, voting, and role reveal. Mark outcome and scoring pending rather than manufacturing a winner. |
| Identity recovery, host departure, upload limits | Show understandable recovery without asserting unchosen limits or automatic host rotation. |

Pending-rule annotations belong to the review surround. The product canvas should
still read like a game for friends rather than a page of implementation notes.

## Build and visual verification sequence

1. Build a standalone fixture-driven HTML/CSS gallery in an isolated concept folder.
   Reuse the existing direction tokens and fictional content; keep the application
   code and deployment untouched.
2. Add scene, direction, mode, viewer, and viewport review controls outside each
   product canvas. Use these to inspect the preparation forms, locked receipts,
   uploader exclusions, and pending-rule variants.
3. Render the 23 groups in each direction at a fixed desktop viewport and the eight
   selected states at phone width. Keep screen content readable in each export;
   use full-page capture where a meaningful scroll is required.
4. Inspect representative renders from every mode and both directions. Correct
   clipping, overlap, illegible screenshots, unexpected photo cropping, weak
   contrast, missing controls, and long-text wrapping before delivery.
5. Verify the fixture arithmetic, equal-distance Quiz example, independent game
   scores, equal tied-winner treatment, and the confirmed/open distinction. Check
   that the blurred view uses a derivative and anonymous chat is synthetic/cleaned.
6. Deliver the gallery, image index, selected inline images, and the actual completed
   export inventory. Record any visual or interaction limitation plainly. No deploy
   step belongs to this review plan.

HTML controls are demonstrative review interactions. They do not establish network
synchronization, secure role filtering, scoring implementation, persistent uploads,
or multiplayer behavior. Those are later implementation work after design review.

## Completed delivery inventory

- [Interactive local HTML gallery](../ui-concepts/index.html): 23 scene groups, two
  directions, all five preparation forms, and host/player/uploader review variants.
- [All 70 exported images](../ui-concepts/images.html), with direction/layout filters
  and full-size image links.
- [Side-by-side direction comparison](../ui-concepts/review/comparison.png).
- 46 desktop captures: all 23 groups in both directions.
- 16 phone captures: join, prepare, Quiz guessing, Voice judging, Chat explaining,
  Bluff reveal, Impostor blurred private view, and final ranking in both directions.
- 8 extra desktop captures: Voice, Chat, Bluff and Impostor preparation in each
  direction, supplementing the core Quiz preparation capture.
- 7 presentation sheets: direction comparison, two five-mode overviews, and four
  phone-flow sheets. Eight internal QA contact sheets cover every desktop scene.
- [Machine-readable capture inventory](../ui-concepts/review/manifest.json) records
  actual files; [verification notes](../ui-concepts/review/VERIFICATION.md) record scope.

Phone preparation uses a compact selected-photo thumbnail to leave room for the
private answer and ready action. Chat enlargement is a local dialog. Crop/cover and
file replacement are indicated visual affordances with explanatory notes, not real
image-processing tools. Audio is a six-second synthetic control sample.

The final-ranking fixture uses the proposed once-per-person completion rule only as
example content; it does not adopt that rule. Bluff totals are Sam 10, Maya 10, Alex
7, Ollie 6, Ren 6, Leo 6 (45 total). Quiz has an independent 36-point fixture: Sam 8,
Maya 8, Alex 7, Ollie 6, Ren 4, Leo 3. No points carry between these fixtures.
