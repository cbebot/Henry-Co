import type { Metadata } from "next";
import CompanyPageClient from "../../components/CompanyPageClient";
import {
  createFallbackCompanyPage,
  getCompanyPage,
} from "../../lib/company-pages";

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

export default async function ContactPage() {
  /** Defensive: return safe fallback rather than letting a thrown
   * supabase error bubble up to the (site) error boundary. */
  const result = await getCompanyPage("contact").catch(() => ({ page: null, hasServerError: true }));

  return (
    <CompanyPageClient
      pageKey="contact"
      initialData={result.page ?? createFallbackCompanyPage("contact")}
      serverWarning={result.hasServerError}
    />
  );
}
