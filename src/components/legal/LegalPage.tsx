"use client";

import { useEffect } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import type { LegalDoc } from "@/lib/legal/content";
import { LegalLinks } from "./LegalLinks";
import styles from "@/app/about/about.module.css";

/** Public legal page in the same card layout as the About page. ?lang=ru switches language. */
export function LegalPage({ doc }: { doc: Record<"uz" | "ru", LegalDoc> }) {
  const { lang, setLang } = usePrefs();
  useEffect(() => {
    const l = new URLSearchParams(window.location.search).get("lang");
    if (l === "ru" || l === "uz") setLang(l);
  }, [setLang]);
  const d = doc[lang];
  return (
    <div className={styles.wrap}>
      <article className={styles.card}>
        <h1 className={styles.h1}>{d.title}</h1>
        <div className={styles.muted}>{d.updated}</div>
        <p className={styles.p} style={{ marginTop: 16 }}>{d.intro}</p>
        {d.sections.map((s) => (
          <section key={s.h}>
            <h2 className={styles.h2}>{s.h}</h2>
            {s.p.length > 1
              ? <ul className={styles.p} style={{ paddingLeft: 20, margin: "6px 0" }}>{s.p.map((x) => <li key={x}>{x}</li>)}</ul>
              : <p className={styles.p}>{s.p[0]}</p>}
          </section>
        ))}
      </article>
      <LegalLinks />
    </div>
  );
}
