import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addPlayer,
  applyCommand,
  currentOwner,
  dateDay,
  expireRound,
  freshSession,
  mediaKeyFor,
  phaseKey,
  saveSubmission,
  viewFor,
} from '../server/engine.js';
import { MODES, type Command, type Mode, type Session } from '../shared/types.js';

function fixture(mode: Mode, count = 4) {
  const s = freshSession();
  const ids = Array.from({ length: count }, (_, i) => `p${i}`);
  for (const id of ids) addPlayer(s, id, id);
  const online = new Set(ids);
  s.hostId = ids[0];
  const act = (id: string, command: Command) => applyCommand(s, id, command, online);
  act(ids[0], { type: 'choose', mode });
  for (const id of ids) {
    saveSubmission(
      s,
      id,
      {
        id: `asset-${id}`,
        ownerId: id,
        gameId: s.game!.id,
        key: `${id}.webp`,
        blurKey: `${id}-blur.webp`,
        mime: 'image/webp',
      },
      {
        answer: mode === 'quiz' ? '2023-06-10' : 'The real context',
        falseStory: 'The invented context',
        redacted: true,
      },
    );
  }
  act(ids[0], { type: 'start' });
  const owner = currentOwner(s.game!);
  return { s, ids, act, online, owner, others: ids.filter((id) => id !== owner) };
}
test('calendar dates are UTC whole days and invalid dates are rejected', () => {
  assert.equal(dateDay('2024-03-01') - dateDay('2024-02-28'), 2);
  assert.throws(() => dateDay('2023-02-29'));
  assert.throws(() => dateDay('10 June 2023'));
});
test('initial random host selection needs three players; only the host can reroll while online', () => {
  const s = freshSession();
  ['a', 'b', 'c', 'd'].forEach((id) => addPlayer(s, id, id));
  assert.throws(() => applyCommand(s, 'a', { type: 'elect' }, new Set(['a', 'b'])));
  const online = new Set(['a', 'b', 'c']);
  applyCommand(s, 'a', { type: 'elect' }, online);
  assert.ok(s.hostId && online.has(s.hostId));
  const guest = [...online].find((id) => id !== s.hostId)!;
  assert.throws(() => applyCommand(s, guest, { type: 'elect' }, online));
  applyCommand(s, s.hostId, { type: 'elect' }, online);
  assert.ok(s.hostId && online.has(s.hostId));
});

test('players can select an initial host, transfer control, and recover an offline host', () => {
  const s = freshSession();
  ['a', 'b', 'c', 'offline'].forEach((id) => addPlayer(s, id, id));
  const online = new Set(['a', 'b', 'c']);
  assert.throws(() => applyCommand(s, 'a', { type: 'setHost', targetId: 'offline' }, online));
  applyCommand(s, 'a', { type: 'setHost', targetId: 'b' }, online);
  assert.equal(s.hostId, 'b');
  assert.throws(() => applyCommand(s, 'a', { type: 'setHost', targetId: 'a' }, online));
  applyCommand(s, 'b', { type: 'setHost', targetId: 'c' }, online);
  assert.equal(s.hostId, 'c');
  online.delete('c');
  applyCommand(s, 'a', { type: 'setHost', targetId: 'a' }, online);
  assert.equal(s.hostId, 'a');
});

test('active host transfers preserve the game and exclude waiting newcomers', () => {
  const { s, act, online } = fixture('bluff');
  const game = structuredClone(s.game);
  addPlayer(s, 'Late friend', 'late');
  online.add('late');
  assert.throws(() => act('p0', { type: 'setHost', targetId: 'late' }));
  online.delete('p0');
  assert.throws(() => act('late', { type: 'setHost', targetId: 'late' }));
  act('p1', { type: 'setHost', targetId: 'p1' });
  assert.equal(s.hostId, 'p1');
  assert.deepEqual(s.game, game);
  assert.throws(() => act('p0', { type: 'close' }));
  act('p1', { type: 'close' });
  assert.equal(s.game!.phase, 'reveal');
});

