import type { Metadata } from "next";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import { createDivisionMetadata, getDivisionConfig, getAccountUrl } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { SupportAssist } from "@henryco/ui/support";
import { IntelligenceLauncher } from "@henryco/ui/intelligence";
import { brandFontVariables, onyxTypeAttr } from "@henryco/ui/fonts";
import { isRtlLocale } from "@henryco/i18n/server";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import "./globals.css";

const sans = localFont({
  src: "./fonts/property-sans-latin.woff2",
  variable: "--font-property-sans",
  weight: "200 800",
  display: "swap",
  fallback: ["Aptos", "Segoe UI Variable", "Segoe UI", "system-ui", "sans-serif"],
});

const display = localFont({
  src: [
    {
      path: "./fonts/property-display-latin.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/property-display-latin.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/property-display-latin.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-property-display",
  display: "swap",
  fallback: ["Times New Roman", "Georgia", "serif"],
});

// The brand editorial reading serif — loaded straight into the shared `--font-reading`
// seam so `.hc-prose` renders in the real Fraunces, not a system fallback.
const reading = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-reading",
});

const property = getDivisionConfig("property");

// PASS 18C — emit hreflang + og:locale per request.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPropertyPublicLocale();
  return {
    ...createDivisionMetadata("property", {
      title: property.name,
      description: property.description,
      openGraphDescription: property.tagline,
      path: "/",
      locale,
    }),
    verification: getVerificationMeta("property"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getPropertyPublicLocale();
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning data-onyx-type={onyxTypeAttr()} className={`${brandFontVariables} ${sans.variable} ${display.variable} ${reading.variable}`}>
      <body className="min-h-screen bg-[var(--property-bg)] text-[var(--property-ink)] antialiased">
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <LocaleProvider locale={lang}>
            {children}
            {process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE === "1" ? (
              <IntelligenceLauncher division="property" accent="#BF7A47" endpoint={getAccountUrl("/api/intelligence/chat")} />
            ) : (
              <SupportAssist division="property" accent="#BF7A47" />
            )}
          </LocaleProvider>
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
