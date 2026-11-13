"use client";

import Link from "next/link";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Pill } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { calculateProfit } from "@/lib/profit";
import { verdictFor, type Verdict } from "@/lib/verdict";
import { money } from "@/lib/format";
import type { Product } from "@/lib/store/products";

export const VERDICT_TONE: Record<Verdict, "ok" | "wait" | "danger"> = { good: "ok", risky: "wait", loss: "danger" };

/** Simple list of checked products: name, where, money per sale and the one-word verdict. */
export function ProductList({ products }: { products: Product[] }) {
  const { t, lang } = usePrefs();
  return (
    <ul className="glass m-0 list-none overflow-hidden rounded-card p-0">
      {products.map((p) => {
        const r = calculateProfit(p);
        const v = verdictFor(r.profitPerUnit, r.marginPct);
        return (
          <li key={p.id} className="border-b border-hairline last:border-b-0">
            <Link href="/products" className="flex min-h-[64px] items-center gap-3 px-4 py-3">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-track text-fg2"><Icon name="box" size={18} /></span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[16px]">{p.name}</b>
                <span className="block truncate text-[13px] text-fg2">
                  {p.marketplace === "uzum" ? "Uzum" : "Amazon"}{r.complete ? ` · ${money(r.profitPerUnit, p.marketplace, lang)}` : ""}
                </span>
              </span>
              {v && <Pill tone={VERDICT_TONE[v]}>{t(`verdict.${v}`)}</Pill>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
