"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import s from "./path.module.css";

// A winding road from Start (top) to the Finish flag (bottom) with five stops.
// Drawn in a fixed 360×800 box and scaled, so HTML labels can sit at the same
// percentages as the SVG points.

const W = 360, H = 800;
const START = { x: 270, y: 44 };
const NODES = [
  { x: 92, y: 158 }, { x: 268, y: 290 }, { x: 92, y: 422 }, { x: 268, y: 554 }, { x: 92, y: 686 },
];
const FINISH = { x: 270, y: 772 };
const POINTS = [START, ...NODES, FINISH];

const seg = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dy = (b.y - a.y) * 0.6;
  return `M${a.x},${a.y} C${a.x},${a.y + dy} ${b.x},${b.y - dy} ${b.x},${b.y}`;
};
const SEGMENTS = POINTS.slice(1).map((p, i) => seg(POINTS[i], p));
const FULL = `M${START.x},${START.y} ` + SEGMENTS.map((d) => d.replace(/^M[^C]+/, "")).join(" ");
const pctX = (x: number) => `${(x / W) * 100}%`;
const pctY = (y: number) => `${(y / H) * 100}%`;

export interface RoadStep { title: string; body: string; href: string }

/**
 * `done`: steps finished (0–5). The marker stands on the next stop, or on the
 * flag when all are done. When `done` grows, the marker drives forward along
 * the road and `onArrive` fires when it gets there.
 */
