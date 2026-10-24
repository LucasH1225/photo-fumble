# Photo Fumble: media, guessing, and audience-voting references

Research date: 24 October 2026. This is a four-product contribution to the wider comparative study, not the complete ten-product study.

The research uses official help, official announcements, and publisher-provided interaction footage. It examines product screens and game flow rather than treating landing-page styling as evidence of in-game UI. No account was created, no private photo library was opened, no real multiplayer session was joined, and no external content was changed.

**Evidence labels:** “Observed” means an actual official screenshot or footage frame was inspected in the browser; “Documented” means official prose establishes the behavior; “Proposal” is a design recommendation for Photo Fumble. A screenshot containing confetti does not establish that the confetti animates. An official trailer establishes that footage shows an effect, not that every current web mode has the same effect.

## What Photo Fumble needs from these references

Photo Fumble combines a media viewer, a small multiplayer game, and a group adjudication tool. Its most important interface work is explaining the current stage: prepare an item, wait for others, examine/listen, answer, judge/vote, reveal, and see the final ranking. The host controls progression; late arrivals wait until the next mode. Scores belong to one mode only and the final ranking must appear automatically.

| Product | Strongest relevance | Evidence inspected | Best adaptation |
| --- | --- | --- | --- |
| GeoGuessr | Guess against a hidden truth, then make the error understandable | Official gameplay footage on publisher Steam listing; official party/challenge guidance | Visual comparison between guess and truth |
| Mentimeter | Nickname participation, mobile answering, clear results | May/September 2026 help screenshots and guidance | One decision per phone screen, private answer feedback, participation count |
| Slido | Host control, voting states, automatic final ranking | March 2026 official tutorial, screenshots, animated host-workflow GIF | Explicit “Close voting”, “Reveal”, and “Next” stages |
| Google Photos | Familiar photo preview and emotionally meaningful media | Google employee photo-view announcement screenshots; current upload/help instructions | Large original image, quiet controls, deliberate metadata reveal |

## 1. GeoGuessr

