// Verb engine. One challenge object per active panel — now with skill grading:
// every action is scored PERFECT / GOOD / OK (speed, precision, close calls),
// feeding the combo meter. Juice hooks: api.shake, api.hitstop, api.stamp.
// Contract: { update(dt), draw(ctx, w, h), onDown/onMove/onUp/onTap/onSwipe }.
import { INK, PAPER, impactStar, drawSFXText, drawSmudge, speechBubble, drawPencilShadow, drawSprite } from './art.js';
import { drawKai } from './chars.js';
import { drawPencilBody } from './compose.js';
import { anchors } from './scenes.js';

// bobbing dodge-direction arrows shown while a hazard is incoming
function drawIncomingCue(ctx, hz, w, h) {
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
  else if (hz.dir === 'up') {
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.6 - bob);
    ctx.lineTo(w * 0.5 - 12, h * 0.6 - bob + 20);
    ctx.lineTo(w * 0.5 + 12, h * 0.6 - bob + 20);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ---------- hazard objects ----------
 * Swipe hazards are THINGS, not just flying words: the object closes in,
 * the SFX word rides small beside it, and the word only goes BIG on impact.
 * Painted `fx-<obj>` sprites take over automatically when they exist. */
function drawHazardObj(ctx, obj, x, y, s, from, t) {
  const rot = from === 'top' ? 0 : from === 'right' ? Math.PI / 2 : -Math.PI / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (drawSprite(ctx, `fx-${obj}`, 0, s * 0.5, s, 1)) { ctx.restore(); return; }
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2.5, s * 0.035);
  switch (obj) {
    case 'pencil':
      drawPencilBody(ctx, s * 0.62);
      break;
    case 'frame': {
      // a torn panel border, spinning like a shuriken
      ctx.rotate(t * 3.2);
      const fw = s * 0.55;
      const fh = s * 0.4;
      ctx.fillStyle = PAPER;
      ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
      ctx.strokeRect(-fw / 2, -fh / 2, fw, fh);
      ctx.lineWidth = Math.max(4, s * 0.07);
      ctx.strokeRect(-fw / 2 + s * 0.045, -fh / 2 + s * 0.045, fw - s * 0.09, fh - s * 0.09);
      // torn corner
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(fw / 2, -fh / 2);
      ctx.lineTo(fw / 2 - s * 0.14, -fh / 2);
      ctx.lineTo(fw / 2, -fh / 2 + s * 0.1);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'inkblob': {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.3, s * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + t * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * s * 0.34, -s * 0.15 + Math.sin(a) * s * 0.4, s * (0.05 + (i % 3) * 0.02), 0, Math.PI * 2);
        ctx.fill();
      }
      // glossy highlight
      ctx.fillStyle = 'rgba(150, 200, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(-s * 0.1, -s * 0.14, s * 0.08, s * 0.05, -0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'tail': {
      // scythe crescent of leviathan tail, fin spines on the outer edge
      ctx.fillStyle = '#101a38';
      ctx.strokeStyle = 'rgba(150, 200, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, Math.PI * 0.2, Math.PI * 1.15);
      ctx.arc(-s * 0.08, -s * 0.06, s * 0.32, Math.PI * 1.1, Math.PI * 0.25, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'eraser': {
      ctx.rotate(0.2 + Math.sin(t * 4) * 0.06);
      ctx.fillStyle = '#f2efe6';
      ctx.beginPath();
      ctx.roundRect(-s * 0.32, -s * 0.2, s * 0.64, s * 0.4, s * 0.05);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3a5da8';
      ctx.beginPath();
      ctx.roundRect(-s * 0.32, -s * 0.2, s * 0.24, s * 0.4, s * 0.05);
      ctx.fill();
      ctx.stroke();
      // crumbs trailing
      ctx.fillStyle = '#d9d2c0';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-s * (0.4 + i * 0.1), s * (0.1 - (i % 2) * 0.2), s * 0.035, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'fist': {
      // a massive fist, knuckles first, wraps trailing
      ctx.fillStyle = '#b4713d';
      ctx.beginPath();
      ctx.roundRect(-s * 0.3, -s * 0.28, s * 0.6, s * 0.5, s * 0.12);
      ctx.fill();
      ctx.stroke();
      // knuckles
      ctx.fillStyle = '#c98a52';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-s * 0.21 + i * s * 0.14, -s * 0.26, s * 0.075, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
      }
      // hand-wrap bands
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.roundRect(-s * 0.3, s * 0.06, s * 0.6, s * 0.13, s * 0.03);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'hand': {
      // the Artist's Hand, flat sweep, fingers extended
      ctx.fillStyle = 'rgba(28, 28, 38, 0.88)';
      ctx.beginPath();
      ctx.roundRect(-s * 0.34, -s * 0.16, s * 0.5, s * 0.42, s * 0.08);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.roundRect(-s * 0.3 + i * s * 0.115, -s * 0.52, s * 0.09, s * 0.4, s * 0.045);
        ctx.fill();
      }
      // thumb
      ctx.beginPath();
      ctx.roundRect(s * 0.14, -s * 0.22, s * 0.09, s * 0.3, s * 0.045);
      ctx.fill();
      break;
    }
    default:
      ctx.restore();
      return drawSFXText(ctx, obj.toUpperCase(), x, y, s * 0.8, 0.06);
  }
  ctx.restore();
}

/* ---------- shared juice bits ---------- */
function makeFx() {
  return { ripples: [], splats: [] };
}

function addHitFx(fx, x, y, blood = false) {
  fx.ripples.push({ x, y, t: 0 });
  const n = blood ? 9 : 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random();
    fx.splats.push({
      x, y,
      dx: Math.cos(a) * (40 + Math.random() * 60),
      dy: Math.sin(a) * (40 + Math.random() * 60) - 30,
      t: 0, r: (blood ? 3 : 2) + Math.random() * 3,
      color: blood ? '#3a1020' : null,
    });
  }
}

