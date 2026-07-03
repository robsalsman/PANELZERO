// Generic scene composer: interprets a panel's `art` OBJECT so chapters 2+
// are pure JSON — backgrounds, ground, actors, props, bubbles, with optional
// `done` (merged when the panel is complete) and `byFlag` (merged when a
// story flag is set) variants. Positions are normalized to the panel.
import {
  INK, PAPER, fillTone, speedLinesV, speedLinesH, impactStar, drawSFXText,
  drawPencilShadow, drawHandWithEraser, drawSmudge, speechBubble,
} from './art.js';
import { drawKai, drawSumi, drawRejected } from './chars.js';

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
      // graveyard of tilted, abandoned panels
      ctx.save();
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
      // ink sea: dark rolling waves over the lower half
      ctx.save();
      ctx.fillStyle = INK;
      ctx.globalAlpha = 0.85;
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
      ctx.strokeStyle = PAPER;
      ctx.globalAlpha = 0.5;
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
      // meta: the manga page lies on the Artist's desk
      ctx.save();
      ctx.fillStyle = 'rgba(17,17,17,0.14)';
      ctx.fillRect(0, 0, w, h * 0.32); // desk beyond the page edge
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
    case 'blank': break; // pure paper — Panel Zero
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
    case 'smudge': drawSmudge(ctx, x, y, s * 0.4, t, a.hp ?? 1); break;
    case 'hand': drawHandWithEraser(ctx, w, h, a.drop ?? 1); break;
    case 'pencil-shadow': drawPencilShadow(ctx, w, h, (a.x ?? 0.5) * w, a.alpha ?? 0.45); break;
  }
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
      // a torn panel used as a raft
      ctx.save();
      ctx.translate(pr.x * w, pr.y * h + Math.sin(t * 1.5) * h * 0.012);
      ctx.rotate(Math.sin(t * 1.2) * 0.03);
      const rw = (pr.w || 0.5) * w;
      ctx.fillStyle = PAPER;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-rw / 2, 0);
      ctx.lineTo(rw / 2, 0);
      ctx.lineTo(rw / 2 - 8, h * 0.05);
      ctx.lineTo(-rw / 2 + 6, h * 0.045);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
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
      // a master's calligraphy brush, adrift
      ctx.save();
      const bx = pr.x * w;
      const by = pr.y * h;
      const bs = (pr.s || 0.25) * h;
      ctx.translate(bx, by);
      ctx.rotate(0.9 + Math.sin(t * 1.4) * 0.05);
      ctx.strokeStyle = INK;
      ctx.lineWidth = bs * 0.12;
      ctx.beginPath();
      ctx.moveTo(0, bs * 0.5);
      ctx.lineTo(0, -bs * 0.25);
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(0, -bs * 0.25);
      ctx.quadraticCurveTo(bs * 0.16, -bs * 0.45, 0, -bs * 0.62);
      ctx.quadraticCurveTo(-bs * 0.16, -bs * 0.45, 0, -bs * 0.25);
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
      ctx.fillStyle = INK;
      ctx.fillRect(-ps * 0.06, -ps * 0.5, ps * 0.12, ps);
      ctx.beginPath();
      ctx.moveTo(-ps * 0.06, ps * 0.5);
      ctx.lineTo(0, ps * 0.62);
      ctx.lineTo(ps * 0.06, ps * 0.5);
      ctx.closePath();
      ctx.fill();
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

  for (const pr of def.props || []) drawProp(ctx, w, h, pr, t);
  for (const a of def.actors || []) drawActor(ctx, w, h, a, t, o.flags);

  for (const b of def.bubbles || []) {
    // bubbles fade in slightly after the panel lands
    if (o.phase !== 'done' && t < (b.delay ?? 0.5)) continue;
    speechBubble(ctx, b.text, b.x * w, b.y * h, (b.maxW || 0.6) * w, {
      fs: Math.min(22, Math.max(13, h * (b.fs || 0.045))),
      jagged: b.jagged || false,
      tail: b.tailX !== undefined ? { x: b.tailX * w, y: b.tailY * h } : null,
    });
  }
}
