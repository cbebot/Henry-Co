import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
// ACCOUNT-PREMIUM-01 — mount the surface-primitives stylesheet once at
// the layout root so any page that renders <HeroCard /> et al. picks up
// the shared visual language without per-page CSS plumbing.
import "@henryco/dashboard-shell/surfaces.css";
import { LocaleProvider } from "@henryco/i18n/react";
import { HenryCoThemeBlocking, ThemeProvider } from "@henryco/ui";
import { ConsentNotice, ThirdPartyRuntimeProviders } from "@henryco/ui/public-shell";
import { SupportAssist } from "@henryco/ui/support";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { henrySubdomain } from "@henryco/config";
import { isRtlLocale } from "@henryco/i18n/server";
import { getAccountAppLocale } from "@/lib/locale-server";

/**
 * Resolve the time-of-day bucket for the ambient canvas tint.
 *
 * Priority: explicit `?tz=` cookie (future preference) → Vercel's
 * X-Vercel-IP-Timezone header (cheap, IP-based) → Africa/Lagos default.
 * The bucket is one of dawn|day|golden|evening|night and drives the
 * radial-gradient overlay rule in globals.css. We compute it server-side
 * so SSR doesn't flash the wrong tint on hydration.
 */
function resolveTimeOfDayBucket(timezone: string): string {
  let hour: number;
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    });
    hour = Number(fmt.format(new Date()));
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) hour = 12;
  } catch {
    hour = 12;
  }
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "golden";
  if (hour >= 19 && hour < 22) return "evening";
  return "night";
}

export const metadata: Metadata = {
  title: "My Account — Henry & Co.",
  description:
    "Manage your HenryCo account, wallet, payments, orders, and preferences across all divisions.",
  robots: { index: false, follow: false },
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? henrySubdomain("account")
      : "http://localhost:3003"
  ),
  openGraph: {
    title: "My Account — Henry & Co.",
    description:
      "Manage your HenryCo account, wallet, payments, orders, and preferences across all divisions.",
    siteName: "Henry & Co. Account",
    type: "website",
  },
  icons: {
    apple: [
      {
        url: "/brand/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAccountAppLocale();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  const headerBag = await headers();
  const timezone =
    headerBag.get("x-vercel-ip-timezone") || "Africa/Lagos";
  const todBucket = resolveTimeOfDayBucket(timezone);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className="min-h-screen bg-[var(--acct-bg)] text-[var(--acct-ink)] antialiased"
        data-hc-tod={todBucket}
      >
        <HenryCoThemeBlocking />
        <ThemeProvider>
          <ScrollToTopOnNavigation />
          <ThirdPartyRuntimeProviders>
            <LocaleProvider locale={locale}>{children}</LocaleProvider>
          </ThirdPartyRuntimeProviders>
          <SupportAssist division="account" />
          <ConsentNotice preferencesHref="/settings#privacy-controls" locale={locale} />
        </ThemeProvider>
      </body>
    </html>
  );
}
