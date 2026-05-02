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
import { AssistDock } from "@henryco/ui/support";
import { COMPANY, createDivisionMetadata } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { getHubPublicLocale, getHubLocaleSuggestion } from "@/lib/locale-server";
import { SeoJsonLd } from "./components/SeoJsonLd";

export const metadata: Metadata = {
  ...createDivisionMetadata("hub", {
    title: "Henry & Co. Company Hub",
    description: COMPANY.group.mission,
    path: "/",
  }),
  verification: getVerificationMeta("hub"),
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
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <ThirdPartyRuntimeProviders>{children}</ThirdPartyRuntimeProviders>
          <AssistDock division="hub" />
          <ConsentNotice preferencesHref="/preferences" locale={lang} />
          <LocaleSuggestion suggestedLocale={suggestedLocale} currentLocale={lang} />
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
