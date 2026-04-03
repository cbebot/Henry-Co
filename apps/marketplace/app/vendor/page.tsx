import Link from "next/link";
import { MetricCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function VendorOverviewPage() {
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor");
  const data = await getVendorWorkspaceData();

  return (
    <WorkspaceShell
      title={data.vendor.name}
      description="Seller operations are split by products, orders, disputes, payouts, analytics, store profile, and settings so merchants can work with less noise and better coaching."
      nav={vendorNav("/vendor")}
      actions={
        <Link href="/vendor/products/new" className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">
          Add product
        </Link>
      }
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Products" value={String(data.products.length)} hint="Drafts, submissions, and approved listings." />
        <MetricCard label="Open disputes" value={String(data.disputes.length)} hint="Issue visibility stays separate from orders." />
        <MetricCard label="Pending payouts" value={String(data.payouts.length)} hint="Finance review queue and payout readiness." />
      </div>
      <section className="market-paper rounded-[1.75rem] p-6">
        <p className="market-kicker">Vendor coaching</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            "Low-stock alerts should turn into replenishment actions, not silent conversion leaks.",
            "Listings with thin copy or weak imagery are easier to fix before moderation stalls them.",
            "Payout requests move faster when delivery and dispute hygiene stay clean.",
          ].map((item) => (
            <div key={item} className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4 text-sm leading-7 text-[var(--market-ink)]">
              {item}
            </div>
          ))}
        </div>
      </section>
    </WorkspaceShell>
  );
}
