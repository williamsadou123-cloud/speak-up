import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSteps, spokenText } from '../src/listen-steps.js';

const entry = (over = {}) => ({
  id: 'v-need', en: 'need', fr: 'avoir besoin de', definition_en: 'To require something.', definition_fr: 'Avoir l\'utilité de quelque chose.',
  examples: [{ en: 'I need help.', fr: 'J\'ai besoin d\'aide.' }, { en: 'We need time.', fr: 'Il nous faut du temps.' }],
  construction: { pattern: 'need + noun', tip_fr: 'Se construit avec un nom / un verbe.' },
  ...over,
});
const ids = (steps) => steps.map((s) => s.id);

test('en-first order is word, fr, defen, def, then each example EN then FR, then con, tip', () => {
  assert.deepEqual(ids(buildSteps(entry(), 'en-first')),
    ['word', 'fr', 'defen', 'def', 'ex0', 'ex0fr', 'ex1', 'ex1fr', 'con', 'tip']);
});
test('fr-first order is fr, defen, guess pause (4000 ms), word, def, examples, con, tip', () => {
  const steps = buildSteps(entry(), 'fr-first');
  assert.deepEqual(ids(steps), ['fr', 'defen', 'guess', 'word', 'def', 'ex0', 'ex0fr', 'ex1', 'ex1fr', 'con', 'tip']);
  const guess = steps.find((s) => s.id === 'guess');
  assert.equal(guess.kind, 'pause');
  assert.equal(guess.ms, 4000);
});
test('guessMs option changes the pause', () => {
  assert.equal(buildSteps(entry(), 'fr-first', { guessMs: 1000 }).find((s) => s.id === 'guess').ms, 1000);
});
test('irregular verb adds a forms step right after word', () => {
  const v = entry({ type: 'irregular', past: 'was/were', pastParticiple: 'been' });
  const steps = buildSteps(v, 'en-first');
  assert.deepEqual(ids(steps).slice(0, 3), ['word', 'forms', 'fr']);
  assert.equal(steps[1].text, 'need, was or were, been');
  assert.equal(buildSteps(v, 'fr-first').findIndex((s) => s.id === 'forms'), buildSteps(v, 'fr-first').findIndex((s) => s.id === 'word') + 1);
});
test('entry with one example and no construction yields no con/tip steps and no error', () => {
  const steps = buildSteps(entry({ examples: [{ en: 'I need help.', fr: 'Aide.' }], construction: undefined }), 'en-first');
  assert.deepEqual(ids(steps), ['word', 'fr', 'defen', 'def', 'ex0', 'ex0fr']);
});
test('entry without examples does not throw', () => {
  assert.doesNotThrow(() => buildSteps(entry({ examples: undefined, construction: undefined }), 'fr-first'));
});
test('maxExamples limits examples to 3 by default', () => {
  const ex = Array.from({ length: 5 }, (_, i) => ({ en: `E${i}`, fr: `F${i}` }));
  assert.equal(buildSteps(entry({ examples: ex }), 'en-first').filter((s) => /^ex\d+$/.test(s.id)).length, 3);
  assert.equal(buildSteps(entry({ examples: ex }), 'en-first', { maxExamples: 1 }).filter((s) => /^ex\d+$/.test(s.id)).length, 1);
});
test('spokenText turns "was/were" into "was or were" and "need + noun" into "need plus noun"', () => {
  assert.equal(spokenText('was/were'), 'was or were');
  assert.equal(spokenText('need + noun'), 'need plus noun');
  assert.equal(spokenText('a → b | c'), 'a, b, c');
});
test('no step text contains / + → |', () => {
  const v = entry({ construction: { pattern: 'go + to/at + place → motion | rest', tip_fr: 'a/b + c' } });
  for (const mode of ['en-first', 'fr-first']) {
    for (const s of buildSteps(v, mode)) if (s.text) assert.doesNotMatch(s.text, /[/+→|]/, s.id);
  }
});
test('keys follow <id>:<step> and are unique', () => {
  const steps = buildSteps(entry(), 'en-first').filter((s) => s.kind === 'speak');
  assert.equal(new Set(steps.map((s) => s.key)).size, steps.length);
  assert.equal(steps[0].key, 'v-need:word');
  assert.equal(steps.find((s) => s.id === 'ex1fr').key, 'v-need:ex1fr');
});

test('spokenText turns "=" into a spoken word and keeps french slash as "ou"', () => {
  assert.equal(spokenText('Bland = fade', 'fr'), 'Bland : fade'.replace(' : ', ' veut dire '));
  assert.equal(spokenText('et/ou', 'fr'), 'et ou ou'.replace('et ou ou', 'et ou ou'));
});