function drawFx(ctx, fx, dt) {
  for (const r of fx.ripples) r.t += dt;
  for (const s of fx.splats) s.t += dt;
  fx.ripples = fx.ripples.filter((r) => r.t < 0.4);
  fx.splats = fx.splats.filter((s) => s.t < 0.45);
  for (const r of fx.ripples) {
    const p = r.t / 0.4;
    ctx.strokeStyle = INK;
    ctx.globalAlpha = (1 - p) * 0.8;
    ctx.lineWidth = 3.5 * (1 - p) + 1;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 10 + p * 44, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const s of fx.splats) {
    const p = s.t / 0.45;
    ctx.fillStyle = s.color || INK;
    ctx.globalAlpha = (1 - p) * 0.85;
    ctx.beginPath();
    ctx.arc(s.x + s.dx * p, s.y + s.dy * p + 40 * p * p, s.r * (1 - p * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ---------- TAP ---------- */
function tapChallenge(def, api) {
  const p = def.params;
  const fx = makeFx();
  let timeLeft = p.time ?? null;
  let smudgeHop = 0;
  let elapsed = 0;
  let misses = 0;
  // par time for a PERFECT: quick, but honest for the tap count
  const par = p.time ? p.time * 0.45 : p.count * 0.5 + 0.4;

  const hitArea = (w, h) => {
    let base;
    if (p.target) {
      let x = p.target.x * w;
      if (p.wobble) x += Math.sin(smudgeHop * 2.4) * w * 0.14;
      base = { x, y: p.target.y * h, r: Math.max(p.target.r * Math.min(w, h), 44) };
    } else {
      switch (p.hit) {
        case 'kai': {
          const k = anchors.kaiWake(w, h);
          base = { x: k.x, y: k.y - k.s * 0.3, r: k.s * 0.55 };
          break;
        }
        case 'letterC': {
          const c = anchors.letterC(w, h);
          base = { x: c.x, y: c.y, r: Math.max(c.r, 44) };
          break;
        }
        case 'smudge': {
          const s = anchors.smudge(w, h);
          base = { x: s.x + Math.sin(smudgeHop * 2.4) * w * 0.14, y: s.y, r: Math.max(s.r * 1.2, 48) };
          break;
        }
        default:
          base = { x: w / 2, y: h / 2, r: Math.min(w, h) * 0.4 };
      }
    }
    // the mark shrinks slightly with each hit — landing the last one feels earned
    if (p.count > 1) base.r = Math.max(40, base.r * (1 - this0.count * 0.07));
    return base;
  };
  // (this0 set below — challenge object needs to exist for hitArea closure)
  const this0 = {
    count: 0,
    holding: false,
    update(dt) {
      elapsed += dt;
      if (timeLeft !== null) {
        timeLeft -= dt;
        if (timeLeft <= 0) {
          timeLeft = null;
          api.shake(6);
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
        addHitFx(fx, pt.x, pt.y, !!p.blood);
        api.sfx.ink();
        api.buzz(15);
        api.hitstop(0.045);
        api.shake(2.2);
        if (this.count >= p.count) {
          if (p.hit === 'smudge' || p.creature === 'smudge') {
            api.sfx.hit();
            api.shake(5);
            api.hitstop(0.09);
          }
          let grade = elapsed <= par ? 'perfect' : elapsed <= par * 1.8 ? 'good' : 'ok';
          if (misses > 1) grade = grade === 'perfect' ? 'good' : 'ok';
          api.succeed({ grade });
        }
      } else {
        misses++;
      }
    },
    draw(ctx, w, h) {
      const a = hitArea(w, h);
      const t = performance.now() / 1000;
      const pulse = 1 + Math.sin(t * 5) * 0.08;
      // paper halo under the ink ring — visible over painted backdrops
      ctx.strokeStyle = 'rgba(247,244,236,0.85)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.setLineDash([8, 7]);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      if (p.hit === 'smudge' || p.creature === 'smudge') {
        const hpFrac = 1 - this.count / p.count;
        drawSmudge(ctx, a.x, a.y, Math.min(w, h) * 0.2, t, Math.max(0.2, hpFrac));
      }
      if (timeLeft !== null && p.time) {
        if (p.hit === 'smudge') {
          const k = anchors.kaiFight(w, h);
          const frac = Math.max(0, timeLeft / p.time);
          const tw = w * 0.17;
          ctx.fillStyle = INK;
          ctx.globalAlpha = 0.8;
          ctx.fillRect(k.x - tw / 2, h * 0.84 + (1 - frac) * h * 0.1, tw, Math.max(0, frac) * h * 0.1);
          ctx.globalAlpha = 1;
        } else {
          const frac = Math.max(0, timeLeft / p.time);
          ctx.fillStyle = 'rgba(247,244,236,0.85)';
          ctx.fillRect(10, h - 13, w - 20, 10);
          ctx.fillStyle = INK;
          ctx.fillRect(12, h - 11, (w - 24) * frac, 6);
          if (frac < 0.3 && Math.sin(t * 12) > 0) {
            ctx.fillStyle = '#c8392e';
            ctx.fillRect(12, h - 11, (w - 24) * frac, 6);
          }
        }
      }

      ctx.fillStyle = INK;
      for (let i = 0; i < p.count; i++) {
        ctx.globalAlpha = i < this.count ? 1 : 0.2;
        ctx.beginPath();
        ctx.arc(w - 20 - i * 18, h - 18, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawFx(ctx, fx, this._dt || 0.016);
    },
  };
  return this0;
}

/* ---------- SWIPE ---------- */
function swipeChallenge(def, api) {
  const hazards = def.params.hazards.map((hz) => ({ ...hz, t: -(hz.delay || 0), state: 'incoming' }));
  let idx = 0;
  let kaiDir = 0;
  let doneTimer = null;
  let worstGrade = 'perfect';

  const active = () => hazards[idx];

  return {
    update(dt) {
      if (doneTimer !== null) {
        doneTimer -= dt;
        if (doneTimer <= 0) api.succeed({ grade: worstGrade });
        return;
      }
      const hz = active();
      if (!hz) return;
      hz.t += dt;
      if (hz.state === 'incoming' && hz.t >= hz.time) {
        hz.state = 'crashed';
        api.sfx.hit();
        api.buzz(60);
        api.shake(7);
        api.fail();
      } else if (hz.state === 'dodged' && hz.t >= hz.time) {
        hz.state = 'crashed';
        api.sfx.hit();
        api.shake(4);
        if (idx + 1 < hazards.length) {
          idx++;
          kaiDir = 0;
        } else {
          doneTimer = 0.35;
        }
      }
    },
    onSwipe(dir) {
      const hz = active();
      if (!hz || hz.state !== 'incoming' || hz.t < 0) return;
      const need = hz.dir;
      const ok = need === 'any' ? dir === 'left' || dir === 'right' : dir === need;
      if (ok) {
        hz.state = 'dodged';
        kaiDir = dir === 'up' ? 'up' : dir === 'left' ? -1 : 1;
        api.buzz(20);
        // the later you dodge, the better it feels — reward the nerve
        const f = hz.t / hz.time;
        if (f >= 0.55) {
          api.hitstop(0.09);
          api.shake(3);
          api.sfx.close();
          api.stamp('CLOSE!', true);
        } else {
          api.sfx.page();
          if (worstGrade === 'perfect') worstGrade = 'good';
        }
      } else if (dir === 'left' || dir === 'right' || (need !== 'any' && dir === 'up')) {
        hz.state = 'crashed';
        api.sfx.hit();
        api.buzz(60);
        api.shake(7);
        api.fail();
      }
    },
    draw(ctx, w, h) {
      const groundY = h * 0.88;
      if (kaiDir === 0) drawKai(ctx, w * 0.5, groundY, h * 0.42, 'stand', { dir: 0 });
      else if (kaiDir === 'up') drawKai(ctx, w * 0.5, groundY - h * 0.22, h * 0.42, 'dodge', { dir: 1 });
      else drawKai(ctx, w * 0.5 + kaiDir * w * 0.26, groundY, h * 0.42, 'dodge', { dir: kaiDir });

      const size = Math.min(w, h) * 0.15;
      for (let i = 0; i <= idx && i < hazards.length; i++) {
        const hz = hazards[i];
        if (hz.t < 0) continue;
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
          if (hz.obj) drawHazardObj(ctx, hz.obj, w * 0.5, cy, size * 1.4, hz.from, hz.t);
          drawSFXText(ctx, hz.text, w * 0.5, cy - (hz.obj ? size * 0.7 : 0), size, 0.08);
          impactStar(ctx, w * 0.5, cy + size * 0.6, size * 0.8, 9);
        } else if (hz.obj) {
          // the OBJECT closes in; the word rides small beside it
          const looming = size * (1.1 + p * 0.8);
          drawHazardObj(ctx, hz.obj, x, y, looming, hz.from, hz.t);
          drawSFXText(ctx, hz.text, x + (hz.from === 'right' ? size * 0.9 : hz.from === 'left' ? -size * 0.9 : size * 0.8),
            y - size * 0.7, looming * 0.32, hz.from === 'right' ? -0.12 : 0.1);
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
          if (hz.state === 'incoming') {
            drawIncomingCue(ctx, hz, w, h);
          }
        } else {
          // no object: the flying word IS the thing (Chapter 1's gag)
          const looming = size * (0.8 + p * 0.5);
          drawSFXText(ctx, hz.text, x, y, looming, hz.from === 'top' ? 0.05 : hz.from === 'right' ? -0.12 : 0.12);
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
          if (hz.state === 'incoming') {
            drawIncomingCue(ctx, hz, w, h);
          }
        }
      }
    },
  };
}

/* ---------- HOLD ---------- */
function holdChallenge(def, api) {
  const p = def.params;
  let waited = 0;       // time before the player first hid
  let heartT = 0;
  return {
    holding: false,
    everHeld: false,
    sweepX: null,
    sweepsDone: 0,
    _sweepT: -1,
    _pause: 0,
    update(dt) {
      const { w } = api.size();
      if (this.sweepsDone >= p.sweeps) return;
      if (!this.everHeld) waited += dt;
      if (!this.holding && this._sweepT < 0) {
        this.sweepX = null;
        return;
      }
      if (this._pause > 0) {
        this._pause -= dt;
        this.sweepX = null;
        return;
      }
      if (this._sweepT < 0) this._sweepT = 0;
      this._sweepT += dt;
      // heartbeat while the threat passes over
      heartT += dt;
      if (heartT >= 0.45) {
        heartT = 0;
        api.sfx.heart();
        api.buzz(8);
      }
      const prog = this._sweepT / p.sweepTime;
      if (prog >= 1) {
        this.sweepsDone++;
        this._sweepT = -1;
        this._pause = 0.35;
        this.sweepX = null;
        if (this.sweepsDone >= p.sweeps) {
          api.sfx.page();
          // hid fast and never flinched = perfect
          api.succeed({ grade: waited <= 1.2 ? 'perfect' : 'good' });
        }
      } else {
        this.sweepX = -w * 0.25 + prog * w * 1.5;
      }
    },
    onDown() {
      this.holding = true;
      this.everHeld = true;
      api.buzz(10);
    },
    onUp() {
      this.holding = false;
      if (this._sweepT >= 0 && this.sweepsDone < p.sweeps) {
        api.sfx.hit();
        api.buzz(60);
        api.shake(7);
        api.fail();
      }
    },
    draw(ctx, w, h) {
      if (this.sweepX !== null && this.sweepX !== undefined && p.overlay) {
        if (p.overlay === 'pencil') {
          drawPencilShadow(ctx, w, h, this.sweepX, 0.5);
        } else if (p.overlay === 'wave') {
          ctx.save();
          ctx.fillStyle = INK;
          ctx.globalAlpha = 0.65;
          ctx.beginPath();
          ctx.moveTo(this.sweepX - w * 0.2, h);
          ctx.quadraticCurveTo(this.sweepX - w * 0.05, h * 0.1, this.sweepX + w * 0.14, h * 0.25);
          ctx.quadraticCurveTo(this.sweepX + w * 0.02, h * 0.45, this.sweepX + w * 0.1, h);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
      // danger vignette while a sweep is live
      if (this._sweepT >= 0) {
        ctx.save();
        const pulse = 0.12 + Math.abs(Math.sin(this._sweepT * 7)) * 0.1;
        ctx.strokeStyle = INK;
        ctx.globalAlpha = pulse;
        ctx.lineWidth = 14;
        ctx.strokeRect(7, 7, w - 14, h - 14);
        ctx.restore();
      }
      const cx = w / 2;
      const cy = h - 34;
      const frac = Math.min(1, (this.sweepsDone + (this._sweepT > 0 ? this._sweepT / p.sweepTime : 0)) / p.sweeps);
      ctx.fillStyle = 'rgba(247,244,236,0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy, 27, 0, Math.PI * 2);
      ctx.fill();
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
  let pts = null;
  let progress = 0;
  let tracing = false;
  let tip = null;
  let errSum = 0;
  let errN = 0;
  let resets = 0;
  const trail = []; // the player's actual ink, fading

  const buildPts = () => {
    const { w, h } = api.size();
    pts = norm.map(([nx, ny]) => [nx * w, ny * h]);
  };

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
    update(dt) {
      this._dt = dt;
      for (const s of trail) s.t += dt;
      while (trail.length && trail[0].t > 0.9) trail.shift();
    },
    onDown(pt) {
      if (!pts) buildPts();
      const n = nearest(pt.x, pt.y);
      if (n.d <= tol * 1.4 && n.t <= Math.max(0.12, progress + 0.1)) {
        tracing = true;
        tip = pt;
        api.sfx.ink();
      }
    },
    onMove(pt) {
      if (!tracing) return;
      tip = pt;
      trail.push({ x: pt.x, y: pt.y, t: 0 });
      const n = nearest(pt.x, pt.y);
      errSum += n.d;
      errN++;
      if (n.d > tol) {
        tracing = false;
        api.sfx.hit();
        api.shake(5);
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
          const avgErr = errN ? errSum / errN : tol;
          const grade = resets === 0 && avgErr < tol * 0.38 ? 'perfect' : avgErr < tol * 0.65 ? 'good' : 'ok';
          if (grade === 'perfect') api.hitstop(0.07);
          // named Ink Art: the technique lands with its kanji
          if (def.params.technique) {
            api.stamp(def.params.technique.kanji, false, true);
            api.hitstop(0.1);
            api.shake(4);
          }
          api.succeed({ grade });
        }
      }
    },
    onUp() {
      if (tracing && progress < 0.96) {
        tracing = false;
        progress = 0;
        resets++;
        api.sfx.ink();
      }
    },
    draw(ctx, w, h) {
      if (!pts) buildPts();
      // the player's real ink trail, fading like wet ink
      ctx.strokeStyle = INK;
      ctx.lineCap = 'round';
      for (let i = 1; i < trail.length; i++) {
        const a = Math.max(0, 1 - trail[i].t / 0.9);
        ctx.globalAlpha = a * 0.35;
        ctx.lineWidth = 5 * a + 1;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // paper halo, then the dotted ink guide
      ctx.strokeStyle = 'rgba(247,244,236,0.8)';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 4;
      ctx.setLineDash([9, 10]);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      if (progress > 0) {
        let total = 0;
        for (let i = 0; i < pts.length - 1; i++) total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        let remain = progress * total;
        ctx.lineWidth = 7;
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
      if (progress === 0) {
        const t = performance.now() / 1000;
        ctx.fillStyle = INK;
        ctx.globalAlpha = 0.5 + Math.sin(t * 5) * 0.3;
        ctx.beginPath();
        ctx.arc(pts[0][0], pts[0][1], 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
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
// option layouts: 2-way keeps the classic stagger; 3-way stacks
export const CHOICE_POS = {
  2: [[0.27, 0.2], [0.73, 0.32]],
  3: [[0.3, 0.14], [0.7, 0.3], [0.4, 0.46]],
};

function chooseChallenge(def, api) {
  const opts = def.params.options;
  const n = Math.min(3, opts.length);
  let chosen = -1;
  let doneTimer = null;
  const rects = [null, null, null];

  return {
    // real, post-layout bubble rects — the test driver taps these
    bubbleRects() { return rects; },
    update(dt) {
      if (doneTimer !== null) {
        doneTimer -= dt;
        if (doneTimer <= 0) api.succeed({ grade: null });
      }
    },
    onTap(pt) {
      if (chosen >= 0) return;
      for (let i = 0; i < n; i++) {
        const r = rects[i];
        if (r && pt.x >= r.x - 8 && pt.x <= r.x + r.w + 8 && pt.y >= r.y - 8 && pt.y <= r.y + r.h + 8) {
          chosen = i;
          if (opts[i].flag) api.setFlag(opts[i].flag);
          for (const [k, amt] of Object.entries(opts[i].bonds || {})) api.addBond(k, amt);
          api.sfx.ink();
          api.buzz(15);
          doneTimer = 0.4;
          return;
        }
      }
    },
    draw(ctx, w, h) {
      const fs = Math.max(14, Math.min(w, h) * 0.055);
      const positions = CHOICE_POS[n] || CHOICE_POS[2];
      for (let i = 0; i < n; i++) {
        // per-option x/y in the chapter JSON overrides the default layout
        const px = (opts[i].x ?? positions[i][0]) * w;
        const py = (opts[i].y ?? positions[i][1]) * h;
        rects[i] = speechBubble(ctx, opts[i].text, px, py, w * 0.46, {
          fs,
          selected: chosen === i,
          faded: chosen >= 0 && chosen !== i,
          tail: i === 0 && opts[i].x == null ? { x: w * 0.5, y: h * 0.58 } : null,
          avoid: rects.slice(0, i),
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
      if (this.t >= dur + (isSpread ? 2.0 : 1.0)) api.succeed({ grade: null });
    },
    onTap() {
      // readers control the pace — tappable almost immediately
      if (this.t >= 0.15) api.succeed({ grade: null });
    },
    draw(ctx, w, h) {
      if (this.t >= 0.35) {
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
