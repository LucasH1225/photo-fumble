# Party-game UI references for Photo Fumble

Research date: 24 October 2026. This is one part of the wider product comparison. Jackbox is counted as one platform, even though Fibbage and Quiplash illustrate different interactions.

Evidence labels: **Observed UI** means a public interface or official gameplay screenshot was visually inspected. **Official description** means the developer explains the behaviour, but the interaction was not played here. **Proposal** means an adaptation for Photo Fumble, not a claim about the reference product.

No accounts were created, public player sessions joined, files uploaded, or game lobbies created. Public screenshots provide evidence about layout, not full animation timing or touch behaviour. Official game instructions and developer documentation take precedence over marketing-page styling.

## 1. Jackbox Games — Fibbage and Quiplash

**Most relevant to:** Memory Bluff; anonymous story choices; voting; dramatic reveal; host/player responsibilities.

**Official description.** Jackbox separates a shared presentation screen from phones used as controllers. The host launches the game; people gather in a lobby. Remote play commonly uses screen sharing. This is useful role separation, although Photo Fumble must show the necessary game content on each player's own device and does not need Jackbox's room-code step. [Official how-to-play](https://www.jackboxgames.com/how-to-play)

**Observed UI.** The Fibbage 4 official gallery contains actual selection and reveal screens. In selection, the question remains prominent above a set of strong, similarly styled answer strips. In reveal, a single answer becomes the focal point; its author is labelled, and small player avatars underneath indicate people who chose it. Abstract colour fields and cut-out illustrations give it a collage-like, theatrical identity. This is gameplay evidence, rather than a recommendation to reproduce Jackbox's store page. [Fibbage 4 gallery](https://www.jackboxgames.com/games/fibbage-4)

**Excellent feature.** Fibbage rewards both identifying truth and persuading other people to choose a lie. Its personal “Enough About You” variant shows how friends' own stories become the content. Quiplash demonstrates a simpler two-answer vote, with responses first composed privately on phones. [Fibbage personal mode](https://www.jackboxgames.com/blog/introducing-fibbage-enough-about-you), [Quiplash developer explanation](https://www.jackboxgames.com/blog/four-funny-games-for-funny-people)

**Motion evidence.** Selection and reveal screenshots were inspected; no complete live game or trailer was played. Do not claim specific score-counting, avatar, or reveal animation timing was verified. The compelling *design opportunity* is the transition from anonymous answers to revealed author and fooled voters.

**Proposal — adapt:** keep the photo visible while choosing between the two stories; give both stories equal visual treatment; after voting closes, reveal the truth and show the people fooled, followed by the explicit score breakdown: “3 fooled × 2 = 6.” Use one short reveal sequence rather than continuous background movement. Keep the fixed host's control separate from private answer information.

**Avoid:** requiring a separate shared TV or video stream, elaborate multi-question final stages, audience systems, and copying the highly specific Jackbox visual identity. Photo Fumble's subject is personal memories, so the players' media should carry more visual weight than decorative artwork.

## 2. Gartic Phone

**Most relevant to:** nickname entry; multiple modes; everyone contributing once; waiting for others; shared media reveal.

**Observed UI.** The public entry screen offers anonymous play with a character and nickname, a prominent Start action, and a separate illustrated how-to-play area. Its purple/pink illustrated environment communicates a casual party before any game content exists. The tutorial changed automatically between the voice-call and writing steps during inspection; this is verified cycling between tutorial states, not a measurement of transition smoothness. [Live public entry](https://garticphone.com/)

**Official description.** Gartic Phone alternates private contributions and eventually shows how a chain of drawings and interpretations changed. Its developer guide distinguishes modes by task flow and timing. The Score mode adds a final ranking to the familiar normal flow, while Animation mode converts contributed frames into a playback, with host-controlled frame exposure. These are product behaviours described by the developer, not sessions played during this research. [Developer's mode guide, updated March 2026](https://medium.com/gartic/the-ultimate-gartic-phone-guide-all-modes-explained-805404f94948)

**Excellent feature.** The payoff is the collective reveal of everybody's contribution. Explaining a mode through its activity and outcome is easier to understand than exposing many configuration controls first.

**Motion evidence.** Tutorial state cycling was directly observed. The collaboratively generated animation is officially documented, but was not watched here. It should not be represented as a verified example of interface animation.

**Proposal — adapt:** a lightweight nickname entry; a mode selector with one plain sentence and the required media type per mode; a preparation screen saying “Upload one photo” rather than presenting a media library; clear ready/waiting status; then a reveal that keeps the submitted media, guesses, and actual context together. A “Your upload is ready — waiting for 2 players” message should answer why a player cannot continue.

**Avoid:** proliferating presets, hidden timing rules, or requiring a voice service for colocated groups. The app can acknowledge that people talk aloud or use an existing call; it does not need to build a calling feature. Do not make an auto-advancing tutorial the only way to understand a mode; an explicit next control and readable rule text are safer adaptations.

## 3. skribbl.io

**Most relevant to:** zero-account entry; one presenter with simultaneous guessers; score visibility; a recognisable main activity.

**Observed UI.** The public screen puts a name field, language, avatar customisation, a large green Play action, and a secondary Create Private Room action together. A doodle-pattern background and hand-drawn graphics reinforce its drawing subject. Below, an illustrated tutorial cycles between selecting, drawing, guessing, and winning. Several states changed during inspection without entering a game. [Public interface and developer instructions](https://skribbl.io/)

**Official description.** Each turn assigns one person to draw a chosen word while the others guess for points; highest score wins at the end. The site's published update notes also describe mobile support, more avatar options, and owner moderation controls. The inspected page did not establish the precise current speed-scoring formula, so it is not evidence for a particular Photo Fumble scoring algorithm. [Official rules and update notes](https://skribbl.io/?locale=en_GB)

**Excellent feature.** The game's central verb is obvious: draw or guess. Its compact entry avoids onboarding that is longer than the activity.

**Motion evidence.** A cycling instructional illustration was seen; no match was joined, so no live drawing, score movement, or winner animation is claimed.

**Proposal — adapt:** one dominant media stage and one primary action for each phase. For Memory Quiz, put the date input and “Lock guess” directly below the photo; replace them with a locked confirmation after submission. Keep a compact player list showing who has answered, without exposing their answers. At reveal, show the actual date, accuracy rank, speed used only for ties, and awarded points. An animation should explain an answer becoming locked or a score changing.

**Avoid:** the public matchmaking branch, display advertising around the game, and a desktop-style dense multi-column play layout on small phones. Do not import chat as a substitute for the dedicated guess form or reveal private answers through chat-style messages.

## 4. Among Us

**Most relevant to:** Memory Impostor; private roles; discussion versus voting; player identity; confirmed phase changes.

**Official description.** Among Us gives randomly selected players a secret opposing role and lets players call meetings and vote to remove a suspect. The useful reference is asymmetric information followed by a shared decision, rather than its movement, tasks, or elimination mechanics. [Official game explanation](https://www.innersloth.com/games/among-us/)

**Observed UI.** The official 2025 interface update includes real lobby screenshots. Dark backgrounds, high-contrast outlines, recognisable character imagery, and one bright primary button make the currently available action legible. Advanced rules sit behind settings tabs or a details view. The entry confirmation makes host and session information explicit. [Official lobby UI screenshots](https://www.innersloth.com/a-match-made-in-update-16-0-0-emergency-meeting-40/)

**Excellent feature.** A historical developer meeting update explains that a voting notification was added to chat so people would not forget to vote while talking. This is evidence of the attention problem, not proof that the 2019 meeting layout is unchanged today. [Developer meeting update](https://itch.io/devlog/80272/improving-meetings-in-among-us-201957.amp)

**Motion evidence.** Innersloth explicitly describes an animation when the player-capacity setting increases. The accompanying static creation screen was inspected; the motion itself was not observed. No unverified claim is made about ejection or secret-role reveal animations.

**Proposal — adapt:** separate private viewing, discussion, and vote screens. During discussion, show the host-only “Skip to vote” action and an ordinary player's “Waiting for the host” state. During voting, use the same avatar/nickname combination as the lobby, require a deliberate selection/confirmation, and indicate how many votes remain without revealing choices before voting closes. For private media, offer a clear hide/reveal interaction so friends sitting together can protect their screen. The final result should identify the impostor and then automatically show the mode's ranking, as agreed.

**Avoid:** adding a lobby browser, map, cosmetics shop, persistent elimination, or a large settings menu. Do not let host status disclose secret roles. The blur must also be an actually restricted media rendition; the interface should not merely blur the clear image while distributing that clear original to the impostor.

## Recommendations across these four references

These are design proposals for Photo Fumble, not additional agreed requirements:

1. Make the media the visual centre. Present only the controls needed for the current phase.
2. Keep player identity stable across upload, answer, vote, reveal, and final ranking.
3. Distinguish “You have submitted,” “Waiting for other players,” and “Waiting for the host.” These are different reasons for waiting.
4. Use motion for the truth reveal, vote result, and rank change; respect reduced-motion preferences and retain readable settled results.
5. Keep anonymous choices visually equivalent. Reveal authorship after voting, with a transparent explanation of points.
6. Use the shared session and five standalone modes already agreed. Room codes, multiple rooms, and cross-mode accumulated scores from reference products are outside this demo's design.

## Access and confidence limits

- Gartic Phone and skribbl were inspected only before entering a game. Their gameplay analysis comes from official instructions; entry visuals and tutorial cycling were directly seen.
- Fibbage selection/reveal states were inspected in Jackbox's official screenshot gallery, not by playing the purchased product. Phone-controller behaviour comes from official how-to-play documentation.
- Among Us was assessed from current official product documentation and dated official screenshots. Its published March 2025 UI update is a concrete reference, not a guarantee that every screen remains identical in the October 2026 client.
- This research does not establish mobile tap-target sizes, keyboard accessibility, reduced-motion support, transition duration, network behaviour, or live scoreboard timing for these products. Such claims would require hands-on sessions.
