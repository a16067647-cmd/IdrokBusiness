"use client";

import Link from "next/link";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/ui/Icon";
import { ProductList } from "@/components/simple/ProductList";
import { productsStore } from "@/lib/store/products";
import { lessonStore } from "@/lib/store/lessons";
import { useApprovalCounts } from "@/lib/useApprovals";
import type { MessageKey } from "@/lib/i18n";

// Home is one simple path: five steps, and one big button for the next one.
const LESSONS_TO_START = 3;

interface Step { n: 1 | 2 | 3 | 4 | 5; done: boolean; href: string }

export default function PathPage() {
  const { t } = usePrefs();
  const { profile, fullName } = useAuth();
  const products = productsStore.use();
  const lessons = lessonStore.use();
  const approvals = useApprovalCounts();
  const lessonsDone = Object.keys(lessons.completed).length;
  const sold = (profile?.verifiedProfitUsd ?? 0) > 0;

  const steps: Step[] = [
    { n: 1, done: lessonsDone >= LESSONS_TO_START, href: "/learn" },
    { n: 2, done: products.length > 0, href: "/check" },
    { n: 3, done: approvals.approved > 0 || sold, href: "/approvals" },
    { n: 4, done: sold, href: "/learn" },
    { n: 5, done: sold, href: "/finance" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  const name = (profile?.fullName || fullName || "").split(" ")[0];

  return (
    <div data-motion-preset="dashboard" className="mx-auto grid max-w-[560px] gap-6 pt-5">
      <div>
        <p className="m-0 text-[15px] text-fg2">{name ? t("path.hello", { name }) : t("path.helloAnon")}</p>
        <h1 className="m-0 mt-0.5 text-[30px] font-extrabold leading-tight tracking-[-0.03em]">{t("path.title")}</h1>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-track" role="progressbar" aria-valuemin={0} aria-valuemax={5} aria-valuenow={doneCount}>
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
          <span className="text-[13px] font-semibold text-fg2">{t("path.progress", { done: doneCount, total: steps.length })}</span>
        </div>
      </div>

      <div className="glass grid gap-3 rounded-[26px] p-5">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-primary">{t("path.next")}</span>
        {next ? (
          <>
            <p className="m-0 text-[19px] font-bold leading-snug">{t(`path.n${next.n}` as MessageKey)}</p>
            <Link href={next.href} className="btn btn-primary h-[58px] w-full text-[17px]">{t(`path.n${next.n}btn` as MessageKey)}</Link>
          </>
        ) : (
          <>
            <p className="m-0 text-[19px] font-bold leading-snug">{t("path.allDone")}</p>
            <Link href="/check" className="btn btn-primary h-[58px] w-full text-[17px]">{t("path.n2btn")}</Link>
          </>
        )}
        <Link href="/agents?agent=discovery" className="py-1 text-center text-[15px] font-semibold text-primary">{t("path.noIdea")}</Link>
      </div>

      <ol className="m-0 grid list-none p-0">
        {steps.map((s, i) => {
          const now = s === next;
          return (
            <li key={s.n} className="relative pb-3 last:pb-0">
              {i < steps.length - 1 && <span aria-hidden className={`absolute left-[21px] top-[46px] bottom-0 w-0.5 ${s.done ? "bg-primary" : "bg-hairline"}`} />}
              <Link href={s.href} className="flex items-start gap-3.5">
                <span className={`grid h-11 w-11 flex-none place-items-center rounded-full border-2 text-[16px] font-extrabold ${
                  s.done ? "border-primary bg-primary text-white" : now ? "border-primary text-primary shadow-[0_0_0_5px_var(--soft-blue,rgba(10,108,255,0.14))]" : "border-hairline text-fg3"}`}>
                  {s.done ? <Icon name="check" size={20} /> : s.n}
                </span>
                <span className="min-w-0 pt-1.5">
                  <b className={`block text-[17px] ${!s.done && !now ? "text-fg2" : ""}`}>{t(`path.s${s.n}.title` as MessageKey)}</b>
                  <span className="block text-[14px] text-fg2">{t(`path.s${s.n}.body` as MessageKey)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {products.length > 0 && (
        <section className="grid gap-3" aria-labelledby="h-checked">
          <div className="flex items-baseline justify-between">
            <h2 id="h-checked" className="m-0 text-xl font-extrabold">{t("path.checked")}</h2>
            <Link href="/me" className="text-[15px] font-semibold text-primary">{t("path.seeAll")}</Link>
          </div>
          <ProductList products={products.slice(0, 3)} />
          <Link href="/check" className="btn glass h-[54px] w-full text-fg"><Icon name="plus" size={18} />{t("path.checkAnother")}</Link>
        </section>
      )}
    </div>
  );
}
