# Photo Fumble: live quiz product UI research

Researched on 24 October 2026. This is a design reference report, not a specification change. It prioritizes actual game, player, waiting, and results screens over marketing pages. All recommendations below are proposals for Photo Fumble.

## 1. What Photo Fumble needs before borrowing patterns

The agreed product is a social memory game, rather than a classroom assessment tool. The research is evaluated against [the agreed game design](../GAME_DESIGN.md) and these conversation decisions:

- All five modes must work: Memory Quiz, Voice Detective, Chat Archaeology, Memory Bluff, and Memory Impostor.
- One shared online session; guest nicknames; no room-code step. Players may be together or remote.
- One randomly selected host stays host, chooses modes, and controls progression. Memory Impostor has a host-controlled shortcut from discussion to voting.
- A selected mode is its own scored game. Its final ranking appears automatically and cannot be skipped; scores do not carry into the next game.
- Each player supplies one relevant item each time: photo, recording, or screenshot. Preparation happens for the selected game, rather than all five modes upfront.
- Memory Quiz ranks by date accuracy, then speed to break equal-accuracy ties. Memory Bluff uses true/false-story choices. Voice Detective and Chat Archaeology need explanation judging through group votes. Memory Impostor needs private clear/blurred image views and a suspect vote.

Consequently the useful screen anatomy is: **media or prompt → the current player's action → confirmation/waiting → shared reveal/judging → score change → final ranking**. A player’s phone needs enough context to play remotely. The host needs status and progression controls without gaining access to secret roles or answers.

## 2. Evidence and access boundaries

- **Observed screenshot:** a first-party help-center illustration was opened and visually inspected. It establishes layout, not motion or current production behavior.
- **Observed video:** a first-party walkthrough was played and sampled. It establishes the sequence visible in that recording, not an assertion that every current mode behaves identically.
- **Documented:** official product/help text describes the feature. Motion mentioned here is not presented as directly observed unless stated.
- **Proposed:** an adaptation for Photo Fumble, not a claim about the researched product.

No account was created, no stranger’s game was joined, and no content was uploaded or published. Public help centers supplied the reference screens. Some references retain older branding or footage; those limits are called out below. Exact animation durations, easing, and full mobile behavior were not measured.

## 3. Wayground, formerly Quizizz

