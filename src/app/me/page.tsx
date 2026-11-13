"use client";

import Link from "next/link";
import { usePrefs } from "@/components/providers/PrefsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ProductList } from "@/components/simple/ProductList";
import { productsStore } from "@/lib/store/products";
import type { MessageKey } from "@/lib/i18n";

// "Me": your products on top, every advanced screen tucked under "More".
const MORE: Array<{ href: string; icon: IconName; key: string; admin?: boolean }> = [
  { href: "/products", icon: "box", key: "products" },
  { href: "/finance", icon: "calc", key: "finance" },
  { href: "/approvals", icon: "shield", key: "approvals" },
  { href: "/products#h-limits", icon: "lock", key: "rules" },
  { href: "/learn", icon: "book", key: "learn" },
  { href: "/markets/uzum", icon: "globe", key: "markets" },
  { href: "/settings", icon: "gear", key: "settings" },
  { href: "/about", icon: "info", key: "about" },
  { href: "/admin", icon: "clipboard", key: "admin", admin: true },
];

export default function MePage() {
  const { t } = usePrefs();
  const { profile, fullName, email } = useAuth();
  const products = productsStore.use();
  const name = profile?.fullName || fullName || email || "";

  return (
    <div data-motion-preset="dashboard" className="mx-auto grid max-w-[560px] gap-6 pt-5">
      <div className="flex items-center gap-3.5">
        <span className="grid h-14 w-14 flex-none place-items-center rounded-[18px] bg-primary text-[22px] font-extrabold text-white">{(name || "?").slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0">
          <h1 className="m-0 truncate text-[24px] font-extrabold tracking-[-0.02em]">{name}</h1>
          <p className="m-0 text-[15px] text-fg2">{t("me.level", { n: profile?.level ?? 0 })}</p>
        </div>
      </div>

      <section className="grid gap-3" aria-labelledby="h-mine">
        <h2 id="h-mine" className="m-0 text-xl font-extrabold">{t("me.products")}</h2>
        {products.length ? <ProductList products={products} /> : <p className="m-0 text-[16px] text-fg2">{t("me.empty")}</p>}
        <Link href="/check" className="btn btn-primary h-[56px] w-full text-[17px]"><Icon name="plus" size={18} />{t("path.n2btn")}</Link>
      </section>

      <section className="grid gap-3" aria-labelledby="h-more">
        <h2 id="h-more" className="m-0 text-xl font-extrabold">{t("me.more")}</h2>
        <ul className="glass m-0 list-none overflow-hidden rounded-card p-0">
          {MORE.filter((m) => !m.admin || profile?.isAdmin).map((m) => (
            <li key={m.key} className="border-b border-hairline last:border-b-0">
              <Link href={m.href} className="flex min-h-[64px] items-center gap-3 px-4 py-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-track text-fg2"><Icon name={m.icon} size={18} /></span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[16px]">{t(`me.m.${m.key}` as MessageKey)}</b>
                  <span className="block truncate text-[13px] text-fg3">{t(`me.m.${m.key}D` as MessageKey)}</span>
                </span>
                <Icon name="chevron" size={18} className="text-fg3" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
