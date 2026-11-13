import { test } from "node:test";
import assert from "node:assert/strict";
import { verdictFor } from "../src/lib/verdict.ts";

test("missing numbers give no verdict", () => {
  assert.equal(verdictFor(null, 30), null);
  assert.equal(verdictFor(5, null), null);
});

test("loss when nothing is left or margin under 10%", () => {
  assert.equal(verdictFor(-1, -5), "loss");
  assert.equal(verdictFor(0, 0), "loss");
  assert.equal(verdictFor(0.5, 9.9), "loss");
});

test("risky from 10% up to 25%", () => {
  assert.equal(verdictFor(1, 10), "risky");
  assert.equal(verdictFor(2, 24.9), "risky");
});

test("good at 25% and above", () => {
  assert.equal(verdictFor(3, 25), "good");
  assert.equal(verdictFor(9, 60), "good");
});
