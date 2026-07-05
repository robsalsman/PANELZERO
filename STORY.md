# PANEL ZERO — Story Bible (Vol. 1–3)

**Logline:** A boy wakes up inside an unfinished manga and fights his way to
the blank first page — through every character his creator drew and threw
away — to decide whether this story deserves to end, to be finished, or to
be his.

Target readers: shonen/seinen manga fans (JJK, One Piece, Baki, JoJo).
Tone: real stakes, ink-as-blood violence, humor as armor, tragedy underneath.

---

## CYOA architecture (branch-and-bottleneck)

- **Wide branches, hard bottlenecks.** Routes split (Ink Sea / Cut Panels,
  duel opponent, side chapters) and reconverge at act breaks — but STATE
  (flags, bonds, techniques, kills) flows through and changes every scene
  after it.
- **Delayed consequences.** Every Act-1 choice pays off in Act 3: mercy to
  the Leviathan buys you a tidal save in the finale; sparing the Rejected
  One buys the darkest-hour rescue; every kill closes an ending.
- **No false choices.** Every option is at minimum echoed in dialogue;
  the big ones move bonds, unlock techniques, or kill characters.
- **Optional depth.** Side chapters are skippable — but skipping them is
  itself a choice the finale remembers.
- **Roster finale.** The last battle is assembled from your record:
  allies appear (or don't), phases shorten (or don't), endings unlock
  (or lock) based on the whole run.

## State model

- **Flags** (booleans): route_sea/route_cut, mercy/slain, savedSumi/keptWeapon,
  aware, friendly, recruit_X/defeat_X, empathy/resent, side_sumi …
- **Bonds** (counters): `sumi`, `rival`, `world` — raised by choices and side
  chapters, displayed at chapter end, gate endings and finale assists.
- **Ruthless count**: kills (slain leviathan, faded rejected, executed draft,
  abandoned Sumi). 3+ opens the darkest ending; each kill also closes doors.
- **Ink Arts** (techniques): named trace attacks with kanji stamps.
  - 一文字 ICHIMONJI ("Straight Cut") — from your Act 1 weapon.
  - 水鏡 MIZUKAGAMI ("Water Mirror") — from Sumi's side chapter.
  - 共筆 TOMOFUDE ("Shared Brush") — finale-only, requires an ally.

## Cast

- **KAI** — the current draft. Doesn't want to be a protagonist; becomes one.
- **SUMI** — ink spirit; the Artist's very first character, drawn at age 12
  and never shown to anyone. The soul of the story.
- **THE REJECTED ONE ("REJ")** — draft 4, the one right before Kai. Half
  unfinished. Hates Kai for existing. The rival arc.
- **THE DRAFTS (Vol. 2 tournament):**
  - **KEN** — draft 1, '90s hot-blood battle manga. Mountain of scars.
    Speaks only in training metaphors. Baki energy. Respects only strength.
  - **YURI** — draft 2, bizarre-adventure reality-bender. Deadpan. Fights
    with the gutters BETWEEN panels (attacks arrive one beat late). JoJo energy.
  - **GOMA** — draft 3, gag-manga blob. Never stops joking. Was erased for
    "not being funny enough." The saddest one. One Piece heart.
- **THE ARTIST** — a burned-out mangaka whose series was cancelled by her
  editor. The HAND is her own hand, erasing everything she was. The villain
  is despair, wearing her sleeve.

## Structure

### VOLUME 1 — TRAPPED (ch1–ch4) *(shipped)*
Wake → meet Sumi → route split (Sea/Cut) → mercy choices → the desk →
the Hand takes Sumi (SAVE HER / KEEP THE WEAPON) → arrival at Page One.

### VOLUME 2 — THE GAUNTLET OF DRAFTS (new)
- **CH5 — THE GAUNTLET.** Page One is fortified: the Hand has piled every
  crumpled draft into an arena. The three Drafts hold the gate. They don't
  serve the Hand — they fight because a duel is the only proof they ever
  existed. **CHOICE: pick your opponent** (Ken / Yuri / Goma). The other two
  watch — and remember.
- **CH6 — THE DUEL.** Full boss duel, patterns by rival (Ken: overwhelming
  barrage; Yuri: delayed gutter-attacks; Goma: gag patterns that turn dead
  serious). At the kill point — **CHOICE: FINISH THEM or REACH OUT.**
  Recruit = they join your roster for the finale. Execute = ruthless+1,
  and the watchers' eyes change.
- **CH7 — INK MEMORY** *(optional side chapter; only offered if Sumi lives).*
  Sumi shows Kai her deleted first chapter — a 12-year-old's pencil world,
  crude and glowing. Unlocks 水鏡 MIZUKAGAMI + maxes her bond.
  **CHOICE to enter is itself a choice** ("Rest" vs "Push on").
- **CH8 — THE ARTIST'S ROOM.** Climbing into the Artist's memory: the
  studio, the deadline calendar, the cancellation email, pills and cold
  coffee. The Hand isn't a monster — it's a person erasing herself.
  **CHOICE: "She gave up on us" (RESENT) vs "She's trapped in a panel too"
  (EMPATHY).** Gates the endings.

### VOLUME 3 — PANEL ZERO (ch9, rebuilt finale)
Three-phase battle vs THE HAND, assembled from your record:
- **Phase 1 — ERASER STORM.** Survive. Allies intercept hazards (each ally
  = one hazard absorbed, on screen).
- **Phase 2 — THE PENCIL.** Trace duels — your Ink Arts vs its strokes.
  Sumi's MIZUKAGAMI reflects a phase if unlocked.
- **Phase 3 — THE GRIP.** It catches you. Mash to break free — every ally
  visibly pries fingers open (allies reduce the tap count).
- **THE LAST CHOICE**, gated by state (see endings).

## Endings (6)

| # | Ending | Requirements | Beat |
|---|---|---|---|
| 1 | 共筆 **THE CO-AUTHORS** | EMPATHY + Sumi alive + ≥1 recruited Draft + mercy record | Kai offers the pencil — and his hand. They draw the next chapter TOGETHER; the whole cast gets pages. The true ending. |
| 2 | **THE NEW ARTIST** | finish, Sumi alive + mercy | Kai finishes the manga himself. Warm, earned. |
| 3 | **THE PUBLISHED** | give the pencil back + EMPATHY + bonds high | The Artist wakes at her desk. Epilogue: a printed volume titled PANEL ZERO. |
| 4 | **THE BLANK PAGE** | give the pencil back (default) | The Hand hesitates… and draws a door. Bittersweet. |
| 5 | **THE ESCAPE** | erase it all | Kai breaks the border and walks out alone. Freedom, at cost. |
| 6 | 新しい手 **THE NEW HAND** | erase + RUTHLESS ≥3 | Kai takes the eraser. Final panel: HIS hand, descending over a fresh page — over a new sleeping boy. The dark mirror. |

## Violence & tone guardrails

Shonen-brutal, not gore: ink is blood (characters bleed black-red ink;
wounds are torn linework). Deaths are permanent, on-screen, and quiet —
the horror is erasure, not splatter. Goma's death (if you execute him)
cuts him off MID-JOKE. That's the JJK lesson: the cruelest panel is the
silent one.
