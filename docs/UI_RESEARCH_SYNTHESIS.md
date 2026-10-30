# Photo Fumble — feature-first design research synthesis

> Historical design/research snapshot. The 25 October room-code update supersedes
> earlier single-lobby restrictions. Current behavior is defined in [PRD.md](PRD.md).

24 October 2026. A second research pass for discussion before mockup construction.
Read with [the original twelve-product report](UI_RESEARCH.md) and [the PRD](PRD.md).
This pass adds SongPop, bringing coverage to **thirteen distinct products**. Jackbox
is counted once. Products were selected for relevant interactions, not ranked by
popularity, market share, or design quality.

## What our features actually ask of the interface

Photo Fumble combines personal-media viewing, synchronized participation, hidden
information, social judgment, and a shared payoff. A conventional quiz template
solves only part of that problem.

| Feature | Design task | Most relevant reference |
| --- | --- | --- |
| Nicknames in one shared session | Let people recognize friends and understand who's ready without room navigation. | Gartic Phone, Blooket, skribbl |
| Five modes | Explain the action and required item before asking the host to choose. | Blooket, Gimkit |
| One contribution for the chosen game | One upload slot, exact preview, private context, replace, and ready/waiting state. | Google Photos' media hierarchy; group preparation is our adaptation |
| Memory Quiz | Keep photo clues visible, collect a date privately, explain accuracy rank and points. | Wayground, GeoGuessr |
| Voice Detective | Make listening the central activity; keep context hidden until reveal, then judge explanations. | SongPop for audio focus; Mentimeter/Slido for response stages |
| Chat Archaeology | Make a redacted screenshot readable on a phone; reveal context before judgment. | Google Photos for viewing; Mentimeter/Slido for voting |
| Memory Bluff | Give exactly two equally credible choices, then reveal truth, fooled friends, and points. | Fibbage, Kahoot |
| Memory Impostor | Separate private view, discussion, and suspect selection; let the host skip discussion. | Among Us |
| Independent game results | Every player finds their own outcome, all players appear, ties share the win. | Wayground personal summary + Kahoot rows + Slido automatic finale |
| Remote or in-person play | Every device has the necessary media and instructions; a shared TV is optional. | Adapt beyond Jackbox's shared-screen arrangement |

## Evidence method and boundaries

This pass reopened primary-source help, developer materials, and public entry
screens. Actual screenshots were visually inspected for Wayground, Kahoot, Blooket,
Gimkit, Fibbage, Among Us, Mentimeter, Google Photos, GeoGuessr, and SongPop.
Gartic Phone and skribbl public entry/tutorial screens were observed directly.
Slido's official animated workflow was sampled at different states.

**Observed still** establishes composition. **Observed demo** establishes only the
sequence/effect visible in that recording. **Documented motion** is described by the
publisher, not witnessed in a current match. **Proposal** is our adaptation. No
animation timings, touch dimensions, reduced-motion support, or current authenticated
game behavior were measured. No accounts were created, games installed, public
matches joined, or personal media uploaded.

## Product-by-product analysis

### 1. Wayground / Quizizz — personal feedback and explicit completion

- **Observed UI:** the player summary puts identity above an accuracy bar, then
  separate rank and score tiles. Less important performance statistics sit below;
  recommendations occupy a separate side rail. [Official summary screenshot](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/158003329083/original/w3kHA759jT9RE3ciNjKIyGxD5rpJ6YODjw.png?1762325524=).
- **Design reading:** accuracy, position, and reward answer different questions.
  Keeping them separate makes an outcome easier to understand.
- **Adapt:** a personal “Your guess” result alongside the full group ranking. In
  Memory Quiz, distinguish date gap, accuracy rank, and 3/2/1/0 awarded points.
