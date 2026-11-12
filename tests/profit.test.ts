import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateProfit } from "../src/lib/profit.ts";
import { checkGuardrails, LEVEL_0_DEFAULTS } from "../src/lib/guardrails.ts";

test("reports missing inputs instead of guessing", () => {
  const r = calculateProfit({ salePrice: 20, unitCost: 3 });
  assert.equal(r.complete, false);
  assert.deepEqual(r.missing, ["shippingPerUnit", "feePct", "fulfillmentFee"]);
  assert.equal(r.profitPerUnit, null);
});

test("computes per-unit profit, margin, ROI and order totals", () => {
  const r = calculateProfit({ salePrice: 20, unitCost: 3, shippingPerUnit: 1.5, feePct: 15, fulfillmentFee: 4, otherPerUnit: 0.5, adPerUnit: 2, quantity: 100 });
  // fee 3.00; costs 3 + 1.5 + 4 + 0.5 + 2 + 3 = 14
  assert.equal(r.feeAmount, 3);
  assert.equal(r.costPerUnit, 14);
  assert.equal(r.profitPerUnit, 6);
  assert.equal(r.marginPct, 30);
  assert.equal(r.roiPct, 120); // 6 / (3 + 1.5 + 0.5)
  assert.equal(r.orderInvestment, 500);
  assert.equal(r.orderProfit, 600);
  // break-even: (3+1.5+4+0.5+2)/(0.85) = 12.94
  assert.equal(r.breakEvenPrice, 12.94);
});

test("a loss is shown as a negative profit", () => {
  const r = calculateProfit({ salePrice: 8, unitCost: 4, shippingPerUnit: 2, feePct: 15, fulfillmentFee: 3 });
  assert.equal(r.profitPerUnit, -2.2);
  assert.equal(r.orderProfit, null); // no quantity given
});

test("guardrails flag cost, budget, weight, size and blocked categories", () => {
  const v = checkGuardrails({ unitCost: 6, orderBudget: 400, weightKg: 0.8, longestCm: 35, restricted: ["batteries"] }, LEVEL_0_DEFAULTS);
  assert.deepEqual(v.map((x) => x.kind), ["unitCost", "orderBudget", "weight", "size", "category"]);
  assert.equal(checkGuardrails({ unitCost: 2, orderBudget: 200, weightKg: 0.2, longestCm: 20, restricted: [] }, LEVEL_0_DEFAULTS).length, 0);
});
