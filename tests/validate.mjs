// Static content validation: every panel's art ref resolves, types are known,
// verb params are well-formed, and the story graph routes to real chapters.
import { readFileSync } from 'node:fs';
import { scenes } from '../js/scenes.js';
import { setpieces } from '../js/setpieces.js';

const PAINTERS = { ...scenes, ...setpieces };
const TYPES = ['cutscene', 'spread', 'tap', 'swipe', 'hold', 'trace', 'choose'];
const ACTORS = ['kai', 'sumi', 'rejected', 'smudge', 'hand', 'pencil-shadow'];
const BGS = ['speedv', 'speedh', 'radial', 'toneL', 'toneD', 'drips', 'deadpanels', 'sea', 'desk', 'blank'];
const PROPS = ['sfx', 'star', 'raft', 'gate', 'inkbottle', 'brush', 'nib', 'pencil', 'tiles'];

const story = JSON.parse(readFileSync('data/story.json'));
const errs = [];

for (const [chId, ch] of Object.entries(story.chapters)) {
  const next = ch.next;
  if (typeof next === 'string' && !story.chapters[next]) errs.push(`${chId}: next -> unknown ${next}`);
  if (next && typeof next === 'object') {
    for (const [, to] of next.byFlag) if (!story.chapters[to]) errs.push(`${chId}: byFlag -> unknown ${to}`);
    if (!story.chapters[next.default]) errs.push(`${chId}: default -> unknown ${next.default}`);
  }

  const chapter = JSON.parse(readFileSync(ch.file));
  for (const p of chapter.panels) {
    const at = `${chId}/${p.id}`;
    if (!TYPES.includes(p.type)) errs.push(`${at}: unknown type ${p.type}`);
    if (typeof p.art === 'string') {
      if (!PAINTERS[p.art]) errs.push(`${at}: unknown painter '${p.art}'`);
    } else if (p.art) {
      const variants = [p.art, p.art.done, ...(Object.values(p.art.byFlag || {}))].filter(Boolean);
      for (const v of variants) {
        for (const bg of [].concat(v.bg || [])) if (!BGS.includes(bg)) errs.push(`${at}: unknown bg '${bg}'`);
        for (const a of v.actors || []) if (!ACTORS.includes(a.who)) errs.push(`${at}: unknown actor '${a.who}'`);
        for (const pr of v.props || []) if (!PROPS.includes(pr.type)) errs.push(`${at}: unknown prop '${pr.type}'`);
      }
    }
    if (p.type === 'tap' && !(p.params.target || p.params.hit)) errs.push(`${at}: tap needs target or hit`);
    if (p.type === 'tap' && !(p.params.count > 0)) errs.push(`${at}: tap needs count`);
    if (p.type === 'swipe' && !p.params.hazards?.length) errs.push(`${at}: swipe needs hazards`);
    if (p.type === 'trace' && !(Array.isArray(p.params.path) && p.params.path.length >= 2)) errs.push(`${at}: trace needs a path`);
    if (p.type === 'hold' && !(p.params.sweeps > 0)) errs.push(`${at}: hold needs sweeps`);
    if (p.type === 'choose' && p.params.options?.length !== 2) errs.push(`${at}: choose needs 2 options`);
    if ((p.type === 'cutscene' || p.type === 'spread') && !(p.params?.duration > 0)) errs.push(`${at}: cutscene needs duration`);
  }
}

if (errs.length) {
  console.error('CONTENT VALIDATION FAILED:\n' + errs.join('\n'));
  process.exit(1);
}
console.log('content validation OK — all art refs, types, params, and routing resolve');
