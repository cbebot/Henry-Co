import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { Suspense } from "react";
import {
  isRtlLocale,
  resolveLocalizedDynamicField,
  translateSurfaceLabel,
} from "@henryco/i18n/server";
import "./globals.css";
import CareToaster from "@/components/feedback/CareToaster";
import { brandFontVariables, onyxTypeAttr } from "@henryco/ui/fonts";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { SupportAssist } from "@henryco/ui/support";
import { IntelligenceLauncher } from "@henryco/ui/intelligence";
import { createDivisionMetadata, getAccountUrl } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { getCareSettings } from "@/lib/care-data";
import { getCarePublicLocale } from "@/lib/locale-server";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";

// The brand editorial reading serif — loaded straight into the shared `--font-reading`
// seam so `.hc-prose` renders in the real Fraunces, not a system fallback.
const reading = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-reading",
});

export async function generateMetadata(): Promise<Metadata> {
  const [settings, locale] = await Promise.all([getCareSettings(), getCarePublicLocale()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [title, description] = await Promise.all([
    resolveLocalizedDynamicField({
      record: settings as unknown as Record<string, unknown>,
      field: "hero_title",
      locale,
      fallback: "Henry Onyx Fabric Care",
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: settings as unknown as Record<string, unknown>,
      field: "hero_subtitle",
      locale,
      fallback: t(
        "Garment care, home cleaning, and workplace upkeep with clearer booking, steadier tracking, and calmer support.",
      ),
      machineTranslate: locale !== "en",
    }),
  ]);

  const icon = settings.favicon_url || settings.logo_url || null;
  return {
    ...createDivisionMetadata("care", {
      title,
      description,
      openGraphTitle: title,
      openGraphDescription: description,
      siteName: "Henry Onyx Fabric Care",
      path: "/",
      icon,
      locale, // PASS 18C — emit hreflang + og:locale for the active locale.
    }),
    verification: getVerificationMeta("care"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getCarePublicLocale();
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning className={brandFontVariables} data-onyx-type={onyxTypeAttr()}>
      <body
        className={`${reading.variable} min-h-screen bg-white text-zinc-950 antialiased dark:bg-[#08101C] dark:text-white`}
      >
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <Suspense fallback={null}>
            <CareToaster locale={lang} />
          </Suspense>
          {children}
          {process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE === "1" ? (
            <IntelligenceLauncher division="care" accent="#6B7CFF" endpoint={getAccountUrl("/api/intelligence/chat")} />
          ) : (
            <SupportAssist division="care" accent="#6B7CFF" />
          )}
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
