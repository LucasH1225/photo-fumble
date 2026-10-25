# Photo Fumble — Product Requirements Document

**Status:** working PRD for the hackathon demo.  
**Prepared:** 24 October 2026.  
**Delivery goal:** all five modes playable for the same-day demo.  
**Implementation status:** all five modes implemented; local persistence and a Supabase production adapter are included. The public deployment uses Render and private Supabase storage.

This PRD consolidates the original idea and the user's subsequent decisions. Later
decisions take precedence over the attached concept. **Confirmed** requirements are
agreed. The implementation defaults in section 7 were subsequently adopted for the demo.
See [the decision notes](GAME_DESIGN.md), [glossary](../GLOSSARY.md), and
[build plan](BUILD_PLAN.md).

## 1. Product and audience

Photo Fumble is a browser party game for friends to guess, explain, bluff, and discuss
memories using their own photos, recordings, and chat screenshots. Friends may play
together in person or join from different locations.

Groups create reusable rooms or join with a six-digit code and nickname. Each room
has its own session, players, uploads, and game state, with at least three connected
players needed to start a game. Players prepare one item for the chosen mode and play. A chosen host selects the next mode and controls progress.
Each mode is its own scored game and ends by automatically showing its final ranking.

## 2. Demo goals and boundaries

### Confirmed goals

- Make **Memory Quiz, Voice Detective, Chat Archaeology, Memory Bluff, and Memory
  Impostor** genuinely playable; all five are in scope.
- Support the complete path from joining through uploads, play, scoring, and results.
- Make the same game usable by people on separate devices and in separate locations.
- Keep setup consistent: one photo, recording, or screenshot per player when needed.
- Make host controls, private information, and the current activity understandable.
- Show the final ranking every time a mode finishes.

### Confirmed boundaries

- Separate reusable rooms with six-digit codes; groups can play simultaneously.
- Room codes do not expire or get reassigned. No accounts or cross-device identity recovery.
- Encryption is deferred: private storage is access-controlled and remains operator-accessible.
- One directly or randomly selected host, with host-controlled transfer and manual
  replacement by an active player when the host disconnects.
- Scores belong to the current game. No combined leaderboard across the five modes.
- No requirement to prepare a collection of material for all modes upfront.
- A shared photo library is an optional side feature, deferred from the required demo.
- Uploaded files stay stored after a game for now; no automatic end-of-game deletion.
- Every prepared item is used once in every mode; no configurable round-count screen.

### Recommended scope limits

Use uploaded recordings and ordinary playback initially. Built-in live voice chat,
AI grading, automatic transcription, and a native mobile app are not required by the
current brief. An in-person conversation or an existing group call can carry discussion.

## 3. Roles and terminology

- **Room:** a reusable group space entered using its six-digit code or invite link.
- **Session:** the gathering of players within one room who can play successive independent games.
- **Mode:** one of the five types of game available to the host.
- **Game:** one self-contained play of a mode with fresh scores and its own result.
- **Round:** a single guessing or voting cycle, such as one submitted photo. Avoid
  using this term to imply that the five modes form a fixed sequence.
- **Host:** controls mode selection and progress while remaining a player.
- **Uploader:** supplies the current photo, recording, or screenshot and its context.
- **Guesser:** responds to another player's material.
- **Impostor:** receives a blurred view while other players receive the clear photo.

The [glossary](../GLOSSARY.md) is the canonical vocabulary reference.

## 4. Shared experience requirements

| ID | Confirmed requirement |
| --- | --- |
| SH-01 | Players create or join a coded room using nicknames; rooms isolate all players, media, and game state. |
| SH-02 | Choose the first host directly or randomly. The host can transfer control; active players can replace an offline host. |
| SH-03 | The host chooses a mode; all participating players follow that choice. |
| SH-04 | Prepare material when entering the selected game, not for all five modes upfront. |
| SH-05 | Each player contributes one relevant item each time: one photo, recording, or chat screenshot. |
| SH-06 | New arrivals wait for the next mode/game and do not join the current game midway. |
| SH-07 | Fresh scores start with each game; accumulate points only within that game. |
| SH-08 | Finishing a game automatically displays its final ranking. The host cannot skip the ranking. |
| SH-09 | The highest score wins; players tied for the highest score share the win. |
| SH-10 | After results, the host can return everyone to the lobby, select another mode, or repeat a mode with fresh scores. |
| SH-11 | Keep uploaded files in storage after results for now. |
| SH-12 | Show synchronized countdowns during guesses, discussion, and ballots; the server advances expired stages and preserves deadlines through refresh/recovery. |

