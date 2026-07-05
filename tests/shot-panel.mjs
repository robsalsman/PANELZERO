// Screenshot an arbitrary panel: node tests/shot-panel.mjs <chapterId> <panelIndex> [flags,comma] [waitMs]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const [, , chapterId = 'ch1', idxArg = '0', flagsArg = '', waitArg = '1500'] = process.argv;
const idx = parseInt(idxArg, 10);
const flags = flagsArg ? flagsArg.split(',') : [];
const PORT = 8600 + (process.pid % 50);

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new globalThis.URL('..', import.meta.url).pathname,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch({ executablePath: process.env.PZ_CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await page.goto(`http://127.0.0.1:${PORT}/`);
await page.waitForFunction(() => window.__pz);
await page.click('#btn-start');
await page.waitForFunction(() => window.__pz.phase !== 'title');
await page.evaluate(([ch, i, fl]) => {
  for (const f of fl) window.__pz.setFlag(f);
  return window.__pz.beginChapter(ch, i);
}, [chapterId, idx, flags]);
await page.waitForFunction((i) => window.__pz.phase === 'active' && window.__pz.current === i, idx, { timeout: 10000 });
await page.waitForTimeout(parseInt(waitArg, 10));
const out = `tests/shots/panel-${chapterId}-${idx}.png`;
await page.screenshot({ path: out });
await browser.close();
server.kill();
console.log(`shot: ${out}`);
