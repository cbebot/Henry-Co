import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { SupportAssist } from "@henryco/ui/support";
import { IntelligenceLauncher } from "@henryco/ui/intelligence";
import { brandFontVariables, onyxTypeAttr } from "@henryco/ui/fonts";
import { StudioToastRoot } from "@/components/studio/studio-toast-root";
import { createDivisionMetadata, getDivisionConfig, getAccountUrl } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { isRtlLocale } from "@henryco/i18n/server";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-studio-sans",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-studio-display",
});

// The brand editorial reading serif — loaded straight into the shared `--font-reading`
// seam so `.hc-prose` (every AI reply, and the company-wide reading face to come) renders
// in the real Fraunces, not a system fallback.
const reading = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-reading",
});

const studio = getDivisionConfig("studio");

// PASS 18C — emit hreflang + og:locale per request.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getStudioPublicLocale();
  return {
    ...createDivisionMetadata("studio", {
      title: studio.name,
      description: studio.description,
      openGraphDescription: studio.tagline,
      path: "/",
      locale,
    }),
    verification: getVerificationMeta("studio"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getStudioPublicLocale();
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning data-onyx-type={onyxTypeAttr()} className={`${brandFontVariables} ${sans.variable} ${display.variable} ${reading.variable}`}>
      <body className="min-h-screen bg-[var(--studio-bg)] text-[var(--studio-ink)] antialiased">
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <LocaleProvider locale={lang}>
            {children}
            <StudioToastRoot />
            {process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE === "1" ? (
              <IntelligenceLauncher division="studio" accent={studio.accent} endpoint={getAccountUrl("/api/intelligence/chat")} />
            ) : (
              <SupportAssist division="studio" accent={studio.accent} />
            )}
          </LocaleProvider>
        </PublicThemeGuard>
        <HenryCoAnalytics vercelAnalytics={false} />
      </body>
    </html>
  );
}
