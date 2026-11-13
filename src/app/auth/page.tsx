"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/ui/Icon";
import { supabase } from "@/lib/supabase/client";
import type { MessageKey } from "@/lib/i18n";
import { LegalLinks } from "@/components/legal/LegalLinks";

type Mode = "signin" | "signup" | "reset" | "update" | "check";

function errorKey(message: string): MessageKey {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "auth.err.invalid";
  if (m.includes("already registered") || m.includes("already exists")) return "auth.err.exists";
  if (m.includes("password") && (m.includes("short") || m.includes("least") || m.includes("weak"))) return "auth.err.weak";
  if (m.includes("not confirmed")) return "auth.err.confirm";
  if (m.includes("rate") || m.includes("too many")) return "auth.err.rate";
  if (m.includes("email") && (m.includes("invalid") || m.includes("valid"))) return "auth.err.email";
  return "auth.err.generic";
}

export default function AuthPage() {
  const { t } = usePrefs();
  const { configured, session, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  // A password-reset link brings the user back here with ?mode=update.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "update") setMode("update");
    const sb = supabase();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") setMode("update"); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && session && mode !== "update") router.replace("/");
  }, [loading, session, mode, router]);

  const switchMode = (m: Mode) => { setMode(m); setError(null); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const sb = supabase();
    if (!sb) return;
    setError(null);
    const mail = email.trim();
    if (mode === "signup") {
      if (!name.trim()) return setError("auth.err.name");
      if (!adult) return setError("auth.err.adult");
    }
    if ((mode === "signup" || mode === "update") && password.length < 8) return setError("auth.err.weak");

    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: err } = await sb.auth.signInWithPassword({ email: mail, password });
        if (err) setError(errorKey(err.message));
      } else if (mode === "signup") {
        const { data, error: err } = await sb.auth.signUp({
          email: mail, password,
          options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: name.trim().slice(0, 80), adult_confirmed: true } },
        });
        if (err) setError(errorKey(err.message));
        else if (!data.session) setMode("check");
      } else if (mode === "reset") {
        const { error: err } = await sb.auth.resetPasswordForEmail(mail, { redirectTo: `${window.location.origin}/auth?mode=update` });
        if (err) setError(errorKey(err.message)); else setMode("check");
      } else if (mode === "update") {
        const { error: err } = await sb.auth.updateUser({ password });
        if (err) setError(errorKey(err.message)); else router.replace("/");
      }
    } catch {
      setError("auth.err.generic");
    } finally {
      setBusy(false);
    }
  };

  const title: Record<Mode, MessageKey> = { signin: "auth.welcome", signup: "auth.createTitle", reset: "auth.resetTitle", update: "auth.updateTitle", check: "auth.checkTitle" };
  const body: Partial<Record<Mode, MessageKey>> = { signin: "auth.welcomeBody", signup: "auth.createBody", reset: "auth.resetBody" };
  const submitLabel: Partial<Record<Mode, MessageKey>> = { signin: "auth.submitSignin", signup: "auth.submitSignup", reset: "auth.resetSubmit", update: "auth.updateSubmit" };

  return (
    <div data-motion-preset="hero" className="grid min-h-[78vh] place-items-center py-8">
      <div className="glass w-full max-w-[420px] rounded-[28px] p-6 md:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Idrok Business" width={64} height={64} className="mb-5 h-16 w-16 rounded-[18px] shadow-[0_12px_30px_-12px_rgba(10,108,255,0.7)]" />
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.025em]">{t(title[mode])}</h1>
        {mode === "check"
          ? <p className="mb-6 mt-1.5 text-[15px] text-fg2">{t("auth.checkBody", { email: email.trim() })}</p>
          : body[mode] && <p className="mb-6 mt-1.5 text-[15px] text-fg2">{t(body[mode]!)}</p>}

        {!configured && <p className="mb-4 rounded-2xl bg-warn-soft p-3 text-sm text-warn-fg">{t("auth.notConfigured")}</p>}

        {(mode === "signin" || mode === "signup") && (
          <div className="mb-5 grid grid-cols-2 gap-0.5 rounded-xl bg-track p-[3px]" role="tablist">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
                className={`rounded-[9px] py-2 text-[13px] font-semibold transition-colors ${mode === m ? "text-fg shadow-[0_1px_4px_var(--glass-shadow)]" : "text-fg2"}`}
                style={mode === m ? { background: "var(--glass-strong)" } : undefined}>
                {t(m === "signin" ? "auth.signin" : "auth.signup")}
              </button>
            ))}
          </div>
        )}

        {mode === "check" ? (
          <button type="button" className="btn btn-primary w-full" onClick={() => switchMode("signin")}>{t("auth.backToSignin")}</button>
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-3.5">
            {mode === "signup" && (
              <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("auth.name")}</span>
                <input id="a-name" className="field" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
            )}
            {mode !== "update" && (
              <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t("auth.email")}</span>
                <input id="a-email" className="field" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            )}
            {mode !== "reset" && (
              <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-fg2">{t(mode === "update" ? "auth.newPassword" : "auth.password")}</span>
                <input id="a-password" className="field" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                {mode !== "signin" && <span className="text-[12px] text-fg3">{t("auth.passwordHint")}</span>}
              </label>
            )}
            {mode === "signup" && (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-track p-3.5 text-sm">
                <input id="a-adult" type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-[var(--primary)]" />
                <span>{t("auth.adult")}</span>
              </label>
            )}
            {error && <p role="alert" className="m-0 rounded-2xl bg-danger-soft p-3 text-sm text-danger-fg">{t(error)}</p>}
            <button type="submit" className="btn btn-primary mt-1 w-full" disabled={busy || !configured}>
              {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden /> : t(submitLabel[mode]!)}
            </button>
            {mode === "signin" && <button type="button" className="text-sm font-semibold text-primary" onClick={() => switchMode("reset")}>{t("auth.forgot")}</button>}
            {mode === "signup" && (
              <p className="m-0 text-center text-[12px] text-fg3">
                {t("legal.agree", { terms: "§T", privacy: "§P" }).split(/(§T|§P)/).map((part, i) =>
                  part === "§T" ? <a key={i} href="/terms" className="text-primary">{t("legal.terms")}</a>
                  : part === "§P" ? <a key={i} href="/privacy" className="text-primary">{t("legal.privacy")}</a>
                  : <span key={i}>{part}</span>)}
              </p>
            )}
            {(mode === "reset" || mode === "update") && (
              <button type="button" className="inline-flex items-center justify-center gap-1 text-sm font-semibold text-primary" onClick={() => switchMode("signin")}><Icon name="back" size={16} />{t("auth.backToSignin")}</button>
            )}
          </form>
                )}
      </div>
      <LegalLinks />
    </div>
  );
}
