import type { Metadata } from "next";
import { getHubPublicCopy } from "@henryco/i18n/server";
import { getHubPublicLocale } from "../../../lib/locale-server";
import CompanyPageClient from "../../components/CompanyPageClient";
import {
  createFallbackCompanyPage,
  getCompanyPage,
} from "../../lib/company-pages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCompanyPage("terms").catch(() => ({ page: null }));
  const resolved = page ?? createFallbackCompanyPage("terms");

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

  return (
    <CompanyPageClient
      pageKey="terms"
      initialData={result.page ?? createFallbackCompanyPage("terms")}
      serverWarning={result.hasServerError}
      copy={copy.companyPage}
      locale={locale}
    />
  );
}
