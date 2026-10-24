# Photo Fumble — agreed demo design

Decisions confirmed during the design conversation on 24 October 2026. This is the
concise decision record; the [PRD](PRD.md) adds functional requirements, examples, and
clearly marked proposals. All five modes are needed for the same-day hackathon demo.

- All five modes must be playable: Memory Quiz, Voice Detective, Chat Archaeology,
  Memory Bluff, and Memory Impostor.
- Everyone opening the demo joins one shared game session. There are no room codes
  or multiple simultaneous rooms in the demo.
- Players identify themselves with nicknames and may join from different locations.
- The first host is chosen randomly. That player remains host for the shared session; hosting
  does not rotate.
- The host controls the game's progress and chooses which mode to play next.
- New arrivals wait for the next mode/game instead of joining the current game midway.

## Agreed play flow

1. The host chooses a mode.
2. Players upload and prepare the material needed for that game. Memory Impostor can
   use uploaded photos too; a shared library is another possible source, not a requirement.
3. Everyone plays the selected mode. When it ends, its final ranking appears automatically.
4. The host chooses what to play next, including repeating the same mode if desired.

Prepare fresh material when starting another play. Do not require everyone to upload
material for all five modes before the game starts. There is no fixed sequence of modes.
Each prepared item is used once, in randomized order, in all five modes. There is
no configurable round-count screen in this version.
For photo-based modes, each player uploads one photo each time, not a large collection.
Voice Detective follows the same preparation pattern: each player uploads one recording
each time, not multiple recordings.

## Separate scoring for each mode

- Each play of a mode is a separate game with its own score and winner.
- Points accumulate within that game. Starting another mode, or playing again, starts
  fresh scores; points do not carry between games or modes.
- There is no overall leaderboard combining the five modes.
- The player with the highest score in that game wins. Players tied for the highest
  score share the win.
- Every mode automatically shows its final ranking when it ends. The host cannot skip
  this result or choose whether to reveal it.
- The game finishes automatically after every participant's prepared item has been used once.

## Memory Quiz — agreed rules

- Each player contributes a photo.
- The uploader presents their own photo while the other players guess; the uploader
  does not guess on their own photo.
- Date guesses are ranked by closeness to the correct date. Different guessed dates
  that are equally far from the correct date count as tied on accuracy.
- Break accuracy ties by submission speed: the faster submission ranks higher.
- Award points by rank, rather than calculating the point amount from the date gap:
  first place gets 3 points, second gets 2, and third gets 1.
- All other guessers receive 0 points. There is no furthest-guess penalty.

## Memory Bluff — agreed scoring principles

- Present one photo with exactly two story versions: one true and one false.
- The storyteller earns points for fooling other players into choosing the false story.
- The storyteller earns 2 points per player fooled.
- A guesser earns 1 point for correctly choosing the true story.

## Voice Detective — agreed judging rules

- Reveal the recording's real context before judging how close players' explanations
  were.
- Use a group vote to judge explanations, rather than the host deciding alone.
- The recording's uploader sits out the judging vote.
- A simple majority accepts an explanation. An equal split rejects it.
- The explanation's author also sits out judging. Each accepted explanation earns 1 point.
- Explanations are typed. The host can close a ballot with uncast votes abstaining;
  more yes than no accepts, while a tie or no votes rejects that explanation.

## Chat Archaeology — agreed setup and judging

- Each player uploads one chat screenshot each time.
- Hide speakers' identities with manual rectangle covers, flattened into the stored
  image pixels. The uploader reviews and confirms the sanitized preview.
- Other players guess the context. Reveal the real context before judging.
- Use the same judging rule as Voice Detective: the uploader sits out, a simple
  majority accepts an explanation, and an equal split rejects that explanation.
- An accepted explanation earns 1 point; uploader and explanation author cannot judge it.

## Memory Impostor — agreed setup

- Use uploaded photos as the main preparation path. A shared library is an optional
  side feature whose details are deferred; it is not required for the demo.
- Most players see the same clear photo. One impostor sees a blurred version of that
  same photo, rather than a different photo.
- The blur should preserve some rough features, shapes, and colours while making the
  subject hard to identify. Its strength needs visual review during implementation.
- Players can take turns describing the photo, with one description each as the
  suggested default before voting.
- The host controls a skip-to-vote button. It can move directly from discussion to
  voting without requiring every player to complete an on-screen speaking turn.
  This supports groups who discuss aloud and are ready to vote.
- The skip applies to discussion, not to the mandatory final ranking.
- Use all uploaded photos once. Shuffle photo order and independently shuffle role
  assignments so every participant is impostor once. The uploader is eligible too,
  as explicitly chosen by the user, even if they recognize their own photo.
- One suspect vote per player, no self-voting. A unique highest-voted actual impostor
  is caught: regular players earn 1 each. Otherwise the impostor earns 2. Ties/no
  votes mean escape. There is no additional rescue guess.

## Uploaded-file retention

- Keep uploaded material in storage after a game ends for now. Do not automatically
  delete it at the end of a mode or after a preset one-day period.
- Revisit retention and deletion if later scenarios require a different policy.

## Adopted demo defaults

- Four connected players minimum; once gathered, anyone requests the random host election.
- Full calendar dates and server receipt ordering in Quiz. First submissions are final;
  no countdown. The host opens guessing after preview and can close missing responses.
- Same-browser cookies restore identity after refresh. Host stays fixed; if lost,
  use the stopped-server operator reset. New arrivals wait, existing participants recover.
- Images: JPEG/PNG/WebP, 10 MB input; recordings: MP3/M4A/WAV, 20 MB and 60 seconds.
- Production: one small paid Render server plus Supabase Free for files and database.
  Accounts and paid resources have not been provisioned by implementation.
- Local file persistence is available for development without cloud credentials.

See [the deployment guide](DEPLOYMENT.md) for setup and stopping charges.

Terminology is recorded in [the glossary](../GLOSSARY.md).
