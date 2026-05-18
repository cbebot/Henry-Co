import type { Metadata } from "next";
import { getHubPublicCopy } from "@henryco/i18n/server";
import { getHubPublicLocale } from "../../../lib/locale-server";
import CompanyPageClient from "../../components/CompanyPageClient";
import {
  createFallbackCompanyPage,
  getCompanyPage,
  localizeCompanyPage,
} from "../../lib/company-pages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const [{ page }, locale] = await Promise.all([
    getCompanyPage("terms").catch(() => ({ page: null })),
    getHubPublicLocale().catch(() => "en" as const),
  ]);
  const baseResolved = page ?? createFallbackCompanyPage("terms");
  const resolved = await localizeCompanyPage(baseResolved, locale);

  return {
    title: resolved.seo_title || resolved.title,
    description: resolved.seo_description || resolved.intro || resolved.subtitle || undefined,
  };
}

export default async function TermsPage() {
  const [result, locale] = await Promise.all([
    getCompanyPage("terms").catch(() => ({ page: null, hasServerError: true })),
    getHubPublicLocale().catch(() => "en" as const),
  ]);
  const copy = getHubPublicCopy(locale);

  // PASS i18n-100 — translate the row text for SSR first paint.
  const localizedPage = await localizeCompanyPage(
    result.page ?? createFallbackCompanyPage("terms"),
    locale,
  );

  return (
    <CompanyPageClient
      pageKey="terms"
      initialData={localizedPage}
      serverWarning={result.hasServerError}
      copy={copy.companyPage}
      locale={locale}
    />
  );
}
