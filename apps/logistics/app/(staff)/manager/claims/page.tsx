import { Panel, EmptyState } from "@henryco/dashboard-shell/components";
import { createAdminSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type ClaimRow = {
  id: string;
  shipment_id: string;
  reason: string;
  status: string;
  requested_amount_minor: number;
  currency: string;
  created_at: string;
};

async function getOpenClaims() {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("logistics_claims")
      .select(
        "id, shipment_id, reason, status, requested_amount_minor, currency, created_at",
      )
      .neq("status", "resolved")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("[manager-claims] fetch failed", error);
      return [] as ClaimRow[];
    }
    return (data ?? []) as ClaimRow[];
  } catch (err) {
    console.error("[manager-claims] fetch threw", err);
    return [] as ClaimRow[];
  }
}

export default async function ManagerClaimsPage() {
  const claims = await getOpenClaims();

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          Claims
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Open shipment claims
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          Customer-filed claims for damaged or lost shipments. Investigate,
          then route to wallet adjustment via the owner workspace.
        </p>
      </header>

      <Panel tone="flat">
        {claims.length === 0 ? (
          <EmptyState
            kicker="All clear"
            headline="No open claims"
            body="When a customer files a claim it appears here with their evidence and the shipment context."
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {claims.map((claim) => (
              <li key={claim.id} className="py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">
                      {claim.status}
                    </p>
                    <p className="mt-1 font-semibold tracking-tight text-white">
                      {claim.reason}
                    </p>
                    <p className="mt-1 text-xs text-[var(--logistics-muted)]">
                      Shipment {claim.shipment_id.slice(0, 8)} · opened{" "}
                      {new Date(claim.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                      Requested
                    </p>
                    <p className="mt-1 font-semibold tracking-tight text-white">
                      {claim.requested_amount_minor / 100} {claim.currency}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
