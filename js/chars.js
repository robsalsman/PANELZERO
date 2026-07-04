// Full-color anime character rendering. Skeleton poses drive bodies with real
// costumes (jacket + tee, ink dress, pencil-sketch rags); heads get skin tones,
// two-tone hair with sheen, and gradient irises with highlights. All vector —
// crisp at any resolution, no image assets.
import { INK, PAPER, C, drawSprite } from './art.js';

/* per-character costume + face palette */
const STYLES = {
  kai: {
    hair: C.kaiHair, sheen: C.kaiSheen, skin: C.kaiSkin, skinShade: C.kaiSkinShade,
    eye: C.kaiEye, top: C.kaiJacket, topShade: C.kaiJacketShade, under: C.kaiTee,
    pants: C.kaiPants, shoe: C.kaiShoe,
  },
  sumi: {
    hair: C.sumiHair, sheen: C.sumiSheen, skin: C.sumiSkin, skinShade: '#e9d6c9',
    eye: C.sumiEye, top: C.sumiDress, topShade: '#1a1731', under: C.sumiGlow,
    pants: C.sumiDress, shoe: C.sumiDress, glow: C.sumiGlow,
  },
  rejected: {
    hair: C.rejHair, sheen: '#7d766c', skin: C.rejSkin, skinShade: '#d3c8b4',
    eye: C.rejEye, top: C.rejCloth, topShade: '#7a7060', under: '#c9c0af',
    pants: '#6f675c', shoe: '#565049',
  },
};

