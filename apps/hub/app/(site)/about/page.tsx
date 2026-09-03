import type { Metadata } from "next";
import { getHubPublicCopy } from "@henryco/i18n/server";
import AboutHonestBlock from "../../components/AboutHonestBlock";
import CompanyPageEditorial from "../../components/CompanyPageEditorial";
import {
  createFallbackCompanyPage,
  getCompanyPage,
  localizeCompanyPage,
} from "../../lib/company-pages";
import { getCompanySettings } from "../../lib/company-settings";
import {
  normalizeCompanySettings,
  type CompanySettingsRecord,
} from "../../lib/company-settings-shared";
import { getPublishedDivisions, type DivisionRow } from "../../lib/divisions";
import { getHubPublicLocale } from "../../../lib/locale-server";
import { getPublishedPeople } from "../../lib/about-people";
import { autoTranslate } from "../../../lib/i18n/auto-translate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Insert a Cloudinary face-crop transform so a portrait renders as a clean square avatar. */
function faceCrop(url: string, size: number): string {
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/c_fill,g_face,ar_1:1,w_${size},q_auto,f_auto/`);
}

export async function generateMetadata(): Promise<Metadata> {
  const [{ page }, locale] = await Promise.all([
    getCompanyPage("about").catch(() => ({ page: null })),
    getHubPublicLocale().catch(() => "en" as const),
  ]);
  const baseResolved = page ?? createFallbackCompanyPage("about");
  const resolved = await localizeCompanyPage(baseResolved, locale);

  return {
    title: resolved.seo_title || resolved.title,
    description: resolved.seo_description || resolved.intro || resolved.subtitle || undefined,
    alternates: { canonical: "/about" },
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
  const locale = await getHubPublicLocale();
  const copy = getHubPublicCopy(locale);
  const [pageResult, settingsResult, divisionsResult, peopleResult] =
    await Promise.allSettled([
      getCompanyPage("about"),
      getCompanySettings(),
      getPublishedDivisions(),
      getPublishedPeople("about"),
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

  // PASS i18n-100 — translate the row text from `company_pages` through the
  // cached DeepL pipeline for the SSR first paint. CompanyPageClient's
  // realtime subscription will overwrite with raw source text on
  // subsequent supabase pushes (TODO: route the realtime path through the
  // cache).
  const localizedPage = await localizeCompanyPage(
    pageData.page ?? createFallbackCompanyPage("about"),
    locale,
  );

  // Owner spotlight for the "Founder note" card — read from company_people (the
  // CMS), translated for the visitor's locale via the cached DeepL path.
  const ownerRecord =
    peopleResult.status === "fulfilled"
      ? (peopleResult.value.people.find((p) => p.is_owner) ?? null)
      : null;
  const owner = ownerRecord
    ? {
        name: ownerRecord.full_name,
        role: await autoTranslate(ownerRecord.role_title ?? "", locale),
        bio: await autoTranslate(
          ownerRecord.long_bio ?? ownerRecord.short_bio ?? ownerRecord.bio ?? "",
          locale,
        ),
        photoUrl: faceCrop(ownerRecord.photo_url ?? ownerRecord.image_url ?? "", 240),
      }
    : null;

  return (
    <>
      <CompanyPageEditorial
        page={localizedPage}
        serverWarning={Boolean(pageData.hasServerError)}
        hideSections={false}
        hideFooter
        copy={copy.companyPage}
        locale={locale}
      />
      <AboutHonestBlock
        settings={settings}
        divisions={divisions}
        owner={owner}
        copy={copy.aboutHonest}
      />
    </>
  );
}
