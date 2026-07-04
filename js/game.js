// Game orchestrator: virtual page layout, panel state machine, render pipeline,
// and the choose-your-own-adventure chapter graph (flags route ch2 -> ch3a/ch3b,
// and accumulated choices decide which of three endings closes the book).
import { ScrollController } from './scroll.js';
import { Input } from './input.js';
import { createChallenge } from './verbs.js';
import { scenes } from './scenes.js';
import { setpieces } from './setpieces.js';
import { composeScene } from './compose.js';
import { INK, PAPER, C, caption as drawCaption, drawVerbIcon } from './art.js';
import { sfx, buzz, initAudio } from './sfx.js';
import { saveGet, saveSet } from './save.js';

const DRAW_TIME = 0.28;    // ink-in — snappy; dead time kills pacing
const COMPLETE_TIME = 0.3; // inked-complete flourish
const ERASE_TIME = 0.5;    // fail: the Hand erases the panel
const POINTS = { perfect: 300, good: 150, ok: 50 };
const VERBS = ['tap', 'swipe', 'hold', 'trace', 'choose'];
const SAVE_KEY = 'save2';

const PAINTERS = { ...scenes, ...setpieces };
const ease = (t) => 1 - Math.pow(1 - t, 3);

// manga-style action stamp: fat colored text, paper halo, ink edge
function drawStamp(ctx, text) {
  const color = text.startsWith('PERFECT') ? C.gold : text === 'CLOSE!' ? C.red : INK;
  ctx.font = '900 30px -apple-system, "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 9;
  ctx.strokeText(text, 0, 0);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
}

export class Game {
  constructor(canvas, story, loadChapter) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.story = story;
    this.loadChapter = loadChapter; // async (id) => chapter JSON

    this.chapterId = null;
    this.chapter = null;
    this.panels = [];
    this.rects = [];
    this.totalH = 0;

    this.phase = 'title'; // title | scroll | draw | active | complete | erase | end
    this.current = 0;
    this.flags = {};
    this.failsChapter = 0;
    this.elapsedChapter = 0;
    this.verbCounts = {};
    this.endingsFound = [];
    this.challenge = null;
    this.phaseT = 0;
    this.activeT = 0;
    this.inkedAt = new Map();
    this._toastTimer = null;

    // skill layer: score, combo, grades, and juice state
    this.score = 0;
    this.combo = 0;
    this.grades = { perfect: 0, good: 0, ok: 0 };
    this.stamps = [];   // floating manga stamps (PERFECT!! etc.)
    this.shakeP = 0;    // screen shake power
    this.freezeT = 0;   // hit-stop

    this.scroll = new ScrollController();
    window.addEventListener('resize', () => this.layout());

    this.input = new Input(canvas, {
      onDown: (p) => this.routeDown(p),
      onMove: (p) => this.routeMove(p),
      onUp: (p) => this.routeUp(p),
      onTap: (p) => this.routeTap(p),
      onSwipe: (d) => this.routeSwipe(d),
    });

