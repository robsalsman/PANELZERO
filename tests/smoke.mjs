// End-to-end playthrough test. A generic driver reads each panel's JSON
// definition and performs the REAL gesture for it (tap/swipe/hold/trace/choose)
// in mobile-sized headless Chromium, across chapters, asserting the expected
// ending. Fails on any console error. Retries panels if a gesture mistimes.
//
// Usage: node tests/smoke.mjs <scenario>   (scenario: artist | escape | blank)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 8321 + (process.pid % 50);
const URL = `http://127.0.0.1:${PORT}/`;

const SCENARIOS = {
  // sea route, recruit Goma, side chapter, empathy, finish together -> CO-AUTHORS
  coauthors: {
    startAt: { chapter: 'ch2', flags: [] },
    choices: {
      'ch2:p04': 0, 'ch2:p11': 0, 'ch3a:p11': 0, 'ch4:p09': 0,
      'g1:p11': 2, 'g2:p11': 0, 'g2:p13': 0, 's1:p04': 0, 's1:p08': 0,
      'g3:p09': 1, 'ch5:p13': 0,
    },
    failOnce: 'ch2:p02', // deliberately eat one hazard to test erase/redraw mid-story
    shotAfter: 'g2:p09',
    expect: 'THE CO-AUTHORS',
  },
  // cut route, every kill, no rest, resent, erase -> THE NEW HAND (ruthless 3)
  newhand: {
    startAt: { chapter: 'ch2', flags: [] },
    choices: {
      'ch2:p04': 1, 'ch2:p11': 1, 'ch3b:p11': 1, 'ch4:p09': 1,
      'g1:p11': 0, 'g2:p11': 1, 'g2:p13': 1, 'g3:p09': 0, 'ch5:p13': 2,
    },
    expect: 'THE NEW HAND',
  },
  // mercy + saved + recruit Yuri + side + empathy + give the pencil back -> THE PUBLISHED
  published: {
    startAt: { chapter: 'ch3a', flags: ['route_sea'] },
    choices: {
      'ch3a:p11': 0, 'ch4:p09': 0,
      'g1:p11': 1, 'g2:p11': 0, 'g2:p13': 0, 's1:p04': 0, 's1:p08': 0,
      'g3:p09': 1, 'ch5:p13': 1,
    },
    expect: 'THE PUBLISHED',
  },
};

const name = process.argv[2] || 'coauthors';
const scenario = SCENARIOS[name];
if (!scenario) {
  console.error(`unknown scenario ${name}`);
  process.exit(2);
}

function log(msg) {
  process.stdout.write(`  ${msg}\n`);
}

