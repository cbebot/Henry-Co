import { MapPin } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getAddresses } from "@/lib/account-data";
import PageHeader from "@/components/layout/PageHeader";
import AddAddressForm from "@/components/addresses/AddAddressForm";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await requireAccountUser();
  const addresses = await getAddresses(user.id);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Addresses"
        description="Manage your saved delivery and billing addresses."
        icon={MapPin}
      />

      {addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map((addr: Record<string, string | boolean>) => (
            <div key={addr.id as string} className="acct-card flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--acct-gold-soft)]">
                <MapPin size={18} className="text-[var(--acct-gold)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">{addr.label}</p>
                  {addr.is_default && (
                    <span className="acct-chip acct-chip-green text-[0.6rem]">Default</span>
                  )}
                </div>
                {addr.full_name && (
                  <p className="text-sm text-[var(--acct-muted)]">{addr.full_name}</p>
                )}
                <p className="text-sm text-[var(--acct-muted)]">
                  {addr.address_line1}
                  {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                </p>
                <p className="text-sm text-[var(--acct-muted)]">
                  {addr.city}, {addr.state} {addr.postal_code}
                </p>
                {addr.phone && (
                  <p className="text-xs text-[var(--acct-muted)]">{addr.phone}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">
          {addresses.length === 0 ? "Add your first address" : "Add new address"}
        </p>
        <AddAddressForm />
      </section>
    </div>
  );
}
