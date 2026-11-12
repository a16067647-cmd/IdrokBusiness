import type { MotionConfig, PresetName } from "./types";

/**
 * IDROK Motion Lab engine (Canvas 2D).
 * - one pool of particles allocated up front, no per-frame allocation
 * - delta-time with clamping after tab suspension
 * - spring/damper pointer field, bounded displacement
 * - scroll velocity nudges flow speed; scroll position adds layered parallax
 * - pauses when hidden or disabled; draws a single static frame instead
 */

interface Path {
  type: "wave" | "orbit";
  layer: 0 | 1 | 2;
  dir: 1 | -1;
  y0?: number; slope?: number; amp?: number; freq?: number; phase?: number; drift?: number;
  cx?: number; cy?: number; rx?: number; ry?: number; tilt?: number;
}
interface Particle {
  path: number; layer: 0 | 1 | 2; s0: number; v: number; off: number;
  size: number; a: number; kind: 0 | 1 | 2;
  dx: number; dy: number; vx: number; vy: number;
}
interface Pt { x: number; y: number }

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MotionStats { fps: number; points: number; running: boolean; preset: PresetName }

export class MotionField {
  private ctx: CanvasRenderingContext2D;
  private paths: Path[] = [];
  private P: Particle[] = [];
  private W = 0; private H = 0; private count = 0;
  private T = 0; private waveT = 0; private last = 0; private raf = 0;
  private running = false; private enabled = true; private disposed = false;
  private colors = ["rgb(10,108,255)", "rgb(72,86,112)", "rgb(230,140,30)"];
  private lineColor = "rgb(10,40,100)"; private alphaScale = 0.7; private glow = 0;
  private pointer = { x: 0, y: 0, active: false, k: 1 };
  private scrollY = 0; private scrollVel = 0; private lastScrollT = 0;
  private mix = 0; private targetMix = 0; private preset: PresetName = "hero";
  private fps = 60; private lastN = 0;
  private pt: Pt = { x: 0, y: 0 }; private ptTail: Pt = { x: 0, y: 0 }; private ptMid: Pt = { x: 0, y: 0 };
  private cleanup: Array<() => void> = [];

