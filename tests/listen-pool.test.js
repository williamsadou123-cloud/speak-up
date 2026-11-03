import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPool, SOURCES } from '../src/listen-pool.js';

const content = {
  vocab: [{ id: 'v1', level: 'A1', topic: 'food' }],
  verbs: [
    { id: 'vb1', level: 'A1', topic: 'irregular', type: 'irregular' },
    { id: 'vb2', level: 'A2', topic: 'action', type: 'regular' },
  ],
  expressions: [{ id: 'e1', level: 'B1', topic: 'idiom' }],
  grammar: [{ id: 'g1', level: 'A1', title_fr: 'T', rule_fr: ['r'], examples: [] }],
};
const idsOf = (l) => l.map((e) => e.id).sort();

test('sources list irregular and regular verbs, grammar and mix', () => {
  assert.deepEqual(SOURCES.map(([k]) => k), ['vocab', 'irregular', 'regular', 'expressions', 'grammar', 'mix']);
});
test('irregular and regular filter by verb type', () => {
  assert.deepEqual(idsOf(buildPool(content, 'irregular')), ['vb1']);
  assert.deepEqual(idsOf(buildPool(content, 'regular')), ['vb2']);
});
test('grammar items are tagged type grammar', () => {
  assert.equal(buildPool(content, 'grammar')[0].type, 'grammar');
});
test('mix contains vocab, verbs, expressions and grammar', () => {
  assert.deepEqual(idsOf(buildPool(content, 'mix')), ['e1', 'g1', 'v1', 'vb1', 'vb2']);
});
test('topic and level filters apply', () => {
  assert.deepEqual(idsOf(buildPool(content, 'mix', { level: 'A1' })), ['g1', 'v1', 'vb1']);
  assert.deepEqual(idsOf(buildPool(content, 'mix', { topic: 'food' })), ['v1']);
});
