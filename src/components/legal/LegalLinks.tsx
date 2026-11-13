"use client";

import { usePrefs } from "@/components/providers/PrefsProvider";

/** Small footer links shared by the About, legal and sign-in pages. */
export function LegalLinks({ className = "" }: { className?: string }) {
  const { t } = usePrefs();
  const links: Array<[string, string]> = [["/about", t("about.link")], ["/privacy", t("legal.privacy")], ["/terms", t("legal.terms")], ["/delete-account", t("legal.delete")]];
  return (
    <p className={`mt-5 flex flex-wrap justify-center gap-x-3 gap-y-1 text-center text-[13px] text-fg3 ${className}`}>
      {links.map(([href, label], i) => (
        <span key={href}>{i > 0 && <span aria-hidden className="mr-3">·</span>}<a href={href} className="text-primary">{label}</a></span>
      ))}
    </p>
  );
}
