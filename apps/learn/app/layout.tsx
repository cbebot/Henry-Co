import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { LOCALE_COOKIE, normalizeLocale, isRtlLocale } from "@henryco/i18n/server";
import "./globals.css";
import { getDivisionConfig } from "@henryco/config";

const learn = getDivisionConfig("learn");

export const metadata: Metadata = {
  title: learn.name,
  description: learn.description,
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? `https://${learn.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`
      : "http://localhost:3018"
  ),
  openGraph: {
    title: learn.name,
    description: learn.tagline,
    siteName: learn.name,
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--learn-bg)] text-[var(--learn-ink)] antialiased">
        <PublicThemeGuard>{children}</PublicThemeGuard>
      </body>
    </html>
  );
}
