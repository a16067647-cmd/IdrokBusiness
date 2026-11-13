import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUserMessage, cleanInput, OUTPUT_SCHEMA, validateOutput } from "../src/lib/agents/core.ts";

const good = {
  summary: "S",
  sections: [{ title: "T", items: [{ text: "a", level: "good" }, { text: "b", level: "risk" }] }],
  next_steps: ["1"], assumptions: [], verify: ["check"], draft: "",
};

test("accepts a well-formed agent answer", () => {
  assert.ok(validateOutput(good));
});

test("rejects malformed answers", () => {
  assert.equal(validateOutput(null), null);
  assert.equal(validateOutput({ ...good, summary: 3 }), null);
  assert.equal(validateOutput({ ...good, sections: [{ title: "T", items: [{ text: "a", level: "danger" }] }] }), null);
  assert.equal(validateOutput({ ...good, verify: "x" }), null);
});

test("input cleaning trims, bounds and requires the main field", () => {
  assert.equal(cleanInput("market", { product: "   " }), null);
  assert.equal(cleanInput("discovery", {}), null);
  const c = cleanInput("supplier", { product: "  spoon ", quantity: "120.7", details: "x".repeat(900), extra: "ignored" });
  assert.deepEqual(Object.keys(c!).sort(), ["details", "product", "quantity"]);
  assert.equal(c!.product, "spoon");
  assert.equal(c!.quantity, 120);
  assert.equal(c!.details!.length, 500);
  assert.deepEqual(cleanInput("manager", { product: "x" }), {});
});

test("the user message carries the language, rules and data as JSON", () => {
  const m = buildUserMessage("risk", { product: "spoon" }, { lang: "ru", level: 0, rules: { maxWeightKg: 0.5 } });
  assert.match(m, /Russian/);
  assert.match(m, /"maxWeightKg":0.5/);
  assert.match(m, /"product":"spoon"/);
});

test("schema closes every object (required by structured outputs)", () => {
  assert.equal(OUTPUT_SCHEMA.additionalProperties, false);
  assert.equal(OUTPUT_SCHEMA.properties.sections.items.additionalProperties, false);
  assert.equal(OUTPUT_SCHEMA.properties.sections.items.properties.items.items.additionalProperties, false);
});
