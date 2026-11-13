import { test } from "node:test";
import assert from "node:assert/strict";
import { doneCount, pathEvent } from "../src/lib/path.ts";

const f = (o: Partial<{ lessonsDone: number; productsChecked: number; approvedPurchases: number; verifiedProfitUsd: number }> = {}) =>
  ({ lessonsDone: 0, productsChecked: 0, approvedPurchases: 0, verifiedProfitUsd: 0, ...o });

test("nothing done", () => assert.equal(doneCount(f()), 0));

test("steps count only in order: later goals don't skip an unfinished step", () => {
  // The bug from the screenshot: lessons done, no product, but approval and profit exist.
  assert.equal(doneCount(f({ lessonsDone: 5, approvedPurchases: 1, verifiedProfitUsd: 50 })), 1);
  assert.equal(doneCount(f({ approvedPurchases: 1, verifiedProfitUsd: 50, productsChecked: 2 })), 0);
});

test("all goals met: 5", () => assert.equal(doneCount(f({ lessonsDone: 3, productsChecked: 1, approvedPurchases: 1, verifiedProfitUsd: 1 })), 5));

test("celebrations", () => {
  assert.deepEqual(pathEvent(null, 3), { kind: "none" });
  assert.deepEqual(pathEvent(2, 2), { kind: "none" });
  assert.deepEqual(pathEvent(3, 1), { kind: "none" });
  assert.deepEqual(pathEvent(1, 2), { kind: "step", from: 1, to: 2 });
  assert.deepEqual(pathEvent(4, 5), { kind: "finish", from: 4 });
});

import { FIRST_ROUND, nextRound, roundFacts } from "../src/lib/path.ts";

test("a new round counts only new work; lessons stay learned", () => {
  const all = f({ lessonsDone: 4, productsChecked: 2, approvedPurchases: 1, verifiedProfitUsd: 120 });
  assert.equal(doneCount(roundFacts(all, FIRST_ROUND)), 5);
  const r2 = nextRound(all, FIRST_ROUND);
  assert.equal(r2.round, 2);
  assert.equal(doneCount(roundFacts(all, r2)), 1);
  assert.equal(doneCount(roundFacts({ ...all, productsChecked: 3 }, r2)), 2);
});
