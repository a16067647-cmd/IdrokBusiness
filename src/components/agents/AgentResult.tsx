"use client";

import { useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Icon } from "@/components/ui/Icon";
import type { AgentOutput } from "@/lib/agents/core";

const DOT: Record<string, string> = {
  good: "bg-success-soft text-success-fg",
  warn: "bg-warn-soft text-warn-fg",
  risk: "bg-danger-soft text-danger-fg",
  info: "bg-soft-blue text-primary",
};
const SYMBOL: Record<string, "check" | "shield" | "x" | "chevron"> = { good: "check", warn: "shield", risk: "x", info: "chevron" };

export function AgentResult({ out }: { out: AgentOutput }) {
  const { t } = usePrefs();
  const [copied, setCopied] = useState(false);
  const list = (title: string, items: string[], ordered = false) => items.length > 0 && (
    <section className="mt-5">
      <h3 className="mb-2 mt-0 text-[15px] font-bold">{title}</h3>
      {ordered
        ? <ol className="m-0 grid gap-1.5 pl-5 text-[14px] leading-relaxed">{items.map((s, i) => <li key={i}>{s}</li>)}</ol>
        : <ul className="m-0 grid gap-1.5 pl-5 text-[14px] leading-relaxed">{items.map((s, i) => <li key={i}>{s}</li>)}</ul>}
    </section>
  );
  const copy = async () => {
    try { await navigator.clipboard.writeText(out.draft); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  return (
    <div className="text-fg">
      <p className="m-0 rounded-2xl bg-soft-blue p-4 text-[15px] leading-relaxed"><b className="mb-1 block text-[13px] uppercase tracking-[0.06em] text-primary">{t("agents.summary")}</b>{out.summary}</p>
      {out.sections.map((s, i) => (
        <section key={i} className="mt-5">
          <h3 className="mb-2 mt-0 text-[15px] font-bold">{s.title}</h3>
          <ul className="m-0 grid list-none gap-2 p-0">
            {s.items.map((it, j) => (
              <li key={j} className="flex items-start gap-2.5 text-[14px] leading-relaxed">
                <span className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full ${DOT[it.level] ?? DOT.info}`}><Icon name={SYMBOL[it.level] ?? "chevron"} size={12} strokeWidth={3} /></span>
                <span>{it.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {list(t("agents.nextSteps"), out.next_steps, true)}
      {out.verify.length > 0 && (
        <section className="mt-5 rounded-2xl bg-warn-soft p-4 text-warn-fg">
          <h3 className="mb-2 mt-0 flex items-center gap-2 text-[15px] font-bold"><Icon name="shield" size={16} />{t("agents.verify")}</h3>
          <ul className="m-0 grid gap-1.5 pl-5 text-[14px] leading-relaxed">{out.verify.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </section>
      )}
      {list(t("agents.assumptions"), out.assumptions)}
      {out.draft.trim() && (
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="m-0 text-[15px] font-bold">{t("agents.draft")}</h3>
            <button type="button" onClick={() => void copy()} className="btn btn-sm bg-track text-fg">{copied ? t("agents.copied") : t("agents.copy")}</button>
          </div>
          <pre className="m-0 whitespace-pre-wrap rounded-2xl bg-track p-4 font-sans text-[14px] leading-relaxed">{out.draft}</pre>
        </section>
      )}
      <p className="mb-0 mt-5 text-[12px] text-fg3">{t("agents.disclaimer")}</p>
    </div>
  );
}
