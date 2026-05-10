import type { Metadata } from "next";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { AssistDock } from "@henryco/ui/support";
import { isRtlLocale } from "@henryco/i18n/server";
import { getLearnPublicLocale } from "@/lib/locale-server";
import "./globals.css";
import { createDivisionMetadata, getDivisionConfig } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";

const learn = getDivisionConfig("learn");

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
      <body className="min-h-screen bg-[var(--learn-bg)] text-[var(--learn-ink)] antialiased">
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <LocaleProvider locale={lang}>
            {children}
            <AssistDock division="learn" accent="#7C5CFF" />
          </LocaleProvider>
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
