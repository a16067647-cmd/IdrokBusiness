"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Sheet } from "@/components/ui/Sheet";
import { Segmented } from "@/components/ui/Glass";
import { Icon, ICON_NAMES, type IconName } from "@/components/ui/Icon";
import type { L10n, LessonRecord, Slide, Visual } from "@/lib/lessons/types";

const empty = (): L10n => ({ uz: "", ru: "" });
const newLearn = (): Slide => ({ kind: "learn", title: empty(), body: empty() });
const newQuiz = (): Slide => ({ kind: "quiz", question: empty(), options: [empty(), empty(), empty()], correct: 0, explain: empty() });

interface Draft {
  id: string; level: string; minutes: string; icon: IconName; published: boolean;
  title: L10n; summary: L10n; slides: Slide[]; visuals: string[];
}

function toDraft(l?: LessonRecord): Draft {
  const slides = l ? structuredClone(l.slides) : [newLearn(), newQuiz()];
  return {
    id: l?.id ?? "", level: String(l?.level ?? 0), minutes: String(l?.minutes ?? 5), icon: l?.icon ?? "book", published: l?.published ?? true,
    title: l ? { ...l.title } : empty(), summary: l ? { ...l.summary } : empty(), slides,
    visuals: slides.map((s) => (s.kind === "learn" && s.visual ? JSON.stringify(s.visual, null, 2) : "")),
  };
}

