"use client";

import { usePrefs } from "@/components/providers/PrefsProvider";
import { Icon } from "@/components/ui/Icon";
import type { Violation } from "@/lib/guardrails";
import type { MarketplaceId } from "@/lib/marketplaces";
import type { MessageKey } from "@/lib/i18n";
import { money } from "@/lib/format";

export function ViolationList({ violations, marketplace }: { violations: Violation[]; marketplace: MarketplaceId }) {
  const { t, lang } = usePrefs();
  if (violations.length === 0) {
    return <p className="m-0 inline-flex items-center gap-2 text-sm font-semibold text-success-fg"><Icon name="check" size={16} />{t("viol.ok")}</p>;
  }
  return (
    <div className="rounded-[18px] bg-danger-soft p-4 text-danger-fg">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Icon name="shield" size={16} />{t("viol.title")}</div>
      <ul className="m-0 grid gap-1 pl-5 text-sm">
        {violations.map((v, i) => (
          <li key={i}>
            {v.kind === "category"
              ? t("viol.category", { category: t(`cat.${v.category}` as MessageKey) })
              : v.kind === "unitCost" || v.kind === "orderBudget"
                ? t(`viol.${v.kind}`, { value: money(v.value, marketplace, lang), limit: money(v.limit, marketplace, lang) })
                : t(`viol.${v.kind}`, { value: v.value, limit: v.limit })}
          </li>
        ))}
      </ul>
    </div>
  );
}
