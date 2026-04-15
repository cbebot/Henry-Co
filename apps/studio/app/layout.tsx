import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { StudioToastRoot } from "@/components/studio/studio-toast-root";
import { createDivisionMetadata, getDivisionConfig } from "@henryco/config";
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

export const metadata: Metadata = createDivisionMetadata("studio", {
  title: studio.name,
  description: studio.description,
  openGraphDescription: studio.tagline,
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-[var(--studio-bg)] text-[var(--studio-ink)] antialiased">
        <PublicThemeGuard>
          {children}
          <StudioToastRoot />
        </PublicThemeGuard>
      </body>
    </html>
  );
}
