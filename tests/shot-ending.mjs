// Quick visual check: jump straight to the ch5 ending spread with chosen flags
// and screenshot it. Usage: node tests/shot-ending.mjs artist|escape|blank
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const FLAGSETS = {
  artist: ['route_sea', 'brush', 'mercy', 'savedSumi', 'finish'],
  escape: ['route_cut', 'nib', 'keptWeapon', 'eraseAll'],
  blank: ['route_sea', 'brush', 'slain', 'savedSumi', 'finish'],
};
const name = process.argv[2] || 'artist';
const PORT = 8500 + (process.pid % 50);

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
await page.evaluate((flags) => {
  for (const f of flags) window.__pz.setFlag(f);
  return window.__pz.beginChapter('ch5', 11); // the ending spread
}, FLAGSETS[name]);
await page.waitForFunction(() => window.__pz.phase === 'active' && window.__pz.current === 11, { timeout: 10000 });
await page.waitForTimeout(3200);
await page.screenshot({ path: `tests/shots/ending-${name}.png` });
await browser.close();
server.kill();
console.log(`shot: tests/shots/ending-${name}.png`);
