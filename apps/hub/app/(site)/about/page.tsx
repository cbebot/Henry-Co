import type { Metadata } from "next";
import AboutHonestBlock from "../../components/AboutHonestBlock";
import CompanyPageClient from "../../components/CompanyPageClient";
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
   * content without the dynamic edits.
   *
   * V3 PASS 21 polish-layer: the AboutLeadershipGrid + getPublishedPeople
   * fetcher were removed from this public route. The grid component itself
   * remains on disk for admin/curation surfaces — the rubric called for
   * "concrete divisions over team-photo grids" as the premium signal on
   * the public /about route. */
  const [pageResult, settingsResult, divisionsResult] =
    await Promise.allSettled([
      getCompanyPage("about"),
      getCompanySettings(),
      getPublishedDivisions(),
    ]);
  const pageData = pageResult.status === "fulfilled"
    ? pageResult.value
    : { page: null, hasServerError: true };
  const settings: CompanySettingsRecord = normalizeCompanySettings(
    settingsResult.status === "fulfilled" ? settingsResult.value : null
  );
  const divisions: DivisionRow[] =
    divisionsResult.status === "fulfilled" &&
    Array.isArray(divisionsResult.value?.divisions)
      ? divisionsResult.value.divisions
      : [];

  return (
    <>
      <CompanyPageClient
        pageKey="about"
        initialData={pageData.page ?? createFallbackCompanyPage("about")}
        serverWarning={Boolean(pageData.hasServerError)}
        hideSections={false}
        hideFooter
      />
      <AboutHonestBlock settings={settings} divisions={divisions} />
    </>
  );
}
