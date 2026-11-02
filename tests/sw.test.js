import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Charge sw.js dans un faux environnement de service worker.
function loadSw({ network }) {
  const handlers = {};
  const stores = new Map();
  const store = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const m = stores.get(name);
    return { match: async (r) => { const hit = m.get(typeof r === 'string' ? r : r.url); return hit && hit.clone(); }, put: async (r, res) => { m.set(typeof r === 'string' ? r : r.url, res); }, addAll: async () => {} };
  };
  const calls = [];
  const ctx = {
    self: { addEventListener: (t, f) => { handlers[t] = f; }, skipWaiting() {}, clients: { claim() {} } },
    caches: { open: async (n) => store(n), keys: async () => [], delete: async () => true, match: async () => undefined },
    fetch: async (req) => { calls.push(new Request(req).headers.get('range')); return network(req); },
    location: { origin: 'http://localhost' },
    Request, Response, URL, console, Promise, Math,
  };
  vm.runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), ctx);
  const ask = async (url, headers = {}) => {
    let out;
    await handlers.fetch({ request: new Request(url, { headers }), respondWith: (p) => { out = p; } });
    return out;
  };
  return { ask, calls };
}

const bytes = new Uint8Array(100).map((_, i) => i);
const mp3 = () => new Response(bytes, { status: 200, headers: { 'Content-Type': 'audio/mpeg' } });

test('an mp3 is cached after the first play and served again when offline', async () => {
  let online = true;
  const sw = loadSw({ network: () => { if (!online) throw new Error('offline'); return mp3(); } });
  const first = await sw.ask('http://localhost/audio/v-a-word.mp3');
  assert.equal(first.status, 200);
  online = false;
  const again = await sw.ask('http://localhost/audio/v-a-word.mp3');
  assert.equal(again.status, 200);
  assert.equal((await again.arrayBuffer()).byteLength, 100);
});
test('a cached mp3 is not fetched again (cache first)', async () => {
  const sw = loadSw({ network: mp3 });
  await sw.ask('http://localhost/audio/v-b-word.mp3');
  await sw.ask('http://localhost/audio/v-b-word.mp3');
  assert.equal(sw.calls.length, 1);
});
test('a Range request is answered with 206 from the full cached file', async () => {
  const sw = loadSw({ network: mp3 });
  const res = await sw.ask('http://localhost/audio/v-c-word.mp3', { Range: 'bytes=10-19' });
  assert.equal(res.status, 206);
  assert.equal(res.headers.get('Content-Range'), 'bytes 10-19/100');
  assert.deepEqual([...new Uint8Array(await res.arrayBuffer())], [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  assert.equal(sw.calls[0], null, 'the network request never carries the Range header');
});
test('an mp3 that was never played fails cleanly when offline (the app then falls back to speech)', async () => {
  const sw = loadSw({ network: () => { throw new Error('offline'); } });
  const res = await sw.ask('http://localhost/audio/v-d-word.mp3');
  assert.equal(res.type, 'error');
});