- **Motion:** confetti, answer feedback, and the Qbit character are officially
  described visual effects; choreography is unverified. [Session settings](https://help.wayground.com/support/solutions/articles/158000404930).
- **Boundary:** skip power-ups, recommendation rails, and school analytics. Quizizz
  is now Wayground; retained legacy screenshots are not a new branding proposal.
  [Official rename note](https://help.wayground.com/support/solutions/articles/158000403867-quizizz-is-now-wayground-what-s-changing-and-what-s-not).

### 2. Kahoot! — readable choices and a deliberate shared payoff

- **Observed UI:** the scoreboard has large horizontal rows, avatar and name left,
  score right, movement markers, and a high-contrast leader row. Its answer result
  screen combines answer colours with shapes and correctness marks.
- **Design reading:** the group can scan names and scores quickly, even while talking.
- **Adapt:** large vote targets and readable result rows; retain the entire small
  friend group and equally prominent tied winners. [Official flow and screenshots](https://support.kahoot.com/hc/en-us/articles/360039900153-Tips-for-hosting-a-live-game).
- **Motion:** fullbody characters in lobby selection, reactions, and final celebrations
  are **documented**, not observed in a played match. A small winner emphasis is a
  reasonable adaptation; a character system is unnecessary. [2026 release notes](https://support.kahoot.com/hc/en-us/articles/32601683697053-New-Kahoot-features-and-updates).

### 3. Blooket — make mode selection informative

- **Observed UI:** a graphic mode grid sits beside a detail pane for the chosen mode;
  that pane exposes recommendations and a single Host action. [Mode-picker image](https://help.blooket.com/hc/article_attachments/43256923173783).
- **Design reading:** selection is also a small explanation of the activity, reducing
  how much a host needs to teach aloud.
- **Adapt:** five mode choices with “what you do” and “bring one photo/recording/chat”.
  Preserve stable player identity and upload-readiness counts in the lobby.
- **Motion:** the earlier research sampled an official Classic walkthrough's
  answer → response summary → standings sequence. This pass rechecked the picker;
  it did not newly verify score tweening or a podium animation. [Hosting guide](https://help.blooket.com/hc/en-us/articles/15984215236503-How-to-Host-a-Blooket-Game).
- **Boundary:** no currencies, room-code step, or imported late-join behavior.

### 4. Gimkit — unmistakable selection and modest host controls

- **Observed UI:** illustrated mode cards use a yellow selection outline; the chosen
  activity has a description and an obvious Continue action. Host controls are
  described as a separate compact panel. [Official illustrated tutorial](https://help.gimkit.com/en/article/host-a-live-game-g4n2cd/).
- **Design reading:** a shared visual family can hold genuinely different activities.
- **Adapt:** a visible selected mode plus one host action; keep progress controls away
  from the player's answer area. Host remains a player without seeing hidden answers.
- **Motion:** no relevant interface animation verified. Character movement in its
  games is not evidence for animated rankings.
- **Boundary:** no explorable lobby world or large game-options dashboard.

### 5. Jackbox / Fibbage 4 — reveal the social consequence of a lie

- **Observed UI:** a lie becomes the dominant answer strip; its author is named and
  the people who selected it appear underneath. The prompt remains visible behind
  it. Cut-out art supports a theatrical tone. [Official gameplay gallery](https://www.jackboxgames.com/games/fibbage-4).
- **Design reading:** the payoff is discovering **who believed whom**, not merely
  seeing a correct-answer colour.
- **Adapt:** Memory Bluff reveals truth, then fooled friends, then “3 fooled × 2 = 6
  points”. Present both stories equally before selection, with no true-first convention.
- **Motion:** this reveal composition was inspected as a **still**. A staged truth →
  voters → score animation is **our proposal**, not claimed observed Fibbage timing.
- **Boundary:** make our media available on each device; do not require Jackbox's
  shared-screen arrangement, room code, or extra invented lies.

### 6. Gartic Phone — playful entry with very little commitment

- **Observed UI:** anonymous entry places the nickname and character together, with
  a large Start action. An adjacent illustrated tutorial cycles between concise
  activity explanations. [Public entry and tutorial](https://garticphone.com/).
- **Design reading:** identity and reassurance arrive before configuration.
- **Adapt:** a nickname-first invitation with a visible friend group and a brief
  explanation of the selected mode. A single contribution is enough to begin.
- **Motion:** tutorial cycling was **directly observed**; collective gameplay reveal
  timing was not tested. Our onboarding should let users control explanatory steps.
- **Boundary:** no authentication requirement, streamer directory, or decorative
  avatar-building task in our core flow.

### 7. skribbl.io — one presenter and one unmistakable task

- **Observed UI:** a compact central entry block contains name, language, character,
  and a large Play button. The public tutorial changes between drawing and guessing
  instructions. [Official public UI](https://skribbl.io/).
- **Design reading:** familiar identities and a prominent central activity reduce
  instruction overhead.
- **Adapt:** a single stable media stage. Uploader sees presentation/waiting copy;
  guesser sees the current input. Keep instructions in plain verbs.
- **Motion:** tutorial cycling observed. Live winner or score animations unverified.
- **Boundary:** do not import chat clutter, public matchmaking, or drawing tools.

### 8. Among Us — private knowledge, discussion, and suspect voting

- **Observed UI:** the official discussion screenshot retains player identity tokens
  alongside messages and reports who has voted plus how many remain. The voting
  roster remains recognizable behind the discussion view. [Official discussion screenshot](https://www.innersloth.com/wp-content/uploads/2021/06/Discussion.png),
  [publisher rules and gallery](https://www.innersloth.com/games/among-us/).
- **Design reading:** stable player identities bridge conversation and accusation;
  vote completion must remain apparent while people are talking.
- **Adapt:** distinct private-photo, discussion, and suspect-vote states. Show received
  votes without leaking choices. Only the host has “Skip to vote”; no speaking checklist.
- **Motion:** the inspected discussion image is dated 2021. The developer documents
  a player-capacity animation in its 2025 lobby update, but neither that motion nor
  ejection animation was played here. [Developer UI update](https://www.innersloth.com/a-match-made-in-update-16-0-0-emergency-meeting-40/).
- **Boundary:** no elimination mechanics or imported victory rules. The impostor's
  blurred photo must be an actual restricted derivative of the same clear photo.

### 9. GeoGuessr — make the gap between a guess and truth visible

- **Observed UI:** publisher screenshot/footage shows a dominant map, guess/truth
  markers connected spatially, distance labels, and scores above the map. [Publisher gallery](https://store.steampowered.com/app/3478870/GeoGuessr_Steam_Edition/).
- **Design reading:** the result explains the error instead of merely reporting failure.
- **Adapt:** a small date timeline at Quiz reveal: guessed date, actual date, day gap,
  then rank points. Explain equal-distance guesses on either side of the actual date.
- **Motion:** edited publisher footage was observed; it establishes scene changes,
  not a particular current web-game camera path or score animation.
- **Boundary:** no map for date-only play, health bars, or distance-based point formula.

### 10. Mentimeter — progress without influencing the next response

- **Observed UI:** phone examples stack one prompt, a supporting image, and a large
  response area; presenter tools are elsewhere. [Participant screen examples](https://help.mentimeter.com/en/articles/2968253-participating-in-a-quiz-competition).
- **Documented feature:** response totals remain visible while response content is
  hidden, helping avoid influence from previous answers. [Hide/show results](https://help.mentimeter.com/en/articles/422266-hide-or-show-results).
- **Adapt:** “4 of 6 guesses locked” and eligible-vote counts. After submit, preserve
  the media and show the player's own saved answer plus a reason for waiting.
- **Motion:** a static confetti illustration does not establish animated confetti.
  No particular winner choreography was observed.
- **Boundary:** its decreasing points meter would teach the wrong Quiz rule. Speed
  only breaks equal date-accuracy ties in Photo Fumble.

### 11. Slido — explicit stages and automatic final results

- **Observed demo:** the official workflow GIF moves between quiz setup/lobby,
  accepting responses, and result bars while a consistent host action area remains.
  [Animated host workflow](https://uploads-eu-west-1.insided.com/slido-en/attachment/1b64a161-2baf-41ac-85af-7dbfeb25fe2a.gif).
- **Documented feature:** lock voting, reveal answer, next question, then an automatic
  final leaderboard are distinct operations. [Official tutorial](https://community.slido.com/interactive-poll-types-210/create-and-run-a-quiz-538).
- **Design reading:** clear state transitions are more useful than an omnipresent
  dashboard when a host is also talking and playing.
- **Adapt:** Voice/Chat show real context **before** judgment. Impostor discussion
  becomes suspect voting on the host's action. Final rankings appear automatically.
- **Motion:** workflow changes directly observed; exact transition timing or bar easing
  unmeasured. Do not adopt a host ability to hide the required final ranking.

### 12. Google Photos — let the memory do the visual work

- **Observed UI:** the official iOS redesign examples give the photo most of the
  screen, with back/favourite/overflow controls and secondary actions in menus.
  [Employee announcement and screenshots](https://support.google.com/photos/thread/354436763/photo-view-redesign-light-mode-%E2%80%9Cadd-to%E2%80%9D-menu-photo-stacks-and-badges?hl=en).
- **Design reading:** personal content supplies emotion. Quiet chrome preserves the
  faces, places, and tiny details that make guessing possible.
- **Adapt:** preview/replace before ready; contain the whole image; enlarge chat
  screenshots; preserve the same media frame through play and reveal.
- **Motion:** animated example media was viewed on Google Research's Cinematic Photos
  article in this pass. Simulated camera movement/parallax is officially explained
  there. This is a media effect demonstration, not an account-tested interaction.
  [Technical explanation and animated examples](https://research.google/blog/the-technology-behind-cinematic-photos/).
- **Boundary:** hide the date/location header during Quiz. Keep photos stable during
  active guessing; parallax is at most a later, optional post-reveal recap treatment.

### 13. SongPop — an audio prompt deserves a complete play surface

- **Observed still:** publisher-provided phone screenshots show the two players and
  scores above a concise set of large answer rows, with contrasting feedback and
  compact sequence dots. [Official FreshPlanet listing and screenshots](https://play.google.com/store/apps/details?hl=en_US&id=com.freshplanet.games.SongPop3).
- **Documented feature:** the player listens, recognizes a song/artist, and chooses
  an answer. The sound is the prompt, not background decoration.
- **Adapt:** Voice Detective needs a prominent recording panel, visible user-initiated
  play/pause, seek and duration, and an explanation field nearby. These playback
  controls are our proposal, not all confirmed from SongPop's screenshot.
- **Motion:** screenshot evidence only; no listening animation, waveform, or live
  answer feedback sequence was verified.
- **Boundary:** no library economy, power-ups, speed multiplier, lyric transcription,
  or music-identification rule. Players infer personal context and later judge it.

## The animation ideas worth carrying forward

| Reference and evidence | Why appealing | Photo Fumble proposal | Priority |
| --- | --- | --- | --- |
| Fibbage reveal composition, observed stills | The reveal exposes the social joke: who fooled whom. | Reveal true story → show fooled friends → expose “3 × 2 = 6”. Motion itself is proposed. | First |
| Slido phase changes, observed tutorial GIF | The group understands that the activity has changed. | Replace discussion with suspect voting; replace guessing with context, then judging. | First |
| GeoGuessr result comparison, observed screenshot/edited footage | The error becomes understandable and discussable. | A short date-marker connection to the true date; show rank rationale immediately. | First |
| Kahoot celebration, officially documented | A shared ending gives the game a clear emotional finish. | Brief winner emphasis for all tied winners; full ranking remains readable immediately. | Small polish |
| Google Cinematic Photos, animated examples + official explanation | A still memory gains depth and presence. | Optional post-reveal recap only, after the demo; stable original throughout guessing. | Later |
| Gartic/skribbl tutorial cycling, directly observed | Visual demonstrations teach faster than a long rules page. | One short user-controlled explanation per mode, rather than auto-advancing text during play. | Optional |

Our proposed motion budget is limited to upload confirmation, locked-answer
confirmation, the truth/context reveal, and a brief finale. Reduced motion shows
the same completed state immediately. Nothing should delay voting, crop a clue,
autoplay private audio, or distribute a clear image to an impostor for a blur effect.

## Synthesis for our five modes

- **Quiz:** Google Photos media stage + Wayground personal feedback + GeoGuessr's
  explanatory result. Accuracy first; submission speed only breaks equal distance;
  award 3/2/1/0 with no furthest-guess penalty.
- **Voice Detective:** SongPop's audio focus + Mentimeter's simple response + Slido's
  phase clarity. Reveal real context, then judge each explanation. Uploader sits out;
  more yes than no accepts; a split rejects only that explanation.
- **Chat Archaeology:** readable, actually redacted screenshot + the same context
  reveal and judging scaffold as Voice Detective. Do not invent automatic redaction.
- **Bluff:** two equally presented story choices + Fibbage's social reveal. Exactly
  one true and one false; storyteller gets 2 per fooled player, correct guesser 1.
- **Impostor:** Among Us's private knowledge/discussion/vote separation + host phase
  control. Blur the same photo, deliver the derivative only, and allow direct skip
  to voting. Outcome and scoring still require decisions.

All five retain one shared nickname session, one randomly selected fixed host, one
item per person for the selected game, newcomers waiting for the next game, fresh
game scores, retained uploads, and mandatory automatic final rankings with shared
winners. No reference authorizes changing those rules. Voice/Chat points,
self-judging, missing votes, game finishing conditions, Quiz precision/timers/edits,
and Impostor outcome rules remain explicitly unresolved.

## Consequence for the two visual directions

The written [concept proposal](UI_CONCEPTS.md) contains the screen map, token systems,
ASCII layouts, motion plan, and unresolved decisions. The [local HTML gallery](../ui-concepts/index.html) now provides reviewable mockups
following this research, with its scope and exports in the [review plan](UI_REVIEW_PLAN.md).

- **Pocket Prints:** bright blue photo-envelope language with one stable print frame,
  condensed display type, and a receipt-like submitted state. Use the players' content
  for personality; keep collage decoration away from clues.
- **After Hours:** a plum viewing room, lilac task panel, broad media aperture, and
  restrained reveal. Let suspense come from concealed answers and shared reactions,
  with sufficient contrast for ordinary phone use.

Recommendation: begin with Pocket Prints for the party setting, using the same
interaction contract for either direction. No interface or animation is selected as
a confirmed game rule, and nothing has been deployed.
