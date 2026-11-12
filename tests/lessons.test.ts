import { test } from "node:test";
import assert from "node:assert/strict";
import { COURSE as LEVEL0 } from "../src/lib/lessons/level0.ts";

test("level 0 has at least 10 lessons with unique ids", () => {
  assert.ok(LEVEL0.length >= 26);
  assert.equal(new Set(LEVEL0.map((l) => l.id)).size, LEVEL0.length);
});

test("every lesson is fully translated and ends with a valid quiz", () => {
  const texts: string[] = [];
  const collect = (v: unknown) => {
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.uz === "string" && typeof o.ru === "string") { texts.push(o.uz, o.ru); return; }
      Object.values(o).forEach(collect);
    }
  };
  for (const l of LEVEL0) {
    collect(l);
    const last = l.slides[l.slides.length - 1];
    assert.equal(last.kind, "quiz", `${l.id} should end with a quiz`);
    for (const s of l.slides) if (s.kind === "quiz") assert.ok(s.correct >= 0 && s.correct < s.options.length, `${l.id} quiz answer out of range`);
  }
  assert.ok(texts.every((s) => s.trim().length > 0), "no empty translations");
});
