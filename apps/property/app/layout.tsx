import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { getDivisionConfig } from "@henryco/config";
import { HenryCoThemeBlocking, ThemeProvider } from "@henryco/ui";
import { LOCALE_COOKIE, normalizeLocale, isRtlLocale } from "@henryco/i18n/server";
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
  title: property.name,
  description: property.description,
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? `https://${property.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`
      : "http://localhost:3000"
  ),
  openGraph: {
    title: property.name,
    description: property.tagline,
    siteName: property.name,
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-[var(--property-bg)] text-[var(--property-ink)] antialiased">
        <HenryCoThemeBlocking />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
