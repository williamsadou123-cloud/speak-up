import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, addXp, touchStreak } from '../src/store.js';

const mem = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; }, m }; };

test('load returns defaults when storage is empty', () => {
  const s = createStore(mem()).load();
  assert.equal(s.level, null);
  assert.equal(s.xp, 0);
  assert.deepEqual(s.cards, {});
});
test('save then load round-trips', () => {
  const st = mem();
  const store = createStore(st);
  const s = { ...store.load(), xp: 42, level: 'B2' };
  store.save(s);
  assert.equal(createStore(st).load().xp, 42);
});
test('corrupted JSON falls back to defaults', () => {
  const st = mem();
  st.setItem('english-app-v1', '{oops');
  assert.equal(createStore(st).load().xp, 0);
});
test('null storage gives persistent false and still works in memory', () => {
  const store = createStore(null);
  assert.equal(store.persistent, false);
  store.save({ ...store.load(), xp: 5 });
  assert.equal(store.load().xp, 5);
});
test('setItem throwing sets persistent false without throwing', () => {
  const st = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
  const store = createStore(st);
  store.save(store.load());
  assert.equal(store.persistent, false);
});
test('touchStreak increments on consecutive day, keeps on same day, resets after a gap', () => {
  const base = createStore(null).load();
  let s = touchStreak(base, '2026-11-01');
  assert.equal(s.streak, 1);
  s = touchStreak(s, '2026-11-01');
  assert.equal(s.streak, 1);
  s = touchStreak(s, '2026-11-02');
  assert.equal(s.streak, 2);
  s = touchStreak(s, '2026-11-05');
  assert.equal(s.streak, 1);
});
test('addXp resets todayXp on a new day', () => {
  let s = addXp(createStore(null).load(), 10, '2026-11-01');
  assert.equal(s.todayXp, 10);
  s = addXp(s, 10, '2026-11-02');
  assert.equal(s.todayXp, 10);
  assert.equal(s.xp, 20);
});

test('load of an old saved state without voice and rate returns defaults (accent US, rate 1)', () => {
  const st = mem();
  st.setItem('english-app-v1', JSON.stringify({ level: 'B1', xp: 10, cards: {} }));
  const s = createStore(st).load();
  assert.equal(s.xp, 10);
  assert.deepEqual(s.voice, { accent: 'US', enName: null, frName: null });
  assert.equal(s.rate, 1);
});
test('a partial saved voice object keeps the other defaults', () => {
  const st = mem();
  st.setItem('english-app-v1', JSON.stringify({ voice: { accent: 'GB' } }));
  assert.deepEqual(createStore(st).load().voice, { accent: 'GB', enName: null, frName: null });
});
