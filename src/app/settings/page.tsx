"use client";

import { usePrefs, type ThemePref } from "@/components/providers/PrefsProvider";
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
  return (
    <div data-motion-preset="dashboard" className="pt-6">
      <h1 className="mb-5 text-[30px] font-extrabold tracking-[-0.03em]">{t("settings.title")}</h1>
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
      <Card>
        <div className="mb-1.5 flex items-center gap-2.5"><Icon name="shield" size={18} className="text-primary" /><h2 className="m-0 text-[17px] font-bold">{t("settings.about")}</h2></div>
        <p className="m-0 text-sm text-fg2">{t("settings.aboutBody")}</p>
        <p className="num mt-3 text-xs text-fg3">{t("settings.version")} 0.1.0</p>
      </Card>
    </div>
  );
}
