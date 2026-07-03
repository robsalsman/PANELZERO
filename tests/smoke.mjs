// End-to-end smoke test: plays Chapter 1 start to finish with REAL gestures
// (taps, swipes, a 3.5s hold, a trace stroke) in a mobile-sized headless
// Chromium, then asserts the chapter-end screen. Fails on any console error.
//
// Usage: (serve repo root on :8321 first, or let this script do it)
//   node tests/smoke.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 8321;
const URL = `http://127.0.0.1:${PORT}/`;

function log(msg) {
  process.stdout.write(`  ${msg}\n`);
}

async function main() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
    cwd: new globalThis.URL('..', import.meta.url).pathname,
    stdio: 'ignore',
  });
  await new Promise((r) => setTimeout(r, 800));

  // use the environment's pre-installed Chromium if present
  const browser = await chromium.launch({
    executablePath: process.env.PZ_CHROMIUM || '/opt/pw-browsers/chromium',
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });

  const state = () =>
    page.evaluate(() => ({
      phase: window.__pz.phase,
      current: window.__pz.current,
      fails: window.__pz.fails,
    }));

  // wait until a given panel index is in the 'active' phase
  async function waitActive(idx, timeout = 15000) {
    const t0 = Date.now();
    for (;;) {
      const s = await state();
      if (s.phase === 'active' && s.current === idx) return s;
      if (s.phase === 'end' || s.current > idx) return s; // cutscene auto-advanced past
      if (Date.now() - t0 > timeout) {
        throw new Error(`timeout waiting for panel ${idx} active (at ${JSON.stringify(s)})`);
      }
      await page.waitForTimeout(80);
    }
  }

  // client coords for a fraction of the CURRENT panel
  const panelPoint = (fx, fy) =>
    page.evaluate(
      ([fx, fy]) => {
        const g = window.__pz;
        const r = g.rects[g.current];
        return { x: r.x + fx * r.w, y: r.y + fy * r.h - g.scroll.y };
      },
      [fx, fy]
    );

  async function tapPanel(fx, fy, times = 1, pause = 220) {
    for (let i = 0; i < times; i++) {
      const p = await panelPoint(fx, fy);
      await page.mouse.click(p.x, p.y);
      await page.waitForTimeout(pause);
    }
  }

  async function swipe(dir) {
    const cx = 195;
    const cy = 500;
    const dx = dir === 'left' ? -130 : 130;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 5; i++) {
      await page.mouse.move(cx + (dx * i) / 5, cy, { steps: 1 });
      await page.waitForTimeout(12);
    }
    await page.mouse.up();
  }

  // ---- run ----
  await page.goto(URL);
  await page.waitForSelector('#btn-start');
  await page.waitForFunction(() => window.__pz);
  log('title screen up');
  await page.screenshot({ path: 'tests/shots/01-title.png' });
  await page.click('#btn-start');

  // p01 cutscene — tap to advance after it plays
  await waitActive(0);
  await page.waitForTimeout(1600);
  await tapPanel(0.5, 0.5);
  log('p01 cutscene advanced');

  // p02 tap ×3 on Kai
  await waitActive(1);
  await tapPanel(0.5, 0.65, 3, 350);
  log('p02 tapped Kai awake');
  await page.screenshot({ path: 'tests/shots/02-wake.png' });

  // p03 cutscene
  await waitActive(2);
  await page.waitForTimeout(1700);
  await tapPanel(0.5, 0.5);
  log('p03 cutscene advanced');

  // p04 choose — pick bubble 2 ("...I'm in a manga." → aware flag)
  await waitActive(3);
  await page.waitForTimeout(300);
  await tapPanel(0.73, 0.32);
  log('p04 chose "...I\'m in a manga."');

  // p05 swipe dodge (any horizontal)
  await waitActive(4);
  await page.waitForTimeout(350);
  await swipe('left');
  log('p05 dodged CRASH');

  // p06 tap the C
  await waitActive(5);
  await page.waitForTimeout(250);
  await tapPanel(0.63, 0.74);
  log('p06 grabbed the C');

  // p07 cutscene (Hand shadow)
  await waitActive(6);
  await page.waitForTimeout(1800);
  await tapPanel(0.5, 0.5);
  log('p07 cutscene advanced');

  // p08 hold to hide (2 sweeps ≈ 3.5s)
  await waitActive(7);
  await page.waitForTimeout(250);
  {
    const p = await panelPoint(0.5, 0.5);
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.waitForFunction(
      () => window.__pz.phase !== 'active' || window.__pz.current !== 7,
      { timeout: 8000 }
    );
    await page.mouse.up();
  }
  log('p08 held through both sweeps');

  // p09 trace the bridge
  await waitActive(8);
  await page.waitForTimeout(250);
  {
    const path = await page.evaluate(() => {
      const g = window.__pz;
      const r = g.rects[g.current];
      const norm = g.panels[g.current].params.path;
      return norm.map(([nx, ny]) => ({ x: r.x + nx * r.w, y: r.y + ny * r.h - g.scroll.y }));
    });
    await page.mouse.move(path[0].x, path[0].y);
    await page.mouse.down();
    for (let i = 0; i < path.length - 1; i++) {
      for (let s = 1; s <= 8; s++) {
        await page.mouse.move(
          path[i].x + ((path[i + 1].x - path[i].x) * s) / 8,
          path[i].y + ((path[i + 1].y - path[i].y) * s) / 8,
          { steps: 1 }
        );
        await page.waitForTimeout(14);
      }
    }
    await page.mouse.up();
  }
  log('p09 traced the bridge');

  // p10 double dodge: SLASH → swipe left, THUD → swipe right
  await waitActive(9);
  await page.waitForTimeout(350);
  await swipe('left');
  await page.waitForTimeout(1900); // first crash + second hazard delay
  await swipe('right');
  log('p10 dodged SLASH and THUD');

  // p11 choose — Fight
  await waitActive(10);
  await page.waitForTimeout(300);
  await tapPanel(0.73, 0.32);
  log('p11 chose Fight');

  // p12 timed tap ×5 on the moving smudge
  await waitActive(11);
  await page.waitForTimeout(250);
  for (let i = 0; i < 5; i++) {
    const p = await page.evaluate(() => {
      const g = window.__pz;
      const r = g.rects[g.current];
      const count = g.challenge.count;
      const sx = 0.68 * r.w + Math.sin(count * 2.4) * r.w * 0.14;
      const sy = 0.72 * r.h;
      return { x: r.x + sx, y: r.y + sy - g.scroll.y };
    });
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(260);
  }
  log('p12 defeated the smudge');
  await page.screenshot({ path: 'tests/shots/03-fight-done.png' });

  // p13 cutscene (warning line)
  await waitActive(12);
  await page.waitForTimeout(1800);
  await tapPanel(0.5, 0.5);
  log('p13 cutscene advanced');

  // p14 spread — let it land, screenshot, tap through
  await waitActive(13);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tests/shots/04-spread.png' });
  await tapPanel(0.5, 0.5);

  // chapter end screen
  await page.waitForSelector('#chapter-end:not(.hidden)', { timeout: 8000 });
  const time = await page.textContent('#stat-time');
  const fails = await page.textContent('#stat-fails');
  const clean = await page.evaluate(
    () => !document.getElementById('clean-badge').classList.contains('hidden')
  );
  await page.screenshot({ path: 'tests/shots/05-end.png' });
  log(`chapter complete — time ${time}, fails ${fails}, clean read: ${clean}`);

  if (fails !== '0' || !clean) throw new Error(`expected a clean run, got fails=${fails}`);

  // ---- fail path: let a hazard hit, expect erase → redraw → retry ----
  await page.click('#btn-again');
  await waitActive(0);
  await page.waitForTimeout(1600);
  await tapPanel(0.5, 0.5);
  await waitActive(1);
  await tapPanel(0.5, 0.65, 3, 350);
  await waitActive(2);
  await page.waitForTimeout(1700);
  await tapPanel(0.5, 0.5);
  await waitActive(3);
  await page.waitForTimeout(300);
  await tapPanel(0.27, 0.2);
  await waitActive(4);
  await page.waitForTimeout(2600); // don't dodge: CRASH lands → erase → redraw
  {
    const s = await state();
    if (s.fails !== 1 || s.current !== 4) {
      throw new Error(`expected fail+retry on p05, got ${JSON.stringify(s)}`);
    }
    if (s.phase === 'active') {
      await swipe('right'); // retry works after the redraw
      await page.waitForTimeout(400);
    }
  }
  log('fail path: CRASH hit → panel erased, redrawn, retried');

  if (errors.length) throw new Error(`console/page errors:\n${errors.join('\n')}`);

  await browser.close();
  server.kill();
  console.log('SMOKE TEST PASSED ✒');
}

main().catch((e) => {
  console.error('SMOKE TEST FAILED:', e.message);
  process.exit(1);
});
