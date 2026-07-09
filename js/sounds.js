let audioCtx = null;
let enabled = true;

export function initSounds() {
  enabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    enabled = false;
  }
}

export function setSounds(on) {
  enabled = on;
}

export function isSoundEnabled() {
  return enabled;
}

function ctx() {
  if (!enabled) return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      enabled = false;
      return null;
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, start, dur, type = 'sine', vol = 0.08, ramp = true) {
  const ac = ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  gain.gain.setValueAtTime(0, ac.currentTime + start);
  gain.gain.linearRampToValueAtTime(vol, ac.currentTime + start + 0.008);
  if (ramp) gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
}

function noise(start, dur, vol = 0.04) {
  const ac = ctx();
  if (!ac) return;
  const bufferSize = ac.sampleRate * dur;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  gain.gain.setValueAtTime(vol, ac.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(ac.currentTime + start);
}

export const sfx = {
  boot() {
    tone(392, 0, 0.15, 'sine', 0.06);
    tone(523, 0.12, 0.2, 'sine', 0.07);
    tone(659, 0.28, 0.35, 'sine', 0.08);
    tone(784, 0.45, 0.5, 'triangle', 0.06);
  },
  windowOpen() {
    tone(880, 0, 0.08, 'sine', 0.05);
    noise(0.02, 0.12, 0.03);
    tone(440, 0.05, 0.15, 'sine', 0.04);
  },
  windowClose() {
    tone(600, 0, 0.1, 'sine', 0.05);
    tone(300, 0.06, 0.2, 'sine', 0.06);
    noise(0.04, 0.18, 0.035);
  },
  minimize() {
    tone(520, 0, 0.06, 'sine', 0.05);
    tone(380, 0.05, 0.1, 'sine', 0.05);
    tone(220, 0.12, 0.35, 'sine', 0.07);
    noise(0.08, 0.28, 0.05);
  },
  maximize() {
    tone(500, 0, 0.06, 'square', 0.03);
    tone(700, 0.04, 0.1, 'sine', 0.05);
  },
  restore() {
    tone(350, 0, 0.08, 'sine', 0.05);
    tone(520, 0.06, 0.12, 'sine', 0.06);
    tone(700, 0.14, 0.2, 'sine', 0.05);
  },
  dock() {
    tone(1200, 0, 0.04, 'sine', 0.04);
    tone(800, 0.02, 0.06, 'sine', 0.03);
  },
  palette() {
    tone(1000, 0, 0.05, 'sine', 0.03);
  },
  click() {
    tone(900, 0, 0.03, 'sine', 0.025);
  },
  notify() {
    tone(740, 0, 0.12, 'sine', 0.05);
    tone(988, 0.14, 0.15, 'sine', 0.05);
  },
  drag() {
    tone(200, 0, 0.02, 'sine', 0.015);
  },
};
