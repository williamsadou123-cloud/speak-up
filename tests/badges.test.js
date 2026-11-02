import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBadges } from '../src/badges.js';

const base = { xp: 0, streak: 0, lastDay: null, cards: {}, dailyGoal: 50, todayXp: 0, todayDay: null, level: 'B1' };
const earned = (s, today = '2026-11-02') => computeBadges(s, today).filter((b) => b.earned).map((b) => b.id);

test('a new learner has only the level badge', () => {
  assert.deepEqual(earned(base), ['level']);
});
test('streak badges unlock at 3 and 7 days', () => {
  assert.ok(!earned({ ...base, streak: 2, lastDay: '2026-11-02' }).includes('streak3'));
  assert.ok(earned({ ...base, streak: 3, lastDay: '2026-11-02' }).includes('streak3'));
  assert.ok(earned({ ...base, streak: 7, lastDay: '2026-11-02' }).includes('streak7'));
});
test('a broken streak (last day two days ago) does not count', () => {
  assert.ok(!earned({ ...base, streak: 9, lastDay: '2026-10-30' }).includes('streak7'));
});
test('points, cards and learned-words badges', () => {
  const cards = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`c${i}`, { id: `c${i}`, reps: i < 20 ? 3 : 0 }]));
  const got = earned({ ...base, xp: 120, cards });
  for (const id of ['xp100', 'cards10', 'learned20']) assert.ok(got.includes(id), id);
  assert.ok(!got.includes('xp500') && !got.includes('cards50'));
});
test('daily goal badge only counts today', () => {
  assert.ok(earned({ ...base, todayXp: 50, todayDay: '2026-11-02' }).includes('goal'));
  assert.ok(!earned({ ...base, todayXp: 50, todayDay: '2026-11-01' }).includes('goal'));
});
test('every badge has icon, label and a hint', () => {
  for (const b of computeBadges(base, '2026-11-02')) assert.ok(b.icon && b.label && b.hint, b.id);
});
