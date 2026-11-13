"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, Segmented } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { UsersTab } from "./UsersTab";
import { LevelsTab } from "./LevelsTab";
import { LessonsTab } from "./LessonsTab";
import { StatsTab } from "./StatsTab";

type Tab = "stats" | "users" | "levels" | "lessons";

export default function AdminPage() {
  const { t } = usePrefs();
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("stats");

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h === "stats" || h === "users" || h === "levels" || h === "lessons") setTab(h);
  }, []);
  const choose = (v: Tab) => { setTab(v); history.replaceState(null, "", `#${v}`); };

  if (loading || profile === null) {
    return <div className="min-h-[60vh]" />;
  }
  if (!profile.isAdmin) {
    return (
      <div className="grid min-h-[60vh] place-items-center pt-6">
        <Card className="max-w-md p-7 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-track"><Icon name="lock" size={24} /></span>
          <p className="m-0 text-[15px] font-semibold">{t("admin.notAllowed")}</p>
        </Card>
      </div>
    );
  }

  return (
    <div data-motion-preset="dashboard" className="pt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 flex items-center gap-2.5 text-[30px] font-extrabold tracking-[-0.03em]"><Icon name="shield" size={26} className="text-primary" />{t("admin.title")}</h1>
        <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1">
          <Segmented<Tab> label={t("admin.title")} value={tab} onChange={choose} className="whitespace-nowrap"
            options={[{ value: "stats", label: t("admin.stats") }, { value: "users", label: t("admin.users") }, { value: "levels", label: t("admin.levels") }, { value: "lessons", label: t("admin.lessons") }]} />
        </div>
      </div>
      {tab === "stats" && <StatsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "levels" && <LevelsTab />}
      {tab === "lessons" && <LessonsTab />}
    </div>
  );
}
