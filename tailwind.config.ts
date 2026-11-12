import type { Config } from "tailwindcss";

// Every colour comes from a CSS variable defined in src/app/globals.css,
// so light and dark themes switch without touching components.
const v = (name: string) => `var(--${name})`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        fg: v("fg"),
        fg2: v("fg-2"),
        fg3: v("fg-3"),
        primary: v("primary"),
        "primary-top": v("primary-top"),
        "primary-deep": v("primary-deep"),
        "soft-blue": v("soft-blue"),
        ai: v("ai"),
        "ai-soft": v("ai-soft"),
        success: v("success"),
        "success-soft": v("success-soft"),
        "success-fg": v("success-fg"),
        warn: v("warn"),
        "warn-soft": v("warn-soft"),
        "warn-fg": v("warn-fg"),
        danger: v("danger"),
        "danger-soft": v("danger-soft"),
        "danger-fg": v("danger-fg"),
        hairline: v("hairline"),
        track: v("track"),
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: { card: "22px", btn: "16px" },
      transitionTimingFunction: { out: "cubic-bezier(0.22, 1, 0.36, 1)" },
    },
  },
  plugins: [],
} satisfies Config;
