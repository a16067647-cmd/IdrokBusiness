"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, Pill } from "@/components/ui/Glass";
import { Icon, type IconName } from "@/components/ui/Icon";
import { AgentResult } from "@/components/agents/AgentResult";
import { AGENT_FIELDS, AGENT_IDS, type AgentId, type AgentInput, type AgentOutput } from "@/lib/agents/core";
import { agentStatus, recentRuns, runAgent, type AgentStatus, type RunRow } from "@/lib/agents/client";
import type { MessageKey } from "@/lib/i18n";

const ICONS: Record<AgentId, IconName> = { discovery: "sparkle", market: "chart", supplier: "globe", risk: "shield", manager: "clipboard" };

export default function AgentsPage() {
  const { t, lang } = usePrefs();
  const { session } = useAuth();
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [active, setActive] = useState<AgentId | null>(null);
  const [form, setForm] = useState<{ interests: string; product: string; details: string; quantity: string }>({ interests: "", product: "", details: "", quantity: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentOutput | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);

  const refresh = useCallback(async () => {
    setStatus(await agentStatus());
    setRuns(await recentRuns());
  }, []);
  useEffect(() => { if (session) void refresh(); }, [session, refresh]);

  // Deep link from a product: /agents?agent=risk&product=...
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const a = q.get("agent") as AgentId | null;
    if (a && AGENT_IDS.includes(a)) { setActive(a); setForm((f) => ({ ...f, product: q.get("product") ?? "" })); }
  }, []);

  const open = (a: AgentId) => { setActive(a); setResult(null); setError(null); };
  const errText = (code: string, limit?: number) => {
    const key = `agents.err.${code}` as MessageKey;
    return ["not_configured", "daily_limit", "missing_input", "refused", "busy"].includes(code) ? t(key, { limit: limit ?? "" }) : t("agents.err.generic");
  };

  const run = async () => {
    if (!active) return;
    setBusy(true); setError(null); setResult(null);
    const input: AgentInput = { interests: form.interests, product: form.product, details: form.details, quantity: form.quantity ? Number(form.quantity) : undefined };
    const r = await runAgent(active, input, lang);
    setBusy(false);
    if (r.ok) { setResult(r.output); setStatus((s) => (s ? { ...s, used: r.used, limit: r.limit } : s)); setRuns(await recentRuns()); }
    else setError(errText(r.error, r.limit));
  };

  if (!session) {
    return <div data-motion-preset="dashboard" className="pt-6"><h1 className="m-0 mb-4 text-[30px] font-extrabold tracking-[-0.03em]">{t("agents.title")}</h1><Card><p className="m-0 text-sm text-fg2">{t("agents.signin")}</p></Card></div>;
  }

  const fieldLabel: Record<string, MessageKey> = { interests: "agents.field.interests", product: "agents.field.product", details: "agents.field.details", quantity: "agents.field.quantity" };
  const placeholder: Record<string, MessageKey | undefined> = { interests: "agents.field.interestsPh", product: "agents.field.productPh" };

  return (
    <div data-motion-preset="dashboard" className="pt-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-[60ch]">
          <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.03em]">{t("agents.title")}</h1>
          <p className="m-0 mt-1 text-[15px] text-fg2">{t("agents.lead")}</p>
        </div>
        {status && <Pill tone="blue">{t("agents.usage", { used: status.used, limit: status.limit })}</Pill>}
      </div>
      {status && !status.configured && <p className="mb-4 flex items-start gap-2 rounded-2xl bg-warn-soft p-4 text-sm text-warn-fg"><Icon name="lock" size={16} className="mt-0.5 flex-none" />{t("agents.notConfigured")}</p>}

      {!active ? (
        <>
          <div className="grid grid-cols-1 gap-3">
            {AGENT_IDS.map((a) => (
              <button key={a} type="button" onClick={() => open(a)} className="glass flex items-start gap-3.5 rounded-card p-5 text-left transition-transform active:scale-[0.98]">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-soft-blue text-primary"><Icon name={ICONS[a]} size={20} /></span>
                <span className="min-w-0"><b className="block text-[18px]">{t(`agent.${a}.name` as MessageKey)}</b><span className="text-[13px] text-fg2">{t(`agent.${a}.desc` as MessageKey)}</span></span>
              </button>
            ))}
          </div>
          <h2 className="mb-3 mt-8 text-xl font-extrabold">{t("agents.history")}</h2>
          {runs.length === 0 ? <p className="text-sm text-fg3">{t("agents.historyEmpty")}</p> : (
            <ul className="glass m-0 list-none overflow-hidden rounded-card p-0">
              {runs.map((r) => (
                <li key={r.id} className="border-b border-hairline last:border-b-0">
                  <button type="button" disabled={!r.output} onClick={() => { setActive(r.agent); setResult(r.output); setError(null); }} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-soft-blue text-primary"><Icon name={ICONS[r.agent]} size={16} /></span>
                    <span className="min-w-0 flex-1"><b className="block truncate text-[14px]">{t(`agent.${r.agent}.name` as MessageKey)}</b><span className="block truncate text-[12px] text-fg3">{r.input.product || r.input.interests || "—"} · {r.created_at.slice(0, 16).replace("T", " ")}</span></span>
                    <Icon name="chevron" size={16} className="text-fg3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="mx-auto max-w-[720px]">
          <button type="button" onClick={() => { setActive(null); setResult(null); setError(null); }} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"><Icon name="back" size={16} />{t("agents.back")}</button>
          <Card className="mb-4">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-soft-blue text-primary"><Icon name={ICONS[active]} size={20} /></span>
              <div><h2 className="m-0 text-lg font-bold">{t(`agent.${active}.name` as MessageKey)}</h2><p className="m-0 text-[13px] text-fg2">{t(`agent.${active}.desc` as MessageKey)}</p></div>
            </div>
            <div className="grid gap-3">
              {AGENT_FIELDS[active].map((f) => (
                <label key={f} className="grid gap-1.5">
                  <span className="text-[13px] font-semibold text-fg2">{t(fieldLabel[f])}</span>
                  {f === "details"
                    ? <textarea id={`ag-${f}`} className="field h-20 py-2.5" maxLength={500} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
                    : <input id={`ag-${f}`} className={`field ${f === "quantity" ? "num" : ""}`} inputMode={f === "quantity" ? "numeric" : undefined} maxLength={500}
                        placeholder={placeholder[f] ? t(placeholder[f]!) : undefined}
                        value={form[f as "interests" | "product" | "quantity"]} onChange={(e) => setForm({ ...form, [f]: f === "quantity" ? e.target.value.replace(/\D/g, "") : e.target.value })} />}
                </label>
              ))}
              <button type="button" className="btn btn-primary mt-1" disabled={busy || status?.configured === false} onClick={() => void run()}>
                {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden /> : <Icon name="sparkle" size={18} />}
                {busy ? t("agents.running") : t("agents.run")}
              </button>
              {error && <p role="alert" className="m-0 rounded-2xl bg-danger-soft p-3 text-sm text-danger-fg">{error}</p>}
            </div>
          </Card>
          {result && <Card><AgentResult out={result} /></Card>}
        </div>
      )}
    </div>
  );
}
