import type { Lang } from "./i18n";
import type { MarketplaceId } from "./marketplaces";

// Hand-rolled formatting so the server and every browser print the same text
// (Intl support for uz-UZ differs between Node and Chromium).
function group(int: string, sep: string) {
  let out = "";
  for (let i = 0; i < int.length; i++) {
    if (i > 0 && (int.length - i) % 3 === 0) out += sep;
    out += int[i];
  }
  return out;
}

export function money(v: number | null | undefined, marketplace: MarketplaceId, lang: Lang): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const neg = v < 0 ? "−" : "";
  const abs = Math.abs(v);
  if (marketplace === "uzum") {
    return `${neg}${group(String(Math.round(abs)), " ")} ${lang === "ru" ? "сум" : "so'm"}`;
  }
  const [i, d] = abs.toFixed(2).split(".");
  return `${neg}$${group(i, ",")}.${d}`;
}

export const pct = (v: number | null | undefined) => (v == null ? "—" : `${v.toFixed(1)}%`);
