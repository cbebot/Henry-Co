import type { Metadata } from "next";
import { createDivisionMetadata, getDivisionConfig } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { AssistDock } from "@henryco/ui/support";
import { henrycoFontVariables } from "@henryco/ui/brand-typography";
import { isRtlLocale } from "@henryco/i18n/server";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import "./globals.css";

const property = getDivisionConfig("property");

export const metadata: Metadata = {
  ...createDivisionMetadata("property", {
    title: property.name,
    description: property.description,
    openGraphDescription: property.tagline,
    path: "/",
  }),
  verification: getVerificationMeta("property"),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getPropertyPublicLocale();
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning className={henrycoFontVariables}>
      <body className="min-h-screen bg-[var(--property-bg)] text-[var(--property-ink)] antialiased">
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <LocaleProvider locale={lang}>
            {children}
            <AssistDock division="property" accent="#BF7A47" />
          </LocaleProvider>
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
