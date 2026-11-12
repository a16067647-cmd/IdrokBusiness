"use client";

import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase/client";
import { RESTRICTED_CATEGORIES, type Limits, type RestrictedCategory } from "@/lib/guardrails";
import type { MarketplaceId } from "@/lib/marketplaces";

/** Rules for one level. Only admins can change them; the database enforces them on every product. */
export interface LevelRules {
  maxUnitCostUsd: number;
  maxOrderBudgetUsd: number;
  maxUnitCostUzs: number;
  maxOrderBudgetUzs: number;
  maxWeightKg: number;
  maxLongestCm: number;
  blocked: RestrictedCategory[];
  /** Admin-verified net profit (USD) needed to move to the next level. */
  profitToNextUsd: number;
}

export const DEFAULT_RULES: LevelRules = {
  maxUnitCostUsd: 5, maxOrderBudgetUsd: 300, maxUnitCostUzs: 60000, maxOrderBudgetUzs: 3500000,
  maxWeightKg: 0.5, maxLongestCm: 30, blocked: [...RESTRICTED_CATEGORIES], profitToNextUsd: 100,
};

export function toLimits(r: LevelRules, marketplace: MarketplaceId): Limits {
  const usd = marketplace === "amazon";
  return {
    maxUnitCost: usd ? r.maxUnitCostUsd : r.maxUnitCostUzs,
    maxOrderBudget: usd ? r.maxOrderBudgetUsd : r.maxOrderBudgetUzs,
    maxWeightKg: r.maxWeightKg,
    maxLongestCm: r.maxLongestCm,
    blocked: r.blocked,
  };
}

type Levels = Record<number, LevelRules>;
let levels: Levels = { 0: DEFAULT_RULES };
let loaded = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function refreshLevels(): Promise<void> {
  const sb = supabase();
  if (!sb) { loaded = true; return Promise.resolve(); }
  inflight = (async () => {
    const { data } = await sb.from("level_rules").select("level, rules").order("level");
    if (data && data.length) {
      const next: Levels = {};
      for (const row of data) next[row.level as number] = { ...DEFAULT_RULES, ...(row.rules as Partial<LevelRules>) };
      levels = next;
    }
    loaded = true;
    inflight = null;
    listeners.forEach((l) => l());
  })();
  return inflight;
}

export function useLevels(): Levels {
  const v = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => levels, () => levels);
  useEffect(() => { if (!loaded && !inflight) void refreshLevels(); }, []);
  return v;
}

/** Rules for a level, falling back to the highest defined level below it. */
export function rulesFor(all: Levels, level: number): LevelRules {
  for (let l = level; l >= 0; l--) if (all[l]) return all[l];
  return DEFAULT_RULES;
}
