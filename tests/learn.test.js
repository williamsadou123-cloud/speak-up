import test from 'node:test';
import assert from 'node:assert/strict';
import { groupIrregular, buildMatchQuiz } from '../src/learn.js';

const g = (en, past, pastParticiple) => groupIrregular({ en, past, pastParticiple });

test('groupIrregular: unchanged', () => assert.equal(g('cut', 'cut', 'cut'), 'unchanged'));
test('groupIrregular: same-past', () => {
  assert.equal(g('buy', 'bought', 'bought'), 'same-past');
  assert.equal(g('be', 'was/were', 'been'), 'other');
});
test('groupIrregular: i-a-u', () => {
  assert.equal(g('sing', 'sang', 'sung'), 'i-a-u');
  assert.equal(g('drink', 'drank', 'drunk'), 'i-a-u');
  assert.equal(g('begin', 'began', 'begun'), 'i-a-u');
});
test('groupIrregular: en-ending', () => {
  assert.equal(g('break', 'broke', 'broken'), 'en-ending');
  assert.equal(g('eat', 'ate', 'eaten'), 'en-ending');
});
test('groupIrregular: other, and slash forms use the first', () => {
  assert.equal(g('go', 'went', 'gone'), 'other');
  assert.equal(g('learn', 'learned/learnt', 'learned/learnt'), 'same-past');
});

const x = (n, def) => ({ id: `x${n}`, en: `expr ${n}`, definition_fr: def ?? `sens ${n}` });
const rng = () => 0.3;

test('buildMatchQuiz has 4 distinct choices containing the answer', () => {
  const q = buildMatchQuiz([x(1), x(2), x(3), x(4), x(5)], 5, rng);
  assert.ok(q.length > 0);
  for (const item of q) {
    assert.equal(item.choices.length, 4);
    assert.equal(new Set(item.choices).size, 4);
    assert.ok(item.choices.includes(item.answer));
  }
});
test('fewer than 4 expressions returns []', () => {
  assert.deepEqual(buildMatchQuiz([x(1), x(2), x(3)], 5, rng), []);
});
test('two expressions with the same definition never both appear in one question', () => {
  const list = [x(1, 'pareil'), x(2, 'pareil'), x(3), x(4), x(5)];
  for (const item of buildMatchQuiz(list, 5, rng)) assert.equal(new Set(item.choices).size, 4);
});
test('only 3 distinct definitions available returns fewer/no questions without duplicates', () => {
  const list = [x(1, 'a'), x(2, 'a'), x(3, 'b'), x(4, 'c')];
  for (const item of buildMatchQuiz(list, 5, rng)) assert.equal(new Set(item.choices).size, item.choices.length);
  assert.deepEqual(buildMatchQuiz(list, 5, rng), []);
});
test('count limits the number of questions', () => {
  assert.equal(buildMatchQuiz([x(1), x(2), x(3), x(4), x(5), x(6)], 2, rng).length, 2);
});
