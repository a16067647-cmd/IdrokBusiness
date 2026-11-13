// The five-step path. Steps are strictly in order: a step only counts as done
// when every step before it is done, so the path never shows gaps.

export const PATH_STEPS = 5;

export interface PathFacts {
  lessonsDone: number;
  productsChecked: number;
  approvedPurchases: number;
  verifiedProfitUsd: number;
}

export const LESSONS_TO_START = 3;

/** Whether each step's own goal is met, ignoring order. */
export function goals(f: PathFacts): boolean[] {
  return [
    f.lessonsDone >= LESSONS_TO_START,
    f.productsChecked > 0,
    f.approvedPurchases > 0,
    f.verifiedProfitUsd > 0, // ordered and shipped: proven by the first confirmed profit
    f.verifiedProfitUsd > 0,
  ];
}

/** How many steps are done, counting from the first one and stopping at the first gap. */
export function doneCount(f: PathFacts): number {
  const g = goals(f);
  let n = 0;
  while (n < g.length && g[n]) n++;
  return n;
}

export type PathEvent = { kind: "none" } | { kind: "step"; from: number; to: number } | { kind: "finish"; from: number };

/**
 * What to celebrate, given the count the user last saw and the count now.
 * First visit (nothing seen yet) celebrates nothing, so old progress does not
 * set off confetti.
 */
export function pathEvent(seen: number | null, now: number): PathEvent {
  if (seen == null || now <= seen) return { kind: "none" };
  if (now >= PATH_STEPS) return { kind: "finish", from: seen };
  return { kind: "step", from: seen, to: now };
}

/** Where a round of the path started. Round 1 starts from zero. */
export interface RoundBase { round: number; productsChecked: number; approvedPurchases: number; verifiedProfitUsd: number }
export const FIRST_ROUND: RoundBase = { round: 1, productsChecked: 0, approvedPurchases: 0, verifiedProfitUsd: 0 };

/** Progress inside the current round: only what happened since it started counts (lessons stay learned). */
export function roundFacts(f: PathFacts, b: RoundBase): PathFacts {
  return {
    lessonsDone: f.lessonsDone,
    productsChecked: Math.max(0, f.productsChecked - b.productsChecked),
    approvedPurchases: Math.max(0, f.approvedPurchases - b.approvedPurchases),
    verifiedProfitUsd: Math.max(0, f.verifiedProfitUsd - b.verifiedProfitUsd),
  };
}

/** Start the next round from everything done so far. */
export function nextRound(f: PathFacts, b: RoundBase): RoundBase {
  return { round: b.round + 1, productsChecked: f.productsChecked, approvedPurchases: f.approvedPurchases, verifiedProfitUsd: f.verifiedProfitUsd };
}
