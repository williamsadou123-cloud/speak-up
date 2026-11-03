import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJobs, pendingJobs, requireApiKey } from '../tools/generate-audio.mjs';

const content = {
  vocab: [{ id: 'v-a', en: 'luggage', fr: 'bagages', definition_fr: 'def fr', definition_en: 'def en',
    examples: [{ en: 'ex one', fr: 'un' }, { en: 'ex two', fr: 'deux' }] }],
  verbs: [{ id: 'vb-go', type: 'irregular', en: 'go', past: 'went', pastParticiple: 'gone', fr: 'aller',
    definition_fr: 'd', definition_en: 'd', examples: [{ en: 'I went.', fr: 'Je suis allé.' }] }],
  expressions: [],
};
const beVerb = { id: 'vb-be', type: 'irregular', en: 'be', past: 'was/were', pastParticiple: 'been', fr: 'être',
  definition_fr: 'd', definition_en: 'd', examples: [{ en: 'I was tired.', fr: 'J\'étais fatigué.' }] };

test('buildJobs yields word, def and example keys for each entry', () => {
  const keys = buildJobs(content).map((j) => j.key);
  for (const k of ['v-a:word', 'v-a:fr', 'v-a:def', 'v-a:defen', 'v-a:ex0', 'v-a:ex1', 'vb-go:forms']) {
    assert.ok(keys.includes(k), k);
  }
});
test('keys are unique', () => {
  const keys = buildJobs(content).map((j) => j.key);
  assert.equal(new Set(keys).size, keys.length);
});
test('jobs have the right language', () => {
  const jobs = Object.fromEntries(buildJobs(content).map((j) => [j.key, j]));
  assert.equal(jobs['v-a:word'].lang, 'en');
  assert.equal(jobs['v-a:def'].lang, 'fr');
});
test('jobs for existing files are skipped', () => {
  const jobs = buildJobs(content);
  const existing = new Set(['audio/v-a-word.mp3']);
  const todo = pendingJobs(jobs, (f) => existing.has(f));
  assert.equal(todo.length, jobs.length - 1);
});
test('missing ELEVENLABS_API_KEY throws a clear message', () => {
  assert.throws(() => requireApiKey({}), /ELEVENLABS_API_KEY/);
  assert.equal(requireApiKey({ ELEVENLABS_API_KEY: 'k' }), 'k');
});

test('slash forms are spoken as "or", never as a literal slash', () => {
  const j = buildJobs({ ...content, verbs: [beVerb] }).find((x) => x.key === 'vb-be:forms');
  assert.ok(!j.text.includes('/'));
  assert.ok(j.text.includes('was or were'));
});

const full = {
  ...content,
  vocab: [{ ...content.vocab[0], construction: { pattern: 'need + noun / verb → result | x', tip_fr: 'Avec un nom + un verbe / adjectif.' } }],
};
test('buildJobs yields ex<i>fr, con and tip keys', () => {
  const jobs = Object.fromEntries(buildJobs(full).map((j) => [j.key, j]));
  assert.equal(jobs['v-a:ex0fr'].text, 'un');
  assert.equal(jobs['v-a:ex0fr'].lang, 'fr');
  assert.equal(jobs['v-a:ex1fr'].text, 'deux');
  assert.equal(jobs['v-a:con'].lang, 'en');
  assert.equal(jobs['v-a:tip'].lang, 'fr');
});
test('no job text contains / + → |', () => {
  for (const j of buildJobs(full)) assert.doesNotMatch(j.text, /[/+→|]/, j.key);
});
test('entries without construction produce no con/tip jobs and no error', () => {
  const keys = buildJobs(content).map((j) => j.key);
  assert.ok(!keys.some((k) => k.endsWith(':con') || k.endsWith(':tip')));
});
test('keys stay unique with the new jobs', () => {
  const keys = buildJobs(full).map((j) => j.key);
  assert.equal(new Set(keys).size, keys.length);
});

import { onlyKinds, kindOf } from '../tools/generate-audio.mjs';
test('onlyKinds keeps only the requested kinds', () => {
  const jobs = buildJobs(full);
  assert.equal(kindOf('v-a:ex1fr'), 'exfr');
  assert.equal(kindOf('v-a:ex1'), 'ex');
  const kept = onlyKinds(jobs, ['word', 'exfr']).map((j) => j.key);
  assert.deepEqual(kept.sort(), ['v-a:ex0fr', 'v-a:ex1fr', 'v-a:word', 'vb-go:ex0fr', 'vb-go:word'].sort());
  assert.equal(onlyKinds(jobs, []).length, jobs.length);
});

test('regular verbs get a forms job and grammar gets title, rule and example fr jobs', () => {
  const reg = { id: 'vb-walk', type: 'regular', en: 'walk', past: 'walked', pastParticiple: 'walked', fr: 'marcher',
    definition_fr: 'd', definition_en: 'd', examples: [{ en: 'I walk.', fr: 'Je marche.' }] };
  const g = { id: 'g-x', title_fr: 'Le présent', rule_fr: ['Une règle.', 'Deux.'], examples: [{ en: 'I work.', fr: 'Je travaille.' }] };
  const jobs = Object.fromEntries(buildJobs({ ...content, verbs: [reg], grammar: [g] }).map((j) => [j.key, j]));
  assert.equal(jobs['vb-walk:forms'].text, 'walk, walked, walked');
  assert.equal(jobs['g-x:title'].lang, 'fr');
  assert.equal(jobs['g-x:r1'].text, 'Deux.');
  assert.equal(jobs['g-x:ex0fr'].lang, 'fr');
});

import { requestBody, selectJobs } from '../tools/generate-audio.mjs';

test('French requests force the language (short words are not guessed as English)', () => {
  const b = requestBody({ text: 'logement', lang: 'fr' });
  assert.equal(b.language_code, 'fr');
  assert.equal(b.model_id, 'eleven_turbo_v2_5');
  assert.equal(b.text, 'logement');
});
test('English requests keep the multilingual model', () => {
  assert.equal(requestBody({ text: 'home', lang: 'en' }).model_id, 'eleven_multilingual_v2');
});
test('selectJobs filters by language and maximum number of words', () => {
  const jobs = [
    { key: 'a:fr', text: 'logement', lang: 'fr' },
    { key: 'a:def', text: 'Un endroit où vivre ou rester.', lang: 'fr' },
    { key: 'a:word', text: 'home', lang: 'en' },
  ];
  assert.deepEqual(selectJobs(jobs, { lang: 'fr', maxWords: 3 }).map((j) => j.key), ['a:fr']);
  assert.equal(selectJobs(jobs, {}).length, 3);
});

import { isStale, shortestFirst } from '../tools/generate-audio.mjs';

test('isStale: missing file or older than the cutoff needs regenerating', () => {
  assert.equal(isStale(null, 1000), true);
  assert.equal(isStale(999, 1000), true);
  assert.equal(isStale(1000, 1000), false);
  assert.equal(isStale(5000, 1000), false);
});
test('shortestFirst orders jobs by text length, keeping ties stable', () => {
  const jobs = [{ key: 'c', text: 'abcdef' }, { key: 'a', text: 'ab' }, { key: 'b', text: 'ab' }];
  assert.deepEqual(shortestFirst(jobs).map((j) => j.key), ['a', 'b', 'c']);
});
