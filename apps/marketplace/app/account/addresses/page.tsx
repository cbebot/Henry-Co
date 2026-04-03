import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import type { MarketplaceAddress } from "@/lib/marketplace/types";
import { accountNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function AccountAddressesPage() {
  await requireMarketplaceUser("/account/addresses");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Addresses"
      description="Saved addresses stay tied to the shared account so future HenryCo services can reuse the same customer context."
      nav={accountNav("/account/addresses")}
    >
      <form action="/api/marketplace" method="POST" className="market-paper rounded-[1.75rem] p-5">
        <input type="hidden" name="intent" value="address_upsert" />
        <input type="hidden" name="return_to" value="/account/addresses" />
        <div className="grid gap-4 md:grid-cols-2">
          <input name="label" className="market-input rounded-2xl px-4 py-3" placeholder="Label: Home, Office..." required />
          <input name="recipient_name" className="market-input rounded-2xl px-4 py-3" placeholder="Recipient name" required />
          <input name="phone" className="market-input rounded-2xl px-4 py-3" placeholder="Phone number" required />
          <input name="city" className="market-input rounded-2xl px-4 py-3" placeholder="City" required />
          <input name="region" className="market-input rounded-2xl px-4 py-3" placeholder="Region / State" required />
          <input name="country" className="market-input rounded-2xl px-4 py-3" placeholder="Country" defaultValue="Nigeria" required />
          <input name="line1" className="market-input rounded-2xl px-4 py-3 md:col-span-2" placeholder="Address line 1" required />
          <input name="line2" className="market-input rounded-2xl px-4 py-3 md:col-span-2" placeholder="Address line 2 (optional)" />
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-[1.25rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-3 text-sm text-[var(--market-ink)]">
          <input type="checkbox" name="is_default" />
          Set as default address
        </label>
        <button className="market-button-primary mt-4 rounded-full px-5 py-3 text-sm font-semibold">Save address</button>
      </form>

      {data.addresses.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.addresses.map((address: MarketplaceAddress) => (
            <article key={address.id} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{address.label}</p>
              <h2 className="mt-3 text-xl font-semibold text-[var(--market-ink)]">{address.recipient}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.region}, {address.country}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No saved addresses." body="Checkout-created addresses will appear here." />
      )}
    </WorkspaceShell>
  );
}
