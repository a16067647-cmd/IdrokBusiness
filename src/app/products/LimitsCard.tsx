"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Card, Pill } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { limitsStore, setLimits, type UserLimits } from "@/lib/store/products";
import type { MessageKey } from "@/lib/i18n";
import { money } from "@/lib/format";

export function LimitsCard() {
  const { t, lang } = usePrefs();
  const limits = limitsStore.use();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserLimits>(limits);
  useEffect(() => { if (!editing) setDraft(limits); }, [limits, editing]);

  const num = (s: string) => { const v = parseFloat(s.replace(",", ".")); return Number.isFinite(v) && v > 0 ? v : 0; };
  const row = (label: string, value: string, input?: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3 border-b border-hairline py-3 text-sm last:border-b-0">
      <span className="text-fg2">{label}</span>
      {editing && input ? input : <span className="num text-[13px] font-semibold">{value}</span>}
    </div>
  );
  const box = (v: number, on: (n: number) => void, id: string) => (
    <input id={id} className="field num h-10 w-32 text-right" inputMode="decimal" defaultValue={String(v)} onChange={(e) => on(num(e.target.value))} />
  );

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <p className="m-0 max-w-[52ch] text-sm text-fg2">{t("limits.body")}</p>
        {editing
          ? <div className="flex gap-2">
              <button type="button" className="btn btn-sm bg-track text-fg" onClick={() => setEditing(false)}>{t("common.cancel")}</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => { setLimits(draft); setEditing(false); }}>{t("common.save")}</button>
            </div>
          : <button type="button" className="btn btn-sm bg-track text-fg" onClick={() => setEditing(true)}><Icon name="gear" size={16} />{t("common.edit")}</button>}
      </div>
      {row(`${t("limits.maxUnitCost")} · Amazon`, money(limits.usd.maxUnitCost, "amazon", lang), box(draft.usd.maxUnitCost, (n) => setDraft((d) => ({ ...d, usd: { ...d.usd, maxUnitCost: n } })), "l-uc-usd"))}
      {row(`${t("limits.maxOrderBudget")} · Amazon`, money(limits.usd.maxOrderBudget, "amazon", lang), box(draft.usd.maxOrderBudget, (n) => setDraft((d) => ({ ...d, usd: { ...d.usd, maxOrderBudget: n } })), "l-ob-usd"))}
      {row(`${t("limits.maxUnitCost")} · Uzum`, money(limits.uzs.maxUnitCost, "uzum", lang), box(draft.uzs.maxUnitCost, (n) => setDraft((d) => ({ ...d, uzs: { ...d.uzs, maxUnitCost: n } })), "l-uc-uzs"))}
      {row(`${t("limits.maxOrderBudget")} · Uzum`, money(limits.uzs.maxOrderBudget, "uzum", lang), box(draft.uzs.maxOrderBudget, (n) => setDraft((d) => ({ ...d, uzs: { ...d.uzs, maxOrderBudget: n } })), "l-ob-uzs"))}
      {row(t("limits.maxWeight"), `${limits.usd.maxWeightKg} kg`, box(draft.usd.maxWeightKg, (n) => setDraft((d) => ({ ...d, usd: { ...d.usd, maxWeightKg: n } })), "l-w"))}
      {row(t("limits.maxLongest"), `${limits.usd.maxLongestCm} sm`, box(draft.usd.maxLongestCm, (n) => setDraft((d) => ({ ...d, usd: { ...d.usd, maxLongestCm: n } })), "l-s"))}
      <div className="pt-3">
        <div className="mb-2 text-sm text-fg2">{t("limits.blocked")}</div>
        <div className="flex flex-wrap gap-2">{limits.usd.blocked.map((c) => <Pill key={c} tone="danger">{t(`cat.${c}` as MessageKey)}</Pill>)}</div>
      </div>
    </Card>
  );
}
