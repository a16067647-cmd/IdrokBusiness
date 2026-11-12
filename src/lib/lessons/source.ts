"use client";

import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase/client";
import { COURSE } from "./level0";
import type { Lesson, LessonRecord } from "./types";

// Lessons come from the database so admins can change them. The bundled
// Level 0 course is the fallback when the database can't be reached.

interface State { lessons: LessonRecord[]; source: "bundled" | "database"; loading: boolean }

const bundled: LessonRecord[] = COURSE.map((l, i) => ({ ...l, position: i, published: true }));
let state: State = { lessons: bundled, source: "bundled", loading: true };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

const set = (next: State) => { state = next; listeners.forEach((l) => l()); };

type Row = { id: string; level: number; position: number; published: boolean; data: Omit<Lesson, "id" | "level"> };

export function rowToLesson(r: Row): LessonRecord {
  return { ...r.data, id: r.id, level: r.level, position: r.position, published: r.published };
}

export function lessonToRow(l: LessonRecord): Row {
  const { id, level, position, published, ...data } = l;
  return { id, level, position, published, data };
}

export function refreshLessons(): Promise<void> {
  const sb = supabase();
  if (!sb) { set({ ...state, loading: false }); return Promise.resolve(); }
  inflight = (async () => {
    const { data, error } = await sb.from("lessons").select("id, level, position, published, data").order("level").order("position");
    if (error || !data || data.length === 0) set({ ...state, loading: false });
    else set({ lessons: (data as Row[]).map(rowToLesson), source: "database", loading: false });
    inflight = null;
  })();
  return inflight;
}

/** All lessons visible to the current user, ordered by level and position. */
export function useLessons(): State {
  const s = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => ({ lessons: bundled, source: "bundled" as const, loading: true }),
  );
  useEffect(() => { if (s.loading && !inflight) void refreshLessons(); }, [s.loading]);
  return s;
}
