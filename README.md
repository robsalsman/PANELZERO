# PANEL ZERO

**You're not reading the manga. You're trapped in it.**

A mobile-first, vertical-scroll manga page where every panel is a playable
micro-challenge. Clear a panel to "ink" it complete and unlock the scroll to
the next one. Kai woke up inside an unfinished manga; the Artist's Hand wants
to erase him before he reaches the final page.

## Play it locally

No build step, no dependencies — it's a static site.

```sh
# any static server works:
python3 -m http.server 8000
# or: npx serve .
```

Open `http://localhost:8000` (best in a mobile viewport / device emulation —
the game is portrait-only by design).

## What's here (v1)

- **Chapter 1 — "Wake Up on the Page"**: 2 pages, 14 panels, ~3 minutes,
  teaching all five verbs and ending in the first Hand encounter.
- **Five verbs**: Tap, Swipe, Hold, Trace, Choose — every panel uses exactly one.
- **Custom scroll engine**: the page rubber-bands and locks at the active
  panel until it's cleared; future panels render as unfinished pencil sketches.
- **Fail = erase**: failing a panel plays the Hand erasing it, then it redraws.
  Infinite retries; a zero-fail run earns the **Clean Read** badge.
- **Data-driven panels**: `data/chapter1.json` describes every panel
  (`type`, `art`, `params`, captions, dialogue flags). The engine interprets
  the JSON — new chapters are new JSON + scene painters, no engine changes.
- **All-procedural ink art**: vector shapes, dot-pattern screentone, SFX text
  as physical objects, ink-in / erase animations. No image assets.
- **Procedural audio**: WebAudio-generated ink scratch / page turn / erase /
  hit / complete. No audio assets.
- **PWA**: manifest + cache-first service worker (offline after first load),
  progress persisted in IndexedDB (resume mid-chapter, choice flags, badges).

## Architecture

```
index.html            shell: canvas + DOM overlays (title, toast, chapter end)
css/style.css         overlay styling
data/chapter1.json    panel definitions (the chapter IS data)
js/main.js            boot, screen wiring, SW registration
js/game.js            orchestrator: layout, panel state machine, renderer
js/scroll.js          custom scroll controller (lock / rubber-band / glide)
js/input.js           pointer-event gesture recognizer (tap/swipe/hold/trace)
js/verbs.js           the five verb challenges + cutscene/spread
js/scenes.js          per-panel procedural scene painters
js/art.js             ink primitives: Kai, screentone, SFX text, the Hand
js/sfx.js             procedural WebAudio SFX + haptics
js/save.js            IndexedDB wrapper
sw.js                 offline cache
```

Panel state machine: `scroll → draw (ink-in) → active (challenge) →
complete (ink flourish) → next`, with `active → erase → draw` on fail.

### A note on the stack

The GDD lists Pixi.js *or* "plain … vanilla JS if simpler". v1 ships as
zero-dependency Canvas 2D: the art is flat black/white vector shapes, so
WebGL buys nothing here, and no deps means no build step, a tiny payload
(well under the 3s/4G budget), and a trivially cacheable offline PWA. If v2
art needs shaders/filters, Pixi can slot in behind the same scene-painter
contract.

## Deploying

Push the repo to any static host (Cloudflare Pages / Netlify / nginx).
No build command; publish directory is the repo root. HTTPS is required for
the service worker / installability.

## Testing

`tests/smoke.mjs` drives the real game in headless Chromium (Playwright):
boots the title screen, taps through the wake-up panel, then completes the
chapter via the debug hook and asserts the chapter-end screen with stats.

```sh
npm install   # dev-only: playwright
node tests/smoke.mjs
```
