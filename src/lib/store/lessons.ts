"use client";

import { createLocalStore } from "./local";
import { dayKey, type Progress } from "@/lib/lessons/progress";

export const lessonStore = createLocalStore<Progress>("idrok.lessons", { completed: {} });

export function completeLesson(id: string, now = new Date()) {
  lessonStore.set((p) => (p.completed[id] ? p : { completed: { ...p.completed, [id]: dayKey(now) } }));
}
