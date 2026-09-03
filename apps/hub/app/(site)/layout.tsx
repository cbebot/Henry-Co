import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { headers } from "next/headers";
import { LocaleProvider } from "@henryco/i18n/react";
import {
  getConsentCopy,
  getHubPublicCopy,
  resolveLocalizedDynamicField,
} from "@henryco/i18n/server";
import { EcosystemPreferences } from "@henryco/ui/public";
import { SupportAssist } from "@henryco/ui/support";
import { IntelligenceLauncher } from "@henryco/ui/intelligence";
import { getAccountUrl } from "@henryco/config";
import { getLivePublicDivisions } from "@henryco/config/live-divisions";
import { onyxTypeAttr } from "@henryco/ui/fonts";
import PublicSiteShell from "../components/PublicSiteShell";
import { HubPublicProviders } from "../components/HubPublicProviders";
import { getCompanySettings } from "../lib/company-settings";
import { normalizeCompanySettings } from "../lib/company-settings-shared";
import { buildHubFooter } from "../lib/site-footer";
import { getHubPublicLocale } from "../../lib/locale-server";
import { getHubSharedLoginUrl, getHubSharedSignupUrl } from "@/lib/hub-public-links";
import { getHubPublicChipUser } from "@/lib/hub-public-viewer";

/**
 * Fraunces — the editorial serif display face of the HenryCo public design system
 * (V3-PUBLIC-DESIGN-01). next/font self-hosts + subsets it (latin + latin-ext — the
 * Latin-script locales), sets font-display:swap, preloads it, and via
 * adjustFontFallback generates size-adjust/ascent-override metrics for the serif
 * fallback so the swap holds CLS ~ 0 even on a slow-3G phone. Body stays system-sans
 * (no web-font cost — mobile-first). Declared HERE (the public (site) layout) so the
 * font loads ONLY on public routes, never on the owner/workspace dashboards. Exposed
 * as --font-fraunces, which --home-font-display consumes (public-design.css).
 */
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-fraunces",
  fallback: [
    "Iowan Old Style",
    "Palatino Linotype",
    "Baskerville",
    "Times New Roman",
    "Times",
    "serif",
  ],
  adjustFontFallback: true,
});

/**
 * Manrope — the calm humanist body grotesque paired with Fraunces. Self-hosted +
 * subset (latin) via next/font with display:swap + adjustFontFallback (size-adjusted
 * system fallback → CLS ~ 0 on slow networks). Loaded ONLY on public routes, exposed
 * as --font-manrope, which --home-font-sans consumes on the public subtree — so body
 * copy reads as a crafted sans while Fraunces carries the editorial display + reading.
 */
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  fallback: [
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  adjustFontFallback: true,
});

function toMetadataUrl(domain?: string | null) {
  const clean = String(domain || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!clean) return undefined;

  try {
    return new URL(`https://${clean}`);
  } catch {
    return undefined;
  }
}

// PASS 18C — locale-aware site metadata. Emits hreflang `languages` map and
// OpenGraph `locale` so the public hub announces its language alternates to
// crawlers. Locale is resolved per request from cookie/profile.
const PUBLIC_HUB_LOCALES = ["en", "fr", "es", "pt", "ar", "de", "it"] as const;
const HUB_OG_LOCALE: Record<string, string> = {
  en: "en_US",
  fr: "fr_FR",
  es: "es_ES",
  pt: "pt_PT",
  ar: "ar_EG",
  de: "de_DE",
  it: "it_IT",
};

