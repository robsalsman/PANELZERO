// Generic scene composer: interprets a panel's `art` OBJECT so chapters 2+
// are pure JSON — backgrounds, ground, actors, props, bubbles, with optional
// `done` (merged when the panel is complete) and `byFlag` (merged when a
// story flag is set) variants. Positions are normalized to the panel.
import {
  INK, PAPER, C, fillTone, speedLinesV, speedLinesH, impactStar, drawSFXText,
  drawPencilShadow, drawHandWithEraser, drawSmudge, speechBubble, drawRaft, drawSprite,
} from './art.js';
import { drawKai, drawSumi, drawRejected, drawKen, drawYuri, drawGoma, drawArtist } from './chars.js';

function radialLines(ctx, w, h, cx, cy, n = 24, alpha = 0.22) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = INK;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(cx * w + Math.cos(a) * w * 0.12, cy * h + Math.sin(a) * w * 0.12);
    ctx.lineTo(cx * w + Math.cos(a) * (w + h), cy * h + Math.sin(a) * (w + h));
    ctx.stroke();
  }
  ctx.restore();
}

function drawBg(ctx, w, h, bg, t) {
  switch (bg) {
    case 'speedv': speedLinesV(ctx, w, h, 16, 0.18); break;
    case 'speedh': speedLinesH(ctx, w, h, 12, 0.16); break;
    case 'radial': radialLines(ctx, w, h, 0.5, 0.35); break;
    case 'toneL': fillTone(ctx, 0, 0, w, h, 'light', 0.25); break;
    case 'toneD': fillTone(ctx, 0, 0, w, h, 'dark', 0.4); break;
    case 'drips': {
      ctx.fillStyle = INK;
      for (let i = 0; i < 4; i++) {
        const x = w * (0.15 + i * 0.24);
        const dy = ((t * (0.5 + (i % 3) * 0.2) + i * 0.37) % 1);
        ctx.beginPath();
        ctx.ellipse(x, dy * h * 0.7, 3.5, h * 0.045, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'deadpanels': {
      // graveyard of tilted, abandoned panels — cold violet-gray air
      ctx.save();
      ctx.fillStyle = 'rgba(84,74,99,0.12)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = INK;
      const boxes = [
        [0.06, 0.15, 0.26, 0.3, -0.12], [0.4, 0.08, 0.22, 0.34, 0.08],
        [0.7, 0.18, 0.24, 0.28, -0.05], [0.16, 0.52, 0.2, 0.26, 0.14],
        [0.66, 0.55, 0.26, 0.24, -0.16],
      ];
      for (const [bx, by, bw, bh, rot] of boxes) {
        ctx.save();
        ctx.translate((bx + bw / 2) * w, (by + bh / 2) * h);
        ctx.rotate(rot);
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 3;
        ctx.strokeRect((-bw / 2) * w, (-bh / 2) * h, bw * w, bh * h);
        ctx.setLineDash([8, 7]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo((-bw / 2) * w + 8, (-bh / 2) * h + 10);
        ctx.lineTo((bw / 2) * w - 8, (bh / 2) * h - 10);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      break;
    }
    case 'sea': {
      // the ink sea: deep indigo swell under a pale sky
      ctx.save();
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
      sky.addColorStop(0, 'rgba(111,216,230,0.18)');
      sky.addColorStop(1, 'rgba(111,216,230,0)');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.62);
      const grad = ctx.createLinearGradient(0, h * 0.55, 0, h);
      grad.addColorStop(0, C.sea1);
      grad.addColorStop(1, C.sea2);
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      const yBase = h * 0.62;
      ctx.moveTo(0, h);
      ctx.lineTo(0, yBase);
      for (let x = 0; x <= w; x += w / 8) {
        ctx.quadraticCurveTo(
          x + w / 16, yBase - Math.sin(t * 1.5 + x * 0.02) * h * 0.035 - h * 0.04,
          x + w / 8, yBase + Math.sin(t * 1.2 + x * 0.015) * h * 0.02
        );
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      // foam highlights
      ctx.strokeStyle = C.foam;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const fy = yBase + h * 0.08 + i * h * 0.09;
        ctx.moveTo(0, fy);
        for (let x = 0; x <= w; x += w / 6) {
          ctx.quadraticCurveTo(x + w / 12, fy - h * 0.02 - Math.sin(t + x) * 3, x + w / 6, fy);
        }
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'desk': {
      // meta: the manga page lies on the Artist's warm wooden desk
      ctx.save();
      const wood = ctx.createLinearGradient(0, 0, 0, h * 0.32);
      wood.addColorStop(0, C.wood1);
      wood.addColorStop(1, C.wood2);
      ctx.fillStyle = wood;
      ctx.fillRect(0, 0, w, h * 0.32); // desk beyond the page edge
      // grain
      ctx.strokeStyle = 'rgba(90,60,30,0.25)';
      ctx.lineWidth = 1.5;
      for (let gy2 = h * 0.05; gy2 < h * 0.3; gy2 += h * 0.055) {
        ctx.beginPath();
        ctx.moveTo(0, gy2);
        ctx.bezierCurveTo(w * 0.3, gy2 - 4, w * 0.6, gy2 + 4, w, gy2);
        ctx.stroke();
      }
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.32);
      ctx.lineTo(w, h * 0.3); // the page edge
      ctx.stroke();
      // a giant pencil resting in the distance
      ctx.fillStyle = INK;
      ctx.globalAlpha = 0.75;
      ctx.save();
      ctx.translate(w * 0.72, h * 0.16);
      ctx.rotate(-0.08);
      ctx.fillRect(-w * 0.35, -h * 0.025, w * 0.7, h * 0.05);
      ctx.beginPath();
      ctx.moveTo(w * 0.35, -h * 0.025);
      ctx.lineTo(w * 0.43, 0);
      ctx.lineTo(w * 0.35, h * 0.025);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // coffee ring on the desk
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(w * 0.16, h * 0.12, w * 0.09, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'blank': {
      // Panel Zero: white void with a faint golden dawn at its heart
      const g2 = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, Math.max(w, h) * 0.8);
      g2.addColorStop(0, 'rgba(224,166,60,0.14)');
      g2.addColorStop(1, 'rgba(224,166,60,0)');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
      break;
    }
  }
}

function drawActor(ctx, w, h, a, t, flags) {
  const x = a.x * w;
  const y = a.y * h;
  const s = (a.s || 0.45) * h;
  const o = { dir: a.dir ?? 1, emotion: a.emotion, weapon: a.weapon, t, awake: a.awake };
  // flag-driven weapon: "$weapon" resolves to whatever the player carries
  if (a.weapon === '$weapon') {
    o.weapon = flags.brush ? 'brush' : flags.nib ? 'nib' : 'club';
  }
  switch (a.who) {
    case 'kai': drawKai(ctx, x, y, s, a.pose || 'stand', o); break;
    case 'sumi': drawSumi(ctx, x, y, s, a.pose || 'float', o); break;
    case 'rejected': drawRejected(ctx, x, y, s, a.pose || 'stand', o); break;
    case 'ken': drawKen(ctx, x, y, s, a.pose || 'stand', o); break;
    case 'yuri': drawYuri(ctx, x, y, s, a.pose || 'stand', o); break;
    case 'goma': drawGoma(ctx, x, y, s, o); break;
    case 'artist': drawArtist(ctx, x, y, s, a.pose || 'stand', o); break;
    case 'smudge': drawSmudge(ctx, x, y, s * 0.4, t, a.hp ?? 1); break;
    case 'hand': drawHandWithEraser(ctx, w, h, a.drop ?? 1); break;
    case 'pencil-shadow': drawPencilShadow(ctx, w, h, (a.x ?? 0.5) * w, a.alpha ?? 0.45); break;
  }
}

// a proper yellow pencil, drawn vertically (tip down), centered on origin.
// ps = half-length. Exported for hazard rendering in verbs.js.
export function drawPencilBody(ctx, ps) {
  const pw2 = ps * 0.11;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, ps * 0.03);
  // body — warm yellow with facet lines
  const grad = ctx.createLinearGradient(-pw2, 0, pw2, 0);
  grad.addColorStop(0, '#c98f2c');
  grad.addColorStop(0.5, '#eab547');
  grad.addColorStop(1, '#b57d24');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.rect(-pw2, -ps * 0.5, pw2 * 2, ps);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(-pw2 * 0.33, -ps * 0.5); ctx.lineTo(-pw2 * 0.33, ps * 0.5);
  ctx.moveTo(pw2 * 0.33, -ps * 0.5); ctx.lineTo(pw2 * 0.33, ps * 0.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // wood cone + graphite tip
  ctx.fillStyle = '#e8d5ae';
  ctx.beginPath();
  ctx.moveTo(-pw2, ps * 0.5);
  ctx.lineTo(0, ps * 0.72);
  ctx.lineTo(pw2, ps * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(-pw2 * 0.35, ps * 0.64);
  ctx.lineTo(0, ps * 0.72);
  ctx.lineTo(pw2 * 0.35, ps * 0.64);
  ctx.closePath();
  ctx.fill();
  // ferrule + eraser
  ctx.fillStyle = '#b9bec9';
  ctx.beginPath();
  ctx.rect(-pw2, -ps * 0.58, pw2 * 2, ps * 0.08);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e2a1a8';
  ctx.beginPath();
  ctx.roundRect(-pw2 * 0.9, -ps * 0.68, pw2 * 1.8, ps * 0.1, pw2 * 0.35);
  ctx.fill();
  ctx.stroke();
}

function drawProp(ctx, w, h, pr, t) {
  switch (pr.type) {
    case 'sfx':
      drawSFXText(ctx, pr.text, pr.x * w, pr.y * h, (pr.size || 0.12) * Math.min(w, h), pr.rot || 0);
      break;
    case 'star':
      impactStar(ctx, pr.x * w, pr.y * h, (pr.r || 0.12) * Math.min(w, h), pr.spikes || 9);
      break;
    case 'raft': {
      // a torn manga page used as a raft
      ctx.save();
      ctx.translate(pr.x * w, pr.y * h + Math.sin(t * 1.5) * h * 0.012);
      ctx.rotate(Math.sin(t * 1.2) * 0.03);
      drawRaft(ctx, 0, 0, (pr.w || 0.5) * w, t);
      ctx.restore();
      break;
    }
    case 'pagepile': {
      // a lean-to of torn, crumpled pages — big enough to duck behind
      const px = pr.x * w;
      const py = pr.y * h;
      const pw = (pr.w || 0.3) * w;
      if (drawSprite(ctx, 'prop-pagepile', px, py, pw * 0.85, 1)) break;
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(2.5, pw * 0.02);
      // three leaning sheets, back to front
      const sheets = [
        { dx: -pw * 0.18, wRatio: 0.72, hRatio: 0.62, lean: -0.22, tone: '#ddd5c2' },
        { dx: pw * 0.16, wRatio: 0.8, hRatio: 0.72, lean: 0.18, tone: '#ece5d2' },
        { dx: 0, wRatio: 0.95, hRatio: 0.85, lean: -0.06, tone: '#f7f4ec' },
      ];
      for (const s of sheets) {
        const sw2 = pw * s.wRatio;
        const sh = pw * s.hRatio;
        ctx.save();
        ctx.translate(px + s.dx, py);
        ctx.rotate(s.lean);
        ctx.fillStyle = s.tone;
        ctx.beginPath();
        // torn-edged sheet standing on a corner
        ctx.moveTo(-sw2 / 2, 0);
        ctx.lineTo(-sw2 * 0.42, -sh * 0.55);
        ctx.lineTo(-sw2 * 0.18, -sh * 0.48);
        ctx.lineTo(0, -sh);
        ctx.lineTo(sw2 * 0.2, -sh * 0.6);
        ctx.lineTo(sw2 * 0.44, -sh * 0.7);
        ctx.lineTo(sw2 / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // crease lines
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(-sw2 * 0.2, 0);
        ctx.lineTo(0, -sh * 0.82);
        ctx.moveTo(sw2 * 0.15, 0);
        ctx.lineTo(sw2 * 0.3, -sh * 0.55);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      break;
    }
    case 'gate': {
      // a torn-open panel border, used as a doorway
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      const gx = pr.x * w;
      const gw = (pr.w || 0.3) * w;
      const gy = pr.y * h;
      const gh = (pr.h || 0.5) * h;
      ctx.strokeRect(gx - gw / 2, gy - gh, gw, gh);
      ctx.fillStyle = INK;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(gx - gw / 2 + 5, gy - gh + 5, gw - 10, gh - 10);
      ctx.restore();
      break;
    }
    case 'inkbottle': {
      ctx.save();
      const bx = pr.x * w;
      const by = pr.y * h;
      const bs = (pr.s || 0.25) * h;
      if (drawSprite(ctx, 'prop-inkbottle', bx, by, bs, 1)) { ctx.restore(); break; }
      ctx.fillStyle = INK;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(bx - bs * 0.4, by - bs * 0.75, bs * 0.8, bs * 0.75, bs * 0.1);
      ctx.fill();
      ctx.fillRect(bx - bs * 0.15, by - bs * 0.95, bs * 0.3, bs * 0.22);
      ctx.fillStyle = PAPER;
      ctx.font = `800 ${bs * 0.16}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('INK', bx, by - bs * 0.38);
      ctx.restore();
      break;
    }
    case 'brush': {
      // a master's calligraphy brush, adrift — glowing so it reads over dark water
      ctx.save();
      const bx = pr.x * w;
      const by = pr.y * h;
      const bs = (pr.s || 0.25) * h;
      // soft paper halo behind the relic
      const halo = ctx.createRadialGradient(bx, by, bs * 0.1, bx, by, bs * 0.85);
      halo.addColorStop(0, 'rgba(247, 244, 236, 0.95)');
      halo.addColorStop(0.6, 'rgba(247, 244, 236, 0.45)');
      halo.addColorStop(1, 'rgba(247, 244, 236, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(bx, by, bs * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.translate(bx, by);
      ctx.rotate(0.9 + Math.sin(t * 1.4) * 0.05);
      if (drawSprite(ctx, 'prop-brush', 0, bs * 0.55, bs * 1.15, 1)) { ctx.restore(); break; }
      // bamboo handle
      const hw = bs * 0.075;
      const hGrad = ctx.createLinearGradient(-hw, 0, hw, 0);
      hGrad.addColorStop(0, '#a8763e');
      hGrad.addColorStop(0.45, '#d9a968');
      hGrad.addColorStop(1, '#8a5c2c');
      ctx.fillStyle = hGrad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(2, bs * 0.03);
      ctx.beginPath();
      ctx.roundRect(-hw, -bs * 0.22, hw * 2, bs * 0.74, hw);
      ctx.fill();
      ctx.stroke();
      // bamboo joint lines
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(-hw, bs * 0.1); ctx.lineTo(hw, bs * 0.1);
      ctx.moveTo(-hw, bs * 0.32); ctx.lineTo(hw, bs * 0.32);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // gold ferrule
      ctx.fillStyle = '#e0a63c';
      ctx.beginPath();
      ctx.roundRect(-hw * 1.3, -bs * 0.3, hw * 2.6, bs * 0.1, bs * 0.015);
      ctx.fill();
      ctx.stroke();
      // ink-loaded bristles
      const bGrad = ctx.createLinearGradient(0, -bs * 0.3, 0, -bs * 0.66);
      bGrad.addColorStop(0, '#4a4a55');
      bGrad.addColorStop(0.55, '#26262e');
      bGrad.addColorStop(1, '#101016');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.moveTo(-hw * 1.3, -bs * 0.3);
      ctx.quadraticCurveTo(-hw * 1.7, -bs * 0.46, 0, -bs * 0.66);
      ctx.quadraticCurveTo(hw * 1.7, -bs * 0.46, hw * 1.3, -bs * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // wet highlight on the bristle
      ctx.strokeStyle = 'rgba(160, 190, 255, 0.7)';
      ctx.lineWidth = Math.max(1.5, bs * 0.02);
      ctx.beginPath();
      ctx.moveTo(-hw * 0.5, -bs * 0.36);
      ctx.quadraticCurveTo(-hw * 0.8, -bs * 0.48, 0, -bs * 0.6);
      ctx.stroke();
      // a bead of ink about to drop
      ctx.fillStyle = '#1c1c26';
      ctx.beginPath();
      ctx.ellipse(0, -bs * (0.68 + Math.sin(t * 2.2) * 0.015), bs * 0.028, bs * 0.038, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'nib': {
      // a hero's pen nib, stuck in the ground
      ctx.save();
      const nx = pr.x * w;
      const ny = pr.y * h;
      const ns = (pr.s || 0.2) * h;
      if (drawSprite(ctx, 'prop-nib', nx, ny + ns * 0.5, ns, 1)) { ctx.restore(); break; }
      ctx.translate(nx, ny);
      ctx.rotate(-0.15);
      ctx.fillStyle = PAPER;
      ctx.strokeStyle = INK;
      ctx.lineWidth = ns * 0.07;
      ctx.beginPath();
      ctx.moveTo(0, ns * 0.5);
      ctx.lineTo(-ns * 0.28, -ns * 0.3);
      ctx.quadraticCurveTo(0, -ns * 0.55, ns * 0.28, -ns * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, ns * 0.45);
      ctx.lineTo(0, -ns * 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -ns * 0.1, ns * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = INK;
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'pencil': {
      // the Artist's pencil, spinning free
      ctx.save();
      const px = pr.x * w;
      const py = pr.y * h;
      const ps = (pr.s || 0.35) * h;
      ctx.translate(px, py);
      ctx.rotate(pr.spin ? t * 2.4 : (pr.rot || 0.4));
      if (drawSprite(ctx, 'prop-pencil', 0, ps * 0.55, ps * 1.1, 1)) { ctx.restore(); break; }
      drawPencilBody(ctx, ps);
      ctx.restore();
      break;
    }
    case 'tiles': {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      const ty = (pr.y || 0.84) * h;
      for (let i = 0; i < 5; i++) {
        ctx.strokeRect(w * 0.04 + i * w * 0.19, ty, w * 0.17, h * 0.1);
      }
      break;
    }
  }
}

// raster backdrop cache (AI-painted scene art), cover-fit
const imgCache = new Map();
export function drawBackdrop(ctx, w, h, src) {
  let img = imgCache.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    imgCache.set(src, img);
  }
  if (img.complete && img.naturalWidth) {
    // cover-fit
    const sc = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * sc;
    const dh = img.naturalHeight * sc;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return true;
  }
  return false;
}

export function composeScene(ctx, w, h, artDef, o) {
  // resolve variants: byFlag merges (first matching flag wins per key), done merges last
  let def = artDef;
  if (artDef.byFlag) {
    for (const [flag, patch] of Object.entries(artDef.byFlag)) {
      if (o.flags[flag]) { def = { ...def, ...patch }; break; }
    }
  }
  if (o.phase === 'done' && def.done) def = { ...def, ...def.done };

  const t = o.t === 999 ? 3 : o.t; // completed panels freeze at a settled moment

  if (def.img) drawBackdrop(ctx, w, h, def.img);
  const bgs = Array.isArray(def.bg) ? def.bg : def.bg ? [def.bg] : [];
  for (const bg of bgs) drawBg(ctx, w, h, bg, t);

  if (def.ground !== undefined) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, def.ground * h);
    ctx.lineTo(w, def.ground * h);
    ctx.stroke();
  }

  const props = def.props || [];
  for (const pr of props) if (!pr.front) drawProp(ctx, w, h, pr, t);
  for (const a of def.actors || []) drawActor(ctx, w, h, a, t, o.flags);
  // foreground props overlap the cast — hiding spots, debris in front
  for (const pr of props) if (pr.front) drawProp(ctx, w, h, pr, t);

  const drawnBubbles = [];
  for (const b of def.bubbles || []) {
    // bubbles land almost immediately — readers set the pace
    if (o.phase !== 'done' && t < (b.delay ?? 0.15)) continue;
    drawnBubbles.push(speechBubble(ctx, b.text, b.x * w, b.y * h, (b.maxW || 0.6) * w, {
      fs: Math.min(22, Math.max(13, h * (b.fs || 0.045))),
      jagged: b.jagged || false,
      tail: b.tailX !== undefined ? { x: b.tailX * w, y: b.tailY * h } : null,
      avoid: drawnBubbles,
    }));
  }
}
