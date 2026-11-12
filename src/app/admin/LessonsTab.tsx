"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Pill } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { supabase } from "@/lib/supabase/client";
import { lessonToRow, refreshLessons, useLessons } from "@/lib/lessons/source";
import type { LessonRecord } from "@/lib/lessons/types";
import { LessonEditor } from "./LessonEditor";

export function LessonsTab() {
  const { t, lang } = usePrefs();
  const { lessons, source } = useLessons();
  const [editing, setEditing] = useState<LessonRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { void refreshLessons(); }, []);

  const sb = supabase()!;
  const report = (error: { message: string } | null) => setMsg(error ? t("admin.error", { msg: error.message }) : t("admin.saved"));

  const move = async (l: LessonRecord, dir: -1 | 1) => {
    const same = lessons.filter((x) => x.level === l.level);
    const i = same.findIndex((x) => x.id === l.id);
    const other = same[i + dir];
    if (!other) return;
    const a = await sb.from("lessons").update({ position: other.position }).eq("id", l.id);
    const b = await sb.from("lessons").update({ position: l.position === other.position ? l.position + dir : l.position }).eq("id", other.id);
    report(a.error ?? b.error);
    await refreshLessons();
  };
  const togglePublish = async (l: LessonRecord) => {
    const { error } = await sb.from("lessons").update({ published: !l.published }).eq("id", l.id);
    report(error); await refreshLessons();
  };
  const remove = async (id: string) => {
    const { error } = await sb.from("lessons").delete().eq("id", id);
    setConfirmId(null); report(error); await refreshLessons();
  };
  const save = async (l: LessonRecord, isNew: boolean): Promise<string | null> => {
    const row = { ...lessonToRow(l), updated_at: new Date().toISOString() };
    const { error } = isNew ? await sb.from("lessons").insert(row) : await sb.from("lessons").update(row).eq("id", l.id);
    if (error) return error.code === "23505" ? t("admin.idTaken") : error.message;
    setMsg(t("admin.saved"));
    await refreshLessons();
    return null;
  };

  const nextPosition = (level: number) => Math.max(-1, ...lessons.filter((x) => x.level === level).map((x) => x.position)) + 1;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-fg2">{lessons.length} · {source}</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><Icon name="plus" size={16} />{t("admin.lessonNew")}</button>
      </div>
      {msg && <p className="mb-3 rounded-2xl bg-soft-blue p-3 text-sm text-primary" role="status">{msg}</p>}
      <ol className="glass m-0 list-none overflow-hidden rounded-card p-0">
        {lessons.map((l, i) => (
          <li key={l.id} className="flex flex-wrap items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0">
            <span className="num w-10 flex-none text-[12px] text-fg3">L{l.level}·{i + 1}</span>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-[15px]">{l.title[lang]}</b>
              <span className="block truncate text-[12px] text-fg3">{l.id} · {l.slides.length} · {t("learn.minutes", { n: l.minutes })}</span>
            </div>
            <Pill tone={l.published ? "ok" : "muted"}>{t(l.published ? "admin.published" : "admin.hidden")}</Pill>
            <div className="flex gap-1">
              <IconBtn label={t("admin.moveUp")} onClick={() => void move(l, -1)}><span className="rotate-[-90deg]"><Icon name="chevron" size={16} /></span></IconBtn>
              <IconBtn label={t("admin.moveDown")} onClick={() => void move(l, 1)}><span className="rotate-90"><Icon name="chevron" size={16} /></span></IconBtn>
              <IconBtn label={t(l.published ? "admin.hidden" : "admin.published")} onClick={() => void togglePublish(l)}><Icon name={l.published ? "lock" : "check"} size={16} /></IconBtn>
              <IconBtn label={t("common.edit")} onClick={() => setEditing(l)}><Icon name="clipboard" size={16} /></IconBtn>
              {confirmId === l.id
                ? <button type="button" className="rounded-[10px] bg-danger-soft px-2.5 text-[12px] font-bold text-danger-fg" onClick={() => void remove(l.id)}>{t("admin.deleteConfirm")}</button>
                : <IconBtn label={t("common.delete")} onClick={() => setConfirmId(l.id)}><Icon name="x" size={16} /></IconBtn>}
            </div>
          </li>
        ))}
      </ol>

      <LessonEditor open={!!editing} lesson={editing ?? undefined} onClose={() => setEditing(null)} onSave={(l) => save(l, false)} />
      <LessonEditor open={creating} onClose={() => setCreating(false)} nextPosition={nextPosition} onSave={(l) => save(l, true)} />
    </>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className="grid h-8 w-8 place-items-center rounded-[10px] bg-track text-fg2 hover:text-fg">{children}</button>;
}
