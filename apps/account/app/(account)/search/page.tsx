import { CrossDivisionSearchExperience } from "@henryco/ui";
import { getAccountSearchResults } from "@/lib/search";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search Account",
  description: "Search HenryCo account workflows and connected division routes.",
};

export default async function AccountSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = String(params.q || "").trim();

  return (
    <CrossDivisionSearchExperience
      context="account"
      title="Search your HenryCo workflows."
      description="Jump directly to exact account actions and connected division routes without falling back to generic dashboards."
      placeholder="Search account: notifications, wallet, invoices, support, jobs applications..."
      initialQuery={query}
      results={getAccountSearchResults()}
    />
  );
}
