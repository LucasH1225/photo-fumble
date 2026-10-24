import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addPlayer,
  applyCommand,
  currentOwner,
  dateDay,
  freshSession,
  mediaKeyFor,
  phaseKey,
  saveSubmission,
  viewFor,
} from '../server/engine.js';
import type { Command, Mode, Session } from '../shared/types.js';

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
test('host selection is random once, and four connected players are required', () => {
  const s = freshSession();
  ['a', 'b', 'c', 'd'].forEach((id) => addPlayer(s, id, id));
  assert.throws(() => applyCommand(s, 'a', { type: 'elect' }, new Set(['a', 'b', 'c'])));
  applyCommand(s, 'a', { type: 'elect' }, new Set(['a', 'b', 'c', 'd']));
  assert.ok(s.hostId);
  assert.throws(() => applyCommand(s, 'a', { type: 'elect' }, new Set(['a', 'b', 'c', 'd'])));
});
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
for (const mode of ['voice', 'chat'] as const) {
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
test('impostor sees only blurred media, others see clear, and assignments are balanced', () => {
  const { s, ids, owner } = fixture('impostor');
  const g = s.game!;
  const impostor = g.impostors[owner];
  assert.equal(new Set(Object.values(g.impostors)).size, ids.length);
  assert.equal(mediaKeyFor(s, impostor, `asset-${owner}`).key, `${owner}-blur.webp`);
  const other = ids.find((id) => id !== impostor)!;
  assert.equal(mediaKeyFor(s, other, `asset-${owner}`).key, `${owner}.webp`);
  assert.equal(viewFor(s, other, new Set()).game?.isImpostor, false);
  assert.equal(JSON.stringify(viewFor(s, other, new Set())).includes('blurKey'), false);
  assert.throws(() => mediaKeyFor(s, impostor, `asset-${ids.find((id) => id !== owner)}`));
});
test('uploader can be impostor; correct suspect awards regulars, not the impostor', () => {
  const { s, act, ids, owner } = fixture('impostor');
  s.game!.impostors[owner] = owner;
  act('p0', { type: 'skip' });
  for (const id of ids)
    act(id, { type: 'vote', targetId: id === owner ? ids.find((p) => p !== owner)! : owner });
  assert.equal(s.game!.results[0].escaped, false);
  assert.equal(s.game!.scores[owner], 0);
  ids.filter((id) => id !== owner).forEach((id) => assert.equal(s.game!.scores[id], 1));
});
test('a suspect-vote tie awards two points to the impostor', () => {
  const { s, act, ids, owner } = fixture('impostor');
  act('p0', { type: 'skip' });
  for (let i = 0; i < ids.length; i++)
    act(ids[i], { type: 'vote', targetId: ids[(i + 1) % ids.length] });
  assert.equal(s.game!.results[0].escaped, true);
  assert.equal(s.game!.scores[s.game!.impostors[owner]], 2);
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
