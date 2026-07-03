// Procedural ink art (M3). Black/white vector shapes, dot screentone, SFX text
// as physical objects, the Artist's Hand. No image assets — everything is drawn.

export const INK = '#111111';
export const PAPER = '#f7f4ec';

/* ---------------- screentone ---------------- */
const toneCache = new Map();
export function tonePattern(ctx, density) {
  // density: dot radius/step tuning; cached offscreen tile
  const key = density;
  if (toneCache.has(key)) return toneCache.get(key);
  const step = density === 'dark' ? 7 : 10;
  const r = density === 'dark' ? 2.2 : 1.3;
  const c = document.createElement('canvas');
  c.width = c.height = step * 2;
  const g = c.getContext('2d');
  g.fillStyle = INK;
  for (const [ox, oy] of [[step / 2, step / 2], [step * 1.5, step * 1.5]]) {
    g.beginPath();
    g.arc(ox, oy, r, 0, Math.PI * 2);
    g.fill();
  }
  const pat = ctx.createPattern(c, 'repeat');
  toneCache.set(key, pat);
  return pat;
}

export function fillTone(ctx, x, y, w, h, density = 'light', alpha = 0.5) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = tonePattern(ctx, density);
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/* ---------------- ink helpers ---------------- */
function stroke(ctx, pts, lw) {
  ctx.beginPath();
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}

export function speedLinesV(ctx, w, h, n = 14, alpha = 0.25) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = INK;
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.5) / n) * w + Math.sin(i * 7.3) * 6;
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(i * 3.1) * 8, h);
    ctx.stroke();
  }
  ctx.restore();
}

export function speedLinesH(ctx, w, h, n = 10, alpha = 0.25) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = INK;
  for (let i = 0; i < n; i++) {
    const y = ((i + 0.5) / n) * h + Math.sin(i * 5.1) * 5;
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + Math.sin(i * 2.7) * 6);
    ctx.stroke();
  }
  ctx.restore();
}