test('back to lobby is available to the host after results and retains players and uploads', () => {
  const { s, act, ids } = fixture('bluff');
  assert.throws(() => act('p0', { type: 'lobby' }));
  ids.forEach((_, i) => {
    act('p0', { type: 'close' });
    if (i < ids.length - 1) act('p0', { type: 'next' });
  });
  assert.throws(() => act('p1', { type: 'lobby' }));
  const assets = structuredClone(s.assets);
  act('p0', { type: 'lobby' });
  assert.equal(s.game, undefined);
  assert.equal(s.hostId, 'p0');
  assert.equal(Object.keys(s.players).length, ids.length);
  assert.deepEqual(s.assets, assets);
  assert.equal(viewFor(s, 'p1', new Set(ids)).game, undefined);
  act('p0', { type: 'choose', mode: 'quiz' });
  assert.ok(Object.values(s.game!.scores).every((score) => score === 0));
});

for (const mode of MODES.filter((mode) => mode !== 'impostor')) {
  test(`${mode}: deadlines advance active stages once and reset for each item`, () => {
    const { s, online } = fixture(mode);
    const g = s.game!;
    const now = 1_000;
    delete g.deadlineAt;
    if (mode === 'quiz') {
      assert.equal(expireRound(s, now), false);
      applyCommand(s, 'p0', { type: 'open' }, online, now);
    } else {
      // A saved game from before timers gets a fresh deadline on recovery.
      assert.equal(expireRound(s, now), true);
    }
    assert.equal(g.deadlineAt, now + (mode === 'voice' ? 90_000 : 60_000));
    const deadline = g.deadlineAt!;
    assert.equal(viewFor(s, 'p0', online).game?.deadlineAt, deadline);
    assert.equal(expireRound(s, deadline - 1), false);
    assert.equal(expireRound(s, deadline), true);
    assert.equal(g.phase, 'reveal');
    assert.equal(g.deadlineAt, undefined);
    assert.equal(g.results.length, 1);
    assert.equal(expireRound(s, deadline + 1_000_000), false);
    assert.equal(g.results.length, 1);
    applyCommand(s, 'p0', { type: 'next' }, online, deadline + 2_000_000);
    assert.equal(g.phase, mode === 'quiz' ? 'preview' : 'guess');
    assert.equal(
      g.deadlineAt,
      mode === 'quiz' ? undefined : deadline + 2_000_000 + (mode === 'voice' ? 90_000 : 60_000),
    );
  });
}

test('expired guesses are rejected; submitted guesses score normally on timeout', () => {
  const { s, act, others, online } = fixture('quiz');
  act('p0', { type: 'open' });
  const deadline = s.game!.deadlineAt!;
  applyCommand(s, others[0], { type: 'guess', value: '2023-06-10' }, online, deadline - 1);
  assert.throws(
    () => applyCommand(s, others[1], { type: 'guess', value: '2023-06-10' }, online, deadline),
    /time is up/i,
  );
  expireRound(s, deadline);
  assert.deepEqual(s.game!.results[0].awards, { [others[0]]: 3 });
});