export function LessonEditor({ open, lesson, onClose, onSave, nextPosition }: {
  open: boolean; lesson?: LessonRecord; onClose: () => void;
  onSave: (l: LessonRecord) => Promise<string | null>; nextPosition?: (level: number) => number;
}) {
  const { t } = usePrefs();
  const [d, setD] = useState<Draft>(toDraft(lesson));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setD(toDraft(lesson)); setError(null); } }, [open, lesson]);

  const setSlide = (i: number, s: Slide) => setD((x) => ({ ...x, slides: x.slides.map((y, j) => (j === i ? s : y)) }));
  const moveSlide = (i: number, dir: -1 | 1) => setD((x) => {
    const j = i + dir; if (j < 0 || j >= x.slides.length) return x;
    const slides = [...x.slides]; const visuals = [...x.visuals];
    [slides[i], slides[j]] = [slides[j], slides[i]]; [visuals[i], visuals[j]] = [visuals[j], visuals[i]];
    return { ...x, slides, visuals };
  });
  const removeSlide = (i: number) => setD((x) => ({ ...x, slides: x.slides.filter((_, j) => j !== i), visuals: x.visuals.filter((_, j) => j !== i) }));
  const addSlide = (s: Slide) => setD((x) => ({ ...x, slides: [...x.slides, s], visuals: [...x.visuals, ""] }));

  const submit = async () => {
    const problems: string[] = [];
    const id = d.id.trim();
    if (!/^[a-z0-9-]{2,64}$/.test(id)) problems.push("ID");
    if (!d.title.uz.trim() || !d.title.ru.trim()) problems.push(t("admin.titleUz"));
    const level = parseInt(d.level, 10), minutes = parseInt(d.minutes, 10);
    if (!(level >= 0)) problems.push(t("admin.level"));
    if (!(minutes > 0)) problems.push(t("admin.minutes"));
    const slides: Slide[] = [];
    d.slides.forEach((s, i) => {
      if (s.kind === "learn") {
        let visual: Visual | undefined;
        if (d.visuals[i].trim()) {
          try { visual = JSON.parse(d.visuals[i]) as Visual; } catch { problems.push(`${t("admin.slideN", { n: i + 1 })}: ${t("admin.badJson")}`); }
        }
        slides.push(visual ? { ...s, visual } : { kind: "learn", title: s.title, body: s.body });
      } else {
        const options = s.options.filter((o) => o.uz.trim() || o.ru.trim());
        if (options.length < 2 || s.correct >= options.length) problems.push(t("admin.slideN", { n: i + 1 }));
        slides.push({ ...s, options });
      }
    });
    if (!slides.length || slides[slides.length - 1].kind !== "quiz") problems.push(t("admin.needQuiz"));
    if (problems.length) { setError(t("admin.invalid", { what: problems.join(", ") })); return; }

    setBusy(true);
    const err = await onSave({
      id, level, minutes, icon: d.icon, published: d.published, title: d.title, summary: d.summary, slides,
      position: lesson?.position ?? nextPosition?.(level) ?? 0,
    });
    setBusy(false);
    if (err) setError(err); else onClose();
  };

  const pair = (label: [string, string], v: L10n, on: (v: L10n) => void, area = false, key = "") => (
    <div className="grid gap-2 sm:grid-cols-2">
      {(["uz", "ru"] as const).map((lng, i) => (
        <label key={lng} className="grid gap-1"><span className="text-[12px] font-semibold text-fg2">{label[i]}</span>
          {area
            ? <textarea id={`${key}-${lng}`} className="field h-24 py-2.5" value={v[lng]} onChange={(e) => on({ ...v, [lng]: e.target.value })} />
            : <input id={`${key}-${lng}`} className="field" value={v[lng]} onChange={(e) => on({ ...v, [lng]: e.target.value })} />}
        </label>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} title={lesson ? t("admin.lessonEdit") : t("admin.lessonNew")}
      footer={<>
        <button type="button" className="btn btn-sm bg-track text-fg" onClick={onClose}>{t("common.cancel")}</button>
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void submit()}>{t("common.save")}</button>
      </>}>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="col-span-2 grid gap-1"><span className="text-[12px] font-semibold text-fg2">{t("admin.lessonId")}</span>
            <input id="le-id" className="field num" value={d.id} disabled={!!lesson} onChange={(e) => setD({ ...d, id: e.target.value.toLowerCase() })} /></label>
          <label className="grid gap-1"><span className="text-[12px] font-semibold text-fg2">{t("admin.level")}</span>
            <input id="le-level" className="field num" inputMode="numeric" value={d.level} onChange={(e) => setD({ ...d, level: e.target.value.replace(/\D/g, "") })} /></label>
          <label className="grid gap-1"><span className="text-[12px] font-semibold text-fg2">{t("admin.minutes")}</span>
            <input id="le-min" className="field num" inputMode="numeric" value={d.minutes} onChange={(e) => setD({ ...d, minutes: e.target.value.replace(/\D/g, "") })} /></label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<"on" | "off"> label={t("admin.published")} value={d.published ? "on" : "off"} onChange={(v) => setD({ ...d, published: v === "on" })}
            options={[{ value: "on", label: t("admin.published") }, { value: "off", label: t("admin.hidden") }]} />
          <div className="flex flex-wrap gap-1">
            {ICON_NAMES.map((n) => (
              <button key={n} type="button" aria-label={n} aria-pressed={d.icon === n} onClick={() => setD({ ...d, icon: n })}
                className={`grid h-8 w-8 place-items-center rounded-[10px] ${d.icon === n ? "bg-primary text-white" : "bg-track text-fg2"}`}><Icon name={n} size={16} /></button>
            ))}
          </div>
        </div>
        {pair([t("admin.titleUz"), t("admin.titleRu")], d.title, (v) => setD({ ...d, title: v }), false, "le-title")}
        {pair([t("admin.summaryUz"), t("admin.summaryRu")], d.summary, (v) => setD({ ...d, summary: v }), false, "le-sum")}

        <h3 className="mb-0 mt-2 text-base font-bold">{t("admin.slides")}</h3>
        {d.slides.map((s, i) => (
          <section key={i} className="grid gap-3 rounded-[18px] bg-track p-3.5">
            <div className="flex items-center justify-between gap-2">
              <b className="text-sm">{t("admin.slideN", { n: i + 1 })} · {s.kind === "quiz" ? t("admin.addQuiz") : t("admin.addLearn")}</b>
              <div className="flex gap-1">
                <button type="button" aria-label={t("admin.moveUp")} className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--glass-strong)]" onClick={() => moveSlide(i, -1)}><span className="rotate-[-90deg]"><Icon name="chevron" size={14} /></span></button>
                <button type="button" aria-label={t("admin.moveDown")} className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--glass-strong)]" onClick={() => moveSlide(i, 1)}><span className="rotate-90"><Icon name="chevron" size={14} /></span></button>
                <button type="button" aria-label={t("common.delete")} className="grid h-7 w-7 place-items-center rounded-lg bg-danger-soft text-danger-fg" onClick={() => removeSlide(i)}><Icon name="x" size={14} /></button>
              </div>
            </div>
            {s.kind === "learn" ? (
              <>
                {pair([t("admin.slideTitleUz"), t("admin.slideTitleRu")], s.title, (v) => setSlide(i, { ...s, title: v }), false, `s${i}-t`)}
                {pair([t("admin.slideBodyUz"), t("admin.slideBodyRu")], s.body, (v) => setSlide(i, { ...s, body: v }), true, `s${i}-b`)}
                <label className="grid gap-1"><span className="text-[12px] font-semibold text-fg2">{t("admin.visualJson")}</span>
                  <textarea id={`s${i}-v`} className="field num h-24 py-2.5 text-[12px]" value={d.visuals[i]} onChange={(e) => setD((x) => ({ ...x, visuals: x.visuals.map((y, j) => (j === i ? e.target.value : y)) }))} /></label>
              </>
            ) : (
              <>
                {pair([t("admin.questionUz"), t("admin.questionRu")], s.question, (v) => setSlide(i, { ...s, question: v }), false, `s${i}-q`)}
                {s.options.map((o, oi) => (
                  <div key={oi} className="grid gap-1.5">
                    <label className="flex items-center gap-2 text-[12px] font-semibold text-fg2">
                      <input type="radio" name={`correct-${i}`} checked={s.correct === oi} onChange={() => setSlide(i, { ...s, correct: oi })} className="accent-[var(--primary)]" />
                      {t("admin.option", { n: oi + 1 })}{s.correct === oi && <span className="text-success-fg"> · {t("admin.correct")}</span>}
                    </label>
                    {pair(["UZ", "RU"], o, (v) => setSlide(i, { ...s, options: s.options.map((x, xi) => (xi === oi ? v : x)) }), false, `s${i}-o${oi}`)}
                  </div>
                ))}
                {s.options.length < 4 && <button type="button" className="justify-self-start text-[13px] font-semibold text-primary" onClick={() => setSlide(i, { ...s, options: [...s.options, empty()] })}>+ {t("admin.option", { n: s.options.length + 1 })}</button>}
                {pair([t("admin.explainUz"), t("admin.explainRu")], s.explain, (v) => setSlide(i, { ...s, explain: v }), true, `s${i}-e`)}
              </>
            )}
          </section>
        ))}
        <div className="flex gap-2">
          <button type="button" className="btn btn-sm bg-track text-fg" onClick={() => addSlide(newLearn())}><Icon name="plus" size={14} />{t("admin.addLearn")}</button>
          <button type="button" className="btn btn-sm bg-track text-fg" onClick={() => addSlide(newQuiz())}><Icon name="plus" size={14} />{t("admin.addQuiz")}</button>
        </div>
        {error && <p role="alert" className="m-0 rounded-2xl bg-danger-soft p-3 text-sm text-danger-fg">{error}</p>}
      </div>
    </Sheet>
  );
}
