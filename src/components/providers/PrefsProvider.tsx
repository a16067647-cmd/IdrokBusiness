"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type Lang, type MessageKey } from "@/lib/i18n";

export type ThemePref = "system" | "light" | "dark";
interface Prefs { lang: Lang; theme: ThemePref; motion: boolean }
interface PrefsCtx extends Prefs {
  setLang: (l: Lang) => void;
  setTheme: (t: ThemePref) => void;
  setMotion: (m: boolean) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  resolvedTheme: "light" | "dark";
  introNonce: number;
  replayIntro: () => void;
}

const STORAGE_KEY = "idrok.prefs";
const DEFAULTS: Prefs = { lang: "uz", theme: "system", motion: true };
const Ctx = createContext<PrefsCtx | null>(null);

function load(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      lang: p.lang === "ru" ? "ru" : "uz",
      theme: p.theme === "light" || p.theme === "dark" ? p.theme : "system",
      motion: p.motion !== false,
    };
  } catch {
    return DEFAULTS;
  }
}

/** Runs before paint (inlined in <head>) so the first frame already has the right theme. */
export const themeBootScript = `(function(){try{var p=JSON.parse(localStorage.getItem("${STORAGE_KEY}")||"{}");var t=p.theme;if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t);if(p.lang==="ru")document.documentElement.lang="ru"}catch(e){}})();`;

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [systemDark, setSystemDark] = useState(false);
  const [introNonce, setIntroNonce] = useState(0);

  useEffect(() => {
    setPrefs(load());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const fn = () => setSystemDark(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const resolvedTheme: "light" | "dark" = prefs.theme === "system" ? (systemDark ? "dark" : "light") : prefs.theme;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);
  useEffect(() => {
    document.documentElement.lang = prefs.lang;
  }, [prefs.lang]);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }, []);

  const value = useMemo<PrefsCtx>(() => ({
    ...prefs,
    resolvedTheme,
    setLang: (lang) => update({ lang }),
    setTheme: (theme) => update({ theme }),
    setMotion: (motion) => update({ motion }),
    t: (key, vars) => translate(prefs.lang, key, vars),
    introNonce,
    replayIntro: () => setIntroNonce((n) => n + 1),
  }), [prefs, resolvedTheme, update, introNonce]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrefs must be used inside PrefsProvider");
  return v;
}