export async function generateMetadata(): Promise<Metadata> {
  /** Belt-and-braces: getCompanySettings() already returns a fallback,
   * but if any future regression made it throw, we want metadata
   * generation to keep working rather than poisoning the route render. */
  const [{ settings }, locale] = await Promise.all([
    getCompanySettings().catch(() => ({
      settings: { default_meta_title: null, brand_title: null, brand_description: null, base_domain: null, favicon_url: null, logo_url: null } as never,
      hasServerError: true,
    })),
    getHubPublicLocale().catch(() => "en" as const),
  ]);
  // PASS i18n-100 — translate the SEO title/description through the cached
  // DeepL pipeline. `resolveLocalizedDynamicField` returns the fallback
  // unchanged when the locale is the source language.
  const machineTranslate = locale !== "en";
  const settingsRecord = settings as unknown as Record<string, unknown>;
  const titleField =
    typeof settings.default_meta_title === "string" && settings.default_meta_title.trim()
      ? "default_meta_title"
      : "brand_title";
  const descriptionField =
    typeof settings.default_meta_description === "string" &&
    settings.default_meta_description.trim()
      ? "default_meta_description"
      : "brand_description";
  const [title, description] = await Promise.all([
    resolveLocalizedDynamicField({
      record: settingsRecord,
      field: titleField,
      locale,
      fallback: settings.default_meta_title || settings.brand_title || "Henry Onyx",
      machineTranslate,
    }),
    resolveLocalizedDynamicField({
      record: settingsRecord,
      field: descriptionField,
      locale,
      fallback:
        settings.default_meta_description ||
        settings.brand_description ||
        "Explore the businesses, services, and operating divisions of Henry Onyx",
      machineTranslate,
    }),
  ]);
  const icon = settings.favicon_url || settings.logo_url || undefined;
  const metadataBase = toMetadataUrl(settings.base_domain);
  const canonical = metadataBase ? metadataBase.toString().replace(/\/$/, "") + "/" : "/";
  const languagesMap: Record<string, string> = {};
  for (const code of PUBLIC_HUB_LOCALES) languagesMap[code] = canonical;
  languagesMap["x-default"] = canonical;
  const ogLocale = HUB_OG_LOCALE[locale] || HUB_OG_LOCALE.en;
  const ogAlternateLocale = PUBLIC_HUB_LOCALES.filter((l) => l !== locale).map(
    (l) => HUB_OG_LOCALE[l] || HUB_OG_LOCALE.en,
  );

  return {
    metadataBase,
    title,
    description,
    alternates: {
      canonical,
      languages: languagesMap,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: ogLocale,
      alternateLocale: ogAlternateLocale,
      siteName: title,
      url: canonical,
    },
    icons: icon
      ? {
          icon: [{ url: icon }],
          shortcut: [{ url: icon }],
          apple: [{ url: icon }],
        }
      : undefined,
  };
}

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  /** Use allSettled so one failing fetcher (e.g. supabase auth flake on a
   * preview deploy where env is partially configured) cannot crash the
   * entire (site) tree and leak through to error.tsx. Each fetcher
   * already returns a safe shape; this is a hard barrier on top. */
  const [companyResult, localeResult, headerResult, chipResult] = await Promise.allSettled([
    getCompanySettings(),
    getHubPublicLocale(),
    headers(),
    getHubPublicChipUser(),
  ]);
  const company = companyResult.status === "fulfilled"
    ? companyResult.value
    : { settings: { brand_accent: "#C9A227" } as never, hasServerError: true };
  const locale = localeResult.status === "fulfilled" ? localeResult.value : "en";
  /** headers() shouldn't realistically reject in this context, but if it
   * ever did we want to fall back to a "no headers known" reader rather
   * than crash the layout. The narrow contract used downstream is .get(). */
  const headerReader: { get: (name: string) => string | null } =
    headerResult.status === "fulfilled" ? headerResult.value : { get: () => null };
  const chipUser = chipResult.status === "fulfilled" ? chipResult.value : null;
  const { settings } = company;
  const consentCopy = getConsentCopy(locale);
  const hubCopy = getHubPublicCopy(locale);
  const shellCopy = hubCopy.publicSiteShell;
  const footerSettings = normalizeCompanySettings(
    settings as Parameters<typeof normalizeCompanySettings>[0],
  );
  const footer = buildHubFooter(hubCopy, {
    statement: footerSettings.footer_blurb || footerSettings.brand_description,
    // NUMBER-PURGE (2026-07-10): email only — support_phone (a DB-defaulted
    // number) must not reach the footer object; it serializes into the RSC/HTML
    // payload and Google indexes it even though nothing prints it.
    support: {
      email: footerSettings.support_email,
    },
  });
  const returnPath = headerReader.get("x-hub-return-path") || "/";
  const accountChip = {
    user: chipUser,
    loginHref: getHubSharedLoginUrl(returnPath),
    signupHref: getHubSharedSignupUrl(returnPath),
    accountHref: getAccountUrl("/"),
  };
  // Owned type — when the flag is live at build, the public marketing subtree routes
  // through the shared brand family tokens instead of interim Fraunces/Manrope. The
  // --acct-font-* + --hc-font-reading aliases below reference --home-font-*, so they
  // flip automatically. Pre-reveal keeps the interim faces (identical to before).
  const live = onyxTypeAttr() === "live";

  return (
    // Scope the editorial serif (Fraunces) to the public subtree. --font-fraunces is
    // set here by next/font's `.variable` class, so we (re)declare --home-font-display
    // HERE too — on the same element — so its var(--font-fraunces) actually resolves
    // (declaring it at :root would freeze it invalid before the font var exists). We
    // also alias the homepage's existing display-font var to the system one, so the
    // certified homepage adopts Fraunces with no component churn (refine, not redo).
    <div
      className={`${fraunces.variable} ${manrope.variable}`}
      style={
        {
          // Public body copy reads in the loaded Manrope (declared HERE so
          // var(--font-manrope) resolves on the same element next/font set it).
          fontFamily: "var(--home-font-sans)",
          ["--home-font-display" as string]: live
            ? "var(--hc-font-serif)"
            : 'var(--font-fraunces), "Iowan Old Style", "Palatino Linotype", "Baskerville", "Times New Roman", Times, serif',
          ["--acct-font-display" as string]: "var(--home-font-display)",
          // READING-01: point the long-form reading serif (.hc-prose) at the
          // already-loaded Fraunces, so editorial body copy reads like the
          // reference. We override --hc-font-reading itself (not the inner
          // --font-reading) because the token resolves at :root and would
          // otherwise freeze to the system-serif fallback.
          ["--hc-font-reading" as string]: "var(--home-font-display)",
          // READING-01 (premium sans): pair Fraunces with the loaded Manrope for
          // public body/UI copy — a crafted sans where the serif isn't carrying
          // the reading. --acct-font-sans aliases it so the body rule adopts it.
          ["--home-font-sans" as string]: live
            ? "var(--hc-font-sans)"
            : 'var(--font-manrope), system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          ["--acct-font-sans" as string]: "var(--home-font-sans)",
        } as CSSProperties
      }
    >
      <HubPublicProviders>
        <LocaleProvider locale={locale}>
          <PublicSiteShell
            initialSettings={settings}
            accountChip={accountChip}
            copy={shellCopy}
            footer={footer}
            footerDivisions={await getLivePublicDivisions()}
          >
            {children}
          </PublicSiteShell>
          <EcosystemPreferences copy={consentCopy} initialLocale={locale} />
          {process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE === "1" ? (
            <IntelligenceLauncher division="hub" endpoint={getAccountUrl("/api/intelligence/chat")} />
          ) : (
            <SupportAssist division="hub" />
          )}
        </LocaleProvider>
      </HubPublicProviders>
    </div>
  );
}