for (const mode of ['voice', 'chat'] as const) {
  test(`${mode}: every explanation gets its own voting deadline, with abstentions on timeout`, () => {
    const { s, others, online } = fixture(mode);
    const now = Date.now();
    for (const id of others)
      applyCommand(s, id, { type: 'guess', value: `Explanation from ${id}` }, online, now);
    const g = s.game!;
    assert.equal(g.phase, 'judge');
    assert.equal(g.deadlineAt, now + 30_000);
    for (let i = 0; i < others.length; i++) {
      const key = phaseKey(g);
      const deadline: number = g.deadlineAt!;
      expireRound(s, deadline);
      assert.notEqual(phaseKey(g), key);
      if (i < others.length - 1) assert.equal(g.deadlineAt, deadline + 30_000);
    }
    assert.equal(g.phase, 'reveal');
    assert.equal(g.deadlineAt, undefined);
    assert.equal(g.results[0].judgements?.length, others.length);
    assert.ok(g.results[0].judgements!.every((j) => !j.accepted && j.yes === 0 && j.no === 0));
    assert.deepEqual(g.results[0].awards, {});
  });
}
for (const mode of MODES) {
  test(`${mode}: two connected players cannot choose a game, three can`, () => {
    const s = freshSession();
    ['a', 'b', 'c', 'offline'].forEach((id) => addPlayer(s, id, id));
    s.hostId = 'a';
    assert.throws(() => applyCommand(s, 'a', { type: 'choose', mode }, new Set(['a', 'b'])));
    assert.equal(s.game, undefined);
    const online = new Set(['a', 'b', 'c']);
    assert.throws(() => applyCommand(s, 'b', { type: 'choose', mode }, online));
    applyCommand(s, 'a', { type: 'choose', mode }, online);
    assert.deepEqual(s.game!.roster, ['a', 'b', 'c']);
    assert.equal(s.game!.phase, 'prepare');
  });
}
test('quiz ranks accuracy before speed, then speed for equal distance, with 3/2/1/0', () => {
  const { s, act, owner, others } = fixture('quiz', 5);
  assert.throws(() => act(others[0], { type: 'guess', value: '2023-06-10' }));
  act('p0', { type: 'open' });
  assert.throws(() => act(owner, { type: 'guess', value: '2023-06-10' }));
  act(others[0], { type: 'guess', value: '2023-06-09' });
  act(others[1], { type: 'guess', value: '2023-06-11' });
  act(others[2], { type: 'guess', value: '2023-06-10' });
  act(others[3], { type: 'guess', value: '2023-06-01' });
  assert.deepEqual(s.game!.results[0].awards, {
    [others[2]]: 3,
    [others[0]]: 2,
    [others[1]]: 1,
    [others[3]]: 0,
  });
});
test('guesses are final, hidden before reveal, and duplicate guesses cannot score twice', () => {
  const { s, act, others } = fixture('quiz');
  act('p0', { type: 'open' });
  act(others[0], { type: 'guess', value: '2023-06-10' });
  assert.throws(() => act(others[0], { type: 'guess', value: '2023-06-01' }));
  const v = viewFor(s, others[1], new Set());
  assert.equal(v.game?.answer, undefined);
  assert.equal(v.game?.ownGuess, undefined);
  assert.equal(v.game?.result, undefined);
  act('p0', { type: 'close' });
  assert.equal(s.game!.scores[others[0]], 3);
});
test('bluff gives two per fooled person and one per correct guess', () => {
  const { s, act, owner, others } = fixture('bluff');
  const truth = s.game!.submissions[owner].trueIndex!;
  act(others[0], { type: 'guess', value: String(truth) });
  act(others[1], { type: 'guess', value: String(1 - truth) });
  act(others[2], { type: 'guess', value: String(1 - truth) });
  assert.equal(s.game!.scores[owner], 4);
  assert.equal(s.game!.scores[others[0]], 1);
});
for (const mode of ['voice'] as const) {
  test(`${mode}: with three players, one eligible judge accepts or rejects each explanation`, () => {
    const { s, act, owner, others, online } = fixture(mode, 3);
    for (const id of others) act(id, { type: 'guess', value: `Explanation from ${id}` });
    const acceptedAuthor = s.game!.judgeAuthors[0];
    const rejectedAuthor = s.game!.judgeAuthors[1];
    for (const yes of [true, false]) {
      assert.equal(s.game!.phase, 'judge');
      const author = s.game!.judgeAuthors[s.game!.judgeIndex];
      const judge = others.find((id) => id !== author)!;
      assert.equal(viewFor(s, judge, online).game!.eligible, 1);
      assert.equal(viewFor(s, judge, online).game!.canJudge, true);
      assert.equal(viewFor(s, owner, online).game!.canJudge, false);
      assert.equal(viewFor(s, author, online).game!.canJudge, false);
      assert.throws(() => act(owner, { type: 'judge', yes }));
      assert.throws(() => act(author, { type: 'judge', yes }));
      act(judge, { type: 'judge', yes });
    }
    assert.equal(s.game!.phase, 'reveal');
    assert.deepEqual(s.game!.results[0].judgements, [
      { authorId: acceptedAuthor, yes: 1, no: 0, accepted: true },
      { authorId: rejectedAuthor, yes: 0, no: 1, accepted: false },
    ]);
    assert.equal(s.game!.scores[acceptedAuthor], 1);
    assert.equal(s.game!.scores[rejectedAuthor], 0);
    assert.equal(s.game!.scores[owner], 0);
  });
  test(`${mode}: uploader and author sit out, tied ballot fails only its explanation`, () => {
    const { s, act, owner, others } = fixture(mode);
    act(others[0], { type: 'guess', value: 'First explanation' });
    act(others[1], { type: 'guess', value: 'Second explanation' });
    act('p0', { type: 'close' });
    assert.equal(viewFor(s, others[0], new Set()).game?.answer, 'The real context');
    let author = s.game!.judgeAuthors[s.game!.judgeIndex];
    assert.throws(() => act(author, { type: 'judge', yes: true }));
    assert.throws(() => act(owner, { type: 'judge', yes: true }));
    const judges = s.game!.roster.filter((id) => id !== owner && id !== author);
    act(judges[0], { type: 'judge', yes: true });
    act(judges[1], { type: 'judge', yes: false });
    author = s.game!.judgeAuthors[s.game!.judgeIndex];
    for (const id of s.game!.roster.filter((id) => id !== owner && id !== author))
      act(id, { type: 'judge', yes: true });
    assert.equal(s.game!.results[0].judgements?.[0].accepted, false);
    assert.equal(s.game!.results[0].judgements?.[1].accepted, true);
    assert.equal(
      Object.values(s.game!.scores).reduce((a, b) => a + b, 0),
      1,
    );
  });
}
test('no guesses and no votes can be closed without deadlocking or awarding points', () => {
  const { s, act, others } = fixture('voice');
  act(others[0], { type: 'guess', value: 'Maybe a train?' });
  act('p0', { type: 'close' });
  act('p0', { type: 'close' });
  assert.deepEqual(s.game!.results[0].awards, {});
  act('p0', { type: 'next' });
  act('p0', { type: 'close' });
  assert.equal(s.game!.phase, 'reveal');
});
test('impostor assignments are balanced, never include the uploader, and keep their photo clear', () => {
  for (const count of [3, 4, 6])
    for (let sample = 0; sample < 30; sample++) {
      const { s, ids, owner } = fixture('impostor', count);
      const g = s.game!;
      const impostor = g.impostors[owner];
      assert.equal(new Set(Object.values(g.impostors)).size, ids.length);
      for (const id of ids) assert.notEqual(g.impostors[id], id);
      assert.notEqual(impostor, owner);
      assert.equal(mediaKeyFor(s, owner, `asset-${owner}`).key, `${owner}.webp`);
      assert.equal(viewFor(s, owner, new Set()).game?.blurred, false);
      assert.equal(mediaKeyFor(s, impostor, `asset-${owner}`).key, `${owner}-blur.webp`);
      const other = ids.find((id) => id !== impostor)!;
      assert.equal(mediaKeyFor(s, other, `asset-${owner}`).key, `${owner}.webp`);
      assert.equal(viewFor(s, other, new Set()).game?.isImpostor, false);
      assert.equal(JSON.stringify(viewFor(s, other, new Set())).includes('blurKey'), false);
      assert.throws(() => mediaKeyFor(s, impostor, `asset-${ids.find((id) => id !== owner)}`));
    }
});
for (const count of [3, 4]) {
  test(`${count} players: catching a non-uploader impostor awards only regulars and advances without revealing`, () => {
    const { s, act, ids, owner } = fixture('impostor', count);
    const impostor = s.game!.impostors[owner];
    act('p0', { type: 'skip' });
    assert.throws(() => act(impostor, { type: 'vote', targetId: impostor }));
    for (const id of ids) act(id, { type: 'vote', targetId: id === impostor ? owner : impostor });
    assert.equal(s.game!.results[0].escaped, false);
    assert.equal(s.game!.scores[impostor], 0);
    ids.filter((id) => id !== impostor).forEach((id) => assert.equal(s.game!.scores[id], 1));
    assert.equal(s.game!.index, 1);
    assert.equal(s.game!.phase, 'discuss');
    for (const id of ids) {
      const view = viewFor(s, id, new Set(ids)).game!;
      assert.deepEqual(view.scores, {});
      assert.equal(view.result, undefined);
      assert.equal(view.answer, undefined);
      assert.equal(view.scoresHidden, true);
      assert.throws(() => mediaKeyFor(s, id, `asset-${owner}`));
    }
  });
  test(`${count} players: a suspect-vote tie awards two points to the impostor`, () => {
    const { s, act, ids, owner } = fixture('impostor', count);
    act('p0', { type: 'skip' });
    for (let i = 0; i < ids.length; i++)
      act(ids[i], { type: 'vote', targetId: ids[(i + 1) % ids.length] });
    assert.equal(s.game!.results[0].escaped, true);
    assert.equal(s.game!.scores[s.game!.impostors[owner]], 2);
  });
}

