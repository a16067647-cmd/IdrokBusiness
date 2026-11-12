"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Glass";
import { NAV, isActive } from "./nav";
import type { Lang } from "@/lib/i18n";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = usePrefs();
  const pathname = usePathname();
  const router = useRouter();
  const { configured, loading, session, profile } = useAuth();
  const onAuthPage = pathname.startsWith("/auth");
  // Signed-out users only see the sign-in screen (when sign-in is configured).
  const blocked = configured && !session && !onAuthPage;
  useEffect(() => {
    if (!loading && blocked) router.replace("/auth");
  }, [loading, blocked, router]);
  const showNav = !onAuthPage && !blocked;

  // Liquid-glass sheen follows the pointer across any .glass surface.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(".glass") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    };
    if (document.documentElement.classList.contains("lite")) return;
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <>
      <div aria-hidden className="fixed inset-x-0 top-0 z-10 bg-bg" style={{ height: "env(safe-area-inset-top, 0px)" }} />
      <div className="relative z-[1] mx-auto max-w-[1040px] pb-[140px]"
        style={{ paddingLeft: "max(16px, env(safe-area-inset-left, 0px))", paddingRight: "max(16px, env(safe-area-inset-right, 0px))" }}>
        <header className="sticky z-[5] py-3" style={{ top: "env(safe-area-inset-top, 0px)" }}>
          <div className="glass flex items-center justify-between gap-3 rounded-[20px] py-2.5 pl-4 pr-2.5">
            <Link href="/" className="flex min-w-0 items-center gap-2.5 text-[17px] font-extrabold tracking-[-0.02em]">
              <span data-brand-logo className="h-8 w-8 flex-none overflow-hidden rounded-[9px] shadow-[0_4px_12px_-4px_rgba(10,108,255,0.6)] transition-opacity duration-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="" width={32} height={32} className="block h-full w-full" />
              </span>
              <span className="truncate">Idrok <span className="text-[13px] font-semibold tracking-normal text-fg2">Business</span></span>
            </Link>
            {showNav && <nav aria-label={t("nav.menu")} className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} aria-current={isActive(pathname, n.href) ? "page" : undefined}
                  className={`rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors duration-200 ${isActive(pathname, n.href) ? "bg-soft-blue text-primary" : "text-fg2 hover:text-fg"}`}>
                  {t(n.label)}
                </Link>
              ))}
              {profile?.isAdmin && (
                <Link href="/admin" aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                  className={`rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors duration-200 ${pathname.startsWith("/admin") ? "bg-ai-soft text-ai" : "text-ai hover:opacity-80"}`}>
                  {t("admin.link")}
                </Link>
              )}
            </nav>}
            <Segmented<Lang> label={t("settings.language")} value={lang} onChange={setLang}
              options={[{ value: "uz", label: "UZ" }, { value: "ru", label: "RU" }]} />
          </div>
        </header>
        <main>{blocked ? <div className="min-h-[70vh]" /> : children}</main>
      </div>

      {showNav && <nav aria-label={t("nav.menu")} className="glass fixed left-1/2 z-[6] grid -translate-x-1/2 grid-cols-5 gap-0.5 rounded-[26px] p-1.5 md:hidden"
        style={{ bottom: "calc(14px + env(safe-area-inset-bottom, 0px))", width: "min(480px, calc(100% - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)))" }}>
        {NAV.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
              className={`grid min-w-0 justify-items-center gap-[3px] rounded-[20px] px-0.5 py-2 text-[11px] font-semibold leading-tight transition-colors duration-200 active:scale-[0.96] ${active ? "bg-soft-blue text-primary" : "text-fg2"}`}>
              <Icon name={n.icon} />
              <span className="max-w-full truncate">{t(n.label)}</span>
            </Link>
          );
        })}
      </nav>}
    </>
  );
}
