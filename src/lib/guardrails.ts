// Your own safety rules per level (not Amazon's or Uzum's).
// Levels unlock only on verified, paid-out net profit plus guardian approval.

export const RESTRICTED_CATEGORIES = ["batteries", "food", "cosmetics", "supplements", "medical"] as const;
export type RestrictedCategory = (typeof RESTRICTED_CATEGORIES)[number];

export interface Limits {
  maxUnitCost: number;     // USD
  maxOrderBudget: number;  // USD
  maxWeightKg: number;
  maxLongestCm: number;
  blocked: RestrictedCategory[];
}

/** Starting values for Level 0. You can change them in Products → Limits. */
export const LEVEL_0_DEFAULTS: Limits = {
  maxUnitCost: 5,
  maxOrderBudget: 300,
  maxWeightKg: 0.5,
  maxLongestCm: 30,
  blocked: [...RESTRICTED_CATEGORIES],
};

export interface GuardrailInput {
  unitCost?: number;
  orderBudget?: number;
  weightKg?: number;
  longestCm?: number;
  restricted?: RestrictedCategory[];
}

export type Violation =
  | { kind: "unitCost"; value: number; limit: number }
  | { kind: "orderBudget"; value: number; limit: number }
  | { kind: "weight"; value: number; limit: number }
  | { kind: "size"; value: number; limit: number }
  | { kind: "category"; category: RestrictedCategory };

export function checkGuardrails(p: GuardrailInput, l: Limits): Violation[] {
  const out: Violation[] = [];
  if (p.unitCost != null && p.unitCost > l.maxUnitCost) out.push({ kind: "unitCost", value: p.unitCost, limit: l.maxUnitCost });
  if (p.orderBudget != null && p.orderBudget > l.maxOrderBudget) out.push({ kind: "orderBudget", value: p.orderBudget, limit: l.maxOrderBudget });
  if (p.weightKg != null && p.weightKg > l.maxWeightKg) out.push({ kind: "weight", value: p.weightKg, limit: l.maxWeightKg });
  if (p.longestCm != null && p.longestCm > l.maxLongestCm) out.push({ kind: "size", value: p.longestCm, limit: l.maxLongestCm });
  for (const c of p.restricted ?? []) if (l.blocked.includes(c)) out.push({ kind: "category", category: c });
  return out;
}
