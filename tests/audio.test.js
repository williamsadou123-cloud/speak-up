import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../src/audio.js';

const okEl = () => ({ play: async () => {}, pause() {}, onended: null, addEventListener(e, f) { if (e === 'ended') setTimeout(f, 0); }, removeEventListener() {} });
const failEl = () => ({ play: async () => { throw new Error('nope'); }, pause() {}, addEventListener() {}, removeEventListener() {} });
const speech = () => {
  const s = { spoken: [], cancelled: false,
    speak(u) { s.spoken.push(u); setTimeout(() => u.onend && u.onend(), 0); },
    cancel() { s.cancelled = true; } };
  return s;
};
globalThis.SpeechSynthesisUtterance ??= class { constructor(t) { this.text = t; } };

test('plays the mp3 when the manifest has the key', async () => {
  const a = createAudio({ manifest: { 'w1:word': 'audio/w1-word.mp3' }, speech: speech(), makeAudio: okEl });
  assert.equal(await a.speak('w1:word', 'hi', 'en-US', 1), 'file');
});
test('falls back to speech when the mp3 fails to play', async () => {
  const sp = speech();
  const a = createAudio({ manifest: { k: 'x.mp3' }, speech: sp, makeAudio: failEl });
  assert.equal(await a.speak('k', 'hi', 'en-US', 1), 'speech');
  assert.equal(sp.spoken.length, 1);
});
test('falls back to speech when the key is absent', async () => {
  const a = createAudio({ manifest: {}, speech: speech(), makeAudio: okEl });
  assert.equal(await a.speak('zzz', 'hi', 'en-US', 1), 'speech');
});
test('returns "none" and does not throw when there is no speech and no mp3', async () => {
  const a = createAudio({ manifest: {}, speech: null, makeAudio: okEl });
  assert.equal(await a.speak('zzz', 'hi', 'en-US', 1), 'none');
});
test('rate is passed to speech', async () => {
  const sp = speech();
  const a = createAudio({ manifest: {}, speech: sp, makeAudio: okEl });
  await a.speak('k', 'hi', 'en-US', 0.7);
  assert.equal(sp.spoken[0].rate, 0.7);
  assert.equal(sp.spoken[0].lang, 'en-US');
});
test('stop cancels both audio and speech', () => {
  const sp = speech();
  const a = createAudio({ manifest: {}, speech: sp, makeAudio: okEl });
  a.stop();
  assert.equal(sp.cancelled, true);
});

test('returns "none" when voices exist but none match the language', async () => {
  const sp = speech();
  sp.getVoices = () => [{ lang: 'fr-FR' }];
  const a = createAudio({ manifest: {}, speech: sp, makeAudio: okEl });
  assert.equal(await a.speak('k', 'hi', 'en-US', 1), 'none');
  assert.equal(sp.spoken.length, 0);
});
test('an empty voice list is treated as unknown and still speaks', async () => {
  const sp = speech();
  sp.getVoices = () => [];
  const a = createAudio({ manifest: {}, speech: sp, makeAudio: okEl });
  assert.equal(await a.speak('k', 'hi', 'en-US', 1), 'speech');
});
test('stop while an mp3 is loading does not fall back to speech', async () => {
  const sp = speech();
  let rejectPlay;
  const el = {
    play: () => new Promise((_, rej) => { rejectPlay = rej; }),
    pause() { rejectPlay(new DOMException('aborted', 'AbortError')); },
    addEventListener() {}, removeEventListener() {},
  };
  const a = createAudio({ manifest: { k: 'x.mp3' }, speech: sp, makeAudio: () => el });
  const p = a.speak('k', 'old text', 'en-US', 1);
  a.stop();
  assert.equal(await p, 'none');
  assert.equal(sp.spoken.length, 0);
});

const withVoices = (voices) => ({ ...speech(), getVoices: () => voices });
const lastSpoken = (sp) => sp.spoken[sp.spoken.length - 1];

test('audio sets utterance.voice to the picked voice and lang en-GB for accent GB', async () => {
  const voices = [{ name: 'Alex', lang: 'en-US' }, { name: 'Daniel', lang: 'en-GB' }];
  const sp = withVoices(voices);
  const a = createAudio({ manifest: {}, speech: sp, makeAudio: okEl, getPrefs: () => ({ accent: 'GB', enName: null, frName: null }) });
  assert.equal(await a.speak('k', 'hi', 'en-US', 1), 'speech');
  assert.equal(lastSpoken(sp).voice.name, 'Daniel');
  assert.equal(lastSpoken(sp).lang, 'en-GB');
});
test('audio uses the preferred voice name when installed', async () => {
  const voices = [{ name: 'Alex', lang: 'en-US' }, { name: 'Samantha', lang: 'en-US' }];
  const sp = withVoices(voices);
  const a = createAudio({ manifest: {}, speech: sp, makeAudio: okEl, getPrefs: () => ({ accent: 'US', enName: 'Samantha', frName: null }) });
  await a.speak('k', 'hi', 'en-US', 1);
  assert.equal(lastSpoken(sp).voice.name, 'Samantha');
});
test('audio picks the french voice for fr-FR and leaves lang alone', async () => {
  const voices = [{ name: 'Alex', lang: 'en-US' }, { name: 'Thomas', lang: 'fr-FR' }];
  const sp = withVoices(voices);
  const a = createAudio({ manifest: {}, speech: sp, makeAudio: okEl, getPrefs: () => ({ accent: 'GB', enName: null, frName: 'Thomas' }) });
  await a.speak('k', 'salut', 'fr-FR', 1);
  assert.equal(lastSpoken(sp).voice.name, 'Thomas');
  assert.equal(lastSpoken(sp).lang, 'fr-FR');
});
test('audio still returns "none" only when no voice matches the language', async () => {
  const sp = withVoices([{ name: 'Thomas', lang: 'fr-FR' }]);
  const a = createAudio({ manifest: {}, speech: sp, makeAudio: okEl, getPrefs: () => ({ accent: 'GB' }) });
  assert.equal(await a.speak('k', 'hi', 'en-US', 1), 'none');
  assert.equal(await a.speak('k', 'salut', 'fr-FR', 1), 'speech');
});
test('missing getPrefs keeps the old behaviour', async () => {
  const sp = withVoices([{ name: 'Alex', lang: 'en-US' }]);
  const a = createAudio({ manifest: {}, speech: sp, makeAudio: okEl });
  assert.equal(await a.speak('k', 'hi', 'en-US', 1), 'speech');
});

test('speak stops the clip that is already playing', async () => {
  const played = [];
  const mk = () => { const el = { paused: false, play: async () => {}, pause() { el.paused = true; }, addEventListener() {}, removeEventListener() {} }; played.push(el); return el; };
  const a = createAudio({ manifest: { a: 'a.mp3', b: 'b.mp3' }, speech: speech(), makeAudio: mk });
  const first = a.speak('a', 'x', 'en-US', 1);
  await new Promise((r) => setTimeout(r, 5));
  const second = a.speak('b', 'y', 'en-US', 1);
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(played[0].paused, true);
  a.stop();
  await Promise.all([first, second]);
});
