import { CrossDivisionSearchExperience } from "@henryco/ui";
import { getHubPublicCopy } from "@henryco/i18n/server";
import {
  buildHubSearchSignInHref,
  getHubLockedSearchResults,
  getHubSearchResults,
} from "@/lib/search";
import { getHubPublicChipUser } from "@/lib/hub-public-viewer";
import { getHubPublicLocale } from "../../../lib/locale-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search Henry & Co.",
  description: "Search Henry & Co. divisions, workflows, and support routes from one hub.",
};

export default async function HubSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [params, chipUser, locale] = await Promise.all([
    searchParams,
    getHubPublicChipUser(),
    getHubPublicLocale(),
  ]);
  const query = String(params.q || "").trim();
  const signedIn = Boolean(chipUser);
  // i18n: search chrome strings now flow through @henryco/i18n (were hardcoded
  // English) and are tightened to one title + one helper line per the design system.
  const copy = getHubPublicCopy(locale).search;

  return (
    <CrossDivisionSearchExperience
      context="public"
      title={copy.title}
      description={copy.description}
      placeholder={copy.placeholder}
      initialQuery={query}
      results={getHubSearchResults({ signedIn })}
      lockedResults={signedIn ? [] : getHubLockedSearchResults()}
      signInHref={signedIn ? undefined : buildHubSearchSignInHref(query)}
      signInLabel={copy.signInLabel}
    />
  );
}
