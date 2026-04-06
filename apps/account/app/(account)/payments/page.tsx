import Link from "next/link";
import { CreditCard, Plus } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getPaymentMethods } from "@/lib/account-data";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

type PaymentMethodRow = {
  id: string;
  label: string | null;
  type: string | null;
  last_four: string | null;
  bank_name: string | null;
  is_default: boolean | null;
};

export default async function PaymentsPage() {
  const user = await requireAccountUser();
  const methods = (await getPaymentMethods(user.id)) as PaymentMethodRow[];

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Payment Methods"
        description="Manage your saved payment options for quick checkout."
        icon={CreditCard}
        actions={
          <button className="acct-button-primary rounded-xl">
            <Plus size={16} /> Add method
          </button>
        }
      />

      {methods.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment methods"
          description="Add a debit card, bank account, or other payment method for quick checkout across all HenryCo services."
          action={
            <button className="acct-button-primary rounded-xl">
              <Plus size={16} /> Add payment method
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div key={m.id as string} className="acct-card flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--acct-gold-soft)]">
                <CreditCard size={20} className="text-[var(--acct-gold)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{m.label || "Saved method"}</p>
                <p className="text-xs text-[var(--acct-muted)]">
                  {m.type === "card" ? `•••• ${m.last_four}` : m.bank_name || m.type}
                  {m.is_default && (
                    <span className="ml-2 acct-chip acct-chip-green text-[0.6rem]">Default</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wallet info */}
      <div className="acct-card p-5">
        <p className="acct-kicker mb-2">HenryCo Wallet</p>
        <p className="text-sm text-[var(--acct-muted)]">
          Your HenryCo Wallet is always available as a payment option.
          <Link href="/wallet" className="ml-1 font-medium text-[var(--acct-gold)] hover:underline">
            Manage wallet
          </Link>
        </p>
      </div>
    </div>
  );
}
