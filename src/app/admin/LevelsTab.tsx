"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Card } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { supabase } from "@/lib/supabase/client";
import { refreshLevels, useLevels, type LevelRules } from "@/lib/levels";
import { RESTRICTED_CATEGORIES } from "@/lib/guardrails";
import type { MessageKey } from "@/lib/i18n";

const NUM_FIELDS: Array<[keyof LevelRules, MessageKey, string]> = [
  ["maxUnitCostUsd", "limits.maxUnitCost", "Amazon, USD"],
  ["maxOrderBudgetUsd", "limits.maxOrderBudget", "Amazon, USD"],
  ["maxUnitCostUzs", "limits.maxUnitCost", "Uzum, so'm"],
  ["maxOrderBudgetUzs", "limits.maxOrderBudget", "Uzum, so'm"],
  ["maxWeightKg", "limits.maxWeight", ""],
  ["maxLongestCm", "limits.maxLongest", ""],
  ["profitToNextUsd", "admin.profitToNext", ""],
];

export function LevelsTab() {
  const { t } = usePrefs();
  const levels = useLevels();
  const list = Object.entries(levels).map(([k, v]) => [Number(k), v] as const).sort((a, b) => a[0] - b[0]);
  const nextLevel = list.length ? list[list.length - 1][0] + 1 : 0;
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { void refreshLevels(); }, []);

  const add = async () => {
    const base = list.length ? list[list.length - 1][1] : undefined;
    const { error } = await supabase()!.from("level_rules").insert({ level: nextLevel, rules: base });
    setMsg(error ? t("admin.error", { msg: error.message }) : t("admin.saved"));
    await refreshLevels();
  };

  return (
    <>
      <p className="mb-4 mt-0 text-sm text-fg2">{t("admin.rulesHint")}</p>
      {msg && <p className="mb-3 rounded-2xl bg-soft-blue p-3 text-sm text-primary" role="status">{msg}</p>}
      <div className="grid gap-3.5 md:grid-cols-2">
        {list.map(([lvl, rules]) => <LevelCard key={lvl} level={lvl} rules={rules} onSaved={setMsg} />)}
      </div>
      <button type="button" className="btn btn-sm mt-4 bg-track text-fg" onClick={() => void add()}><Icon name="plus" size={16} />{t("admin.addLevel")}</button>
    </>
  );
}

function LevelCard({ level, rules, onSaved }: { level: number; rules: LevelRules; onSaved: (m: string) => void }) {
  const { t } = usePrefs();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState(rules.blocked);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setDraft(Object.fromEntries(NUM_FIELDS.map(([k]) => [k, String(rules[k])])));
    setBlocked(rules.blocked);
  }, [rules]);

  const save = async () => {
    const next: Record<string, unknown> = { blocked };
    for (const [k] of NUM_FIELDS) {
      const v = parseFloat((draft[k] ?? "").replace(",", "."));
      if (!Number.isFinite(v) || v < 0) { onSaved(t("admin.invalid", { what: k })); return; }
      next[k] = v;
    }
    setBusy(true);
    const { error } = await supabase()!.from("level_rules").update({ rules: next, updated_at: new Date().toISOString() }).eq("level", level);
    setBusy(false);
    onSaved(error ? t("admin.error", { msg: error.message }) : t("admin.saved"));
    await refreshLevels();
  };

  return (
    <Card>
      <h2 className="mb-3 mt-0 text-lg font-bold">{t("admin.levelRules", { n: level })}</h2>
      <div className="grid gap-2.5">
        {NUM_FIELDS.map(([k, label, unit]) => (
          <label key={k} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-fg2">{t(label)}{unit && <span className="text-fg3"> · {unit}</span>}</span>
            <input id={`lv${level}-${k}`} className="field num h-10 w-32 text-right" inputMode="decimal" value={draft[k] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} />
          </label>
        ))}
      </div>
      <div className="mt-3.5">
        <div className="mb-2 text-sm text-fg2">{t("limits.blocked")}</div>
        <div className="flex flex-wrap gap-2">
          {RESTRICTED_CATEGORIES.map((c) => {
            const on = blocked.includes(c);
            return (
              <button key={c} type="button" aria-pressed={on} onClick={() => setBlocked(on ? blocked.filter((x) => x !== c) : [...blocked, c])}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${on ? "bg-danger-soft text-danger-fg" : "bg-track text-fg2"}`}>
                {t(`cat.${c}` as MessageKey)}
              </button>
            );
          })}
        </div>
      </div>
      <button type="button" className="btn btn-primary btn-sm mt-4" disabled={busy} onClick={() => void save()}>{t("common.save")}</button>
    </Card>
  );
}
