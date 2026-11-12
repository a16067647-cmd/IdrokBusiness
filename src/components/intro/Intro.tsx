"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { IntroSound, OUTRO_AT } from "./introSound";

/**
 * Opening intro (~4 s): light streaks and glass shards converge, merge into the
 * logo tile, a sheen sweeps across, then the tile flies into the header logo.
 * Everything is a pure function of time t, so it can also be rendered frame by frame.
 */
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const eOut = (x: number) => 1 - Math.pow(1 - x, 3);
const eIn = (x: number) => x * x * x;
const eInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eBack = (x: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

const SHARD_FROM: Array<[number, number, number]> = [[-0.55, -0.35, -28], [0.55, -0.18, 22], [0.05, 0.5, 12]];
const PARTS = (() => {
  let s = 7;
  const rr = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  return Array.from({ length: 72 }, () => ({ a: rr() * Math.PI * 2, r: 0.75 + rr() * 0.5, ta: 0.45 + rr() * 0.5, w: 0.6 + rr() * 1.4, c: rr() < 0.35, spin: (rr() - 0.5) * 1.2 }));
})();

export function Intro() {
  const { t, introNonce } = usePrefs();
  const [visible, setVisible] = useState(true);
  const [needsTap, setNeedsTap] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLParagraphElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const shardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const sound = useRef<IntroSound | null>(null);
  const anim = useRef({ raf: 0, startAt: 0, W: 0, H: 0, tx: 0, ty: 0, ts: 0.15, reduced: false, duration: 4.2 });

  const measure = useCallback(() => {
    const a = anim.current;
    a.W = window.innerWidth; a.H = window.innerHeight;
    const fx = fxRef.current;
    if (fx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      fx.width = Math.round(a.W * dpr); fx.height = Math.round(a.H * dpr);
      fx.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const logo = document.querySelector("[data-brand-logo]");
    const size = stageRef.current?.offsetWidth || 200;
    if (logo) {
      const r = logo.getBoundingClientRect();
      a.tx = r.left + r.width / 2 - a.W / 2;
      a.ty = r.top + r.height / 2 - a.H * 0.46;
      a.ts = r.width / size;
    } else { a.tx = 0; a.ty = -a.H * 0.4; a.ts = 0.15; }
  }, []);

  const drawFx = useCallback((time: number, alpha: number) => {
    const fx = fxRef.current, ctx = fx?.getContext("2d");
    if (!ctx) return;
    const { W, H } = anim.current;
    ctx.clearRect(0, 0, W, H);
    if (alpha <= 0) return;
    const cx = W / 2, cy = H * 0.46, R0 = Math.max(W, H) * 0.75;
    ctx.lineCap = "round";
    for (const p of PARTS) {
      const k = seg(time, 0, p.ta);
      if (k >= 1) continue;
      const e = eIn(k), r = R0 * p.r * (1 - e), a = p.a + p.spin * (1 - e);
      const r2 = Math.min(R0 * p.r, r + 40 + 120 * e);
      ctx.globalAlpha = alpha * (0.25 + 0.75 * e) * seg(time, 0, 0.15);
      ctx.strokeStyle = p.c ? "rgb(200,214,240)" : "rgb(92,156,255)";
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
    }
    const rk = seg(time, 0.92, 1.7);
    if (rk > 0 && rk < 1) {
      const size = stageRef.current?.offsetWidth || 200;
      ctx.globalAlpha = alpha * (1 - rk) * 0.7;
      ctx.strokeStyle = "rgb(120,176,255)";
      ctx.lineWidth = 2 * (1 - rk) + 0.5;
      ctx.beginPath(); ctx.arc(cx, cy, size * 0.5 + size * 0.9 * eOut(rk), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, []);

  const render = useCallback((time: number) => {
    const a = anim.current;
    const tile = tileRef.current, tag = tagRef.current, bg = bgRef.current, actions = actionsRef.current, sheen = sheenRef.current;
    if (!tile || !tag || !bg || !actions || !sheen) return;
    if (a.reduced) {
      const fin = seg(time, 1.2, 1.8);
      shardRefs.current.forEach((s) => { if (s) s.style.opacity = "0"; });
      tile.style.transform = "none"; tile.style.opacity = String(1 - fin);
      tag.style.transform = "none"; tag.style.opacity = String(1 - fin);
      bg.style.opacity = String(1 - fin); actions.style.opacity = String(1 - fin);
      drawFx(0, 0);
      return;
    }
    const pin = eOut(seg(time, 0, 0.95));
    shardRefs.current.forEach((s, i) => {
      if (!s) return;
      const f = SHARD_FROM[i];
      s.style.transform = `translate(${(f[0] * a.W * (1 - pin)).toFixed(1)}px,${(f[1] * a.H * (1 - pin)).toFixed(1)}px) rotate(${(f[2] * (1 - pin)).toFixed(2)}deg) scale(${(0.55 + 0.45 * pin).toFixed(3)})`;
      s.style.opacity = (seg(time, 0, 0.3) * (1 - seg(time, 0.9, 1.25))).toFixed(3);
    });
    const tin = seg(time, 0.85, 1.45);
    const out = eInOut(seg(time, OUTRO_AT, 4.15));
    const sc = (0.7 + 0.3 * eBack(tin)) * (1 - out) + a.ts * out;
    tile.style.transform = `translate(${(a.tx * out).toFixed(1)}px,${(a.ty * out).toFixed(1)}px) scale(${sc.toFixed(4)})`;
    tile.style.opacity = seg(time, 0.85, 1.1).toFixed(3);
    sheen.style.transform = `translateX(${(-120 + 240 * eInOut(seg(time, 1.5, 2.3))).toFixed(1)}%)`;
    const tg = eOut(seg(time, 1.75, 2.3));
    tag.style.opacity = (tg * (1 - seg(time, 3.15, 3.5))).toFixed(3);
    tag.style.transform = `translateY(${((1 - tg) * 12).toFixed(1)}px)`;
    bg.style.opacity = (1 - seg(time, 3.55, 4.15)).toFixed(3);
    actions.style.opacity = (1 - seg(time, 3.15, 3.45)).toFixed(3);
    drawFx(time, 1 - seg(time, 3.3, 3.9));
  }, [drawFx]);

  const finish = useCallback(() => {
    cancelAnimationFrame(anim.current.raf);
    document.documentElement.classList.remove("intro-active");
    setVisible(false);
  }, []);

  const play = useCallback((withSound: boolean) => {
    const a = anim.current;
    cancelAnimationFrame(a.raf);
    a.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    a.duration = a.reduced ? 1.8 : 4.2;
    document.documentElement.classList.add("intro-active");
    setVisible(true);
    requestAnimationFrame(() => {
      measure();
      render(0);
      if (withSound) sound.current?.play(a.reduced);
      a.startAt = performance.now();
      const tick = (now: number) => {
        const time = (now - a.startAt) / 1000;
        render(Math.min(time, a.duration));
        if (time >= a.duration) { finish(); return; }
        a.raf = requestAnimationFrame(tick);
      };
      a.raf = requestAnimationFrame(tick);
    });
  }, [measure, render, finish]);

  // First launch: show the first frame immediately, then try to unlock sound.
  useEffect(() => {
    sound.current = new IntroSound();
    document.documentElement.classList.add("intro-active");
    measure(); render(0);
    let cancelled = false;
    sound.current.unlock().then((ok) => {
      if (cancelled) return;
      setNeedsTap(!ok && !!sound.current?.context());
      play(ok);
    });
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(anim.current.raf);
      sound.current?.stop();
      document.documentElement.classList.remove("intro-active");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playWithSound = useCallback(() => {
    const ac = sound.current?.context();
    if (!ac) { play(false); return; }
    ac.resume().then(() => { setNeedsTap(ac.state !== "running"); play(ac.state === "running"); }, () => play(false));
  }, [play]);

  // Replay from Settings.
  useEffect(() => { if (introNonce > 0) playWithSound(); }, [introNonce, playWithSound]);

  const skip = () => {
    sound.current?.stop();
    const a = anim.current;
    const time = (performance.now() - a.startAt) / 1000;
    if (a.reduced) { finish(); return; }
    if (time < OUTRO_AT) a.startAt = performance.now() - OUTRO_AT * 1000;
  };

  if (!visible) return null;
  return (
    <div ref={rootRef} role="dialog" aria-label={t("app.name")} className="fixed inset-0 z-50 overflow-hidden text-[#EEF2FA]" style={{ ["--tile" as string]: "min(46vw, 220px)" }}>
      <div ref={bgRef} className="absolute inset-0" style={{ background: "radial-gradient(55% 40% at 50% 45%, rgba(10,108,255,0.32), transparent 70%), #0B1022" }} />
      <canvas ref={fxRef} aria-hidden className="absolute inset-0 block h-full w-full" />
      <div ref={stageRef} className="absolute left-1/2 top-[46%]" style={{ width: "var(--tile)", height: "var(--tile)", margin: "calc(var(--tile) / -2) 0 0 calc(var(--tile) / -2)" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} ref={(el) => { shardRefs.current[i] = el; }} className="absolute inset-0 rounded-[28%] opacity-0"
            style={{ background: "rgba(120,170,255,0.16)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 20px 50px -20px rgba(0,0,0,0.6)", willChange: "transform, opacity" }} />
        ))}
        <div ref={tileRef} className="absolute inset-0 overflow-hidden rounded-[24%] opacity-0"
          style={{ boxShadow: "0 30px 80px -20px rgba(10,108,255,0.7), 0 0 0 1px rgba(255,255,255,0.18)", willChange: "transform, opacity" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={t("app.name")} className="block h-full w-full" />
          <div ref={sheenRef} className="absolute -inset-[20%]" style={{ background: "linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.55) 50%, transparent 62%)", transform: "translateX(-120%)" }} />
        </div>
      </div>
      <p ref={tagRef} className="absolute inset-x-0 m-0 px-6 text-center font-semibold tracking-[-0.01em] opacity-0"
        style={{ top: "calc(46% + var(--tile) / 2 + 30px)", fontSize: "clamp(16px, 4.2vw, 20px)", color: "rgba(238,242,250,0.86)" }}>
        {t("app.tagline")}
      </p>
      <div ref={actionsRef} className="absolute inset-x-0 flex flex-wrap justify-center gap-2.5 px-4" style={{ bottom: "calc(28px + env(safe-area-inset-bottom, 0px))" }}>
        {needsTap && (
          <button type="button" onClick={playWithSound} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-[13px] font-semibold backdrop-blur-md active:scale-[0.96]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M11 5L6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>
            {t("intro.sound")}
          </button>
        )}
        <button type="button" onClick={skip} className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/10 px-4 text-[13px] font-semibold backdrop-blur-md active:scale-[0.96]">
          {t("intro.skip")}
        </button>
      </div>
    </div>
  );
}
