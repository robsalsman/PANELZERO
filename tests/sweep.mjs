// Full visual sweep: screenshot EVERY panel of every chapter (with
// representative flags) into tests/shots/sweep/, clipped to the panel rect.
// One browser for the whole run. Usage: node tests/sweep.mjs [chapterId]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';

const PORT = 8700 + (process.pid % 50);
const only = process.argv[2] || null;

// representative flag context per chapter (+ per-panel overrides)
const CTX = {
  ch1: [],
  ch2: [],
  ch3a: ['route_sea'],
  ch3b: ['route_cut'],
  ch4: ['route_sea', 'savedSumi', 'brush', 'mercy'],
  g1: ['route_sea', 'savedSumi', 'brush', 'mercy'],
  g2: ['route_sea', 'savedSumi', 'brush', 'mercy', 'duel_ken'],
  s1: ['route_sea', 'savedSumi', 'brush', 'mercy', 'duel_ken', 'recruit', 'side_sumi'],
  g3: ['route_sea', 'savedSumi', 'brush', 'mercy', 'duel_ken', 'recruit', 'side_sumi'],
  ch5: ['route_sea', 'savedSumi', 'brush', 'mercy', 'duel_ken', 'recruit', 'side_sumi', 'empathy'],
};
// extra variant shots: chapter -> [[panelIdx, extraFlags, suffix], ...]
const VARIANTS = [
  ['g2', 2, ['duel_yuri'], 'yuri'],
  ['g2', 2, ['duel_goma'], 'goma'],
  ['g2', 9, ['duel_yuri'], 'yuri'],
  ['g2', 9, ['duel_goma'], 'goma'],
  ['ch5', 14, ['finish', 'ending_coauthors'], 'coauthors'],
];

const story = JSON.parse(readFileSync('data/story.json'));
const chapters = Object.keys(CTX).filter((c) => !only || c === only);
mkdirSync('tests/shots/sweep', { recursive: true });

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new globalThis.URL('..', import.meta.url).pathname,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch({ executablePath: process.env.PZ_CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
await page.goto(`http://127.0.0.1:${PORT}/`);
await page.waitForFunction(() => window.__pz);
await page.click('#btn-start');
await page.waitForFunction(() => window.__pz.phase !== 'title');
await page.waitForTimeout(600); // let sprites/meta load

async function shoot(ch, idx, flags, suffix = '') {
  await page.evaluate(({ ch, idx, flags }) => {
    const g = window.__pz;
    g.flags = {};
    for (const f of flags) g.flags[f] = true;
    return g.beginChapter(ch, idx);
  }, { ch, idx, flags });
  try {
    await page.waitForFunction((i) => window.__pz.phase === 'active' && window.__pz.current === i, idx, { timeout: 8000 });
  } catch {
    console.log(`SKIP ${ch}:${idx} (never became active)`);
    return;
  }
  await page.waitForTimeout(700);
  const rect = await page.evaluate((i) => {
    const g = window.__pz;
    const r = g.rects[i];
    return { x: r.x, y: r.y - g.scroll.y, w: r.w, h: r.h };
  }, idx);
  const clip = {
    x: Math.max(0, rect.x - 2),
    y: Math.max(0, rect.y - 2),
    width: Math.min(390, rect.w + 4),
    height: Math.min(844 - Math.max(0, rect.y - 2), rect.h + 4),
  };
  const name = `tests/shots/sweep/${ch}-${String(idx).padStart(2, '0')}${suffix ? '-' + suffix : ''}.png`;
  await page.screenshot({ path: name, clip });
  console.log(`shot ${name}`);
}

for (const ch of chapters) {
  const data = JSON.parse(readFileSync(`data/chapter${ch.replace('ch', '').replace('g1', '5g').replace('g2', '6d').replace('s1', '6s').replace('g3', '7a')}.json`));
  for (let i = 0; i < data.panels.length; i++) {
    await shoot(ch, i, CTX[ch]);
  }
}
for (const [ch, idx, extra, suffix] of VARIANTS) {
  if (only && ch !== only) continue;
  await shoot(ch, idx, [...CTX[ch].filter((f) => !f.startsWith('duel_')), ...extra], suffix);
}

if (errors.length) {
  console.log('CONSOLE ERRORS:');
  for (const e of [...new Set(errors)]) console.log('  ' + e);
} else {
  console.log('no console errors');
}
await browser.close();
server.kill();
