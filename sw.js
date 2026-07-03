// Service worker: cache-first so the whole manga is playable offline after first read.
const CACHE = 'panelzero-v2';
const ASSETS = [
  '.',
  'index.html',
  'css/style.css',
  'js/main.js',
  'js/game.js',
  'js/scroll.js',
  'js/input.js',
  'js/verbs.js',
  'js/scenes.js',
  'js/setpieces.js',
  'js/compose.js',
  'js/chars.js',
  'js/art.js',
  'js/sfx.js',
  'js/save.js',
  'data/story.json',
  'data/chapter1.json',
  'data/chapter2.json',
  'data/chapter3a.json',
  'data/chapter3b.json',
  'data/chapter4.json',
  'data/chapter5.json',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-maskable.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
    )
  );
});