**Observed interaction and visual hierarchy.** The publisher’s Steam “Updated release showcase” includes a duel result frame with a map filling most of the screen, the two players’ scores above it, small distance labels, and a line connecting map positions. Other footage frames place avatars on small globes against a purple background. These are product/gameplay scenes, not an inference from GeoGuessr’s landing page. They demonstrate how a picture-based guess becomes an interpretable spatial result. [Official publisher gameplay gallery](https://store.steampowered.com/app/3478870/GeoGuessr_Steam_Edition/).

**Documented strengths.** Official organization guidance separates live parties from asynchronous challenge links, allows invited guests to use nicknames, and places a results leaderboard at the end of a completed challenge. This is useful evidence for keeping entry identity lightweight and making the game’s ending explicit. [GeoGuessr organization/party guidance](https://www.geoguessr.com/organizations).

**Design reading — inference.** The world image is the evidence; interface chrome explains the task and the outcome. The reveal answers “how far off was I?” before asking the player to continue. That explanatory reveal is more relevant to Photo Fumble than the large avatar/customization system.

**Motion evidence.** The official Steam video was observed changing between gameplay, map results, and avatar/lobby scenes. Its edited montage is not evidence for precise web-product transition timing, easing, or an animated score-counting algorithm. No current web-game animation was directly tested. Do not describe a particular flying pin, animated route, camera path, or podium entrance as verified from this review.

**Proposal for Photo Fumble.** In Memory Quiz, show the correct date and the player’s guessed date together, then the absolute date error and awarded rank points. An optional small timeline can make the relationship visible, analogous to the observed guess-to-truth map line. Retain accuracy as the primary ordering and submission speed only as the agreed tie-breaker. If location guessing is added later, a map result becomes directly relevant; do not build a map just for the date-only demo.

**Avoid.** Competitive health bars, divisions, elaborate avatars, and global progression would obscure the personal photo and create work unrelated to the hackathon demo. GeoGuessr’s distance-based scoring is not Photo Fumble’s agreed 3/2/1 rank scoring.

**Access limit.** GeoGuessr’s anonymous main page required signup to play; web fetching returned 403 for some pages. Current interaction evidence therefore comes from official publisher footage and help, not a hands-on signed-in web match. Steam and web designs may differ.

## 2. Mentimeter

**Observed interaction and visual hierarchy.** Official participant screenshots show a phone-sized, single-question view: prompt, supporting photo, a conspicuous time/point meter, and a large answer area. An official hosting article’s final-result screenshot enlarges the winner’s name, round avatar, and points in front of quieter ranking bars; small confetti marks appear in that static image. [Participant screens, updated May 2026](https://help.mentimeter.com/en/articles/2968253-participating-in-a-quiz-competition), [hosting and final-result screens, updated September 2026](https://help.mentimeter.com/en/articles/4305015-how-to-host-the-quiz-competition).

**Documented strengths.** Participants use nicknames and assigned avatars. The hosting guide describes a lobby and a synchronized reveal when the timer finishes or everyone has answered. The creation guide distinguishes fixed versus time-based scoring and permits a final leaderboard. These configurable rules are a useful design reference, but are not the rules to copy into Photo Fumble. [Participant identity](https://help.mentimeter.com/en/articles/2968253-participating-in-a-quiz-competition), [hosting](https://help.mentimeter.com/en/articles/4305015-how-to-host-the-quiz-competition), [quiz configuration](https://help.mentimeter.com/en/articles/410463-how-to-create-a-quiz-competition).

**Particularly useful voting feature.** Hidden results can still show how many people responded. Mentimeter explicitly recommends hiding interim responses to reduce influence from earlier answers. This resolves a Photo Fumble tension: give the group visible progress without exposing which answer is winning. [Official hide/show-results guide](https://help.mentimeter.com/en/articles/422266-hide-or-show-results).

**Design reading — inference.** It separates the audience’s simple job from the presenter’s broader controls. The player does not have to understand the editor or scoring configuration to participate.

**Motion evidence.** The reviewed leaderboard evidence is a **static screenshot**, including its confetti. No specific winner animation, score tween, or animated rank swap was directly observed. Countdown/reveal progression is officially documented; precise motion is unverified.

**Proposal for Photo Fumble.** Use a nickname and small recognizable token for identity; put the current photo or recording above one clear input. After submitting, replace the input with “Guess saved — waiting for 2 players” while keeping the media accessible. For subjective judging, show “3 of 5 eligible votes received” until voting closes, then show counts and a plain “Accepted” or “Not accepted”. Display the uploader’s ineligible state explicitly. The guesser’s own voting eligibility still needs a product decision; do not silently invent an exclusion.

**Avoid.** Mentimeter’s decaying points meter implies that speed changes every score; Photo Fumble currently uses speed only to break equally accurate date guesses. Copying that meter literally would teach the wrong rule. Do not inherit cross-presentation scores; Photo Fumble starts a new score for each mode.

## 3. Slido

**Observed interaction and visual hierarchy.** The official quiz tutorial’s host GIF shows a persistent control strip below the active question, a left list of questions with a current/live state, a joined-player view, and horizontal result bars after voting closes. Different frames were inspected directly in the browser. Its official results screenshot uses an ordered leaderboard; the tutorial also explains the player’s separate personal placement. [Official create/run tutorial, last edited March 2026](https://community.slido.com/interactive-poll-types-210/create-and-run-a-quiz-538), [official animated host-workflow example](https://uploads-eu-west-1.insided.com/slido-en/attachment/1b64a161-2baf-41ac-85af-7dbfeb25fe2a.gif), [official leaderboard image](https://uploads-eu-west-1.insided.com/slido-en/attachment/84c7780e-acab-40e4-a60f-bc133dc2ef81.png).

**Documented strengths.** The tutorial distinguishes closing voting, revealing the answer, and advancing the question; it documents automatic voting closure with the timer and automatic final leaderboard generation. Shared presentation mode shows the top five while every player can see their own final position. [Official quiz workflow](https://community.slido.com/interactive-poll-types-210/create-and-run-a-quiz-538).

**Design reading — inference.** The strongest idea is state clarity: “people are joining”, “accepting votes”, “votes closed”, and “answer revealed” are different states. The controls express what action will happen next, reducing ambiguity for a host who is also chatting and playing.

**Motion evidence.** The official GIF visibly changes from participant/lobby state to question and locked result states. That is verified workflow motion. Exact bar-growth easing, timings, or celebratory leaderboard choreography were not established; the animation is a tutorial recording, not proof of a particular decorative transition.

**Proposal for Photo Fumble.** Give the host a compact persistent bottom action area appropriate to the stage. For Memory Impostor, “Skip to voting” moves the whole group into the same vote screen. For Voice Detective and Chat Archaeology, make “Guessing”, “Real story”, “Judging”, and “Result” distinct screen states. Final rankings appear automatically when the mode is complete, as already agreed; the host can choose the next mode only after that result screen appears.

**Avoid.** Slido’s organizer dashboard contains many secondary controls and a wide sidebar intended for meeting administration. A phone party game should retain stage clarity without copying that density. Photo Fumble should show the entire small friend group’s final ranking, even though Slido’s shared-screen summary limits itself to five.

## 4. Google Photos

**Observed interaction and visual hierarchy.** A Google employee’s official photo-view announcement includes phone screenshots with a large uninterrupted photo, a compact date/time/location header, back/favorite/overflow controls, and contextual menus. The picture dominates; less frequent operations are moved into secondary menus. The reviewed screenshots describe the iOS design announced in July 2025, rather than proving every current Android/web view is identical. [Official employee announcement and interaction screenshots](https://support.google.com/photos/thread/354436763/photo-view-redesign-light-mode-%E2%80%9Cadd-to%E2%80%9D-menu-photo-stacks-and-badges?hl=en).

**Documented strengths.** Current browser-upload help supports selecting files and dragging photos into an album. Memories help describes opening a memory from a carousel and providing explicit exit and music controls. This pairs easy preparation with an immersive viewer that remains escapable. [Browser upload instructions](https://support.google.com/photos/answer/6193313?co=GENIE.Platform%3DDesktop&hl=en), [desktop memory viewer controls](https://support.google.com/photos/answer/9454489?co=GENIE.Platform%3DDesktop&hl=en-GB).

**Design reading — inference.** Familiar photo-viewing conventions lower the cost of learning the game. A personal image supplies more emotion and personality than extra interface decoration. The quiet frame makes stories, faces, and tiny clues visible.

**Notable motion — officially documented, not directly tested.** Google describes Cinematic Photos as moving 3D representations and separately describes animation/GIF creation. Google Research explains the depth/parallax camera technique. This is an impressive media effect, distinct from interface transitions. It was documented, not tested in an account in this study. [Google Photos Create tools, September 2025](https://blog.google/products-and-platforms/products/photos/google-photos-create-tab-editing-tools/), [Google Research’s technical explanation](https://research.google/blog/the-technology-behind-cinematic-photos/).

**Proposal for Photo Fumble.** Preview the actual selected photo at its full aspect ratio before “Ready”; keep “Replace photo” available. Use the same visual frame during guessing, reveal, and recap so players never wonder whether the picture changed. Hide date/location and truth-bearing metadata from guessers until reveal. For Chat Archaeology, provide a redaction preview before ready; identity masking must be visible and checked by the uploader.

**Avoid.** Google Photos prominently exposes the very metadata Memory Quiz asks players to guess. Do not reproduce its date/location header before reveal. Cinematic/parallax processing can change framing, hide clues, and add substantial work; leave the original image stable during guessing. A shared library remains optional and is not required for this demo.

## Cross-product proposals for the UI brief

These are Photo Fumble design recommendations, not claims that a reference product implements the exact behavior.

1. **A stable media stage.** The photo, screenshot, or audio player stays the main object. Prompts and stage controls surround it; mode identity can change the accent and illustration without changing navigation conventions.
2. **Progress without spoilers.** Show upload readiness, submitted guesses, and received eligible votes as counts. Hide provisional answers and vote tallies until the relevant stage closes.
3. **Host authority without information leakage.** Host controls concern timing and progression; they do not expose secret stories, other players’ unrevealed guesses, or the impostor role.
4. **An explanatory reveal.** Quiz shows guess versus true date plus rank points; bluff shows true story and whom it fooled; voice/chat shows real context, acceptance votes, and awarded points. Impostor reveal shows who had the blur. Unsettled scoring remains visibly unsettled in the PRD.
5. **An unavoidable but compact finale.** Automatically show a winner treatment and the full small-group ranking for the completed mode, including shared winners if tied. Keep the mode name on the result so nobody mistakes it for a cross-mode total.
6. **Motion as a reward for an event.** Proposed motion: a brief truth reveal and a restrained winner celebration, with reduced-motion alternatives. These are new design proposals; the study does not claim specific timings or choreography are copied from a verified competitor animation.

## Evidence boundaries

- This contribution inspects four products; combine it with the other agents’ products before describing the study as “at least ten”.
- Primary sources support all competitor behavior claims. Adapt/avoid judgments are explicitly analysis or proposals.
- Product screens were inspected through public official help images, a tutorial GIF, and publisher footage. This is not comprehensive authenticated usability testing.
- No pricing, popularity ranking, or hosting recommendation is asserted by this research. Official materials establish relevance; they do not establish a comparative usage ranking.
- No screenshot files were added: browser captures were used for inspection and the durable references are the original official pages/media links above.
