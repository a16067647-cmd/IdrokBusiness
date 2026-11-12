"use client";

import Link from "next/link";
import { useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Card, Pill, Segmented, Tile } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { getMarketplace, type MarketplaceId } from "@/lib/marketplaces";
import type { MessageKey } from "@/lib/i18n";

type Period = "day" | "week" | "month";
const ROWS: MessageKey[] = ["mkt.row.sales", "mkt.row.ordered", "mkt.row.inTransit", "mkt.row.profit"];

export function MarketView({ id }: { id: MarketplaceId }) {
  const { t } = usePrefs();
  const m = getMarketplace(id)!;
  const [period, setPeriod] = useState<Period>("week");

  return (
    <div data-motion-preset="dashboard" className="pt-4">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"><Icon name="back" size={16} />{t("common.back")}</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <Tile className="h-12 w-12 text-lg">{m.initial}</Tile>
          <div>
            <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.03em]">{m.name}</h1>
            <p className="m-0 text-sm text-fg2">{t(m.region)}</p>
          </div>
        </div>
        <Pill tone="wait" dot>{t("status.awaiting")}</Pill>
      </div>

      <Card className="mb-3.5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-bold">{t("mkt.pl")}</h2>
          <Segmented<Period> label={t("mkt.pl")} value={period} onChange={setPeriod}
            options={[{ value: "day", label: t("mkt.period.day") }, { value: "week", label: t("mkt.period.week") }, { value: "month", label: t("mkt.period.month") }]} />
        </div>
        <dl className="m-0 grid border-t border-hairline">
          {ROWS.map((k) => (
            <div key={k} className="flex justify-between gap-3 border-b border-hairline py-3 text-sm">
              <dt className="text-fg2">{t(k)}</dt>
              <dd className="num m-0 text-[13px] text-fg3">{t("common.none")}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3.5 text-[13px] text-fg2">{t("mkt.plEmpty")}</p>
      </Card>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center gap-2.5"><Icon name="lock" size={18} className="text-fg3" /><h2 className="m-0 text-[17px] font-bold">{t("mkt.connectTitle")}</h2></div>
          <p className="m-0 text-sm text-fg2">{t("mkt.connectBody")}</p>
          <button type="button" disabled className="btn btn-primary btn-sm mt-4">{t("common.soon")}</button>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2.5"><Icon name="calc" size={18} className="text-fg3" /><h2 className="m-0 text-[17px] font-bold">{t("mkt.fees")}</h2></div>
          <p className="m-0 text-sm text-fg2">{t("mkt.feesBody")}</p>
          <a href={m.feeSource} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">{new URL(m.feeSource).host}<Icon name="chevron" size={16} /></a>
        </Card>
      </div>
    </div>
  );
}
