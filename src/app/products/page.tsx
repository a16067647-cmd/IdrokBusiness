"use client";

import { useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Card, Pill, SectionHead, Tile } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { calculateProfit } from "@/lib/profit";
import { checkGuardrails } from "@/lib/guardrails";
import { limitsFor, limitsStore, productsStore, type Product } from "@/lib/store/products";
import { getMarketplace } from "@/lib/marketplaces";
import { money } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n";
import { ProductEditor } from "./ProductEditor";
import { LimitsCard } from "./LimitsCard";

const STATUS_TONE = { idea: "muted", researching: "blue", approved: "ok", rejected: "danger" } as const;

export default function ProductsPage() {
  const { t, lang } = usePrefs();
  const products = productsStore.use();
  const limits = limitsStore.use();
  const [editing, setEditing] = useState<Product | undefined>();
  const [open, setOpen] = useState(false);
  const openEditor = (p?: Product) => { setEditing(p); setOpen(true); };

  return (
    <div data-motion-preset="dashboard" className="pt-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[56ch]">
          <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.03em]">{t("products.title")}</h1>
          <p className="m-0 mt-1 text-[15px] text-fg2">{t("products.lead")}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openEditor()}><Icon name="plus" size={18} />{t("products.add")}</button>
      </div>

      {products.length === 0 ? (
        <Card className="mb-7 flex flex-col items-start gap-3 py-8">
          <Tile><Icon name="box" size={20} /></Tile>
          <h2 className="m-0 text-xl font-bold">{t("products.empty.title")}</h2>
          <p className="m-0 max-w-[52ch] text-sm text-fg2">{t("products.empty.body")}</p>
          <button type="button" className="btn btn-primary btn-sm mt-1" onClick={() => openEditor()}><Icon name="plus" size={16} />{t("products.add")}</button>
        </Card>
      ) : (
        <ul className="m-0 mb-7 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
          {products.map((p) => {
            const r = calculateProfit(p);
            const budget = p.unitCost != null && p.quantity != null ? (p.unitCost + (p.shippingPerUnit ?? 0)) * p.quantity : undefined;
            const v = checkGuardrails({ unitCost: p.unitCost, orderBudget: budget, weightKg: p.weightKg, longestCm: p.longestCm, restricted: p.restricted }, limitsFor(limits, p.marketplace));
            return (
              <li key={p.id}>
                <button type="button" onClick={() => openEditor(p)} className="glass block w-full rounded-card p-5 text-left transition-transform duration-150 active:scale-[0.98]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="m-0 truncate text-[17px] font-bold">{p.name}</h3>
                      <p className="m-0 text-[13px] text-fg2">{getMarketplace(p.marketplace)?.name}</p>
                    </div>
                    <Pill tone={STATUS_TONE[p.status]}>{t(`pstatus.${p.status}` as MessageKey)}</Pill>
                  </div>
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
                    {r.complete ? (
                      <div>
                        <div className={`num text-[22px] font-semibold ${r.profitPerUnit! < 0 ? "text-danger-fg" : "text-success-fg"}`}>{money(r.profitPerUnit, p.marketplace, lang)}</div>
                        <div className="text-[12px] text-fg2">{t("products.perUnit")} · {r.marginPct?.toFixed(1)}%</div>
                      </div>
                    ) : <span className="text-sm text-fg3">{t("products.incomplete")}</span>}
                    {v.length > 0 && <Pill tone="danger" dot>{t("products.warnings", { n: v.length })}</Pill>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <section aria-labelledby="h-limits">
        <SectionHead id="h-limits" title={t("limits.title")} />
        <LimitsCard />
      </section>
      <p className="mt-6 text-center text-[12px] text-fg3">{t("products.localNote")}</p>

      <ProductEditor product={editing} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