export function Road({ steps, done, initial, startLabel, finishLabel, onArrive }: {
  steps: RoadStep[]; done: number; initial: string; startLabel: string; finishLabel: string; onArrive?: () => void;
}) {
  const segRefs = useRef<Array<SVGPathElement | null>>([]);
  const [shown, setShown] = useState(done);           // stops already reached on screen
  const [driving, setDriving] = useState(-1);          // segment being driven right now
  const at = (n: number) => (n >= NODES.length ? FINISH : NODES[n]);
  const [pos, setPos] = useState(at(done));
  const arrive = useRef(onArrive);
  arrive.current = onArrive;

  // Drive forward segment by segment when progress grows.
  useEffect(() => {
    if (done <= shown) { if (done < shown) { setShown(done); setPos(at(done)); } return; }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(done); setPos(at(done)); arrive.current?.(); return; }
    let raf = 0, cancelled = false;
    const run = (k: number) => {                       // k: segment index to drive (k ends at stop k)
      const el = segRefs.current[k + 1];
      if (!el || cancelled) return;
      setDriving(k + 1);
      const len = el.getTotalLength(), t0 = performance.now(), dur = 900;
      const tick = (now: number) => {
        if (cancelled) return;
        const p = Math.min(1, (now - t0) / dur);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const pt = el.getPointAtLength(len * e);
        setPos({ x: pt.x, y: pt.y });
        if (p < 1) raf = requestAnimationFrame(tick);
        else {
          setShown(k + 1);
          if (k + 1 < done) run(k + 1); else { setDriving(-1); arrive.current?.(); }
        }
      };
      raf = requestAnimationFrame(tick);
    };
    const t = setTimeout(() => run(shown), 450);
    return () => { cancelled = true; clearTimeout(t); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const current = shown < NODES.length ? shown : -1;

  return (
    <div className={s.wrap}>
      <svg className={s.svg} viewBox={`0 0 ${W} ${H}`} aria-hidden>
        <path d={FULL} className={s.edge} />
        <path d={FULL} className={s.road} />
        <path d={FULL} className={s.laneIdle} />
        {/* Filled road up to the marker: segment i leads to stop i (segment 0 is Start → stop 1). */}
        {SEGMENTS.map((d, i) => (
          <path key={i} ref={(el) => { segRefs.current[i] = el; }} d={d} pathLength={1} className={s.fill}
            style={{ strokeDashoffset: i <= shown || i === driving ? 0 : 1 }} />
        ))}
        {SEGMENTS.map((d, i) => i <= shown && <path key={`l${i}`} d={d} className={s.lane} />)}

        {/* Start */}
        <circle cx={START.x} cy={START.y} r={10} fill="var(--primary)" />
        {/* Finish flag */}
        <g transform={`translate(${FINISH.x - 4},${FINISH.y - 52})`}>
          <rect x={0} y={0} width={4} height={56} rx={2} fill="var(--fg-2)" />
          <g className={s.flag}>
            {Array.from({ length: 12 }, (_, k) => (
              <rect key={k} x={4 + (k % 4) * 9} y={2 + Math.floor(k / 4) * 9} width={9} height={9}
                fill={(k + Math.floor(k / 4)) % 2 ? (shown >= NODES.length ? "#ffc83d" : "var(--fg-1, #0a1226)") : "#fff"} stroke="var(--fg-3)" strokeWidth={0.5} />
            ))}
          </g>
        </g>

        {/* Stops */}
        {NODES.map((n, i) => {
          const isDone = i < shown, isNow = i === current;
          return (
            <g key={i}>
              {isNow && <circle cx={n.x} cy={n.y} r={28} fill="var(--primary)" className={s.pulse} />}
              <g className={`${s.node} ${isDone ? s.nodeDone : ""}`}>
                <circle cx={n.x} cy={n.y} r={28} fill={isDone ? "var(--primary)" : "var(--solid, #fff)"}
                  stroke={isDone || isNow ? "var(--primary)" : "color-mix(in srgb, var(--fg-3) 50%, transparent)"} strokeWidth={4} />
                {isDone
                  ? <path d={`M${n.x - 10},${n.y} l7,7 l13,-14`} fill="none" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
                  : <text x={n.x} y={n.y + 7} textAnchor="middle" fontSize={20} fontWeight={800} fill={isNow ? "var(--primary)" : "var(--fg-3)"}>{i + 1}</text>}
              </g>
            </g>
          );
        })}

        {/* Sparkles around the current stop */}
        {current >= 0 && [[-40, -30, 0], [44, -18, 0.9], [-30, 34, 1.7]].map(([dx, dy, d], k) => (
          <path key={`${current}-${k}`} className={s.spark} style={{ animationDelay: `${d}s` }}
            transform={`translate(${NODES[current].x + dx},${NODES[current].y + dy})`}
            d="M0,-7 L2,-2 L7,0 L2,2 L0,7 L-2,2 L-7,0 L-2,-2 Z" fill="#ffc83d" />
        ))}

        {/* Marker: you */}
        <g transform={`translate(${pos.x},${pos.y - 62})`}>
          <g className={s.bob}>
            <path d="M0,22 L-9,8 L9,8 Z" fill="var(--primary)" />
            <circle cx={0} cy={0} r={19} fill="var(--primary)" stroke="#fff" strokeWidth={4} />
            <text x={0} y={7} textAnchor="middle" fontSize={19} fontWeight={800} fill="#fff">{initial}</text>
          </g>
        </g>
      </svg>

      <span className={`${s.tag} bg-soft-blue text-primary`} style={{ left: pctX(START.x - 70), top: pctY(START.y) }}>{startLabel}</span>
      <span className={`${s.tag} ${shown >= NODES.length ? "bg-[#ffc83d] text-[#0a1226]" : "bg-track text-fg2"}`} style={{ left: pctX(FINISH.x - 80), top: pctY(FINISH.y - 22) }}>{finishLabel}</span>

      {NODES.map((n, i) => {
        const left = n.x < W / 2;
        const cls = i < shown ? "" : i === current ? s.now : s.future;
        return (
          <Link key={i} href={steps[i].href} className={`${s.hit} ${cls}`}
            style={left
              ? { left: pctX(n.x - 32), right: "1%", top: pctY(n.y), paddingLeft: pctX(76) }
              : { right: pctX(W - n.x - 32), left: "1%", top: pctY(n.y), paddingRight: pctX(76), justifyContent: "flex-end", textAlign: "right" }}>
            <span className={s.label}><b>{steps[i].title}</b><span>{steps[i].body}</span></span>
          </Link>
        );
      })}
    </div>
  );
}
