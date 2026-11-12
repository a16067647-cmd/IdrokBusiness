"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, Pill } from "@/components/ui/Glass";
import { Sheet } from "@/components/ui/Sheet";
import { supabase } from "@/lib/supabase/client";
import { rulesFor, useLevels } from "@/lib/levels";
import { money } from "@/lib/format";

interface Row {
  id: string; email: string; full_name: string; level: number; verified_profit_usd: number; is_admin: boolean;
  created_at: string; last_sign_in_at: string | null; products: number; lessons_done: number;
}

const day = (s: string | null) => (s ? s.slice(0, 10) : "—");

export function UsersTab() {
  const { t, lang } = usePrefs();
  const { refreshProfile } = useAuth();
  const levels = useLevels();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<Row | null>(null);
  const [level, setLevel] = useState("0");
  const [profit, setProfit] = useState("0");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase()!.rpc("admin_list_users");
    if (err) setError(err.message); else { setRows(data as Row[]); setError(null); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const open = (r: Row) => { setEdit(r); setLevel(String(r.level)); setProfit(String(r.verified_profit_usd)); };

  const save = async (lvl: number, prf: number) => {
    if (!edit || !Number.isInteger(lvl) || lvl < 0 || !(prf >= 0)) return;
    setBusy(true);
    const { error: err } = await supabase()!.rpc("admin_update_user", { target: edit.id, new_level: lvl, new_profit: prf });
    setBusy(false);
    if (err) { setError(t("admin.error", { msg: err.message })); return; }
    setEdit(null);
    await load();
    await refreshProfile();
  };

  const need = edit ? rulesFor(levels, edit.level).profitToNextUsd : 0;
  const profitNum = parseFloat(profit.replace(",", "."));

  return (
    <>
      {error && <p className="mb-3 rounded-2xl bg-danger-soft p-3 text-sm text-danger-fg">{error}</p>}
      <p className="mb-3 mt-0 text-sm text-fg2">{rows ? t("admin.usersCount", { n: rows.length }) : "…"}</p>
      <div className="grid gap-2.5">
        {(rows ?? []).map((r) => {
          const ready = r.verified_profit_usd >= rulesFor(levels, r.level).profitToNextUsd;
          return (
            <button key={r.id} type="button" onClick={() => open(r)} className="glass grid w-full gap-2 rounded-card p-4 text-left transition-transform active:scale-[0.99] md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] md:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><b className="truncate text-[15px]">{r.full_name || "—"}</b>{r.is_admin && <Pill tone="ai">{t("admin.adminBadge")}</Pill>}</div>
                <div className="truncate text-[13px] text-fg2">{r.email}</div>
              </div>
              <Cell label={t("admin.col.level")} value={String(r.level)} extra={ready ? <Pill tone="ok">{t("admin.ready")}</Pill> : null} />
              <Cell label={t("admin.col.profit")} value={money(r.verified_profit_usd, "amazon", lang)} />
              <Cell label={`${t("admin.col.products")} / ${t("admin.col.lessons")}`} value={`${r.products} / ${r.lessons_done}`} />
              <Cell label={t("admin.col.joined")} value={day(r.created_at)} sub={`${t("admin.col.lastSeen")}: ${day(r.last_sign_in_at)}`} />
            </button>
          );
        })}
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={t("admin.editUser")}
        footer={<>
          <button type="button" className="btn btn-sm bg-track text-fg" onClick={() => setEdit(null)}>{t("common.cancel")}</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void save(parseInt(level, 10), profitNum)}>{t("common.save")}</button>
        </>}>
        {edit && (
          <div className="grid gap-4">
            <Card className="p-4"><b>{edit.full_name || "—"}</b><div className="text-sm text-fg2">{edit.email}</div></Card>
            <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("admin.verifiedProfit")}</span>
              <input id="u-profit" className="field num" inputMode="decimal" value={profit} onChange={(e) => setProfit(e.target.value)} />
              <span className="text-[12px] text-fg3">{t("admin.verifiedProfitHint")}</span></label>
            <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("admin.level")}</span>
              <input id="u-level" className="field num" inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value.replace(/\D/g, ""))} /></label>
            <p className="m-0 text-sm text-fg2">{t("learn.profitProgress", { have: money(Number.isFinite(profitNum) ? profitNum : 0, "amazon", lang), need: money(need, "amazon", lang) })}</p>
            {Number.isFinite(profitNum) && profitNum >= need && (
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save(edit.level + 1, 0)}>{t("admin.promote", { n: edit.level + 1 })}</button>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}

function Cell({ label, value, sub, extra }: { label: string; value: string; sub?: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 md:block">
      <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-fg3">{label}</div>
      <div className="text-right md:text-left"><span className="num text-[14px] font-semibold">{value}</span> {extra}{sub && <div className="text-[11px] text-fg3">{sub}</div>}</div>
    </div>
  );
}
