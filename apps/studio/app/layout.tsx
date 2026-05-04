import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { AssistDock } from "@henryco/ui/support";
import { henrycoFontVariables } from "@henryco/ui/brand-typography";
import { StudioToastRoot } from "@/components/studio/studio-toast-root";
import { createDivisionMetadata, getDivisionConfig } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { isRtlLocale } from "@henryco/i18n/server";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";

const studio = getDivisionConfig("studio");

export const metadata: Metadata = {
  ...createDivisionMetadata("studio", {
    title: studio.name,
    description: studio.description,
    openGraphDescription: studio.tagline,
    path: "/",
  }),
  verification: getVerificationMeta("studio"),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getStudioPublicLocale();
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning className={henrycoFontVariables}>
      <body className="min-h-screen bg-[var(--studio-bg)] text-[var(--studio-ink)] antialiased">
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <LocaleProvider locale={lang}>
            {children}
            <StudioToastRoot />
            <AssistDock division="studio" accent="#49C0C5" />
          </LocaleProvider>
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
