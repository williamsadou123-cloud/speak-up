import test from 'node:test';
import assert from 'node:assert/strict';
import { gapMs, itemGapMs, guessMs, PACES, nearestRate } from '../src/listen-pace.js';

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
test('unknown pace falls back to normal; PACES lists three choices', () => {
  assert.equal(gapMs(en, 2000, 'x'), gapMs(en, 2000, 'normal'));
  assert.equal(PACES.length, 3);
});
test('nearestRate snaps an old 0.7 setting to the slowest available speed', () => {
  assert.equal(nearestRate(0.7), 0.85);
  assert.equal(nearestRate(1), 1);
  assert.equal(nearestRate(1.2), 1.2);
});
