import test from 'node:test';
import assert from 'node:assert/strict';
import { newCard, review, dueCards } from '../src/srs.js';

const DAY = 86400000;
const now = 1_000_000_000_000;

test('new card starts at ease 2.5, reps 0', () => {
  const c = newCard('a', now);
  assert.deepEqual(c, { id: 'a', ease: 2.5, interval: 0, due: now, reps: 0 });
});
test('good on first review gives interval 1 day', () => {
  const c = review(newCard('a', now), 'good', now);
  assert.equal(c.interval, 1);
  assert.equal(c.due, now + DAY);
  assert.equal(c.reps, 1);
});
test('good on second review gives interval 3 days', () => {
  let c = review(newCard('a', now), 'good', now);
  c = review(c, 'good', now + DAY);
  assert.equal(c.interval, 3);
});
test('good afterwards multiplies interval by ease', () => {
  let c = { id: 'a', ease: 2.5, interval: 3, due: now, reps: 2 };
  c = review(c, 'good', now);
  assert.equal(c.interval, 8); // round(3 * 2.5)
});
test('again resets reps to 0, lowers ease by 0.2 and is due in 10 minutes', () => {
  const c = review({ id: 'a', ease: 2.5, interval: 5, due: now, reps: 4 }, 'again', now);
  assert.equal(c.reps, 0);
  assert.ok(Math.abs(c.ease - 2.3) < 1e-9);
  assert.equal(c.due, now + 10 * 60000);
  assert.equal(c.interval, 0);
});
test('ease never goes below 1.3', () => {
  let c = { id: 'a', ease: 1.35, interval: 1, due: now, reps: 1 };
  c = review(c, 'again', now);
  assert.equal(c.ease, 1.3);
});
test('hard lowers ease by 0.15 and multiplies interval by 1.2 (min 1)', () => {
  const c = review({ id: 'a', ease: 2.5, interval: 10, due: now, reps: 3 }, 'hard', now);
  assert.ok(Math.abs(c.ease - 2.35) < 1e-9);
  assert.equal(c.interval, 12);
  const d = review({ id: 'a', ease: 2.5, interval: 0, due: now, reps: 0 }, 'hard', now);
  assert.equal(d.interval, 1);
});
test('easy raises ease by 0.15 and multiplies interval by 1.3 over good', () => {
  const c = review({ id: 'a', ease: 2.5, interval: 4, due: now, reps: 3 }, 'easy', now);
  assert.ok(Math.abs(c.ease - 2.65) < 1e-9);
  assert.equal(c.interval, Math.round(4 * 2.5 * 1.3));
});
test('dueCards returns only cards with due <= now, sorted', () => {
  const cards = [
    { id: 'b', ease: 2.5, interval: 1, due: now + 5, reps: 1 },
    { id: 'c', ease: 2.5, interval: 1, due: now - 10, reps: 1 },
    { id: 'a', ease: 2.5, interval: 1, due: now - 20, reps: 1 },
  ];
  assert.deepEqual(dueCards(cards, now).map((c) => c.id), ['a', 'c']);
});
test('review does not mutate its input', () => {
  const c = newCard('a', now);
  const copy = { ...c };
  review(c, 'good', now);
  assert.deepEqual(c, copy);
});
test('easy always schedules later than good, even on a new card', () => {
  const good = review(newCard('a', now), 'good', now);
  const easy = review(newCard('a', now), 'easy', now);
  assert.ok(easy.interval > good.interval);
});