    this._last = performance.now();
    requestAnimationFrame(() => this.tick());
  }

  /* ---------------- layout ---------------- */
  layout() {
    const dpr = Math.min(3, window.devicePixelRatio || 1); // full-resolution rendering
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = Math.round(this.W * dpr);
    this.canvas.height = Math.round(this.H * dpr);
    this.dpr = dpr;
    if (!this.panels.length) return;

    const side = Math.round(this.W * 0.05);
    const gutter = Math.round(this.H * 0.045);
    let y = Math.round(this.H * 0.16);
    this.rects = this.panels.map((def, i) => {
      let r;
      if (def.type === 'spread') {
        y += gutter;
        r = { x: 0, y, w: this.W, h: this.H };
      } else {
        r = { x: side, y, w: this.W - side * 2, h: Math.round(def.h * this.H) };
      }
      if (i > 0 && this.panels[i - 1].page !== def.page) r.y += gutter * 1.5;
      y = r.y + r.h + gutter;
      return r;
    });
    this.totalH = y + Math.round(this.H * 0.2);
    if (this.phase !== 'title' && this.phase !== 'end') {
      this.scroll.setMax(this.lockY(Math.min(this.current, this.panels.length - 1)));
      if (this.phase !== 'scroll') this.scroll.jumpTo(this.scroll.max);
    }
  }

  lockY(i) {
    const r = this.rects[i];
    let y = r.h >= this.H ? r.y : r.y - (this.H - r.h) / 2;
    y = Math.max(y, r.y + r.h - this.H);
    y = Math.min(y, r.y - 8);
    return Math.max(0, Math.min(y, this.totalH - this.H));
  }

  /* ---------------- lifecycle ---------------- */
  async startFresh() {
    initAudio();
    const saved = await saveGet(SAVE_KEY);
    this.endingsFound = saved?.endingsFound || [];
    this.bestScore = saved?.bestScore || 0;
    this.flags = {};
    this.score = 0;
    this.combo = 0;
    this.verbCounts = saved?.verbCounts || {}; // verb tutorials stay learned
    await this.beginChapter(this.story.start);
  }

  async resume() {
    initAudio();
    const saved = await saveGet(SAVE_KEY);
    if (!saved || saved.done || !saved.chapterId) return this.startFresh();
    this.flags = saved.flags || {};
    this.verbCounts = saved.verbCounts || {};
    this.endingsFound = saved.endingsFound || [];
    this.bestScore = saved.bestScore || 0;
    this.score = saved.score || 0;
    this.combo = 0;
    await this.beginChapter(saved.chapterId, saved.current || 0, saved);
  }

  async beginChapter(chapterId, atPanel = 0, saved = null) {
    this.chapterId = chapterId;
    this.chapter = await this.loadChapter(this.story.chapters[chapterId].file);
    this.panels = this.chapter.panels;
    this.current = Math.min(atPanel, this.panels.length - 1);
    this.failsChapter = saved?.failsChapter || 0;
    this.elapsedChapter = saved?.elapsedChapter || 0;
    this.grades = { perfect: 0, good: 0, ok: 0 };
    this.stamps = [];
    this.inkedAt.clear();
    this.challenge = null;
    this.layout();
    this.phase = 'scroll';
    this.scroll.frozen = false;
    this.scroll.setMax(this.lockY(this.current));
    this.scroll.jumpTo(Math.max(0, this.scroll.max - this.H * 0.4));
    this.scroll.glideTo(this.scroll.max);
    sfx.page();
    this.persist();
  }

  nextChapterId() {
    const next = this.story.chapters[this.chapterId].next;
    if (!next) return null;
    if (typeof next === 'string') return next;
    for (const [flag, to] of next.byFlag) {
      if (this.flags[flag]) return to;
    }
    return next.default;
  }

  /* ---------------- state machine ---------------- */
  update(dt) {
    this.scroll.update(dt);
    if (this.phase === 'title' || this.phase === 'end') return;
    this.elapsedChapter += dt;
    this.phaseT += dt;

    switch (this.phase) {
      case 'scroll':
        if (this.scroll.atMax() && !this.scroll.dragging) this.beginDraw();
        break;
      case 'draw':
        if (this.phaseT >= DRAW_TIME) this.beginActive();
        break;
      case 'active':
        if (this.freezeT > 0) {
          this.freezeT -= dt; // hit-stop: the world holds its breath
          break;
        }
        this.activeT += dt;
        this.challenge?.update(dt);
        break;
      case 'complete':
        this.activeT += dt;
        if (this.phaseT >= COMPLETE_TIME) this.advance();
        break;
      case 'erase':
        if (this.phaseT >= ERASE_TIME) this.beginDraw(true);
        break;
    }
  }

  beginDraw(isRedraw = false) {
    this.phase = 'draw';
    this.phaseT = 0;
    this.challenge = null;
    this.scroll.frozen = true;
    this.scroll.jumpTo(this.lockY(this.current));
    this.activeT = 0;
    if (!isRedraw) sfx.draw();
  }

  beginActive() {
    const def = this.panels[this.current];
    this.phase = 'active';
    this.phaseT = 0;
    this.activeT = 0;
    const api = {
      succeed: (res) => this.onSucceed(res),
      fail: () => this.onFail(),
      setFlag: (f) => this.setFlag(f),
      flags: this.flags,
      sfx,
      buzz,
      size: () => {
        const r = this.rects[this.current];
        return { w: r.w, h: r.h };
      },
      shake: (p) => { this.shakeP = Math.max(this.shakeP, p); },
      hitstop: (t) => { this.freezeT = Math.max(this.freezeT, t); },
      stamp: (text, small = false) => this.addStamp(text, { small }),
    };
    this.challenge = createChallenge(def, api);
    if (def.toast && VERBS.includes(def.type)) {
      if ((this.verbCounts[def.type] || 0) < 3) this.showToast(def.toast);
    } else if (def.toast) {
      this.showToast(def.toast);
    }
  }

  setFlag(f) {
    if (!f) return;
    this.flags[f] = true;
    // derive the ending the moment the final choice lands
    if (this.flags.eraseAll) {
      this.flags.ending_escape = true;
    } else if (this.flags.finish) {
      if (this.flags.savedSumi && this.flags.mercy) this.flags.ending_artist = true;
      else this.flags.ending_blank = true;
    }
  }

  onSucceed(res = {}) {
    if (this.phase !== 'active') return;
    const def = this.panels[this.current];
    if (VERBS.includes(def.type)) {
      this.verbCounts[def.type] = (this.verbCounts[def.type] || 0) + 1;
    }
    for (const f of def.setFlags || []) this.setFlag(f);

    const grade = res.grade;
    if (grade) {
      this.grades[grade]++;
      const mult = 1 + Math.min(this.combo, 10) * 0.1;
      this.score += Math.round(POINTS[grade] * mult);
      if (grade === 'perfect') {
        this.combo++;
        sfx.perfect(this.combo);
        this.addStamp(this.combo >= 2 ? `PERFECT x${this.combo}` : 'PERFECT!!');
        buzz([20, 30, 20]);
      } else if (grade === 'good') {
        sfx.good();
        this.addStamp('GOOD', { small: true });
        buzz(25);
      } else {
        this.combo = 0;
        sfx.complete();
        buzz(20);
      }
    } else {
      sfx.complete();
      buzz(30);
    }

    this.phase = 'complete';
    this.phaseT = 0;
    this.inkedAt.set(this.current, this.elapsedChapter);
  }

  onFail() {
    if (this.phase !== 'active') return;
    this.failsChapter++;
    this.combo = 0;
    this.shakeP = Math.max(this.shakeP, 7);
    this.phase = 'erase';
    this.phaseT = 0;
    sfx.erase();
    buzz([40, 60, 40]);
  }

  addStamp(text, opts = {}) {
    const r = this.rects[this.current];
    if (!r) return;
    this.stamps.push({
      text,
      x: r.x + r.w * (0.3 + Math.random() * 0.4),
      y: r.y + r.h * (0.28 + Math.random() * 0.2),
      t: 0,
      rot: (Math.random() - 0.5) * 0.3,
      small: opts.small || false,
    });
  }

  advance() {
    this.current++;
    this.persist();
    if (this.current >= this.panels.length) {
      this.finishChapter();
      return;
    }
    this.phase = 'scroll';
    this.phaseT = 0;
    this.challenge = null;
    this.scroll.frozen = false;
    this.scroll.setMax(this.lockY(this.current));
    this.scroll.glideTo(this.scroll.max);
    const prev = this.panels[this.current - 1];
    if (prev.page !== this.panels[this.current].page) sfx.page();
  }

  async persist(done = false) {
    if (done) this.bestScore = Math.max(this.bestScore || 0, this.score);
    await saveSet(SAVE_KEY, {
      chapterId: this.chapterId,
      current: this.current,
      flags: this.flags,
      failsChapter: this.failsChapter,
      elapsedChapter: this.elapsedChapter,
      score: this.score,
      bestScore: this.bestScore || 0,
      verbCounts: this.verbCounts,
      endingsFound: this.endingsFound,
      done,
    });
  }

  chapterRank() {
    const g = this.grades;
    const graded = g.perfect + g.good + g.ok;
    const pFrac = graded ? g.perfect / graded : 0;
    if (this.failsChapter === 0 && pFrac >= 0.65) return 'S';
    if (this.failsChapter <= 1 && pFrac >= 0.35) return 'A';
    if (this.failsChapter <= 3) return 'B';
    return 'C';
  }

  finishChapter() {
    this.phase = 'end';
    this.scroll.frozen = true;
    const nextId = this.nextChapterId();
    const isFinale = !nextId;

    const mins = Math.floor(this.elapsedChapter / 60);
    const secs = Math.floor(this.elapsedChapter % 60);
    document.getElementById('stat-time').textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    document.getElementById('stat-fails').textContent = String(this.failsChapter);
    document.getElementById('stat-score').textContent = this.score.toLocaleString();
    const rank = this.chapterRank();
    const rankEl = document.getElementById('rank-badge');
    rankEl.textContent = rank;
    rankEl.dataset.rank = rank;
    document.getElementById('clean-badge').classList.toggle('hidden', this.failsChapter !== 0);

    const titleEl = document.getElementById('end-title');
    const nextEl = document.getElementById('end-next');
    const btnNext = document.getElementById('btn-next');
    const btnAgain = document.getElementById('btn-again');
    const endingLine = document.getElementById('end-endings');

    if (isFinale) {
      const endingId = ['ending_artist', 'ending_escape', 'ending_blank'].find((e) => this.flags[e]) || 'ending_blank';
      const ending = this.story.endings.find((e) => e.id === endingId);
      if (!this.endingsFound.includes(endingId)) this.endingsFound.push(endingId);
      titleEl.textContent = `ENDING: ${ending.name}`;
      nextEl.textContent = 'T H E   E N D';
      const newBest = this.score > (this.bestScore || 0);
      endingLine.textContent = `ENDINGS FOUND: ${this.endingsFound.length}/${this.story.endings.length}` +
        (this.endingsFound.length < this.story.endings.length ? ' — choose differently next read.' : ' — you found them all!') +
        (newBest ? '  ★ NEW BEST SCORE' : '');
      endingLine.classList.remove('hidden');
      btnNext.classList.add('hidden');
      btnAgain.classList.remove('hidden');
      this.persist(true);
    } else {
      const nextCh = this.story.chapters[nextId];
      titleEl.textContent = `${this.chapter.title} COMPLETE`;
      nextEl.textContent = `NEXT: ${nextId.toUpperCase()}`;
      endingLine.classList.add('hidden');
      btnNext.classList.remove('hidden');
      btnAgain.classList.add('hidden');
      this._pendingNext = nextId;
      // persist AT the next chapter's start so a reload resumes forward
      saveSet(SAVE_KEY, {
        chapterId: nextId,
        current: 0,
        flags: this.flags,
        failsChapter: 0,
        elapsedChapter: 0,
        score: this.score,
        bestScore: this.bestScore || 0,
        verbCounts: this.verbCounts,
        endingsFound: this.endingsFound,
        done: false,
      });
      // subtitle preview comes when the chapter file is known — fetch lazily
      this.loadChapter(nextCh.file).then((c) => {
        nextEl.textContent = `NEXT: ${c.title} — ${c.subtitle}`;
      }).catch(() => {});
    }
    document.getElementById('chapter-end').classList.remove('hidden');
  }

  async continueNext() {
    if (!this._pendingNext) return;
    const id = this._pendingNext;
    this._pendingNext = null;
    document.getElementById('chapter-end').classList.add('hidden');
    await this.beginChapter(id);
  }

  async restartBook() {
    document.getElementById('chapter-end').classList.add('hidden');
    await this.startFresh();
  }

  /* ---------------- input routing ---------------- */
  toLocal(p) {
    const r = this.rects[this.current];
    return { x: p.x - r.x, y: p.y + this.scroll.y - r.y };
  }

  routeDown(p) {
    if (this.phase === 'active') {
      this._mode = 'challenge';
      this.challenge?.onDown?.(this.toLocal(p));
    } else if (this.phase === 'scroll') {
      this._mode = 'scroll';
      this.scroll.dragStart(p.y);
    } else this._mode = null;
  }

  routeMove(p) {
    if (this._mode === 'challenge') this.challenge?.onMove?.(this.toLocal(p));
    else if (this._mode === 'scroll') this.scroll.dragMove(p.y);
  }

  routeUp(p) {
    if (this._mode === 'challenge') this.challenge?.onUp?.(this.toLocal(p));
    else if (this._mode === 'scroll') this.scroll.dragEnd();
    this._mode = null;
  }

  routeTap(p) {
    if (this.phase === 'active') this.challenge?.onTap?.(this.toLocal(p));
  }

  routeSwipe(dir) {
    if (this.phase === 'active') this.challenge?.onSwipe?.(dir);
  }

  /* ---------------- toast ---------------- */
  showToast(text) {
    const el = document.getElementById('toast');
    clearTimeout(this._toastTimer);
    el.textContent = text;
    el.classList.remove('hidden', 'out');
    this._toastTimer = setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.classList.add('hidden'), 320);
    }, 2200);
  }

  /* ---------------- render ---------------- */
  tick() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this._dtFrame = dt;
    this.update(dt);
    this.render();
    requestAnimationFrame(() => this.tick());
  }

  captionFor(def) {
    if (def.captionByFlag) {
      for (const [flag, text] of Object.entries(def.captionByFlag)) {
        if (flag !== 'default' && this.flags[flag]) return text;
      }
      return def.captionByFlag.default || null;
    }
    return def.caption || null;
  }

  render() {
    const { ctx, W, H } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#e9e6df';
    ctx.fillRect(0, 0, W, H);
    if (!this.panels.length || !this.chapter) return;

    // screen shake
    let shx = 0;
    let shy = 0;
    if (this.shakeP > 0.15) {
      shx = (Math.random() - 0.5) * this.shakeP * 2;
      shy = (Math.random() - 0.5) * this.shakeP * 2;
      this.shakeP *= Math.pow(0.0004, this._dtFrame || 0.016);
    } else this.shakeP = 0;

    ctx.save();
    ctx.translate(Math.round(shx), Math.round(shy) - Math.round(this.scroll.y));

    ctx.fillStyle = PAPER;
    ctx.fillRect(-20, -20, W + 40, this.totalH + 40);

    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.font = `900 ${Math.round(H * 0.045)}px -apple-system, "Arial Black", sans-serif`;
    ctx.fillText(this.chapter.title, W / 2, H * 0.07);
    ctx.font = `800 ${Math.round(H * 0.02)}px -apple-system, sans-serif`;
    ctx.globalAlpha = 0.65;
    ctx.fillText(this.chapter.subtitle, W / 2, H * 0.1);
    ctx.globalAlpha = 1;

    for (let i = 0; i < this.panels.length; i++) {
      const r = this.rects[i];
      if (r.y - this.scroll.y > H + 40 || r.y + r.h - this.scroll.y < -40) continue;
      this.renderPanel(i);
      if (i > 0 && this.panels[i - 1].page !== this.panels[i].page) {
        ctx.fillStyle = INK;
        ctx.globalAlpha = 0.35;
        ctx.font = `800 ${Math.round(H * 0.016)}px -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`— PAGE ${this.panels[i].page} —`, W / 2, r.y - H * 0.028);
        ctx.globalAlpha = 1;
      }
    }

    // floating manga stamps (PERFECT!! / CLOSE!)
    const dtF = this._dtFrame || 0.016;
    for (const st of this.stamps) st.t += dtF;
    this.stamps = this.stamps.filter((st) => st.t < 0.85);
    for (const st of this.stamps) {
      const p = st.t / 0.85;
      const pop = p < 0.18 ? p / 0.18 : 1;
      const scale = (st.small ? 0.55 : 1) * (0.6 + pop * 0.4) * (1 + Math.max(0, p - 0.6) * 0.3);
      ctx.save();
      ctx.translate(st.x, st.y - p * 26);
      ctx.rotate(st.rot);
      ctx.scale(scale, scale);
      ctx.globalAlpha = p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1;
      drawStamp(ctx, st.text);
      ctx.restore();
    }

    ctx.restore();

    // live HUD: combo brush counter (screen space, only mid-streak)
    if (this.combo >= 2 && (this.phase === 'active' || this.phase === 'complete' || this.phase === 'draw')) {
      ctx.save();
      ctx.translate(W - 14, H * 0.16);
      ctx.rotate(0.06);
      ctx.textAlign = 'right';
      ctx.font = `900 ${Math.round(H * 0.026)}px -apple-system, "Arial Black", sans-serif`;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = 6;
      ctx.strokeText(`${this.combo} COMBO`, 0, 0);
      ctx.fillStyle = C.red;
      ctx.fillText(`${this.combo} COMBO`, 0, 0);
      ctx.restore();
    }
  }

  renderPanel(i) {
    const { ctx } = this;
    const def = this.panels[i];
    const r = this.rects[i];
    const isCurrent = i === this.current;
    const done = i < this.current || (isCurrent && (this.phase === 'complete' || this.phase === 'end'));

    if (i > this.current) {
      // unfinished manga: future panels are rough pencil sketches
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.globalAlpha = 0.18;
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.setLineDash([]);
      ctx.beginPath();
      for (let hx = r.x + 24; hx < r.x + r.w; hx += 42) {
        ctx.moveTo(hx, r.y + 12);
        ctx.lineTo(hx - 18, r.y + 34);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    const drawProg = isCurrent && this.phase === 'draw' ? ease(Math.min(1, this.phaseT / DRAW_TIME)) : 1;
    const erasing = isCurrent && this.phase === 'erase';

    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    ctx.fillStyle = PAPER;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    if (drawProg < 1) {
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w * drawProg, r.h);
      ctx.clip();
      ctx.globalAlpha = 0.4 + drawProg * 0.6;
    }

    ctx.translate(r.x, r.y);
    const o = {
      t: isCurrent ? this.activeT : 999,
      phase: done ? 'done' : 'active',
      flags: this.flags,
      ch: isCurrent ? this.challenge : null,
      line: def.linesByFlag ? (this.flags.aware ? def.linesByFlag.aware : def.linesByFlag.default) : null,
    };
    if (typeof def.art === 'string') {
      PAINTERS[def.art]?.(ctx, r.w, r.h, o);
    } else if (def.art) {
      composeScene(ctx, r.w, r.h, def.art, o);
    }

    const capText = this.captionFor(def);
    if (capText) drawCaption(ctx, capText, r.w, 10, Math.min(19, Math.max(12, r.h * 0.042)));

    if (isCurrent && this.phase === 'active' && this.challenge) {
      this.challenge.draw(ctx, r.w, r.h);
    }

    if (isCurrent && VERBS.includes(def.type) && (this.verbCounts[def.type] || 0) < 3 &&
        (this.phase === 'active' || this.phase === 'draw')) {
      drawVerbIcon(ctx, def.type, r.w - 26, 26, 15);
    }

    if (erasing) {
      const p = Math.min(1, this.phaseT / ERASE_TIME);
      ctx.save();
      for (let b = 0; b < 5; b++) {
        const bandY = (b / 5) * r.h;
        const bw = r.w * Math.min(1, p * 1.6 - b * 0.12);
        if (bw <= 0) continue;
        ctx.fillStyle = 'rgba(247,244,236,0.96)';
        ctx.fillRect(b % 2 === 0 ? 0 : r.w - bw, bandY, bw, r.h / 5 + 1);
        ctx.fillStyle = 'rgba(17,17,17,0.12)';
        const ex = b % 2 === 0 ? bw : r.w - bw;
        ctx.fillRect(ex - 6, bandY, 12, r.h / 5 + 1);
      }
      ctx.restore();
    }

    ctx.restore();

    ctx.save();
    ctx.strokeStyle = INK;
    if (done) {
      ctx.lineWidth = 5;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    } else {
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.35 + drawProg * 0.65;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
    ctx.restore();

    const inked = this.inkedAt.get(i);
    if (inked !== undefined) {
      const age = this.elapsedChapter - inked;
      if (age < 0.7 && age >= 0) {
        const p = age / 0.7;
        ctx.save();
        ctx.strokeStyle = INK;
        ctx.globalAlpha = 1 - p;
        ctx.lineWidth = 3;
        ctx.strokeRect(r.x - p * 10, r.y - p * 10, r.w + p * 20, r.h + p * 20);
        const cx = r.x + r.w - 30;
        const cy = r.y + r.h - 28;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy);
        ctx.lineTo(cx - 2, cy + 8);
        ctx.lineTo(cx + 12, cy - 8);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
