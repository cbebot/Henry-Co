import type { Metadata } from "next";
import localFont from "next/font/local";
import { createDivisionMetadata, getDivisionConfig } from "@henryco/config";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { HenryCoAnalytics, getVerificationMeta } from "@henryco/seo";
import { LocaleProvider } from "@henryco/i18n/react";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { AssistDock } from "@henryco/ui/support";
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
    <html lang={lang} dir={dir} suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
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
