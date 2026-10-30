# Photo Fumble — UI research and recommendations

> Historical design/research snapshot. The 25 October room-code update supersedes
> earlier single-lobby restrictions. Current behavior is defined in [PRD.md](PRD.md).

**Research date:** 24 October 2026.  
**Coverage:** twelve distinct products across quizzes, party games, guessing, voting,
and photo viewing. Jackbox is counted once, although two of its games are discussed.

**Research-first follow-up:** [the refreshed feature-first synthesis](UI_RESEARCH_SYNTHESIS.md)
rechecks screens and motion evidence and adds SongPop for audio guessing, bringing
the combined coverage to thirteen products. It explains the UI details, what to
adapt for each of our five modes, and which appealing animations are observed,
documented, or proposed. The original twelve-product comparison is retained below.

The quiz product mentioned in the conversation was likely **Quizizz, now Wayground**.
The rename and retained old links are confirmed by its
[official explanation](https://help.wayground.com/support/solutions/articles/158000403867-quizizz-is-now-wayground-what-s-changing-and-what-s-not).

This report studies actual interaction screens, official screenshots, tutorials, and
publisher footage. It does not equate a marketing homepage with the game's UI. No
account was created, stranger's session joined, or personal content uploaded.
The research is a design reference, not a comparative popularity ranking.

**Evidence:** observed screens establish layout; observed footage establishes the
sequence shown; official descriptions establish documented features. None establishes
unmeasured animation timing or a complete hands-on test of the current signed-in app.
All Photo Fumble adaptations below are proposals, not new confirmed game rules.

## 1. Analyze our game before choosing references

Photo Fumble combines three jobs: a personal-media viewer, a synchronized party game,
and a voting/judging interface. Its challenge is helping someone know what to do now,
what stays private, and why they are waiting.

| Our feature | UI problem to solve | Best reference family |
| --- | --- | --- |
| One shared session and nicknames | Join quickly; recognize friends; show the fixed host and waiting newcomers. | Party-game lobbies and quiz guest entry. |
| Five selectable modes | Explain the action and required media without a large settings dashboard. | Blooket and Gimkit mode selection. |
| One uploaded item each | Keep selection, preview, private context, and readiness obvious. | Photo viewing plus group participation indicators. |
| Memory Quiz | Date input, locked guess, accuracy-versus-speed explanation, clear awarded points. | Wayground, Kahoot, Blooket, GeoGuessr. |
| Memory Bluff | Equal-looking story choices, hidden truth, reveal of whom a lie fooled. | Jackbox/Fibbage. |
| Voice Detective and Chat Archaeology | Media, short explanation, real context, then majority judging. | Mentimeter and Slido. |
| Memory Impostor | Private clear/blurred views, discussion, host-controlled skip, suspect voting. | Among Us. |
| Independent game results | Automatically show every player's final rank and score, including shared winners. | Wayground personal result, Kahoot scoreboard, Slido finale. |

The user's requirements take precedence over references. Keep one shared session,
fresh scores for each game, a fixed host, and mandatory automatic results. Do not copy
room codes, a cross-mode total, compulsory speaking completion, or a required shared
library into the demo.

## 2. Twelve-product comparison

### Live quizzes and rankings

| Product | UI design idea and strong feature | What to adapt for Photo Fumble | Motion evidence |
| --- | --- | --- | --- |
| **Wayground / Quizizz** | Explicit answering, submitted/waiting, and personal-summary states. The final summary separates accuracy, score, and rank. | A personal result card next to the full group ranking; distinguish date accuracy from awarded rank points. [Official result guide](https://help.wayground.com/support/solutions/articles/158000404051-understand-how-accuracy-is-measured-on-wayground). | A teacher-led demonstration GIF was inspected; visual effects such as confetti and Qbit are documented, with choreography unverified. |
| **Kahoot!** | Large, visually distinct answer targets, shared response distributions, and readable score rows. Identity and score are easy to scan. | Strong voting targets and a deliberate reveal; show the entire small group rather than only a top-five summary. [Host and results flow](https://support.kahoot.com/hc/en-us/articles/360039900153-Tips-for-hosting-a-live-game). | Animated characters, reactions, and final celebrations are officially documented in 2026 release notes; specific playback was not tested. |
| **Blooket** | Mode selection explains the selected activity; guest nicknames and visible waiting players keep entry light. Classic footage shows answer → response summary → standings. | Five recognizable mode choices, preparation counts, and standings that explain why someone ranked higher. [Hosting screens](https://help.blooket.com/hc/en-us/articles/15984215236503-How-to-Host-a-Blooket-Game). | An official Classic walkthrough was observed. It verifies the sequence and changing timer, not precise transition effects. |
| **Gimkit** | Illustrated mode cards with a clear selected state; end-of-game examples distinguish an immediate score table from detailed reports. | A compact mode picker and readable results, without an educational analytics dashboard. [Hosting](https://help.gimkit.com/en/article/host-a-live-game-g4n2cd/), [results example](https://help.gimkit.com/en/article/game-reports-szolh5/). | No UI motion was observed. Movement in its games is not evidence of a leaderboard animation. |

Detailed screens, sources, and caveats: [quiz-product research](research/quiz-products.md).

### Party games, bluffing, and private roles

| Product | UI design idea and strong feature | What to adapt for Photo Fumble | Motion evidence |
| --- | --- | --- | --- |
| **Jackbox Games — Fibbage / Quiplash** | Private choices lead into a shared reveal. Fibbage's selection and reveal screens make the lie's author and fooled voters legible. | Memory Bluff's best reference: equal story choices, then truth, author, fooled friends, and the explicit points earned. [Fibbage gallery](https://www.jackboxgames.com/games/fibbage-4). | Selection/reveal screenshots were inspected. Specific score-counting or reveal timing was not observed. |
| **Gartic Phone** | Anonymous nickname entry, illustrated mode explanation, one contribution per person, and a collective reveal. | Friendly entry, simple preparation, and a satisfying media recap. [Public interface](https://garticphone.com/), [developer mode guide](https://medium.com/gartic/the-ultimate-gartic-phone-guide-all-modes-explained-805404f94948). | Automatic tutorial changes were observed. Its user-created Animation mode is documented, not a tested UI transition. |
| **skribbl.io** | The central task is obvious: one person presents while others guess. Public entry is compact and visually tied to drawing. | One dominant media stage and one primary action, followed by a clear locked/waiting state. [Official interface and rules](https://skribbl.io/). | Public tutorial cycling was observed; match and winner animations were not tested. |
| **Among Us** | Secret roles, discussion, and voting are distinct activities. Recognizable player identities persist through them. | Separate private viewing, discussion, and suspect voting; show vote participation without leaking choices. [Official game](https://www.innersloth.com/games/among-us/), [lobby UI update](https://www.innersloth.com/a-match-made-in-update-16-0-0-emergency-meeting-40/). | A settings animation is developer-described; ejection and role-reveal choreography were not verified here. |

Detailed screens, sources, and caveats: [party-product research](research/party-products.md).

### Guessing, audience voting, and photo viewing

| Product | UI design idea and strong feature | What to adapt for Photo Fumble | Motion evidence |
| --- | --- | --- | --- |
| **GeoGuessr** | A guess becomes understandable when placed against the truth; publisher footage shows a map result with positions, connecting line, scores, and distance labels. | Explain the gap between guessed date and real date with a small timeline. Keep our rank-based points rather than copying distance scoring. [Publisher gameplay](https://store.steampowered.com/app/3478870/GeoGuessr_Steam_Edition/). | Official edited footage was inspected; it is not proof of a particular current web transition or animated map route. |
| **Mentimeter** | A simple mobile task is separated from presenter controls. Participation counts remain available while results are hidden. | Show “4 of 6 guesses submitted” or eligible votes received, without showing which answer is leading. [Hidden-results guide](https://help.mentimeter.com/en/articles/422266-hide-or-show-results). | The inspected winner screen includes static confetti; that does not verify confetti motion. |
| **Slido** | Explicit open-vote, close-vote, reveal, and next stages; final quiz rankings can appear automatically. | Clear host progression and a shared final result, while retaining a full small-group ranking on each player's device. [Official workflow](https://community.slido.com/interactive-poll-types-210/create-and-run-a-quiz-538). | The official workflow GIF was inspected changing between lobby, question, and closed-result states. Exact animation easing was not measured. |
| **Google Photos** | A large image dominates; secondary operations are quiet. Familiar upload and preview conventions minimize preparation work. | Keep the original media stable, provide a preview and replace action, and hide date/location metadata until reveal. [Browser uploads](https://support.google.com/photos/answer/6193313?co=GENIE.Platform%3DDesktop&hl=en), [photo-view examples](https://support.google.com/photos/thread/354436763/photo-view-redesign-light-mode-%E2%80%9Cadd-to%E2%80%9D-menu-photo-stacks-and-badges?hl=en). | Cinematic Photos' depth/parallax is officially documented, not directly tried. It is a media effect rather than a general interface transition. |

Detailed screens, sources, and caveats:
[media/voting research](research/media-voting-products.md).

## 3. The strongest ranking direction

Use **Wayground's personal outcome plus Kahoot's readable score rows**, with Slido's
automatic finale as a flow reference. This is a synthesis proposal, not a screen copied
from one product.

- Keep the completed mode's name visible: “Memory Bluff — final ranking”.
- Show the winner prominently, then the full ordered friend group.
- Give tied winners equal treatment rather than inventing another tie-breaker.
- Make the current player's name and score easy to find, including below the top three.
- Explain the score with relevant details: date rank, true stories found, or friends fooled.
- Give the host a next-mode action after results have appeared; others see a clear
  waiting state. Do not add an overall total across games.

An inspected Kahoot scoreboard illustrates readable avatar/name/score rows. Its
top-five limit is not a Photo Fumble requirement:

![Kahoot official scoreboard reference](https://support.kahoot.com/hc/article_attachments/38926515778323)

[Source: official hosting/results guide](https://support.kahoot.com/hc/en-us/articles/360039900153-Tips-for-hosting-a-live-game).

## 4. Animation and reveal ideas worth studying

### Best verified workflow reference: Slido

The official GIF makes the host's state changes visible: joining, accepting answers,
closing voting, and showing results. Its strength is understandable cause and effect,
not decoration. Use that principle for our host-controlled discussion-to-vote change.

![Slido official quiz workflow demonstration](https://uploads-eu-west-1.insided.com/slido-en/attachment/1b64a161-2baf-41ac-85af-7dbfeb25fe2a.gif)

[Official tutorial and GIF source](https://community.slido.com/interactive-poll-types-210/create-and-run-a-quiz-538).

### Most relevant dramatic payoff: Jackbox's bluff reveal

The inspected screens reveal an answer's author and the people who selected it. That
is a strong *interaction sequence* for our game. A proposed Photo Fumble animation
could reveal the true story, then the fooled friends, then the storyteller's points.
The specific motion is our proposal; no Jackbox timing was verified.
[Official Fibbage screens](https://www.jackboxgames.com/games/fibbage-4).

### Notable documented effects

- **Kahoot's animated characters and podium celebrations:** a useful celebration
  reference, documented in [official 2026 release notes](https://support.kahoot.com/hc/en-us/articles/32601683697053-New-Kahoot-features-and-updates).
  Borrow a small moment of celebration rather than building a character system.
- **Google Photos' Cinematic Photos:** an impressive documented depth/parallax idea,
  explained by [Google Research](https://research.google/blog/the-technology-behind-cinematic-photos/)
  and its [Create tools announcement](https://blog.google/products-and-platforms/products/photos/google-photos-create-tab-editing-tools/).
  It is not recommended for today's guessing stage: stable photos preserve clues and
  avoid extra processing. It could be a later post-reveal treatment.
- **Blooket's question-to-summary-to-standings rhythm:** observed in an
  [official linked Classic walkthrough](https://www.youtube.com/watch?v=3HaL1xWtAd4&t=421s).
  Borrow the clean progression and score explanation; exact modern effects remain unverified.

### Proposed motion for today's demo

Limit the first motion pass to an upload-ready confirmation, an answer-locked state,
a truth/context reveal, and a brief final ranking celebration. Keep settled results
readable and provide reduced-motion alternatives. An optional animation can be reduced
or skipped; the final ranking screen itself must still appear.

Never use a clear-photo-to-blur transition on the impostor's device if that requires
sending the clear original first. Private-role correctness takes precedence over a
visual flourish.

## 5. Recommended UI design principles

1. **Make the memory the main object.** Use the photo, screenshot, or recording as the
   focal content, with quiet supporting controls. Google Photos is the strongest media
   hierarchy reference; the task clarity of skribbl supports it.
2. **Keep one clear action per phase.** Upload, lock a guess, choose a story, judge an
   explanation, or vote for a suspect. Do not present every tool on one dense screen.
3. **Show progress without spoilers.** Counts answer why the group is waiting; hidden
   answers and provisional vote tallies preserve independent decisions.
4. **Separate authority from secrets.** Host-only controls concern progress, not access
   to hidden answers or roles. The same player may be a host and a guesser.
5. **Explain rewards.** “3 fooled × 2 = 6 points” is more useful than a decorative score
   jump. In Memory Quiz, date accuracy determines rank and speed only breaks ties.
6. **Use one family across all modes.** Keep navigation, identities, media framing,
   waiting states, and results consistent. Change the mode-specific task and a limited
   accent or illustration, rather than teaching five separate interfaces.

## 6. What not to import

These references are inspiration for interactions, not a request to reproduce their
branding or complexity. Exclude school analytics, currencies, shops, large avatar
systems, matchmaking, public room browsers, and mandatory shared-TV play from the
required demo. Avoid Google Photos' visible date/location header before a quiz reveal.
Avoid quiz point meters that imply speed always changes the score.

Our five standalone games, fixed host, one-item uploads, late-arrival waiting, retained
files, and automatic rankings remain the requirements. The research does not settle
open Voice/Chat point values or Memory Impostor victory/scoring rules.

## 7. Next UI work

Produce a screen/state map and two visual directions using [UI_HANDOFF.md](UI_HANDOFF.md).
Discuss those directions in the main chat before committing to one. Include the five
mode tasks and representative host/player/waiting states; do not start by designing
only a marketing homepage.

The complete evidence reports are:

- [Wayground, Kahoot, Blooket, Gimkit](research/quiz-products.md)
- [Jackbox, Gartic Phone, skribbl.io, Among Us](research/party-products.md)
- [GeoGuessr, Mentimeter, Slido, Google Photos](research/media-voting-products.md)
