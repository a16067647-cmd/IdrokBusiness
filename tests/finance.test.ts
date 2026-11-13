import { test } from "node:test";
import assert from "node:assert/strict";
import { expenseTotals, planTotals, sliderRange } from "../src/lib/finance/summary.ts";

const full = { salePrice: 20, unitCost: 3, shippingPerUnit: 1.5, feePct: 15, fulfillmentFee: 4, otherPerUnit: 0.5, adPerUnit: 2, quantity: 100 };

test("plan totals add complete products per currency and skip rejected ones", () => {
  const t = planTotals([
    { ...full, marketplace: "amazon", status: "idea" },                          // invest 500, profit 600, margin 30
    { ...full, quantity: 50, marketplace: "amazon", status: "researching" },     // invest 250, profit 300
    { ...full, marketplace: "amazon", status: "rejected" },                      // ignored
    { salePrice: 20, marketplace: "amazon", status: "idea" },                    // incomplete
    { salePrice: 60000, unitCost: 15000, shippingPerUnit: 5000, feePct: 10, fulfillmentFee: 8000, quantity: 10, marketplace: "uzum", status: "idea" },
  ]);
  assert.deepEqual(t.USD, { products: 2, incomplete: 1, investment: 750, expectedProfit: 900, avgMarginPct: 30 });
  // UZS: fee 6000; profit 60000-15000-5000-8000-6000 = 26000 × 10; invest 20000 × 10
  assert.equal(t.UZS.expectedProfit, 260000);
  assert.equal(t.UZS.investment, 200000);
});

test("expense totals by currency, month and category", () => {
  const t = expenseTotals([
    { spent_on: "2026-11-02", category: "samples", amount: 30, currency: "USD" },
    { spent_on: "2026-11-10", category: "shipping", amount: 12.5, currency: "USD" },
    { spent_on: "2026-10-28", category: "samples", amount: 20, currency: "USD" },
    { spent_on: "2026-11-05", category: "ads", amount: 50000, currency: "UZS" },
  ], "2026-11-13");
  assert.equal(t.USD.total, 62.5);
  assert.equal(t.USD.thisMonth, 42.5);
  assert.equal(t.USD.byCategory.samples, 50);
  assert.equal(t.UZS.thisMonth, 50000);
});

test("slider ranges cover the current value", () => {
  assert.ok(sliderRange(12.99, 50).max >= 32);
  assert.equal(sliderRange(undefined, 50).max, 50);
  assert.ok(sliderRange(60000, 200000).step >= 1);
});
