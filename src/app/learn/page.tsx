"use client";

import Link from "next/link";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Card, Pill } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { LEVEL0 } from "@/lib/lessons/level0";
import { lessonStates, streakInfo, type DayStatus, type LessonState } from "@/lib/lessons/progress";
import { lessonStore } from "@/lib/store/lessons";
import { useToday } from "@/lib/useToday";
import type { MessageKey } from "@/lib/i18n";

const IDS = LEVEL0.map((l) => l.id);
const DAY_STYLE: Record<DayStatus, string> = {
  done: "bg-primary text-white",
  freeze: "bg-ai-soft text-ai",
  today: "bg-soft-blue text-primary ring-2 ring-primary/40",
  missed: "bg-track text-fg3",
  future: "bg-track text-fg3",
};

export default function LearnPage() {
  const { t, lang } = usePrefs();
  const progress = lessonStore.use();
  const today = useToday();
  const states = lessonStates(IDS, progress, today ?? "");
  const streak = today ? streakInfo(progress, today) : null;
  const done = states.filter((s) => s === "done").length;
  const dayNames = t("learn.days").split(",");

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

      <div className="mb-3 mt-7 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="m-0 text-2xl font-extrabold tracking-[-0.025em]">{t("learn.level0")}</h2>
        <span className="num text-sm text-fg2">{t("learn.progress", { done, total: LEVEL0.length })}</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-track" role="progressbar" aria-valuemin={0} aria-valuemax={LEVEL0.length} aria-valuenow={done}>
        <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${(done / LEVEL0.length) * 100}%`, background: "linear-gradient(90deg, var(--primary-top), var(--primary))" }} />
      </div>

      <ol className="glass m-0 list-none overflow-hidden rounded-card p-0">
        {LEVEL0.map((lesson, i) => {
          const st: LessonState = states[i];
          const reachable = st === "done" || st === "open";
          const inner = (
            <div className={`flex items-center gap-3.5 px-[18px] py-3.5 ${reachable ? "" : "opacity-60"}`}>
              <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl text-sm font-extrabold ${st === "done" ? "bg-success-soft text-success-fg" : st === "open" ? "bg-soft-blue text-primary" : "bg-track text-fg3"}`}>
                {st === "done" ? <Icon name="check" size={18} strokeWidth={3} /> : reachable ? i + 1 : <Icon name="lock" size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <b className={`block truncate text-[15px] font-semibold ${reachable ? "" : "blur-[0.6px]"}`}>{lesson.title[lang]}</b>
                <span className="block truncate text-[13px] text-fg2">{t("learn.minutes", { n: lesson.minutes })} · {reachable ? lesson.summary[lang] : <span className="sm:hidden">{t(`learn.state.${st}` as MessageKey)}</span>}{!reachable && <span className="hidden sm:inline">{lesson.summary[lang]}</span>}</span>
              </div>
              {st === "open" ? <Pill tone="blue">{t("learn.state.open")}</Pill>
                : st === "done" ? <span className="hidden text-[12px] font-semibold text-success-fg sm:inline">{t("learn.state.done")}</span>
                : <span className="hidden text-[12px] text-fg3 sm:inline">{t(`learn.state.${st}` as MessageKey)}</span>}
            </div>
          );
          return (
            <li key={lesson.id} className="border-b border-hairline last:border-b-0">
              {reachable ? <Link href={`/learn/${lesson.id}`} className="block transition-colors hover:bg-track active:bg-track">{inner}</Link> : inner}
            </li>
          );
        })}
      </ol>
      {done === LEVEL0.length && <p className="mt-3 text-center text-sm text-fg2">{t("learn.allDone")}</p>}

      <Card className="relative mt-7 overflow-hidden">
        <div className="flex items-center gap-3.5">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-[14px] border border-[var(--glass-border)]" style={{ background: "var(--glass-strong)" }}><Icon name="lock" size={20} /></span>
          <div>
            <h2 className="m-0 text-lg font-bold">{t("learn.levelNext")}</h2>
            <p className="m-0 text-sm text-fg2">{t("learn.levelNextBody")}</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} aria-label={t("learn.levelNext")} />
        <ul className="m-0 mt-3.5 grid list-none gap-2 p-0 text-sm text-fg2">
          {(["learn.levelReq1", "learn.levelReq2"] as MessageKey[]).map((k) => (
            <li key={k} className="flex items-center gap-2.5"><span className="h-4 w-4 rounded-full border-2 border-[var(--fg-3)]" />{t(k)}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
