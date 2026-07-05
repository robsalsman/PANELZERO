// Procedural ink art (M3). Black/white vector shapes, dot screentone, SFX text
// as physical objects, the Artist's Hand. No image assets — everything is drawn.

export const INK = '#1c1c26';
export const PAPER = '#f7f4ec';

// full-color manga palette — modern webtoon color over paper
export const C = {
  // Kai
  kaiHair: '#252b40', kaiSheen: '#51628c', kaiSkin: '#f6d9ba', kaiSkinShade: '#e9c096',
  kaiEye: '#d4791f', kaiJacket: '#c8392e', kaiJacketShade: '#992a21', kaiTee: '#f4f1ea',
  kaiPants: '#2b2f40', kaiShoe: '#c8392e',
  // Sumi
  sumiHair: '#2c2545', sumiSheen: '#6a55a3', sumiSkin: '#f7ece4', sumiEye: '#7a5fc0',
  sumiDress: '#262243', sumiGlow: '#6fd8e6',
  // Rejected One (unfinished — desaturated pencil)
  rejHair: '#565049', rejSkin: '#e6ddcd', rejCloth: '#93897a', rejEye: '#6b6156',
  // world
  smudge: '#544a63', leviathan: '#233156', leviathanEye: '#e0a63c',
  sea1: '#1d2c5e', sea2: '#0e1738', foam: '#bfe3ee',
  wood1: '#c09059', wood2: '#a37a49',
  gold: '#e0a63c', red: '#c8392e',
};

/* ---------------- sprite layer (AI-painted characters) ---------------- */
// Sprites are WebP with alpha; meta.json holds each sprite's alpha bounding
// box so we can anchor feet precisely. Vector renderers remain the fallback
// while images stream in (and for any pose without a sprite).
let SPRITE_META = null;
const spriteImgs = new Map();

export function initSprites() {
  if (SPRITE_META !== null || typeof document === 'undefined') return;
  SPRITE_META = {};
  fetch('assets/sprites/meta.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((m) => {
      SPRITE_META = m;
      for (const name of Object.keys(m)) spriteImg(name); // warm the cache
    })
    .catch(() => {});
}

function spriteImg(name) {
  let img = spriteImgs.get(name);
  if (!img) {
    img = new Image();
    img.src = `assets/sprites/${name}.webp`;
    spriteImgs.set(name, img);
  }
  return img;
}

// Stop-motion animation: when meta.json has `${name}-f1..fN`, drawSprite
// cycles those frames on the shared clock (~7 fps, classic manga-anime
// "shot on threes" feel). Single-image sprites keep working untouched.
let spriteClock = 0;
export function setSpriteClock(t) { spriteClock = t; }
const frameCounts = new Map();
function animFrames(name) {
  let n = frameCounts.get(name);
  if (n === undefined) {
    n = 0;
    while (SPRITE_META?.[`${name}-f${n + 1}`]) n++;
    frameCounts.set(name, n);
  }
  return n;
}