  constructor(private canvas: HTMLCanvasElement, private cfg: MotionConfig) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
    this.build();
    this.readTheme();
    this.resize();
    this.listen();
  }

  private build() {
    const rnd = mulberry32(this.cfg.seed);
    const R = (a: number, b: number) => a + (b - a) * rnd();
    for (let i = 0; i < 6; i++) {
      this.paths.push({
        type: "wave", layer: (i % 3) as 0 | 1 | 2,
        y0: 0.12 + i * 0.15 + R(-0.03, 0.03), slope: R(-0.22, 0.22), amp: R(0.025, 0.07),
        freq: R(0.5, 1.3), phase: R(0, TAU), drift: R(0.04, 0.1) * (rnd() < 0.5 ? -1 : 1),
        dir: rnd() < 0.75 ? 1 : -1,
      });
    }
    this.paths.push({ type: "orbit", layer: 1, cx: 0.82, cy: 0.26, rx: 0.48, ry: 0.12, tilt: -0.32, dir: 1 });
    this.paths.push({ type: "orbit", layer: 2, cx: 0.14, cy: 0.84, rx: 0.56, ry: 0.1, tilt: 0.22, dir: -1 });

    const { sizeRange, layers, warmShare, accentShare } = this.cfg;
    for (let i = 0; i < this.cfg.density.max; i++) {
      const path = Math.floor(rnd() * this.paths.length);
      const layer = this.paths[path].layer;
      const k = rnd();
      this.P.push({
        path, layer, s0: rnd(), v: R(0.6, 1.4), off: Math.pow(R(-1, 1), 3) * 22,
        size: R(sizeRange[0], sizeRange[1]) * layers.size[layer], a: R(0.5, 1),
        kind: k < warmShare ? 2 : k < warmShare + accentShare ? 0 : 1,
        dx: 0, dy: 0, vx: 0, vy: 0,
      });
    }
  }

  readTheme() {
    const cs = getComputedStyle(document.documentElement);
    const g = (n: string) => `rgb(${cs.getPropertyValue(n).trim()})`;
    this.colors = [g("--cv-a"), g("--cv-b"), g("--cv-warm")];
    this.lineColor = g("--cv-line");
    this.alphaScale = parseFloat(cs.getPropertyValue("--cv-alpha")) || 0.7;
    this.glow = parseFloat(cs.getPropertyValue("--cv-glow")) || 0;
    if (!this.running) this.draw(0);
  }

  resize() {
    this.W = window.innerWidth; this.H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.cfg.dprCap);
    this.canvas.width = Math.round(this.W * dpr);
    this.canvas.height = Math.round(this.H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const d = this.cfg.density;
    this.count = Math.max(d.min, Math.min(d.max, Math.round((this.W * this.H) / d.pxPerPoint)));
    if (!this.running) this.draw(0);
  }

  setPreset(name: PresetName) {
    this.preset = name;
    this.targetMix = name === "dashboard" ? 1 : 0;
    if (!this.running) { this.mix = this.targetMix; this.draw(0); }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on) this.start(); else this.stop();
  }

  stats(): MotionStats {
    return { fps: this.running ? Math.round(this.fps) : 0, points: this.lastN, running: this.running, preset: this.preset };
  }

  start() {
    if (this.running || !this.enabled || this.disposed || document.hidden) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    for (const q of this.P) { q.dx = q.dy = q.vx = q.vy = 0; }
    this.mix = this.targetMix;
    this.draw(0);
  }

  dispose() {
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.cleanup.forEach((f) => f());
    this.cleanup = [];
  }

  private on<K extends keyof WindowEventMap>(target: Window | Document | HTMLElement, type: K | string, fn: (e: never) => void, opts?: AddEventListenerOptions) {
    target.addEventListener(type, fn as EventListener, opts);
    this.cleanup.push(() => target.removeEventListener(type, fn as EventListener, opts));
  }

  private listen() {
    const setPtr = (e: PointerEvent) => {
      this.pointer.x = e.clientX; this.pointer.y = e.clientY; this.pointer.active = true;
      this.pointer.k = e.pointerType === "touch" ? this.cfg.pointer.touchScale : 1;
    };
    this.on(window, "pointermove", setPtr, { passive: true });
    this.on(window, "pointerdown", setPtr, { passive: true });
    this.on(window, "pointerup", (e: PointerEvent) => { if (e.pointerType === "touch") this.pointer.active = false; }, { passive: true });
    this.on(window, "pointercancel", () => { this.pointer.active = false; }, { passive: true });
    this.on(document.documentElement, "pointerleave", () => { this.pointer.active = false; });
    this.on(window, "blur", () => { this.pointer.active = false; });

    this.scrollY = window.scrollY; this.lastScrollT = performance.now();
    this.on(window, "scroll", () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(1, now - this.lastScrollT) / 1000;
      const v = Math.max(-6000, Math.min(6000, (y - this.scrollY) / dt));
      this.scrollVel = this.scrollVel * 0.6 + v * 0.4;
      this.scrollY = y; this.lastScrollT = now;
      if (!this.running) this.draw(0);
    }, { passive: true });

    let rz: ReturnType<typeof setTimeout> | undefined;
    this.on(window, "resize", () => { clearTimeout(rz); rz = setTimeout(() => this.resize(), 120); });
    this.on(document, "visibilitychange", () => {
      if (document.hidden) { this.running = false; cancelAnimationFrame(this.raf); } else this.start();
    });
  }

  private frame = (now: number) => {
    if (!this.running) return;
    let dt = (now - this.last) / 1000; this.last = now;
    if (!(dt > 0)) dt = 1 / 60;
    if (dt > 0.05) dt = 0.05;

    this.scrollVel *= Math.exp(-dt * 4);
    this.mix += (this.targetMix - this.mix) * (1 - Math.exp(-dt * 2.5));
    const { hero, dashboard } = this.cfg.presets;
    const speed = lerp(hero.speed, dashboard.speed, this.mix);
    const boost = Math.max(-1, Math.min(1, this.scrollVel / this.cfg.scroll.velocityRef));
    this.T += dt * this.cfg.flowSpeed * speed * Math.max(0.25, 1 + boost * this.cfg.scroll.boost);
    this.waveT += dt * speed * (1 + Math.abs(boost));

    this.draw(dt);
    this.fps = this.fps * 0.92 + (1 / dt) * 0.08;
    this.raf = requestAnimationFrame(this.frame);
  };

  private pathPoint(p: Path, s: number, off: number, shiftY: number, out: Pt) {
    const { W, H } = this;
    if (p.type === "wave") {
      out.x = (-0.08 + 1.16 * s) * W;
      out.y = H * (p.y0! + p.slope! * (s - 0.5) + p.amp! * Math.sin(TAU * p.freq! * s + p.phase! + this.waveT * p.drift! * TAU)) + off + shiftY;
    } else {
      const th = TAU * s;
      const rx = p.rx! * W + off, ry = p.ry! * H + off * 0.4;
      const x0 = Math.cos(th) * rx, y0 = Math.sin(th) * ry;
      const c = Math.cos(p.tilt!), sn = Math.sin(p.tilt!);
      out.x = p.cx! * W + x0 * c - y0 * sn;
      out.y = p.cy! * H + x0 * sn + y0 * c + shiftY;
    }
  }

  private draw(dt: number) {
    const { ctx, W, H, cfg, pt, ptTail, ptMid } = this;
    const { hero, dashboard } = cfg.presets;
    const L = cfg.layers;
    const opacity = lerp(hero.opacity, dashboard.opacity, this.mix) * this.alphaScale;
    const nActive = Math.round(this.count * lerp(hero.density, dashboard.density, this.mix));
    const sc = Math.min(this.scrollY, H * cfg.scroll.maxParallaxScreens);
    const shifts = [-sc * L.parallax[0], -sc * L.parallax[1], -sc * L.parallax[2]];

    ctx.clearRect(0, 0, W, H);

    ctx.lineWidth = 1;
    ctx.strokeStyle = this.lineColor;
    for (const p of this.paths) {
      ctx.globalAlpha = 0.07 * opacity * (0.6 + 0.4 * L.alpha[p.layer]);
      ctx.beginPath();
      for (let j = 0; j <= 64; j++) {
        this.pathPoint(p, j / 64, 0, shifts[p.layer], pt);
        if (j === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }

    const pc = cfg.pointer;
    const R2 = pc.radius * pc.radius;
    const S = pc.strength * this.pointer.k;
    const lim = pc.strength * 1.3;
    ctx.lineCap = "round";
    let drawn = 0;
    for (let i = 0; i < nActive; i++) {
      const q = this.P[i];
      const p = this.paths[q.path];
      const sp = q.v * L.speed[q.layer] * p.dir;
      let s = q.s0 + this.T * sp;
      s -= Math.floor(s);
      this.pathPoint(p, s, q.off, shifts[q.layer], pt);

      let tx = 0, ty = 0;
      if (this.pointer.active) {
        const ddx = pt.x - this.pointer.x, ddy = pt.y - this.pointer.y;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) + 0.001;
          const f = 1 - d / pc.radius;
          const ff = f * f * (3 - 2 * f) * S;
          tx = (ddx / d) * ff * 0.45;
          ty = (ddy / d) * ff;
        }
      }
      if (dt > 0) {
        q.vx += (pc.stiffness * (tx - q.dx) - pc.damping * q.vx) * dt;
        q.vy += (pc.stiffness * (ty - q.dy) - pc.damping * q.vy) * dt;
        q.dx = Math.max(-lim, Math.min(lim, q.dx + q.vx * dt));
        q.dy = Math.max(-lim, Math.min(lim, q.dy + q.vy * dt));
      }

      const hx = pt.x + q.dx, hy = pt.y + q.dy;
      if (hx < -40 || hx > W + 40 || hy < -40 || hy > H + 40) continue;
      drawn++;

      const tl = cfg.trail.length * q.v * (p.type === "orbit" ? 0.6 : 1) * Math.sign(sp);
      this.pathPoint(p, s - tl, q.off, shifts[q.layer], ptTail);
      this.pathPoint(p, s - tl * 0.5, q.off, shifts[q.layer], ptMid);

      const a = q.a * L.alpha[q.layer] * opacity;
      const col = this.colors[q.kind];
      ctx.strokeStyle = col;
      ctx.lineWidth = q.size * 0.9;
      ctx.globalAlpha = a * 0.28;
      ctx.beginPath();
      ctx.moveTo(ptTail.x + q.dx * 0.6, ptTail.y + q.dy * 0.6);
      ctx.quadraticCurveTo(ptMid.x + q.dx * 0.8, ptMid.y + q.dy * 0.8, hx, hy);
      ctx.stroke();

      ctx.fillStyle = col;
      if (this.glow && q.kind !== 1) {
        ctx.globalAlpha = a * 0.14;
        ctx.beginPath(); ctx.arc(hx, hy, q.size * 3.2, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(hx, hy, q.size, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.lastN = drawn;
  }
}
