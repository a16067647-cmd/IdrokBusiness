// Synthesized intro sounds (Web Audio). No audio files, nothing to license.
// Timeline matches Intro.tsx: whoosh in → merge thump + chime → sparkle → whoosh out.

export const OUTRO_AT = 3.35;
/** The intro timeline plays this much faster than its design (≈2.7 s in total). */
export const SPEED = 1.55;

export class IntroSound {
  private ac: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private ir: AudioBuffer | null = null;
  private master: GainNode | null = null;
  private verb: ConvolverNode | null = null;

  context(): AudioContext | null {
    if (this.ac) return this.ac;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { this.ac = new AC(); } catch { this.ac = null; }
    return this.ac;
  }

  /** Tries to unlock audio. Browsers allow it only after a tap; resolves with whether sound can play. */
  async unlock(timeoutMs = 200): Promise<boolean> {
    const ac = this.context();
    if (!ac) return false;
    if (ac.state !== "running") {
      try { await Promise.race([ac.resume(), new Promise((r) => setTimeout(r, timeoutMs))]); } catch { /* blocked */ }
    }
    return ac.state === "running";
  }

  private buffers(ac: AudioContext) {
    if (this.noise) return;
    const sr = ac.sampleRate;
    this.noise = ac.createBuffer(1, Math.floor(sr * 1.5), sr);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const len = Math.floor(sr * 2.2);
    this.ir = ac.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const c = this.ir.getChannelData(ch);
      for (let i = 0; i < len; i++) c[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
  }

  stop() {
    const ac = this.ac, m = this.master;
    if (!ac || !m) return;
    this.master = null;
    m.gain.cancelScheduledValues(ac.currentTime);
    m.gain.setTargetAtTime(0, ac.currentTime, 0.06);
    setTimeout(() => { try { m.disconnect(); } catch { /* already gone */ } }, 600);
  }

  play(reduced: boolean) {
    const ac = this.ac;
    if (!ac || ac.state !== "running") return;
    this.stop();
    this.buffers(ac);
    const master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
    const verb = ac.createConvolver(); verb.buffer = this.ir;
    const wet = ac.createGain(); wet.gain.value = 0.35; verb.connect(wet).connect(master);
    this.master = master; this.verb = verb;
    const t0 = ac.currentTime + 0.02;

    if (reduced) { this.chime(t0 + 0.1); return; }
    this.noiseHit(t0 + 0.05 / SPEED, 1.0, "bandpass", 350, 2600, 0.9, 0.5, 0.7);
    const tg = t0 + 0.95 / SPEED;
    const o = ac.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(110, tg); o.frequency.exponentialRampToValueAtTime(48, tg + 0.35);
    const og = ac.createGain(); this.env(og, tg, 0.7, 0.015, 0.43);
    o.connect(og).connect(master); o.start(tg); o.stop(tg + 0.5);
    this.chime(t0 + 1.0 / SPEED);
    this.noiseHit(t0 + 1.55 / SPEED, 0.8, "highpass", 6000, 6000, 0.7, 0.12, 0.25);
    this.noiseHit(t0 + OUTRO_AT / SPEED, 0.75, "bandpass", 1800, 420, 0.8, 0.18, 0.3);
  }

  private env(g: GainNode, t: number, peak: number, attack: number, release: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  }

  private noiseHit(t: number, dur: number, type: BiquadFilterType, f0: number, f1: number, q: number, peak: number, attack: number) {
    const ac = this.ac!, master = this.master!, verb = this.verb!;
    const n = ac.createBufferSource(); n.buffer = this.noise;
    const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.85);
    const g = ac.createGain(); this.env(g, t, peak, attack, dur - attack);
    n.connect(f).connect(g); g.connect(master); g.connect(verb);
    n.start(t); n.stop(t + dur + 0.05);
  }

  private chime(tc0: number) {
    const ac = this.ac!, master = this.master!, verb = this.verb!;
    const notes: Array<[number, number]> = [[659.25, 0], [987.77, 0.07], [1318.51, 0.14], [1975.53, 0.24]];
    notes.forEach(([f, dly], i) => {
      const tc = tc0 + dly;
      const partials: Array<[number, number, number]> = [[1, 0.16, 1.8], [2.01, 0.05, 0.9]];
      for (const [m, pk, rel] of partials) {
        const os = ac.createOscillator(); os.type = "sine"; os.frequency.value = f * m;
        const g = ac.createGain(); this.env(g, tc, pk * (1 - i * 0.12), 0.01, rel);
        os.connect(g); g.connect(master); g.connect(verb);
        os.start(tc); os.stop(tc + rel + 0.1);
      }
    });
  }
}
