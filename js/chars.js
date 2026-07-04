// Anime-style character rendering. Skeleton poses + expressive anime heads
// (big irises with highlights, emotion-driven brows/mouths, spiky hair masses).
// All procedural — clean thick-line ink over paper, cel-ish tone accents.
import { INK, PAPER, fillTone } from './art.js';

/* ============================ heads ============================ */
// r = head radius. dir: -1/0/1 facing. emotion: neutral|shock|determined|sad|smile|sleep
// style: 'kai' (spiky) | 'sumi' (flowing ink) | 'rejected' (half-unfinished)
export function animeHead(ctx, cx, cy, r, o = {}) {
  const { dir = 0, emotion = 'neutral', style = 'kai' } = o;
  // o.restored (rejected style): draw his line complete — skip unfinished-half FX
  const d = dir * 0.22 * r; // feature shift for 3/4 view
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // skull with soft chin point
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.92, cy - r * 0.1);
  ctx.bezierCurveTo(cx - r * 0.98, cy - r * 1.05, cx + r * 0.98, cy - r * 1.05, cx + r * 0.92, cy - r * 0.1);
  ctx.bezierCurveTo(cx + r * 0.86, cy + r * 0.55, cx + r * 0.3, cy + r * 0.98, cx + d * 0.4, cy + r * 1.02);
  ctx.bezierCurveTo(cx - r * 0.3 + d * 0.3, cy + r * 0.98, cx - r * 0.86, cy + r * 0.55, cx - r * 0.92, cy - r * 0.1);
  ctx.closePath();
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.stroke();

  // hair
  ctx.fillStyle = INK;
  if (style === 'kai') {
    // solid dome cap down to the brow — no gaps, no self-intersections
    ctx.beginPath();
    ctx.arc(cx + d * 0.3, cy - r * 0.05, r * 1.03, Math.PI * 1.0, Math.PI * 2.0);
    const fringe = [
      [0.66, -0.2], [0.48, -0.5], [0.24, -0.16], [0.02, -0.52],
      [-0.2, -0.16], [-0.44, -0.5], [-0.68, -0.2],
    ];
    for (const [fx2, fy2] of fringe) ctx.lineTo(cx + fx2 * r + d * 0.5, cy + fy2 * r);
    ctx.closePath();
    ctx.fill();
    // spikes rooted well inside the dome — wide bases, no floating tips
    const spikes = [
      [-0.7, -0.35, -1.25, -0.85], [-0.42, -0.6, -0.7, -1.45], [-0.05, -0.7, -0.08, -1.6],
      [0.32, -0.62, 0.5, -1.45], [0.62, -0.4, 1.1, -0.95],
    ];
    for (const [bx, by, tx, ty] of spikes) {
      ctx.beginPath();
      ctx.moveTo(cx + (bx - 0.26) * r + d, cy + (by + 0.22) * r);
      ctx.lineTo(cx + tx * r + d, cy + ty * r);
      ctx.lineTo(cx + (bx + 0.28) * r + d, cy + (by + 0.02) * r);
      ctx.closePath();
      ctx.fill();
    }
  } else if (style === 'sumi') {
    // long flowing ink hair with drip ends
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.95, cy - r * 0.15);
    ctx.bezierCurveTo(cx - r * 1.05, cy - r * 1.15, cx + r * 1.05, cy - r * 1.15, cx + r * 0.95, cy - r * 0.15);
    ctx.bezierCurveTo(cx + r * 1.35, cy + r * 0.9, cx + r * 1.1, cy + r * 2.0, cx + r * 0.85, cy + r * 2.4);
    ctx.quadraticCurveTo(cx + r * 0.7, cy + r * 1.6, cx + r * 0.6, cy + r * 1.0);
    ctx.quadraticCurveTo(cx + r * 0.5, cy + r * 0.3, cx + r * 0.4 + d, cy - r * 0.25);
    ctx.lineTo(cx - r * 0.05 + d, cy - r * 0.05);
    ctx.lineTo(cx - r * 0.4 + d, cy - r * 0.3);
    ctx.quadraticCurveTo(cx - r * 0.55, cy + r * 0.4, cx - r * 0.7, cy + r * 1.1);
    ctx.quadraticCurveTo(cx - r * 0.85, cy + r * 1.9, cx - r * 1.05, cy + r * 2.3);
    ctx.bezierCurveTo(cx - r * 1.2, cy + r * 1.4, cx - r * 1.3, cy + r * 0.5, cx - r * 0.95, cy - r * 0.15);
    ctx.closePath();
    ctx.fill();
    // ink drips falling from hair tips
    for (const [hx, hy] of [[-1.0, 2.35], [0.88, 2.45]]) {
      ctx.beginPath();
      ctx.ellipse(cx + r * hx, cy + r * hy + r * 0.3, r * 0.07, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.55, cy - r * 0.85);
    ctx.quadraticCurveTo(cx, cy - r * 1.02, cx + r * 0.5, cy - r * 0.88);
    ctx.stroke();
  } else if (style === 'rejected') {
    // scribbled, angry hair — half of the head is unfinished pencil
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.95, cy - r * 0.1);
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const rr = r * (1.05 + (i % 2) * 0.45);
      ctx.lineTo(cx + Math.cos(a) * rr, cy - r * 0.15 + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    if (!o.restored) {
      // unfinished half: dashed pencil outline over the left side
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([r * 0.16, r * 0.12]);
      ctx.lineWidth = r * 0.06;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.12, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();
      ctx.restore();
      // erase the left-side skull stroke (fade to sketch)
      ctx.fillStyle = 'rgba(247,244,236,0.55)';
      ctx.fillRect(cx - r * 1.3, cy - r * 1.2, r * 0.75, r * 2.5);
    }
  }

  /* ---- face ---- */
  const eyeY = cy + r * 0.12;
  const eyeW = r * 0.4;
  const eyeH = emotion === 'shock' ? r * 0.42 : r * 0.34;
  const lw = Math.max(1.8, r * 0.07);
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;

  const eye = (ex, mirror) => {
    if (emotion === 'sleep' || (emotion === 'smile' && style !== 'rejected')) {
      // closed: happy arc up (smile) or flat arc down (sleep)
      ctx.lineWidth = lw * 1.3;
      ctx.beginPath();
      if (emotion === 'smile') ctx.arc(ex, eyeY + r * 0.06, eyeW * 0.5, Math.PI * 1.15, Math.PI * 1.85);
      else ctx.arc(ex, eyeY - r * 0.06, eyeW * 0.5, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      return;
    }
    // upper lid (thick) + lower lid (thin)
    ctx.lineWidth = lw * 1.5;
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.5, eyeY - eyeH * 0.25);
    ctx.quadraticCurveTo(ex, eyeY - eyeH * 0.75, ex + eyeW * 0.5, eyeY - eyeH * 0.3);
    ctx.stroke();
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.38, eyeY + eyeH * 0.35);
    ctx.quadraticCurveTo(ex, eyeY + eyeH * 0.5, ex + eyeW * 0.38, eyeY + eyeH * 0.32);
    ctx.stroke();
    // iris: big for neutral/sad/smile, pinpoint for shock, narrowed for determined
    const ir = emotion === 'shock' ? eyeW * 0.12 : eyeW * 0.3;
    ctx.beginPath();
    ctx.ellipse(ex + d * 0.3, eyeY - eyeH * 0.05, ir, ir * 1.35, 0, 0, Math.PI * 2);
    ctx.fill();
    if (emotion !== 'shock') {
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.arc(ex + d * 0.3 - ir * 0.35, eyeY - eyeH * 0.25, ir * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
    }
    // brow
    ctx.lineWidth = lw * 1.2;
    ctx.beginPath();
    const browY = eyeY - eyeH * 1.0;
    if (emotion === 'determined') {
      ctx.moveTo(ex - eyeW * 0.5, browY - r * 0.02 + mirror * 0);
      ctx.lineTo(ex + eyeW * 0.45, browY + mirror * r * 0.12);
    } else if (emotion === 'sad') {
      ctx.moveTo(ex - eyeW * 0.5, browY + mirror * r * 0.1);
      ctx.lineTo(ex + eyeW * 0.45, browY - mirror * r * 0.06);
    } else {
      ctx.moveTo(ex - eyeW * 0.45, browY);
      ctx.quadraticCurveTo(ex, browY - r * 0.07, ex + eyeW * 0.45, browY);
    }
    ctx.stroke();
  };
  eye(cx - r * 0.42 + d, -1);
  eye(cx + r * 0.42 + d, 1);

  // nose tick + mouth
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.moveTo(cx + d + r * 0.02, cy + r * 0.42);
  ctx.lineTo(cx + d - r * 0.05, cy + r * 0.5);
  ctx.stroke();
  ctx.beginPath();
  const mY = cy + r * 0.7;
  if (emotion === 'shock') {
    ctx.lineWidth = lw;
    ctx.ellipse(cx + d, mY, r * 0.14, r * 0.2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (emotion === 'smile') {
    ctx.lineWidth = lw;
    ctx.arc(cx + d, mY - r * 0.06, r * 0.2, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  } else if (emotion === 'sad') {
    ctx.lineWidth = lw;
    ctx.arc(cx + d, mY + r * 0.16, r * 0.16, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (emotion === 'determined') {
    ctx.lineWidth = lw * 1.1;
    ctx.moveTo(cx + d - r * 0.16, mY);
    ctx.lineTo(cx + d + r * 0.14, mY - r * 0.03);
    ctx.stroke();
  } else {
    ctx.lineWidth = lw;
    ctx.moveTo(cx + d - r * 0.12, mY);
    ctx.lineTo(cx + d + r * 0.1, mY);
    ctx.stroke();
  }
  ctx.restore();
}

/* ============================ bodies ============================ */
// Skeleton poses in unit space: anchor = feet (0,0), y negative = up, height 1.
// Each pose: { hip, chest, neck, head, kneeL, footL, kneeR, footR,
//              elbowL, handL, elbowR, handR }  ("L" = far side, drawn first)
const POSES = {
  stand: {
    hip: [0, -0.46], chest: [0, -0.62], neck: [0, -0.7], head: [0, -0.84],
    kneeL: [-0.05, -0.24], footL: [-0.08, 0], kneeR: [0.06, -0.24], footR: [0.09, 0],
    elbowL: [-0.1, -0.5], handL: [-0.12, -0.36], elbowR: [0.1, -0.5], handR: [0.13, -0.37],
  },
  walk: {
    hip: [0, -0.46], chest: [0.02, -0.62], neck: [0.03, -0.7], head: [0.04, -0.84],
    kneeL: [-0.12, -0.26], footL: [-0.2, -0.02], kneeR: [0.14, -0.24], footR: [0.2, 0],
    elbowL: [0.1, -0.5], handL: [0.18, -0.42], elbowR: [-0.09, -0.48], handR: [-0.16, -0.4],
  },
  run: {
    hip: [0, -0.44], chest: [0.08, -0.6], neck: [0.11, -0.68], head: [0.13, -0.82],
    kneeL: [-0.18, -0.3], footL: [-0.3, -0.14], kneeR: [0.22, -0.26], footR: [0.26, 0],
    elbowL: [0.2, -0.52], handL: [0.3, -0.62], elbowR: [-0.12, -0.46], handR: [-0.22, -0.34],
  },
  lying: {
    hip: [0.02, -0.09], chest: [-0.14, -0.1], neck: [-0.22, -0.1], head: [-0.34, -0.12],
    kneeL: [0.16, -0.06], footL: [0.3, -0.1], kneeR: [0.15, -0.11], footR: [0.29, -0.03],
    elbowL: [-0.08, -0.05], handL: [0.02, -0.02], elbowR: [-0.16, -0.04], handR: [-0.06, -0.02],
  },
  sit: {
    hip: [0, -0.16], chest: [0, -0.38], neck: [0, -0.46], head: [0, -0.6],
    kneeL: [0.16, -0.16], footL: [0.24, 0], kneeR: [0.18, -0.2], footR: [0.3, -0.02],
    elbowL: [-0.12, -0.26], handL: [-0.16, -0.1], elbowR: [0.12, -0.28], handR: [0.18, -0.18],
  },
  crouch: {
    hip: [-0.04, -0.26], chest: [0.02, -0.44], neck: [0.05, -0.52], head: [0.07, -0.66],
    kneeL: [-0.14, -0.16], footL: [-0.1, 0], kneeR: [0.16, -0.16], footR: [0.14, 0],
    elbowL: [-0.1, -0.34], handL: [-0.06, -0.2], elbowR: [0.14, -0.36], handR: [0.18, -0.24],
  },
  touch: { // reaching forward (dir side)
    hip: [0, -0.46], chest: [0.02, -0.62], neck: [0.03, -0.7], head: [0.05, -0.84],
    kneeL: [-0.06, -0.24], footL: [-0.1, 0], kneeR: [0.07, -0.24], footR: [0.1, 0],
    elbowL: [-0.1, -0.5], handL: [-0.13, -0.38], elbowR: [0.2, -0.63], handR: [0.42, -0.6],
  },
  dodge: { // lunging toward dir
    hip: [0.1, -0.4], chest: [0.22, -0.52], neck: [0.27, -0.58], head: [0.31, -0.7],
    kneeL: [-0.06, -0.22], footL: [-0.14, 0], kneeR: [0.28, -0.24], footR: [0.38, 0],
    elbowL: [0.1, -0.4], handL: [0.02, -0.28], elbowR: [0.36, -0.6], handR: [0.46, -0.66],
  },
  fight: { // weapon arm raised high
    hip: [0, -0.45], chest: [0.03, -0.62], neck: [0.05, -0.7], head: [0.06, -0.84],
    kneeL: [-0.1, -0.24], footL: [-0.14, 0], kneeR: [0.12, -0.24], footR: [0.16, 0],
    elbowL: [-0.12, -0.5], handL: [-0.18, -0.38], elbowR: [0.14, -0.78], handR: [0.22, -0.94],
  },
  'hold-club': { // weapon held at side
    hip: [0, -0.46], chest: [0, -0.62], neck: [0, -0.7], head: [0.01, -0.84],
    kneeL: [-0.06, -0.24], footL: [-0.09, 0], kneeR: [0.07, -0.24], footR: [0.1, 0],
    elbowL: [-0.1, -0.5], handL: [-0.12, -0.36], elbowR: [0.12, -0.52], handR: [0.2, -0.46],
  },
  point: { // arm extended level toward dir
    hip: [0, -0.46], chest: [0.02, -0.62], neck: [0.03, -0.7], head: [0.04, -0.84],
    kneeL: [-0.06, -0.24], footL: [-0.09, 0], kneeR: [0.07, -0.24], footR: [0.1, 0],
    elbowL: [-0.1, -0.5], handL: [-0.13, -0.36], elbowR: [0.15, -0.6], handR: [0.33, -0.6],
  },
  kneel: {
    hip: [-0.02, -0.22], chest: [0, -0.42], neck: [0.01, -0.5], head: [0.02, -0.64],
    kneeL: [-0.1, 0], footL: [-0.24, 0], kneeR: [0.12, -0.2], footR: [0.16, 0],
    elbowL: [-0.08, -0.3], handL: [-0.04, -0.16], elbowR: [0.1, -0.32], handR: [0.14, -0.18],
  },
  brace: { // shielding face, knocked back
    hip: [-0.04, -0.44], chest: [-0.1, -0.58], neck: [-0.12, -0.66], head: [-0.14, -0.8],
    kneeL: [-0.02, -0.22], footL: [0.04, 0], kneeR: [-0.16, -0.24], footR: [-0.22, 0],
    elbowL: [-0.02, -0.6], handL: [0.02, -0.74], elbowR: [0.04, -0.56], handR: [0.1, -0.68],
  },
  float: { // Sumi hovers, legs trailing into a drip
    hip: [0, -0.42], chest: [0, -0.6], neck: [0, -0.68], head: [0, -0.82],
    kneeL: [-0.05, -0.22], footL: [-0.12, -0.06], kneeR: [0.06, -0.2], footR: [0.02, -0.02],
    elbowL: [-0.11, -0.48], handL: [-0.14, -0.34], elbowR: [0.11, -0.48], handR: [0.14, -0.34],
  },
};

function drawWeapon(ctx, x, y, s, weapon, dir) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = PAPER;
  ctx.lineJoin = 'round';
  if (weapon === 'club') {
    // the letter-C club from ch1
    ctx.font = `900 ${s * 0.32}px -apple-system, "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = s * 0.055;
    ctx.strokeText('C', x + dir * s * 0.06, y - s * 0.08);
    ctx.fillText('C', x + dir * s * 0.06, y - s * 0.08);
  } else if (weapon === 'brush') {
    // giant calligraphy brush
    ctx.lineWidth = s * 0.035;
    ctx.beginPath();
    ctx.moveTo(x - dir * s * 0.06, y + s * 0.12);
    ctx.lineTo(x + dir * s * 0.1, y - s * 0.34);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(x + dir * s * 0.1, y - s * 0.34);
    ctx.quadraticCurveTo(x + dir * s * 0.2, y - s * 0.46, x + dir * s * 0.13, y - s * 0.56);
    ctx.quadraticCurveTo(x + dir * s * 0.05, y - s * 0.46, x + dir * s * 0.1, y - s * 0.34);
    ctx.fill();
  } else if (weapon === 'nib') {
    // pen-nib blade
    ctx.fillStyle = PAPER;
    ctx.lineWidth = s * 0.03;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.04);
    ctx.lineTo(x + dir * s * 0.08, y - s * 0.2);
    ctx.lineTo(x + dir * s * 0.16, y - s * 0.34);
    ctx.lineTo(x + dir * s * 0.16, y - s * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + dir * s * 0.11, y - s * 0.2, s * 0.02, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
  }
  ctx.restore();
}

// Generic anime body: tapered ink trousers + shoes, paper jacket with real
// sleeves and hands, arms anchored at the shoulders. No more stick limbs.
function drawBody(ctx, x, y, s, pose, o) {
  const { dir = 1, style = 'kai', weapon = null, emotion = 'neutral', restored = false } = o;
  const P = POSES[pose] || POSES.stand;
  const m = dir === 0 ? 1 : Math.sign(dir); // mirror
  const pt = (k) => [x + P[k][0] * s * m, y + P[k][1] * s];
  const lw = Math.max(2, s * 0.035);

  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // tapered limb quad (caps filled separately — mixed winding punches holes)
  const quadPath = (ax, ay, bx, by, w1, w2) => {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    ctx.beginPath();
    ctx.moveTo(ax + px * w1, ay + py * w1);
    ctx.lineTo(bx + px * w2, by + py * w2);
    ctx.lineTo(bx - px * w2, by - py * w2);
    ctx.lineTo(ax - px * w1, ay - py * w1);
    ctx.closePath();
  };

  const dot = (px2, py2, r2, fill) => {
    ctx.beginPath();
    ctx.arc(px2, py2, r2, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  };

  const inkLimb = (a, b, w1, w2) => {
    const [ax, ay] = pt(a);
    const [bx, by] = pt(b);
    quadPath(ax, ay, bx, by, w1 * s, w2 * s);
    ctx.fillStyle = INK;
    ctx.fill();
    dot(ax, ay, w1 * s, INK);
    dot(bx, by, w2 * s, INK);
  };

  const sleeve = (ax, ay, bx, by, w1, w2) => {
    quadPath(ax, ay, bx, by, w1 * s, w2 * s);
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();
  };

  const shoe = (kneeK, footK) => {
    const [kx, ky] = pt(kneeK);
    const [fx, fy] = pt(footK);
    const dx = fx - kx;
    const dy = fy - ky;
    const len = Math.hypot(dx, dy) || 1;
    ctx.save();
    ctx.translate(fx + (dx / len) * s * 0.015, fy + (dy / len) * s * 0.015);
    // shoe points the way the character faces
    ctx.rotate(Math.atan2(dy, dx) * 0.15);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(m * s * 0.02, 0, s * 0.055, s * 0.032, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const [hx, hy] = pt('hip');
  const [cx2, cy2] = pt('chest');
  const [nx, ny] = pt('neck');
  const sw = s * 0.15; // shoulder half-width

  // shoulder anchor on whichever side the elbow reaches
  const shoulderFor = (elbowK) => {
    const [ex] = pt(elbowK);
    const side = ex >= cx2 ? 1 : -1;
    return [cx2 + side * sw * 0.75, cy2 + s * 0.015];
  };

  const arm = (elbowK, handK) => {
    const [sx, sy] = shoulderFor(elbowK);
    const [ex, ey] = pt(elbowK);
    const [hx2, hy2] = pt(handK);
    sleeve(sx, sy, ex, ey, 0.048, 0.038);
    sleeve(ex, ey, hx2, hy2, 0.038, 0.028);
    // hand
    ctx.fillStyle = PAPER;
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.arc(hx2, hy2, s * 0.032, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  // ---- draw order: far arm, legs (ink trousers), torso, near arm, head ----
  arm('elbowL', 'handL');

  inkLimb('hip', 'kneeL', 0.062, 0.045);
  inkLimb('kneeL', 'footL', 0.045, 0.034);
  shoe('kneeL', 'footL');
  inkLimb('hip', 'kneeR', 0.065, 0.048);
  inkLimb('kneeR', 'footR', 0.048, 0.036);
  shoe('kneeR', 'footR');

  // torso: jacket (kai/rejected) or flowing ink dress (sumi)
  ctx.lineWidth = lw;
  if (style === 'sumi') {
    ctx.beginPath();
    ctx.moveTo(nx - sw * 0.8, ny);
    ctx.lineTo(nx + sw * 0.8, ny);
    ctx.quadraticCurveTo(cx2 + sw * 1.3, (cy2 + hy) / 2, hx + sw * 1.7, hy + s * 0.3);
    ctx.quadraticCurveTo(hx + sw * 0.6, hy + s * 0.34, hx, hy + s * 0.3);
    ctx.quadraticCurveTo(hx - sw * 0.6, hy + s * 0.34, hx - sw * 1.7, hy + s * 0.3);
    ctx.quadraticCurveTo(cx2 - sw * 1.3, (cy2 + hy) / 2, nx - sw * 0.8, ny);
    ctx.closePath();
    ctx.fillStyle = INK;
    ctx.fill();
    // paper streaks in the dress
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = lw * 0.5;
    ctx.beginPath();
    ctx.moveTo(hx - sw * 0.7, hy - s * 0.05);
    ctx.quadraticCurveTo(hx - sw * 0.3, hy + s * 0.15, hx - sw * 0.8, hy + s * 0.26);
    ctx.moveTo(hx + sw * 0.5, hy - s * 0.02);
    ctx.quadraticCurveTo(hx + sw * 0.9, hy + s * 0.16, hx + sw * 0.6, hy + s * 0.27);
    ctx.stroke();
    ctx.strokeStyle = INK;
  } else {
    // jacket with a proper hem below the hip — hides the leg roots
    const hem = hy + s * 0.07;
    ctx.beginPath();
    ctx.moveTo(nx - sw, ny + s * 0.01);
    ctx.lineTo(cx2 - sw * 1.2, cy2);
    ctx.lineTo(hx - sw * 0.92, hem);
    ctx.lineTo(hx + sw * 0.92, hem);
    ctx.lineTo(cx2 + sw * 1.2, cy2);
    ctx.lineTo(nx + sw, ny + s * 0.01);
    ctx.closePath();
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.stroke();
    // collar + zip + hem line
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(nx - sw * 0.7, ny + s * 0.015);
    ctx.lineTo(nx, ny + s * 0.055);
    ctx.lineTo(nx + sw * 0.7, ny + s * 0.015);
    ctx.moveTo(nx, ny + s * 0.055);
    ctx.lineTo(hx, hem);
    ctx.moveTo(hx - sw * 0.85, hem - s * 0.028);
    ctx.lineTo(hx + sw * 0.85, hem - s * 0.028);
    ctx.stroke();
    // cel-shade tone on the off side
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(nx - sw, ny + s * 0.01);
    ctx.lineTo(cx2 - sw * 1.2, cy2);
    ctx.lineTo(hx - sw * 0.92, hem);
    ctx.lineTo(hx - sw * 0.25, hem);
    ctx.lineTo(nx - sw * 0.3, ny + s * 0.02);
    ctx.closePath();
    ctx.clip();
    fillTone(ctx, hx - sw * 2, ny - s * 0.02, sw * 2, hem - ny + s * 0.1, 'light', 0.5);
    ctx.restore();
    if (style === 'rejected' && !restored) {
      // unfinished: half the torso fades back into pencil
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = PAPER;
      ctx.fillRect(hx - sw * 2, ny, sw, hem - ny);
      ctx.setLineDash([s * 0.05, s * 0.04]);
      ctx.lineWidth = lw * 0.6;
      ctx.beginPath();
      ctx.moveTo(nx - sw, ny + s * 0.01);
      ctx.lineTo(cx2 - sw * 1.2, cy2);
      ctx.lineTo(hx - sw * 0.92, hem);
      ctx.stroke();
      ctx.restore();
    }
  }

  // near arm in front of the jacket
  ctx.strokeStyle = INK;
  arm('elbowR', 'handR');

  // head (a touch higher — gives the neck room, arm no longer kisses the chin)
  const [hdx, hdy] = pt('head');
  const hr = s * 0.15;
  animeHead(ctx, hdx, hdy - s * 0.025, hr, { dir: pose === 'lying' ? 0 : m, emotion, style, restored });

  // weapon in the near hand
  if (weapon) {
    const [wx, wy] = pt('handR');
    drawWeapon(ctx, wx, wy, s, weapon, m);
  }
  ctx.restore();
}

/* ============================ public API ============================ */
// Kai — same signature the ch1 scenes already use.
export function drawKai(ctx, x, y, s, pose = 'stand', o = {}) {
  const emotion = o.emotion || (o.awake === false ? 'sleep' : pose === 'dodge' || pose === 'brace' ? 'shock' : pose === 'fight' ? 'determined' : 'neutral');
  const weapon = o.weapon !== undefined ? o.weapon : (pose === 'fight' || pose === 'hold-club' ? 'club' : null);
  drawBody(ctx, x, y, s, pose, { dir: o.dir ?? 1, style: 'kai', weapon, emotion });
}

export function drawSumi(ctx, x, y, s, pose = 'float', o = {}) {
  // gentle hover bob
  const bob = o.t !== undefined ? Math.sin(o.t * 2) * s * 0.02 : 0;
  drawBody(ctx, x, y + bob, s, pose, { dir: o.dir ?? -1, style: 'sumi', emotion: o.emotion || 'smile' });
}

export function drawRejected(ctx, x, y, s, pose = 'stand', o = {}) {
  drawBody(ctx, x, y, s, pose, { dir: o.dir ?? -1, style: 'rejected', weapon: o.weapon || null, emotion: o.emotion || 'determined', restored: o.restored || false });
}
