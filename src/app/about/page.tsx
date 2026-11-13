"use client";

import { useEffect } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { CONTACT, SHOW_SUPPORTER, TEAM } from "@/lib/about";
import styles from "./about.module.css";

/** Public "About us" page: /about (Uzbek) and /about?lang=ru (Russian). Works without signing in. */
export default function AboutPage() {
  const { t, setLang } = usePrefs();

  useEffect(() => {
    const lang = new URLSearchParams(window.location.search).get("lang");
    if (lang === "ru" || lang === "uz") setLang(lang);
  }, [setLang]);

  return (
    <div className={styles.wrap}>
      <article className={styles.card}>
        <h1 className={styles.h1}>{t("about.title")}</h1>
        <div className={styles.muted}>{t("about.updated")}</div>

        <h2 className={styles.h2}>{t("about.what.h")}</h2>
        <p className={styles.p}>{t("about.what.p")}</p>

        <h2 className={styles.h2}>{t("about.goal.h")}</h2>
        <p className={styles.p}>{t("about.goal.p")}</p>

        <h2 className={styles.h2}>{t("about.team.h")}</h2>
        <div className={styles.team}>
          {TEAM.map((m) => (
            <div key={m.name} className={styles.member}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.photo} alt={m.name} width={480} height={480} className={styles.photo} />
              <b>{m.name}</b>
              <span>{t(m.role)}</span>
            </div>
          ))}
        </div>

        {SHOW_SUPPORTER && (
          <>
            <h2 className={styles.h2}>{t("about.supporter.h")}</h2>
            <p className={styles.p}>{t("about.supporter.p")}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/team/kelajak.jpg" alt="Kelajak Markazlari" width={180} height={180} className={styles.partner} />
          </>
        )}

        <h2 className={styles.h2}>{t("about.contact.h")}</h2>
        <p className={styles.p}>
          Telegram: <a href={CONTACT.telegram.href} target="_blank" rel="noreferrer">{CONTACT.telegram.label}</a> ({CONTACT.telegram.href}), email:{" "}
          <a href={`mailto:${CONTACT.email}`} target="_blank" rel="noreferrer">{CONTACT.email}</a>
        </p>
      </article>
    </div>
  );
}
