"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

/** Bottom sheet on phones, centred glass panel on wider screens. Uses <dialog> for focus and Esc handling. */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose(); }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-[28px] bg-transparent p-0 text-fg backdrop:bg-black/40 backdrop:backdrop-blur-[2px] md:m-auto md:max-w-[720px] md:rounded-[28px]">
      <div className="glass glass-strong flex max-h-[92dvh] flex-col rounded-[inherit]" style={{ background: "var(--glass-strong)" }}>
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-track md:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3">
          <h2 className="m-0 text-xl font-extrabold tracking-[-0.02em]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="×" className="grid h-8 w-8 place-items-center rounded-[10px] bg-track"><Icon name="x" size={14} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2.5 border-t border-hairline px-5 pt-3" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>{footer}</div>}
      </div>
    </dialog>
  );
}
