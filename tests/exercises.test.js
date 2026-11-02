import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, isCorrect, makeExercise, buildSession } from '../src/exercises.js';

const mk = (i, level = 'B1') => ({
  id: `w${i}`, level, topic: 't', en: `word${i}`, fr: `mot${i}`,
  definition_fr: `def fr ${i}`, definition_en: `def en ${i}`,
  examples: [{ en: `This is a word${i} in a sentence.`, fr: `Ceci est un mot${i}.` }],
});
const pool = Array.from({ length: 10 }, (_, i) => mk(i));
const rng = () => 0.3;

test('normalize ignores case, extra spaces, curly apostrophes and accents', () => {
  assert.equal(normalize('  Héllo   WORLD '), 'hello world');
  assert.equal(normalize('don’t'), "don't");
});
test('choice has 4 distinct choices including the answer', () => {
  const ex = makeExercise('choice', pool[0], pool, rng);
  assert.equal(ex.choices.length, 4);
  assert.equal(new Set(ex.choices).size, 4);
  assert.ok(ex.choices.includes(ex.answer));
});
test('choice with pool too small for 3 distractors returns null', () => {
  assert.equal(makeExercise('choice', pool[0], pool.slice(0, 3), rng), null);
});
test('typing accepts "  Hello " for "hello"', () => {
  const ex = makeExercise('typing', { ...pool[0], en: 'hello' }, pool, rng);
  assert.equal(isCorrect(ex, '  Hello '), true);
  assert.equal(isCorrect(ex, 'help'), false);
});
test('cloze replaces the target word with ____ in the example', () => {
  const ex = makeExercise('cloze', pool[2], pool, rng);
  assert.ok(ex.prompt.includes('____'));
  assert.ok(!ex.prompt.includes('word2'));
  assert.equal(ex.answer, 'word2');
});
test('order returns shuffled words that rejoin to the answer when sorted back', () => {
  const ex = makeExercise('order', pool[1], pool, rng);
  assert.equal([...ex.words].sort().join(' '), ex.answer.split(' ').sort().join(' '));
  assert.equal(isCorrect(ex, ex.answer), true);
});
test('listen has audioText and expects the English text', () => {
  const ex = makeExercise('listen', pool[3], pool, rng);
  assert.equal(ex.audioText, 'word3');
  assert.equal(isCorrect(ex, 'Word3'), true);
});
test('buildSession returns up to count exercises with no null', () => {
  const s = buildSession(pool, 8, rng);
  assert.ok(s.length > 0 && s.length <= 8);
  assert.ok(s.every(Boolean));
});
test('buildSession on an empty pool returns []', () => {
  assert.deepEqual(buildSession([], 5, rng), []);
});

test('typing accepts another entry that shares the same French translation', () => {
  const doV = { ...mk(50), en: 'do', fr: 'faire' };
  const makeV = { ...mk(51), en: 'make', fr: 'faire' };
  const ex = makeExercise('typing', doV, [doV, makeV, ...pool], rng);
  assert.equal(isCorrect(ex, 'make'), true);
  assert.equal(isCorrect(ex, 'do'), true);
  assert.equal(isCorrect(ex, 'run'), false);
});
test('choice never offers a near-duplicate of the right answer as a distractor', () => {
  const a = { ...mk(60), en: 'spill the beans', fr: 'vendre la mèche' };
  const b = { ...mk(61), en: 'let the cat out', fr: 'vendre la mèche (par erreur)' };
  for (let i = 0; i < 20; i++) {
    const ex = makeExercise('choice', a, [a, b, ...pool], Math.random);
    assert.ok(!ex.choices.includes(b.fr));
  }
});

const verb = { ...mk(70), en: 'go', fr: 'aller', type: 'irregular', past: 'went', pastParticiple: 'gone', ing: 'going',
  examples: [{ en: 'They went to the beach.', fr: 'Ils sont allés à la plage.' }, { en: 'I go to work.', fr: 'Je vais au travail.' }],
  construction: { pattern: 'go + to + place', tip_fr: 'Go se construit avec to.' } };
const pool2 = [verb, ...pool, ...Array.from({ length: 6 }, (_, i) => ({ ...mk(80 + i), type: 'irregular', past: `p${i}`, pastParticiple: `pp${i}`, ing: `i${i}` }))];
const types = (session) => new Set(session.map((s) => s.type));

test('exercise includes explain with the French definition', () => {
  for (const type of ['choice', 'listen', 'typing', 'cloze', 'order']) {
    const ex = makeExercise(type, verb, pool2, rng, { write: true });
    assert.ok(ex, type);
    assert.ok(ex.explain.includes(verb.definition_fr), type);
  }
  assert.ok(makeExercise('choice', verb, pool2, rng).explain.includes('Go se construit avec to.'));
});
test('default session contains no typing or order exercises', () => {
  const s = buildSession(pool2, 10, Math.random);
  assert.ok(s.length > 0);
  assert.ok(!types(s).has('typing') && !types(s).has('order'));
  assert.ok(s.every((ex) => Array.isArray(ex.choices) && ex.choices.length === 4), 'every default exercise is multiple choice');
});
test('write option allows typing and order', () => {
  const seen = new Set();
  for (let i = 0; i < 20; i++) buildSession(pool2, 10, Math.random, { write: true }).forEach((ex) => seen.add(ex.type));
  assert.ok(seen.has('typing') && seen.has('order'));
});
test('cloze in default mode has 4 distinct choices including the answer', () => {
  const ex = makeExercise('cloze', verb, pool2, rng);
  assert.equal(ex.choices.length, 4);
  assert.equal(new Set(ex.choices).size, 4);
  assert.ok(ex.choices.includes(ex.answer));
});
test('listen in default mode offers 4 distinct English words including the answer', () => {
  const ex = makeExercise('listen', pool[3], pool, rng);
  assert.equal(ex.choices.length, 4);
  assert.equal(new Set(ex.choices).size, 4);
  assert.ok(ex.choices.includes('word3'));
});
test('listen with write option has no choices', () => {
  assert.equal(makeExercise('listen', pool[3], pool, rng, { write: true }).choices, undefined);
});

test('cloze choices match the capitalisation of the answer', () => {
  const e = { ...mk(90), en: 'chop', past: 'chopped', pastParticiple: 'chopped', ing: 'chopping', type: 'regular',
    examples: [{ en: 'Chop the onions finely.', fr: 'Coupe.' }, { en: 'I chop them.', fr: 'Je les coupe.' }] };
  const ex = makeExercise('cloze', e, [e, ...pool2], rng);
  assert.equal(ex.answer, 'Chop');
  for (const c of ex.choices) assert.match(c, /^[A-Z]/, c);
});
