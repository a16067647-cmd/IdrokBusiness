"use client";

import { usePrefs, type ThemePref } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, Segmented } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import type { Lang } from "@/lib/i18n";

function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4 last:border-b-0">
      <div className="min-w-0"><div className="text-[15px] font-semibold">{title}</div>{hint && <div className="max-w-[46ch] text-[13px] text-fg2">{hint}</div>}</div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { t, lang, setLang, theme, setTheme, motion, setMotion, sound, setSound, replayIntro } = usePrefs();
  const { session, fullName, email, syncError, signOut, profile } = useAuth();
  return (
    <div data-motion-preset="dashboard" className="pt-6">
      <h1 className="mb-5 text-[30px] font-extrabold tracking-[-0.03em]">{t("settings.title")}</h1>
      {session && (
        <Card className="mb-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-soft-blue text-base font-extrabold text-primary">{(fullName || email).slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold">{fullName || t("account.title")}</div>
                <div className="truncate text-[13px] text-fg2">{email}</div>
              </div>
            </div>
            <button type="button" className="btn btn-sm bg-track text-fg" onClick={() => void signOut()}>{t("account.signout")}</button>
          </div>
          {profile?.isAdmin && (
            <a href="/admin" className="btn btn-primary btn-sm mt-3.5"><Icon name="shield" size={16} />{t("admin.link")}</a>
          )}
          <p className={`mb-0 mt-3 flex items-center gap-2 text-[13px] ${syncError ? "text-warn-fg" : "text-success-fg"}`}>
            <Icon name={syncError ? "shield" : "check"} size={15} />{syncError ? t("account.syncError") : t("account.synced")}
          </p>
        </Card>
      )}
      <Card className="mb-3.5 p-0">
        <Row title={t("settings.language")}>
          <Segmented<Lang> label={t("settings.language")} value={lang} onChange={setLang}
            options={[{ value: "uz", label: "O'zbekcha" }, { value: "ru", label: "Русский" }]} />
        </Row>
        <Row title={t("settings.theme")}>
          <Segmented<ThemePref> label={t("settings.theme")} value={theme} onChange={setTheme}
            options={[{ value: "system", label: t("settings.theme.system") }, { value: "light", label: t("settings.theme.light") }, { value: "dark", label: t("settings.theme.dark") }]} />
        </Row>
        <Row title={t("settings.motion")} hint={t("settings.motionHint")}>
          <Segmented<"on" | "off"> label={t("settings.motion")} value={motion ? "on" : "off"} onChange={(v) => setMotion(v === "on")}
            options={[{ value: "on", label: t("settings.on") }, { value: "off", label: t("settings.off") }]} />
        </Row>
        <Row title={t("settings.sound")} hint={t("settings.soundHint")}>
          <Segmented<"on" | "off"> label={t("settings.sound")} value={sound ? "on" : "off"} onChange={(v) => setSound(v === "on")}
            options={[{ value: "on", label: t("settings.on") }, { value: "off", label: t("settings.off") }]} />
        </Row>
        <Row title={t("settings.intro")}>
          <button type="button" onClick={replayIntro} className="btn btn-primary btn-sm"><Icon name="play" size={16} />{t("settings.introReplay")}</button>
        </Row>
      </Card>
      <a href="/about" className="glass mb-3.5 flex items-center gap-3 rounded-card px-5 py-4 transition-transform active:scale-[0.99]">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-soft-blue text-primary"><Icon name="info" size={18} /></span>
        <span className="flex-1 text-[15px] font-semibold">{t("about.link")}</span>
        <Icon name="chevron" size={18} className="text-fg3" />
      </a>
      <Card className="mb-3.5 p-0">
        {([["/privacy", "legal.privacy", "shield"], ["/terms", "legal.terms", "clipboard"], ["/delete-account", "legal.delete", "x"]] as const).map(([href, key, icon]) => (
          <a key={href} href={href} className="flex items-center gap-3 border-b border-hairline px-5 py-3.5 last:border-b-0">
            <span className={`grid h-8 w-8 flex-none place-items-center rounded-xl ${href === "/delete-account" ? "bg-danger-soft text-danger-fg" : "bg-track text-fg2"}`}><Icon name={icon} size={16} /></span>
            <span className={`flex-1 text-[15px] font-semibold ${href === "/delete-account" ? "text-danger-fg" : ""}`}>{t(key)}</span>
            <Icon name="chevron" size={18} className="text-fg3" />
          </a>
        ))}
      </Card>
      <Card>
        <div className="mb-1.5 flex items-center gap-2.5"><Icon name="shield" size={18} className="text-primary" /><h2 className="m-0 text-[17px] font-bold">{t("settings.about")}</h2></div>
        <p className="m-0 text-sm text-fg2">{t("settings.aboutBody")}</p>
        <p className="num mt-3 text-xs text-fg3">{t("settings.version")} 0.1.0</p>
      </Card>
    </div>
  );
}
