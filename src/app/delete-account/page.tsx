"use client";

import { useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { CONTACT } from "@/lib/about";
import { LegalLinks } from "@/components/legal/LegalLinks";
import styles from "@/app/about/about.module.css";

/** Public page (required for Google Play): explains deletion and lets a signed-in user delete their account. */
export default function DeleteAccountPage() {
  const { t } = usePrefs();
  const { session, email, signOut } = useAuth();
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true); setError(null);
    const { error: err } = await supabase()!.rpc("delete_my_account");
    setBusy(false);
    if (err) { setError(t("del.error", { msg: err.message })); return; }
    await signOut();
    setStep("done");
  };

  return (
    <div className={styles.wrap}>
      <article className={styles.card}>
        <h1 className={styles.h1}>{t("del.title")}</h1>
        <p className={styles.p} style={{ marginTop: 12 }}>{t("del.intro")}</p>
        <ul className={styles.p} style={{ paddingLeft: 20 }}>
          {(["del.what1", "del.what2", "del.what3", "del.what4"] as const).map((k) => <li key={k}>{t(k)}</li>)}
        </ul>

        {step === "done" ? (
          <p className="mt-4 rounded-2xl bg-success-soft p-4 text-sm font-semibold text-success-fg" role="status">{t("del.done")}</p>
        ) : !session ? (
          <>
            <p className={styles.p} style={{ marginTop: 16 }}>{t("del.howSignedOut")}</p>
            <p className={styles.p}><a href={`mailto:${CONTACT.email}?subject=Delete%20my%20Idrok%20Business%20account`}>{CONTACT.email}</a></p>
            <a href="/auth" className="btn btn-primary btn-sm mt-3">{t("del.signin")}</a>
          </>
        ) : step === "idle" ? (
          <button type="button" className="btn btn-sm mt-4 bg-danger-soft text-danger-fg" onClick={() => setStep("confirm")}>{t("del.button")}</button>
        ) : (
          <div className="mt-4 grid gap-3 rounded-2xl bg-danger-soft p-4">
            <label className="grid gap-1.5 text-sm text-danger-fg">
              <span className="font-semibold">{t("del.confirmLabel", { email })}</span>
              <input id="del-email" className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
            </label>
            {error && <p role="alert" className="m-0 text-sm text-danger-fg">{error}</p>}
            <button type="button" className="btn btn-sm bg-danger text-white" disabled={busy || typed.trim().toLowerCase() !== email.toLowerCase()} onClick={() => void remove()}>{t("del.confirm")}</button>
          </div>
        )}
      </article>
      <LegalLinks />
    </div>
  );
}
