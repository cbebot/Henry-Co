import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { isRtlLocale } from "@henryco/i18n/server";
import {
  ConsentNotice,
  LocaleSuggestion,
  PublicThemeGuard,
  ThirdPartyRuntimeProviders,
} from "@henryco/ui/public-shell";
import { COMPANY } from "@henryco/config";
import { getHubPublicLocale, getHubLocaleSuggestion } from "@/lib/locale-server";

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
  const [lang, suggestedLocale] = await Promise.all([
    getHubPublicLocale(),
    getHubLocaleSuggestion(),
  ]);
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <PublicThemeGuard>
          <ThirdPartyRuntimeProviders>{children}</ThirdPartyRuntimeProviders>
          <ConsentNotice preferencesHref="/preferences" locale={lang} />
          <LocaleSuggestion suggestedLocale={suggestedLocale} currentLocale={lang} />
        </PublicThemeGuard>
      </body>
    </html>
  );
}
