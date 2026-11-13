/**
 * "About us" page settings.
 *
 * SHOW_SUPPORTER: Kelajak Markazlari agreed to be shown for Idrok Academy.
 * Keep this false until the founders confirm the same support applies to
 * Idrok Business; switching it to true shows the supporter section and logo.
 */
export const SHOW_SUPPORTER = false;

export const TEAM = [
  { photo: "/team/bexruz.jpg", name: "Mamajonov Bexruz", role: "about.role.founder" },
  { photo: "/team/vazzohbek.jpg", name: "Satvaldiyev Vazzohbek", role: "about.role.cofounder" },
  { photo: "/team/abdurahmon.jpg", name: "Rahimjonov Abdurahmon", role: "about.role.cofounder" },
] as const;

export const CONTACT = {
  telegram: { label: "@behruz_sk", href: "https://t.me/behruz_sk" },
  email: "behryzmamajon@gmail.com",
};
