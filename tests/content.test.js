import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, loadContent } from '../src/content.js';

const good = {
  id: 'v-001', level: 'B1', topic: 'travel', en: 'luggage', fr: 'bagages',
  definition_fr: 'Les valises et sacs que l\'on emporte en voyage.',
  definition_en: 'Bags and suitcases you take on a trip.',
  examples: [{ en: 'My luggage is heavy.', fr: 'Mes bagages sont lourds.' }, { en: 'Keep your luggage.', fr: 'Gardez vos bagages.' }],
  construction: { pattern: 'my + luggage + is + adjective', tip_fr: 'Luggage ne prend pas de s.' },
};

test('valid vocab entry passes', () => {
  assert.deepEqual(validateEntry(good, 'vocab'), { ok: true, errors: [] });
});
test('missing fr fails with "fr"', () => {
  const { fr, ...bad } = good;
  const r = validateEntry(bad, 'vocab');
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('fr')));
});
test('verb without pastParticiple fails', () => {
  const verb = { ...good, en: 'go', type: 'irregular', past: 'went', ing: 'going' };
  const r = validateEntry(verb, 'verb');
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('pastParticiple')));
});
test('example without en fails', () => {
  const r = validateEntry({ ...good, examples: [{ fr: 'x' }] }, 'vocab');
  assert.equal(r.ok, false);
});
test('loadContent drops invalid entries and keeps valid ones', async () => {
  const files = {
    'data/vocab.json': [good, { id: 'broken' }],
    'data/verbs.json': [],
    'data/expressions.json': [],
    'data/grammar.json': [],
  };
  const fetchFn = async (url) => ({ json: async () => files[url] });
  const warns = [];
  const orig = console.warn;
  console.warn = (...a) => warns.push(a);
  const c = await loadContent(fetchFn);
  console.warn = orig;
  assert.equal(c.vocab.length, 1);
  assert.equal(warns.length, 1);
});

test('entry without construction fails with "construction"', () => {
  const { construction, ...bad } = good;
  const r = validateEntry(bad, 'vocab');
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('construction')));
});
test('entry with empty construction tip fails', () => {
  assert.equal(validateEntry({ ...good, construction: { pattern: 'a', tip_fr: ' ' } }, 'vocab').ok, false);
});
test('entry with one example fails', () => {
  const r = validateEntry({ ...good, examples: [good.examples[0]] }, 'vocab');
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('examples')));
});
test('expression without literal_fr fails, with it passes', () => {
  assert.equal(validateEntry(good, 'expression').ok, false);
  assert.ok(validateEntry(good, 'expression').errors.some((e) => e.includes('literal_fr')));
  assert.equal(validateEntry({ ...good, literal_fr: 'mot à mot', usage_fr: 'quand' }, 'expression').ok, true);
});
test('grammar lesson without rule_fr is dropped with a warning', async () => {
  const lesson = { id: 'g1', title_fr: 'T', rule_fr: ['a'], formula: [], examples: [], exercises: [] };
  const files = { 'data/vocab.json': [], 'data/verbs.json': [], 'data/expressions.json': [],
    'data/grammar.json': [lesson, { ...lesson, id: 'g2', rule_fr: [] }, { id: 'g3', title_fr: 'T', formula: [] }] };
  const warns = [];
  const orig = console.warn;
  console.warn = (...a) => warns.push(a);
  const c = await loadContent(async (url) => ({ json: async () => files[url] }));
  console.warn = orig;
  assert.deepEqual(c.grammar.map((g) => g.id), ['g1']);
  assert.equal(warns.length, 2);
});
