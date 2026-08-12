import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AccountantScopeProvider } from "@/lib/accountant-scope";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "أملاك MS | نظام إدارة الأملاك",
  description: "منصة متكاملة لإدارة العقارات والعقود والعملاء والصيانة والتقارير",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <AccountantScopeProvider>{children}</AccountantScopeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
