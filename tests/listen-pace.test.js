import test from 'node:test';
import assert from 'node:assert/strict';
import { gapMs, itemGapMs, guessMs, PACES, RATES, nearestRate } from '../src/listen-pace.js';

const en = { lang: 'en-US' }; const fr = { lang: 'fr-FR' };

test('English steps leave time to repeat: at least as long as the clip at the normal pace', () => {
  assert.ok(gapMs(en, 2000, 'normal') >= 2000);
});
test('long pace leaves more time than short pace', () => {
  assert.ok(gapMs(en, 2000, 'long') > gapMs(en, 2000, 'normal'));
  assert.ok(gapMs(en, 2000, 'normal') > gapMs(en, 2000, 'short'));
});
test('French steps get a shorter gap than English steps', () => {
  assert.ok(gapMs(fr, 3000, 'normal') < gapMs(en, 3000, 'normal'));
});
test('gap has a minimum for very short clips and a maximum for long ones', () => {
  assert.ok(gapMs(en, 100, 'short') >= 1000);
  assert.ok(gapMs(en, 60000, 'long') <= 12000);
});
test('gap between items and guess pause grow with the pace', () => {
  assert.ok(itemGapMs('long') > itemGapMs('normal') && itemGapMs('normal') > itemGapMs('short'));
  assert.ok(guessMs('long') > guessMs('normal') && guessMs('normal') > guessMs('short'));
});
test('unknown pace falls back to normal', () => {
  assert.equal(gapMs(en, 2000, 'x'), gapMs(en, 2000, 'normal'));
});
test('PACES offers 3 automatic choices and fixed pauses from 1 to 10 seconds', () => {
  const ids = PACES.map(([k]) => k);
  assert.deepEqual(ids.slice(0, 3), ['short', 'normal', 'long']);
  assert.ok(ids.includes('fixed:1') && ids.includes('fixed:4') && ids.includes('fixed:10'));
  assert.equal(PACES.length, 13);
});
test('a fixed pause is exactly N seconds after every step, English or French, whatever the clip length', () => {
  assert.equal(gapMs(en, 500, 'fixed:3'), 3000);
  assert.equal(gapMs(en, 9000, 'fixed:3'), 3000);
  assert.equal(gapMs(fr, 1200, 'fixed:2'), 2000);
});
test('fixed pause also sets the gap between items and the guess time (at least 3 s)', () => {
  assert.equal(itemGapMs('fixed:5'), 5000);
  assert.equal(itemGapMs('fixed:1'), 1500);
  assert.equal(guessMs('fixed:6'), 6000);
  assert.equal(guessMs('fixed:1'), 3000);
});
test('RATES go from 0.7 to 1.5 and nearestRate snaps to them', () => {
  assert.equal(RATES[0], 0.7);
  assert.equal(RATES[RATES.length - 1], 1.5);
  assert.equal(nearestRate(0.7), 0.7);
  assert.equal(nearestRate(1.45), 1.4);
  assert.equal(nearestRate(2), 1.5);
});
