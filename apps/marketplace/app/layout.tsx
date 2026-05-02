import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { MarketplaceRuntimeProvider } from "@/components/marketplace/runtime-provider";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { AssistDock } from "@henryco/ui/support";
import { getMarketplaceShellState } from "@/lib/marketplace/data";
import { createDivisionMetadata, getDivisionConfig } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { isRtlLocale } from "@henryco/i18n/server";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";

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
  return {
    ...createDivisionMetadata("marketplace", {
      title: marketplace.name,
      description: marketplace.description,
      openGraphDescription: marketplace.tagline,
      path: "/",
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
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${manrope.variable} min-h-screen bg-[var(--market-bg)] text-[var(--market-ink)] antialiased`}
      >
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <LocaleProvider locale={lang}>
            <MarketplaceRuntimeProvider initialShell={shell}>
              {children}
              <AssistDock division="marketplace" accent="#B2863B" />
            </MarketplaceRuntimeProvider>
          </LocaleProvider>
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
