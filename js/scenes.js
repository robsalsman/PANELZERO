// Scene painters — one per `art` key in chapter JSON. Static/animated backdrop
// per panel; the active challenge draws its dynamic layer on top.
// Contract: painter(ctx, w, h, o) with o = { t, phase: 'active'|'done', flags, ch, line }
// ctx is already translated to the panel's top-left and clipped to it.
import {
  INK, PAPER, fillTone, speedLinesV, speedLinesH, impactStar, drawSFXText,
  drawPencilShadow, drawHandWithEraser, drawSmudge, speechBubble,
} from './art.js';
import { drawKai } from './chars.js';

/* Shared layout anchors — challenges import these so hitboxes match the art. */
export const anchors = {
  letterC: (w, h) => ({ x: w * 0.63, y: h * 0.74, r: Math.min(w, h) * 0.16 }),
  kaiWake: (w, h) => ({ x: w * 0.5, y: h * 0.78, s: h * 0.42 }),
  smudge: (w, h) => ({ x: w * 0.68, y: h * 0.72, r: Math.min(w, h) * 0.2 }),
  kaiFight: (w, h) => ({ x: w * 0.24, y: h * 0.84, s: h * 0.5 }),
};

function ground(ctx, w, h, y) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();
}

function bigFace(ctx, x, y, r, o = {}) {
  const { mouth = 'flat', sweat = false } = o;
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(3, r * 0.06);
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // hair spikes
  ctx.fillStyle = INK;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.9 + (i / 6) * Math.PI * 0.8;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a - 0.12) * r * 0.96, y + Math.sin(a - 0.12) * r * 0.96);
    ctx.lineTo(x + Math.cos(a) * r * 1.5, y + Math.sin(a) * r * 1.5);
    ctx.lineTo(x + Math.cos(a + 0.12) * r * 0.96, y + Math.sin(a + 0.12) * r * 0.96);
    ctx.closePath();
    ctx.fill();
  }
  // eyes
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(3, r * 0.07);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.38, y - r * 0.05);
  ctx.lineTo(x - r * 0.38, y + r * 0.22);
  ctx.moveTo(x + r * 0.32, y - r * 0.05);
  ctx.lineTo(x + r * 0.32, y + r * 0.22);
  ctx.stroke();
  // mouth
  ctx.lineWidth = Math.max(2.5, r * 0.05);
  ctx.beginPath();
  if (mouth === 'open') {
    ctx.ellipse(x - r * 0.03, y + r * 0.55, r * 0.18, r * 0.24, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.moveTo(x - r * 0.2, y + r * 0.55);
    ctx.lineTo(x + r * 0.16, y + r * 0.58);
    ctx.stroke();
  }
  if (sweat) {
    ctx.beginPath();
    ctx.moveTo(x + r * 0.75, y - r * 0.45);
    ctx.quadraticCurveTo(x + r * 0.95, y - r * 0.25, x + r * 0.78, y - r * 0.12);
    ctx.quadraticCurveTo(x + r * 0.62, y - r * 0.25, x + r * 0.75, y - r * 0.45);
    ctx.stroke();
  }
  ctx.restore();
}

function scatteredLetters(ctx, w, h, { highlightC = false, fadeC = false, t = 0 } = {}) {
  const gy = h * 0.82;
  const letters = [
    { ch: 'R', x: w * 0.2, rot: -0.5 },
    { ch: 'A', x: w * 0.34, rot: 0.9 },
    { ch: 'S', x: w * 0.47, rot: -1.2 },
    { ch: 'H', x: w * 0.82, rot: 0.4 },
  ];
  const size = Math.min(w, h) * 0.14;
  for (const l of letters) {
    ctx.save();
    ctx.globalAlpha = 0.65;
    drawSFXText(ctx, l.ch, l.x, gy, size, l.rot);
    ctx.restore();
  }
  if (!fadeC) {
    const c = anchors.letterC(w, h);
    const pulse = highlightC ? 1 + Math.sin(t * 5) * 0.06 : 1;
    drawSFXText(ctx, 'C', c.x, c.y, size * 1.5 * pulse, 0.2);
  }
}

