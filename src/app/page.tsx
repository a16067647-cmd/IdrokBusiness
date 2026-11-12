"use client";

import Link from "next/link";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Card, Pill, SectionHead, Tile } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { MARKETPLACES } from "@/lib/marketplaces";
import type { MessageKey } from "@/lib/i18n";

const METRICS: MessageKey[] = ["home.metric.profit", "home.metric.sales", "home.metric.inTransit"];
const STEPS: Array<[MessageKey, MessageKey]> = [
  ["home.step1.title", "home.step1.body"],
  ["home.step2.title", "home.step2.body"],
  ["home.step3.title", "home.step3.body"],
];

export default function HomePage() {
  const { t } = usePrefs();
  return (
    <>
      <section data-motion-preset="hero" className="max-w-[640px] pb-12 pt-11 md:pb-14 md:pt-[72px]">
        <span className="glass inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-primary">{t("home.eyebrow")}</span>
        <h1 className="mb-4 mt-[18px] text-[clamp(36px,7vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em] [text-wrap:balance]">{t("home.title")}</h1>
        <p className="mb-7 max-w-[52ch] text-[17px] text-fg2">{t("home.lead")}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/products" className="btn btn-primary"><Icon name="plus" size={18} />{t("home.ctaStart")}</Link>
          <Link href="/learn" className="btn glass text-fg">{t("home.ctaLearn")}</Link>
        </div>
      </section>

      <section data-motion-preset="dashboard" className="py-7" aria-labelledby="h-summary">
        <SectionHead id="h-summary" title={t("home.summary")} hint={t("home.summaryHint")} />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {METRICS.map((k) => (
            <Card key={k}>
              <div className="label-caps">{t(k)}</div>
              <div className="num mt-2 text-[28px] font-semibold text-fg3">—</div>
              <div className="mt-1 text-[13px] text-fg2">{t("home.metricWaiting")}</div>
            </Card>
          ))}
        </div>
      </section>

      <section data-motion-preset="dashboard" className="py-7" aria-labelledby="h-mkt">
        <SectionHead id="h-mkt" title={t("mkt.title")} hint={t("mkt.hint")} />
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {MARKETPLACES.map((m) => (
            <Link key={m.id} href={`/markets/${m.id}`} className="glass block rounded-card p-5 transition-transform duration-150 active:scale-[0.98]">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <Tile>{m.initial}</Tile>
                  <div><h3 className="m-0 text-[17px] font-bold">{m.name}</h3><p className="m-0 text-sm text-fg2">{t(m.region)}</p></div>
                </div>
                <Pill tone="wait" dot>{t("status.awaiting")}</Pill>
              </div>
              <p className="mt-3.5 text-sm text-fg2">{t(m.id === "amazon" ? "mkt.awaitingBody" : "mkt.manualBody")}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">{t("common.open")}<Icon name="chevron" size={16} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section data-motion-preset="hero" className="py-7" aria-labelledby="h-steps">
        <SectionHead id="h-steps" title={t("home.steps")} hint={t("home.stepsHint")} />
        <ol className="m-0 grid list-none grid-cols-1 gap-3.5 p-0 md:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title}>
              <Card className="h-full">
                <div className="num text-[13px] font-semibold text-primary">0{i + 1}</div>
                <h3 className="mt-2.5 text-[17px] font-bold">{t(title)}</h3>
                <p className="mt-1.5 text-sm text-fg2">{t(body)}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
