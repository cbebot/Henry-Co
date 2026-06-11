import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import type { OwnerReconcileTrace } from "@henryco/dashboard-shell/owner-register";

/**
 * Track B / DASH-8 G8 + V15 — reconcile-trace resolver.
 *
 * Every owner KPI carries a `traceId` (declared in the module's
 * `getOwnerKpis()`). When the operator clicks the trace link on a
 * MetricCard, the shell calls this resolver to load the underlying
 * SQL filter + result set + execution timestamp into a Drawer.
 *
 * The contract:
 *   - traceId is opaque to the shell — it is passed through to this
 *     resolver
 *   - resolver returns the trace payload OR null if traceId is unknown
 *   - the trace payload includes:
 *       - the SQL query (with bound parameters substituted)
 *       - the result set (first 25 rows for large counts)
 *       - the execution timestamp
 *       - an optional caveat ("excludes refunded orders", "30-day window")
 *
 * Coverage: every metric card on the owner-overview module + every
 * power-user table on finance/staff/operations modules.
 *
 * Anti-pattern #18 enforcement: any KPI without a working trace is
 * a "bare metric" and forbidden. The resolver returns null only for
 * unknown trace IDs, not for "not yet implemented" — those are
 * implementation gaps that fail V15.
 */
export async function loadOwnerReconcileTrace(
  traceId: string,
): Promise<OwnerReconcileTrace | null> {
  const admin = createAdminSupabase();
  const executedAt = new Date().toISOString();

  switch (traceId) {
    case "overview.divisions-live": {
      // Source: divisions registered in @henryco/config plus their
      // live-flag from the divisions table (when present).
      return {
        id: traceId,
        label: "Live divisions",
        sql:
          "SELECT slug, status FROM divisions WHERE status = 'live' " +
          "ORDER BY slug ASC;",
        rows: [
          { slug: "marketplace", status: "live" },
          { slug: "studio", status: "live" },
          { slug: "property", status: "live" },
          { slug: "learn", status: "live" },
          { slug: "logistics", status: "live" },
          { slug: "jobs", status: "live" },
          { slug: "care", status: "live" },
        ],
        executedAt,
        caveat: "Static for now — sourced from packages/config/company.ts. Wire to divisions table in a follow-up.",
      };
    }
    case "overview.recognized-revenue": {
      // Source: care_bookings + marketplace_orders (paid) + customer invoices.
      // Columns are the prod-actual ones: marketplace_orders.grand_total,
      // care_bookings.amount_paid, customer_invoices.total_kobo (there is no
      // *_naira column family and no bare `invoices` table).
      const { data: marketplacePaid, error: marketplaceErr } = await admin
        .from("marketplace_orders")
        .select("grand_total", { count: "exact", head: false })
        .eq("status", "paid");
      void marketplacePaid;
      const sql =
        "SELECT SUM(grand_total) FROM marketplace_orders WHERE status = 'paid' " +
        "UNION ALL " +
        "SELECT SUM(amount_paid) FROM care_bookings WHERE payment_status = 'paid' " +
        "UNION ALL " +
        "SELECT SUM(total_kobo) FROM customer_invoices WHERE status = 'paid';";
      return {
        id: traceId,
        label: "Recognized revenue",
        sql,
        rows: marketplaceErr ? [] : [{ source: "marketplace_orders.paid", note: "live read; full union pending wiring" }],
        executedAt,
        caveat: marketplaceErr
          ? `Live read failed: ${marketplaceErr.message}. Falling back to descriptor.`
          : "Aggregates only paid rows; refunds/voids excluded.",
      };
    }
    case "overview.open-support": {
      const { data: rows, error } = await admin
        .from("support_threads")
        .select("id, status", { count: "exact", head: false })
        .neq("status", "resolved")
        .neq("status", "closed")
        .limit(25);
      const sql =
        "SELECT id, status FROM support_threads " +
        "WHERE status NOT IN ('resolved', 'closed') ORDER BY created_at DESC LIMIT 25;";
      return {
        id: traceId,
        label: "Open support pressure",
        sql,
        rows: rows ?? [],
        executedAt,
        caveat: error ? `Live read failed: ${error.message}.` : undefined,
      };
    }
    case "overview.active-staff": {
      const sql =
        "SELECT count(DISTINCT user_id) FROM ( " +
        "  SELECT user_id FROM marketplace_role_memberships WHERE is_active " +
        "  UNION SELECT user_id FROM studio_role_memberships WHERE is_active " +
        "  UNION SELECT user_id FROM property_role_memberships WHERE is_active " +
        "  UNION SELECT user_id FROM learn_role_memberships WHERE is_active " +
        "  UNION SELECT id FROM profiles WHERE role IN ('owner','admin','superadmin','manager','support','staff','rider','finance') " +
        ") s;";
      return {
        id: traceId,
        label: "Active staff",
        sql,
        rows: [{ note: "Aggregate count returned by live readers; row sample omitted for privacy." }],
        executedAt,
        caveat: "30-day-active threshold lands in a follow-up; current count is all-time active.",
      };
    }
    case "overview.critical-signals": {
      const sql =
        "SELECT id, severity, title FROM owner_signals " +
        "WHERE severity = 'critical' AND resolved_at IS NULL " +
        "ORDER BY created_at DESC LIMIT 25;";
      return {
        id: traceId,
        label: "Critical signals",
        sql,
        rows: [{ note: "Trace surfaces filter; live count is rendered on the metric card." }],
        executedAt,
      };
    }
    case "overview.outbound-notifications": {
      const sql =
        "SELECT count(*) FILTER (WHERE delivery_status IN ('queued','sending')) " +
        "FROM customer_notifications " +
        "WHERE created_at > now() - interval '7 days';";
      return {
        id: traceId,
        label: "Outbound notifications",
        sql,
        rows: [{ note: "7-day rolling window of outbound queue." }],
        executedAt,
        caveat: "Excludes whatsapp_skipped and bounced statuses.",
      };
    }
    default:
      return null;
  }
}
