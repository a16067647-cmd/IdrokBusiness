import type { HTMLAttributes, ReactNode } from "react";

type Tone = "blue" | "wait" | "ok" | "danger" | "ai" | "muted";
const TONES: Record<Tone, string> = {
  blue: "bg-soft-blue text-primary",
  wait: "bg-warn-soft text-warn-fg",
  ok: "bg-success-soft text-success-fg",
  danger: "bg-danger-soft text-danger-fg",
  ai: "bg-ai-soft text-ai",
  muted: "bg-track text-fg2",
};

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return <div className={`glass min-w-0 rounded-card p-5 ${className}`} {...rest}>{children}</div>;
}

export function Pill({ tone = "blue", dot = false, children, className = "" }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[5px] text-xs font-bold ${TONES[tone]} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Tile({ children, tone = "blue", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <div className={`grid h-10 w-10 flex-none place-items-center rounded-xl text-base font-extrabold ${TONES[tone]} ${className}`}>{children}</div>;
}

export function SectionHead({ title, hint, id, action }: { title: string; hint?: string; id?: string; action?: ReactNode }) {
  return (
    <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-3">
      <h2 id={id} className="m-0 text-2xl font-extrabold tracking-[-0.025em]">{title}</h2>
      {action ?? (hint && <span className="text-sm text-fg2">{hint}</span>)}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label, className = "" }: {
  value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; label: string; className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`inline-flex gap-0.5 rounded-xl bg-track p-[3px] ${className}`}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}
          className={`flex-1 rounded-[9px] px-3 py-[7px] text-[13px] font-semibold leading-none transition-colors duration-200 active:scale-[0.96] ${o.value === value ? "glass-strong text-fg shadow-[0_1px_4px_var(--glass-shadow)]" : "text-fg2"}`}
          style={o.value === value ? { background: "var(--glass-strong)" } : undefined}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