Required game integrity: a player must only receive the answers, roles, and image
version they are meant to know at that stage. Host controls do not require privileged
access to secret answers. A late arrival must not be counted as a current-game voter.

## 5. Mode requirements

### 5.1 Memory Quiz

**Purpose:** guess when a submitted photo was taken.

**Confirmed behavior**

1. Each player contributes a photo.
2. The uploader presents their own photo and sits out guessing on it.
3. Other players submit a date guess.
4. Rank guesses by closeness to the correct date.
5. Equally distant dates tie on accuracy, including dates on opposite sides of the
   correct date. Break these ties by faster submission.
6. Award points by rank: **3 for first, 2 for second, 1 for third, 0 for everyone else**.
   There is no furthest-guess penalty.
7. Add these points to that game's score and show its final ranking when complete.

**Example:** for a correct date of 10 June, guesses of 9 June and 11 June are equally
accurate; whichever was submitted faster ranks higher. A slower exact date still
beats a faster inaccurate date.

**Preparation:** uploader enters the correct full calendar date privately.

**Demo defaults:** whole calendar dates; absolute UTC day distance, then server receipt
order. First valid guess is final. The host opens guessing after preview; a 60-second
countdown closes it automatically, or the host can close it early. Date questions
only in this version.

### 5.2 Voice Detective

**Purpose:** infer the story or context behind a recording.

**Confirmed behavior**

1. Each player uploads one recording each time, following the same preparation pattern
   as a photo.
2. Other players listen and offer an explanation of the context.
3. Reveal the real context before judging the guesses.
4. Players vote on whether each explanation is close enough. The recording's uploader
   sits out that judging vote.
5. A simple majority accepts the explanation; an equal yes/no split rejects it.
6. This decision applies to each explanation. A tie rejecting one explanation does
   not invalidate everyone else's accepted explanations.
7. End with that game's final ranking.

**Adopted defaults:** short typed explanations; 1 point per accepted explanation;
uploader and explanation author sit out. The host can close with uncast votes
abstaining. More yes than no accepts; ties and empty ballots reject independently.

### 5.3 Chat Archaeology

**Purpose:** infer the context behind a chat excerpt whose speakers are hidden.

**Confirmed behavior**

1. Each player uploads one screenshot each time.
2. The profiles/identities of the two speakers are hidden, as in the original concept.
3. Other players explain what they think was happening.
4. Use the same judging rule as Voice Detective: reveal context, uploader sits out,
   majority accepts each explanation, and a tied vote rejects that explanation.
5. End with that game's final ranking and fresh scores for the next game.

**Adopted defaults:** manual rectangle masks flattened into stored pixels, with
uploader review/confirmation. One point for each accepted explanation. No self-judging
or uploader judging. Automatic identity detection is deferred.

**Recommended demo approach:** let uploaders crop or cover names and avatars before
sharing, and preview the exact screenshot others will see. The shared image must
actually omit those details; a temporary visual overlay is not a reliable redaction.

### 5.4 Memory Bluff

**Purpose:** identify the real story behind a photo while its storyteller tries to
make the false story believable.

**Confirmed behavior**

1. Each player contributes a photo with two story versions: exactly one true and one false.
2. The other players choose which story is true.
3. The storyteller earns **2 points per player fooled** into choosing the false story.
4. A guesser earns **1 point** for choosing the true story.
5. Reveal the truth, update this game's scores, and finish with the final ranking.

**Example:** if three players choose the false story, the storyteller earns six points.
Each player choosing the true story earns one point.

**Needed preparation:** record the true/false designation privately. Choice presentation
must not reveal the answer through labels or ordering conventions.

### 5.5 Memory Impostor

**Purpose:** identify the player describing a photo from an incomplete view, while
that player tries to infer the photo and avoid detection.

**Confirmed behavior**

1. Uploaded photos are the main path. A shared library is optional and deferred.
2. Most players see the same clear photo; one impostor sees a **blurred version of the
   same photo**, rather than an unrelated photo.
3. The blur preserves rough shapes, colours, and some features, while making the
   subject hard to identify. Validate the strength visually during implementation.
4. Players can describe the photo in turn. One turn each is the suggested default.
5. The **host controls a skip-to-vote button**. The group can discuss aloud and move
   directly to voting without completing a required on-screen speaking sequence.
6. The discussion skip cannot bypass the mandatory final ranking.

**Adopted defaults:** every uploaded photo once, randomly ordered; independently shuffle
participants for balanced roles (each is impostor once). The uploader may be impostor,
as explicitly chosen. One suspect vote per player; no self-votes. A unique top suspect
who is the impostor is caught, earning each regular player 1. Otherwise the impostor
earns 2; tied/no votes mean escape. No final rescue guess.

