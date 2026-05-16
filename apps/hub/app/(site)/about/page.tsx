import type { Metadata } from "next";
import { getHubPublicCopy } from "@henryco/i18n/server";
import { getHubPublicLocale } from "../../../lib/locale-server";
import AboutHonestBlock from "../../components/AboutHonestBlock";
import AboutLeadershipGrid from "../../components/AboutLeadershipGrid";
import CompanyPageClient from "../../components/CompanyPageClient";
import { getPublishedPeople } from "../../lib/about-people";
import {
  createFallbackCompanyPage,
  getCompanyPage,
} from "../../lib/company-pages";
import { getCompanySettings } from "../../lib/company-settings";
import {
  normalizeCompanySettings,
  type CompanySettingsRecord,
} from "../../lib/company-settings-shared";
import { getPublishedDivisions, type DivisionRow } from "../../lib/divisions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCompanyPage("about").catch(() => ({ page: null }));
  const resolved = page ?? createFallbackCompanyPage("about");

  return {
    title: resolved.seo_title || resolved.title,
    description: resolved.seo_description || resolved.intro || resolved.subtitle || undefined,
  };
}

export default async function AboutPage() {
  /** allSettled so a single fetcher rejection cannot escalate to error.tsx.
   * The static fallback is the source of truth when supabase is unavailable
   * (e.g., preview env without secrets) — the page still renders premium
   * content without the dynamic edits. */
  const [pageResult, peopleResult, settingsResult, divisionsResult, locale] =
    await Promise.all([
      getCompanyPage("about").catch(() => ({ page: null, hasServerError: true })),
      getPublishedPeople("about").catch(() => ({ people: [], hasServerError: true })),
      getCompanySettings().catch(() => null),
      getPublishedDivisions().catch(() => ({ divisions: [] })),
      getHubPublicLocale().catch(() => "en" as const),
    ]);
  const settings: CompanySettingsRecord = normalizeCompanySettings(settingsResult);
  const divisions: DivisionRow[] = Array.isArray(divisionsResult?.divisions)
    ? divisionsResult.divisions
    : [];
  const copy = getHubPublicCopy(locale);

  return (
    <>
      <CompanyPageClient
        pageKey="about"
        initialData={pageResult.page ?? createFallbackCompanyPage("about")}
        serverWarning={Boolean(pageResult.hasServerError || peopleResult.hasServerError)}
        hideSections
        hideFooter
        copy={copy.companyPage}
        locale={locale}
      />
      <AboutHonestBlock settings={settings} divisions={divisions} copy={copy.aboutHonest} />
      <AboutLeadershipGrid people={peopleResult.people} copy={copy.leadership} />
    </>
  );
}
