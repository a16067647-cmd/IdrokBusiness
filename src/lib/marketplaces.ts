import type { MessageKey } from "./i18n";

export type MarketplaceId = "amazon" | "uzum";
export type ConnectionStatus = "awaiting" | "connected";

export interface Marketplace {
  id: MarketplaceId;
  name: string;
  initial: string;
  region: MessageKey;
  currency: "USD" | "UZS";
  /** Live data appears only once a real seller account is connected. */
  status: ConnectionStatus;
  /** Official fee pages. Fee numbers are entered from these pages, never guessed. */
  feeSource: string;
}

export const MARKETPLACES: Marketplace[] = [
  { id: "amazon", name: "Amazon", initial: "A", region: "mkt.amazon.region", currency: "USD", status: "awaiting", feeSource: "https://sell.amazon.com/pricing" },
  { id: "uzum", name: "Uzum Market", initial: "U", region: "mkt.uzum.region", currency: "UZS", status: "awaiting", feeSource: "https://seller.uzum.uz" },
];

export const getMarketplace = (id: string) => MARKETPLACES.find((m) => m.id === id);
