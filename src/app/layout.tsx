import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PrefsProvider, themeBootScript } from "@/components/providers/PrefsProvider";
import { MotionBackground } from "@/components/motion/MotionBackground";
import { Intro } from "@/components/intro/Intro";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "Idrok Business",
  description: "Amazon va Uzum Market uchun biznes tadqiqot va boshqaruv ilovasi.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Idrok Business", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A6CFF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="font-sans">
        <PrefsProvider>
          <MotionBackground />
          <AppShell>{children}</AppShell>
          <Intro />
        </PrefsProvider>
      </body>
    </html>
  );
}
