import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AccountantScopeProvider } from "@/lib/accountant-scope";
import { DemoBadge } from "@/components/layout/DemoBadge";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "أملاك MS | نظام إدارة الأملاك",
  description: "منصة متكاملة لإدارة العقارات والعقود والعملاء والصيانة والتقارير",
};

// viewportFit "cover" is what makes env(safe-area-inset-*) resolve to real
// values instead of 0 — without it the Capacitor Android status bar/gesture
// bar overlay the WebView content directly (unlike a normal browser tab,
// which reserves its own chrome), cutting off buttons at the top/bottom on
// a real device even though nothing looks wrong in a desktop browser.
export const viewport: Viewport = {
  viewportFit: "cover",
};

// suppressHydrationWarning below: Capacitor's SystemBars plugin injects
// --safe-area-inset-* as an inline style on <html> natively, after the
// server-rendered HTML already painted — a real, expected mismatch (not a
// bug in our own rendering), but React's dev-mode warning for it shows up
// as a floating error-count overlay in the WebView that visually sits on
// top of page content (e.g. covering table cells), which is worse than the
// harmless warning it's flagging.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <AccountantScopeProvider>{children}</AccountantScopeProvider>
        </AuthProvider>
        {process.env.NEXT_PUBLIC_DEMO === "true" && <DemoBadge />}
      </body>
    </html>
  );
}
