"use client";

// Small UI sounds synthesized with Web Audio. Created lazily on the first tap
// (browsers only allow audio after a user gesture).
let ac: AudioContext | null = null;
let enabled = true;

export function setSfxEnabled(on: boolean) { enabled = on; }

function ctx(): AudioContext | null {
  if (!enabled || typeof window === "undefined") return null;
  if (!ac) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ac = new AC(); } catch { return null; }
  }
  if (ac.state === "suspended") void ac.resume();
  return ac;
}

function tone(freq: number, start: number, dur: number, peak: number, type: OscillatorType = "sine", glideTo?: number) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime + start;
  const o = a.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

export const sfx = {
  tap: () => tone(880, 0, 0.07, 0.05, "sine", 660),
  next: () => { tone(520, 0, 0.09, 0.05); tone(780, 0.06, 0.12, 0.045); },
  correct: () => { tone(659.25, 0, 0.35, 0.09); tone(987.77, 0.08, 0.4, 0.08); tone(1318.5, 0.16, 0.55, 0.06); },
  wrong: () => { tone(220, 0, 0.18, 0.08, "triangle", 180); tone(185, 0.14, 0.25, 0.07, "triangle", 150); },
  complete: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.6, 0.07));
    tone(1567.98, 0.42, 0.9, 0.04);
  },
};
