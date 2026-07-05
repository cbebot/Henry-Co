import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces } from "next/font/google";
import { isRtlLocale } from "@henryco/i18n/server";
import {
  ConsentNotice,
  LocaleSuggestion,
  PublicThemeGuard,
  ThirdPartyRuntimeProviders,
} from "@henryco/ui/public-shell";
import { SupportAssist } from "@henryco/ui/support";
import { IntelligenceLauncher } from "@henryco/ui/intelligence";
import { COMPANY, createDivisionMetadata, getAccountUrl } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { getHubPublicLocale, getHubLocaleSuggestion } from "@/lib/locale-server";
import { SeoJsonLd } from "./components/SeoJsonLd";

// The brand editorial reading serif — loaded straight into the shared `--font-reading`
// seam so `.hc-prose` renders in the real Fraunces, not a system fallback.
const reading = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-reading",
});

// PASS 18C — generateMetadata so hreflang + og:locale reflect the active
// locale on every request. createDivisionMetadata emits the alternate
// language map and OpenGraph locale fields when `locale` is supplied.
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getHubPublicLocale();
  return {
    ...createDivisionMetadata("hub", {
      title: "Henry Onyx Company Hub",
      description: COMPANY.group.mission,
      path: "/",
      locale: lang,
    }),
    verification: getVerificationMeta("hub"),
  };
}

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
      <body className={`${reading.variable} min-h-screen antialiased`}>
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <ThirdPartyRuntimeProviders>{children}</ThirdPartyRuntimeProviders>
          {process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE === "1" ? (
            <IntelligenceLauncher division="hub" endpoint={getAccountUrl("/api/intelligence/chat")} />
          ) : (
            <SupportAssist division="hub" />
          )}
          <ConsentNotice preferencesHref="/preferences" locale={lang} />
          <LocaleSuggestion suggestedLocale={suggestedLocale} currentLocale={lang} />
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
