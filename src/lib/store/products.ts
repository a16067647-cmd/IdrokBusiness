"use client";

import { createLocalStore } from "./local";
import { LEVEL_0_DEFAULTS, type Limits, type RestrictedCategory } from "@/lib/guardrails";
import type { MarketplaceId } from "@/lib/marketplaces";

export type ProductStatus = "idea" | "researching" | "approved" | "rejected";

export interface Product {
  id: string;
  name: string;
  marketplace: MarketplaceId;
  status: ProductStatus;
  salePrice?: number;
  unitCost?: number;
  shippingPerUnit?: number;
  feePct?: number;
  fulfillmentFee?: number;
  otherPerUnit?: number;
  adPerUnit?: number;
  quantity?: number;
  weightKg?: number;
  longestCm?: number;
  restricted: RestrictedCategory[];
  notes?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry { id: string; at: string; action: "create" | "update" | "delete" | "status" | "limits"; subject: string; detail?: string }

export interface UserLimits { usd: Limits; uzs: Pick<Limits, "maxUnitCost" | "maxOrderBudget"> }
export const DEFAULT_LIMITS: UserLimits = {
  usd: LEVEL_0_DEFAULTS,
  uzs: { maxUnitCost: 60000, maxOrderBudget: 3500000 },
};

export const productsStore = createLocalStore<Product[]>("idrok.products", []);
export const auditStore = createLocalStore<AuditEntry[]>("idrok.audit", []);
export const limitsStore = createLocalStore<UserLimits>("idrok.limits", DEFAULT_LIMITS);

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

function audit(action: AuditEntry["action"], subject: string, detail?: string) {
  auditStore.set((log) => [{ id: uid(), at: new Date().toISOString(), action, subject, detail }, ...log].slice(0, 500));
}

export function saveProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt"> & { id?: string }): Product {
  const now = new Date().toISOString();
  let saved!: Product;
  productsStore.set((list) => {
    const existing = input.id ? list.find((p) => p.id === input.id) : undefined;
    if (existing) {
      saved = { ...existing, ...input, id: existing.id, updatedAt: now };
      return list.map((p) => (p.id === existing.id ? saved : p));
    }
    saved = { ...input, id: uid(), createdAt: now, updatedAt: now };
    return [saved, ...list];
  });
  audit(input.id ? "update" : "create", saved.name);
  return saved;
}

export function deleteProduct(id: string) {
  const p = productsStore.get().find((x) => x.id === id);
  productsStore.set((list) => list.filter((x) => x.id !== id));
  if (p) audit("delete", p.name);
}

export function setLimits(next: UserLimits) {
  limitsStore.set(next);
  audit("limits", "level-0");
}

export function limitsFor(l: UserLimits, marketplace: MarketplaceId): Limits {
  return marketplace === "uzum" ? { ...l.usd, ...l.uzs } : l.usd;
}
