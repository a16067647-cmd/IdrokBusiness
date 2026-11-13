// Finance totals. Pure functions (tested in tests/finance.test.ts).
// Plan figures come from each product's own numbers via calculateProfit;
// they are a plan, not sales. Currencies are never mixed.

import { calculateProfit, type ProfitInput } from "../profit.ts";

export type Currency = "USD" | "UZS";
export const EXPENSE_CATEGORIES = ["samples", "inventory", "shipping", "fees", "ads", "tools", "other"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface PlanProduct extends ProfitInput { marketplace: "amazon" | "uzum"; status: string }
export interface Expense { spent_on: string; category: ExpenseCategory; amount: number; currency: Currency }

export interface PlanTotals {
  products: number;         // products with complete numbers
  incomplete: number;       // products missing inputs
  investment: number;       // sum of order investment (unit + shipping + other) × quantity
  expectedProfit: number;   // sum of order profit if every unit sells at the planned price
  avgMarginPct: number | null;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Plan totals per currency, ignoring rejected products. */
export function planTotals(products: PlanProduct[]): Record<Currency, PlanTotals> {
  const out: Record<Currency, PlanTotals & { marginSum: number }> = {
    USD: { products: 0, incomplete: 0, investment: 0, expectedProfit: 0, avgMarginPct: null, marginSum: 0 },
    UZS: { products: 0, incomplete: 0, investment: 0, expectedProfit: 0, avgMarginPct: null, marginSum: 0 },
  };
  for (const p of products) {
    if (p.status === "rejected") continue;
    const t = out[p.marketplace === "uzum" ? "UZS" : "USD"];
    const r = calculateProfit(p);
    if (!r.complete) { t.incomplete++; continue; }
    t.products++;
    t.marginSum += r.marginPct ?? 0;
    t.investment += r.orderInvestment ?? 0;
    t.expectedProfit += r.orderProfit ?? 0;
  }
  const finish = (t: PlanTotals & { marginSum: number }): PlanTotals => ({
    products: t.products, incomplete: t.incomplete,
    investment: round2(t.investment), expectedProfit: round2(t.expectedProfit),
    avgMarginPct: t.products ? Math.round((t.marginSum / t.products) * 10) / 10 : null,
  });
  return { USD: finish(out.USD), UZS: finish(out.UZS) };
}

export interface ExpenseTotals { total: number; thisMonth: number; byCategory: Partial<Record<ExpenseCategory, number>> }

/** Expense totals per currency; "this month" uses the YYYY-MM of `today`. */
export function expenseTotals(expenses: Expense[], today: string): Record<Currency, ExpenseTotals> {
  const month = today.slice(0, 7);
  const out: Record<Currency, ExpenseTotals> = {
    USD: { total: 0, thisMonth: 0, byCategory: {} },
    UZS: { total: 0, thisMonth: 0, byCategory: {} },
  };
  for (const e of expenses) {
    const t = out[e.currency];
    t.total += e.amount;
    if (e.spent_on.startsWith(month)) t.thisMonth += e.amount;
    t.byCategory[e.category] = (t.byCategory[e.category] ?? 0) + e.amount;
  }
  for (const c of ["USD", "UZS"] as Currency[]) {
    out[c].total = round2(out[c].total);
    out[c].thisMonth = round2(out[c].thisMonth);
    for (const k of Object.keys(out[c].byCategory) as ExpenseCategory[]) out[c].byCategory[k] = round2(out[c].byCategory[k]!);
  }
  return out;
}

/** Slider range for a what-if field: 0 to a bit above the current value. */
export function sliderRange(value: number | undefined, fallbackMax: number): { min: number; max: number; step: number } {
  const v = value ?? 0;
  const max = Math.max(fallbackMax, Math.ceil(v * 2.5));
  const step = max > 1000 ? Math.pow(10, Math.floor(Math.log10(max)) - 2) : max > 100 ? 1 : 0.05;
  return { min: 0, max, step };
}
