import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { SupportAssist } from "@henryco/ui/support";
import { IntelligenceLauncher } from "@henryco/ui/intelligence";
import { createDivisionMetadata, getDivisionConfig, getAccountUrl } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { isRtlLocale } from "@henryco/i18n/server";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import "./globals.css";

const logistics = getDivisionConfig("logistics");

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

// The brand editorial reading serif — loaded straight into the shared `--font-reading`
// seam so `.hc-prose` renders in the real Fraunces, not a system fallback.
const reading = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-reading",
});

// PASS 18C — emit hreflang + og:locale per request.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLogisticsPublicLocale();
  return {
    ...createDivisionMetadata("logistics", {
      title: `${logistics.name} | Henry Onyx`,
      description: logistics.description,
      openGraphDescription: logistics.tagline,
      path: "/",
      locale,
    }),
    verification: getVerificationMeta("logistics"),
  };
}

/**
 * Root layout — providers only. The public marketing/booking surface lives under
 * the `(public)` route group (its own shell wraps PublicChrome + PublicSiteFooter
 * on the theme-aware --home-* scope). Staff/operator workspaces ((staff)) and the
 * auth/pay redirects render bare here and keep their own dark chrome/tokens.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLogisticsPublicLocale();
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} className={`${manrope.variable} ${reading.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <LocaleProvider locale={lang}>
            {children}
            {process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE === "1" ? (
              <IntelligenceLauncher division="logistics" accent="#D06F32" endpoint={getAccountUrl("/api/intelligence/chat")} />
            ) : (
              <SupportAssist division="logistics" accent="#D06F32" />
            )}
          </LocaleProvider>
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
