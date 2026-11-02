// Réseau d'abord (contenu toujours à jour), cache en secours pour l'usage hors ligne.
const CACHE = 'speak-up-v5';
// Les mp3 ont leur propre cache : il survit aux mises à jour de l'application.
const AUDIO_CACHE = 'speak-up-audio-v1';
const IS_MP3 = /\/audio\/[^/]+\.mp3$/;
const SHELL = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'audio/manifest.json',
  'icons/icon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'data/expressions.json',
  'data/grammar.json',
  'data/verbs.json',
  'data/vocab.json',
  'src/audio.js',
  'src/badges.js',
  'src/content.js',
  'src/exercises.js',
  'src/placement.js',
  'src/srs.js',
  'src/store.js',
  'src/ui/app.js',
  'src/ui/cards.js',
  'src/ui/dom.js',
  'src/ui/exercises-view.js',
  'src/ui/expressions.js',
  'src/ui/grammar.js',
  'src/ui/home.js',
  'src/ui/listen.js',
  'src/ui/placement-view.js',
  'src/ui/verbs.js',
  'src/listen-steps.js',
  'src/voice.js',
  'src/learn.js',
  'src/ui/nav.js',
  'src/ui/learn-hub.js',
  'src/ui/me.js',
  'src/ui/voice-settings.js',
  'src/ui/sheet.js',
  'src/ui/vocab.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Les lecteurs audio demandent des morceaux (Range) : on répond avec 206 depuis le fichier complet en cache.
async function withRange(res, range) {
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!m || (m[1] === '' && m[2] === '')) return res;
  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  const start = m[1] === '' ? Math.max(0, size - Number(m[2])) : Number(m[1]);
  const end = m[1] !== '' && m[2] !== '' ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  const part = buf.slice(start, end + 1);
  return new Response(part, { status: 206, headers: {
    'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes',
    'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(part.byteLength) } });
}

// mp3 : cache d'abord ; au premier passage on télécharge le fichier entier (sans Range) puis on le garde.
async function serveAudio(req) {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const key = new Request(req.url);
    let res = await cache.match(key);
    if (!res) {
      res = await fetch(key);
      if (!res.ok || res.status !== 200) return res;
      await cache.put(key, res.clone());
    }
    return await withRange(res, req.headers.get('range'));
  } catch {
    return Response.error();
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (IS_MP3.test(new URL(req.url).pathname)) { e.respondWith(serveAudio(req)); return; }
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html'))));
});