export function impactStar(ctx, x, y, r, spikes = 9) {
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(a) * rr * (1 + Math.sin(i * 13.7) * 0.15);
    const py = y + Math.sin(a) * rr * (1 + Math.cos(i * 9.3) * 0.15);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/* ---------------- SFX text (physical objects) ---------------- */
export function drawSFXText(ctx, text, x, y, size, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = `900 ${size}px -apple-system, "Arial Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const step = size * 0.72;
  const x0 = -((text.length - 1) * step) / 2;
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.translate(x0 + i * step, Math.cos(i * 7.7) * size * 0.07);
    ctx.rotate(Math.sin(i * 12.9 + text.length) * 0.1);
    ctx.strokeStyle = INK;
    ctx.lineWidth = size * 0.18;
    ctx.strokeText(text[i], 0, 0);
    ctx.fillStyle = PAPER;
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/* ---------------- speech bubbles ---------------- */
export function wrapText(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const wd of words) {
    const test = line ? line + ' ' + wd : wd;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = wd;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function speechBubble(ctx, text, x, y, maxW, opts = {}) {
  const { tail = null, jagged = false, fs = 15, selected = false, faded = false } = opts;
  ctx.save();
  ctx.font = `${selected ? 900 : 700} ${fs}px -apple-system, "Segoe UI", sans-serif`;
  const lines = wrapText(ctx, text, maxW - fs * 1.6);
  const lh = fs * 1.3;
  const tw = Math.min(maxW - fs * 1.6, Math.max(...lines.map((l) => ctx.measureText(l).width)));
  const bw = tw + fs * 1.6;
  const bh = lines.length * lh + fs * 1.1;
  const bx = x - bw / 2;
  const by = y - bh / 2;

  ctx.globalAlpha = faded ? 0.3 : 1;
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = selected ? 4 : 2.5;
  ctx.beginPath();
  if (jagged) {
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rx = (bw / 2 + (i % 2 ? fs * 0.7 : 0)) * Math.cos(a);
      const ry = (bh / 2 + (i % 2 ? fs * 0.7 : 0)) * Math.sin(a);
      i === 0 ? ctx.moveTo(x + rx, y + ry) : ctx.lineTo(x + rx, y + ry);
    }
    ctx.closePath();
  } else {
    const r = Math.min(16, bh / 2);
    ctx.roundRect(bx, by, bw, bh, r);
  }
  ctx.fill();
  ctx.stroke();

  if (tail) {
    ctx.beginPath();
    ctx.moveTo(x - 10, by + bh - 2);
    ctx.lineTo(tail.x, tail.y);
    ctx.lineTo(x + 12, by + bh - 2);
    ctx.closePath();
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.stroke();
    // hide seam
    ctx.fillRect(x - 9, by + bh - ctx.lineWidth - 1, 20, ctx.lineWidth + 1);
  }

  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, x, by + fs * 0.55 + i * lh));
  ctx.restore();
  return { x: bx, y: by, w: bw, h: bh };
}

export function caption(ctx, text, w, y, fs = 14) {
  ctx.save();
  ctx.font = `700 ${fs}px -apple-system, "Segoe UI", sans-serif`;
  const pad = fs * 0.8;
  const lines = wrapText(ctx, text, w * 0.8);
  const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const bw = tw + pad * 2;
  const bh = lines.length * fs * 1.35 + pad;
  const bx = (w - bw) / 2;
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillRect(bx, y, bw, bh);
  ctx.strokeRect(bx, y, bw, bh);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, w / 2, y + pad * 0.55 + i * fs * 1.35));
  ctx.restore();
  return bh;
}

/* ---------------- The Artist's Hand ---------------- */
export function drawPencilShadow(ctx, w, h, sweepX, alpha = 0.4) {
  // a giant pencil silhouette crossing the panel — pure shadow, no outline
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = INK;
  ctx.translate(sweepX, h * 0.1);
  ctx.rotate(0.5);
  const pw = w * 0.16;
  const pl = h * 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);                       // tip
  ctx.lineTo(-pw / 2, pl * 0.14);
  ctx.lineTo(-pw / 2, pl);
  ctx.lineTo(pw / 2, pl);
  ctx.lineTo(pw / 2, pl * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawHandWithEraser(ctx, w, h, drop) {
  // drop: 0 (offscreen top) -> 1 (fully descended). Spread/boss visual.
  ctx.save();
  const cx = w * 0.5;
  const y = -h * 1.0 + drop * h * 1.32;
  ctx.translate(cx, y);
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;

  // forearm
  ctx.fillRect(-w * 0.13, -h, w * 0.26, h * 0.75);
  // palm
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.18, w * 0.2, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  // fingers gripping downward
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    const fx = i * w * 0.075;
    ctx.ellipse(fx, -h * 0.06, w * 0.035, h * 0.075, i * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  // eraser block held below the fingers
  ctx.save();
  ctx.translate(0, h * 0.04);
  ctx.rotate(-0.06);
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(3, w * 0.012);
  const ew = w * 0.3;
  const eh = h * 0.09;
  ctx.fillRect(-ew / 2, 0, ew, eh);
  ctx.strokeRect(-ew / 2, 0, ew, eh);
  ctx.font = `900 ${eh * 0.55}px -apple-system, sans-serif`;
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ERASER', 0, eh / 2);
  ctx.restore();

  ctx.restore();
}

/* ---------------- smudge creature ---------------- */
export function drawSmudge(ctx, x, y, r, t, hpFrac = 1) {
  ctx.save();
  ctx.translate(x, y);
  const wob = Math.sin(t * 6) * r * 0.06;
  // scribbly gray body
  ctx.fillStyle = 'rgba(17,17,17,0.55)';
  ctx.beginPath();
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.75 + 0.25 * Math.sin(a * 3 + t * 4)) * (0.6 + 0.4 * hpFrac);
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr * 0.85 + wob;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  // scribble strokes on top
  ctx.strokeStyle = 'rgba(17,17,17,0.7)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    const yy = -r * 0.5 + (i / 6) * r + wob;
    ctx.moveTo(-r * 0.6, yy);
    ctx.bezierCurveTo(-r * 0.2, yy + 8, r * 0.2, yy - 8, r * 0.6, yy + 4);
    ctx.stroke();
  }
  // angry eyes
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, -r * 0.15 + wob, r * 0.14, r * 0.18, 0.2, 0, Math.PI * 2);
  ctx.ellipse(r * 0.25, -r * 0.15 + wob, r * 0.14, r * 0.18, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 0.12 + wob, r * 0.05, 0, Math.PI * 2);
  ctx.arc(r * 0.28, -r * 0.12 + wob, r * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------------- verb icons (first-3-uses hint, top corner) ---------------- */
export function drawVerbIcon(ctx, verb, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = Math.max(2, s * 0.12);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.fillStyle = PAPER;
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  switch (verb) {
    case 'tap':
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.6, -0.6, 0.9);
      ctx.stroke();
      break;
    case 'swipe':
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, 0);
      ctx.lineTo(s * 0.4, 0);
      ctx.moveTo(s * 0.1, -s * 0.3);
      ctx.lineTo(s * 0.45, 0);
      ctx.lineTo(s * 0.1, s * 0.3);
      ctx.stroke();
      break;
    case 'hold':
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.62, 0, Math.PI * 1.5);
      ctx.stroke();
      break;
    case 'trace':
      ctx.setLineDash([s * 0.22, s * 0.18]);
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, s * 0.25);
      ctx.quadraticCurveTo(0, -s * 0.55, s * 0.55, s * 0.1);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    case 'choose':
      ctx.beginPath();
      ctx.roundRect(-s * 0.55, -s * 0.4, s * 1.1, s * 0.6, s * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.1, s * 0.2);
      ctx.lineTo(-s * 0.25, s * 0.5);
      ctx.lineTo(s * 0.15, s * 0.2);
      ctx.fill();
      break;
  }
  ctx.restore();
}
