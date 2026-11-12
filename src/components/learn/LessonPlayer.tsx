"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Icon } from "@/components/ui/Icon";
import { Visual } from "./Visual";
import { LEVEL0, getLesson } from "@/lib/lessons/level0";
import { lessonStates, streakInfo } from "@/lib/lessons/progress";
import { completeLesson, lessonStore } from "@/lib/store/lessons";
import { useToday } from "@/lib/useToday";
import { sfx } from "@/lib/sfx";

const IDS = LEVEL0.map((l) => l.id);

export function LessonPlayer({ id }: { id: string }) {
  const { t, lang } = usePrefs();
  const lesson = getLesson(id)!;
  const progress = lessonStore.use();
  const today = useToday();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [wasReview, setWasReview] = useState(false);

  const idx = IDS.indexOf(id);
  const state = today ? lessonStates(IDS, progress, today)[idx] : null;
  const total = lesson.slides.length;
  const slide = lesson.slides[step];
  const isLast = step === total - 1;
  const streak = useMemo(() => (today ? streakInfo(progress, today) : null), [progress, today]);

  if (state === null) return <div className="min-h-[60vh]" />;

  if (!finished && (state === "locked" || state === "tomorrow")) {
    return (
      <div data-motion-preset="dashboard" className="grid min-h-[60vh] place-items-center pt-6">
        <div className="glass max-w-md rounded-card p-7 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-track"><Icon name="lock" size={24} /></span>
          <h1 className="m-0 text-xl font-extrabold">{t("learn.lockedTitle")}</h1>
          <p className="mb-5 mt-1.5 text-sm text-fg2">{state === "tomorrow" ? t("learn.state.tomorrow") : t("learn.lockedBody")}</p>
          <Link href="/learn" className="btn btn-primary btn-sm">{t("learn.backToList")}</Link>
        </div>
      </div>
    );
  }

  const advance = () => {
    if (slide.kind === "quiz" && !checked) {
      if (picked === null) return;
      setChecked(true);
      if (picked === slide.correct) sfx.correct(); else sfx.wrong();
      return;
    }
    if (isLast) {
      setWasReview(state === "done");
      completeLesson(id);
      setFinished(true);
      sfx.complete();
      return;
    }
    sfx.next();
    setStep((s) => s + 1);
    setPicked(null);
    setChecked(false);
  };

  if (finished) {
    return (
      <div data-motion-preset="hero" className="grid min-h-[70vh] place-items-center pt-6">
        <div className="glass relative w-full max-w-md overflow-hidden rounded-card p-8 text-center">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[76px]">
            {Array.from({ length: 14 }, (_, i) => {
              const a = (i / 14) * Math.PI * 2;
              return <span key={i} className="absolute h-2 w-2 rounded-full" style={{ background: i % 3 ? "var(--primary)" : "var(--warn)", animation: "burst 900ms cubic-bezier(0.22,1,0.36,1) both", animationDelay: "120ms", ["--bx" as string]: `${Math.cos(a) * 110}px`, ["--by" as string]: `${Math.sin(a) * 80}px` } as CSSProperties} />;
            })}
          </div>
          <span className="anim-pop mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[26px] text-white shadow-[0_16px_40px_-14px_rgba(52,199,89,0.8)]" style={{ background: "linear-gradient(180deg, #4cd471, var(--success))" }}>
            <Icon name="check" size={38} strokeWidth={3} />
          </span>
          <h1 className="anim-rise m-0 text-2xl font-extrabold" style={{ ["--d" as string]: "200ms" } as CSSProperties}>{t("learn.complete")}</h1>
          <p className="anim-rise mb-5 mt-1.5 text-sm text-fg2" style={{ ["--d" as string]: "300ms" } as CSSProperties}>{wasReview ? t("learn.completeReview") : t("learn.completeBody")}</p>
          {streak && (
            <div className="anim-rise mb-6 inline-flex items-center gap-2 rounded-full bg-warn-soft px-4 py-2 text-sm font-bold text-warn-fg" style={{ ["--d" as string]: "400ms" } as CSSProperties}>
              <Icon name="flame" size={18} />{t("learn.streak", { n: streak.current })}
            </div>
          )}
          <div><Link href="/learn" className="btn btn-primary">{t("learn.backToList")}</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div data-motion-preset="dashboard" className="mx-auto max-w-[680px] pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/learn" aria-label={t("learn.close")} className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-track"><Icon name="x" size={16} /></Link>
        <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label={t("learn.step", { n: step + 1, total })}>
          {lesson.slides.map((_, i) => (
            <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
              <span className="block h-full rounded-full bg-primary transition-transform duration-500 ease-out" style={{ transformOrigin: "left", transform: `scaleX(${i <= step ? 1 : 0})` }} />
            </span>
          ))}
        </div>
        <span className="num text-xs text-fg3">{step + 1}/{total}</span>
      </div>

      <article key={step} className="glass rounded-[26px] p-6 md:p-8">
        <div className="anim-rise label-caps mb-2 text-primary">{slide.kind === "quiz" ? t("learn.quiz") : lesson.title[lang]}</div>
        {slide.kind === "learn" ? (
          <>
            <h1 className="anim-rise m-0 text-[26px] font-extrabold leading-tight tracking-[-0.025em] [text-wrap:balance]" style={{ ["--d" as string]: "60ms" } as CSSProperties}>{slide.title[lang]}</h1>
            <p className="anim-rise mb-0 mt-3 text-[16px] leading-relaxed text-fg2" style={{ ["--d" as string]: "120ms" } as CSSProperties}>{slide.body[lang]}</p>
            {slide.visual && <div className="mt-6"><Visual v={slide.visual} /></div>}
          </>
        ) : (
          <>
            <h1 className="anim-rise m-0 text-[22px] font-extrabold leading-snug tracking-[-0.02em]" style={{ ["--d" as string]: "60ms" } as CSSProperties}>{slide.question[lang]}</h1>
            <div className="mt-5 grid gap-2.5" role="radiogroup" aria-label={slide.question[lang]}>
              {slide.options.map((o, i) => {
                const isPicked = picked === i;
                const isRight = checked && i === slide.correct;
                const isWrong = checked && isPicked && i !== slide.correct;
                return (
                  <button key={i} type="button" role="radio" aria-checked={isPicked} disabled={checked}
                    onClick={() => { setPicked(i); sfx.tap(); }}
                    className={`anim-rise flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] font-semibold transition-colors duration-200 active:scale-[0.98] ${
                      isRight ? "border-success bg-success-soft text-success-fg" : isWrong ? "border-danger bg-danger-soft text-danger-fg" : isPicked ? "border-primary bg-soft-blue" : "border-transparent bg-track"}`}
                    style={{ ["--d" as string]: `${120 + i * 90}ms` } as CSSProperties}>
                    <span className={`grid h-6 w-6 flex-none place-items-center rounded-full border-2 ${isRight ? "border-success bg-success text-white" : isWrong ? "border-danger bg-danger text-white" : isPicked ? "border-primary bg-primary text-white" : "border-[var(--fg-3)]"}`}>
                      {isRight ? <Icon name="check" size={14} strokeWidth={3} /> : isWrong ? <Icon name="x" size={14} strokeWidth={3} /> : null}
                    </span>
                    {o[lang]}
                  </button>
                );
              })}
            </div>
            {checked && (
              <div className={`anim-rise mt-4 rounded-2xl p-4 text-sm ${picked === slide.correct ? "bg-success-soft text-success-fg" : "bg-warn-soft text-warn-fg"}`}>
                <b className="mb-0.5 block">{picked === slide.correct ? t("learn.correct") : t("learn.wrong")}</b>
                {slide.explain[lang]}
              </div>
            )}
          </>
        )}
      </article>

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={advance} disabled={slide.kind === "quiz" && picked === null}
          className="btn btn-primary w-full sm:w-auto sm:min-w-[200px]">
          {slide.kind === "quiz" && !checked ? t("learn.check") : isLast ? t("learn.finish") : t("learn.next")}
          {!(slide.kind === "quiz" && !checked) && !isLast && <Icon name="chevron" size={18} />}
        </button>
      </div>
    </div>
  );
}
