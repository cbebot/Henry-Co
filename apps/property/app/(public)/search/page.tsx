import type { Metadata } from "next";
import { PropertySearchExperience } from "@/components/property/property-search-experience";
import { PropertySectionIntro } from "@/components/property/ui";
import { getPropertySnapshot } from "@/lib/property/data";
import {
  parsePropertySearchState,
  type PropertySearchState,
} from "@/lib/property/search";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  kind?: string;
  area?: string;
  managed?: string;
  furnished?: string;
  sort?: string;
};

function buildMetadataDescription(state: PropertySearchState) {
  const parts = ["Search HenryCo Property with deep-linkable filters"];

  if (state.kind) {
    parts.push(`for ${state.kind.replace(/[_-]+/g, " ")}`);
  }

  if (state.area) {
    parts.push(`in ${state.area.replace(/[_-]+/g, " ")}`);
  }

  if (state.managed) {
    parts.push("with managed listings only");
  }

  if (state.furnished) {
    parts.push("including furnished options");
  }

  return `${parts.join(" ")} while preserving URL state, smooth back and forward behavior, and clear trust context.`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const state = parsePropertySearchState(await searchParams);
  const titleBits = ["Search property listings"];

  if (state.kind) {
    titleBits.push(state.kind.replace(/[_-]+/g, " "));
  }

  if (state.area) {
    titleBits.push(state.area.replace(/[_-]+/g, " "));
  }

  return {
    title: `${titleBits.join(" · ")} | HenryCo Property`,
    description: buildMetadataDescription(state),
  };
}

export default async function PropertySearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = parsePropertySearchState(await searchParams);
  const snapshot = await getPropertySnapshot();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker="Search"
        title="Search serious listings without losing your filters or your pace."
        description="The filter state stays shareable in the URL, the results update without a blunt refresh, and every listing carries clearer trust context before you commit attention."
      />

      <div className="mt-8">
        <PropertySearchExperience
          areas={snapshot.areas}
          listings={snapshot.listings}
          initialState={params}
        />
      </div>
    </main>
  );
}
