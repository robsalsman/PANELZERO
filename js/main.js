// Boot: load chapter JSON, wire title/end screens, register service worker.
import { Game } from './game.js';
import { saveGet } from './save.js';
import { initAudio } from './sfx.js';

async function boot() {
  const res = await fetch('data/chapter1.json');
  const chapter = await res.json();

  const canvas = document.getElementById('page');
  const game = new Game(canvas, chapter);
  window.__pz = game; // debug/test hook

  const titleEl = document.getElementById('title');
  const endEl = document.getElementById('chapter-end');
  const btnStart = document.getElementById('btn-start');
  const btnContinue = document.getElementById('btn-continue');

  // offer Continue if a run is in progress
  const saved = await saveGet('progress-ch1');
  if (saved && !saved.done && saved.current > 0) {
    btnContinue.classList.remove('hidden');
    btnStart.textContent = 'START OVER';
  }

  btnStart.addEventListener('click', () => {
    initAudio();
    titleEl.classList.add('hidden');
    game.start(false);
  });
  btnContinue.addEventListener('click', () => {
    initAudio();
    titleEl.classList.add('hidden');
    game.start(true);
  });
  document.getElementById('btn-again').addEventListener('click', () => {
    endEl.classList.add('hidden');
    game.restart();
  });

  // PWA
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot();