test('impostor gives every player a separate 20-second turn, then a 30-second ballot', () => {
  const { s, ids, online } = fixture('impostor', 3);
  const g = s.game!;
  let now = 1_000;
  delete g.deadlineAt;
  expireRound(s, now);
  assert.deepEqual([...g.speakerOrder!].sort(), [...ids].sort());
  for (let turn = 0; turn < ids.length; turn++) {
    const speaker = g.speakerOrder![turn];
    const key = phaseKey(g);
    const deadline = now + 20_000;
    assert.equal(g.deadlineAt, deadline);
    assert.equal(viewFor(s, speaker, online).game!.speakerTurn, turn + 1);
    assert.equal(viewFor(s, speaker, online).game!.canClue, true);
    const other = ids.find((id) => id !== speaker)!;
    assert.equal(viewFor(s, other, online).game!.canClue, false);
    assert.throws(() => applyCommand(s, other, { type: 'clue', value: 'Too early' }, online, now));
    applyCommand(s, speaker, { type: 'clue', value: 'A colourful shape' }, online, now);
    assert.equal(phaseKey(g), key); // Optional text does not shorten the speaking turn.
    online.delete(speaker); // A disconnected speaker cannot hold up the next turn.
    assert.equal(expireRound(s, deadline - 1), false);
    assert.equal(expireRound(s, deadline), true);
    assert.notEqual(phaseKey(g), key);
    assert.equal(expireRound(s, deadline), false);
    now = deadline;
  }
  assert.equal(g.phase, 'vote');
  assert.equal(g.deadlineAt, now + 30_000);
  expireRound(s, g.deadlineAt);
  assert.equal(g.phase, 'discuss');
  assert.equal(g.index, 1);
  assert.equal(g.speakerIndex, 0);
  assert.equal(g.deadlineAt, now + 50_000);
  assert.equal(g.results.length, 1);
});

