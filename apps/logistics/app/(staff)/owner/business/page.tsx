import { Panel, EmptyState } from "@henryco/dashboard-shell/components";
import { createAdminSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type B2BAccountRow = {
  id: string;
  name: string;
  legal_name: string | null;
  status: string;
  billing_terms: string;
  monthly_volume_target: number;
};

async function getB2BAccounts() {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("logistics_b2b_accounts")
      .select("id, name, legal_name, status, billing_terms, monthly_volume_target")
      .order("name");
    if (error) {
      console.error("[owner-business] fetch failed", error);
      return [] as B2BAccountRow[];
    }
    return (data ?? []) as B2BAccountRow[];
  } catch (err) {
    console.error("[owner-business] fetch threw", err);
    return [] as B2BAccountRow[];
  }
}

export default async function OwnerBusinessPage() {
  const accounts = await getB2BAccounts();

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          Business
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          B2B accounts
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          Volume customers with negotiated SLA + billing terms. Bulk shipment
          composer lives inside the customer-side B2B admin.
        </p>
      </header>

      <Panel tone="flat">
        {accounts.length === 0 ? (
          <EmptyState
            kicker="No accounts"
            headline="No B2B accounts yet"
            body="As you onboard volume customers, this roster surfaces each account with billing terms and monthly volume target."
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="flex items-center justify-between py-4 text-sm"
              >
                <div>
                  <p className="font-semibold tracking-tight text-white">
                    {account.name}
                  </p>
                  <p className="text-xs text-[var(--logistics-muted)]">
                    {account.legal_name ?? account.name} · status{" "}
                    {account.status}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    Billing
                  </p>
                  <p className="mt-1 font-semibold tracking-tight text-white">
                    {account.billing_terms.replaceAll("_", " ")}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--logistics-muted)]">
                    Target {account.monthly_volume_target}/mo
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
