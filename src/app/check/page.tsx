"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/ui/Icon";
import { ViolationList } from "@/app/products/ViolationList";
import { calculateProfit } from "@/lib/profit";
import { checkGuardrails } from "@/lib/guardrails";
import { rulesFor, toLimits, useLevels } from "@/lib/levels";
import { saveProduct } from "@/lib/store/products";
import { verdictFor, type Verdict } from "@/lib/verdict";
import { money } from "@/lib/format";
import type { MarketplaceId } from "@/lib/marketplaces";
import type { MessageKey } from "@/lib/i18n";

// "Check a product": one question per screen, then a one-word answer.
// The math is the app's tested calculator; nothing here is guessed.

type NumKey = "price" | "cost" | "ship" | "fee" | "fulfil";
type StepId = "market" | "name" | NumKey;
const STEPS: StepId[] = ["market", "name", "price", "cost", "ship", "fee", "fulfil"];
const HAS_TIP: StepId[] = ["price", "cost", "ship", "fee", "fulfil"];
const FEE_CHIPS = [5, 10, 15, 20];

const parse = (s: string): number | undefined => {
  const v = parseFloat(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(v) && v >= 0 ? v : undefined;
};

const VERDICT_STYLE: Record<Verdict, { box: string; badge: string; word: string; icon: "check" | "info" | "x" }> = {
  good: { box: "bg-success-soft", badge: "bg-success-fg", word: "text-success-fg", icon: "check" },
  risky: { box: "bg-warn-soft", badge: "bg-warn-fg", word: "text-warn-fg", icon: "info" },
  loss: { box: "bg-danger-soft", badge: "bg-danger-fg", word: "text-danger-fg", icon: "x" },
};

export default function CheckPage() {
  const { t, lang } = usePrefs();
  const router = useRouter();
  const levels = useLevels();
  const { profile } = useAuth();
  const [i, setI] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [tip, setTip] = useState(false);
  const [market, setMarket] = useState<MarketplaceId | null>(null);
  const [name, setName] = useState("");
  const [vals, setVals] = useState<Record<NumKey, string>>({ price: "", cost: "", ship: "", fee: "", fulfil: "" });
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const step = STEPS[i];
  useEffect(() => { setTip(false); if (!showResult) inputRef.current?.focus(); }, [i, showResult]);

  const nums = {
    salePrice: parse(vals.price), unitCost: parse(vals.cost), shippingPerUnit: parse(vals.ship),
    feePct: parse(vals.fee), fulfillmentFee: parse(vals.fulfil),
  };
  const mk: MarketplaceId = market ?? "uzum";
  const violations = checkGuardrails({ unitCost: nums.unitCost, restricted: [] }, toLimits(rulesFor(levels, profile?.level ?? 0), mk));

  const valid = (s: StepId) => {
    if (s === "market") return market != null;
    if (s === "name") return name.trim().length > 0;
    const v = parse(vals[s]);
    if (v == null) return false;
    if (s === "price") return v > 0;
    if (s === "fee") return v < 100;
    return true;
  };

  const goNext = () => {
    if (!valid(step)) return;
    if (i < STEPS.length - 1) setI(i + 1); else setShowResult(true);
  };
  const goBack = () => {
    if (showResult) setShowResult(false);
    else if (i > 0) setI(i - 1);
    else router.push("/");
  };

  const pickMarket = (m: MarketplaceId) => { setMarket(m); setTimeout(() => setI(1), 160); };

  const unit = step === "fee" ? "%" : mk === "uzum" ? (lang === "ru" ? "сум" : "so‘m") : "$";

  const top = (
    <div className="flex items-center gap-3">
      <button type="button" onClick={goBack} aria-label={t("common.back")} className="glass grid h-12 w-12 flex-none place-items-center rounded-2xl"><Icon name="back" size={22} /></button>
      {!showResult ? (
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {STEPS.map((_, k) => <span key={k} className={`h-1.5 flex-1 rounded-full ${k <= i ? "bg-primary" : "bg-track"}`} />)}
        </div>
      ) : <h1 className="m-0 min-w-0 flex-1 truncate text-[20px] font-extrabold">{name}</h1>}
      <Link href="/" aria-label={t("check.close")} className="glass grid h-12 w-12 flex-none place-items-center rounded-2xl"><Icon name="x" size={22} /></Link>
    </div>
  );

  if (showResult) {
    const r = calculateProfit(nums);
    const v = verdictFor(r.profitPerUnit, r.marginPct) ?? "loss";
    const st = VERDICT_STYLE[v];
    const m = (x: number | null | undefined) => money(x, mk, lang);
    const per = r.profitPerUnit ?? 0;
    const spend100 = ((nums.unitCost ?? 0) + (nums.shippingPerUnit ?? 0)) * 100;
    const lines: Array<[string, number]> = [
      [t("check.l.price"), nums.salePrice ?? 0],
      [t("check.l.cost"), -(nums.unitCost ?? 0)],
      [t("check.l.ship"), -(nums.shippingPerUnit ?? 0)],
      [t("check.l.fee", { pct: nums.feePct ?? 0 }), -(r.feeAmount ?? 0)],
      [t("check.l.fulfil"), -(nums.fulfillmentFee ?? 0)],
    ];
    const blocked = violations.length > 0;
    const save = () => {
      if (blocked || saved) return;
      saveProduct({ name: name.trim().slice(0, 120), marketplace: mk, status: "idea", restricted: [], ...nums });
      setSaved(true);
      setTimeout(() => router.push("/"), 700);
    };
    return (
      <div className="mx-auto grid max-w-[520px] gap-4 pt-5">
        {top}
        <div className={`grid justify-items-start gap-2.5 rounded-[28px] p-5 ${st.box}`} role="status">
          <span className={`grid h-14 w-14 place-items-center rounded-[18px] text-white ${st.badge}`}><Icon name={st.icon} size={28} /></span>
          <span className={`text-[32px] font-extrabold leading-none tracking-[-0.02em] ${st.word}`}>{t(`verdict.${v}`)}</span>
          <p className="m-0 text-[18px] font-semibold">
            {per > 0 ? t("check.youKeep", { amount: m(per) }) : t("check.youLose", { amount: m(-per) })}
          </p>
          <p className="m-0 text-[15px] text-fg2">{t(`verdict.${v}.say` as MessageKey)}</p>
        </div>

        <div className="glass grid gap-2.5 rounded-[22px] p-4 text-[16px]">
          {lines.map(([l, x]) => <div key={l} className="flex justify-between gap-3"><span className="text-fg2">{l}</span><span className="num whitespace-nowrap">{m(x)}</span></div>)}
          <div className="flex justify-between gap-3 border-t border-hairline pt-2.5 font-extrabold"><span>{t("check.l.keep")}</span><span className="num whitespace-nowrap">{m(per)}</span></div>
        </div>
        <div className="glass grid gap-2.5 rounded-[22px] p-4 text-[16px]">
          <div className="flex justify-between gap-3"><span className="text-fg2">{t("check.hundredSpend")}</span><span className="num whitespace-nowrap">{m(spend100)}</span></div>
          <div className="flex justify-between gap-3 border-t border-hairline pt-2.5 font-extrabold"><span>{t("check.hundredKeep")}</span><span className="num whitespace-nowrap">{m(per * 100)}</span></div>
        </div>
        <p className="m-0 text-[13px] text-fg3">{t("check.estimate")}</p>

        {blocked && <><ViolationList violations={violations} marketplace={mk} /><p className="m-0 text-[14px] text-danger-fg">{t("check.blocked")}</p></>}
        {!blocked && (
          <button type="button" className="btn btn-primary h-[58px] w-full text-[17px]" onClick={save} disabled={saved}>
            {saved ? <><Icon name="check" size={20} />{t("check.saved")}</> : t("check.save")}
          </button>
        )}
        <Link href={`/agents?agent=risk&product=${encodeURIComponent(name.trim())}`} className="btn glass h-[54px] w-full text-fg"><Icon name="sparkle" size={18} />{t("check.ask")}</Link>
        <button type="button" className="py-2 text-[15px] font-semibold text-primary" onClick={() => { setShowResult(false); setI(1); setName(""); setVals({ price: "", cost: "", ship: "", fee: "", fulfil: "" }); setSaved(false); }}>{t("check.again")}</button>
      </div>
    );
  }

  return (
    <form className="mx-auto flex min-h-[calc(100dvh-120px)] max-w-[520px] flex-col gap-5 pt-5" onSubmit={(e) => { e.preventDefault(); goNext(); }}>
      {top}
      <p className="m-0 text-[14px] font-semibold text-fg3">{t("check.step", { n: i + 1, total: STEPS.length })}</p>
      <h1 className="m-0 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] [text-wrap:balance]">{t(`check.q.${step}` as MessageKey)}</h1>
      {step !== "market" && <p className="-mt-2 m-0 text-[16px] text-fg2">{t(`check.h.${step}` as MessageKey)}</p>}

      {step === "market" ? (
        <div className="grid gap-3">
          {(["uzum", "amazon"] as MarketplaceId[]).map((id) => (
            <button key={id} type="button" aria-pressed={market === id} onClick={() => pickMarket(id)}
              className={`glass flex min-h-[84px] items-center gap-4 rounded-[22px] border-2 p-4 text-left transition-transform active:scale-[0.98] ${market === id ? "border-primary" : "border-transparent"}`}>
              <span className={`grid h-12 w-12 flex-none place-items-center rounded-2xl text-[20px] font-extrabold ${id === "uzum" ? "bg-[#7a3ff2] text-white" : "bg-[#ff9900] text-[#0a1226]"}`}>{id === "uzum" ? "U" : "A"}</span>
              <span><b className="block text-[19px]">{id === "uzum" ? "Uzum Market" : "Amazon"}</b><span className="text-[14px] text-fg2">{t(`check.${id}`)}</span></span>
            </button>
          ))}
        </div>
      ) : step === "name" ? (
        <input ref={inputRef} id="check-name" className="field h-[64px] text-[20px] font-semibold" value={name} maxLength={120}
          onChange={(e) => setName(e.target.value)} placeholder={t("check.ph.name")} autoComplete="off" enterKeyHint="next" />
      ) : (
        <>
          <label className="glass flex items-center gap-3 rounded-[20px] px-4 focus-within:ring-4 focus-within:ring-primary/20">
            <input ref={inputRef} id={`check-${step}`} inputMode="decimal" className="num h-[68px] min-w-0 flex-1 bg-transparent text-[30px] font-semibold outline-none"
              value={vals[step]} placeholder="0" autoComplete="off" enterKeyHint="next"
              onChange={(e) => setVals({ ...vals, [step]: e.target.value })} />
            <span className="text-[18px] font-bold text-fg3">{unit}</span>
          </label>
          {step === "fee" && (
            <div className="flex flex-wrap gap-2">
              {FEE_CHIPS.map((p) => (
                <button key={p} type="button" aria-pressed={vals.fee === String(p)} onClick={() => setVals({ ...vals, fee: String(p) })}
                  className={`num h-11 rounded-full px-5 text-[15px] font-semibold ${vals.fee === String(p) ? "bg-primary text-white" : "glass"}`}>{p}%</button>
              ))}
            </div>
          )}
          {step === "cost" && violations.length > 0 && <ViolationList violations={violations} marketplace={mk} />}
        </>
      )}

      {HAS_TIP.includes(step) && (tip
        ? <p className="m-0 rounded-[18px] bg-track p-4 text-[15px] text-fg2">{t(`check.t.${step}` as MessageKey)}</p>
        : <button type="button" onClick={() => setTip(true)} className="inline-flex items-center gap-2 self-start text-[15px] font-semibold text-primary"><Icon name="info" size={18} />{t("check.where")}</button>)}

      <div className="flex-1" />
      {step !== "market" && (
        <button type="submit" className="btn btn-primary sticky bottom-4 h-[58px] w-full text-[17px]" disabled={!valid(step)}>
          {i === STEPS.length - 1 ? t("check.result") : t("check.next")}
        </button>
      )}
    </form>
  );
}
