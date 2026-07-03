// Boot: load the story graph, wire screens, register the service worker.
import { Game } from './game.js';
import { saveGet } from './save.js';
import { initAudio } from './sfx.js';

const chapterCache = new Map();
async function loadChapter(file) {
  if (!chapterCache.has(file)) {
    chapterCache.set(file, fetch(file).then((r) => r.json()));
  }
  return chapterCache.get(file);
}

async function boot() {
  const story = await fetch('data/story.json').then((r) => r.json());

  const canvas = document.getElementById('page');
  const game = new Game(canvas, story, loadChapter);
  window.__pz = game; // debug/test hook

  const titleEl = document.getElementById('title');
  const btnStart = document.getElementById('btn-start');
  const btnContinue = document.getElementById('btn-continue');
  const titleEndings = document.getElementById('title-endings');

  const saved = await saveGet('save2');
  if (saved && !saved.done && saved.chapterId && (saved.current > 0 || saved.chapterId !== story.start)) {
    btnContinue.classList.remove('hidden');
    btnStart.textContent = 'START OVER';
  }
  if (saved?.endingsFound?.length) {
    titleEndings.textContent = `ENDINGS FOUND: ${saved.endingsFound.length}/${story.endings.length}`;
    titleEndings.classList.remove('hidden');
  }

  btnStart.addEventListener('click', () => {
    initAudio();
    titleEl.classList.add('hidden');
    game.startFresh();
  });
  btnContinue.addEventListener('click', () => {
    initAudio();
    titleEl.classList.add('hidden');
    game.resume();
  });
  document.getElementById('btn-next').addEventListener('click', () => game.continueNext());
  document.getElementById('btn-again').addEventListener('click', () => game.restartBook());

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot();