Required game integrity: deliver a genuinely blurred derivative to the impostor.
Sending the clear image and only applying a visual blur would reveal the original.

## 6. Screen and interaction coverage

The UI design must cover these states, with host/player differences where needed:

1. Nickname entry and the shared waiting area.
2. Host mode selection and player waiting state.
3. One-item upload, preview, required private context, and preparation progress.
4. Mode-specific play: date entry, audio playback, chat context guesses, story choices,
   and private clear/blurred photo views.
5. Judging or suspect voting, with a clear submitted/waiting state.
6. Answer/context reveal and the score earned for that item.
7. Automatic final ranking, shared winners, and next-mode selection for the host.
8. Late-arrival waiting, upload failure, lost connection, and reconnecting states.

Recommended UI qualities: readable phone and desktop layouts, large touch targets,
keyboard access, visible focus, understandable audio controls, and reduced-motion
support. Keep game instructions in ordinary player language. Do not expose hosting
or storage configuration in player flows.

Animations should clarify a reveal, a vote locking, or the final ranking. They must
not delay participation or expose private content. A flashy effect is not a substitute
for a readable state change.

## 7. Adopted implementation defaults

These defaults were adopted in the implementation plan. They resolve the earlier
interview gaps and are implemented by the server.

| Area | Adopted behavior |
| --- | --- |
| Nicknames and identity | Guest browser identity with a nickname; no account-registration screen for the demo. |
| Minimum players | Three connected participants in all five modes. |
| Starting the session | Any joined player can choose a connected host directly, or request random selection once three are connected. Starting a game requires three connected players. |
| Finishing a game | Use each participant's one item once in all five modes; automatic final rankings. |
| Subjective answer input | Short typed explanations; discussion can happen in person or on a separate call. |
| Voice/Chat points | One point for each accepted explanation; zero for a rejected explanation. |
| Self-judging | Exclude both uploader and explanation author; with three players, one eligible judge decides each explanation. |
| Judging completion | Each explanation has a fresh 30-second ballot. Timeout or host-controlled close treats uncast votes as abstentions. Require more yes than no, and reject an explanation with no votes. |
| Impostor selection | Shuffle all photos and participants independently; each is impostor once; uploader remains eligible. |
| Impostor outcome and points | Unique top suspect catches actual impostor: regulars +1 each; otherwise impostor +2, including ties/no votes. |
| Round timing | 60-second guesses (90 seconds in Voice), 60-second Impostor discussion, and 30-second ballots. The server advances expired stages; missing guesses get zero. Preparation, Quiz preview, reveals, and results are untimed. |
| Quiz timing | Whole dates, UTC day distance then server receipt order; first guess final, 60-second guessing countdown. |
| Refresh and host departure | Recover cookie identity and the original deadline. The host can pass control, or active players can manually replace an offline host. Waiting newcomers cannot host an active game. |
| Upload limits | JPEG/PNG/WebP inputs up to 10 MB; MP3/M4A/WAV up to 20 MB and 60 seconds. |

## 8. Demo acceptance criteria

- Three and four separate browser identities can complete all five modes in one room while another group plays independently.
- All five modes have playable submission, interaction, scoring, and results paths
  using the adopted scoring defaults above.
- A non-host cannot select the mode or trigger the host's skip-to-vote action.
- Each player can provide one relevant item, see a preview, and recover from a failed upload.
- A late arrival cannot guess or vote in the active game and can participate in the next one.
- Quiz accuracy outranks speed; speed breaks equal-distance ties; points are 3/2/1/0.
- Bluffing three players earns the storyteller six points; a true-story guess earns one.
- Voice and Chat judging exclude the uploader; a 2–2 judging split rejects only that
  explanation, while a 3–1 split accepts it.
- The impostor receives only their permitted blurred view before the reveal.
- Every completed game automatically displays a final ranking, tied highest scores
  share the win, and starting again resets the game score.
- Uploaded files remain available in storage after the game as agreed.

## 9. Build and design handoff

Use [BUILD_PLAN.md](BUILD_PLAN.md) for architecture and verification.
Use [UI_HANDOFF.md](UI_HANDOFF.md) for UI work, together with the completed
[research comparison](UI_RESEARCH.md). UI inspiration must adapt to this PRD: room-code flows, combined rankings,
host rotation, and compulsory speaking turns must not return merely because another
product uses them.

The selected deployment is one small paid Render server plus Supabase Free for
private media and durable database state. Implementation does not provision paid
resources. Follow [DEPLOYMENT.md](DEPLOYMENT.md) to configure owner accounts.
