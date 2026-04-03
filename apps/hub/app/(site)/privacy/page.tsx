import type { Metadata } from "next";
import CompanyPageClient from "../../components/CompanyPageClient";
import {
  createFallbackCompanyPage,
  getCompanyPage,
} from "../../lib/company-pages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCompanyPage("privacy");
  const resolved = page ?? createFallbackCompanyPage("privacy");

  return {
    title: resolved.seo_title || resolved.title,
    description: resolved.seo_description || resolved.intro || resolved.subtitle || undefined,
  };
}

export default async function PrivacyPage() {
  const { page, hasServerError } = await getCompanyPage("privacy");

  return (
    <CompanyPageClient
      pageKey="privacy"
      initialData={page ?? createFallbackCompanyPage("privacy")}
      serverWarning={hasServerError}
    />
  );
}
