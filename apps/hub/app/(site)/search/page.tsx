import type { Metadata } from "next";
import { getHubUrl } from "@henryco/config";
import {
  buildHubSearchSignInHref,
  getHubLockedSearchResults,
  getHubSearchResults,
} from "@/lib/search";
import { getHubPublicChipUser } from "@/lib/hub-public-viewer";
import { HubSearchExperience } from "./HubSearchExperience";
import {
  curatedBrowse,
  rankCatalog,
  VALID_DIVISIONS,
  type Scope,
  type SearchHit,
} from "./search-shared";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search — Henry & Co.",
  description:
    "Search across every Henry & Co. division — marketplace, property, jobs, learning, care, logistics, and studio — plus your account workflows and help routes, from one live hub.",
  alternates: { canonical: "/search" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Search Henry & Co.",
    description:
      "One live entry point across every Henry & Co. division, workflow, and help route.",
    type: "website",
    url: "/search",
  },
  twitter: {
    card: "summary_large_image",
    title: "Search Henry & Co.",
    description:
      "One live entry point across every Henry & Co. division, workflow, and help route.",
  },
};

const SEED_LIMIT = 24;

export default async function HubSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; division?: string }>;
}) {
  const [params, chipUser] = await Promise.all([searchParams, getHubPublicChipUser()]);

  const query = String(params.q || "").trim();
  const divisionParam = String(params.division || "").trim().toLowerCase();
  const initialScope: Scope = VALID_DIVISIONS.has(divisionParam) ? (divisionParam as Scope) : "all";
  const signedIn = Boolean(chipUser);

  const catalog = getHubSearchResults({ signedIn }) as SearchHit[];
  const lockedPreview = signedIn ? [] : (getHubLockedSearchResults() as SearchHit[]);

  // Server-rendered first paint (and the no-JS experience): the client upgrades
  // this seed to live /api/search results on hydration.
  const initialResults = query
    ? rankCatalog(catalog, initialScope, query, SEED_LIMIT)
    : curatedBrowse(catalog, initialScope);

  const signInHref = signedIn ? null : buildHubSearchSignInHref(query);
  const firstName = chipUser?.displayName?.trim().split(/\s+/).filter(Boolean)[0] ?? null;

  const searchActionSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Henry & Co.",
    url: getHubUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getHubUrl("/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionSchema) }}
      />
      <HubSearchExperience
        initialQuery={query}
        initialScope={initialScope}
        signedIn={signedIn}
        firstName={firstName}
        catalog={catalog}
        lockedPreview={lockedPreview}
        initialResults={initialResults}
        signInHref={signInHref}
      />
    </>
  );
}