// draw sprite `name` with the figure's feet (alpha-bbox bottom-center) at
// (x, y) and the figure scaled to height s. dir < 0 mirrors (sprites face
// right). mode 'width' scales the bbox WIDTH to s instead (lying poses).
export function drawSprite(ctx, name, x, y, s, dir = 1, mode = 'height') {
  const nFrames = animFrames(name);
  if (nFrames > 0) name = `${name}-f${(Math.floor(spriteClock * 7) % nFrames) + 1}`;
  const m = SPRITE_META?.[name];
  if (!m) return false;
  const img = spriteImg(name);
  if (!img.complete || !img.naturalWidth) return false;
  const ar = img.naturalWidth / img.naturalHeight;
  let dh;
  if (mode === 'width') {
    const dw0 = s / m.bw;
    dh = dw0 / ar;
  } else {
    dh = s / m.bh;
  }
  const dw = dh * ar;
  const fx = (m.bx + m.bw / 2) * dw;
  const fy = (m.by + m.bh) * dh;
  ctx.save();
  ctx.translate(x, y);
  if (dir < 0) ctx.scale(-1, 1);
  ctx.drawImage(img, -fx, -fy, dw, dh);
  ctx.restore();
  return true;
}

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
export function drawSFXText(ctx, text, x, y, size, rot = 0, fill = PAPER, outline = INK) {
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
    ctx.strokeStyle = outline;
    ctx.lineWidth = size * 0.18;
    ctx.strokeText(text[i], 0, 0);
    ctx.fillStyle = fill;
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

// Bubbles never cover the panel caption: game.js sets this to the caption's
// bottom edge each frame and every bubble drawn below shifts down past it.
let bubbleMinTop = 0;
export function setBubbleMinTop(v) { bubbleMinTop = v; }

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
  let by = y - bh / 2;
  if (bubbleMinTop && by < bubbleMinTop) {
    y += bubbleMinTop - by;
    by = bubbleMinTop;
  }
  // dodge earlier bubbles in the same panel (they may have shifted too)
  for (const av of opts.avoid || []) {
    if (av && bx < av.x + av.w && bx + bw > av.x && by < av.y + av.h && by + bh > av.y) {
      const shift = av.y + av.h + 8 - by;
      y += shift;
      by += shift;
    }
  }

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

export function caption(ctx, text, w, y, fs = 14, measureOnly = false) {
  ctx.save();
  ctx.font = `700 ${fs}px -apple-system, "Segoe UI", sans-serif`;
  const pad = fs * 0.8;
  // keep the box clear of the verb icon in the top-right corner
  const lines = wrapText(ctx, text, Math.min(w * 0.8, w - 100));
  if (measureOnly) {
    ctx.restore();
    return lines.length * fs * 1.35 + pad;
  }
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
  if (drawSprite(ctx, 'hand-eraser', w * 0.5, drop * h * 0.62, h * 0.52, 1)) return;
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
// A torn manga page riding the ink sea. (cx, cy) is the deck's top-center,
// rw the deck width; bob/tilt animation is applied by the caller via t.
export function drawRaft(ctx, cx, cy, rw, t = 0) {
  // painted prop first: prop-raft.webp scaled to the deck width
  if (drawSprite(ctx, 'prop-raft', cx, cy + rw * 0.14, rw * 1.08, 1, 'width')) return;
  const dh = rw * 0.09; // deck depth (perspective)
  const th = rw * 0.05; // paper thickness
  // jagged torn outline offsets (fixed pattern so it doesn't shimmer)
  const jag = [0, 0.4, -0.3, 0.55, -0.15, 0.35, -0.45, 0.2, -0.25, 0.5];
  const j = (i, amp) => jag[((i % jag.length) + jag.length) % jag.length] * amp;
  ctx.save();
  ctx.translate(cx, cy);

  // shadow on the water
  ctx.fillStyle = 'rgba(8, 12, 30, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, dh + th * 1.4, rw * 0.55, th * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // torn deck silhouette — front edge dips, all edges jagged
  const deck = new Path2D();
  const steps = 8;
  deck.moveTo(-rw / 2, 0);
  for (let i = 1; i <= steps; i++) { // back edge (top)
    deck.lineTo(-rw / 2 + (rw * i) / steps, j(i, rw * 0.018));
  }
  deck.lineTo(rw / 2 - rw * 0.06 + j(1, rw * 0.02), dh); // right torn corner
  for (let i = steps - 1; i >= 0; i--) { // front edge
    deck.lineTo(-rw / 2 + rw * 0.05 + (rw * 0.9 * i) / steps, dh + j(i + 3, rw * 0.02));
  }
  deck.closePath();

  // paper side (thickness) under the front edge
  ctx.fillStyle = '#d9d2c0';
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, rw * 0.012);
  ctx.save();
  ctx.translate(0, th);
  ctx.fill(deck);
  ctx.stroke(deck);
  ctx.restore();

  // deck top
  const grad = ctx.createLinearGradient(-rw / 2, 0, rw / 2, dh);
  grad.addColorStop(0, '#f9f6ee');
  grad.addColorStop(1, '#e8e1cf');
  ctx.fillStyle = grad;
  ctx.fill(deck);
  ctx.stroke(deck);

  // relics of the page it was torn from: a broken panel border...
  ctx.save();
  ctx.clip(deck);
  ctx.strokeStyle = INK;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = Math.max(2.5, rw * 0.016);
  ctx.beginPath();
  ctx.moveTo(-rw * 0.34, dh * 0.18);
  ctx.lineTo(rw * 0.05, dh * 0.05);
  ctx.moveTo(rw * 0.16, dh * 0.1);
  ctx.lineTo(rw * 0.4, dh * 0.3);
  ctx.stroke();
  // ...a patch of halftone tone...
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = INK;
  for (let gx = 0; gx < 6; gx++) {
    for (let gy = 0; gy < 3; gy++) {
      ctx.beginPath();
      ctx.arc(-rw * 0.42 + gx * rw * 0.045, dh * 0.35 + gy * rw * 0.04, rw * 0.008, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // ...and a scrap of speech-bubble edge
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, rw * 0.01);
  ctx.beginPath();
  ctx.arc(rw * 0.3, dh * 0.85, rw * 0.14, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.restore();

  // foam at the waterline — bright rim so the hull reads against dark water
  ctx.strokeStyle = 'rgba(247, 244, 236, 0.85)';
  ctx.lineWidth = Math.max(2, rw * 0.014);
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const fx = -rw * 0.55 + (rw * 1.1 * i) / 10;
    const fy = dh + th * 1.15 + Math.sin(t * 3 + i * 1.7) * th * 0.35;
    if (i === 0) ctx.moveTo(fx, fy); else ctx.lineTo(fx, fy);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(247, 244, 236, 0.7)';
  for (let i = 0; i < 5; i++) {
    const fx = -rw * 0.5 + rw * 0.25 * i + Math.sin(t * 2 + i * 2.1) * rw * 0.02;
    ctx.beginPath();
    ctx.arc(fx, dh + th * (1.2 + (i % 2) * 0.5), rw * (0.014 + (i % 3) * 0.006), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSmudge(ctx, x, y, r, t, hpFrac = 1) {
  // AI sprite with a living wobble; vector scribble as fallback
  const name = hpFrac < 0.55 ? 'smudge-hurt' : 'smudge-idle';
  ctx.save();
  ctx.translate(x, y + r * 0.85);
  ctx.rotate(Math.sin(t * 5) * 0.05);
  ctx.scale(1 + Math.sin(t * 6) * 0.03, 1 - Math.sin(t * 6) * 0.03);
  const ok = drawSprite(ctx, name, 0, 0, r * 1.9, 1);
  ctx.restore();
  if (ok) return;
  ctx.save();
  ctx.translate(x, y);
  const wob = Math.sin(t * 6) * r * 0.06;
  // scribbly graphite-violet body
  ctx.fillStyle = 'rgba(84,74,99,0.8)';
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
  ctx.strokeStyle = 'rgba(38,32,50,0.85)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    const yy = -r * 0.5 + (i / 6) * r + wob;
    ctx.moveTo(-r * 0.6, yy);
    ctx.bezierCurveTo(-r * 0.2, yy + 8, r * 0.2, yy - 8, r * 0.6, yy + 4);
    ctx.stroke();
  }
  // angry eyes
  ctx.fillStyle = '#ffe9a8';
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
