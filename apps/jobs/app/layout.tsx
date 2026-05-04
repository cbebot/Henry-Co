import type { Metadata } from "next";
import { createDivisionMetadata, getDivisionConfig } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { AssistDock } from "@henryco/ui/support";
import { henrycoFontVariables } from "@henryco/ui/brand-typography";
import { isRtlLocale } from "@henryco/i18n/server";
import { getJobsPublicLocale } from "@/lib/locale-server";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import "./globals.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const jobs = getDivisionConfig("jobs");
  return {
    ...createDivisionMetadata("jobs", {
      title: jobs.name,
      description: jobs.description,
      openGraphDescription: jobs.tagline,
      path: "/",
    }),
    verification: getVerificationMeta("jobs"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getJobsPublicLocale();
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning className={henrycoFontVariables}>
      <body
        className="min-h-screen bg-[var(--jobs-bg)] text-[var(--jobs-ink)] antialiased"
      >
        <SeoJsonLd />
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <LocaleProvider locale={lang}>
            {children}
            <AssistDock division="jobs" accent="#0E7C86" />
          </LocaleProvider>
        </PublicThemeGuard>
        <HenryCoAnalytics />
      </body>
    </html>
  );
}
