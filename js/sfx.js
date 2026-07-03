// Procedural WebAudio SFX — no asset files. Ink scratch, page turn, erase, hit, complete tick.
let ctx = null;

export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
}

function noiseBuffer(seconds) {
  const rate = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.max(1, (seconds * rate) | 0), rate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function playNoise({ dur = 0.15, freq = 2000, q = 1, gain = 0.25, sweepTo = null }) {
  if (!ctx || ctx.state === 'suspended') ctx?.resume?.();
  if (!ctx) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(dur);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, ctx.currentTime + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start();
}

function playTone({ freq = 440, dur = 0.12, type = 'square', gain = 0.12, slideTo = null }) {
  if (!ctx || ctx.state === 'suspended') ctx?.resume?.();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

export const sfx = {
  ink()      { playNoise({ dur: 0.09, freq: 4200, q: 2, gain: 0.12 }); },           // pen scratch (tap feedback)
  draw()     { playNoise({ dur: 0.45, freq: 3200, q: 1.2, gain: 0.08, sweepTo: 5000 }); }, // panel inking in
  erase()    { playNoise({ dur: 0.55, freq: 900, q: 0.7, gain: 0.2, sweepTo: 400 }); },    // the Hand erasing (fail)
  hit()      { playTone({ freq: 130, dur: 0.14, type: 'square', gain: 0.18, slideTo: 60 }); }, // impact
  complete() { playTone({ freq: 660, dur: 0.09, gain: 0.1 }); setTimeout(() => playTone({ freq: 990, dur: 0.14, gain: 0.1 }), 70); },
  page()     { playNoise({ dur: 0.4, freq: 1400, q: 0.6, gain: 0.1, sweepTo: 500 }); },    // page turn / whoosh
};

export function buzz(ms = 20) {
  try { navigator.vibrate?.(ms); } catch { /* iOS: no-op */ }
}
