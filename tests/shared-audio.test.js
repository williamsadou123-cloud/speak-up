import test from 'node:test';
import assert from 'node:assert/strict';
import { createSharedPlayer, silentWavUri } from '../src/shared-audio.js';

function fakeEl() {
  const t = new EventTarget();
  return Object.assign(t, { src: '', playbackRate: 1, played: 0, paused: false,
    play() { this.played++; return Promise.resolve(); }, pause() { this.paused = true; } });
}

test('proxy plays through one shared element and sets src and rate', async () => {
  const el = fakeEl(); const make = createSharedPlayer(el);
  const a = make('audio/a.mp3'); a.playbackRate = 1.2; await a.play();
  assert.equal(el.src, 'audio/a.mp3'); assert.equal(el.playbackRate, 1.2); assert.equal(el.played, 1);
});
test('ended listener fires once and is removed so a later clip is not affected', async () => {
  const el = fakeEl(); const make = createSharedPlayer(el);
  let a = 0; let b = 0;
  const pa = make('a.mp3'); await pa.play(); pa.addEventListener('ended', () => a++);
  el.dispatchEvent(new Event('ended'));
  const pb = make('b.mp3'); await pb.play(); pb.addEventListener('ended', () => b++);
  el.dispatchEvent(new Event('ended'));
  assert.deepEqual([a, b], [1, 1]);
});
test('pause detaches listeners of that proxy', async () => {
  const el = fakeEl(); const make = createSharedPlayer(el);
  let n = 0; const p = make('a.mp3'); await p.play(); p.addEventListener('ended', () => n++);
  p.pause(); el.dispatchEvent(new Event('ended'));
  assert.equal(n, 0); assert.equal(el.paused, true);
});
test('silentWavUri is a base64 wav data uri with RIFF header', () => {
  const u = silentWavUri();
  assert.match(u, /^data:audio\/wav;base64,/);
  assert.equal(Buffer.from(u.split(',')[1], 'base64').subarray(0, 4).toString(), 'RIFF');
});
