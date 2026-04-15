import type { Metadata } from "next";
import { createDivisionMetadata } from "@henryco/config";
import CompanyPageClient from "../../components/CompanyPageClient";
import {
  createFallbackCompanyPage,
  getCompanyPage,
} from "../../lib/company-pages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCompanyPage("terms");
  const resolved = page ?? createFallbackCompanyPage("terms");

  return createDivisionMetadata("hub", {
    title: resolved.seo_title || resolved.title,
    description: resolved.seo_description || resolved.intro || resolved.subtitle || undefined,
    path: "/terms",
  });
}

export default async function TermsPage() {
  const { page, hasServerError } = await getCompanyPage("terms");

  return (
    <CompanyPageClient
      pageKey="terms"
      initialData={page ?? createFallbackCompanyPage("terms")}
      serverWarning={hasServerError}
    />
  );
}