**Naming verified:** Quizizz has been renamed **Wayground**; its official migration note says existing accounts and links continue to work. Older screenshots in current help articles may still say Quizizz. [Official naming explanation](https://help.wayground.com/support/solutions/articles/158000403867-quizizz-is-now-wayground-what-s-changing-and-what-s-not)

### Actual screen references

| Reference inspected | What is visible | Useful design idea |
| --- | --- | --- |
| [Live host dashboard screenshot](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/158003329072/original/8ZlbnOVFQ6lChxgpCIk3LaKWAxsb3Zs9Qg.png?1762325445=) | A themed background, top control strip, participant count, rank/name/score rows, and compact response bars. The screenshot has legacy Quizizz branding. | Give the host one stable control area and a separate readable progress area. |
| [Player summary screenshot](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/158003329083/original/w3kHA759jT9RE3ciNjKIyGxD5rpJ6YODjw.png?1762325524=) | Personal identity card, an accuracy bar, separate rank and score tiles, and smaller performance statistics. | A player can find their own outcome immediately without searching a large leaderboard. |

The associated official guide distinguishes accuracy from the game score, and says the final student summary includes accuracy, score, and rank. This is a valuable separation of measures, although Photo Fumble does not need its educational analytics. [Accuracy and scores guide](https://help.wayground.com/support/solutions/articles/158000404051-understand-how-accuracy-is-measured-on-wayground)

### Features and ranking pattern

- Wayground supports both synchronized teacher-led progression and self-paced play. Its official teacher-led illustration shows a player moving into a submitted/waiting state while the host sees completion and the next-question action. [Live session modes](https://help.wayground.com/support/solutions/articles/158000404918-live-session-modes-on-wayground)
- Its settings can show a leaderboard after questions, control when answer correctness is revealed, and enable music or memes. [Session settings](https://help.wayground.com/support/solutions/articles/158000404930)

**Motion evidence:** the [teacher-led explanatory GIF](https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/158003076225/original/jFXBYyYMVlB50kGgMKXUBcCLpi7O0ezERw.gif?1761817004=) was observed changing from answer controls to submitted/waiting and host completion. It is a schematic demonstration, not a recording of production UI. Official settings documentation separately identifies confetti, correct/incorrect animations, and the Qbit character as visual effects disabled by the Serious Theme. Their exact choreography was not observed. [Visual-effects documentation](https://help.wayground.com/support/solutions/articles/158000404930)

**Photo Fumble adaptation:** use a clear “Answer submitted — waiting for the group” state, a compact host completion count, and a personal result card beside the full final ranking. For Memory Quiz show guessed date, distance from the true date, and points separately. Keep correct answers concealed until the agreed reveal stage. Avoid importing self-paced mode behavior or score-altering power-ups into this synchronized social game.

## 4. Kahoot!

### Actual screen references

| Reference inspected | What is visible | Useful design idea |
| --- | --- | --- |
| [Answer-results screenshot](https://support.kahoot.com/hc/article_attachments/38926500115219) | A large prompt at the top, answer-distribution bars in the middle, and large answer tiles below. Shapes and correctness marks accompany color. A host Next control is isolated in the upper corner. | Separate selecting an answer from understanding the group's choice distribution. Use labels/icons as well as color. |
| [Scoreboard screenshot](https://support.kahoot.com/hc/article_attachments/38926515778323) | Five large rows, avatar/name on the left, score on the right, a distinct leader row, and upward-movement indicators. | Make names, positions, and score deltas readable across the room. |

These are public first-party help images, not a live session entered for this research. They are useful structural references; newer character behavior is covered separately below.

### Features and ranking pattern

The official hosting guide describes a reveal of answer counts, then a top-five leaderboard, then a final podium. It also documents achievement messages for streaks or position gains. Each player sees their final score; players below fifth place do not receive a numerical position in that described podium flow. [Hosting and results guide](https://support.kahoot.com/hc/en-us/articles/360039900153-Tips-for-hosting-a-live-game)

**Motion evidence:** the September 2026 release notes officially document animated fullbody characters during lobby selection, live reactions, and final celebrations/podiums. This is **documented motion**, not directly observed animation playback in this study. No particular podium easing, confetti sequence, or duration is asserted. [Current official release notes](https://support.kahoot.com/hc/en-us/articles/32601683697053-New-Kahoot-features-and-updates)

**Photo Fumble adaptation:** borrow the deliberate pause for a shared reveal, large voting targets, redundant color/shape/text cues, and readable score rows. The reveal can show who selected the false story or how the group voted on an explanation. Photo Fumble should still show **every player's final rank**, rather than copying a top-five-only outcome. Give tied winners equal visual treatment. A small result celebration is a proposal, not a requirement to build a character system.

## 5. Blooket

### Actual screen and video references

| Reference inspected | What is visible | Useful design idea |
| --- | --- | --- |
| [Current help-center mode picker](https://help.blooket.com/hc/article_attachments/43256923173783) | A branded game-mode grid with a separate selected-mode information panel and one Host action. Details summarize complexity, skills, time, and player recommendations. | Five Photo Fumble modes can have recognizable illustrations and a concise “what you do” preview before selection. |
| [Host lobby screenshot](https://help.blooket.com/hc/article_attachments/43257284366231) | A strong invite region, player count, settings control, and obvious readiness/start area. | Show who's here and what remains before play. Photo Fumble needs the participant/readiness section, while its agreed single session does not need the code-heavy invite region. |
| [Official Classic walkthrough, from 7:01](https://www.youtube.com/watch?v=3HaL1xWtAd4&t=421s) | The sampled Classic segment shows a clean prompt, a four-tile player answer grid, a host response-distribution view with a visible timer, then standings with avatars, response times, and awarded points. | Expose the reason for a rank: Memory Quiz can show accuracy first and submission time only as the tie-breaker. |

The video was verified as a Blooket-channel walkthrough linked from [Blooket's official game-mode preview page](https://help.blooket.com/hc/en-us/articles/31616660563479-Blooket-Game-Mode-Previews). It is older footage, not proof of an unchanged October 2026 Classic screen. The currently published hosting article links the separately inspected mode-picker and lobby screenshots. [Current hosting guide](https://help.blooket.com/hc/en-us/articles/15984215236503-How-to-Host-a-Blooket-Game)

### Features and ranking pattern

Players can participate without accounts, enter a nickname, and choose a Blook while waiting. This makes the lobby participatory rather than an empty loading screen. [Official player-joining guide](https://help.blooket.com/hc/en-us/articles/16291522413975-How-to-Join-a-Blooket-Game)

Classic uses synchronized questions and a speed/accuracy competition; other modes attach different game mechanics to the questions. That distinction makes the mode picker meaningful rather than decorative. [Official mode descriptions](https://help.blooket.com/hc/en-us/articles/31616660563479-Blooket-Game-Mode-Previews)

**Motion evidence:** the sampled official Classic footage directly shows the question → response summary → standings sequence and a changing countdown. The samples establish changing game states, not a measured transition effect. No end-of-game podium animation was verified. The embedded YouTube player failed initially; the official linked video was viewed on YouTube instead. [Observed Classic segment](https://www.youtube.com/watch?v=3HaL1xWtAd4&t=421s)

**Photo Fumble adaptation:** keep nicknames and lightweight identity in the lobby; show each player's upload-ready state; use one visual identity per mode. Borrow the explainable standings, but preserve Photo Fumble's agreed accuracy-first ranking and 3/2/1 points. Do not add Blooket's currencies, collection economy, or luck-based score changes to the hackathon scope. The observed standings are **intermediate results**, not evidence for Blooket's final ranking behavior.

## 6. Gimkit

### Actual screen references

The public [hosting tutorial](https://help.gimkit.com/en/article/host-a-live-game-g4n2cd/) was inspected in the browser. Its illustrations visibly show large illustrated mode cards, a yellow selected-card border, a separate Continue step, and a 2D lobby with a prominent Start Game control and a player/spectator choice. The tutorial also documents separate mode-specific options and a compact game-controls panel for leaderboard, players, audio, and ending a game. Those control descriptions are **documented**, rather than interaction-tested here.

The public [game-reports guide](https://help.gimkit.com/en/article/game-reports-szolh5/) contains an inspected end-of-game illustration: a score table on the left, mode-specific stat cards on the right, and separate View Report and Back to Lobby actions over a dimmed game backdrop. This example is from a particular game, not a universal layout guarantee for every Gimkit mode.

### Features and ranking pattern

Gimkit’s picker uses descriptive mode labels and a Learn More option to help distinguish modes by the kind of experience they create. [Official mode-selection guide](https://help.gimkit.com/en/article/select-a-game-mode-6v16fo/)

Its results pattern separates the immediate game outcome from a more detailed report. The report offers participant, aggregate, and question-level views. [Official reports guide](https://help.gimkit.com/en/article/game-reports-szolh5/)

**Motion evidence:** no Gimkit UI animation was directly observed. The official Don't Look Down guide documents moving and jumping characters, including double jumps, but those are gameplay mechanics rather than verified leaderboard or celebration transitions. [Official game guide](https://help.gimkit.com/en/article/dont-look-down-1qptbif/)

**Access limitation:** direct navigation to a Crisp-hosted screenshot was blocked by the browser client. The same illustrations rendered inside the official help page and were inspected there. No account-gated game was entered.

**Photo Fumble adaptation:** distinguish modes with brief activity labels, retain an unmistakable selection state, and keep the player's task separate from host controls. Make the final ranking an automatic destination with a clear return-to-mode-selection path for the host. Personal stats can be modest and relevant: correct stories identified or people fooled. Elaborate 2D worlds and educational reports would obscure the shared memories and expand today's work.

## 7. Recommended design synthesis

These are proposed screen decisions informed by the references; they do not settle remaining game-rule gaps.

| Photo Fumble screen | Proposed design | Reference pattern |
| --- | --- | --- |
| Nickname / shared lobby | One nickname field; participants visible; a clear host badge; late arrivals told that they are waiting for the next game. | Blooket's guest flow and visible lobby identity. |
| Mode selection | Five illustrated choices in one family; selected-state border; one sentence explaining the action; host sees the start control and guests see the host's choice. | Blooket's mode detail panel; Gimkit's selected card and activity labels. |
| Preparation | One upload slot and preview; private answer/context fields for the relevant mode; visible ready/submitted count. | Proposed adaptation of the products' lobby/completion visibility; a group upload workflow was not observed in these products. |
| Date guessing | Photo remains prominent; accessible date entry; one clear submit action; submitted/waiting confirmation. | Wayground's explicit waiting state; Blooket's single-task player screen. |
| Story choice / suspect vote | Large labeled choices; visible selected state; final confirmation; no results or secret-role leakage while voting. | Kahoot's large redundant visual choices; adapted to Photo Fumble's secret information. |
| Explanation judging | Real context and one explanation readable together; clear Accept / Reject controls; uploader excluded; completion count visible. | Proposed flow; the reviewed products do not establish Photo Fumble's majority judging rule. |
| Reveal / score change | Show the real date/story/role and explain earned points; maintain media visibility. A brief score change can celebrate the result. | Kahoot's shared answer reveal; Blooket's explainable standings. |
| Final ranking | Automatically display all participants, personal rank and score, tied-winner treatment, and the mode/game name; host can choose another game after results appear. | Wayground's personal summary, Kahoot's readable rows, Gimkit's results-versus-return distinction. |

### Proposed motion budget for today's demo

Use motion only to explain a state change or celebrate a resolved result: a short upload-success confirmation, a submitted/waiting transition, a reveal, and a score/ranking update. Keep the full final ranking usable immediately, provide reduced-motion behavior, and never animate a secret image into a clear one on the impostor's device. These are design proposals; the research did not establish exact competitor timing or easing.

### Boundaries worth preserving

The shared photo, recording, or screenshot is the star. Host controls, waiting states, and rankings should reinforce that social interaction. Copying school dashboards, room-code workflows, character economies, or score power-ups would conflict with Photo Fumble's agreed scope. None of the reviewed sources resolves the remaining product decisions about exact game completion, subjective-answer points, or Memory Impostor scoring; those need their own rules.
