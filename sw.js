// Service worker: cache-first so the whole manga is playable offline after first read.
const CACHE = 'panelzero-v7';
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
  'data/chapter5g.json',
  'data/chapter6d.json',
  'data/chapter6s.json',
  'data/chapter7a.json',
  'manifest.webmanifest',
  'assets/bg/cut-panels-arena.webp',
  'assets/bg/cut-panels.webp',
  'assets/bg/desk-edge.webp',
  'assets/bg/desk.webp',
  'assets/bg/ending-artist.webp',
  'assets/bg/ending-blank.webp',
  'assets/bg/ending-escape.webp',
  'assets/bg/ink-sea-storm.webp',
  'assets/bg/ink-sea.webp',
  'assets/bg/margin-dark.webp',
  'assets/bg/margin-road.webp',
  'assets/bg/panel-zero.webp',
  'assets/bg/paper-room.webp',
  'assets/bg/route-split.webp',
  'assets/bg/void.webp',
  'assets/sprites/meta.json',
  'assets/sprites/hand-eraser.webp',
  'assets/sprites/artist-kneel.webp',
  'assets/sprites/artist-sit.webp',
  'assets/sprites/artist-smile.webp',
  'assets/sprites/artist-stand.webp',
  'assets/sprites/goma-cheer.webp',
  'assets/sprites/goma-sad.webp',
  'assets/sprites/goma-serious.webp',
  'assets/sprites/goma-stand.webp',
  'assets/sprites/ken-fight.webp',
  'assets/sprites/ken-guard.webp',
  'assets/sprites/ken-kneel.webp',
  'assets/sprites/ken-smile.webp',
  'assets/sprites/ken-stand.webp',
  'assets/sprites/yuri-fight.webp',
  'assets/sprites/yuri-kneel.webp',
  'assets/sprites/yuri-point.webp',
  'assets/sprites/yuri-smile.webp',
  'assets/sprites/yuri-stand.webp',
  'assets/sprites/kai-brace.webp',
  'assets/sprites/kai-crouch.webp',
  'assets/sprites/kai-dodge.webp',
  'assets/sprites/kai-fight-brush.webp',
  'assets/sprites/kai-fight-club.webp',
  'assets/sprites/kai-fight-nib.webp',
  'assets/sprites/kai-idle-club.webp',
  'assets/sprites/kai-kneel.webp',
  'assets/sprites/kai-lying.webp',
  'assets/sprites/kai-point.webp',
  'assets/sprites/kai-run.webp',
  'assets/sprites/kai-sit.webp',
  'assets/sprites/kai-stand-shock.webp',
  'assets/sprites/kai-stand-smile.webp',
  'assets/sprites/kai-stand.webp',
  'assets/sprites/kai-touch.webp',
  'assets/sprites/kai-walk.webp',
  'assets/sprites/rejected-fight.webp',
  'assets/sprites/rejected-kneel.webp',
  'assets/sprites/rejected-restored.webp',
  'assets/sprites/rejected-stand.webp',
  'assets/sprites/smudge-hurt.webp',
  'assets/sprites/smudge-idle.webp',
  'assets/sprites/sumi-brace.webp',
  'assets/sprites/sumi-float-sad.webp',
  'assets/sprites/sumi-float-shock.webp',
  'assets/sprites/sumi-float.webp',
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
