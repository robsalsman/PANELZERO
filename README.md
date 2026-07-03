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

## What's here (v2 — the full game)

A complete choose-your-own-adventure manga, ~15 minutes per read, with
replay value built in:

- **Chapter 1 — Wake Up on the Page**: the tutorial. All five verbs, first
  Hand encounter.
- **Chapter 2 — The Margin Road**: Kai meets **Sumi**, an ink-spirit
  scrapped from an earlier draft, and picks a route — THE branch.
- **Chapter 3 — The Ink Sea** *or* **The Cut Panels**: two entirely
  different chapters. The sea route fights the **Ink Leviathan** (a living
  brush stroke); the cut route duels **The Rejected One** (the protagonist
  who came before you). Each has a mercy choice.
- **Chapter 4 — The Artist's Desk**: the routes converge as Kai climbs OUT
  of the manga onto the desk. The Hand catches Sumi: save her, or keep
  your weapon.
- **Final Chapter — Panel Zero**: the blank first page. Every verb, one
  last time, then the final choice. Your accumulated choices resolve into
  one of **three endings** (THE NEW ARTIST / THE ESCAPE / THE BLANK PAGE),
  tracked on the title screen across reads.

- **Anime-style procedural art**: skeleton-posed characters with expressive
  anime faces (big irises, emotion-driven brows and mouths, spiky/flowing
  hair), cel-shade tone accents — still 100% code, no image assets.
- **Five verbs**: Tap, Swipe, Hold, Trace, Choose — every panel uses exactly one.
- **Custom scroll engine**: the page rubber-bands and locks at the active
  panel until it's cleared; future panels render as unfinished pencil sketches.
- **Fail = erase**: failing a panel plays the Hand erasing it, then it redraws.
  Infinite retries; a zero-fail run earns the **Clean Read** badge.
- **Data-driven panels**: `data/story.json` is the chapter graph (flags
  route ch2 to ch3a/ch3b); each chapter is a JSON file of panels. Chapters
  2+ use a generic scene composer (backgrounds, actors, props, bubbles,
  `byFlag` variants), so new story = new JSON, no engine changes.
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
data/story.json       chapter graph + endings (flags pick the route)
data/chapter*.json    panel definitions (the chapters ARE data)
js/main.js            boot, screen wiring, SW registration
js/game.js            orchestrator: layout, panel state machine, renderer
js/scroll.js          custom scroll controller (lock / rubber-band / glide)
js/input.js           pointer-event gesture recognizer (tap/swipe/hold/trace)
js/verbs.js           the five verb challenges + cutscene/spread
js/scenes.js          ch1 bespoke scene painters
js/compose.js         generic JSON scene composer (ch2+)
js/setpieces.js       bosses, route split, desk, the three ending spreads
js/chars.js           anime character renderer (Kai, Sumi, the Rejected One)
js/art.js             ink primitives: screentone, SFX text, bubbles, the Hand
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

`tests/validate.mjs` statically checks every panel's art refs, verb params,
and story routing. `tests/smoke.mjs` plays the real game in headless
Chromium with genuine gestures — a generic driver reads each panel's JSON
and performs its tap/swipe/hold/trace/choose — across three scenarios
covering both routes and all three endings.

```sh
npm install   # dev-only: playwright
node tests/validate.mjs
node tests/smoke.mjs artist   # full read, sea route  -> THE NEW ARTIST
node tests/smoke.mjs escape   # cut-panels route      -> THE ESCAPE
node tests/smoke.mjs blank    # sea route, no mercy   -> THE BLANK PAGE
```