/* ============================ heads ============================ */
// r = head radius. dir: -1/0/1 facing. emotion: neutral|shock|determined|sad|smile|sleep
export function animeHead(ctx, cx, cy, r, o = {}) {
  const { dir = 0, emotion = 'neutral', style = 'kai' } = o;
  const pal = STYLES[style] || STYLES.kai;
  const d = dir * 0.22 * r; // feature shift for 3/4 view
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // skull with soft chin point — skin fill
  const skull = () => {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.92, cy - r * 0.1);
    ctx.bezierCurveTo(cx - r * 0.98, cy - r * 1.05, cx + r * 0.98, cy - r * 1.05, cx + r * 0.92, cy - r * 0.1);
    ctx.bezierCurveTo(cx + r * 0.86, cy + r * 0.55, cx + r * 0.3, cy + r * 0.98, cx + d * 0.4, cy + r * 1.02);
    ctx.bezierCurveTo(cx - r * 0.3 + d * 0.3, cy + r * 0.98, cx - r * 0.86, cy + r * 0.55, cx - r * 0.92, cy - r * 0.1);
    ctx.closePath();
  };
  skull();
  ctx.fillStyle = pal.skin;
  ctx.fill();
  // jaw shading
  ctx.save();
  skull();
  ctx.clip();
  ctx.fillStyle = pal.skinShade;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(cx - d * 0.6 - r * 0.35, cy + r * 0.55, r * 0.62, r * 0.5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  skull();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.stroke();

  /* ---- hair ---- */
  ctx.fillStyle = pal.hair;
  if (style === 'kai' || style === 'rejected') {
    // solid dome cap down to the brow
    ctx.beginPath();
    ctx.arc(cx + d * 0.3, cy - r * 0.05, r * 1.03, Math.PI * 1.0, Math.PI * 2.0);
    const fringe = [
      [0.66, -0.2], [0.48, -0.5], [0.24, -0.16], [0.02, -0.52],
      [-0.2, -0.16], [-0.44, -0.5], [-0.68, -0.2],
    ];
    for (const [fx2, fy2] of fringe) ctx.lineTo(cx + fx2 * r + d * 0.5, cy + fy2 * r);
    ctx.closePath();
    ctx.fill();
    // spikes rooted well inside the dome
    const spikes = style === 'rejected'
      ? [[-0.7, -0.3, -1.3, -0.7], [-0.3, -0.55, -0.5, -1.5], [0.1, -0.6, 0.25, -1.55], [0.55, -0.4, 1.05, -1.0]]
      : [[-0.7, -0.35, -1.25, -0.85], [-0.42, -0.6, -0.7, -1.45], [-0.05, -0.7, -0.08, -1.6],
         [0.32, -0.62, 0.5, -1.45], [0.62, -0.4, 1.1, -0.95]];
    for (const [bx, by, tx, ty] of spikes) {
      ctx.beginPath();
      ctx.moveTo(cx + (bx - 0.26) * r + d, cy + (by + 0.22) * r);
      ctx.lineTo(cx + tx * r + d, cy + ty * r);
      ctx.lineTo(cx + (bx + 0.28) * r + d, cy + (by + 0.02) * r);
      ctx.closePath();
      ctx.fill();
    }
    // hair sheen — a lighter crescent inside the dome
    ctx.fillStyle = pal.sheen;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(cx + d * 0.3, cy - r * 0.05, r * 0.88, Math.PI * 1.15, Math.PI * 1.6);
    ctx.arc(cx + d * 0.3, cy + r * 0.12, r * 1.02, Math.PI * 1.55, Math.PI * 1.2, true);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    if (style === 'rejected' && !o.restored) {
      // unfinished half fades back to pencil
      ctx.save();
      ctx.fillStyle = PAPER;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(cx - r * 1.35, cy - r * 1.7, r * 0.8, r * 2.9);
      ctx.strokeStyle = INK;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([r * 0.16, r * 0.12]);
      ctx.lineWidth = r * 0.06;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.12, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();
      ctx.restore();
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
    // glowing ink drips at the tips
    ctx.fillStyle = C.sumiGlow;
    for (const [hx, hy] of [[-1.0, 2.35], [0.88, 2.45]]) {
      ctx.beginPath();
      ctx.ellipse(cx + r * hx, cy + r * hy + r * 0.3, r * 0.07, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // sheen wave
    ctx.strokeStyle = pal.sheen;
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.55, cy - r * 0.8);
    ctx.quadraticCurveTo(cx, cy - r * 1.0, cx + r * 0.5, cy - r * 0.84);
    ctx.stroke();
    ctx.strokeStyle = pal.sheen;
    ctx.lineWidth = r * 0.09;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.82, cy + r * 0.6);
    ctx.quadraticCurveTo(cx - r * 0.92, cy + r * 1.3, cx - r * 1.02, cy + r * 1.9);
    ctx.stroke();
  }

  /* ---- face ---- */
  const eyeY = cy + r * 0.12;
  const eyeW = r * 0.42;
  const eyeH = emotion === 'shock' ? r * 0.44 : r * 0.36;
  const lw = Math.max(1.8, r * 0.07);
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;

  const eye = (ex, mirror) => {
    if (emotion === 'sleep' || (emotion === 'smile' && style !== 'rejected')) {
      ctx.lineWidth = lw * 1.3;
      ctx.strokeStyle = INK;
      ctx.beginPath();
      if (emotion === 'smile') ctx.arc(ex, eyeY + r * 0.06, eyeW * 0.5, Math.PI * 1.15, Math.PI * 1.85);
      else ctx.arc(ex, eyeY - r * 0.06, eyeW * 0.5, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      return;
    }
    // eye white
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeW * 0.5, eyeH * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    // iris: vertical gradient of the character's eye color
    const ir = emotion === 'shock' ? eyeW * 0.16 : eyeW * 0.34;
    const gx = ex + d * 0.3;
    const grad = ctx.createLinearGradient(gx, eyeY - ir * 1.4, gx, eyeY + ir * 1.4);
    grad.addColorStop(0, pal.eye);
    grad.addColorStop(1, INK);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(gx, eyeY, ir, ir * 1.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // pupil + twin highlights
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(gx, eyeY + ir * 0.15, ir * 0.42, ir * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(gx - ir * 0.35, eyeY - ir * 0.5, ir * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(gx + ir * 0.4, eyeY + ir * 0.5, ir * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // upper lash line (thick) + lower lid (thin)
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw * 1.6;
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.52, eyeY - eyeH * 0.28);
    ctx.quadraticCurveTo(ex, eyeY - eyeH * 0.8, ex + eyeW * 0.52, eyeY - eyeH * 0.32);
    ctx.stroke();
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.38, eyeY + eyeH * 0.42);
    ctx.quadraticCurveTo(ex, eyeY + eyeH * 0.56, ex + eyeW * 0.38, eyeY + eyeH * 0.4);
    ctx.stroke();
    // brow
    ctx.lineWidth = lw * 1.2;
    ctx.beginPath();
    const browY = eyeY - eyeH * 1.05;
    if (emotion === 'determined') {
      ctx.moveTo(ex - eyeW * 0.5, browY - r * 0.02);
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
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.moveTo(cx + d + r * 0.02, cy + r * 0.42);
  ctx.lineTo(cx + d - r * 0.05, cy + r * 0.5);
  ctx.stroke();
  ctx.beginPath();
  const mY = cy + r * 0.7;
  if (emotion === 'shock') {
    ctx.lineWidth = lw;
    ctx.fillStyle = '#3b2a2a';
    ctx.ellipse(cx + d, mY, r * 0.14, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
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

/* ============================ poses ============================ */
// anchor = feet (0,0), y negative = up, height 1
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

/* ============================ weapons ============================ */
function drawWeapon(ctx, x, y, s, weapon, dir) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  if (weapon === 'club') {
    // the letter-C club, gold-edged like a title drop
    ctx.font = `900 ${s * 0.32}px -apple-system, "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = s * 0.055;
    ctx.strokeText('C', x + dir * s * 0.06, y - s * 0.08);
    ctx.fillStyle = C.gold;
    ctx.fillText('C', x + dir * s * 0.06, y - s * 0.08);
  } else if (weapon === 'brush') {
    // calligraphy brush: wooden handle, ink-loaded tip
    ctx.strokeStyle = C.wood2;
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
    ctx.fillStyle = C.sumiGlow;
    ctx.beginPath();
    ctx.arc(x + dir * s * 0.12, y - s * 0.52, s * 0.02, 0, Math.PI * 2);
    ctx.fill();
  } else if (weapon === 'nib') {
    // pen-nib blade, steel
    ctx.fillStyle = '#cfd4dc';
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

/* ============================ bodies ============================ */
function drawBody(ctx, x, y, s, pose, o) {
  const { dir = 1, style = 'kai', weapon = null, emotion = 'neutral', restored = false } = o;
  const pal = STYLES[style] || STYLES.kai;
  const P = POSES[pose] || POSES.stand;
  const m = dir === 0 ? 1 : Math.sign(dir);
  const pt = (k) => [x + P[k][0] * s * m, y + P[k][1] * s];
  const lw = Math.max(2, s * 0.035);

  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

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

  const pantsLimb = (a, b, w1, w2) => {
    const [ax, ay] = pt(a);
    const [bx, by] = pt(b);
    quadPath(ax, ay, bx, by, w1 * s, w2 * s);
    ctx.fillStyle = pal.pants;
    ctx.fill();
    dot(ax, ay, w1 * s, pal.pants);
    dot(bx, by, w2 * s, pal.pants);
  };

  const sleeve = (ax, ay, bx, by, w1, w2) => {
    quadPath(ax, ay, bx, by, w1 * s, w2 * s);
    ctx.fillStyle = pal.top;
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
    ctx.rotate(Math.atan2(dy, dx) * 0.15);
    ctx.fillStyle = pal.shoe;
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw * 0.6;
    ctx.beginPath();
    ctx.ellipse(m * s * 0.02, 0, s * 0.055, s * 0.032, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // white sole flash
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = lw * 0.55;
    ctx.beginPath();
    ctx.moveTo(m * s * -0.02, s * 0.022);
    ctx.lineTo(m * s * 0.055, s * 0.022);
    ctx.stroke();
    ctx.restore();
  };

  const [hx, hy] = pt('hip');
  const [cx2, cy2] = pt('chest');
  const [nx, ny] = pt('neck');
  const sw = s * 0.15;

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
    // skin hand
    ctx.fillStyle = pal.skin;
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.arc(hx2, hy2, s * 0.032, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  // ---- far arm, legs, torso, near arm, head ----
  arm('elbowL', 'handL');

  pantsLimb('hip', 'kneeL', 0.062, 0.045);
  pantsLimb('kneeL', 'footL', 0.045, 0.034);
  shoe('kneeL', 'footL');
  pantsLimb('hip', 'kneeR', 0.065, 0.048);
  pantsLimb('kneeR', 'footR', 0.048, 0.036);
  shoe('kneeR', 'footR');

  ctx.lineWidth = lw;
  if (style === 'sumi') {
    // flowing ink dress with glow streaks
    ctx.beginPath();
    ctx.moveTo(nx - sw * 0.8, ny);
    ctx.lineTo(nx + sw * 0.8, ny);
    ctx.quadraticCurveTo(cx2 + sw * 1.3, (cy2 + hy) / 2, hx + sw * 1.7, hy + s * 0.3);
    ctx.quadraticCurveTo(hx + sw * 0.6, hy + s * 0.34, hx, hy + s * 0.3);
    ctx.quadraticCurveTo(hx - sw * 0.6, hy + s * 0.34, hx - sw * 1.7, hy + s * 0.3);
    ctx.quadraticCurveTo(cx2 - sw * 1.3, (cy2 + hy) / 2, nx - sw * 0.8, ny);
    ctx.closePath();
    ctx.fillStyle = pal.top;
    ctx.fill();
    ctx.strokeStyle = pal.topShade;
    ctx.lineWidth = lw * 0.6;
    ctx.stroke();
    // glow streaks in the ink
    ctx.strokeStyle = pal.glow;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = lw * 0.5;
    ctx.beginPath();
    ctx.moveTo(hx - sw * 0.7, hy - s * 0.05);
    ctx.quadraticCurveTo(hx - sw * 0.3, hy + s * 0.15, hx - sw * 0.8, hy + s * 0.26);
    ctx.moveTo(hx + sw * 0.5, hy - s * 0.02);
    ctx.quadraticCurveTo(hx + sw * 0.9, hy + s * 0.16, hx + sw * 0.6, hy + s * 0.27);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = INK;
  } else {
    // jacket with hem; tee shows at the collar
    const hem = hy + s * 0.07;
    const jacket = () => {
      ctx.beginPath();
      ctx.moveTo(nx - sw, ny + s * 0.01);
      ctx.lineTo(cx2 - sw * 1.2, cy2);
      ctx.lineTo(hx - sw * 0.92, hem);
      ctx.lineTo(hx + sw * 0.92, hem);
      ctx.lineTo(cx2 + sw * 1.2, cy2);
      ctx.lineTo(nx + sw, ny + s * 0.01);
      ctx.closePath();
    };
    jacket();
    ctx.fillStyle = pal.top;
    ctx.fill();
    // shaded side
    ctx.save();
    jacket();
    ctx.clip();
    ctx.fillStyle = pal.topShade;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(nx - sw * 1.2, ny - s * 0.02);
    ctx.lineTo(hx - sw * 1.1, hem + s * 0.02);
    ctx.lineTo(hx - sw * 0.25, hem + s * 0.02);
    ctx.lineTo(nx - sw * 0.3, ny - s * 0.02);
    ctx.closePath();
    ctx.fill();
    // tee under the open collar
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.under;
    ctx.beginPath();
    ctx.moveTo(nx - sw * 0.5, ny + s * 0.01);
    ctx.lineTo(nx + sw * 0.5, ny + s * 0.01);
    ctx.lineTo(nx + sw * 0.22, ny + s * 0.12);
    ctx.lineTo(nx - sw * 0.22, ny + s * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    jacket();
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw;
    ctx.stroke();
    // collar + hem line
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(nx - sw * 0.7, ny + s * 0.015);
    ctx.lineTo(nx, ny + s * 0.055);
    ctx.lineTo(nx + sw * 0.7, ny + s * 0.015);
    ctx.moveTo(hx - sw * 0.85, hem - s * 0.028);
    ctx.lineTo(hx + sw * 0.85, hem - s * 0.028);
    ctx.stroke();
    if (style === 'rejected' && !restored) {
      // unfinished: half the torso fades back into pencil
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = PAPER;
      ctx.fillRect(hx - sw * 2, ny, sw, hem - ny);
      ctx.setLineDash([s * 0.05, s * 0.04]);
      ctx.lineWidth = lw * 0.6;
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.moveTo(nx - sw, ny + s * 0.01);
      ctx.lineTo(cx2 - sw * 1.2, cy2);
      ctx.lineTo(hx - sw * 0.92, hem);
      ctx.stroke();
      ctx.restore();
    }
  }

  // near arm in front of the torso
  ctx.strokeStyle = INK;
  arm('elbowR', 'handR');

  // head
  const [hdx, hdy] = pt('head');
  const hr = s * 0.15;
  animeHead(ctx, hdx, hdy - s * 0.025, hr, { dir: pose === 'lying' ? 0 : m, emotion, style, restored });

  if (weapon) {
    const [wx, wy] = pt('handR');
    drawWeapon(ctx, wx, wy, s, weapon, m);
  }
  ctx.restore();
}

/* ============================ public API ============================ */
// AI-painted sprites first (consistent hand-drawn cast); vector fallback
// covers any pose/expression combination without a sprite.
function kaiSpriteName(pose, emotion, weapon) {
  switch (pose) {
    case 'stand':
      return emotion === 'shock' ? 'kai-stand-shock' : emotion === 'smile' ? 'kai-stand-smile' : 'kai-stand';
    case 'walk': return 'kai-walk';
    case 'run': return 'kai-run';
    case 'lying': return 'kai-lying';
    case 'sit': return 'kai-sit';
    case 'crouch': return 'kai-crouch';
    case 'touch': return 'kai-touch';
    case 'dodge': return 'kai-dodge';
    case 'brace': return 'kai-brace';
    case 'point': return 'kai-point';
    case 'kneel': return 'kai-kneel';
    case 'fight':
      return weapon === 'brush' ? 'kai-fight-brush' : weapon === 'nib' ? 'kai-fight-nib'
        : weapon === 'club' ? 'kai-fight-club' : 'kai-point';
    case 'hold-club':
      return weapon === 'brush' ? 'kai-fight-brush' : weapon === 'nib' ? 'kai-fight-nib' : 'kai-idle-club';
    default: return 'kai-stand';
  }
}

export function drawKai(ctx, x, y, s, pose = 'stand', o = {}) {
  const emotion = o.emotion || (o.awake === false ? 'sleep' : pose === 'dodge' || pose === 'brace' ? 'shock' : pose === 'fight' ? 'determined' : 'neutral');
  const weapon = o.weapon !== undefined ? o.weapon : (pose === 'fight' || pose === 'hold-club' ? 'club' : null);
  const dir = o.dir ?? 1;
  const name = kaiSpriteName(pose, emotion, weapon);
  const mode = pose === 'lying' ? 'width' : 'height';
  const size = pose === 'lying' ? s * 1.6 : s;
  if (drawSprite(ctx, name, x, y, size, dir === 0 ? 1 : dir, mode)) return;
  drawBody(ctx, x, y, s, pose, { dir, style: 'kai', weapon, emotion });
}

export function drawSumi(ctx, x, y, s, pose = 'float', o = {}) {
  const bob = o.t !== undefined ? Math.sin(o.t * 2) * s * 0.02 : 0;
  const emotion = o.emotion || 'smile';
  const dir = o.dir ?? -1;
  const name = pose === 'brace' ? 'sumi-brace'
    : emotion === 'shock' ? 'sumi-float-shock' : emotion === 'sad' ? 'sumi-float-sad' : 'sumi-float';
  if (drawSprite(ctx, name, x, y + bob, s, dir === 0 ? 1 : dir)) return;
  drawBody(ctx, x, y + bob, s, pose, { dir, style: 'sumi', emotion });
}

export function drawRejected(ctx, x, y, s, pose = 'stand', o = {}) {
  const dir = o.dir ?? -1;
  const name = o.restored ? 'rejected-restored'
    : pose === 'fight' ? 'rejected-fight' : pose === 'kneel' ? 'rejected-kneel' : 'rejected-stand';
  if (drawSprite(ctx, name, x, y, s, dir === 0 ? 1 : dir)) return;
  drawBody(ctx, x, y, s, pose, { dir, style: 'rejected', weapon: o.weapon || null, emotion: o.emotion || 'determined', restored: o.restored || false });
}
