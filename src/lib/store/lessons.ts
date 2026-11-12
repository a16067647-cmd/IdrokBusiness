"use client";

import { createLocalStore } from "./local";
import { dayKey, type Progress } from "@/lib/lessons/progress";
import { pushLesson } from "@/lib/remote";
import { audit } from "./products";

export const lessonStore = createLocalStore<Progress>("idrok.lessons", { completed: {} });

export function completeLesson(id: string, now = new Date()) {
  if (lessonStore.get().completed[id]) return;
  const day = dayKey(now);
  lessonStore.set((p) => ({ completed: { ...p.completed, [id]: day } }));
  audit("lesson", id);
  void pushLesson(id, day);
}
