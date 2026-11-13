"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, Pill, SectionHead, Segmented } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { supabase } from "@/lib/supabase/client";
import { productsStore, saveProduct, type Product } from "@/lib/store/products";
import { calculateProfit, type ProfitInput } from "@/lib/profit";
import { EXPENSE_CATEGORIES, expenseTotals, planTotals, sliderRange, type Currency, type Expense, type ExpenseCategory } from "@/lib/finance/summary";
import { money, pct } from "@/lib/format";
import { useToday } from "@/lib/useToday";
import type { MessageKey } from "@/lib/i18n";

interface ExpenseRow extends Expense { id: string; product_id: string | null; note: string }
const mkFor = (c: Currency): "uzum" | "amazon" => (c === "UZS" ? "uzum" : "amazon");

export default function FinancePage() {
  const { t, lang } = usePrefs();
  const { session } = useAuth();
  const products = productsStore.use();
  const today = useToday() ?? "";

  const plan = useMemo(() => planTotals(products), [products]);

  // ---- expenses ----
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: "", currency: "USD" as Currency, category: "samples" as ExpenseCategory, date: "", productId: "", note: "" });
  const load = useCallback(async () => {
    const { data } = await supabase()!.from("expenses").select("id, spent_on, category, amount, currency, product_id, note").order("spent_on", { ascending: false }).limit(200);
    setExpenses((data ?? []).map((e) => ({ ...e, amount: Number(e.amount) })) as ExpenseRow[]);
  }, []);
  useEffect(() => { if (session) void load(); }, [session, load]);
  useEffect(() => { if (today && !form.date) setForm((f) => ({ ...f, date: today })); }, [today, form.date]);
  const totals = useMemo(() => expenseTotals(expenses, today || "0000-00-00"), [expenses, today]);

  const addExpense = async () => {
    const amount = parseFloat(form.amount.replace(/\s/g, "").replace(",", "."));
    if (!(amount > 0) || !form.date) return;
    const { error } = await supabase()!.from("expenses").insert({
      amount, currency: form.currency, category: form.category, spent_on: form.date,
      product_id: form.productId || null, note: form.note.trim().slice(0, 300),
    });
    if (error) { setMsg(t("fin.err", { msg: error.message })); return; }
    setMsg(null);
    setForm((f) => ({ ...f, amount: "", note: "" }));
    await load();
  };
  const removeExpense = async (id: string) => {
    await supabase()!.from("expenses").delete().eq("id", id);
    setConfirmId(null);
    await load();
  };

  // ---- what-if ----
  const [simId, setSimId] = useState("");
  const base = products.find((p) => p.id === simId);
  const [sim, setSim] = useState<ProfitInput>({});
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (base) { setSim({ ...base }); setSaved(false); } }, [simId]); // eslint-disable-line react-hooks/exhaustive-deps
  const baseR = base ? calculateProfit(base) : null;
  const simR = calculateProfit(sim);
  const simMk = base?.marketplace ?? "amazon";
  const SLIDERS: Array<[keyof ProfitInput, MessageKey, number]> = [
    ["salePrice", "field.salePrice", simMk === "uzum" ? 300000 : 60],
    ["unitCost", "field.unitCost", simMk === "uzum" ? 120000 : 20],
    ["shippingPerUnit", "field.shipping", simMk === "uzum" ? 60000 : 10],
    ["adPerUnit", "field.ads", simMk === "uzum" ? 60000 : 10],
    ["feePct", "field.feePct", 40],
  ];
  const saveSim = () => {
    if (!base) return;
    const p: Product = { ...base, salePrice: sim.salePrice, unitCost: sim.unitCost, shippingPerUnit: sim.shippingPerUnit, adPerUnit: sim.adPerUnit, feePct: sim.feePct };
    saveProduct(p);
    setSaved(true);
  };

  const planCard = (c: Currency) => {
    const p = plan[c];
    if (p.products === 0 && p.incomplete === 0) return null;
    const mk = mkFor(c);
    return (
      <Card key={c}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <b className="text-[15px]">{c === "USD" ? "Amazon · USD" : "Uzum · so‘m"}</b>
          <span className="text-[12px] text-fg3">{t("fin.planProducts", { n: p.products })}{p.incomplete ? ` · ${t("fin.planIncomplete", { n: p.incomplete })}` : ""}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label={t("fin.investment")} value={money(p.investment, mk, lang)} />
          <Stat label={t("fin.expectedProfit")} value={money(p.expectedProfit, mk, lang)} tone={p.expectedProfit < 0 ? "bad" : "good"} />
          <Stat label={t("fin.avgMargin")} value={pct(p.avgMarginPct)} />
        </div>
      </Card>
    );
  };
  const planCards = (["USD", "UZS"] as Currency[]).map(planCard).filter(Boolean);

  return (
    <div data-motion-preset="dashboard" className="pt-6">
      <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.03em]">{t("fin.title")}</h1>
      <p className="m-0 mb-6 mt-1 max-w-[60ch] text-[15px] text-fg2">{t("fin.lead")}</p>

      {/* Plan */}
      <section className="mb-8" aria-labelledby="h-plan">
        <SectionHead id="h-plan" title={t("fin.plan")} />
        <p className="mb-3 mt-0 flex items-start gap-2 text-[13px] text-fg2"><Icon name="info" size={15} className="mt-0.5 flex-none text-fg3" />{t("fin.planNote")}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {planCards.length ? planCards : <Card><p className="m-0 text-sm text-fg2">{t("fin.noPlan")}</p></Card>}
          <Card>
            <div className="mb-1 flex items-center gap-2"><Icon name="lock" size={16} className="text-fg3" /><b className="text-[15px]">{t("fin.income")}</b></div>
            <div className="num text-[24px] font-semibold text-fg3">—</div>
            <p className="m-0 text-[13px] text-fg2">{t("fin.incomeNote")}</p>
          </Card>
        </div>
      </section>

      {/* What-if */}
      <section className="mb-8" aria-labelledby="h-whatif">
        <SectionHead id="h-whatif" title={t("fin.whatIf")} />
        <Card>
          <p className="mb-3 mt-0 text-sm text-fg2">{t("fin.whatIfLead")}</p>
          <select id="wi-product" className="field mb-4" value={simId} onChange={(e) => setSimId(e.target.value)}>
            <option value="">{t("fin.pickProduct")}</option>
            {products.filter((p) => p.status !== "rejected").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {base && (
            <>
              <div className="grid gap-4">
                {SLIDERS.map(([k, label, fallback]) => {
                  const r = sliderRange(base[k] as number | undefined, fallback);
                  const v = (sim[k] as number | undefined) ?? 0;
                  return (
                    <label key={k} className="grid gap-1.5">
                      <span className="flex items-baseline justify-between gap-2 text-[13px] font-semibold text-fg2">
                        {t(label)}
                        <span className="num text-[14px] text-fg">{k === "feePct" ? `${v}%` : money(v, simMk, lang)}</span>
                      </span>
                      <input id={`wi-${k}`} type="range" min={r.min} max={r.max} step={k === "feePct" ? 0.5 : r.step} value={v}
                        onChange={(e) => { setSim({ ...sim, [k]: Number(e.target.value) }); setSaved(false); }}
                        className="w-full accent-[var(--primary)]" />
                    </label>
                  );
                })}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-track p-4 sm:grid-cols-4">
                {simR.complete ? (
                  <>
                    <Stat label={t("calc.profitPerUnit")} value={money(simR.profitPerUnit, simMk, lang)} tone={simR.profitPerUnit! < 0 ? "bad" : "good"} big />
                    <Stat label={t("calc.margin")} value={pct(simR.marginPct)} />
                    <Stat label={t("calc.roi")} value={pct(simR.roiPct)} />
                    <Stat label={t("calc.breakEven")} value={money(simR.breakEvenPrice, simMk, lang)} />
                  </>
                ) : <p className="col-span-full m-0 text-sm text-fg2">{t("calc.missing", { fields: simR.missing.join(", ") })}</p>}
              </div>
              {simR.complete && baseR?.complete && (
                <p className="mb-0 mt-2 text-[13px] text-fg2">{t("fin.changed", { delta: `${simR.profitPerUnit! - baseR.profitPerUnit! >= 0 ? "+" : ""}${money(Math.round((simR.profitPerUnit! - baseR.profitPerUnit!) * 100) / 100, simMk, lang)}` })}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn btn-sm bg-track text-fg" onClick={() => { setSim({ ...base }); setSaved(false); }}>{t("fin.reset")}</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={saveSim}>{saved ? t("fin.savedToProduct") : t("fin.saveToProduct")}</button>
              </div>
            </>
          )}
        </Card>
      </section>

      {/* Expenses */}
      <section aria-labelledby="h-exp">
        <SectionHead id="h-exp" title={t("fin.expenses")} />
        <p className="mb-3 mt-0 text-sm text-fg2">{t("fin.expensesLead")}</p>
        {!session ? <Card><p className="m-0 text-sm text-fg2">{t("fin.signin")}</p></Card> : (
          <>
            <div className="mb-3 grid gap-3 md:grid-cols-2">
              {(["USD", "UZS"] as Currency[]).filter((c) => c === "USD" || totals.UZS.total > 0).map((c) => (
                <Card key={c}>
                  <b className="mb-2 block text-[15px]">{c === "USD" ? "USD" : "so‘m"}</b>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label={t("fin.thisMonth")} value={money(totals[c].thisMonth, mkFor(c), lang)} big />
                    <Stat label={t("fin.allTime")} value={money(totals[c].total, mkFor(c), lang)} />
                  </div>
                  {Object.keys(totals[c].byCategory).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(Object.entries(totals[c].byCategory) as Array<[ExpenseCategory, number]>).map(([cat, v]) => (
                        <Pill key={cat} tone="muted">{t(`fin.cat.${cat}` as MessageKey)} · {money(v, mkFor(c), lang)}</Pill>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <Card className="mb-3">
              <h3 className="mb-3 mt-0 text-[16px] font-bold">{t("fin.addExpense")}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("fin.amount")}</span>
                  <input id="ex-amount" className="field num" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
                <div className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("fin.currency")}</span>
                  <Segmented<Currency> label={t("fin.currency")} value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} options={[{ value: "USD", label: "USD" }, { value: "UZS", label: "so‘m" }]} /></div>
                <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("fin.category")}</span>
                  <select id="ex-category" className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{t(`fin.cat.${c}` as MessageKey)}</option>)}
                  </select></label>
                <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("fin.date")}</span>
                  <input id="ex-date" type="date" className="field" value={form.date} max={today || undefined} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
                <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("fin.productOpt")}</span>
                  <select id="ex-product" className="field" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                    <option value="">—</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select></label>
                <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("fin.note")}</span>
                  <input id="ex-note" className="field" maxLength={300} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
              </div>
              {msg && <p role="alert" className="mb-0 mt-3 rounded-2xl bg-danger-soft p-3 text-sm text-danger-fg">{msg}</p>}
              <button type="button" className="btn btn-primary btn-sm mt-4" disabled={!(parseFloat(form.amount.replace(",", ".")) > 0)} onClick={() => void addExpense()}><Icon name="plus" size={16} />{t("fin.addExpense")}</button>
            </Card>

            {expenses.length === 0 ? <p className="text-sm text-fg3">{t("fin.noExpenses")}</p> : (
              <ul className="glass m-0 list-none overflow-hidden rounded-card p-0">
                {expenses.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-[14px]">{t(`fin.cat.${e.category}` as MessageKey)}{e.product_id ? ` · ${products.find((p) => p.id === e.product_id)?.name ?? ""}` : ""}</b>
                      <span className="block truncate text-[12px] text-fg3">{e.spent_on}{e.note ? ` · ${e.note}` : ""}</span>
                    </div>
                    <span className="num text-[14px] font-semibold">{money(e.amount, mkFor(e.currency), lang)}</span>
                    {confirmId === e.id
                      ? <button type="button" className="rounded-[10px] bg-danger-soft px-2.5 py-1.5 text-[12px] font-bold text-danger-fg" onClick={() => void removeExpense(e.id)}>{t("fin.deleteConfirm")}</button>
                      : <button type="button" aria-label={t("common.delete")} className="grid h-8 w-8 place-items-center rounded-[10px] bg-track text-fg2" onClick={() => setConfirmId(e.id)}><Icon name="x" size={14} /></button>}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, tone, big }: { label: string; value: string; tone?: "good" | "bad"; big?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] text-fg2">{label}</div>
      <div className={`num truncate font-semibold ${big ? "text-[20px]" : "text-[15px]"} ${tone === "bad" ? "text-danger-fg" : tone === "good" ? "text-success-fg" : ""}`}>{value}</div>
    </div>
  );
}
