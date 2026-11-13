"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/ui/Icon";
import { ProductList } from "@/components/simple/ProductList";
import { Road, type RoadStep } from "@/components/path/Road";
import { FinishScreen, StepCelebration } from "@/components/path/Celebrate";
import { productsStore } from "@/lib/store/products";
import { lessonStore } from "@/lib/store/lessons";
import { createLocalStore } from "@/lib/store/local";
import { useApprovalCounts } from "@/lib/useApprovals";
import { doneCount, FIRST_ROUND, nextRound, pathEvent, PATH_STEPS, roundFacts, type PathEvent, type PathFacts, type RoundBase } from "@/lib/path";
import type { MessageKey } from "@/lib/i18n";

// Home is one simple path: a winding road with five stops, and one big button
// for the next stop. Finishing a stop drives the marker forward and celebrates.

const HREF = ["/learn", "/check", "/approvals", "/learn", "/finance"];

/** Per account on this device: which round of the path, and the progress last shown. */
const pathStore = createLocalStore<Record<string, { base: RoundBase; seen: number | null }>>("idrok.path", {});

export default function PathPage() {
  const { t } = usePrefs();
  const { profile, fullName, session } = useAuth();
  const products = productsStore.use();
  const lessons = lessonStore.use();
  const approvals = useApprovalCounts();
  const saved = pathStore.use();
  const uid = session?.user.id ?? "local";
  const mine = saved[uid] ?? { base: FIRST_ROUND, seen: null };

  const facts: PathFacts = {
    lessonsDone: Object.keys(lessons.completed).length,
    productsChecked: products.length,
    approvedPurchases: approvals.approved,
    verifiedProfitUsd: profile?.verifiedProfitUsd ?? 0,
  };
  const done = doneCount(roundFacts(facts, mine.base));

  // Wait until the account data is in, so loading doesn't look like progress.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => { const x = setTimeout(() => setTimedOut(true), 4000); return () => clearTimeout(x); }, []);
  const ready = (!!profile && approvals.loaded) || timedOut;

  const [display, setDisplay] = useState<number | null>(null);
  const [pending, setPending] = useState<PathEvent>({ kind: "none" });
  const [show, setShow] = useState<PathEvent>({ kind: "none" });
  const started = useRef(false);

  useEffect(() => {
    if (!ready) return;
    const save = (seen: number, base = mine.base) => pathStore.set((all) => ({ ...all, [uid]: { base, seen } }));
    if (!started.current) {
      started.current = true;
      const ev = pathEvent(mine.seen, done);
      save(done);
      if (ev.kind === "none") { setDisplay(done); return; }
      setDisplay(ev.from);
      setPending(ev);
      const x = setTimeout(() => setDisplay(done), 300);
      return () => clearTimeout(x);
    }
    // Progress changed while the page is open.
    if (done !== mine.seen) {
      const ev = pathEvent(mine.seen, done);
      save(done);
      if (ev.kind !== "none") setPending(ev);
      setDisplay(done);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, done]);

  const steps: RoadStep[] = HREF.map((href, i) => ({
    title: t(`path.s${i + 1}.title` as MessageKey), body: t(`path.s${i + 1}.body` as MessageKey), href,
  }));
  const shownDone = display ?? done;
  const nextN = shownDone < PATH_STEPS ? shownDone + 1 : null;
  const name = (profile?.fullName || fullName || "").split(" ")[0];

  const startAgain = () => {
    const base = nextRound(facts, mine.base);
    const now = doneCount(roundFacts(facts, base));
    pathStore.set((all) => ({ ...all, [uid]: { base, seen: now } }));
    setDisplay(now);
    setShow({ kind: "none" });
  };

  return (
    <div data-motion-preset="dashboard" className="mx-auto grid max-w-[560px] gap-6 pt-5">
      <div>
        <p className="m-0 text-[15px] text-fg2">{name ? t("path.hello", { name }) : t("path.helloAnon")}</p>
        <h1 className="m-0 mt-0.5 flex items-baseline gap-2.5 text-[30px] font-extrabold leading-tight tracking-[-0.03em]">
          {t("path.title")}
          {mine.base.round > 1 && <span className="rounded-full bg-soft-blue px-2.5 py-1 text-[13px] font-bold tracking-normal text-primary">{t("path.round", { n: mine.base.round })}</span>}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-track" role="progressbar" aria-valuemin={0} aria-valuemax={PATH_STEPS} aria-valuenow={shownDone}>
            <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${(shownDone / PATH_STEPS) * 100}%` }} />
          </div>
          <span className="text-[13px] font-semibold text-fg2">{t("path.progress", { done: shownDone, total: PATH_STEPS })}</span>
        </div>
      </div>

      <div className="glass grid gap-3 rounded-[26px] p-5">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-primary">{t("path.next")}</span>
        {nextN ? (
          <>
            <p className="m-0 text-[19px] font-bold leading-snug">{t(`path.n${nextN}` as MessageKey)}</p>
            <Link href={HREF[nextN - 1]} className="btn btn-primary h-[58px] w-full text-[17px]">{t(`path.n${nextN}btn` as MessageKey)}</Link>
          </>
        ) : (
          <>
            <p className="m-0 text-[19px] font-bold leading-snug">{t("path.allDone")}</p>
            <button type="button" onClick={startAgain} className="btn btn-primary h-[58px] w-full text-[17px]">{t("pfin.again")}</button>
          </>
        )}
        <Link href="/agents?agent=discovery" className="py-1 text-center text-[15px] font-semibold text-primary">{t("path.noIdea")}</Link>
      </div>

      {display == null ? <div className="aspect-[360/800] w-full" /> : (
        <Road steps={steps} done={display} initial={(name || "?").slice(0, 1).toUpperCase()}
          startLabel={t("path.start")} finishLabel={t("path.finish")}
          onArrive={() => { if (pending.kind !== "none") { setShow(pending); setPending({ kind: "none" }); } }} />
      )}

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

      {show.kind === "step" && (
        <StepCelebration title={t("cel.title")}
          doneText={t("cel.done", { step: steps[show.to - 1].title })}
          nextText={show.to < PATH_STEPS ? t("cel.next", { step: steps[show.to].title }) : undefined}
          button={t("cel.continue")} onClose={() => setShow({ kind: "none" })} />
      )}
      {show.kind === "finish" && (
        <FinishScreen title={t("pfin.title")} body={t("pfin.body")} again={t("pfin.again")} later={t("pfin.later")}
          onAgain={startAgain} onLater={() => setShow({ kind: "none" })} />
      )}
    </div>
  );
}