export const scenes = {
  /* p01 — Kai unconscious in the white void, ink dripping */
  void_drips(ctx, w, h, o) {
    // drips
    ctx.fillStyle = INK;
    for (let i = 0; i < 4; i++) {
      const x = w * (0.18 + i * 0.22);
      const speed = 0.5 + (i % 3) * 0.22;
      const dy = ((o.t * speed + i * 0.37) % 1);
      const y = dy * h * 0.75;
      const len = h * 0.05;
      ctx.beginPath();
      ctx.ellipse(x, y, 3.5, len, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // ink pool under Kai
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.8, w * 0.24, h * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawKai(ctx, w * 0.5, h * 0.79, h * 0.4, 'lying', { awake: false });
  },

  /* p02 — tap Kai awake; pose advances with tap count */
  kai_wake(ctx, w, h, o) {
    const k = anchors.kaiWake(w, h);
    ground(ctx, w, h, k.y + 2);
    const count = o.phase === 'done' ? 3 : (o.ch?.count ?? 0);
    if (count === 0) {
      drawKai(ctx, k.x, k.y, k.s, 'lying', { awake: false });
      // zzz
      ctx.font = `900 ${k.s * 0.16}px -apple-system, sans-serif`;
      ctx.fillStyle = INK;
      ctx.globalAlpha = 0.5 + Math.sin(o.t * 3) * 0.3;
      ctx.fillText('z z z', k.x + k.s * 0.3, k.y - k.s * 0.4 - Math.sin(o.t * 2) * 6);
      ctx.globalAlpha = 1;
    } else if (count === 1) {
      drawKai(ctx, k.x, k.y, k.s, 'lying', { awake: true });
    } else if (count === 2) {
      drawKai(ctx, k.x, k.y, k.s, 'sit', { awake: true });
    } else {
      drawKai(ctx, k.x, k.y, k.s, 'stand');
      impactStar(ctx, k.x + k.s * 0.42, k.y - k.s * 0.95, k.s * 0.16, 7);
      ctx.font = `900 ${k.s * 0.2}px -apple-system, sans-serif`;
      ctx.fillStyle = INK;
      ctx.textAlign = 'center';
      ctx.fillText('!', k.x + k.s * 0.42, k.y - k.s * 0.89);
    }
  },

  /* p03 — Kai touches the panel border and realizes */
  border_touch(ctx, w, h, o) {
    ground(ctx, w, h, h * 0.86);
    // the border he's touching: an emphasized inner line on the right
    const bx = w * 0.86;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(bx, h * 0.06);
    ctx.lineTo(bx, h * 0.86);
    ctx.stroke();
    drawKai(ctx, w * 0.55, h * 0.86, h * 0.6, 'touch');
    // ripple rings from the touch point
    const tx = bx;
    const ty = h * 0.86 - h * 0.6 * 0.6;
    for (let i = 0; i < 3; i++) {
      const rp = ((o.t * 0.7 + i / 3) % 1);
      ctx.strokeStyle = INK;
      ctx.globalAlpha = (1 - rp) * 0.6;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(tx, ty, 6 + rp * h * 0.12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // "..." thought
    ctx.font = `900 ${h * 0.08}px -apple-system, sans-serif`;
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('. . .', w * 0.3, h * 0.24);
  },

  /* p04 — close-up for the first Choose */
  kai_face(ctx, w, h, o) {
    fillTone(ctx, 0, 0, w, h, 'light', 0.25);
    bigFace(ctx, w * 0.5, h * 0.68, Math.min(w, h) * 0.26, { mouth: 'open', sweat: true });
  },

  /* p05 — SFX "CRASH" falls from the gutter above */
  sfx_fall(ctx, w, h, o) {
    speedLinesV(ctx, w, h, 16, 0.18);
    ground(ctx, w, h, h * 0.88);
    if (o.phase === 'done') {
      drawSFXText(ctx, 'CRASH', w * 0.5, h * 0.78, Math.min(w, h) * 0.16, 0.08);
      impactStar(ctx, w * 0.5, h * 0.86, Math.min(w, h) * 0.14, 9);
      drawKai(ctx, w * 0.16, h * 0.88, h * 0.42, 'stand', { dir: 1 });
    }
    // active: the swipe challenge draws Kai + the falling hazard
  },

  /* p06 — grab the fallen C */
  grab_debris(ctx, w, h, o) {
    ground(ctx, w, h, h * 0.84);
    if (o.phase === 'done') {
      scatteredLetters(ctx, w, h, { fadeC: true });
      drawKai(ctx, w * 0.42, h * 0.84, h * 0.52, 'hold-club', { dir: 1 });
      impactStar(ctx, w * 0.66, h * 0.3, Math.min(w, h) * 0.12, 8);
      ctx.font = `900 ${h * 0.06}px -apple-system, sans-serif`;
      ctx.fillStyle = INK;
      ctx.textAlign = 'center';
      ctx.fillText('GET!', w * 0.66, h * 0.32);
    } else {
      scatteredLetters(ctx, w, h, { highlightC: true, t: o.t });
      drawKai(ctx, w * 0.22, h * 0.84, h * 0.46, 'stand', { dir: 1 });
    }
  },

  /* p07 — the Hand's pencil shadow passes over */
  hand_shadow(ctx, w, h, o) {
    ground(ctx, w, h, h * 0.88);
    drawKai(ctx, w * 0.25, h * 0.88, h * 0.4, 'stand', { dir: 1 });
    const dur = 3.2;
    const p = Math.min(1, o.phase === 'done' ? 1 : o.t / dur);
    // darkness grows as the shadow passes
    fillTone(ctx, 0, 0, w, h, 'dark', 0.15 + p * 0.35);
    if (o.phase !== 'done') {
      const sweepX = -w * 0.3 + p * w * 1.5;
      drawPencilShadow(ctx, w, h, sweepX, 0.45);
    }
  },

  /* p08 — hold to hide while the pencil shadow sweeps */
  hide(ctx, w, h, o) {
    ground(ctx, w, h, h * 0.86);
    // debris pile to hide behind
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(w * 0.36, h * 0.86);
    ctx.lineTo(w * 0.46, h * 0.58);
    ctx.lineTo(w * 0.56, h * 0.68);
    ctx.lineTo(w * 0.66, h * 0.86);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    drawSFXText(ctx, 'H', w * 0.52, h * 0.76, Math.min(w, h) * 0.1, -0.4);

    if (o.phase === 'done') {
      fillTone(ctx, 0, 0, w, h, 'light', 0.25);
      drawKai(ctx, w * 0.28, h * 0.86, h * 0.42, 'stand', { dir: 1 });
    } else {
      const holding = o.ch?.holding;
      if (!holding) {
        drawKai(ctx, w * 0.26, h * 0.86, h * 0.42, 'crouch', { dir: 1 });
      }
      fillTone(ctx, 0, 0, w, h, 'dark', 0.45);
      if (o.ch?.sweepX !== null && o.ch?.sweepX !== undefined) {
        drawPencilShadow(ctx, w, h, o.ch.sweepX, 0.5);
      }
    }
  },

  /* p09 — trace a bridge across the gutter gap */
  gap(ctx, w, h, o) {
    const gl = w * 0.34; // left ledge ends
    const gr = w * 0.66; // right ledge starts
    const gy = h * 0.7;
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.lineWidth = 4;
    // ledges with hatching
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(gl, gy);
    ctx.lineTo(gl, h);
    ctx.moveTo(gr, h);
    ctx.lineTo(gr, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
    fillTone(ctx, 0, gy, gl, h - gy, 'light', 0.6);
    fillTone(ctx, gr, gy, w - gr, h - gy, 'light', 0.6);
    // the gap is raw gutter — pure white void
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gl + 2, gy + 2, gr - gl - 4, h - gy - 2);

    if (o.phase === 'done') {
      // inked bridge + Kai across
      ctx.strokeStyle = INK;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.62);
      ctx.quadraticCurveTo(w * 0.5, h * 0.48, w * 0.88, h * 0.58);
      ctx.stroke();
      drawKai(ctx, w * 0.82, gy, h * 0.42, 'hold-club', { dir: 1 });
    } else {
      drawKai(ctx, w * 0.16, gy, h * 0.42, 'stand', { dir: 1 });
    }
  },

  /* p10 — SLASH then THUD from opposite sides */
  sfx_double(ctx, w, h, o) {
    speedLinesH(ctx, w, h, 12, 0.16);
    ground(ctx, w, h, h * 0.88);
    if (o.phase === 'done') {
      drawSFXText(ctx, 'SLASH', w * 0.2, h * 0.5, Math.min(w, h) * 0.11, -0.15);
      impactStar(ctx, w * 0.2, h * 0.62, Math.min(w, h) * 0.1, 8);
      drawSFXText(ctx, 'THUD', w * 0.8, h * 0.56, Math.min(w, h) * 0.12, 0.15);
      impactStar(ctx, w * 0.8, h * 0.68, Math.min(w, h) * 0.1, 8);
      drawKai(ctx, w * 0.5, h * 0.88, h * 0.44, 'hold-club', { dir: 1 });
    }
  },

  /* p11 — Run / Fight choose */
  kai_stand_face(ctx, w, h, o) {
    fillTone(ctx, 0, 0, w, h, 'light', 0.2);
    ground(ctx, w, h, h * 0.9);
    drawKai(ctx, w * 0.5, h * 0.9, h * 0.55, 'hold-club', { dir: 1 });
  },

  /* p12 — first fight: the eraser smudge */
  smudge_fight(ctx, w, h, o) {
    const k = anchors.kaiFight(w, h);
    const sm = anchors.smudge(w, h);
    // floor tiles
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    const tileY = h * 0.84;
    for (let i = 0; i < 5; i++) {
      const tx = w * 0.04 + i * w * 0.19;
      ctx.strokeRect(tx, tileY, w * 0.17, h * 0.1);
    }
    if (o.phase === 'done') {
      drawKai(ctx, k.x, k.y, k.s, 'fight', { dir: 1 });
      impactStar(ctx, sm.x, sm.y - sm.r * 0.5, sm.r * 1.1, 10);
      // dissolving specks
      ctx.fillStyle = INK;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(sm.x + Math.cos(a) * sm.r * 1.4, sm.y + Math.sin(a) * sm.r, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      drawKai(ctx, k.x, k.y, k.s, 'fight', { dir: 1 });
      // smudge drawn by challenge (it moves); nothing here
    }
  },

  /* p13 — smudge defeated, its warning line */
  smudge_defeat(ctx, w, h, o) {
    ground(ctx, w, h, h * 0.86);
    drawKai(ctx, w * 0.3, h * 0.86, h * 0.5, 'hold-club', { dir: 1 });
    // dissolving smudge
    const p = Math.min(1, o.t / 2);
    ctx.fillStyle = INK;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + i;
      const d = p * (h * 0.2 + (i % 4) * 10);
      ctx.globalAlpha = Math.max(0, 0.6 - p * 0.6);
      ctx.beginPath();
      ctx.arc(w * 0.7 + Math.cos(a) * d, h * 0.72 + Math.sin(a) * d * 0.6, 4 - p * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (o.t > 0.8 || o.phase === 'done') {
      speechBubble(ctx, o.line || '"The Artist... isn\'t done with you."', w * 0.62, h * 0.28, w * 0.62, {
        jagged: true,
        fs: Math.max(13, h * 0.045),
        tail: { x: w * 0.7, y: h * 0.6 },
      });
    }
  },

  /* p14 — full-viewport spread: the Hand descends */
  hand_descends(ctx, w, h, o) {
    // radial drama lines from top center
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = INK;
    for (let i = 0; i < 28; i++) {
      const a = Math.PI * (0.15 + (i / 28) * 0.7);
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.cos(a) * w * 0.1, h * 0.05 + Math.sin(a) * w * 0.1);
      ctx.lineTo(w / 2 + Math.cos(a) * h, h * 0.05 + Math.sin(a) * h);
      ctx.stroke();
    }
    ctx.restore();

    const dur = 2.6;
    const p = o.phase === 'done' ? 1 : Math.min(1, o.t / dur);
    const drop = p * p; // ease-in: accelerating dread
    fillTone(ctx, 0, 0, w, h, 'dark', drop * 0.35);
    drawHandWithEraser(ctx, w, h, drop);
    drawKai(ctx, w * 0.5, h * 0.92, h * 0.16, 'stand', { dir: 0 });
    ground(ctx, w, h, h * 0.92);

    if (p >= 1) {
      ctx.font = `900 ${h * 0.03}px -apple-system, sans-serif`;
      ctx.fillStyle = INK;
      ctx.textAlign = 'center';
      const blink = Math.sin(o.t * 4) > -0.3 || o.phase === 'done';
      if (blink) ctx.fillText('N E X T :   C H A P T E R   2', w / 2, h * 0.985);
    }
  },
};
