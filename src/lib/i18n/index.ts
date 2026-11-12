import { uz, type MessageKey } from "./uz";
import { ru } from "./ru";

export type Lang = "uz" | "ru";
export const LANGS: Lang[] = ["uz", "ru"];
export const messages: Record<Lang, Record<MessageKey, string>> = { uz, ru };
export type { MessageKey };

export function translate(lang: Lang, key: MessageKey, vars?: Record<string, string | number>): string {
  let s = messages[lang][key] ?? messages.uz[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
