import type { Metadata } from "next";
import CompanyPageClient from "../../components/CompanyPageClient";
import {
  createFallbackCompanyPage,
  getCompanyPage,
} from "../../lib/company-pages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCompanyPage("contact");
  const resolved = page ?? createFallbackCompanyPage("contact");

  return {
    title: resolved.seo_title || resolved.title,
    description: resolved.seo_description || resolved.intro || resolved.subtitle || undefined,
  };
}

export default async function ContactPage() {
  const { page, hasServerError } = await getCompanyPage("contact");

  return (
    <CompanyPageClient
      pageKey="contact"
      initialData={page ?? createFallbackCompanyPage("contact")}
      serverWarning={hasServerError}
    />
  );
}
