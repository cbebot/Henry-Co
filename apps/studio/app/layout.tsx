import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { HenryCoThemeBlocking, ThemeProvider } from "@henryco/ui";
import { StudioToastRoot } from "@/components/studio/studio-toast-root";
import { getDivisionConfig } from "@henryco/config";
import { LOCALE_COOKIE, normalizeLocale, isRtlLocale } from "@henryco/i18n/server";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-studio-sans",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-studio-display",
});

const studio = getDivisionConfig("studio");

export const metadata: Metadata = {
  title: studio.name,
  description: studio.description,
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? `https://${studio.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`
      : "http://localhost:3000"
  ),
  openGraph: {
    title: studio.name,
    description: studio.tagline,
    siteName: studio.name,
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-[var(--studio-bg)] text-[var(--studio-ink)] antialiased">
        <HenryCoThemeBlocking />
        <ThemeProvider>
          {children}
          <StudioToastRoot />
        </ThemeProvider>
      </body>
    </html>
  );
}
