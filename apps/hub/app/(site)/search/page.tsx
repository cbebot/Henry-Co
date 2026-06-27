import { CrossDivisionSearchExperience } from "@henryco/ui";
import { getHubNewsletterCopy } from "@henryco/i18n";
import {
  buildHubSearchSignInHref,
  getHubLockedSearchResults,
  getHubSearchResults,
} from "@/lib/search";
import { getHubPublicChipUser } from "@/lib/hub-public-viewer";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getHubPublicLocale();
  const copy = getHubNewsletterCopy(locale).search;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
  };
}

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
  const copy = getHubNewsletterCopy(locale).search;
  const query = String(params.q || "").trim();
  const signedIn = Boolean(chipUser);

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
