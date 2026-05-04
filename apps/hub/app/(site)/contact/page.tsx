import type { Metadata } from "next";
import { COMPANY } from "@henryco/config";
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
  const [pageResult, settingsResult] = await Promise.allSettled([
    getCompanyPage("contact"),
    getCompanySettings(),
  ]);

  const page = pageResult.status === "fulfilled"
    ? pageResult.value
    : { page: null, hasServerError: true };
  const settings = normalizeCompanySettings(
    settingsResult.status === "fulfilled" ? settingsResult.value : null
  );

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
      />
      <CompanyPageClient
        pageKey="contact"
        initialData={page.page ?? createFallbackCompanyPage("contact")}
        serverWarning={page.hasServerError}
        hideHero
      />
    </>
  );
}
