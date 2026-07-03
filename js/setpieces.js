// Bespoke painters for story set pieces: Sumi's arrival, the route split,
// both route bosses, the desk, and the three ending spreads.
// Same painter contract as scenes.js.
import {
  INK, PAPER, fillTone, impactStar, drawSFXText, speechBubble,
  drawHandWithEraser, drawSmudge,
} from './art.js';
import { drawKai, drawSumi, drawRejected } from './chars.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

function seaBase(ctx, w, h, t, level = 0.62) {
  ctx.save();
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  const yb = h * level;
  ctx.moveTo(0, h);
  ctx.lineTo(0, yb);
  for (let x = 0; x <= w; x += w / 8) {
    ctx.quadraticCurveTo(x + w / 16, yb - h * 0.04 - Math.sin(t * 1.5 + x * 0.02) * h * 0.03, x + w / 8, yb);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// serpentine brush-stroke body arcs above the water
function leviathanBody(ctx, w, h, t, { head = true, hp = 1 } = {}) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  const arcs = [
    [0.2, 0.5, 0.12], [0.5, 0.42, 0.15], [0.8, 0.52, 0.1],
  ];
  for (const [ax, ay, ar] of arcs) {
    ctx.lineWidth = w * 0.07 * (0.5 + 0.5 * hp);
    ctx.beginPath();
    ctx.arc(ax * w, ay * h + Math.sin(t * 2 + ax * 9) * h * 0.02, ar * w, Math.PI, 0);
    ctx.stroke();
  }
  if (head) {
    // brush-tip head with one huge eye
    const hx = w * 0.78;
    const hy = h * 0.32 + Math.sin(t * 2.2) * h * 0.02;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(hx - w * 0.14, hy + h * 0.1);
    ctx.quadraticCurveTo(hx - w * 0.05, hy - h * 0.12, hx + w * 0.05, hy - h * 0.14);
    ctx.quadraticCurveTo(hx + w * 0.14, hy - h * 0.15, hx + w * 0.1, hy - h * 0.02);
    ctx.quadraticCurveTo(hx + w * 0.07, hy + h * 0.1, hx - w * 0.14, hy + h * 0.1);
    ctx.closePath();
    ctx.fill();
    // bristle strands
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(hx + w * (0.02 + i * 0.025), hy - h * 0.13);
      ctx.quadraticCurveTo(hx + w * (0.08 + i * 0.03), hy - h * 0.2, hx + w * (0.12 + i * 0.035), hy - h * 0.24);
      ctx.stroke();
    }
    // the eye
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.ellipse(hx - w * 0.04, hy - h * 0.02, w * 0.045, w * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(hx - w * 0.045, hy - h * 0.015, w * 0.02, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export const setpieces = {
  /* ch2 — an ink puddle rises and becomes Sumi */
  sumi_rise(ctx, w, h, o) {
    const p = o.phase === 'done' ? 1 : clamp01(o.t / 2.2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.86);
    ctx.lineTo(w, h * 0.86);
    ctx.stroke();
    drawKai(ctx, w * 0.22, h * 0.86, h * 0.48, 'stand', { dir: 1, emotion: p > 0.7 ? 'shock' : 'neutral' });
    // the puddle
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(w * 0.66, h * 0.86, w * 0.16 * (1 - p * 0.5), h * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
    if (p < 0.35) {
      // rising blob
      const bh = p / 0.35;
      ctx.beginPath();
      ctx.ellipse(w * 0.66, h * 0.86 - bh * h * 0.14, w * 0.09, h * 0.15 * bh, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Sumi emerges, unveiling upward
      ctx.save();
      const reveal = clamp01((p - 0.35) / 0.65);
      ctx.beginPath();
      ctx.rect(0, h * 0.86 - reveal * h * 0.62, w, reveal * h * 0.62 + h * 0.05);
      ctx.clip();
      drawSumi(ctx, w * 0.66, h * 0.86, h * 0.5, 'float', { dir: -1, t: o.t, emotion: 'smile' });
      ctx.restore();
    }
    if (p >= 1) {
      drawSFXText(ctx, '!', w * 0.3, h * 0.3, Math.min(w, h) * 0.12, 0.1);
    }
  },

  /* ch2 — the road forks: Ink Sea to the left, Cut Panels to the right */
  route_split(ctx, w, h, o) {
    // left gate: waves
    ctx.save();
    ctx.beginPath();
    ctx.rect(w * 0.04, h * 0.18, w * 0.4, h * 0.52);
    ctx.clip();
    seaBase(ctx, w, h, o.t, 0.42);
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.strokeRect(w * 0.04, h * 0.18, w * 0.4, h * 0.52);
    // right gate: dead panels
    ctx.save();
    ctx.beginPath();
    ctx.rect(w * 0.56, h * 0.18, w * 0.4, h * 0.52);
    ctx.clip();
    fillTone(ctx, w * 0.56, h * 0.18, w * 0.4, h * 0.52, 'light', 0.5);
    for (const [bx, by, rot] of [[0.62, 0.3, -0.15], [0.76, 0.42, 0.1], [0.66, 0.55, 0.2]]) {
      ctx.save();
      ctx.translate(bx * w, by * h);
      ctx.rotate(rot);
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 3;
      ctx.strokeRect(-w * 0.07, -h * 0.05, w * 0.14, h * 0.1);
      ctx.restore();
    }
    ctx.restore();
    ctx.lineWidth = 5;
    ctx.strokeRect(w * 0.56, h * 0.18, w * 0.4, h * 0.52);
    // labels
    ctx.fillStyle = INK;
    ctx.font = `900 ${h * 0.045}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('THE INK SEA', w * 0.24, h * 0.8);
    ctx.fillText('THE CUT PANELS', w * 0.76, h * 0.8);
    // Kai & Sumi from behind, considering
    drawKai(ctx, w * 0.42, h * 0.99, h * 0.34, 'stand', { dir: 0, emotion: 'neutral' });
    drawSumi(ctx, w * 0.58, h * 0.99, h * 0.3, 'float', { dir: 0, t: o.t });
  },

  /* ch2 chapter-end spread — dives into whichever route was chosen */
  route_spread(ctx, w, h, o) {
    if (o.flags.route_cut) {
      fillTone(ctx, 0, 0, w, h, 'dark', 0.25);
      // towering graveyard gate
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8;
      ctx.strokeRect(w * 0.2, h * 0.1, w * 0.6, h * 0.62);
      ctx.fillStyle = INK;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(w * 0.2 + 8, h * 0.1 + 8, w * 0.6 - 16, h * 0.62 - 16);
      ctx.globalAlpha = 1;
      ctx.fillStyle = PAPER;
      ctx.font = `900 ${h * 0.03}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('D E L E T E D', w * 0.5, h * 0.2);
      drawKai(ctx, w * 0.42, h * 0.9, h * 0.24, 'walk', { dir: 1, emotion: 'determined' });
      drawSumi(ctx, w * 0.56, h * 0.9, h * 0.2, 'float', { dir: 1, t: o.t });
    } else {
      seaBase(ctx, w, h, o.t, 0.55);
      // great wave curling above
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.55);
      ctx.bezierCurveTo(w * 0.1, h * 0.15, w * 0.55, h * 0.05, w * 0.72, h * 0.22);
      ctx.quadraticCurveTo(w * 0.55, h * 0.18, w * 0.5, h * 0.3);
      ctx.quadraticCurveTo(w * 0.3, h * 0.42, w * 0.28, h * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(w * (0.08 + i * 0.05), h * (0.45 - i * 0.06));
        ctx.quadraticCurveTo(w * (0.3 + i * 0.06), h * (0.2 - i * 0.02), w * (0.6 + i * 0.03), h * (0.2 + i * 0.008));
        ctx.stroke();
      }
      drawKai(ctx, w * 0.5, h * 0.88, h * 0.22, 'brace', { dir: -1 });
      drawSumi(ctx, w * 0.64, h * 0.88, h * 0.18, 'float', { dir: -1, t: o.t });
    }
    ctx.fillStyle = INK;
    ctx.font = `900 ${h * 0.028}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(o.flags.route_cut ? 'NEXT: THE CUT PANELS' : 'NEXT: THE INK SEA', w / 2, h * 0.985);
  },

  /* ch3a — something enormous under the water */
  leviathan_lurk(ctx, w, h, o) {
    seaBase(ctx, w, h, o.t, 0.55);
    // coil silhouettes below the surface
    ctx.save();
    ctx.fillStyle = PAPER;
    ctx.globalAlpha = 0.25;
    for (const [ax, ay, ar] of [[0.3, 0.75, 0.16], [0.62, 0.82, 0.2], [0.85, 0.72, 0.12]]) {
      ctx.beginPath();
      ctx.arc(ax * w, ay * h, ar * w, 0, Math.PI * 2);
      ctx.fill();
    }
    // a pale eye opening below
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(w * 0.55, h * 0.72, w * 0.05, w * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(w * 0.55, h * 0.72, w * 0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // raft + crew
    const ry = h * 0.53 + Math.sin(o.t * 1.5) * h * 0.012;
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.14, ry);
    ctx.lineTo(w * 0.56, ry);
    ctx.lineTo(w * 0.53, ry + h * 0.04);
    ctx.lineTo(w * 0.17, ry + h * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawKai(ctx, w * 0.28, ry, h * 0.36, 'crouch', { dir: 1, emotion: 'shock' });
    drawSumi(ctx, w * 0.45, ry, h * 0.3, 'float', { dir: 1, t: o.t, emotion: 'shock' });
  },

  /* ch3a — the boss above the waves (backdrop for its attack panels) */
  leviathan_rise(ctx, w, h, o) {
    seaBase(ctx, w, h, o.t, 0.68);
    leviathanBody(ctx, w, h, o.t, { head: true, hp: 1 });
    if (o.phase === 'done') {
      impactStar(ctx, w * 0.74, h * 0.3, w * 0.1, 9);
    }
  },

  /* ch3a resolution — calmed into a finished picture, or scattered */
  leviathan_end(ctx, w, h, o) {
    if (o.flags.mercy) {
      seaBase(ctx, w, h, o.t, 0.7);
      // finished as a proper dragon-koi, leaping with joy
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineWidth = w * 0.05;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.65);
      ctx.bezierCurveTo(w * 0.25, h * 0.2, w * 0.6, h * 0.12, w * 0.78, h * 0.3);
      ctx.stroke();
      // scales along the finished stroke
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 7; i++) {
        const tt = 0.15 + i * 0.11;
        const px = w * (0.15 + tt * 0.63);
        const py = h * (0.62 - Math.sin(tt * Math.PI) * 0.42);
        ctx.beginPath();
        ctx.arc(px, py, w * 0.035, Math.PI * 0.2, Math.PI * 0.9);
        ctx.stroke();
      }
      // happy eye + whiskers
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.arc(w * 0.75, h * 0.27, w * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.arc(w * 0.75, h * 0.28, w * 0.02, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.8, h * 0.32);
      ctx.quadraticCurveTo(w * 0.92, h * 0.34, w * 0.95, h * 0.42);
      ctx.stroke();
      ctx.restore();
      speechBubble(ctx, 'It just wanted to be finished.', w * 0.34, h * 0.16, w * 0.55, { fs: Math.max(13, h * 0.042) });
    } else {
      seaBase(ctx, w, h, o.t, 0.72);
      // scattered stroke fragments raining
      ctx.fillStyle = INK;
      const p = o.phase === 'done' ? 1 : clamp01(o.t / 2.5);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + i;
        ctx.globalAlpha = Math.max(0, 0.8 - p * 0.6);
        ctx.save();
        ctx.translate(w * 0.55 + Math.cos(a) * p * w * 0.35, h * 0.35 + Math.sin(a) * p * h * 0.25);
        ctx.rotate(a);
        ctx.fillRect(-w * 0.03, -3, w * 0.06, 6);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      speechBubble(ctx, 'The sea goes quiet. Too quiet.', w * 0.4, h * 0.14, w * 0.6, { fs: Math.max(13, h * 0.042) });
    }
    drawKai(ctx, w * 0.24, h * 0.92, h * 0.3, 'stand', { dir: 1, emotion: o.flags.mercy ? 'smile' : 'neutral', weapon: 'brush' });
    drawSumi(ctx, w * 0.4, h * 0.92, h * 0.26, 'float', { dir: 1, t: o.t });
  },

  /* ch3b resolution — the Rejected One, fixed or fading */
  rejected_end(ctx, w, h, o) {
    fillTone(ctx, 0, 0, w, h, 'light', 0.25);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.86);
    ctx.lineTo(w, h * 0.86);
    ctx.stroke();
    drawKai(ctx, w * 0.24, h * 0.86, h * 0.46, 'stand', { dir: 1, emotion: o.flags.mercy ? 'smile' : 'sad', weapon: 'nib' });
    if (o.flags.mercy) {
      drawRejected(ctx, w * 0.68, h * 0.86, h * 0.48, 'stand', { dir: -1, emotion: 'smile', restored: true });
      speechBubble(ctx, '"A whole line. I\'m... whole."', w * 0.6, h * 0.16, w * 0.62, { fs: Math.max(13, h * 0.042), tail: { x: w * 0.66, y: h * 0.42 } });
    } else {
      const p = o.phase === 'done' ? 1 : clamp01(o.t / 2.5);
      ctx.save();
      ctx.globalAlpha = Math.max(0.08, 1 - p);
      drawRejected(ctx, w * 0.68, h * 0.86, h * 0.48, 'kneel', { dir: -1, emotion: 'sad' });
      ctx.restore();
      ctx.fillStyle = INK;
      for (let i = 0; i < 10; i++) {
        const a = i * 1.9;
        ctx.globalAlpha = Math.max(0, 0.6 - p * 0.5);
        ctx.beginPath();
        ctx.arc(w * 0.68 + Math.cos(a) * p * w * 0.2, h * 0.6 + Math.sin(a) * p * h * 0.2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      speechBubble(ctx, '"Better than the drawer... thank you."', w * 0.55, h * 0.16, w * 0.66, { fs: Math.max(13, h * 0.042) });
    }
  },

  /* ch4 — climbing OUT of the manga onto the desk */
  desk_climb(ctx, w, h, o) {
    // the page seen edge-on, world beyond is the desk
    ctx.save();
    ctx.fillStyle = 'rgba(17,17,17,0.12)';
    ctx.fillRect(0, 0, w, h * 0.45);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.45);
    ctx.lineTo(w, h * 0.42);
    ctx.stroke();
    // panel grid of the page below (their world, now beneath them)
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(w * 0.1, h * 0.55, w * 0.35, h * 0.3);
    ctx.strokeRect(w * 0.55, h * 0.58, w * 0.32, h * 0.26);
    ctx.globalAlpha = 1;
    ctx.restore();
    const p = o.phase === 'done' ? 1 : clamp01(o.t / 2.2);
    // Kai hauling himself over the page edge
    drawKai(ctx, w * 0.38, h * (0.62 - p * 0.18), h * 0.4, p > 0.7 ? 'stand' : 'crouch', { dir: 1, emotion: 'shock' });
    drawSumi(ctx, w * 0.6, h * (0.6 - p * 0.16), h * 0.34, 'float', { dir: -1, t: o.t, emotion: 'shock' });
  },

  /* ch4 — the Hand catches Sumi */
  sumi_caught(ctx, w, h, o) {
    fillTone(ctx, 0, 0, w, h, 'dark', 0.3);
    // giant fingers from above, gripping
    ctx.fillStyle = INK;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(w * 0.62 + i * w * 0.09, h * 0.22, w * 0.05, h * 0.28, i * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    // Sumi smearing in the grip
    ctx.save();
    const p = o.phase === 'done' ? 1 : clamp01(o.t / 2.5);
    ctx.globalAlpha = 1 - p * 0.35;
    drawSumi(ctx, w * 0.62, h * 0.72, h * 0.38, 'brace', { dir: -1, t: o.t, emotion: 'shock' });
    ctx.restore();
    // smear streaks pulling off of her
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(w * (0.56 + i * 0.045), h * 0.6);
      ctx.quadraticCurveTo(w * (0.45 + i * 0.05), h * 0.66, w * (0.3 + i * 0.06), h * (0.64 + i * 0.02));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    drawKai(ctx, w * 0.18, h * 0.94, h * 0.4, 'point', { dir: 1, emotion: 'shock', weapon: null });
    drawSFXText(ctx, 'SUMI!', w * 0.24, h * 0.3, Math.min(w, h) * 0.09, -0.08);
  },

  /* ch4 spread — the blank first page, the Hand with pencil AND eraser */
  panelzero_gate(ctx, w, h, o) {
    // radial dread
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = INK;
    for (let i = 0; i < 26; i++) {
      const a = Math.PI * (0.1 + (i / 26) * 0.8);
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.cos(a) * w * 0.12, h * 0.08 + Math.sin(a) * w * 0.12);
      ctx.lineTo(w / 2 + Math.cos(a) * h, h * 0.08 + Math.sin(a) * h);
      ctx.stroke();
    }
    ctx.restore();
    const drop = o.phase === 'done' ? 1 : clamp01(o.t / 2.6) ** 2;
    drawHandWithEraser(ctx, w, h, drop * 0.85);
    // the pencil in the other hand, angled in from the side
    ctx.save();
    ctx.fillStyle = INK;
    ctx.translate(w * (1.15 - drop * 0.35), h * 0.35);
    ctx.rotate(2.1);
    ctx.fillRect(-w * 0.035, 0, w * 0.07, h * 0.62);
    ctx.beginPath();
    ctx.moveTo(-w * 0.035, 0);
    ctx.lineTo(0, -h * 0.06);
    ctx.lineTo(w * 0.035, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // the blank page edge below
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.9);
    ctx.lineTo(w, h * 0.9);
    ctx.stroke();
    drawKai(ctx, w * 0.5, h * 0.9, h * 0.15, 'stand', { dir: 0, weapon: null });
    if (o.flags.savedSumi) drawSumi(ctx, w * 0.58, h * 0.9, h * 0.12, 'float', { dir: -1, t: o.t });
    if (drop >= 1) {
      ctx.fillStyle = INK;
      ctx.font = `900 ${h * 0.028}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('F I N A L   C H A P T E R :   P A N E L   Z E R O', w / 2, h * 0.985);
    }
  },

  /* ch5 — one spread, three endings; the derived ending flag picks the art */
  ending_spread(ctx, w, h, o) {
    if (o.flags.ending_artist) setpieces.ending_artist(ctx, w, h, o);
    else if (o.flags.ending_escape) setpieces.ending_escape(ctx, w, h, o);
    else setpieces.ending_blank(ctx, w, h, o);
  },

  ending_artist(ctx, w, h, o) {
    // Kai, pencil in hand, finishing the manga — Sumi and friends redrawn
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = INK;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.cos(a) * w * 0.2, h * 0.4 + Math.sin(a) * w * 0.2);
      ctx.lineTo(w / 2 + Math.cos(a) * h, h * 0.4 + Math.sin(a) * h);
      ctx.stroke();
    }
    ctx.restore();
    // fresh panels being drawn around them
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.08, h * 0.12, w * 0.32, h * 0.2);
    ctx.strokeRect(w * 0.6, h * 0.16, w * 0.3, h * 0.18);
    ctx.setLineDash([12, 8]);
    ctx.lineWidth = 2.5;
    ctx.strokeRect(w * 0.34, h * 0.4, w * 0.32, h * 0.16);
    ctx.setLineDash([]);
    // Kai wielding the great pencil
    drawKai(ctx, w * 0.38, h * 0.88, h * 0.34, 'fight', { dir: 1, weapon: null, emotion: 'smile' });
    ctx.save();
    ctx.fillStyle = INK;
    ctx.translate(w * 0.47, h * 0.52);
    ctx.rotate(0.5);
    ctx.fillRect(-w * 0.02, 0, w * 0.04, h * 0.3);
    ctx.beginPath();
    ctx.moveTo(-w * 0.02, 0);
    ctx.lineTo(0, -h * 0.045);
    ctx.lineTo(w * 0.02, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    drawSumi(ctx, w * 0.64, h * 0.88, h * 0.3, 'float', { dir: -1, t: o.t, emotion: 'smile' });
    // the leviathan-koi arcs across the sky panel
    ctx.strokeStyle = INK;
    ctx.lineWidth = w * 0.02;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.28);
    ctx.bezierCurveTo(w * 0.2, h * 0.16, w * 0.32, h * 0.16, w * 0.38, h * 0.26);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = `900 ${h * 0.05}px -apple-system, "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('THE NEW ARTIST', w / 2, h * 0.72);
    ctx.font = `700 ${h * 0.022}px -apple-system, sans-serif`;
    ctx.globalAlpha = 0.7;
    ctx.fillText('Kai picks up the pencil. This story gets an ending — his.', w / 2, h * 0.765);
    ctx.globalAlpha = 1;
  },

  ending_escape(ctx, w, h, o) {
    // the broken border and the white beyond
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    // shattered frame pieces
    const gap = [w * 0.38, w * 0.62];
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.25);
    ctx.lineTo(gap[0], h * 0.25);
    ctx.moveTo(gap[1], h * 0.25);
    ctx.lineTo(w * 0.9, h * 0.25);
    ctx.moveTo(w * 0.1, h * 0.25);
    ctx.lineTo(w * 0.1, h * 0.8);
    ctx.moveTo(w * 0.9, h * 0.25);
    ctx.lineTo(w * 0.9, h * 0.8);
    ctx.moveTo(w * 0.1, h * 0.8);
    ctx.lineTo(w * 0.9, h * 0.8);
    ctx.stroke();
    // shards flying
    ctx.fillStyle = INK;
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.translate(w * 0.5 + (i - 4) * w * 0.05, h * (0.18 - (i % 3) * 0.04));
      ctx.rotate(i);
      ctx.fillRect(-w * 0.025, -4, w * 0.05, 8);
      ctx.restore();
    }
    fillTone(ctx, w * 0.1, h * 0.25, w * 0.8, h * 0.55, 'light', 0.3);
    // Kai leaping through the gap, out of the panel
    const wpn = o.flags.brush ? 'brush' : o.flags.nib ? 'nib' : 'club';
    drawKai(ctx, w * 0.5, h * 0.34, h * 0.4, 'run', { dir: 1, emotion: 'determined', weapon: wpn });
    drawSFXText(ctx, 'SHATTER', w * 0.5, h * 0.14, Math.min(w, h) * 0.09, -0.05);
    ctx.fillStyle = INK;
    ctx.font = `900 ${h * 0.05}px -apple-system, "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('THE ESCAPE', w / 2, h * 0.9);
    ctx.font = `700 ${h * 0.022}px -apple-system, sans-serif`;
    ctx.globalAlpha = 0.7;
    ctx.fillText('Kai breaks the border and walks out of the story — alone.', w / 2, h * 0.945);
    ctx.globalAlpha = 1;
  },

  ending_blank(ctx, w, h, o) {
    // the Hand, gentled, draws a door
    const p = o.phase === 'done' ? 1 : clamp01(o.t / 2.5);
    // a pencil drawing a door, mid-stroke
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.7);
    ctx.lineTo(w * 0.35, h * 0.7 - p * h * 0.4);
    if (p > 0.5) {
      ctx.lineTo(w * 0.35 + (p - 0.5) * 2 * w * 0.3, h * 0.3);
    }
    if (p >= 1) {
      ctx.lineTo(w * 0.65, h * 0.7);
    }
    ctx.stroke();
    // doorknob appears at the end
    if (p >= 1) {
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.arc(w * 0.6, h * 0.52, w * 0.015, 0, Math.PI * 2);
      ctx.stroke();
    }
    // the pencil doing the drawing
    ctx.save();
    ctx.fillStyle = INK;
    const tipX = p <= 0.5 ? w * 0.35 : p < 1 ? w * 0.35 + (p - 0.5) * 2 * w * 0.3 : w * 0.65;
    const tipY = p <= 0.5 ? h * 0.7 - p * h * 0.4 : p < 1 ? h * 0.3 : h * 0.7;
    ctx.translate(tipX, tipY);
    ctx.rotate(-0.5);
    ctx.fillRect(-w * 0.025, -h * 0.4, w * 0.05, h * 0.4);
    ctx.beginPath();
    ctx.moveTo(-w * 0.025, 0);
    ctx.lineTo(0, h * 0.035);
    ctx.lineTo(w * 0.025, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    drawKai(ctx, w * 0.22, h * 0.92, h * 0.32, 'stand', { dir: 1, emotion: 'sad', weapon: null });
    if (o.flags.savedSumi) drawSumi(ctx, w * 0.78, h * 0.92, h * 0.26, 'float', { dir: -1, t: o.t, emotion: 'smile' });
    ctx.fillStyle = INK;
    ctx.font = `900 ${h * 0.05}px -apple-system, "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('THE BLANK PAGE', w / 2, h * 0.14);
    ctx.font = `700 ${h * 0.022}px -apple-system, sans-serif`;
    ctx.globalAlpha = 0.7;
    ctx.fillText('The Hand hesitates... and draws Kai a door instead.', w / 2, h * 0.185);
    ctx.globalAlpha = 1;
  },
};
