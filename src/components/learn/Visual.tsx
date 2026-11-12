"use client";

import type { CSSProperties } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Icon } from "@/components/ui/Icon";
import type { L10n, Visual as V } from "@/lib/lessons/types";

const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as CSSProperties;

export function Visual({ v }: { v: V }) {
  const { lang } = usePrefs();
  const tx = (s: L10n) => s[lang];

  switch (v.kind) {
    case "flow":
      return (
        <div className="relative px-1 pb-1 pt-3">
          <div className="absolute left-[8%] right-[8%] top-[34px] h-[2px] rounded-full bg-track" aria-hidden>
            <div className="anim-draw h-full rounded-full" style={{ ...d(200), background: "linear-gradient(90deg, var(--primary-top), var(--primary))" }} />
            <div className="absolute inset-0 overflow-visible">
              {[0, 800, 1600].map((delay) => (
                <span key={delay} className="anim-travel absolute -top-[3px] h-2 w-2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" style={d(delay + 900)} />
              ))}
            </div>
          </div>
          <ol className="relative m-0 grid list-none gap-2 p-0" style={{ gridTemplateColumns: `repeat(${v.steps.length}, minmax(0, 1fr))` }}>
            {v.steps.map((s, i) => (
              <li key={i} className="anim-pop flex flex-col items-center gap-2 text-center" style={d(150 + i * 220)}>
                <span className="glass grid h-11 w-11 place-items-center rounded-2xl text-sm font-extrabold text-primary" style={{ background: "var(--glass-strong)" }}>{i + 1}</span>
                <span className="text-[13px] font-semibold leading-tight">{tx(s)}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "checklist":
      return (
        <ul className="m-0 grid list-none gap-2 p-0">
          {v.items.map((it, i) => (
            <li key={i} className="anim-rise flex items-center gap-3 rounded-2xl bg-track px-3.5 py-2.5 text-[14px] font-medium" style={d(120 + i * 110)}>
              <span className={`grid h-6 w-6 flex-none place-items-center rounded-full ${v.tone === "good" ? "bg-success-soft text-success-fg" : "bg-danger-soft text-danger-fg"}`}>
                <Icon name={v.tone === "good" ? "check" : "x"} size={14} strokeWidth={3} />
              </span>
              {tx(it)}
            </li>
          ))}
        </ul>
      );
    case "compare":
      return (
        <div className="grid grid-cols-2 gap-2.5">
          {[v.left, v.right].map((col, ci) => (
            <div key={ci} className="anim-rise rounded-2xl bg-track p-3.5" style={d(120 + ci * 160)}>
              <div className={`mb-2 text-[13px] font-extrabold uppercase tracking-[0.06em] ${ci === 0 ? "text-primary" : "text-ai"}`}>{tx(col.title)}</div>
              <ul className="m-0 grid list-none gap-1.5 p-0">
                {col.items.map((it, i) => <li key={i} className="anim-rise text-[13px] leading-snug" style={d(300 + ci * 160 + i * 90)}>{tx(it)}</li>)}
              </ul>
            </div>
          ))}
        </div>
      );
    case "formula":
      return (
        <div className="rounded-2xl bg-track p-4">
          {v.caption && <div className="label-caps mb-2">{tx(v.caption)}</div>}
          <div className="grid gap-1.5">
            {v.lines.map((ln, i) => (
              <div key={i} className={`anim-rise flex items-baseline justify-between gap-3 ${ln.op === "=" ? "mt-1 border-t border-hairline pt-2.5 font-bold" : ""}`} style={d(120 + i * 140)}>
                <span className="flex min-w-0 items-baseline gap-2 text-[14px]">
                  <span className="num w-4 flex-none text-center text-fg3">{ln.op ?? ""}</span>
                  <span>{tx(ln.label)}</span>
                </span>
                {ln.value && <span className={`num text-[14px] ${ln.op === "=" ? "text-success-fg" : ""}`}>{ln.value}</span>}
              </div>
            ))}
          </div>
        </div>
      );
    case "big":
      return (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="anim-pop grid h-20 w-20 place-items-center rounded-[26px] text-white shadow-[0_16px_40px_-14px_rgba(10,108,255,0.8)]" style={{ ...d(100), background: "linear-gradient(180deg, var(--primary-top), var(--primary))" }}>
            <Icon name={v.icon} size={36} />
          </span>
          <span className="anim-rise max-w-[34ch] text-[15px] font-semibold" style={d(350)}>{tx(v.text)}</span>
        </div>
      );
  }
}
