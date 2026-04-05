import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, isRtlLocale } from "@henryco/i18n/server";
import { HenryCoThemeBlocking, ThemeProvider } from "@henryco/ui";
import { COMPANY } from "@henryco/config";

export const metadata: Metadata = {
  title: "Henry & Co. Company Hub",
  description: "Premium multi-division ecosystem for Henry & Co.",
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? `https://${COMPANY.group.baseDomain}`
      : "http://localhost:3000"
  ),
  openGraph: {
    title: "Henry & Co.",
    description: COMPANY.group.mission,
    siteName: "Henry & Co.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const lang = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <HenryCoThemeBlocking />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}