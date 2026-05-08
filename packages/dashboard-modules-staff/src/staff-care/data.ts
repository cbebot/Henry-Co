import "server-only";

import { deriveSLABucket } from "../shared";

/**
 * staff-care — server-side data fetcher.
 *
 * Reads care_bookings (live production table). Maps each row into a
 * Track C queue row with SLA bucket derived from payment_due_at vs.
 * pickup_date.
 */

export type CareBookingRow = {
  id: string;
  trackingCode: string;
  customerName: string;
  pickupAddress: string;
  pickupDate: string;
  pickupSlot: string;
  status: string;
  paymentStatus: string;
  serviceType: string;
  quotedTotal: number;
  paymentDueAt: string | null;
  createdAt: string;
};

export type CareQueueSnapshot = {
  rows: ReadonlyArray<CareBookingRow>;
  totalCount: number;
  pendingCount: number;
  slaWarningCount: number;
  slaBreachCount: number;
};

export type CareSupabaseClient = {
  from: (table: string) => {
    select: (cols: string, opts?: { count?: "exact"; head?: boolean }) => {
      eq?: (col: string, value: unknown) => unknown;
      order: (col: string, opts?: { ascending?: boolean }) => {
        limit: (n: number) => Promise<{
          data: Array<Record<string, unknown>> | null;
          error: { message: string } | null;
          count?: number | null;
        }>;
      };
    };
  };
};

export async function loadCareQueueSnapshot(
  supabase: CareSupabaseClient,
  options?: { limit?: number },
): Promise<CareQueueSnapshot> {
  const limit = options?.limit ?? 100;
  let rows: CareBookingRow[] = [];
  try {
    const { data } = await supabase
      .from("care_bookings")
      .select(
        "id,tracking_code,customer_name,pickup_address,pickup_date,pickup_slot,status,payment_status,service_type,quoted_total,payment_due_at,created_at",
      )
      .order("pickup_date", { ascending: true })
      .limit(limit);
    if (data) {
      rows = data.map((r) => ({
        id: String(r.id ?? ""),
        trackingCode: String(r.tracking_code ?? ""),
        customerName: String(r.customer_name ?? ""),
        pickupAddress: String(r.pickup_address ?? ""),
        pickupDate: String(r.pickup_date ?? ""),
        pickupSlot: String(r.pickup_slot ?? ""),
        status: String(r.status ?? "—"),
        paymentStatus: String(r.payment_status ?? "—"),
        serviceType: String(r.service_type ?? ""),
        quotedTotal: Number(r.quoted_total ?? 0),
        paymentDueAt: r.payment_due_at ? String(r.payment_due_at) : null,
        createdAt: String(r.created_at ?? ""),
      }));
    }
  } catch {
    // Empty result; UI surfaces an empty state.
  }

  let pendingCount = 0;
  let slaWarningCount = 0;
  let slaBreachCount = 0;
  for (const r of rows) {
    if (r.status !== "completed" && r.status !== "cancelled") {
      pendingCount++;
      const bucket = deriveSLABucket(r.paymentDueAt, {
        donePredicate: r.paymentStatus === "paid" || r.paymentStatus === "settled",
      });
      if (bucket === "warning") slaWarningCount++;
      if (bucket === "breach") slaBreachCount++;
    }
  }

  return {
    rows,
    totalCount: rows.length,
    pendingCount,
    slaWarningCount,
    slaBreachCount,
  };
}
