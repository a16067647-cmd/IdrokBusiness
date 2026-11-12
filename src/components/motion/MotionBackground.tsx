"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MotionField } from "./engine";
import { businessMotion } from "./configs/business";
import type { PresetName } from "./types";
import { usePrefs } from "@/components/providers/PrefsProvider";

/**
 * Decorative background layer. Sits behind all content, ignores pointer events,
 * and follows `data-motion-preset="hero|dashboard"` on page sections.
 */
export function MotionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<MotionField | null>(null);
  const { motion, resolvedTheme } = usePrefs();
  const pathname = usePathname();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const lite = document.documentElement.classList.contains("lite");
      fieldRef.current = new MotionField(canvas, lite
        ? { ...businessMotion, dprCap: 1, density: { pxPerPoint: 9000, min: 40, max: 90 } }
        : businessMotion);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") console.error("[motion-lab] init failed", err);
      canvas.style.display = "none";
    }
    return () => { fieldRef.current?.dispose(); fieldRef.current = null; };
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => field.setEnabled(motion && !mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [motion]);

  useEffect(() => {
    // wait one frame so the new CSS variables are applied
    const id = requestAnimationFrame(() => fieldRef.current?.readTheme());
    return () => cancelAnimationFrame(id);
  }, [resolvedTheme]);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field || !("IntersectionObserver" in window)) return;
    const ratios = new Map<Element, number>();
    const pick = () => {
      let best: Element | null = null, br = 0;
      ratios.forEach((r, el) => { if (r > br) { br = r; best = el; } });
      const name = ((best as HTMLElement | null)?.dataset.motionPreset ?? "dashboard") as PresetName;
      field.setPreset(name === "hero" ? "hero" : "dashboard");
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) ratios.set(e.target, e.intersectionRatio);
      pick();
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    const id = requestAnimationFrame(() => {
      const els = document.querySelectorAll("[data-motion-preset]");
      if (els.length === 0) field.setPreset("dashboard");
      els.forEach((el) => io.observe(el));
    });
    return () => { cancelAnimationFrame(id); io.disconnect(); };
  }, [pathname]);

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(60% 45% at 85% 8%, var(--bg-glow), transparent 70%), radial-gradient(50% 40% at 5% 95%, var(--bg-glow), transparent 70%)" }} />
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 block h-full w-full" />
    </>
  );
}
