import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, lessonStates, streakInfo, weekStart } from "../src/lib/lessons/progress.ts";

const ids = ["l1", "l2", "l3"];

test("first lesson is open, the rest locked", () => {
  assert.deepEqual(lessonStates(ids, { completed: {} }, "2026-11-12"), ["open", "locked", "locked"]);
});

test("next lesson opens the day after the previous one is finished", () => {
  const p = { completed: { l1: "2026-11-12" } };
  assert.deepEqual(lessonStates(ids, p, "2026-11-12"), ["done", "tomorrow", "locked"]);
  assert.deepEqual(lessonStates(ids, p, "2026-11-13"), ["done", "open", "locked"]);
});

test("weeks start on Monday", () => {
  assert.equal(weekStart("2026-11-12"), "2026-11-09"); // Thursday -> Monday
  assert.equal(weekStart("2026-11-09"), "2026-11-09");
  assert.equal(weekStart("2026-11-15"), "2026-11-09"); // Sunday
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("streak counts consecutive days and keeps going before today's lesson", () => {
  const p = { completed: { a: "2026-11-10", b: "2026-11-11" } };
  assert.equal(streakInfo(p, "2026-11-12").current, 2);
  assert.equal(streakInfo(p, "2026-11-12").doneToday, false);
  const p2 = { completed: { ...p.completed, c: "2026-11-12" } };
  assert.equal(streakInfo(p2, "2026-11-12").current, 3);
});

test("one missed day per week is covered by a freeze", () => {
  // Tue done, Wed missed, Thu done -> streak 2 with Wed frozen
  const p = { completed: { a: "2026-11-10", c: "2026-11-12" } };
  const s = streakInfo(p, "2026-11-12");
  assert.equal(s.current, 2);
  assert.equal(s.week.find((d) => d.day === "2026-11-11")?.status, "freeze");
});

test("two missed days in the same week break the streak", () => {
  const p = { completed: { a: "2026-11-09", c: "2026-11-12" } }; // Tue + Wed missed
  assert.equal(streakInfo(p, "2026-11-12").current, 1);
});

test("no lessons means no streak", () => {
  const s = streakInfo({ completed: {} }, "2026-11-12");
  assert.equal(s.current, 0);
  assert.equal(s.week.length, 7);
  assert.equal(s.week[3].status, "today");
});
