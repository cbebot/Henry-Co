import type { Metadata } from "next";
import { createDivisionMetadata } from "@henryco/config";
import AboutLeadershipGrid from "../../components/AboutLeadershipGrid";
import CompanyPageClient from "../../components/CompanyPageClient";
import { getPublishedPeople } from "../../lib/about-people";
import {
  createFallbackCompanyPage,
  getCompanyPage,
} from "../../lib/company-pages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getCompanyPage("about");
  const resolved = page ?? createFallbackCompanyPage("about");

  return createDivisionMetadata("hub", {
    title: resolved.seo_title || resolved.title,
    description: resolved.seo_description || resolved.intro || resolved.subtitle || undefined,
    path: "/about",
  });
}

export default async function AboutPage() {
  const [{ page, hasServerError }, peopleResult] = await Promise.all([
    getCompanyPage("about"),
    getPublishedPeople("about"),
  ]);

  return (
    <>
      <CompanyPageClient
        pageKey="about"
        initialData={page ?? createFallbackCompanyPage("about")}
        serverWarning={Boolean(hasServerError || peopleResult.hasServerError)}
      />
      <AboutLeadershipGrid people={peopleResult.people} />
    </>
  );
}
