// The one-word answer the simple product check gives: good, risky or loss.
// Plain rule on the app's own profit math (never an AI model):
// - loss:  no profit per sale, or margin under 10%
// - risky: margin from 10% up to 25%
// - good:  margin 25% or more

export type Verdict = "good" | "risky" | "loss";

export const GOOD_MARGIN = 25;
export const RISKY_MARGIN = 10;

export function verdictFor(profitPerUnit: number | null, marginPct: number | null): Verdict | null {
  if (profitPerUnit == null || marginPct == null) return null;
  if (profitPerUnit <= 0 || marginPct < RISKY_MARGIN) return "loss";
  if (marginPct < GOOD_MARGIN) return "risky";
  return "good";
}
