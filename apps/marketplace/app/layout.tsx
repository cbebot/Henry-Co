import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { MarketplaceRuntimeProvider } from "@/components/marketplace/runtime-provider";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { SupportAssist } from "@henryco/ui/support";
import { IntelligenceLauncher } from "@henryco/ui/intelligence";
import { getMarketplaceShellState } from "@/lib/marketplace/data";
import { createDivisionMetadata, getDivisionConfig, getAccountUrl } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { isRtlLocale } from "@henryco/i18n/server";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import { brandFontVariables, onyxTypeAttr } from "@henryco/ui/fonts";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-marketplace-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-marketplace-sans",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const marketplace = getDivisionConfig("marketplace");
  // PASS 18C — pass active locale so hreflang + og:locale render dynamically.
  const locale = await getMarketplacePublicLocale();
  return {
    ...createDivisionMetadata("marketplace", {
      title: marketplace.name,
      description: marketplace.description,
      openGraphDescription: marketplace.tagline,
      path: "/",
      locale,
    }),
    verification: getVerificationMeta("marketplace"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, shell] = await Promise.all([
    getMarketplacePublicLocale(),
    getMarketplaceShellState(),
  ]);
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} className={brandFontVariables} data-onyx-type={onyxTypeAttr()} suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${manrope.variable} min-h-screen bg-[var(--market-bg)] text-[var(--market-ink)] antialiased`}
      >
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <LocaleProvider locale={lang}>
            <MarketplaceRuntimeProvider initialShell={shell}>
              {children}
              {process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE === "1" ? (
                <IntelligenceLauncher division="marketplace" accent="#B2863B" endpoint={getAccountUrl("/api/intelligence/chat")} />
              ) : (
                <SupportAssist division="marketplace" accent="#B2863B" />
              )}
            </MarketplaceRuntimeProvider>
          </LocaleProvider>
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
