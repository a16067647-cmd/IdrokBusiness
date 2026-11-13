"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Sheet } from "@/components/ui/Sheet";
import { Segmented } from "@/components/ui/Glass";
import { calculateProfit, type RequiredField } from "@/lib/profit";
import { checkGuardrails, RESTRICTED_CATEGORIES, type RestrictedCategory } from "@/lib/guardrails";
import { deleteProduct, saveProduct, type Product, type ProductStatus } from "@/lib/store/products";
import { rulesFor, toLimits, useLevels } from "@/lib/levels";
import { useAuth } from "@/components/providers/AuthProvider";
import { MARKETPLACES, type MarketplaceId } from "@/lib/marketplaces";
import { money, pct } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n";
import { ViolationList } from "./ViolationList";

const NUM_FIELDS = ["salePrice", "unitCost", "shippingPerUnit", "feePct", "fulfillmentFee", "otherPerUnit", "adPerUnit", "quantity", "weightKg", "longestCm"] as const;
type NumField = (typeof NUM_FIELDS)[number];
const LABEL: Record<NumField, MessageKey> = {
  salePrice: "field.salePrice", unitCost: "field.unitCost", shippingPerUnit: "field.shipping", feePct: "field.feePct",
  fulfillmentFee: "field.fulfillment", otherPerUnit: "field.other", adPerUnit: "field.ads", quantity: "field.quantity",
  weightKg: "field.weight", longestCm: "field.longest",
};
const OPTIONAL: NumField[] = ["otherPerUnit", "adPerUnit", "quantity", "weightKg", "longestCm"];

type Form = { name: string; marketplace: MarketplaceId; status: ProductStatus; restricted: RestrictedCategory[]; notes: string } & Record<NumField, string>;

