"use client";

import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, Pill } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { rulesFor, useLevels } from "@/lib/levels";
import type { MessageKey } from "@/lib/i18n";
import { money } from "@/lib/format";

/** Read-only: the rules of the user's level, set by the admin. */
export function LimitsCard() {
  const { t, lang } = usePrefs();
  const { profile } = useAuth();
  const level = profile?.level ?? 0;
  const r = rulesFor(useLevels(), level);

  const rows: Array<[string, string]> = [
    [`${t("limits.maxUnitCost")} · Amazon`, money(r.maxUnitCostUsd, "amazon", lang)],
    [`${t("limits.maxOrderBudget")} · Amazon`, money(r.maxOrderBudgetUsd, "amazon", lang)],
    [`${t("limits.maxUnitCost")} · Uzum`, money(r.maxUnitCostUzs, "uzum", lang)],
    [`${t("limits.maxOrderBudget")} · Uzum`, money(r.maxOrderBudgetUzs, "uzum", lang)],
    [t("limits.maxWeight"), `${r.maxWeightKg} kg`],
    [t("limits.maxLongest"), `${r.maxLongestCm} sm`],
  ];

  return (
    <Card>
      <p className="mb-2 mt-0 flex max-w-[60ch] items-start gap-2 text-sm text-fg2">
        <Icon name="lock" size={16} className="mt-0.5 flex-none text-fg3" />{t("limits.body")}
      </p>
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 border-b border-hairline py-3 text-sm last:border-b-0">
          <span className="text-fg2">{label}</span>
          <span className="num text-[13px] font-semibold">{value}</span>
        </div>
      ))}
      <div className="pt-3">
        <div className="mb-2 text-sm text-fg2">{t("limits.blocked")}</div>
        <div className="flex flex-wrap gap-2">{r.blocked.map((c) => <Pill key={c} tone="danger">{t(`cat.${c}` as MessageKey)}</Pill>)}</div>
      </div>
    </Card>
  );
}
