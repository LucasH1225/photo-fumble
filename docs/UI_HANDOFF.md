# Photo Fumble — UI handoff

> Historical design/research snapshot. The 25 October room-code update supersedes
> earlier single-lobby restrictions. Current behavior is defined in [PRD.md](PRD.md).

Use this brief for the UI agent working alongside the main chat, or as context in a
separate UI chat. The user wants to discuss design choices in the main conversation
while an agent researches and prepares UI work.

## Read first

1. [PRD](PRD.md): product requirements and explicitly proposed defaults.
2. [Game design](GAME_DESIGN.md): confirmed decisions.
3. [Glossary](../GLOSSARY.md): especially session versus game versus mode.
4. [UI research](UI_RESEARCH.md): the completed twelve-product comparison and motion evidence.
5. [Build plan](BUILD_PLAN.md): proposed architecture, not a chosen implementation stack.

## Product to design

A social memory party game, with real photos, recordings, and chat screenshots at the
centre of play. Design the joined-player experience, not a promotional landing page.

All five modes must fit one coherent interface: Memory Quiz, Voice Detective, Chat
Archaeology, Memory Bluff, and Memory Impostor. The strongest visual reference is the
players' own content and the suspense of guessing, voting, and revealing a memory.

## Requirements that inspiration must preserve

- One shared session and nicknames; no room-code entry or multiple-room dashboard.
- One randomly selected fixed host, with clear host/player control differences.
- One item per player each time; no compulsory album-building setup.
- A complete independent game for the selected mode, followed by a mandatory automatic
  final ranking. Fresh scores for the next game; no cross-mode total.
- Late arrivals wait for the next game.
- Voice Detective and Chat Archaeology share judging UI and rules; uploader excluded,
  majority accepts, tied judging votes reject that explanation.
- Memory Bluff uses two story choices; the storyteller gets two points per person
  fooled and a correct guess earns one.
- Memory Impostor uses a blurred version of the same photo, with a host-controlled
  skip-to-vote action and no required on-screen speaking completion.
- Shared-library browsing is an optional side feature, not a prerequisite screen.

## UI deliverables

1. A screen/state map covering the complete game, including host, uploader, guesser,
   impostor, and waiting-newcomer differences.
2. Two distinct visual directions grounded in memories and social play. Explain the
   proposed palette, typography, spacing, content treatment, and one characteristic
   interaction. Treat these as proposals for user discussion.
3. A representative flow through join, prepare, play/vote, reveal, and final ranking,
   shown on phone and desktop. Include examples from all five modes in the coverage.
4. A small motion plan identifying the trigger, purpose, and reduced-motion behavior
   of each proposed animation.
5. A list of unresolved product assumptions affecting the UI; preserve the PRD's
   confirmed/proposed distinction rather than silently inventing rules.

Use the frontend-design skill for the design process. Keep the media and player action
visually dominant; make each screen's current task and waiting state obvious. Use
plain action labels and clear error recovery. Avoid copying a generic quiz dashboard
or a reference product's branding.

## Research expectations

The user requested at least ten relevant popular products, including Quizizz/Wayground
as a possible ranking reference. The current comparison covers twelve products across
live quizzes, party games, photo/guessing, and audience voting.

For each product, analyze real interaction screens, valuable features, UI rationale,
and notable motion. Label motion as directly observed, officially documented, or a
proposed adaptation. Do not present an imagined animation as something inspected.
Public entry screens and official tutorials may not expose every logged-in state;
state those limits. Sources belong next to the relevant claims.

## Starter prompt for another chat

> Design the UI for Photo Fumble in this workspace. Read docs/PRD.md,
> docs/GAME_DESIGN.md, GLOSSARY.md, docs/UI_RESEARCH.md, and docs/UI_HANDOFF.md first.
> Use the frontend-design skill. Begin with a screen/state map and two visual
> directions for discussion, grounded in the research. Cover all five game modes and
> the actual player experience. Preserve independent scores and mandatory final
> rankings for each game, one fixed host, one shared session without room codes, and
> one upload per player. Clearly mark proposed defaults. Start with UI design and
> reviewable mockups; do not provision hosting or publish the website.
