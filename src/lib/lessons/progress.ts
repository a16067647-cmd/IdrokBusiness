// Lesson unlocking and daily streak rules. Pure functions, tested in tests/progress.test.ts.
//
// Rules:
// - Every lesson is open from the start; there is no waiting between lessons.
// - A day counts for the streak when at least one lesson was finished that day.
// - One "freeze" per calendar week (Mon–Sun) covers one missed day inside a streak.
// - Streaks unlock nothing but lessons; levels unlock only on admin-verified net profit.

export type DayKey = string; // YYYY-MM-DD in the user's local time

export interface Progress {
  /** lessonId -> day it was finished */
  completed: Record<string, DayKey>;
}

export type LessonState = "done" | "open";

const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(d: Date): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parse(k: DayKey): Date {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d, 12); // noon avoids DST edge cases
}

export function addDays(k: DayKey, n: number): DayKey {
  const d = parse(k);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Monday of the week containing k. */
export function weekStart(k: DayKey): DayKey {
  const d = parse(k);
  const dow = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  return addDays(k, -dow);
}

export function lessonStates(ids: string[], p: Progress): LessonState[] {
  return ids.map((id) => (p.completed[id] ? "done" : "open"));
}

export type DayStatus = "done" | "freeze" | "missed" | "today" | "future";

export interface StreakInfo {
  current: number;
  doneToday: boolean;
  /** Mon–Sun of the current week */
  week: Array<{ day: DayKey; status: DayStatus }>;
}

export function streakInfo(p: Progress, today: DayKey): StreakInfo {
  const active = new Set(Object.values(p.completed));
  const doneToday = active.has(today);
  const earliest = [...active].sort()[0];
  const freezeUsed = new Set<DayKey>(); // week starts whose freeze is spent
  const freezeDays = new Set<DayKey>();

  let current = 0;
  if (earliest) {
    let day = doneToday ? today : addDays(today, -1);
    while (day >= earliest) {
      if (active.has(day)) {
        current++;
      } else {
        const wk = weekStart(day);
        // A freeze only bridges a gap: there must be an active day before it.
        if (freezeUsed.has(wk) || day <= earliest) break;
        freezeUsed.add(wk);
        freezeDays.add(day);
      }
      day = addDays(day, -1);
    }
    // A freeze at the very end of the walk that bridged nothing does not count.
    if (current === 0) freezeDays.clear();
  }

  const mon = weekStart(today);
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(mon, i);
    let status: DayStatus;
    if (active.has(day)) status = "done";
    else if (day === today) status = "today";
    else if (day > today) status = "future";
    else if (freezeDays.has(day)) status = "freeze";
    else status = "missed";
    return { day, status };
  });

  return { current, doneToday, week };
}
