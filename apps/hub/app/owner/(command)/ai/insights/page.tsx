import Link from "next/link";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getHelperCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function HelperInsightsPage() {
  const data = await getHelperCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Insights"
        title="What the owner should do next"
        description="These recommendations are constrained to the live evidence already visible in the system."
      />

      <OwnerPanel title="Recommendations" description="Actions linked to real signals already present in production.">
        <div className="space-y-3">
          {data.insights.map((insight) => (
            <div key={insight.id} className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
              <div className="text-sm font-semibold text-[var(--acct-ink)]">{insight.title}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">{insight.body}</p>
              <Link href={insight.href} className="mt-3 inline-flex text-xs font-semibold text-[var(--owner-accent)]">
                Open action path
              </Link>
            </div>
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
