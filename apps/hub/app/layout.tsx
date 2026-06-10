import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { isRtlLocale } from "@henryco/i18n/server";
import {
  ConsentNotice,
  LocaleSuggestion,
  PublicThemeGuard,
  ThirdPartyRuntimeProviders,
} from "@henryco/ui/public-shell";
import { SupportAssist } from "@henryco/ui/support";
import { COMPANY, createDivisionMetadata } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { getHubPublicLocale, getHubLocaleSuggestion } from "@/lib/locale-server";
import { SeoJsonLd } from "./components/SeoJsonLd";

// READING-01 / Slice B — the shared editorial type identity, wired through the
// --font-display / --font-body seam the token layer already reads. Fraunces is
// the editorial serif for display moments (hero + section heads); Manrope is the
// calm humanist body that unifies the platform. Both load as VARIABLE fonts (no
// `weight` array) so Fraunces keeps its optical-size axis and each family ships
// a single file — matching marketplace/jobs/logistics. next/font self-hosts +
// subsets both (no third-party request) and size-adjusts the fallback
// (adjustFontFallback) so the swap is near-zero CLS.
const displayFont = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});
const bodyFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

// PASS 18C — generateMetadata so hreflang + og:locale reflect the active
// locale on every request. createDivisionMetadata emits the alternate
// language map and OpenGraph locale fields when `locale` is supplied.
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getHubPublicLocale();
  return {
    ...createDivisionMetadata("hub", {
      title: "Henry & Co. Company Hub",
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
    <html
      lang={lang}
      dir={dir}
      className={`${displayFont.variable} ${bodyFont.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased hc-font-body">
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <ThirdPartyRuntimeProviders>{children}</ThirdPartyRuntimeProviders>
          <SupportAssist division="hub" />
          <ConsentNotice preferencesHref="/preferences" locale={lang} />
          <LocaleSuggestion suggestedLocale={suggestedLocale} currentLocale={lang} />
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
