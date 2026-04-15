import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, isRtlLocale } from "@henryco/i18n/server";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { COMPANY, createDivisionMetadata } from "@henryco/config";

export const metadata: Metadata = createDivisionMetadata("hub", {
  title: "Henry & Co. Company Hub",
  description: "Premium multi-division ecosystem for Henry & Co.",
  openGraphTitle: "Henry & Co.",
  openGraphDescription: COMPANY.group.mission,
  siteName: "Henry & Co.",
});

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
        <PublicThemeGuard>{children}</PublicThemeGuard>
      </body>
    </html>
  );
}
