import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import CareToaster from "@/components/feedback/CareToaster";
import ThemeProvider from "@/components/providers/theme-provider";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-white text-zinc-950 antialiased dark:bg-[#08101C] dark:text-white"
      >
        <ThemeProvider>
          <Suspense fallback={null}>
            <CareToaster />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
