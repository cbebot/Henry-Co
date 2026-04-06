import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Manrope, Newsreader } from "next/font/google";
import { getDivisionConfig } from "@henryco/config";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { LOCALE_COOKIE, normalizeLocale, isRtlLocale } from "@henryco/i18n/server";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-jobs-display",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-jobs-sans",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const jobs = getDivisionConfig("jobs");
  const domain =
    process.env.NODE_ENV === "production"
      ? `https://${jobs.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`
      : "http://localhost:3000";

  return {
    title: jobs.name,
    description: jobs.description,
    metadataBase: new URL(domain),
    openGraph: {
      title: jobs.name,
      description: jobs.tagline,
      siteName: jobs.name,
      type: "website",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} min-h-screen bg-[var(--jobs-bg)] text-[var(--jobs-ink)] antialiased`}
      >
        <PublicThemeGuard>{children}</PublicThemeGuard>
      </body>
    </html>
  );
}
