import type { IconName } from "@/components/ui/Icon";

export interface L10n { uz: string; ru: string }
export const L = (uz: string, ru: string): L10n => ({ uz, ru });

export type Visual =
  | { kind: "flow"; steps: L10n[] }
  | { kind: "checklist"; tone: "good" | "bad"; items: L10n[] }
  | { kind: "compare"; left: { title: L10n; items: L10n[] }; right: { title: L10n; items: L10n[] } }
  | { kind: "formula"; caption?: L10n; lines: Array<{ op?: "+" | "−" | "=" | "×" | "÷"; label: L10n; value?: string }> }
  | { kind: "big"; icon: IconName; text: L10n };

export type Slide =
  | { kind: "learn"; title: L10n; body: L10n; visual?: Visual }
  | { kind: "quiz"; question: L10n; options: L10n[]; correct: number; explain: L10n };

export interface Lesson {
  id: string;
  level: 0;
  minutes: number;
  icon: IconName;
  title: L10n;
  summary: L10n;
  slides: Slide[];
}
