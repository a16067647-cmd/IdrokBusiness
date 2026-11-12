"use client";

import Link from "next/link";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { useLessons } from "@/lib/lessons/source";
import { streakInfo, type DayStatus } from "@/lib/lessons/progress";
import { lessonStore } from "@/lib/store/lessons";
import { rulesFor, useLevels } from "@/lib/levels";
import { useToday } from "@/lib/useToday";
import { money } from "@/lib/format";

const DAY_STYLE: Record<DayStatus, string> = {
  done: "bg-primary text-white",
  freeze: "bg-ai-soft text-ai",
  today: "bg-soft-blue text-primary ring-2 ring-primary/40",
  missed: "bg-track text-fg3",
  future: "bg-track text-fg3",
};

export default function LearnPage() {
  const { t, lang } = usePrefs();
  const { profile } = useAuth();
  const { lessons } = useLessons();
  const progress = lessonStore.use();
  const today = useToday();
  const levels = useLevels();
  const streak = today ? streakInfo(progress, today) : null;
  const dayNames = t("learn.days").split(",");

  const myLevel = profile?.level ?? 0;
  const visible = lessons.filter((l) => l.level <= myLevel);
  const byLevel = new Map<number, typeof visible>();
  for (const l of visible) byLevel.set(l.level, [...(byLevel.get(l.level) ?? []), l]);
  const done = visible.filter((l) => progress.completed[l.id]).length;

  const rules = rulesFor(levels, myLevel);
  const have = profile?.verifiedProfitUsd ?? 0;
  const need = rules.profitToNextUsd;
  const pctToNext = need > 0 ? Math.min(100, (have / need) * 100) : 0;

  return (
    <div data-motion-preset="dashboard" className="pt-6">
      <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.03em]">{t("learn.title")}</h1>
      <p className="m-0 mb-6 mt-1 max-w-[56ch] text-[15px] text-fg2">{t("learn.lead")}</p>

      <Card className="mb-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className={`grid h-12 w-12 flex-none place-items-center rounded-2xl ${streak && streak.current > 0 ? "bg-warn-soft text-warn-fg" : "bg-track text-fg3"}`}><Icon name="flame" size={24} /></span>
            <div className="min-w-0">
              <h2 className="m-0 text-[17px] font-bold">{t("learn.streak", { n: streak?.current ?? 0 })}</h2>
              <p className="m-0 text-[13px] text-fg2">{streak?.doneToday ? t("learn.doneToday") : t("learn.streakHint")}</p>
            </div>
          </div>
          <div className="flex gap-1.5" aria-label={t("learn.streak", { n: streak?.current ?? 0 })}>
            {(streak?.week ?? Array.from({ length: 7 }, () => ({ day: "", status: "future" as DayStatus }))).map((d, i) => (
              <span key={i} title={d.status === "freeze" ? t("learn.freeze") : undefined}
                className={`grid h-8 w-8 place-items-center rounded-[10px] text-[11px] font-bold ${DAY_STYLE[d.status]}`}>
                {d.status === "done" ? <Icon name="check" size={14} strokeWidth={3} /> : dayNames[i]}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <div className="mb-4 mt-7 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-semibold text-fg2">{t("learn.yourLevel", { n: myLevel })}</span>
        <span className="num text-sm text-fg2">{t("learn.progress", { done, total: visible.length })}</span>
      </div>
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-track" role="progressbar" aria-valuemin={0} aria-valuemax={visible.length} aria-valuenow={done}>
        <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${visible.length ? (done / visible.length) * 100 : 0}%`, background: "linear-gradient(90deg, var(--primary-top), var(--primary))" }} />
      </div>

      {[...byLevel.entries()].map(([lvl, list]) => (
        <section key={lvl} className="mb-6" aria-labelledby={`lvl-${lvl}`}>
          <h2 id={`lvl-${lvl}`} className="mb-3 mt-0 text-2xl font-extrabold tracking-[-0.025em]">{t("learn.levelLessons", { n: lvl })}</h2>
          <ol className="glass m-0 list-none overflow-hidden rounded-card p-0">
            {list.map((lesson, i) => {
              const isDone = !!progress.completed[lesson.id];
              return (
                <li key={lesson.id} className="border-b border-hairline last:border-b-0">
                  <Link href={`/learn/${lesson.id}`} className="flex items-center gap-3.5 px-[18px] py-3.5 transition-colors hover:bg-track active:bg-track">
                    <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl text-sm font-extrabold ${isDone ? "bg-success-soft text-success-fg" : "bg-soft-blue text-primary"}`}>
                      {isDone ? <Icon name="check" size={18} strokeWidth={3} /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-[15px] font-semibold">{lesson.title[lang]}</b>
                      <span className="block truncate text-[13px] text-fg2">{t("learn.minutes", { n: lesson.minutes })} · {lesson.summary[lang]}</span>
                    </div>
                    <span className={`hidden text-[12px] font-semibold sm:inline ${isDone ? "text-success-fg" : "text-primary"}`}>{t(isDone ? "learn.review" : "learn.state.open")}</span>
                    <Icon name="chevron" size={18} className="flex-none text-fg3" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      {visible.length > 0 && done === visible.length && <p className="text-center text-sm text-fg2">{t("learn.allDone")}</p>}

      <Card className="relative mt-4 overflow-hidden">
        <div className="flex items-center gap-3.5">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-[14px] border border-[var(--glass-border)]" style={{ background: "var(--glass-strong)" }}><Icon name="lock" size={20} /></span>
          <div>
            <h2 className="m-0 text-lg font-bold">{t("learn.nextLevel", { n: myLevel + 1 })}</h2>
            <p className="m-0 text-sm text-fg2">{t("learn.nextLevelBody", { amount: money(need, "amazon", lang) })}</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-track" role="progressbar" aria-valuemin={0} aria-valuemax={need} aria-valuenow={have} aria-label={t("learn.nextLevel", { n: myLevel + 1 })}>
          <div className="h-full rounded-full" style={{ width: `${pctToNext}%`, background: "linear-gradient(90deg, #4cd471, var(--success))" }} />
        </div>
        <p className="num mb-0 mt-2 text-[13px] text-fg2">{t("learn.profitProgress", { have: money(have, "amazon", lang), need: money(need, "amazon", lang) })}</p>
      </Card>
    </div>
  );
}