const toForm = (p?: Product): Form => ({
  name: p?.name ?? "", marketplace: p?.marketplace ?? "amazon", status: p?.status ?? "idea",
  restricted: p?.restricted ?? [], notes: p?.notes ?? "",
  ...Object.fromEntries(NUM_FIELDS.map((k) => [k, p?.[k] != null ? String(p[k]) : ""])) as Record<NumField, string>,
});
const parse = (s: string): number | undefined => {
  const v = parseFloat(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(v) && v >= 0 ? v : undefined;
};

export function ProductEditor({ product, open, onClose }: { product?: Product; open: boolean; onClose: () => void }) {
  const { t, lang } = usePrefs();
  const levels = useLevels();
  const { profile } = useAuth();
  const level = profile?.level ?? 0;
  const [f, setF] = useState<Form>(toForm(product));
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => { if (open) { setF(toForm(product)); setConfirmDelete(false); } }, [open, product]);

  const nums = useMemo(() => Object.fromEntries(NUM_FIELDS.map((k) => [k, parse(f[k])])) as Record<NumField, number | undefined>, [f]);
  const result = calculateProfit(nums);
  const orderBudget = nums.unitCost != null && nums.quantity != null ? (nums.unitCost + (nums.shippingPerUnit ?? 0)) * nums.quantity : undefined;
  const violations = checkGuardrails({ unitCost: nums.unitCost, orderBudget, weightKg: nums.weightKg, longestCm: nums.longestCm, restricted: f.restricted }, toLimits(rulesFor(levels, level), f.marketplace));
  const m = (v: number | null) => money(v, f.marketplace, lang);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const canSave = f.name.trim().length > 0 && violations.length === 0;

  const save = () => {
    if (!canSave) return;
    saveProduct({ id: product?.id, name: f.name.trim().slice(0, 120), marketplace: f.marketplace, status: f.status, restricted: f.restricted, notes: f.notes.trim().slice(0, 1000) || undefined, ...nums });
    onClose();
  };

  const numInput = (k: NumField) => (
    <label key={k} className="grid gap-1.5">
      <span className="text-[13px] font-semibold text-fg2">{t(LABEL[k])}{OPTIONAL.includes(k) && <span className="font-normal text-fg3"> · {t("field.optional")}</span>}</span>
      <input className="field num" inputMode="decimal" value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder="0" id={`f-${k}`} />
    </label>
  );

  return (
    <Sheet open={open} onClose={onClose} title={product ? t("products.edit") : t("products.new")}
      footer={<>
        {product && (confirmDelete
          ? <button type="button" className="btn btn-sm mr-auto bg-danger-soft text-danger-fg" onClick={() => { deleteProduct(product.id); onClose(); }}>{t("products.deleteConfirm")}</button>
          : <button type="button" className="btn btn-sm mr-auto text-danger-fg" onClick={() => setConfirmDelete(true)}>{t("common.delete")}</button>)}
        <button type="button" className="btn btn-sm bg-track text-fg" onClick={onClose}>{t("common.cancel")}</button>
        <button type="button" className="btn btn-primary btn-sm" disabled={!canSave} onClick={save}>{t("common.save")}</button>
      </>}>
      <div className="grid gap-5">
        <fieldset className="grid gap-3">
          <legend className="label-caps mb-2">{t("group.basics")}</legend>
          <label className="grid gap-1.5">
            <span className="text-[13px] font-semibold text-fg2">{t("field.name")}</span>
            <input id="f-name" className="field" value={f.name} maxLength={120} onChange={(e) => set("name", e.target.value)} placeholder={t("field.namePh")} />
          </label>
          <div className="flex flex-wrap gap-3">
            <div className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("field.marketplace")}</span>
              <Segmented<MarketplaceId> label={t("field.marketplace")} value={f.marketplace} onChange={(v) => set("marketplace", v)} options={MARKETPLACES.map((x) => ({ value: x.id, label: x.name }))} /></div>
            <div className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("field.status")}</span>
              <Segmented<ProductStatus> label={t("field.status")} value={f.status} onChange={(v) => set("status", v)}
                options={(["idea", "researching", "rejected"] as ProductStatus[]).map((s) => ({ value: s, label: t(`pstatus.${s}` as MessageKey) }))} /></div>
          </div>
          <div className="grid gap-1.5">
            <span className="text-[13px] font-semibold text-fg2">{t("field.restricted")}</span>
            <div className="flex flex-wrap gap-2">
              {RESTRICTED_CATEGORIES.map((c) => {
                const on = f.restricted.includes(c);
                return (
                  <button key={c} type="button" aria-pressed={on} onClick={() => set("restricted", on ? f.restricted.filter((x) => x !== c) : [...f.restricted, c])}
                    className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${on ? "bg-danger-soft text-danger-fg" : "bg-track text-fg2"}`}>
                    {t(`cat.${c}` as MessageKey)}
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="label-caps mb-2">{t("group.prices")}</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{(["salePrice", "unitCost", "shippingPerUnit", "feePct", "fulfillmentFee", "otherPerUnit", "adPerUnit", "quantity"] as NumField[]).map(numInput)}</div>
          <p className="m-0 text-[12px] text-fg3">{t("calc.feeHint")}</p>
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="label-caps mb-2">{t("group.size")}</legend>
          <div className="grid grid-cols-2 items-end gap-3">{(["weightKg", "longestCm"] as NumField[]).map(numInput)}</div>
        </fieldset>

        <section aria-label={t("calc.title")} className="rounded-[18px] bg-track p-4">
          <h3 className="mb-3 mt-0 text-[15px] font-bold">{t("calc.title")}</h3>
          {result.complete ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Stat label={t("calc.profitPerUnit")} value={m(result.profitPerUnit)} tone={result.profitPerUnit! < 0 ? "bad" : "good"} big />
              <Stat label={t("calc.margin")} value={pct(result.marginPct)} />
              <Stat label={t("calc.roi")} value={pct(result.roiPct)} />
              <Stat label={t("calc.fee")} value={m(result.feeAmount)} />
              <Stat label={t("calc.cost")} value={m(result.costPerUnit)} />
              <Stat label={t("calc.breakEven")} value={m(result.breakEvenPrice)} />
              {result.orderInvestment != null && <Stat label={t("calc.investment")} value={m(result.orderInvestment)} />}
              {result.orderProfit != null && <Stat label={t("calc.orderProfit")} value={m(result.orderProfit)} tone={result.orderProfit < 0 ? "bad" : "good"} />}
            </div>
          ) : (
            <p className="m-0 text-sm text-fg2">{t("calc.missing", { fields: result.missing.map((k: RequiredField) => t(LABEL[k])).join(", ") })}</p>
          )}
        </section>

        <ViolationList violations={violations} marketplace={f.marketplace} />
        {violations.length > 0 && <p className="-mt-2 mb-0 text-[13px] font-semibold text-danger-fg">{t("viol.blockSave", { n: level })}</p>}

        {product && (
          <div className="flex flex-wrap gap-2">
            <a href={`/agents?agent=risk&product=${encodeURIComponent(product.name)}`} className="btn btn-sm bg-soft-blue text-primary">{t("products.askAi")}</a>
            <a href={`/approvals?product=${product.id}`} className="btn btn-sm bg-track text-fg">{t("products.requestApproval")}</a>
          </div>
        )}

        <label className="grid gap-1.5">
          <span className="text-[13px] font-semibold text-fg2">{t("field.notes")} <span className="font-normal text-fg3">· {t("field.optional")}</span></span>
          <textarea id="f-notes" className="field h-24 py-3" value={f.notes} maxLength={1000} onChange={(e) => set("notes", e.target.value)} />
        </label>
      </div>
    </Sheet>
  );
}

function Stat({ label, value, tone, big }: { label: string; value: string; tone?: "good" | "bad"; big?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] text-fg2">{label}</div>
      <div className={`num truncate font-semibold ${big ? "text-[22px]" : "text-[15px]"} ${tone === "bad" ? "text-danger-fg" : tone === "good" ? "text-success-fg" : ""}`}>{value}</div>
    </div>
  );
}