async function main() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
    cwd: new globalThis.URL('..', import.meta.url).pathname,
    stdio: 'ignore',
  });
  await new Promise((r) => setTimeout(r, 800));

  const browser = await chromium.launch({
    executablePath: process.env.PZ_CHROMIUM || '/opt/pw-browsers/chromium',
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

  const state = () => page.evaluate(() => ({
    phase: window.__pz.phase,
    chapterId: window.__pz.chapterId,
    current: window.__pz.current,
    fails: window.__pz.failsChapter,
    endVisible: !document.getElementById('chapter-end').classList.contains('hidden'),
  }));

  const panelDef = () => page.evaluate(() => {
    const g = window.__pz;
    const def = g.panels[g.current];
    const r = g.rects[g.current];
    return { def, rect: r, scroll: g.scroll.y, count: g.challenge?.count ?? 0 };
  });

  const toClient = (r, scroll, fx, fy) => ({ x: r.x + fx * r.w, y: r.y + fy * r.h - scroll });

  async function waitFor(cond, timeout = 15000, poll = 80) {
    const t0 = Date.now();
    for (;;) {
      const s = await state();
      if (cond(s)) return s;
      if (Date.now() - t0 > timeout) throw new Error(`timeout: ${JSON.stringify(s)}`);
      await page.waitForTimeout(poll);
    }
  }

  async function swipeGesture(dir) {
    const cx = 195;
    const cy = 480;
    const d = { left: [-130, 0], right: [130, 0], up: [0, -130], down: [0, 130] }[dir];
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 5; i++) {
      await page.mouse.move(cx + (d[0] * i) / 5, cy + (d[1] * i) / 5, { steps: 1 });
      await page.waitForTimeout(12);
    }
    await page.mouse.up();
  }

  // legacy ch1 tap anchors (mirror js/scenes.js)
  function ch1Hit(def, count) {
    switch (def.params.hit) {
      case 'kai': return { fx: 0.5, fy: 0.62 };
      case 'letterC': return { fx: 0.63, fy: 0.74 };
      case 'smudge': return { fx: 0.68 + Math.sin(count * 2.4) * 0.14, fy: 0.72 };
      default: return { fx: 0.5, fy: 0.5 };
    }
  }

  let failedOnce = false;

  // perform ONE attempt at the current panel's challenge
  async function attempt(info, key) {
    const { def, rect, scroll } = info;
    const p = def.params || {};
    switch (def.type) {
      case 'cutscene':
      case 'spread': {
        await page.waitForTimeout(600); // tappable at 0.15s now — readers set the pace
        const pt = toClient(rect, scroll, 0.5, 0.5);
        await page.mouse.click(pt.x, pt.y);
        break;
      }
      case 'choose': {
        await page.waitForTimeout(450); // bubbles land fast now
        const idx = scenario.choices[key] ?? 0;
        // mirror CHOICE_POS in js/verbs.js; per-option x/y overrides win
        const layout = (p.options?.length ?? 2) >= 3
          ? [[0.3, 0.14], [0.7, 0.3], [0.4, 0.46]]
          : [[0.27, 0.2], [0.73, 0.32]];
        const opt = p.options?.[idx];
        const pos = opt?.x != null ? [opt.x, opt.y] : (layout[idx] ?? layout[0]);
        const pt = toClient(rect, scroll, pos[0], pos[1]);
        await page.mouse.click(pt.x, pt.y);
        break;
      }
      case 'tap': {
        await page.waitForTimeout(250);
        for (let i = 0; i < p.count; i++) {
          const cur = await panelDef();
          let fx;
          let fy;
          if (p.target) {
            fx = p.target.x + (p.wobble ? Math.sin(cur.count * 2.4) * 0.14 : 0);
            fy = p.target.y;
          } else {
            ({ fx, fy } = ch1Hit(def, cur.count));
          }
          const pt = toClient(rect, scroll, fx, fy);
          await page.mouse.click(pt.x, pt.y);
          await page.waitForTimeout(240);
        }
        break;
      }
      case 'swipe': {
        if (scenario.failOnce === key && !failedOnce) {
          // eat the hazard on purpose: erase/redraw path
          failedOnce = true;
          await page.waitForTimeout((p.hazards[0].time + 0.5) * 1000);
          log(`  (deliberate fail at ${key} — erase/redraw)`);
          return;
        }
        let elapsed = 0;
        for (let i = 0; i < p.hazards.length; i++) {
          const hz = p.hazards[i];
          const swipeAt = elapsed + (hz.delay || 0) + 350 / 1000;
          await page.waitForTimeout(Math.max(0, swipeAt * 1000 - elapsed * 1000));
          const dir = hz.dir === 'any' ? 'left' : hz.dir;
          await swipeGesture(dir);
          elapsed = elapsed + (hz.delay || 0) + hz.time; // hazard crashes at its full time
          await page.waitForTimeout(Math.max(0, (elapsed - swipeAt) * 1000 + 120));
        }
        break;
      }
      case 'hold': {
        await page.waitForTimeout(250);
        const pt = toClient(rect, scroll, 0.5, 0.5);
        const before = await state();
        await page.mouse.move(pt.x, pt.y);
        await page.mouse.down();
        await page.waitForFunction(
          ([ch, cur]) => window.__pz.phase !== 'active' || window.__pz.chapterId !== ch || window.__pz.current !== cur,
          [before.chapterId, before.current],
          { timeout: 10000 }
        ).catch(() => {});
        await page.mouse.up();
        break;
      }
      case 'trace': {
        await page.waitForTimeout(300);
        const pts = p.path.map(([nx, ny]) => toClient(rect, scroll, nx, ny));
        await page.mouse.move(pts[0].x, pts[0].y);
        await page.mouse.down();
        for (let i = 0; i < pts.length - 1; i++) {
          for (let s = 1; s <= 8; s++) {
            await page.mouse.move(
              pts[i].x + ((pts[i + 1].x - pts[i].x) * s) / 8,
              pts[i].y + ((pts[i + 1].y - pts[i].y) * s) / 8,
              { steps: 1 }
            );
            await page.waitForTimeout(13);
          }
        }
        await page.mouse.up();
        break;
      }
    }
  }

  // ---- boot ----
  await page.goto(URL);
  await page.waitForSelector('#btn-start');
  await page.waitForFunction(() => window.__pz);
  await page.click('#btn-start');
  await waitFor((s) => s.phase !== 'title' && s.chapterId, 10000);

  if (scenario.startAt) {
    await page.evaluate(({ chapter, flags }) => {
      for (const f of flags) window.__pz.setFlag(f);
      return window.__pz.beginChapter(chapter);
    }, scenario.startAt);
    log(`jumped to ${scenario.startAt.chapter} (flags: ${scenario.startAt.flags.join(',') || 'none'})`);
  }

  // ---- main loop: play every panel until THE END ----
  let lastKey = '';
  let attempts = 0;
  const shots = new Set();
  for (let guard = 0; guard < 400; guard++) {
    const s = await waitFor((x) => x.phase === 'active' || x.endVisible, 20000);
    if (s.endVisible) {
      const btnNextHidden = await page.evaluate(() => document.getElementById('btn-next').classList.contains('hidden'));
      if (!btnNextHidden) {
        const title = await page.textContent('#end-title');
        const rank = await page.textContent('#rank-badge');
        const score = await page.textContent('#stat-score');
        if (!/^[SABC]$/.test(rank)) throw new Error(`bad rank "${rank}"`);
        if (!(parseInt(score.replace(/,/g, ''), 10) > 0)) throw new Error(`score not accumulating: "${score}"`);
        log(`${title} — rank ${rank}, score ${score}, fails ${await page.textContent('#stat-fails')}`);
        await page.click('#btn-next');
        await page.waitForTimeout(400);
        continue;
      }
      break; // finale screen
    }
    const info = await panelDef();
    const key = `${s.chapterId}:${info.def.id}`;
    if (key === lastKey) {
      attempts++;
      if (attempts > 5) throw new Error(`stuck on ${key}`);
    } else {
      attempts = 0;
      lastKey = key;
    }
    if (info.def.type === 'spread' && !shots.has(s.chapterId)) {
      shots.add(s.chapterId);
      await page.waitForTimeout(2600);
      await page.screenshot({ path: `tests/shots/${name}-${s.chapterId}-spread.png` });
    }
    await attempt(info, key);
    if (scenario.shotAfter === key) {
      await page.waitForTimeout(120);
      await page.screenshot({ path: `tests/shots/${name}-juice.png` });
    }
    // wait until the panel resolves (advance/erase) or stays active for retry
    await page.waitForTimeout(450);
  }

  // ---- finale assertions ----
  const endTitle = await page.textContent('#end-title');
  const endingsLine = await page.textContent('#end-endings');
  const finalScore = await page.textContent('#stat-score');
  log(`final score: ${finalScore}, rank ${await page.textContent('#rank-badge')}`);
  await page.screenshot({ path: `tests/shots/${name}-finale.png` });
  log(`finale: ${endTitle} | ${endingsLine}`);
  if (!endTitle.includes(scenario.expect)) {
    throw new Error(`expected ending "${scenario.expect}", got "${endTitle}"`);
  }
  if (scenario.failOnce && !failedOnce) throw new Error('failOnce scenario never executed');
  if (errors.length) throw new Error(`console/page errors:\n${errors.join('\n')}`);

  await browser.close();
  server.kill();
  console.log(`SCENARIO "${name}" PASSED ✒ (${scenario.expect})`);
}

main().catch((e) => {
  console.error(`SCENARIO "${name}" FAILED:`, e.message);
  process.exit(1);
});
