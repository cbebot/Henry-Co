import type { Metadata } from "next";
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
  const result = await getCompanyPage("terms").catch(() => ({ page: null, hasServerError: true }));

  return (
    <CompanyPageClient
      pageKey="terms"
      initialData={result.page ?? createFallbackCompanyPage("terms")}
      serverWarning={result.hasServerError}
    />
  );
}