test('impostor shows only the final ranking, including after skipped photos', () => {
  const { s, act, ids, online } = fixture('impostor', 3);
  for (let item = 0; item < ids.length; item++) act('p0', { type: 'skipItem' });
  assert.equal(s.game!.phase, 'results');
  for (const id of ids) {
    const view = viewFor(s, id, online).game!;
    assert.equal(view.hideRoundResults, true);
    assert.equal(view.scoresHidden, false);
    assert.equal(view.rankings!.length, ids.length);
    assert.equal(view.result, undefined);
    assert.equal(view.answer, undefined);
    assert.equal(view.assetId, undefined);
    assert.equal(view.ownerId, undefined);
    assert.equal(view.isImpostor, undefined);
    for (const owner of ids) assert.throws(() => mediaKeyFor(s, id, `asset-${owner}`));
  }
});

test('chat uploader can judge, explanation author cannot; a three-player tie rejects', () => {
  const { s, act, owner, others, online } = fixture('chat', 3);
  for (const id of others) act(id, { type: 'guess', value: `Explanation from ${id}` });
  const authors = [...s.game!.judgeAuthors];
  for (let i = 0; i < authors.length; i++) {
    const author = authors[i];
    const judge = others.find((id) => id !== author)!;
    assert.equal(viewFor(s, owner, online).game!.canJudge, true);
    assert.equal(viewFor(s, owner, online).game!.eligible, 2);
    assert.equal(viewFor(s, author, online).game!.canJudge, false);
    assert.throws(() => act(author, { type: 'judge', yes: true }));
    act(owner, { type: 'judge', yes: true });
    assert.throws(() => act(owner, { type: 'judge', yes: false }));
    act(judge, { type: 'judge', yes: i === 0 });
  }
  assert.deepEqual(s.game!.results[0].judgements, [
    { authorId: authors[0], yes: 2, no: 0, accepted: true },
    { authorId: authors[1], yes: 1, no: 1, accepted: false },
  ]);
  assert.equal(s.game!.scores[authors[0]], 1);
  assert.equal(s.game!.scores[authors[1]], 0);
});

