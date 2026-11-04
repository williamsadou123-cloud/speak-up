import test from 'node:test';
import assert from 'node:assert/strict';
import { rankVoices, pickVoice } from '../src/voice.js';

const v = (name, lang, localService = true) => ({ name, lang, localService });

test('premium/enhanced/natural/neural/google names rank first', () => {
  const list = [v('Plain', 'en-US'), v('Samantha (Enhanced)', 'en-US'), v('Google US English', 'en-US', false)];
  const names = rankVoices(list, 'en-US', 'US').map((x) => x.name);
  assert.deepEqual(names.slice(0, 2).sort(), ['Google US English', 'Samantha (Enhanced)']);
  assert.equal(names[2], 'Plain');
});
test('exact accent match beats other English', () => {
  const list = [v('Alex', 'en-US'), v('Daniel', 'en-GB'), v('Karen', 'en-AU')];
  assert.equal(rankVoices(list, 'en-US', 'GB')[0].name, 'Daniel');
  assert.equal(rankVoices(list, 'en-US', 'US')[0].name, 'Alex');
});
test('lang codes with underscores are understood', () => {
  assert.equal(rankVoices([v('A', 'en_GB'), v('B', 'en_US')], 'en-US', 'GB')[0].name, 'A');
});
test('GB requested with only US voices falls back to a US English voice', () => {
  assert.equal(pickVoice([v('Alex', 'en-US')], 'en-US', 'GB').name, 'Alex');
});
test('preferredName that is not installed falls back to ranking', () => {
  const list = [v('Alex', 'en-US'), v('Samantha (Premium)', 'en-US')];
  assert.equal(pickVoice(list, 'en-US', 'US', 'Gone').name, 'Samantha (Premium)');
});
test('preferredName installed wins', () => {
  const list = [v('Alex', 'en-US'), v('Samantha (Premium)', 'en-US')];
  assert.equal(pickVoice(list, 'en-US', 'US', 'Alex').name, 'Alex');
});
test('no voice in the language returns null', () => {
  assert.equal(pickVoice([v('Thomas', 'fr-FR')], 'en-US', 'US'), null);
});
test('empty or missing voice list returns null', () => {
  assert.equal(pickVoice([], 'en-US', 'US'), null);
  assert.equal(pickVoice(undefined, 'en-US', 'US'), null);
});
test('french ranking ignores accent and prefers fr-FR', () => {
  const list = [v('Amelie CA', 'fr-CA'), v('Thomas', 'fr-FR')];
  assert.equal(pickVoice(list, 'fr-FR', 'GB').name, 'Thomas');
});

test('novelty voices (Albert, Bahh, Bouffon...) rank below normal ones', () => {
  const list = [v('Albert', 'en-US'), v('Bahh', 'en-US'), v('Bouffon', 'en-US'), v('Plain', 'en-US')];
  const names = rankVoices(list, 'en-US', 'US').map((x) => x.name);
  assert.equal(names[0], 'Plain');
  assert.equal(pickVoice(list, 'en-US', 'US').name, 'Plain');
});
test('well-known natural voices rank above unknown ones', () => {
  const list = [v('Plain', 'en-US'), v('Samantha', 'en-US'), v('Albert', 'en-US')];
  assert.equal(rankVoices(list, 'en-US', 'US')[0].name, 'Samantha');
});
test('a novelty voice is still returned when it is the only one', () => {
  assert.equal(pickVoice([v('Albert', 'en-US')], 'en-US', 'US').name, 'Albert');
});

import { summarizeVoices } from '../src/voice.js';
test('summarizeVoices counts English and French voices and lists every voice with its language', () => {
  const voices = [
    { name: 'Samantha', lang: 'en-US' }, { name: 'Daniel', lang: 'en_GB' },
    { name: 'Amélie', lang: 'fr-CA' }, { name: 'Thomas', lang: 'fr-FR' }, { name: 'Anna', lang: 'de-DE' },
  ];
  const s = summarizeVoices(voices);
  assert.equal(s.total, 5);
  assert.equal(s.en, 2);
  assert.equal(s.fr, 2);
  assert.deepEqual(s.all.map((v) => v.name), ['Amélie', 'Anna', 'Daniel', 'Samantha', 'Thomas']);
  assert.deepEqual(summarizeVoices(null), { total: 0, en: 0, fr: 0, all: [] });
});
