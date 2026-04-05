import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { getLogisticsSettings, getLogisticsSnapshot } from "@/lib/logistics/data";
function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

function createId() {
  return crypto.randomUUID();
}

function hoursBetween(isoA: string, isoB: string) {
  const a = new Date(isoA).getTime();
  const b = new Date(isoB).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.abs(b - a) / 3_600_000;
}

/**
 * Idempotent ops pass: flags stale active shipments, opens support-style issues, logs internal events.
 * Does not spoof rider GPS or customer-visible delays without an explicit lifecycle already set.
 */
export async function runLogisticsAutomationCron() {
  const settings = await getLogisticsSettings();
  const staleHours = Math.max(4, Number(settings.staleShipmentHours) || 12);
  const snapshot = await getLogisticsSnapshot();
  const admin = createAdminSupabase();
  const now = new Date().toISOString();

  let staleFlagged = 0;
  let issuesOpened = 0;

  const activeStatuses = new Set([
    "booked",
    "assigned",
    "pickup_confirmed",
    "in_transit",
    "awaiting_payment",
    "quoted",
  ]);

  for (const shipment of snapshot.shipments) {
    if (!activeStatuses.has(shipment.lifecycleStatus)) continue;
    if (shipment.lifecycleStatus === "delayed") continue;

    const ref = shipment.updatedAt || shipment.createdAt;
    const idleHours = hoursBetween(ref, now);
    if (idleHours < staleHours) continue;

    const fingerprint = `stale_ops_${shipment.id}_${Math.floor(idleHours / staleHours)}`;
    const already = snapshot.events.some(
      (e) => e.shipmentId === shipment.id && cleanText(e.meta?.fingerprint) === fingerprint
    );
    if (already) continue;

    await admin.from("logistics_events").insert({
      id: createId(),
      shipment_id: shipment.id,
      event_type: "ops_stale_check",
      lifecycle_status: shipment.lifecycleStatus,
      title: "Operations stale check",
      description: `No shipment update for about ${Math.round(idleHours)} hours. Dispatch should verify rider status or customer contact.`,
      actor_user_id: null,
      actor_name: "HenryCo Logistics automation",
      actor_role: "system",
      meta: { fingerprint, idleHours: Math.round(idleHours), staleHours },
      customer_visible: false,
      created_at: now,
    } as never);

    staleFlagged += 1;

    const openIssue = snapshot.issues.some(
      (i) => i.shipmentId === shipment.id && i.status !== "resolved" && i.issueType === "stale_shipment"
    );
    if (!openIssue) {
      await admin.from("logistics_issues").insert({
        id: createId(),
        shipment_id: shipment.id,
        severity: idleHours >= staleHours * 2 ? "high" : "medium",
        status: "open",
        issue_type: "stale_shipment",
        summary: "Shipment idle beyond stale threshold",
        details: `Automated detection: approximately ${Math.round(idleHours)}h since last update.`,
        opened_by_user_id: null,
        owner_user_id: null,
        resolution: null,
        created_at: now,
        updated_at: now,
      } as never);
      issuesOpened += 1;
    }
  }

  return {
    ok: true,
    processedAt: now,
    staleFlagged,
    issuesOpened,
    shipmentSampleSize: snapshot.shipments.length,
  };
}
