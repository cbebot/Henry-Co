import type { Metadata } from "next";
import { COMPANY } from "@henryco/config";
import { getHubPublicCopy, getHubHomeCopy } from "@henryco/i18n/server";
import { getHubPublicLocale } from "../../../lib/locale-server";
import CompanyPageClient from "../../components/CompanyPageClient";
import ContactHeroLayout from "../../components/ContactHeroLayout";
import {
  createFallbackCompanyPage,
  getCompanyPage,
  localizeCompanyPage,
} from "../../lib/company-pages";
import { getCompanySettings } from "../../lib/company-settings";
import { normalizeCompanySettings } from "../../lib/company-settings-shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const [{ page }, locale] = await Promise.all([
    getCompanyPage("contact").catch(() => ({ page: null })),
    getHubPublicLocale().catch(() => "en" as const),
  ]);
  const baseResolved = page ?? createFallbackCompanyPage("contact");
  const resolved = await localizeCompanyPage(baseResolved, locale);

  return {
    title: resolved.seo_title || resolved.title,
    description: resolved.seo_description || resolved.intro || resolved.subtitle || undefined,
    alternates: { canonical: "/contact" },
  };
}

const VALID_REASONS = new Set([
  "general",
  "partnerships",
  "media",
  "supplier",
  "investor",
  "complaint",
  "other",
]);

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string; plan?: string }>;
}) {
  /** Defensive: return safe fallback rather than letting a thrown
   * supabase error bubble up to the (site) error boundary. */
  const [pageResult, settingsResult, locale] = await Promise.all([
    getCompanyPage("contact").catch(() => ({ page: null, hasServerError: true })),
    getCompanySettings().catch(() => null),
    getHubPublicLocale().catch(() => "en" as const),
  ]);

  const settings = normalizeCompanySettings(settingsResult);
  const copy = getHubPublicCopy(locale);
  const homeCopy = getHubHomeCopy(locale);

  const supportEmail =
    settings.support_email?.trim() || COMPANY.group.supportEmail;

  const sp = (await searchParams) ?? {};
  const initialReason =
    sp.reason && VALID_REASONS.has(sp.reason) ? sp.reason : "general";
  const planContext = typeof sp.plan === "string" ? sp.plan : null;

  // PASS i18n-100 — translate the row text for SSR first paint.
  const localizedPage = await localizeCompanyPage(
    pageResult.page ?? createFallbackCompanyPage("contact"),
    locale,
  );

  return (
    <>
      <ContactHeroLayout
        supportEmail={supportEmail}
        initialReason={initialReason}
        planContext={planContext}
        copy={copy.contactHero}
        formCopy={homeCopy.contactHeroForm}
      />
      <CompanyPageClient
        pageKey="contact"
        initialData={localizedPage}
        serverWarning={pageResult.hasServerError}
        hideHero
        copy={copy.companyPage}
        locale={locale}
      />
    </>
  );
}
