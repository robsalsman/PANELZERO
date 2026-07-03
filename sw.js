// Service worker: cache-first so the manga is playable offline after first read.
const CACHE = 'panelzero-v1';
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
  'js/art.js',
  'js/sfx.js',
  'js/save.js',
  'data/chapter1.json',
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
