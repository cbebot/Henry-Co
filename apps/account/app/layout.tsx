import type { Metadata } from "next";
import { headers } from "next/headers";
import { Fraunces } from "next/font/google";
import "./globals.css";
// ACCOUNT-PREMIUM-01 — mount the surface-primitives stylesheet once at
// the layout root so any page that renders <HeroCard /> et al. picks up
// the shared visual language without per-page CSS plumbing.
import "@henryco/dashboard-shell/surfaces.css";
import { LocaleProvider } from "@henryco/i18n/react";
import { HenryCoThemeBlocking, ThemeProvider } from "@henryco/ui";
import { FeedbackToastViewport } from "@henryco/ui/feedback";
import { brandFontVariables, onyxTypeAttr } from "@henryco/ui/fonts";
import { ConsentNotice, ThirdPartyRuntimeProviders } from "@henryco/ui/public-shell";
import { SupportAssist } from "@henryco/ui/support";
import { IntelligenceLauncher } from "@henryco/ui/intelligence";
import { ScrollToTopOnNavigation } from "@henryco/config/scroll-to-top";
import { createSurfaceMetadata } from "@henryco/config";
import { isRtlLocale } from "@henryco/i18n/server";
import { getAccountAppLocale } from "@/lib/locale-server";

// The brand editorial reading serif — loaded straight into the shared `--font-reading`
// seam so `.hc-prose` renders in the real Fraunces, not a system fallback.
const reading = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-reading",
});

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

// OG-SOCIAL-METADATA — account is a non-division, customer-facing surface
// (authenticated, so noindex), but a shared account link still needs a proper
// Facebook/X/LinkedIn/WhatsApp preview. It now flows through the same shared
// helper as the public division sites: complete Open Graph + Twitter
// (summary_large_image) tag set, canonical og:url, and og:image served by the
// sibling `opengraph-image` / `twitter-image` routes. `noIndex` is applied
// automatically from the SURFACES registry entry.
export const metadata: Metadata = createSurfaceMetadata("account", {
  title: "My Account — Henry Onyx",
  path: "/",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAccountAppLocale();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  const headerBag = await headers();
  const timezone =
    headerBag.get("x-vercel-ip-timezone") || "Africa/Lagos";
  const todBucket = resolveTimeOfDayBucket(timezone);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className={brandFontVariables} data-onyx-type={onyxTypeAttr()}>
      <body
        className={`${reading.variable} min-h-screen bg-[var(--acct-bg)] text-[var(--acct-ink)] antialiased`}
        data-hc-tod={todBucket}
      >
        <HenryCoThemeBlocking />
        <ThemeProvider>
          <ScrollToTopOnNavigation />
          <ThirdPartyRuntimeProviders>
            <LocaleProvider locale={locale}>
              {children}
              {/* V3-FEEDBACK-01 — app-wide action-feedback toasts. Inside the
                  (account) shell the dashboard's merged viewport claims the
                  bus (renderer election) and this one stands down, so thin
                  route groups like /payments/callback and /auth get feedback
                  without ever double-rendering a toast. */}
              <FeedbackToastViewport />
            </LocaleProvider>
          </ThirdPartyRuntimeProviders>
          {/* Intelligence Live (flag-dark): the company AI launcher replaces the static "?"
              only where NEXT_PUBLIC_INTELLIGENCE_LIVE is on; otherwise the concierge stands. */}
          {process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE === "1" ? (
            // Lift the launcher above the mobile bottom action bar (3.5rem) + a 1rem gap, so
            // the AI support button is never hidden behind it on the dashboard.
            <IntelligenceLauncher division="account" bottomOffset="calc(3.5rem + 1rem)" />
          ) : (
            <SupportAssist division="account" />
          )}
          <ConsentNotice preferencesHref="/settings#privacy-controls" locale={locale} />
        </ThemeProvider>
      </body>
    </html>
  );
}
