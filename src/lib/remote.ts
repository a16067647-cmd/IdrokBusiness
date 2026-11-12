"use client";

import { supabase } from "@/lib/supabase/client";
import type { AuditEntry, Product } from "@/lib/store/products";
import type { Progress } from "@/lib/lessons/progress";

// Writes to Supabase for the signed-in user. Local stores stay the fast cache;
// these calls mirror each change to the account. Failures are reported, never thrown.

let userId: string | null = null;
let onError: ((msg: string) => void) | null = null;

export function setRemoteUser(id: string | null) { userId = id; }
export function setRemoteErrorHandler(fn: ((msg: string) => void) | null) { onError = fn; }
export const remoteUser = () => userId;

function report(where: string, err: { message?: string } | null) {
  if (!err) return;
  const msg = `${where}: ${err.message ?? "unknown error"}`;
  if (process.env.NODE_ENV !== "production") console.error("[remote]", msg);
  onError?.(msg);
}

type Row = Record<string, unknown>;

const PRODUCT_COLS: Array<[keyof Product, string]> = [
  ["id", "id"], ["name", "name"], ["marketplace", "marketplace"], ["status", "status"],
  ["salePrice", "sale_price"], ["unitCost", "unit_cost"], ["shippingPerUnit", "shipping_per_unit"],
  ["feePct", "fee_pct"], ["fulfillmentFee", "fulfillment_fee"], ["otherPerUnit", "other_per_unit"],
  ["adPerUnit", "ad_per_unit"], ["quantity", "quantity"], ["weightKg", "weight_kg"], ["longestCm", "longest_cm"],
  ["restricted", "restricted"], ["notes", "notes"], ["rejectReason", "reject_reason"],
  ["createdAt", "created_at"], ["updatedAt", "updated_at"],
];

export function productToRow(p: Product): Row {
  const row: Row = {};
  for (const [k, col] of PRODUCT_COLS) row[col] = p[k] ?? null;
  return row;
}

export function rowToProduct(r: Row): Product {
  const p: Record<string, unknown> = {};
  for (const [k, col] of PRODUCT_COLS) {
    const v = r[col];
    p[k] = v === null || v === undefined ? undefined : typeof v === "string" && /_price|_cost|_per_unit|_pct|_fee|quantity|_kg|_cm/.test(col) ? Number(v) : v;
  }
  p.restricted = (r.restricted as string[] | null) ?? [];
  return p as unknown as Product;
}

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function pushProduct(p: Product): Promise<string | null> {
  const sb = supabase(); if (!sb || !userId || !isUuid(p.id)) return null;
  const { error } = await sb.from("products").upsert({ ...productToRow(p), user_id: userId });
  if (error?.message?.includes("LEVEL_RULE")) return error.message;
  report("products", error);
  return null;
}

export async function removeProduct(id: string) {
  const sb = supabase(); if (!sb || !userId || !isUuid(id)) return;
  const { error } = await sb.from("products").delete().eq("id", id);
  report("products", error);
}

export async function pushLesson(lessonId: string, day: string) {
  const sb = supabase(); if (!sb || !userId) return;
  const { error } = await sb.from("lesson_progress").upsert({ user_id: userId, lesson_id: lessonId, completed_on: day }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
  report("lessons", error);
}

export async function pushAudit(e: AuditEntry) {
  const sb = supabase(); if (!sb || !userId) return;
  const { error } = await sb.from("audit_log").insert({ user_id: userId, at: e.at, action: e.action, subject: e.subject.slice(0, 200), detail: e.detail?.slice(0, 1000) ?? null });
  report("audit", error);
}

export interface RemoteSnapshot { products: Product[]; lessons: Progress }

export async function pullAll(): Promise<RemoteSnapshot | null> {
  const sb = supabase(); if (!sb || !userId) return null;
  const [prod, les] = await Promise.all([
    sb.from("products").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    sb.from("lesson_progress").select("lesson_id, completed_on").eq("user_id", userId),
  ]);
  if (prod.error || les.error) {
    report("sync", prod.error ?? les.error);
    return null;
  }
  const completed: Record<string, string> = {};
  for (const r of les.data ?? []) completed[r.lesson_id as string] = r.completed_on as string;
  return {
    products: (prod.data ?? []).map(rowToProduct),
    lessons: { completed },
  };
}
