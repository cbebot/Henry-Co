import type { Metadata } from "next";
import { Suspense } from "react";
import {
  isRtlLocale,
  resolveLocalizedDynamicField,
  translateSurfaceLabel,
} from "@henryco/i18n/server";
import "./globals.css";
import CareToaster from "@/components/feedback/CareToaster";
import { PublicThemeGuard } from "@henryco/ui/public-shell";
import { AssistDock } from "@henryco/ui/support";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { getCareSettings } from "@/lib/care-data";
import { getCarePublicLocale } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, locale] = await Promise.all([getCareSettings(), getCarePublicLocale()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [title, description] = await Promise.all([
    resolveLocalizedDynamicField({
      record: settings as unknown as Record<string, unknown>,
      field: "hero_title",
      locale,
      fallback: "Henry & Co. Care",
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: settings as unknown as Record<string, unknown>,
      field: "hero_subtitle",
      locale,
      fallback: t(
        "Garment care, home cleaning, and workplace upkeep with clearer booking, steadier tracking, and calmer support.",
      ),
      machineTranslate: locale !== "en",
    }),
  ]);

  return {
    title,
    description,
    icons: {
      icon: settings.favicon_url || settings.logo_url || undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getCarePublicLocale();
  const dir = isRtlLocale(lang) ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body
        className="min-h-screen bg-white text-zinc-950 antialiased dark:bg-[#08101C] dark:text-white"
      >
        <PublicThemeGuard>
          <ScrollToTopOnNavigation />
          <Suspense fallback={null}>
            <CareToaster locale={lang} />
          </Suspense>
          {children}
          <AssistDock division="care" accent="#C9A227" />
        </PublicThemeGuard>
      </body>
    </html>
  );
}
