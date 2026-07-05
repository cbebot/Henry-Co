import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { SupportAssist } from "@henryco/ui/support";
import { IntelligenceLauncher } from "@henryco/ui/intelligence";
import { isRtlLocale } from "@henryco/i18n/server";
import { getLearnPublicLocale } from "@/lib/locale-server";
import "./globals.css";
import { createDivisionMetadata, getDivisionConfig, getAccountUrl } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import { SensitiveActionProviderBridge } from "@/components/auth/SensitiveActionProviderBridge";

const learn = getDivisionConfig("learn");

// The brand editorial reading serif — loaded straight into the shared `--font-reading`
// seam so `.hc-prose` renders in the real Fraunces, not a system fallback.
const reading = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-reading",
});

// PASS 18C — emit hreflang + og:locale per request.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLearnPublicLocale();
  return {
    ...createDivisionMetadata("learn", {
      title: learn.name,
      description: learn.description,
      openGraphDescription: learn.tagline,
      path: "/",
      locale,
    }),
    verification: getVerificationMeta("learn"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLearnPublicLocale();
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className={`${reading.variable} min-h-screen bg-[var(--learn-bg)] text-[var(--learn-ink)] antialiased`}>
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <LocaleProvider locale={lang}>
            <SensitiveActionProviderBridge email={null}>
              {children}
            </SensitiveActionProviderBridge>
            {process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE === "1" ? (
              <IntelligenceLauncher division="learn" accent="#7C5CFF" endpoint={getAccountUrl("/api/intelligence/chat")} />
            ) : (
              <SupportAssist division="learn" accent="#7C5CFF" />
            )}
          </LocaleProvider>
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
