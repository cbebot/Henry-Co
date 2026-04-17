import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { MarketplaceRuntimeProvider } from "@/components/marketplace/runtime-provider";
import { PublicThemeGuard, ThirdPartyRuntimeProviders } from "@henryco/ui/public-shell";
import { FloatingSupport } from "@henryco/ui/support";
import { LocaleProvider } from "@henryco/i18n/react";
import { getMarketplaceShellState } from "@/lib/marketplace/data";
import { getDivisionConfig } from "@henryco/config";
import { isRtlLocale } from "@henryco/i18n/server";
import { getMarketplaceLocale } from "@/lib/locale-server";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-marketplace-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-marketplace-sans",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const marketplace = getDivisionConfig("marketplace");

  return {
    title: marketplace.name,
    description: marketplace.description,
    metadataBase: new URL(
      process.env.NODE_ENV === "production"
        ? `https://${marketplace.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`
        : "http://localhost:3000"
    ),
    openGraph: {
      title: marketplace.name,
      description: marketplace.tagline,
      siteName: marketplace.name,
      type: "website",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, shell] = await Promise.all([getMarketplaceLocale(), getMarketplaceShellState()]);
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${manrope.variable} min-h-screen bg-[var(--market-bg)] text-[var(--market-ink)] antialiased`}
      >
        <PublicThemeGuard>
          <ThirdPartyRuntimeProviders>
            <LocaleProvider locale={lang}>
              <MarketplaceRuntimeProvider initialShell={shell}>
                {children}
                <FloatingSupport
                  divisionName="HenryCo Marketplace"
                  accent="#B2863B"
                  supportEmail="marketplace@henrycogroup.com"
                  supportUrl="/support"
                />
              </MarketplaceRuntimeProvider>
            </LocaleProvider>
          </ThirdPartyRuntimeProviders>
        </PublicThemeGuard>
      </body>
    </html>
  );
}
