"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, Pill, Segmented } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { supabase } from "@/lib/supabase/client";
import { audit, productsStore, saveProduct } from "@/lib/store/products";
import { rulesFor, useLevels } from "@/lib/levels";
import { money } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n";

type Status = "pending" | "approved" | "rejected" | "expired";
interface Approval {
  id: string; product_id: string; action: "sample" | "order"; supplier: string; quantity: number; max_spend: number;
  currency: "USD" | "UZS"; shipping: string; risks: string; status: Status; approver_name: string | null;
  decision_note: string | null; expires_at: string; decided_at: string | null; created_at: string;
}
const TONE = { pending: "wait", approved: "ok", rejected: "danger", expired: "muted" } as const;

export default function ApprovalsPage() {
  const { t, lang } = usePrefs();
  const { session, profile } = useAuth();
  const products = productsStore.use();
  const levels = useLevels();
  const level = profile?.level ?? 0;
  const rules = rulesFor(levels, level);
  const [items, setItems] = useState<Approval[]>([]);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [f, setF] = useState({ productId: "", action: "sample" as "sample" | "order", supplier: "", quantity: "", maxSpend: "", shipping: "", risks: "", days: "14" });
  const [deciding, setDeciding] = useState<string | null>(null);
  const [approver, setApprover] = useState("");
  const [checked, setChecked] = useState(false);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase()!.from("approvals").select("*").order("created_at", { ascending: false });
    setItems((data ?? []).map((a) => ({ ...a, max_spend: Number(a.max_spend) })) as Approval[]);
  }, []);
  useEffect(() => { if (session) void load(); }, [session, load]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("product");
    if (id) setF((x) => ({ ...x, productId: id }));
  }, []);

  const product = products.find((p) => p.id === f.productId);
  const currency = product?.marketplace === "uzum" ? "UZS" : "USD";
  const mk = product?.marketplace ?? "amazon";
  // Pre-fill quantity and spend from the product when one is picked.
  useEffect(() => {
    if (!product) return;
    const qty = product.quantity ?? (f.action === "sample" ? 1 : undefined);
    const spend = qty && product.unitCost != null ? Math.round((product.unitCost + (product.shippingPerUnit ?? 0)) * qty * 100) / 100 : undefined;
    setF((x) => ({ ...x, quantity: x.quantity || (qty ? String(qty) : ""), maxSpend: x.maxSpend || (spend ? String(spend) : "") }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.productId]);

  const budget = currency === "USD" ? rules.maxOrderBudgetUsd : rules.maxOrderBudgetUzs;
  const spendNum = parseFloat(f.maxSpend.replace(",", "."));
  const qtyNum = parseInt(f.quantity, 10);
  const over = Number.isFinite(spendNum) && spendNum > budget;
  const canSubmit = !!product && f.supplier.trim() && qtyNum > 0 && spendNum > 0 && !over;

  const submit = async () => {
    if (!canSubmit || !product) return;
    const expires = new Date(Date.now() + Number(f.days) * 86400000).toISOString();
    const { error } = await supabase()!.from("approvals").insert({
      product_id: product.id, action: f.action, supplier: f.supplier.trim().slice(0, 120), quantity: qtyNum, max_spend: spendNum,
      currency, shipping: f.shipping.trim().slice(0, 500), risks: f.risks.trim().slice(0, 1000), expires_at: expires,
    });
    if (error) { setMsg({ tone: "err", text: t("appr.err", { msg: error.message.includes("LEVEL_RULE") ? t("appr.overBudget", { n: level, limit: money(budget, mk, lang) }) : error.message }) }); return; }
    audit("create", `approval:${product.name}`, `${f.action} ${qtyNum} ${currency} ${spendNum}`);
    setF({ productId: "", action: "sample", supplier: "", quantity: "", maxSpend: "", shipping: "", risks: "", days: "14" });
    setMsg(null);
    await load();
  };

  const decide = async (a: Approval, approve: boolean) => {
    const patch = approve
      ? { status: "approved", approver_name: approver.trim().slice(0, 80), decided_at: new Date().toISOString() }
      : { status: "rejected", decision_note: reason.trim().slice(0, 500), decided_at: new Date().toISOString() };
    const { error } = await supabase()!.from("approvals").update(patch).eq("id", a.id);
    if (error) { setMsg({ tone: "err", text: t("appr.err", { msg: error.message }) }); return; }
    const p = products.find((x) => x.id === a.product_id);
    if (!approve && p) saveProduct({ ...p, status: "rejected", rejectReason: reason.trim().slice(0, 500) }); // remembered by the AI
    audit("status", `approval:${p?.name ?? a.product_id}`, approve ? `approved by ${approver.trim()}` : `rejected: ${reason.trim()}`);
    setMsg(approve ? { tone: "ok", text: t("appr.afterApprove") } : null);
    setDeciding(null); setApprover(""); setChecked(false); setReason("");
    await load();
  };

  const names = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const effective = (a: Approval): Status => (a.status === "approved" && new Date(a.expires_at) < new Date() ? "expired" : a.status);

  if (!session) {
    return <div data-motion-preset="dashboard" className="pt-6"><h1 className="m-0 mb-4 text-[30px] font-extrabold tracking-[-0.03em]">{t("appr.title")}</h1><Card><p className="m-0 text-sm text-fg2">{t("appr.signin")}</p></Card></div>;
  }

  return (
    <div data-motion-preset="dashboard" className="pt-6">
      <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.03em]">{t("appr.title")}</h1>
      <p className="m-0 mb-5 mt-1 max-w-[60ch] text-[15px] text-fg2">{t("appr.lead")}</p>
      {msg && <p role="status" className={`mb-4 rounded-2xl p-3 text-sm ${msg.tone === "ok" ? "bg-success-soft text-success-fg" : "bg-danger-soft text-danger-fg"}`}>{msg.text}</p>}

      <Card className="mb-6">
        <h2 className="mb-3 mt-0 text-lg font-bold">{t("appr.new")}</h2>
        <div className="grid gap-3">
          <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("appr.product")}</span>
            <select id="ap-product" className="field" value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value, quantity: "", maxSpend: "" })}>
              <option value="">—</option>
              {products.filter((p) => p.status !== "rejected").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></label>
          <div className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("appr.action")}</span>
            <Segmented<"sample" | "order"> label={t("appr.action")} value={f.action} onChange={(v) => setF({ ...f, action: v })}
              options={[{ value: "sample", label: t("appr.action.sample") }, { value: "order", label: t("appr.action.order") }]} /></div>
          <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("appr.supplier")}</span>
            <input id="ap-supplier" className="field" maxLength={120} value={f.supplier} onChange={(e) => setF({ ...f, supplier: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("appr.quantity")}</span>
              <input id="ap-qty" className="field num" inputMode="numeric" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value.replace(/\D/g, "") })} /></label>
            <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("appr.maxSpend")} · {currency}</span>
              <input id="ap-spend" className="field num" inputMode="decimal" value={f.maxSpend} onChange={(e) => setF({ ...f, maxSpend: e.target.value })} /></label>
          </div>
          {over && <p className="m-0 text-[13px] font-semibold text-danger-fg">{t("appr.overBudget", { n: level, limit: money(budget, mk, lang) })}</p>}
          <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("appr.shipping")}</span>
            <input id="ap-shipping" className="field" maxLength={500} placeholder={t("appr.shippingPh")} value={f.shipping} onChange={(e) => setF({ ...f, shipping: e.target.value })} /></label>
          <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("appr.risks")}</span>
            <textarea id="ap-risks" className="field h-20 py-2.5" maxLength={1000} value={f.risks} onChange={(e) => setF({ ...f, risks: e.target.value })} /></label>
          <div className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("appr.expires")}</span>
            <Segmented<string> label={t("appr.expires")} value={f.days} onChange={(v) => setF({ ...f, days: v })}
              options={["7", "14", "30"].map((d) => ({ value: d, label: t("appr.days", { n: d }) }))} /></div>
          <button type="button" className="btn btn-primary mt-1" disabled={!canSubmit} onClick={() => void submit()}><Icon name="shield" size={18} />{t("appr.submit")}</button>
        </div>
      </Card>

      {items.length === 0 ? <p className="text-sm text-fg3">{t("appr.empty")}</p> : (
        <div className="grid gap-3">
          {items.map((a) => {
            const st = effective(a);
            const p = names.get(a.product_id);
            const m = a.currency === "UZS" ? "uzum" : "amazon";
            return (
              <Card key={a.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="block text-[16px]">{p?.name ?? "—"}</b>
                    <span className="text-[13px] text-fg2">{t(`appr.action.${a.action}` as MessageKey)} · {a.supplier}</span>
                  </div>
                  <Pill tone={TONE[st]} dot>{t(`appr.status.${st}` as MessageKey)}</Pill>
                </div>
                <dl className="m-0 mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
                  <dt className="text-fg2">{t("appr.quantity")}</dt><dd className="num m-0 text-right">{a.quantity}</dd>
                  <dt className="text-fg2">{t("appr.maxSpend")}</dt><dd className="num m-0 text-right">{money(a.max_spend, m, lang)}</dd>
                  <dt className="text-fg2">{t("appr.expires")}</dt><dd className="num m-0 text-right">{t("appr.until", { date: a.expires_at.slice(0, 10) })}</dd>
                </dl>
                {a.shipping && <p className="mb-0 mt-2 text-[13px] text-fg2">{t("appr.shipping")}: {a.shipping}</p>}
                {a.risks && <p className="mb-0 mt-1 text-[13px] text-fg2">{t("appr.risks")}: {a.risks}</p>}
                {st === "approved" && a.approver_name && <p className="mb-0 mt-2 text-[13px] font-semibold text-success-fg">{t("appr.approvedBy", { name: a.approver_name })}</p>}
                {st === "rejected" && a.decision_note && <p className="mb-0 mt-2 text-[13px] text-danger-fg">{a.decision_note}</p>}
                {st === "expired" && <p className="mb-0 mt-2 text-[13px] text-fg3">{t("appr.expiredNote")}</p>}

                {st === "pending" && (deciding === a.id ? (
                  <div className="mt-4 grid gap-3 rounded-2xl bg-track p-4">
                    <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("appr.approver")}</span>
                      <input id={`ap-approver-${a.id}`} className="field" maxLength={80} value={approver} onChange={(e) => setApprover(e.target.value)} /></label>
                    <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-[var(--primary)]" />{t("appr.confirmCheck")}</label>
                    <button type="button" className="btn btn-primary btn-sm" disabled={!approver.trim() || !checked} onClick={() => void decide(a, true)}><Icon name="check" size={16} />{t("appr.approve")}</button>
                    <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("appr.rejectReason")}</span>
                      <input id={`ap-r-${a.id}`} className="field" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
                    <button type="button" className="btn btn-sm bg-danger-soft text-danger-fg" disabled={!reason.trim()} onClick={() => void decide(a, false)}>{t("appr.reject")}</button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-sm mt-4 bg-track text-fg" onClick={() => { setDeciding(a.id); setApprover(profile?.fullName ?? ""); setChecked(false); setReason(""); }}>{t("appr.approve")} / {t("appr.reject")}</button>
                ))}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
