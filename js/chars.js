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
    // spiky mass sweeping up and back
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.95, cy - r * 0.05);
    const spikes = [
      [-1.15, -0.75, -0.75, -1.45], [-0.55, -0.9, -0.2, -1.6],
      [0.05, -0.95, 0.35, -1.55], [0.6, -0.85, 0.95, -1.3],
      [1.0, -0.6, 1.25, -0.85],
    ];
    let px = cx - r * 0.95;
    let py = cy - r * 0.05;
    for (const [bx, by, tx, ty] of spikes) {
      // out to spike tip, back to base curve
      ctx.quadraticCurveTo(px, py, cx + r * tx + d, cy + r * ty);
      ctx.quadraticCurveTo(cx + r * (tx + bx) / 2 + d, cy + r * (ty + by) / 2, cx + r * bx + d, cy + r * by);
      px = cx + r * bx + d;
      py = cy + r * by;
    }
    ctx.quadraticCurveTo(cx + r * 1.0 + d, cy - r * 0.2, cx + r * 0.92, cy - r * 0.1);
    // fringe over forehead
    ctx.lineTo(cx + r * 0.55 + d, cy - r * 0.15);
    ctx.lineTo(cx + r * 0.3 + d, cy - r * 0.5);
    ctx.lineTo(cx + r * 0.05 + d, cy - r * 0.12);
    ctx.lineTo(cx - r * 0.25 + d, cy - r * 0.55);
    ctx.lineTo(cx - r * 0.5 + d, cy - r * 0.1);
    ctx.lineTo(cx - r * 0.78, cy - r * 0.3);
    ctx.closePath();
    ctx.fill();
    // highlight streak
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = r * 0.09;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.45 + d, cy - r * 0.82);
    ctx.quadraticCurveTo(cx + d, cy - r * 1.0, cx + r * 0.42 + d, cy - r * 0.88);
    ctx.stroke();
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
    elbowL: [-0.1, -0.5], handL: [-0.13, -0.38], elbowR: [0.16, -0.64], handR: [0.32, -0.62],
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

// Generic anime body. style tweaks the outfit; sumi gets an ink dress.
function drawBody(ctx, x, y, s, pose, o) {
  const { dir = 1, style = 'kai', weapon = null, emotion = 'neutral', restored = false } = o;
  const P = POSES[pose] || POSES.stand;
  const m = dir === 0 ? 1 : Math.sign(dir); // mirror
  const pt = (k) => [x + P[k][0] * s * m, y + P[k][1] * s];
  const lw = Math.max(2.2, s * 0.045);

  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const limb = (a, b, c, w) => {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(...pt(a));
    ctx.lineTo(...pt(b));
    ctx.lineTo(...pt(c));
    ctx.stroke();
  };

  // far limbs
  limb('hip', 'kneeL', 'footL', lw * 1.25);
  limb('chest', 'elbowL', 'handL', lw);

  // torso: jacket (kai/rejected) or flowing dress (sumi)
  const [hx, hy] = pt('hip');
  const [cx2, cy2] = pt('chest');
  const [nx, ny] = pt('neck');
  const sw = s * 0.13; // shoulder half-width
  ctx.fillStyle = PAPER;
  ctx.lineWidth = lw;
  ctx.beginPath();
  if (style === 'sumi') {
    // dress flares and melts into drips
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
    ctx.moveTo(nx - sw, ny + s * 0.01);
    ctx.lineTo(cx2 - sw * 1.15, cy2);
    ctx.lineTo(hx - sw * 0.85, hy);
    ctx.lineTo(hx + sw * 0.85, hy);
    ctx.lineTo(cx2 + sw * 1.15, cy2);
    ctx.lineTo(nx + sw, ny + s * 0.01);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // jacket collar + zip
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(nx - sw * 0.7, ny + s * 0.015);
    ctx.lineTo(nx, ny + s * 0.06);
    ctx.lineTo(nx + sw * 0.7, ny + s * 0.015);
    ctx.moveTo(nx, ny + s * 0.06);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    // cel-shade tone on the off side
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(nx - sw, ny + s * 0.01);
    ctx.lineTo(cx2 - sw * 1.15, cy2);
    ctx.lineTo(hx - sw * 0.85, hy);
    ctx.lineTo(hx - sw * 0.2, hy);
    ctx.lineTo(nx - sw * 0.3, ny + s * 0.02);
    ctx.closePath();
    ctx.clip();
    fillTone(ctx, hx - sw * 2, ny - s * 0.02, sw * 2, hy - ny + s * 0.1, 'light', 0.5);
    ctx.restore();
    if (style === 'rejected' && !o.restored) {
      // unfinished: dashes over half the torso
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = PAPER;
      ctx.fillRect(hx - sw * 2, ny, sw, hy - ny);
      ctx.setLineDash([s * 0.05, s * 0.04]);
      ctx.lineWidth = lw * 0.6;
      ctx.beginPath();
      ctx.moveTo(nx - sw, ny + s * 0.01);
      ctx.lineTo(cx2 - sw * 1.15, cy2);
      ctx.lineTo(hx - sw * 0.85, hy);
      ctx.stroke();
      ctx.restore();
    }
  }

  // near limbs
  ctx.strokeStyle = INK;
  limb('hip', 'kneeR', 'footR', lw * 1.25);
  limb('chest', 'elbowR', 'handR', lw);

  // head
  const [hdx, hdy] = pt('head');
  const hr = s * 0.145;
  animeHead(ctx, hdx, hdy, hr, { dir: pose === 'lying' ? 0 : m, emotion, style, restored });

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
