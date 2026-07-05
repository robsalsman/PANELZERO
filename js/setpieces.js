// Bespoke painters for story set pieces: Sumi's arrival, the route split,
// both route bosses, the desk, and the three ending spreads.
// Same painter contract as scenes.js.
import {
  INK, PAPER, C, fillTone, impactStar, drawSFXText, speechBubble, wrapText,
  drawHandWithEraser, drawSmudge, drawRaft, drawSprite,
} from './art.js';
import { drawKai, drawSumi, drawRejected, drawKen, drawYuri, drawGoma, drawArtist } from './chars.js';
import { drawBackdrop } from './compose.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ending card text: auto-fit title + wrapped subtitle, kept inside the panel
function endingTitle(ctx, w, h, title, sub, yTitle) {
  ctx.save();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  let fs = h * 0.045;
  ctx.font = `900 ${fs}px -apple-system, "Arial Black", sans-serif`;
  while (ctx.measureText(title).width > w * 0.9 && fs > 12) {
    fs *= 0.94;
    ctx.font = `900 ${fs}px -apple-system, "Arial Black", sans-serif`;
  }
  ctx.lineJoin = 'round';
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = fs * 0.28;
  ctx.strokeText(title, w / 2, yTitle * h);
  ctx.fillText(title, w / 2, yTitle * h);
  const sfs = Math.min(h * 0.02, w * 0.042);
  ctx.font = `700 ${sfs}px -apple-system, sans-serif`;
  ctx.lineWidth = sfs * 0.45;
  const lines = wrapText(ctx, sub, w * 0.86);
  lines.forEach((l, i) => {
    ctx.strokeText(l, w / 2, yTitle * h + fs * 0.9 + i * sfs * 1.35);
    ctx.globalAlpha = 0.85;
    ctx.fillText(l, w / 2, yTitle * h + fs * 0.9 + i * sfs * 1.35);
    ctx.globalAlpha = 1;
  });
  ctx.restore();
}

