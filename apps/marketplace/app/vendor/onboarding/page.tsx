import Link from "next/link";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function VendorOnboardingPage() {
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/onboarding");
  const data = await getVendorWorkspaceData();

  const checklist = [
    {
      title: "Complete storefront trust profile",
      body: "Keep your description, support channels, lead times, and trust signals clear before scaling catalog volume.",
      done: Boolean(data.vendor.description),
    },
    {
      title: "Submit at least one product for moderation",
      body: "A real product submission unlocks moderation feedback, trust review, and search placement.",
      done: data.products.length > 0,
    },
    {
      title: "Confirm fulfillment readiness",
      body: "Lead times, payout details, and low-stock discipline must be stable before you push promotions or campaigns.",
      done: data.payouts.length > 0 || data.orders.length > 0,
    },
  ];

  return (
    <WorkspaceShell
      title="Vendor onboarding"
      description="Approval is only the start. This onboarding surface keeps the next store setup steps visible so sellers move into a premium operating posture instead of guessing."
      nav={vendorNav("/vendor")}
      actions={
        <Link href="/vendor/products/new" className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">
          Submit first product
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section className="market-paper rounded-[1.9rem] p-6">
          <p className="market-kicker">Onboarding checklist</p>
          <div className="mt-5 space-y-4">
            {checklist.map((item) => (
              <article key={item.title} className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-5 py-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--market-ink)]">{item.title}</h2>
                  <span className="rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]">
                    {item.done ? "Done" : "Next"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <article className="market-paper rounded-[1.9rem] p-6">
            <p className="market-kicker">What strong sellers do early</p>
            <div className="mt-5 space-y-4">
              {[
                "Use fewer, sharper products first so quality, trust, and fulfillment discipline are obvious.",
                "Keep lead times and support channels honest. Premium conversion depends on predictable expectations.",
                "Treat moderation feedback as merchandising guidance, not friction. Cleaner listings earn stronger placement.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4 text-sm leading-7 text-[var(--market-ink)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
