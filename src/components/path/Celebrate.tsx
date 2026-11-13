"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { sfx } from "@/lib/sfx";
import s from "./path.module.css";

const COLORS = ["#0a6cff", "#3b8cff", "#5fd3e8", "#ffc83d", "#34c759", "#ff7a86", "#ffffff"];

/** Falling confetti; positions are random per mount. */
export function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100, dx: (Math.random() - 0.5) * 220, rot: (Math.random() - 0.5) * 1080,
    d: 1.8 + Math.random() * 1.6, delay: Math.random() * 0.5, color: COLORS[i % COLORS.length],
    w: 6 + Math.random() * 6, round: Math.random() < 0.3,
  })), [count]);
  return (
    <div className={s.confetti} aria-hidden>
      {pieces.map((p, i) => (
        <span key={i} className={s.piece} style={{
          left: `${p.left}%`, background: p.color, width: p.w, height: p.round ? p.w : p.w * 1.5, borderRadius: p.round ? "50%" : 2,
          ["--dx" as string]: `${p.dx}px`, ["--rot" as string]: `${p.rot}deg`, ["--d" as string]: `${p.d}s`, ["--delay" as string]: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}

/** Sound + a short buzz (Android). Both are skipped quietly when unavailable. */
export function cheer(big = false) {
  sfx.complete();
  try { navigator.vibrate?.(big ? [60, 60, 60, 60, 160] : [40, 50, 90]); } catch { /* not supported */ }
}

export function StepCelebration({ title, doneText, nextText, button, onClose }: {
  title: string; doneText: string; nextText?: string; button: string; onClose: () => void;
}) {
  useEffect(() => { cheer(); }, []);
  return createPortal(
    <>
      <Confetti />
      <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="cel-title" onClick={onClose}>
        <div className={s.card} onClick={(e) => e.stopPropagation()}>
          <div className={s.badge}><Icon name="check" size={44} /></div>
          <h2 id="cel-title" className="m-0 text-[30px] font-extrabold tracking-[-0.02em]">{title}</h2>
          <p className="m-0 mt-2 text-[17px] font-semibold">{doneText}</p>
          {nextText && <p className="m-0 mt-1.5 text-[15px] text-fg2">{nextText}</p>}
          <button type="button" autoFocus className="btn btn-primary mt-6 h-[58px] w-full text-[17px]" onClick={onClose}>{button}</button>
        </div>
      </div>
    </>,
    document.body,
  );
}

export function FinishScreen({ title, body, again, later, onAgain, onLater }: {
  title: string; body: string; again: string; later: string; onAgain: () => void; onLater: () => void;
}) {
  useEffect(() => { cheer(true); const t = setTimeout(() => cheer(true), 1600); return () => clearTimeout(t); }, []);
  return createPortal(
    <>
      <Confetti count={120} />
      <div className={s.finish} role="dialog" aria-modal="true" aria-labelledby="fin-title">
        <div className="w-full max-w-[420px]">
          <div className={s.trophy}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ffc83d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
            </svg>
          </div>
          <h2 id="fin-title" className="m-0 text-[34px] font-extrabold leading-tight tracking-[-0.03em]">{title}</h2>
          <p className="m-0 mx-auto mt-3 max-w-[34ch] text-[17px] text-white/85">{body}</p>
          <button type="button" autoFocus className="btn mt-8 h-[60px] w-full bg-white text-[17px] text-[#0a6cff]" onClick={onAgain}>{again}</button>
          <button type="button" className="mt-3 h-12 w-full text-[16px] font-semibold text-white/80" onClick={onLater}>{later}</button>
        </div>
      </div>
    </>,
    document.body,
  );
}