test('chat with four players: majority accepts, tied submitted votes reject on host close', () => {
  const { s, act, owner, others } = fixture('chat');
  for (const id of others.slice(0, 2)) act(id, { type: 'guess', value: 'A story' });
  act('p0', { type: 'close' });
  const author = s.game!.judgeAuthors[0];
  const otherJudge = others.find((id) => id !== author)!;
  act(owner, { type: 'judge', yes: true });
  act(otherJudge, { type: 'judge', yes: false });
  act('p0', { type: 'close' });
  const nextAuthor = s.game!.judgeAuthors[1];
  const judges = s.game!.roster.filter((id) => id !== nextAuthor);
  judges.forEach((id, i) => act(id, { type: 'judge', yes: i !== 2 }));
  assert.equal(s.game!.results[0].judgements![0].accepted, false);
  assert.equal(s.game!.results[0].judgements![1].accepted, true);
});

test('already-started saved games preserve their prior discussion, reveals and chat voting rules', () => {
  const { s, act, online } = fixture('impostor', 3);
  delete s.game!.rulesVersion;
  delete s.game!.speakerOrder;
  delete s.game!.speakerIndex;
  delete s.game!.deadlineAt;
  expireRound(s, 1_000);
  assert.equal(s.game!.deadlineAt, 61_000);
  expireRound(s, 61_000);
  assert.equal(s.game!.phase, 'vote');
  act('p0', { type: 'close' });
  assert.equal(s.game!.phase, 'reveal');
  assert.ok(viewFor(s, 'p0', online).game!.result);
  assert.equal(phaseKey(s.game!).split(':').length, 4);
  const chat = fixture('chat', 3);
  delete chat.s.game!.rulesVersion;
  for (const id of chat.others) chat.act(id, { type: 'guess', value: 'A story' });
  assert.equal(viewFor(chat.s, chat.owner, chat.online).game!.canJudge, false);
  assert.throws(() => chat.act(chat.owner, { type: 'judge', yes: true }));
});
test('new players wait, cannot access media, and cannot act in an active game', () => {
  const { s, act, owner } = fixture('bluff');
  addPlayer(s, 'Late friend', 'late');
  assert.equal(viewFor(s, 'late', new Set()).waiting, true);
  assert.equal(viewFor(s, 'late', new Set()).game?.assetId, undefined);
  assert.throws(() => mediaKeyFor(s, 'late', `asset-${owner}`));
  assert.throws(() => act('late', { type: 'guess', value: '0' }));
});
test('every item once, automatic final ranking with joint winners, fresh next-game scores and retained assets', () => {
  const { s, act, ids } = fixture('bluff');
  const oldId = s.game!.id;
  ids.forEach((_, i) => {
    act('p0', { type: 'close' });
    if (i < ids.length - 1) act('p0', { type: 'next' });
  });
  assert.equal(s.game!.phase, 'results');
  assert.equal(s.game!.results.length, 4);
  assert.deepEqual(
    viewFor(s, 'p0', new Set()).game?.rankings?.map((r) => r.rank),
    [1, 1, 1, 1],
  );
  assert.throws(() => act('p0', { type: 'next' }));
  act('p0', { type: 'choose', mode: 'quiz' });
  assert.notEqual(s.game!.id, oldId);
  assert.ok(Object.values(s.game!.scores).every((score) => score === 0));
  assert.equal(Object.keys(s.assets).length, 4);
});
test('non-host cannot control flow and missing uploads prevent starting', () => {
  const s: Session = freshSession();
  ['p0', 'p1', 'p2', 'p3'].forEach((id) => addPlayer(s, id, id));
  s.hostId = 'p0';
  const online = new Set(Object.keys(s.players));
  assert.throws(() => applyCommand(s, 'p1', { type: 'choose', mode: 'quiz' }, online));
  applyCommand(s, 'p0', { type: 'choose', mode: 'quiz' }, online);
  assert.throws(() => applyCommand(s, 'p0', { type: 'start' }, online));
  assert.ok(phaseKey(s.game!).includes('prepare'));
});
