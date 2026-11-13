import type { IconName } from "@/components/ui/Icon";
import type { MessageKey } from "@/lib/i18n";

/** `also`: other pages that belong to this tab (opened from it), so the tab stays lit. */
export interface NavItem { href: string; label: MessageKey; icon: IconName; also?: string[] }

// Three tabs only. Everything advanced lives under "Me → More".
export const NAV: NavItem[] = [
  { href: "/", label: "nav.path", icon: "home", also: ["/check", "/learn"] },
  { href: "/agents", label: "nav.ask", icon: "sparkle" },
  { href: "/me", label: "nav.me", icon: "user", also: ["/products", "/finance", "/approvals", "/settings", "/markets", "/admin"] },
];

const under = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + "/");

export function isActive(pathname: string, item: NavItem | string) {
  const n = typeof item === "string" ? { href: item } as NavItem : item;
  if (n.href === "/" ? pathname === "/" : under(pathname, n.href)) return true;
  return (n.also ?? []).some((h) => under(pathname, h));
}

/** Pages with their own step-by-step flow hide the bottom tabs so one thing is on screen. */
export const FOCUS_PAGES = ["/check"];
