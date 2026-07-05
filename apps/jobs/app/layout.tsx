import type { Metadata } from "next";
import { Fraunces, Manrope, Newsreader } from "next/font/google";
import { createDivisionMetadata, getDivisionConfig, getAccountUrl } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { SupportAssist } from "@henryco/ui/support";
import { IntelligenceLauncher } from "@henryco/ui/intelligence";
import { isRtlLocale } from "@henryco/i18n/server";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import { SensitiveActionProviderBridge } from "@/components/auth/SensitiveActionProviderBridge";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jobs-display",
});

const sans = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jobs-sans",
});

// The brand editorial reading serif — loaded straight into the shared `--font-reading`
// seam so `.hc-prose` renders in the real Fraunces, not a system fallback.
const reading = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-reading",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const jobs = getDivisionConfig("jobs");
  // PASS 18C — emit hreflang + og:locale.
  const locale = await getJobsPublicLocale();
  return {
    ...createDivisionMetadata("jobs", {
      title: jobs.name,
      description: jobs.description,
      openGraphDescription: jobs.tagline,
      path: "/",
      locale,
    }),
    verification: getVerificationMeta("jobs"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getJobsPublicLocale();
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} ${reading.variable} min-h-screen bg-[var(--jobs-bg)] text-[var(--jobs-ink)] antialiased`}
      >
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <LocaleProvider locale={lang}>
            <SensitiveActionProviderBridge email={null}>
              {children}
            </SensitiveActionProviderBridge>
            {process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE === "1" ? (
              <IntelligenceLauncher division="jobs" accent="#0E7C86" endpoint={getAccountUrl("/api/intelligence/chat")} />
            ) : (
              <SupportAssist division="jobs" accent="#0E7C86" />
            )}
          </LocaleProvider>
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
