import type { IconName } from "@/components/ui/Icon";
import type { MessageKey } from "@/lib/i18n";

export interface NavItem { href: string; label: MessageKey; icon: IconName }

export const NAV: NavItem[] = [
  { href: "/", label: "nav.home", icon: "home" },
  { href: "/products", label: "nav.products", icon: "box" },
  { href: "/learn", label: "nav.learn", icon: "book" },
  { href: "/agents", label: "nav.agents", icon: "sparkle" },
  { href: "/settings", label: "nav.settings", icon: "gear" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
