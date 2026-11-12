// Profit math is plain, tested code — never an AI model.
// A missing input is reported as missing, never guessed.

export interface ProfitInput {
  salePrice?: number;        // price the customer pays, per unit
  unitCost?: number;         // supplier price, per unit
  shippingPerUnit?: number;  // freight + customs to the marketplace warehouse, per unit
  feePct?: number;           // marketplace commission, % of sale price
  fulfillmentFee?: number;   // marketplace fulfilment/logistics fee, per unit
  otherPerUnit?: number;     // packaging, labels, storage, etc.
  adPerUnit?: number;        // advertising spend divided by units sold
  quantity?: number;         // units in the order
}

export type RequiredField = "salePrice" | "unitCost" | "shippingPerUnit" | "feePct" | "fulfillmentFee";
export const REQUIRED: RequiredField[] = ["salePrice", "unitCost", "shippingPerUnit", "feePct", "fulfillmentFee"];

export interface ProfitResult {
  missing: RequiredField[];
  complete: boolean;
  feeAmount: number | null;
  costPerUnit: number | null;     // everything you pay per unit
  profitPerUnit: number | null;
  marginPct: number | null;       // profit / sale price
  roiPct: number | null;          // profit / money you put in per unit (unit + shipping + other)
  orderInvestment: number | null; // (unit + shipping + other) × quantity
  orderProfit: number | null;
  breakEvenPrice: number | null;  // sale price where profit = 0
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const round = (v: number, dp = 2) => Math.round(v * 10 ** dp) / 10 ** dp;

export function calculateProfit(i: ProfitInput): ProfitResult {
  const missing = REQUIRED.filter((k) => !isNum(i[k]));
  const empty: ProfitResult = {
    missing, complete: false, feeAmount: null, costPerUnit: null, profitPerUnit: null,
    marginPct: null, roiPct: null, orderInvestment: null, orderProfit: null, breakEvenPrice: null,
  };
  if (missing.length) return empty;

  const sale = i.salePrice!, pct = i.feePct! / 100;
  const other = isNum(i.otherPerUnit) ? i.otherPerUnit : 0;
  const ads = isNum(i.adPerUnit) ? i.adPerUnit : 0;
  const fixedPerUnit = i.unitCost! + i.shippingPerUnit! + i.fulfillmentFee! + other + ads;
  const feeAmount = sale * pct;
  const costPerUnit = fixedPerUnit + feeAmount;
  const profitPerUnit = sale - costPerUnit;
  const invested = i.unitCost! + i.shippingPerUnit! + other;
  const qty = isNum(i.quantity) && i.quantity > 0 ? Math.floor(i.quantity) : null;

  return {
    missing: [],
    complete: true,
    feeAmount: round(feeAmount),
    costPerUnit: round(costPerUnit),
    profitPerUnit: round(profitPerUnit),
    marginPct: sale > 0 ? round((profitPerUnit / sale) * 100, 1) : null,
    roiPct: invested > 0 ? round((profitPerUnit / invested) * 100, 1) : null,
    orderInvestment: qty === null ? null : round(invested * qty),
    orderProfit: qty === null ? null : round(profitPerUnit * qty),
    breakEvenPrice: pct < 1 ? round(fixedPerUnit / (1 - pct)) : null,
  };
}
