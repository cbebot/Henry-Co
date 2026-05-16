import type { Metadata } from "next";
import { COMPANY } from "@henryco/config";
import { getHubPublicCopy } from "@henryco/i18n/server";
import { getHubPublicLocale } from "../../../lib/locale-server";
import CompanyPageClient from "../../components/CompanyPageClient";
import ContactHeroLayout from "../../components/ContactHeroLayout";
import {
  createFallbackCompanyPage,
  getCompanyPage,
} from "../../lib/company-pages";
import { getCompanySettings } from "../../lib/company-settings";
import { normalizeCompanySettings } from "../../lib/company-settings-shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCompanyPage("contact").catch(() => ({ page: null }));
  const resolved = page ?? createFallbackCompanyPage("contact");

  return {
    title: resolved.seo_title || resolved.title,
    description: resolved.seo_description || resolved.intro || resolved.subtitle || undefined,
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

  const supportEmail =
    settings.support_email?.trim() || COMPANY.group.supportEmail;

  const sp = (await searchParams) ?? {};
  const initialReason =
    sp.reason && VALID_REASONS.has(sp.reason) ? sp.reason : "general";
  const planContext = typeof sp.plan === "string" ? sp.plan : null;

  return (
    <>
      <ContactHeroLayout
        supportEmail={supportEmail}
        initialReason={initialReason}
        planContext={planContext}
        copy={copy.contactHero}
      />
      <CompanyPageClient
        pageKey="contact"
        initialData={pageResult.page ?? createFallbackCompanyPage("contact")}
        serverWarning={pageResult.hasServerError}
        hideHero
        copy={copy.companyPage}
        locale={locale}
      />
    </>
  );
}