function seaBase(ctx, w, h, t, level = 0.62) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, h * level, 0, h);
  grad.addColorStop(0, C.sea1);
  grad.addColorStop(1, C.sea2);
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.95;
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
  // painted sprite first (drop leviathan-rise.webp into assets/sprites/);
  // the vector serpent below is the fallback
  if (drawSprite(ctx, head ? 'leviathan-rise' : 'leviathan-lurk',
    w * 0.52, h * 0.66 + Math.sin(t * 2) * h * 0.015, h * (0.42 + 0.16 * hp), 1)) return;
  ctx.save();
  const bodyDark = '#101a38';
  const rimGlow = 'rgba(150, 200, 255, 0.55)';
  const sway = (ph) => Math.sin(t * 2 + ph) * h * 0.02;
  const thick = 0.5 + 0.5 * hp;

  // one serpent coil: a lean arc of body breaching the surface, leaning
  // in the direction of travel so the whole silhouette reads as ONE animal
  const hump = (cx, hw, ht, ph) => {
    const yy = h * 0.56 + sway(ph);
    const top = yy - ht;
    const skew = hw * 0.35; // peak leans toward the head (right)
    ctx.beginPath();
    ctx.moveTo(cx - hw, yy + h * 0.02);
    ctx.bezierCurveTo(cx - hw * 0.55, top + ht * 0.1, cx - hw * 0.1 + skew, top, cx + skew, top);
    ctx.bezierCurveTo(cx + skew + hw * 0.4, top + ht * 0.15, cx + hw * 0.8, yy - ht * 0.35, cx + hw, yy + h * 0.02);
    // the underside of the arc curves back up — a coil, not a mound
    ctx.quadraticCurveTo(cx + hw * 0.45, yy - ht * 0.12, cx + skew * 0.4, yy + h * 0.015);
    ctx.quadraticCurveTo(cx - hw * 0.5, yy + h * 0.035, cx - hw, yy + h * 0.02);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, top, 0, yy + h * 0.05);
    grad.addColorStop(0, C.leviathan);
    grad.addColorStop(1, bodyDark);
    ctx.fillStyle = grad;
    ctx.strokeStyle = C.foam;
    ctx.lineWidth = 3.5;
    ctx.fill();
    ctx.stroke();
    // shark-fin spines riding the ridge line
    ctx.fillStyle = bodyDark;
    ctx.strokeStyle = rimGlow;
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      const sx = cx + skew + i * hw * 0.38;
      const sy = top + Math.abs(i) * ht * 0.22;
      const sl = ht * (0.42 - Math.abs(i) * 0.1);
      ctx.beginPath();
      ctx.moveTo(sx - hw * 0.05, sy + 2);
      ctx.bezierCurveTo(sx + hw * 0.02, sy - sl * 0.9, sx + hw * 0.12, sy - sl, sx + hw * 0.28, sy - sl * 0.55);
      ctx.quadraticCurveTo(sx + hw * 0.16, sy - sl * 0.3, sx + hw * 0.14, sy + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // wet highlight tracing the leading edge
    ctx.strokeStyle = rimGlow;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - hw * 0.7, yy - ht * 0.25);
    ctx.quadraticCurveTo(cx - hw * 0.25 + skew, top + ht * 0.12, cx + skew * 1.2, top + ht * 0.1);
    ctx.stroke();
    // foam where it breaks the water
    ctx.fillStyle = 'rgba(247, 244, 236, 0.75)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + s * hw * 0.95, yy + h * 0.02, hw * 0.16, h * 0.012, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  hump(w * 0.17, w * 0.11 * thick, h * 0.13 * thick, 0);
  hump(w * 0.45, w * 0.14 * thick, h * 0.2 * thick, 2.1);

  if (head) {
    // the head rears out of the water on a neck — an ink-brush dragon
    const hx = w * 0.78;
    const hy = h * 0.3 + sway(4.2);
    const hs = w * 0.13;
    // slim S-curved neck down into the sea
    ctx.beginPath();
    ctx.moveTo(hx - hs * 0.55, hy + hs * 0.35);
    ctx.bezierCurveTo(hx - hs * 1.15, hy + hs * 1.3, hx - hs * 0.5, hy + hs * 1.9, hx - hs * 0.35, h * 0.62);
    ctx.lineTo(hx + hs * 0.55, h * 0.62);
    ctx.bezierCurveTo(hx + hs * 0.45, hy + hs * 1.8, hx + hs * 0.65, hy + hs * 0.9, hx + hs * 0.45, hy + hs * 0.25);
    ctx.closePath();
    const nGrad = ctx.createLinearGradient(0, hy, 0, h * 0.62);
    nGrad.addColorStop(0, C.leviathan);
    nGrad.addColorStop(1, bodyDark);
    ctx.fillStyle = nGrad;
    ctx.strokeStyle = C.foam;
    ctx.lineWidth = 3.5;
    ctx.fill();
    ctx.stroke();
    // skull + long snout, jaw slightly open
    ctx.beginPath();
    ctx.moveTo(hx - hs * 0.9, hy + hs * 0.35);            // back of jaw
    ctx.quadraticCurveTo(hx - hs * 1.05, hy - hs * 0.4, hx - hs * 0.45, hy - hs * 0.62); // crown
    ctx.quadraticCurveTo(hx + hs * 0.25, hy - hs * 0.78, hx + hs * 1.05, hy - hs * 0.42); // brow to snout tip
    ctx.quadraticCurveTo(hx + hs * 1.25, hy - hs * 0.32, hx + hs * 1.05, hy - hs * 0.18); // upper lip
    ctx.lineTo(hx + hs * 0.15, hy - hs * 0.05);           // mouth line back
    ctx.quadraticCurveTo(hx + hs * 0.7, hy + hs * 0.22, hx + hs * 0.5, hy + hs * 0.32);  // lower jaw
    ctx.quadraticCurveTo(hx - hs * 0.2, hy + hs * 0.55, hx - hs * 0.9, hy + hs * 0.35);
    ctx.closePath();
    const hGrad = ctx.createLinearGradient(0, hy - hs, 0, hy + hs * 0.6);
    hGrad.addColorStop(0, C.leviathan);
    hGrad.addColorStop(1, bodyDark);
    ctx.fillStyle = hGrad;
    ctx.fill();
    ctx.stroke();
    // fang at the snout
    ctx.fillStyle = C.foam;
    ctx.beginPath();
    ctx.moveTo(hx + hs * 0.95, hy - hs * 0.18);
    ctx.lineTo(hx + hs * 0.88, hy + hs * 0.02);
    ctx.lineTo(hx + hs * 0.78, hy - hs * 0.14);
    ctx.closePath();
    ctx.fill();
    // swept-back horn
    ctx.beginPath();
    ctx.moveTo(hx - hs * 0.35, hy - hs * 0.6);
    ctx.quadraticCurveTo(hx - hs * 1.1, hy - hs * 1.25, hx - hs * 1.5, hy - hs * 1.1);
    ctx.quadraticCurveTo(hx - hs * 1.0, hy - hs * 0.85, hx - hs * 0.62, hy - hs * 0.42);
    ctx.closePath();
    ctx.fillStyle = bodyDark;
    ctx.fill();
    ctx.stroke();
    // ink-bristle mane flowing off the skull
    ctx.strokeStyle = rimGlow;
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(hx - hs * (0.5 + i * 0.08), hy - hs * (0.5 - i * 0.1));
      ctx.quadraticCurveTo(
        hx - hs * (1.3 + i * 0.12), hy - hs * (0.7 - i * 0.16),
        hx - hs * (1.8 + i * 0.14), hy - hs * (0.3 - i * 0.18) + Math.sin(t * 3 + i) * hs * 0.08
      );
      ctx.stroke();
    }
    // whiskers curling from the snout
    ctx.lineWidth = 2.5;
    for (const s of [-0.08, 0.14]) {
      ctx.beginPath();
      ctx.moveTo(hx + hs * 1.0, hy - hs * 0.25);
      ctx.bezierCurveTo(
        hx + hs * 1.5, hy - hs * (0.1 - s), hx + hs * 1.4, hy + hs * (0.35 + s),
        hx + hs * (1.7 + s), hy + hs * (0.5 + s) + Math.sin(t * 2.4 + s * 9) * hs * 0.06
      );
      ctx.stroke();
    }
    // molten-gold eye with a slit pupil, glaring forward
    ctx.fillStyle = C.leviathanEye;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(hx + hs * 0.05, hy - hs * 0.38, hs * 0.22, hs * 0.16, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(hx + hs * 0.1, hy - hs * 0.38, hs * 0.05, hs * 0.14, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // glow rim above the eye
    ctx.strokeStyle = rimGlow;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(hx + hs * 0.05, hy - hs * 0.42, hs * 0.3, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    // foam collar where the neck pierces the sea
    ctx.fillStyle = 'rgba(247, 244, 236, 0.8)';
    ctx.beginPath();
    ctx.ellipse(hx + hs * 0.1, h * 0.615, hs * 0.85, h * 0.014, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export const setpieces = {
  /* ch2 — an ink puddle rises and becomes Sumi */
  sumi_rise(ctx, w, h, o) {
    const p = o.phase === 'done' ? 1 : clamp01(o.t / 2.2);
    if (!o.hasImg) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.86);
      ctx.lineTo(w, h * 0.86);
      ctx.stroke();
    }
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
    if (o.hasImg) {
      // the painted fork carries the scene — just label the two fates
      ctx.fillStyle = PAPER;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.font = `900 ${h * 0.042}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      for (const [tx, ty, label] of [[0.26, 0.76, 'THE INK SEA'], [0.74, 0.7, 'THE CUT PANELS']]) {
        const tw2 = ctx.measureText(label).width;
        ctx.fillRect(tx * w - tw2 / 2 - 10, ty * h - h * 0.032, tw2 + 20, h * 0.055);
        ctx.strokeRect(tx * w - tw2 / 2 - 10, ty * h - h * 0.032, tw2 + 20, h * 0.055);
        ctx.fillStyle = INK;
        ctx.fillText(label, tx * w, ty * h + h * 0.012);
        ctx.fillStyle = PAPER;
      }
      drawKai(ctx, w * 0.42, h * 0.99, h * 0.3, 'stand', { dir: 0, emotion: 'neutral' });
      drawSumi(ctx, w * 0.58, h * 0.99, h * 0.27, 'float', { dir: 0, t: o.t });
      return;
    }
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
      ctx.fillStyle = C.sea1;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.55);
      ctx.bezierCurveTo(w * 0.1, h * 0.15, w * 0.55, h * 0.05, w * 0.72, h * 0.22);
      ctx.quadraticCurveTo(w * 0.55, h * 0.18, w * 0.5, h * 0.3);
      ctx.quadraticCurveTo(w * 0.3, h * 0.42, w * 0.28, h * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.foam;
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
    if (!o.hasImg) seaBase(ctx, w, h, o.t, 0.55);
    // painted: the skull and golden eye just above the waterline, aft of the raft
    ctx.save();
    ctx.globalAlpha = 0.92;
    const painted = drawSprite(ctx, 'leviathan-lurk', w * 0.62,
      h * (0.86 + Math.sin(o.t * 1.6) * 0.012), h * 0.3, 1);
    ctx.restore();
    if (!painted) {
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
    }
    // raft + crew
    const ry = h * 0.53 + Math.sin(o.t * 1.5) * h * 0.012;
    drawRaft(ctx, w * 0.35, ry, w * 0.44, o.t);
    drawKai(ctx, w * 0.28, ry, h * 0.36, 'crouch', { dir: 1, emotion: 'shock' });
    drawSumi(ctx, w * 0.45, ry, h * 0.3, 'float', { dir: 1, t: o.t, emotion: 'shock' });
  },

  /* ch3a — the boss above the waves (backdrop for its attack panels) */
  leviathan_rise(ctx, w, h, o) {
    if (!o.hasImg) seaBase(ctx, w, h, o.t, 0.68);
    leviathanBody(ctx, w, h, o.t, { head: true, hp: 1 });
    if (o.phase === 'done') {
      impactStar(ctx, w * 0.74, h * 0.3, w * 0.1, 9);
    }
  },

  /* ch3a resolution — calmed into a finished picture, or scattered */
  leviathan_end(ctx, w, h, o) {
    if (o.flags.mercy) {
      if (!o.hasImg) seaBase(ctx, w, h, o.t, 0.7);
      // finished as a proper dragon-koi, leaping with joy
      ctx.save();
      ctx.strokeStyle = C.leviathan;
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
      ctx.fillStyle = C.leviathanEye;
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
      speechBubble(ctx, 'It just wanted to be finished.', w * 0.34, h * 0.16, w * 0.55, { fs: Math.min(20, Math.max(13, h * 0.042)) });
    } else {
      if (!o.hasImg) seaBase(ctx, w, h, o.t, 0.72);
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
      speechBubble(ctx, 'The sea goes quiet. Too quiet.', w * 0.4, h * 0.14, w * 0.6, { fs: Math.min(20, Math.max(13, h * 0.042)) });
    }
    drawKai(ctx, w * 0.24, h * 0.92, h * 0.3, 'stand', { dir: 1, emotion: o.flags.mercy ? 'smile' : 'neutral', weapon: 'brush' });
    drawSumi(ctx, w * 0.4, h * 0.92, h * 0.26, 'float', { dir: 1, t: o.t });
  },

  /* ch3b resolution — the Rejected One, fixed or fading */
  rejected_end(ctx, w, h, o) {
    if (!o.hasImg) {
      fillTone(ctx, 0, 0, w, h, 'light', 0.25);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.86);
      ctx.lineTo(w, h * 0.86);
      ctx.stroke();
    }
    drawKai(ctx, w * 0.24, h * 0.86, h * 0.46, 'stand', { dir: 1, emotion: o.flags.mercy ? 'smile' : 'sad', weapon: 'nib' });
    if (o.flags.mercy) {
      drawRejected(ctx, w * 0.68, h * 0.86, h * 0.48, 'stand', { dir: -1, emotion: 'smile', restored: true });
      speechBubble(ctx, '"A whole line. I\'m... whole."', w * 0.6, h * 0.16, w * 0.62, { fs: Math.min(20, Math.max(13, h * 0.042)), tail: { x: w * 0.66, y: h * 0.42 } });
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
      speechBubble(ctx, '"Better than the drawer... thank you."', w * 0.55, h * 0.16, w * 0.66, { fs: Math.min(20, Math.max(13, h * 0.042)) });
    }
  },

  /* ch4 — climbing OUT of the manga onto the desk */
  desk_climb(ctx, w, h, o) {
    if (o.hasImg) {
      const p2 = o.phase === 'done' ? 1 : clamp01(o.t / 2.2);
      drawKai(ctx, w * 0.38, h * (0.92 - p2 * 0.06), h * 0.4, p2 > 0.7 ? 'stand' : 'crouch', { dir: 1, emotion: 'shock' });
      drawSumi(ctx, w * 0.6, h * (0.9 - p2 * 0.05), h * 0.34, 'float', { dir: -1, t: o.t, emotion: 'shock' });
      return;
    }
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
    if (!o.hasImg) {
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
    }
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
      ctx.font = `900 ${Math.min(h * 0.024, w * 0.052)}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('FINAL CHAPTER: PANEL ZERO', w / 2, h * 0.985);
    }
  },

  /* ch5 — one spread, three endings; the derived ending flag picks the art */
  ending_spread(ctx, w, h, o) {
    if (o.flags.ending_coauthors) setpieces.ending_coauthors(ctx, w, h, o);
    else if (o.flags.ending_newhand) setpieces.ending_newhand(ctx, w, h, o);
    else if (o.flags.ending_published) setpieces.ending_published(ctx, w, h, o);
    else if (o.flags.ending_artist) setpieces.ending_artist(ctx, w, h, o);
    else if (o.flags.ending_escape) setpieces.ending_escape(ctx, w, h, o);
    else setpieces.ending_blank(ctx, w, h, o);
  },

  /* the true ending — they draw the next chapter TOGETHER */
  ending_coauthors(ctx, w, h, o) {
    drawBackdrop(ctx, w, h, 'assets/bg/ending-artist.webp');
    drawArtist(ctx, w * 0.3, h * 0.68, h * 0.24, 'stand', { dir: 1, emotion: 'smile' });
    drawKai(ctx, w * 0.48, h * 0.7, h * 0.22, 'stand', { dir: -1, weapon: null, emotion: 'smile' });
    drawSumi(ctx, w * 0.66, h * 0.68, h * 0.19, 'float', { dir: -1, t: o.t, emotion: 'smile' });
    if (o.flags.duel_goma) drawGoma(ctx, w * 0.82, h * 0.68, h * 0.14, { emotion: 'smile', t: o.t });
    else if (o.flags.duel_yuri) drawYuri(ctx, w * 0.82, h * 0.68, h * 0.18, 'stand', { dir: -1 });
    else drawKen(ctx, w * 0.84, h * 0.68, h * 0.19, 'stand', { dir: -1, emotion: 'smile' });
    endingTitle(ctx, w, h, '共筆 THE CO-AUTHORS', 'Two hands on one pencil. The story gets a chapter two — and so does she.', 0.86);
  },

  /* the golden epilogue — she wakes, and finishes it for real */
  ending_published(ctx, w, h, o) {
    drawBackdrop(ctx, w, h, 'assets/bg/desk.webp');
    // the printed volume, standing proud on the desk
    ctx.save();
    ctx.translate(w * 0.5, h * 0.55);
    ctx.rotate(-0.04);
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.fillRect(-w * 0.2, -h * 0.17, w * 0.4, h * 0.34);
    ctx.strokeRect(-w * 0.2, -h * 0.17, w * 0.4, h * 0.34);
    ctx.fillStyle = C.red;
    ctx.fillRect(-w * 0.2, -h * 0.17, w * 0.4, h * 0.05);
    ctx.fillStyle = INK;
    ctx.font = `900 ${w * 0.052}px -apple-system, "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('PANEL ZERO', 0, h * 0.005);
    ctx.font = `700 ${w * 0.026}px -apple-system, sans-serif`;
    ctx.fillText('VOL. 1  —  AOKI', 0, h * 0.05);
    ctx.font = `700 ${w * 0.02}px -apple-system, sans-serif`;
    ctx.globalAlpha = 0.6;
    ctx.fillText('1st printing', 0, h * 0.09);
    ctx.restore();
    endingTitle(ctx, w, h, 'THE PUBLISHED', 'Months later, on a bookstore shelf: her name on the spine. Somewhere inside, a boy waves from panel one.', 0.88);
  },

  /* the dark mirror — Kai takes the eraser */
  ending_newhand(ctx, w, h, o) {
    // black void closing in on one white page
    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f7f4ec';
    ctx.save();
    ctx.translate(w * 0.5, h * 0.62);
    ctx.rotate(-0.03);
    ctx.fillRect(-w * 0.3, -h * 0.2, w * 0.6, h * 0.4);
    // a new boy, asleep on the new page — the loop begins again
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(-w * 0.05, h * 0.05, w * 0.12, h * 0.035, 0.1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-w * 0.16, h * 0.03, w * 0.035, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
    // KAI'S hand descending — red cuff. The cruelest panel is the quiet one.
    ctx.save();
    ctx.translate(w * 0.62, 0);
    ctx.fillStyle = '#1c1c26';
    ctx.fillRect(-w * 0.1, -h * 0.02, w * 0.2, h * 0.34);
    ctx.fillStyle = C.red; // the jacket cuff
    ctx.fillRect(-w * 0.115, h * 0.24, w * 0.23, h * 0.05);
    ctx.fillStyle = '#e9c096';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(i * w * 0.045, h * 0.36, w * 0.024, h * 0.05, i * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
    // the eraser in the grip
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.fillRect(-w * 0.09, h * 0.4, w * 0.18, h * 0.045);
    ctx.strokeRect(-w * 0.09, h * 0.4, w * 0.18, h * 0.045);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = PAPER;
    ctx.textAlign = 'center';
    ctx.font = `900 ${h * 0.042}px -apple-system, "Arial Black", "Hiragino Sans", sans-serif`;
    ctx.fillText('新しい手 THE NEW HAND', w / 2, h * 0.13);
    ctx.font = `700 ${Math.min(h * 0.02, w * 0.042)}px -apple-system, sans-serif`;
    ctx.globalAlpha = 0.75;
    const sub = 'Somewhere, on a fresh page, a new boy wakes up inside an unfinished manga.';
    ctx.fillText(sub, w / 2, h * 0.175);
    ctx.restore();
  },

  ending_artist(ctx, w, h, o) {
    const painted = drawBackdrop(ctx, w, h, 'assets/bg/ending-artist.webp');
    if (!painted) {
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
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.strokeRect(w * 0.08, h * 0.12, w * 0.32, h * 0.2);
      ctx.strokeRect(w * 0.6, h * 0.16, w * 0.3, h * 0.18);
      ctx.setLineDash([12, 8]);
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.34, h * 0.4, w * 0.32, h * 0.16);
      ctx.setLineDash([]);
    }
    // the pair, small against the blooming world
    drawKai(ctx, w * 0.36, h * 0.66, h * 0.22, 'stand', { dir: 1, weapon: null, emotion: 'smile' });
    drawSumi(ctx, w * 0.62, h * 0.66, h * 0.19, 'float', { dir: -1, t: o.t, emotion: 'smile' });
    if (!painted) {
      // vector world: sketch the koi and the pencil
      ctx.strokeStyle = INK;
      ctx.lineWidth = w * 0.02;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.28);
      ctx.bezierCurveTo(w * 0.2, h * 0.16, w * 0.32, h * 0.16, w * 0.38, h * 0.26);
      ctx.stroke();
    }
    endingTitle(ctx, w, h, 'THE NEW ARTIST', 'Kai picks up the pencil. This story gets an ending — his.', 0.85);
  },

  ending_escape(ctx, w, h, o) {
    if (drawBackdrop(ctx, w, h, 'assets/bg/ending-escape.webp')) {
      const wpn2 = o.flags.brush ? 'brush' : o.flags.nib ? 'nib' : 'club';
      drawKai(ctx, w * 0.5, h * 0.6, h * 0.34, 'run', { dir: 1, emotion: 'determined', weapon: wpn2 });
      drawSFXText(ctx, 'SHATTER', w * 0.5, h * 0.14, Math.min(w, h) * 0.085, -0.05);
      endingTitle(ctx, w, h, 'THE ESCAPE', 'Kai breaks the border and walks out of the story — alone.', 0.89);
      return;
    }
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
    // Kai mid-leap toward the broken gap in the border
    const wpn = o.flags.brush ? 'brush' : o.flags.nib ? 'nib' : 'club';
    drawKai(ctx, w * 0.5, h * 0.56, h * 0.36, 'run', { dir: 1, emotion: 'determined', weapon: wpn });
    // motion burst under him
    ctx.strokeStyle = INK;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(w * (0.34 + i * 0.08), h * 0.6);
      ctx.lineTo(w * (0.3 + i * 0.08), h * 0.68);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    drawSFXText(ctx, 'SHATTER', w * 0.5, h * 0.16, Math.min(w, h) * 0.085, -0.05);
    endingTitle(ctx, w, h, 'THE ESCAPE', 'Kai breaks the border and walks out of the story — alone.', 0.89);
  },

  ending_blank(ctx, w, h, o) {
    if (drawBackdrop(ctx, w, h, 'assets/bg/ending-blank.webp')) {
      // the painted door stands alone; the cast says goodbye
      drawKai(ctx, w * 0.22, h * 0.9, h * 0.3, 'stand', { dir: 1, emotion: 'sad', weapon: null });
      if (o.flags.savedSumi) drawSumi(ctx, w * 0.82, h * 0.9, h * 0.24, 'float', { dir: -1, t: o.t, emotion: 'smile' });
      endingTitle(ctx, w, h, 'THE BLANK PAGE', 'The Hand hesitates... and draws Kai a door instead.', 0.12);
      return;
    }
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
    if (o.flags.savedSumi) drawSumi(ctx, w * 0.82, h * 0.92, h * 0.24, 'float', { dir: -1, t: o.t, emotion: 'smile' });
    endingTitle(ctx, w, h, 'THE BLANK PAGE', 'The Hand hesitates... and draws Kai a door instead.', 0.13);
  },
};
