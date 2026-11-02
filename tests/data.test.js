import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateEntry } from '../src/content.js';

const load = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const vocab = load('vocab'), verbs = load('verbs'), expressions = load('expressions'), grammar = load('grammar');
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

test('vocab has at least 200 entries, all valid', () => {
  assert.ok(vocab.length >= 200, `vocab: ${vocab.length}`);
  for (const e of vocab) assert.ok(validateEntry(e, 'vocab').ok, e.id);
});
test('verbs has at least 120 entries with at least 60 irregular, all valid', () => {
  assert.ok(verbs.length >= 120, `verbs: ${verbs.length}`);
  assert.ok(verbs.filter((v) => v.type === 'irregular').length >= 60);
  for (const e of verbs) assert.ok(validateEntry(e, 'verb').ok, e.id);
});
test('expressions has at least 60 entries, all valid', () => {
  assert.ok(expressions.length >= 60, `expressions: ${expressions.length}`);
  for (const e of expressions) assert.ok(validateEntry(e, 'expression').ok, e.id);
});
test('grammar has at least 8 lessons each with at least 3 exercises', () => {
  assert.ok(grammar.length >= 8);
  for (const g of grammar) {
    assert.ok(g.exercises.length >= 3, g.id);
    for (const ex of g.exercises) assert.ok(ex.choices.includes(ex.answer), `${g.id}: ${ex.prompt}`);
  }
});
test('all ids are unique per file', () => {
  for (const list of [vocab, verbs, expressions, grammar]) {
    assert.equal(new Set(list.map((e) => e.id)).size, list.length);
  }
});
test('levels used are within A1..C1 and B1/B2 hold the majority of vocab', () => {
  assert.ok(vocab.every((e) => LEVELS.includes(e.level)));
  const mid = vocab.filter((e) => e.level === 'B1' || e.level === 'B2').length;
  assert.ok(mid > vocab.length / 2, `B1/B2: ${mid}/${vocab.length}`);
});
test('every verb example contains the verb or one of its forms', () => {
  const bad = [];
  for (const v of verbs) {
    const forms = [v.en, ...v.past.split('/'), ...v.pastParticiple.split('/'), v.ing, ...v.past.split('/').map((p) => p), `${v.en}s`, `${v.en}es`];
    const ok = v.examples.some((ex) => {
      const words = ex.en.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/);
      return forms.some((f) => words.includes(f.toLowerCase()));
    });
    if (!ok) bad.push(v.id);
  }
  assert.deepEqual(bad, []);
});

test('every vocab, verb and expression has construction and at least 2 examples', () => {
  for (const [list, kind] of [[vocab, 'vocab'], [verbs, 'verb'], [expressions, 'expression']]) {
    for (const e of list) {
      assert.ok(e.construction && e.construction.pattern && e.construction.tip_fr, `${kind} ${e.id}: construction`);
      assert.ok(e.examples.length >= 2, `${kind} ${e.id}: examples`);
    }
  }
});
test('exactly 20 verbs are essential', () => {
  assert.equal(verbs.filter((v) => v.essential === true).length, 20);
});
test('every expression has literal_fr and usage_fr', () => {
  for (const e of expressions) assert.ok(e.literal_fr && e.usage_fr, e.id);
});
test('every grammar lesson has rule_fr and formula', () => {
  for (const g of grammar) {
    assert.ok(Array.isArray(g.rule_fr) && g.rule_fr.length > 0, `${g.id}: rule_fr`);
    assert.ok(Array.isArray(g.formula) && g.formula.length > 0, `${g.id}: formula`);
    for (const f of g.formula) assert.ok(f.label && f.text && ['subject', 'verb', 'object', 'aux', 'time'].includes(f.color), g.id);
  }
});
