import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { MarketplaceRuntimeProvider } from "@/components/marketplace/runtime-provider";
import { HenryCoThemeBlocking, ThemeProvider } from "@henryco/ui";
import { FloatingSupport } from "@henryco/ui/support";
import { getMarketplaceShellState } from "@/lib/marketplace/data";
import { getDivisionConfig } from "@henryco/config";
import { LOCALE_COOKIE, normalizeLocale, isRtlLocale } from "@henryco/i18n/server";

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
  const cookieStore = await cookies();
  const lang = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";
  const shell = await getMarketplaceShellState();

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${manrope.variable} min-h-screen bg-[var(--market-bg)] text-[var(--market-ink)] antialiased`}
      >
        <HenryCoThemeBlocking />
        <ThemeProvider>
          <MarketplaceRuntimeProvider initialShell={shell}>
            {children}
            <FloatingSupport
              divisionName="HenryCo Marketplace"
              accent="#B2863B"
              supportEmail="marketplace@henrycogroup.com"
              supportUrl="/support"
            />
          </MarketplaceRuntimeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
