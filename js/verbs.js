// Verb engine (M1). One challenge object per active panel. Exactly one verb each.
// Contract: { update(dt), draw(ctx, w, h), onDown/onMove/onUp/onTap/onSwipe }.
// api = { succeed(), fail(), setFlag(name), flags, sfx, buzz, size: () => ({w, h}) }
import { INK, impactStar, drawSFXText, drawKai, drawSmudge, speechBubble } from './art.js';
import { anchors } from './scenes.js';

/* ---------- helpers ---------- */
function ripple(list, x, y) {
  list.push({ x, y, t: 0 });
}

function drawRipples(ctx, list, dt) {
  for (const r of list) r.t += dt;
  for (let i = list.length - 1; i >= 0; i--) if (list[i].t > 0.5) list.splice(i, 1);
  for (const r of list) {
    const p = r.t / 0.5;
    ctx.strokeStyle = INK;
    ctx.globalAlpha = (1 - p) * 0.8;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 8 + p * 34, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ---------- TAP ---------- */
function tapChallenge(def, api) {
  const p = def.params;
  const ripples = [];
  let timeLeft = p.time ?? null;
  let smudgeHop = 0;

  const hitArea = (w, h) => {
    switch (p.hit) {
      case 'kai': {
        const k = anchors.kaiWake(w, h);
        return { x: k.x, y: k.y - k.s * 0.3, r: k.s * 0.55 };
      }
      case 'letterC': {
        const c = anchors.letterC(w, h);
        return { x: c.x, y: c.y, r: Math.max(c.r, 44) };
      }
      case 'smudge': {
        const s = anchors.smudge(w, h);
        // hops toward/away from Kai as it takes hits
        const dx = Math.sin(smudgeHop * 2.4) * w * 0.14;
        return { x: s.x + dx, y: s.y, r: Math.max(s.r * 1.2, 48) };
      }
      default:
        return { x: w / 2, y: h / 2, r: Math.min(w, h) * 0.4 };
    }
  };

  return {
    count: 0,
    holding: false,
    update(dt) {
      if (timeLeft !== null) {
        timeLeft -= dt;
        if (timeLeft <= 0) {
          timeLeft = null;
          api.fail();
        }
      }
      this._dt = dt;
    },
    onTap(pt) {
      const { w, h } = api.size();
      const a = hitArea(w, h);
      if (Math.hypot(pt.x - a.x, pt.y - a.y) <= a.r) {
        this.count++;
        smudgeHop++;
        ripple(ripples, pt.x, pt.y);
        api.sfx.ink();
        api.buzz(15);
        if (this.count >= p.count) {
          if (p.hit === 'smudge') api.sfx.hit();
          api.succeed();
        }
      }
    },
    draw(ctx, w, h) {
      const a = hitArea(w, h);
      // pulsing target ring
      const t = performance.now() / 1000;
      const pulse = 1 + Math.sin(t * 4) * 0.07;
      ctx.strokeStyle = INK;
      ctx.setLineDash([8, 7]);
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      if (p.hit === 'smudge') {
        // the creature itself (moves with hits)
        const hpFrac = 1 - this.count / p.count;
        drawSmudge(ctx, a.x, a.y, Math.min(w, h) * 0.2, t, Math.max(0.2, hpFrac));
        // ink-drain timer on Kai's floor tile
        if (timeLeft !== null && p.time) {
          const k = anchors.kaiFight(w, h);
          const frac = Math.max(0, timeLeft / p.time);
          const tw = w * 0.17;
          const tx = k.x - tw / 2;
          const ty = h * 0.84;
          ctx.fillStyle = INK;
          ctx.globalAlpha = 0.8;
          ctx.fillRect(tx, ty + (1 - frac) * h * 0.1, tw, frac * h * 0.1);
          ctx.globalAlpha = 1;
        }
      }

      // tap tick marks
      ctx.fillStyle = INK;
      for (let i = 0; i < p.count; i++) {
        ctx.globalAlpha = i < this.count ? 1 : 0.2;
        ctx.beginPath();
        ctx.arc(w - 20 - i * 18, h - 18, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawRipples(ctx, ripples, this._dt || 0.016);
    },
  };
}

/* ---------- SWIPE ---------- */
function swipeChallenge(def, api) {
  const hazards = def.params.hazards.map((hz) => ({ ...hz, t: -(hz.delay || 0), state: 'incoming' }));
  let idx = 0;
  let kaiDir = 0; // -1 dodged left, +1 right, 0 centered
  let doneTimer = null;

  const active = () => hazards[idx];

  return {
    update(dt) {
      if (doneTimer !== null) {
        doneTimer -= dt;
        if (doneTimer <= 0) api.succeed();
        return;
      }
      const hz = active();
      if (!hz) return;
      hz.t += dt;
      if (hz.state === 'incoming' && hz.t >= hz.time) {
        // impact — too slow
        hz.state = 'crashed';
        api.sfx.hit();
        api.buzz(60);
        api.fail();
      } else if (hz.state === 'dodged' && hz.t >= hz.time) {
        hz.state = 'crashed';
        api.sfx.hit();
        // next hazard, or brief beat then success
        if (idx + 1 < hazards.length) {
          idx++;
          kaiDir = 0;
        } else {
          doneTimer = 0.45;
        }
      }
    },
    onSwipe(dir) {
      const hz = active();
      if (!hz || hz.state !== 'incoming' || hz.t < 0) return;
      const need = hz.dir;
      const ok =
        need === 'any'
          ? dir === 'left' || dir === 'right'
          : dir === need;
      if (ok) {
        hz.state = 'dodged';
        kaiDir = dir === 'left' ? -1 : 1;
        api.sfx.page();
        api.buzz(20);
      } else if (dir === 'left' || dir === 'right') {
        // dodged INTO it
        hz.state = 'crashed';
        api.sfx.hit();
        api.buzz(60);
        api.fail();
      }
    },
    draw(ctx, w, h) {
      const groundY = h * 0.88;
      // Kai
      if (kaiDir === 0) drawKai(ctx, w * 0.5, groundY, h * 0.42, 'stand', { dir: 0 });
      else drawKai(ctx, w * 0.5 + kaiDir * w * 0.26, groundY, h * 0.42, 'dodge', { dir: kaiDir });

      const size = Math.min(w, h) * 0.15;
      for (let i = 0; i <= idx && i < hazards.length; i++) {
        const hz = hazards[i];
        if (hz.t < 0) continue; // still delayed
        const p = Math.min(1, hz.t / hz.time);
        let x;
        let y;
        if (hz.from === 'top') {
          x = w * 0.5;
          y = -size + p * (groundY - size * 0.4 + size);
        } else if (hz.from === 'right') {
          x = w + size * 2 - p * (w * 0.5 + size * 2);
          y = h * 0.55;
        } else {
          x = -size * 2 + p * (w * 0.5 + size * 2);
          y = h * 0.6;
        }
        if (hz.state === 'crashed') {
          const cy = hz.from === 'top' ? groundY - size * 0.4 : y;
          drawSFXText(ctx, hz.text, w * 0.5, cy, size, 0.08);
          impactStar(ctx, w * 0.5, cy + size * 0.6, size * 0.8, 9);
        } else {
          drawSFXText(ctx, hz.text, x, y, size, hz.from === 'top' ? 0.05 : hz.from === 'right' ? -0.12 : 0.12);
          // motion trail
          ctx.strokeStyle = INK;
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = 2;
          for (let m = 0; m < 3; m++) {
            ctx.beginPath();
            if (hz.from === 'top') {
              ctx.moveTo(x - size + m * size, y - size * 1.2);
              ctx.lineTo(x - size + m * size, y - size * 0.5);
            } else {
              const back = hz.from === 'right' ? size : -size;
              ctx.moveTo(x + back * 1.6, y - size * 0.5 + m * size * 0.5);
              ctx.lineTo(x + back * 0.9, y - size * 0.5 + m * size * 0.5);
            }
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          // required-direction arrow hint
          if (hz.state === 'incoming') {
            const t = performance.now() / 1000;
            const bob = Math.sin(t * 6) * 6;
            ctx.fillStyle = INK;
            ctx.globalAlpha = 0.75;
            const ay = h * 0.78;
            const draw = (dx) => {
              ctx.beginPath();
              ctx.moveTo(w * 0.5 + dx * (w * 0.18 + bob), ay);
              ctx.lineTo(w * 0.5 + dx * (w * 0.1 + bob), ay - 12);
              ctx.lineTo(w * 0.5 + dx * (w * 0.1 + bob), ay + 12);
              ctx.closePath();
              ctx.fill();
            };
            if (hz.dir === 'any') { draw(-1); draw(1); }
            else if (hz.dir === 'left') draw(-1);
            else if (hz.dir === 'right') draw(1);
            ctx.globalAlpha = 1;
          }
        }
      }
    },
  };
}

/* ---------- HOLD ---------- */
function holdChallenge(def, api) {
  const p = def.params;
  return {
    holding: false,
    sweepX: null,
    sweepsDone: 0,
    _sweepT: -1, // <0: waiting to start
    _pause: 0,
    update(dt) {
      const { w } = api.size();
      if (this.sweepsDone >= p.sweeps) return;
      if (!this.holding && this._sweepT < 0) {
        this.sweepX = null;
        return; // shadow waits until the player hides
      }
      if (this._pause > 0) {
        this._pause -= dt;
        this.sweepX = null;
        return;
      }
      if (this._sweepT < 0) this._sweepT = 0;
      this._sweepT += dt;
      const prog = this._sweepT / p.sweepTime;
      if (prog >= 1) {
        this.sweepsDone++;
        this._sweepT = -1;
        this._pause = 0.45;
        this.sweepX = null;
        if (this.sweepsDone >= p.sweeps) {
          api.sfx.page();
          api.succeed();
        }
      } else {
        this.sweepX = -w * 0.25 + prog * w * 1.5;
      }
    },
    onDown() {
      this.holding = true;
      api.buzz(10);
    },
    onUp() {
      this.holding = false;
      // releasing while the shadow is mid-sweep = spotted
      if (this._sweepT >= 0 && this.sweepsDone < p.sweeps) {
        api.sfx.hit();
        api.buzz(60);
        api.fail();
      }
    },
    draw(ctx, w, h) {
      // hold progress ring, bottom center
      const cx = w / 2;
      const cy = h - 34;
      const frac = Math.min(1, (this.sweepsDone + (this._sweepT > 0 ? this._sweepT / p.sweepTime : 0)) / p.sweeps);
      ctx.strokeStyle = INK;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      if (!this.holding) {
        const t = performance.now() / 1000;
        ctx.fillStyle = INK;
        ctx.globalAlpha = 0.6 + Math.sin(t * 5) * 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    },
  };
}

/* ---------- TRACE ---------- */
function traceChallenge(def, api) {
  const norm = def.params.path;
  const tol = def.params.tol || 48;
  let pts = null; // px-space polyline (computed lazily from panel size)
  let progress = 0; // 0..1 along polyline
  let tracing = false;
  let tip = null;

  const buildPts = () => {
    const { w, h } = api.size();
    pts = norm.map(([nx, ny]) => [nx * w, ny * h]);
  };

  // distance from point to polyline + param t (0..1) of nearest point
  const nearest = (x, y) => {
    let best = { d: Infinity, t: 0 };
    let acc = 0;
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const u = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (len * len)));
      const px = x1 + u * dx;
      const py = y1 + u * dy;
      const d = Math.hypot(x - px, y - py);
      if (d < best.d) best = { d, t: (acc + u * len) / total };
      acc += len;
    }
    return best;
  };

  return {
    update() {},
    onDown(pt) {
      if (!pts) buildPts();
      const n = nearest(pt.x, pt.y);
      if (n.d <= tol * 1.4 && n.t <= Math.max(0.12, progress + 0.1)) {
        tracing = true;
        tip = pt;
      }
    },
    onMove(pt) {
      if (!tracing) return;
      tip = pt;
      const n = nearest(pt.x, pt.y);
      if (n.d > tol) {
        // strayed off the line — the ink blots and the Hand redraws
        tracing = false;
        api.sfx.hit();
        api.fail();
        return;
      }
      if (n.t > progress && n.t - progress < 0.25) {
        progress = n.t;
        if (progress >= 0.96) {
          progress = 1;
          tracing = false;
          api.sfx.draw();
          api.buzz(25);
          api.succeed();
        }
      }
    },
    onUp() {
      if (tracing && progress < 0.96) {
        // lifted early — soft reset, not a fail (fat-thumb friendly)
        tracing = false;
        progress = 0;
        api.sfx.ink();
      }
    },
    draw(ctx, w, h) {
      if (!pts) buildPts();
      // dotted guide
      ctx.strokeStyle = INK;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 4;
      ctx.setLineDash([9, 10]);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      // traced ink so far
      if (progress > 0) {
        let total = 0;
        for (let i = 0; i < pts.length - 1; i++) total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        let remain = progress * total;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 0; i < pts.length - 1 && remain > 0; i++) {
          const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
          const f = Math.min(1, remain / len);
          ctx.lineTo(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f);
          remain -= len;
        }
        ctx.stroke();
      }
      // start marker pulse
      if (progress === 0) {
        const t = performance.now() / 1000;
        ctx.fillStyle = INK;
        ctx.globalAlpha = 0.5 + Math.sin(t * 5) * 0.3;
        ctx.beginPath();
        ctx.arc(pts[0][0], pts[0][1], 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // pen tip
      if (tracing && tip) {
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}

/* ---------- CHOOSE ---------- */
function chooseChallenge(def, api) {
  const opts = def.params.options;
  let chosen = -1;
  let doneTimer = null;
  const rects = [null, null];

  return {
    update(dt) {
      if (doneTimer !== null) {
        doneTimer -= dt;
        if (doneTimer <= 0) api.succeed();
      }
    },
    onTap(pt) {
      if (chosen >= 0) return;
      for (let i = 0; i < 2; i++) {
        const r = rects[i];
        if (r && pt.x >= r.x - 8 && pt.x <= r.x + r.w + 8 && pt.y >= r.y - 8 && pt.y <= r.y + r.h + 8) {
          chosen = i;
          if (opts[i].flag) api.setFlag(opts[i].flag);
          api.sfx.ink();
          api.buzz(15);
          doneTimer = 0.55;
          return;
        }
      }
    },
    draw(ctx, w, h) {
      const fs = Math.max(14, Math.min(w, h) * 0.055);
      const positions = [
        { x: w * 0.27, y: h * 0.2 },
        { x: w * 0.73, y: h * 0.32 },
      ];
      for (let i = 0; i < 2; i++) {
        rects[i] = speechBubble(ctx, opts[i].text, positions[i].x, positions[i].y, w * 0.46, {
          fs,
          selected: chosen === i,
          faded: chosen >= 0 && chosen !== i,
          tail: { x: w * 0.5, y: h * 0.55 },
        });
      }
    },
  };
}

/* ---------- CUTSCENE / SPREAD ---------- */
function cutsceneChallenge(def, api) {
  const dur = def.params?.duration ?? 2.5;
  const isSpread = def.type === 'spread';
  return {
    t: 0,
    update(dt) {
      this.t += dt;
      // auto-play: advance on its own a beat after the scene lands
      if (this.t >= dur + (isSpread ? 2.4 : 1.6)) api.succeed();
    },
    onTap() {
      if (this.t >= dur * 0.45) api.succeed();
    },
    draw(ctx, w, h) {
      // "tap to continue" nib, bottom-right, once the scene has played
      if (this.t >= dur * 0.45) {
        const a = 0.4 + Math.sin(this.t * 4) * 0.3;
        ctx.fillStyle = INK;
        ctx.globalAlpha = Math.max(0.15, a);
        ctx.beginPath();
        const bx = w - 26;
        const by = h - 22;
        ctx.moveTo(bx, by - 8);
        ctx.lineTo(bx + 12, by);
        ctx.lineTo(bx, by + 8);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    },
  };
}

export function createChallenge(def, api) {
  switch (def.type) {
    case 'tap': return tapChallenge(def, api);
    case 'swipe': return swipeChallenge(def, api);
    case 'hold': return holdChallenge(def, api);
    case 'trace': return traceChallenge(def, api);
    case 'choose': return chooseChallenge(def, api);
    case 'cutscene':
    case 'spread': return cutsceneChallenge(def, api);
    default: return cutsceneChallenge(def, api);
  }
}
