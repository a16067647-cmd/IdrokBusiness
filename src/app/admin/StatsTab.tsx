"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { Card } from "@/components/ui/Glass";
import { supabase } from "@/lib/supabase/client";
import { useLessons } from "@/lib/lessons/source";

interface Stats {
  users_total: number; users_7d: number; users_30d: number; active_7d: number;
  products_total: number; products_7d: number; users_with_product: number;
  lessons_done_total: number; lessons_done_7d: number; learners: number;
  ai_runs_total: number; ai_runs_7d: number;
  approvals: Record<string, number>; expenses_total: number;
  signups_by_day: Array<{ day: string; n: number }>;
  top_lessons: Array<{ lesson_id: string; n: number }>;
}

export function StatsTab() {
  const { t, lang } = usePrefs();
  const { lessons } = useLessons();
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void supabase()!.rpc("admin_stats").then(({ data, error: err }) => (err ? setError(err.message) : setS(data as Stats)));
  }, []);

  if (error) return <p className="rounded-2xl bg-danger-soft p-3 text-sm text-danger-fg">{error}</p>;
  if (!s) return <div className="min-h-[40vh]" />;

  const tiles: Array<[string, number, string]> = [
    [t("stats.users"), s.users_total, t("stats.week", { n: s.users_7d })],
    [t("stats.active"), s.active_7d, ""],
    [t("stats.products"), s.products_total, t("stats.withProducts", { n: s.users_with_product })],
    [t("stats.lessons"), s.lessons_done_total, t("stats.learners", { n: s.learners })],
    [t("stats.ai"), s.ai_runs_total, t("stats.week", { n: s.ai_runs_7d })],
    [t("stats.expenses"), s.expenses_total, ""],
  ];
  const ap = s.approvals ?? {};
  const title = (id: string) => lessons.find((l) => l.id === id)?.title[lang] ?? id;

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {tiles.map(([label, value, sub]) => (
          <Card key={label} className="p-4">
            <div className="text-[12px] font-semibold text-fg2">{label}</div>
            <div className="num mt-1 text-[28px] font-semibold leading-none">{value}</div>
            {sub && <div className="mt-1.5 text-[12px] text-fg3">{sub}</div>}
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-1 mt-0 text-[16px] font-bold">{t("stats.signups")}</h2>
        <SignupChart days={s.signups_by_day} />
        <details className="mt-3">
          <summary className="cursor-pointer text-[13px] font-semibold text-primary">{t("stats.table")}</summary>
          <div className="mt-2 max-h-56 overflow-auto">
            <table className="w-full text-[13px]">
              <thead><tr className="text-left text-fg3"><th className="py-1 font-semibold">{t("stats.day")}</th><th className="py-1 text-right font-semibold">{t("stats.count")}</th></tr></thead>
              <tbody>{[...s.signups_by_day].reverse().map((d) => <tr key={d.day} className="border-t border-hairline"><td className="num py-1">{d.day}</td><td className="num py-1 text-right">{d.n}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 mt-0 text-[16px] font-bold">{t("stats.approvals")}</h2>
          <p className="m-0 text-sm text-fg2">{t("stats.approvalsLine", { approved: ap.approved ?? 0, pending: ap.pending ?? 0, rejected: ap.rejected ?? 0 })}</p>
        </Card>
        <Card>
          <h2 className="mb-2 mt-0 text-[16px] font-bold">{t("stats.topLessons")}</h2>
          {s.top_lessons.length === 0 ? <p className="m-0 text-sm text-fg3">{t("stats.none")}</p> : (
            <ol className="m-0 grid gap-1.5 pl-5 text-sm">
              {s.top_lessons.map((l) => <li key={l.lesson_id}><span>{title(l.lesson_id)}</span> <span className="num text-fg3">· {l.n}</span></li>)}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}

/** 30 thin bars, one series, rounded tops on the baseline, hover/focus tooltip. */
function SignupChart({ days }: { days: Array<{ day: string; n: number }> }) {
  const { t } = usePrefs();
  const [hover, setHover] = useState<number | null>(null);
  const W = 360, H = 140, PAD_L = 24, PAD_B = 18, PAD_T = 8;
  const max = Math.max(1, ...days.map((d) => d.n));
  const top = Math.max(2, Math.ceil(max / 2) * 2);
  const slot = (W - PAD_L) / days.length;
  const bw = Math.max(3, slot - 2);
  const y = (v: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - v / top);
  const ticks = [0, top / 2, top];
  const h = hover != null ? days[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={t("stats.signups")}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD_L} x2={W} y1={y(v)} y2={y(v)} stroke="var(--hairline)" strokeWidth={1} />
            <text x={PAD_L - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--fg-3)">{v}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = PAD_L + i * slot + 1;
          const hgt = y(0) - y(d.n);
          const r = Math.min(4, bw / 2, hgt);
          return (
            <g key={d.day}>
              {d.n > 0 && (
                <path fill="var(--primary)" opacity={hover == null || hover === i ? 1 : 0.55}
                  d={`M${x},${y(0)} V${y(d.n) + r} Q${x},${y(d.n)} ${x + r},${y(d.n)} H${x + bw - r} Q${x + bw},${y(d.n)} ${x + bw},${y(d.n) + r} V${y(0)} Z`} />
              )}
              <rect x={PAD_L + i * slot} y={PAD_T} width={slot} height={H - PAD_T - PAD_B} fill="transparent" tabIndex={0}
                aria-label={t("stats.signupsTip", { date: d.day, n: d.n })}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} />
            </g>
          );
        })}
        <text x={PAD_L} y={H - 4} fontSize={11} fill="var(--fg-3)">{days[0]?.day.slice(5)}</text>
        <text x={W} y={H - 4} fontSize={11} fill="var(--fg-3)" textAnchor="end">{days[days.length - 1]?.day.slice(5)}</text>
      </svg>
      {h && (
        <div className="pointer-events-none absolute -top-2 whitespace-nowrap rounded-lg bg-[var(--fg)] px-2 py-1 text-[12px] font-semibold text-[var(--bg)] shadow"
          style={{ left: `${Math.min(80, Math.max(20, ((PAD_L + (hover! + 0.5) * slot) / W) * 100))}%`, transform: "translate(-50%, -100%)" }}>
          {t("stats.signupsTip", { date: h.day, n: h.n })}
        </div>
      )}
    </div>
  );
}
