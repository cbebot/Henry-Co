import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, isRtlLocale } from "@henryco/i18n/server";
import "./globals.css";
import CareToaster from "@/components/feedback/CareToaster";
import { PublicThemeGuard, ThirdPartyRuntimeProviders } from "@henryco/ui/public-shell";
import { getCareSettings } from "@/lib/care-data";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCareSettings();
  const title = settings.hero_title || "Henry & Co. Care";
  const description =
    settings.hero_subtitle ||
    "Garment care, home cleaning, and workplace upkeep with clearer booking, steadier tracking, and calmer support.";

  return {
    title,
    description,
    icons: {
      icon: settings.favicon_url || settings.logo_url || undefined,
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
        className="min-h-screen bg-white text-zinc-950 antialiased dark:bg-[#08101C] dark:text-white"
      >
        <PublicThemeGuard>
          <ThirdPartyRuntimeProviders>
            <Suspense fallback={null}>
              <CareToaster />
            </Suspense>
            {children}
          </ThirdPartyRuntimeProviders>
        </PublicThemeGuard>
      </body>
    </html>
  );
}
