import { CrossDivisionSearchExperience } from "@henryco/ui";
import { getAccountMiscExtraCopy } from "@henryco/i18n";
import { getAccountSearchResults } from "@/lib/search";
import { getAccountAppLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAccountMiscExtraCopy(locale);
  return {
    title: copy.search.metadataTitle,
    description: copy.search.metadataDescription,
  };
}

export default async function AccountSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = String(params.q || "").trim();
  const locale = await getAccountAppLocale();
  const copy = getAccountMiscExtraCopy(locale);

  return (
    <CrossDivisionSearchExperience
      context="account"
      title={copy.search.title}
      description={copy.search.description}
      placeholder={copy.search.placeholder}
      initialQuery={query}
      results={getAccountSearchResults()}
    />
  );
}
