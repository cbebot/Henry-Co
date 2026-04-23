import { CrossDivisionSearchExperience } from "@henryco/ui";
import {
  buildHubSearchSignInHref,
  getHubLockedSearchResults,
  getHubSearchResults,
} from "@/lib/search";
import { getHubPublicChipUser } from "@/lib/hub-public-viewer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search HenryCo",
  description: "Search HenryCo divisions, workflows, and support routes from one hub.",
};

export default async function HubSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [params, chipUser] = await Promise.all([searchParams, getHubPublicChipUser()]);
  const query = String(params.q || "").trim();
  const signedIn = Boolean(chipUser);

  return (
    <CrossDivisionSearchExperience
      context="public"
      title="Search HenryCo across divisions, workflows, and help routes."
      description="This V2 pass routes you into real HenryCo destinations only: divisions, route-level workflows, help surfaces, and mature discovery entry points. It does not fake federated product or private-record search."
      placeholder="Search HenryCo: notifications, wallet, marketplace orders, jobs help, logistics tracking..."
      initialQuery={query}
      results={getHubSearchResults({ signedIn })}
      lockedResults={signedIn ? [] : getHubLockedSearchResults()}
      signInHref={signedIn ? undefined : buildHubSearchSignInHref(query)}
      signInLabel="Sign in and continue search"
    />
  );
}
