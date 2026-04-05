import "server-only";

import { deriveSellerTrustProfile, shouldAutoReleasePayout } from "@/lib/marketplace/governance";
import { createAdminSupabase } from "@/lib/supabase";
import {
  logMarketplaceAction,
  retryMarketplaceQueuedNotifications,
  sendMarketplaceEvent,
} from "@/lib/marketplace/notifications";

type AutomationSummary = {
  lowStockAlerts: number;
  staleOrders: number;
  paymentReminders: number;
  abandonedCarts: number;
  pendingApplications: number;
  pendingPayouts: number;
  autoReleasedPayouts: number;
  notificationRetries: number;
  notificationRetryFailures: number;
  notificationRetrySkips: number;
  blocked: boolean;
  errors: string[];
};

function hoursBetween(now: Date, value?: string | null) {
  if (!value) return 0;
  const then = new Date(value);
  return (now.getTime() - then.getTime()) / (1000 * 60 * 60);
}

export async function runMarketplaceAutomationSweep(now = new Date()): Promise<AutomationSummary> {
  const summary: AutomationSummary = {
    lowStockAlerts: 0,
    staleOrders: 0,
    paymentReminders: 0,
    abandonedCarts: 0,
    pendingApplications: 0,
    pendingPayouts: 0,
    autoReleasedPayouts: 0,
    notificationRetries: 0,
    notificationRetryFailures: 0,
    notificationRetrySkips: 0,
    blocked: false,
    errors: [],
  };

  let automationRunId: string | null = null;

  try {
    const admin = createAdminSupabase();
    const { data: automationRun } = await admin
      .from("marketplace_automation_runs")
      .insert({
        automation_key: "marketplace-automation-sweep",
        status: "started",
        summary: {
          startedAt: now.toISOString(),
        },
      } as never)
      .select("id")
      .maybeSingle();

    automationRunId = automationRun?.id ? String(automationRun.id) : null;

    const retrySummary = await retryMarketplaceQueuedNotifications(25);
    summary.notificationRetries = retrySummary.recovered;
    summary.notificationRetryFailures = retrySummary.failed;
    summary.notificationRetrySkips = retrySummary.skipped;
    if (retrySummary.issue) {
      summary.errors.push(retrySummary.issue);
    }

    const [productsRes, ordersRes, cartsRes, applicationsRes, payoutsRes, cartItemsRes, autoReleaseGroupsRes, vendorsRes] =
      await Promise.all([
        admin
          .from("marketplace_products")
          .select("id, slug, title, total_stock, approval_status")
          .lte("total_stock", 5),
        admin
          .from("marketplace_orders")
          .select("id, order_no, user_id, normalized_email, buyer_email, buyer_phone, status, payment_status, placed_at, updated_at")
          .order("placed_at", { ascending: false })
          .limit(50),
        admin
          .from("marketplace_carts")
          .select("id, user_id, normalized_email, updated_at, status")
          .eq("status", "active")
          .order("updated_at", { ascending: true })
          .limit(50),
        admin
          .from("marketplace_vendor_applications")
          .select("id, store_name, submitted_at, status")
          .in("status", ["submitted", "under_review", "changes_requested"])
          .order("submitted_at", { ascending: true })
          .limit(30),
        admin
          .from("marketplace_payout_requests")
          .select("id, reference, created_at, status")
          .eq("status", "requested")
          .order("created_at", { ascending: true })
          .limit(30),
        admin.from("marketplace_cart_items").select("cart_id").limit(500),
        admin
          .from("marketplace_order_groups")
          .select("id, order_no, vendor_id, payout_status, delivered_at")
          .eq("payout_status", "awaiting_auto_release")
          .not("delivered_at", "is", null)
          .limit(100),
        admin.from("marketplace_vendors").select("id, verification_level, trust_score, dispute_rate, fulfillment_rate, owner_type"),
      ]);

    if (
      productsRes.error ||
      ordersRes.error ||
      cartsRes.error ||
      applicationsRes.error ||
      payoutsRes.error ||
      cartItemsRes.error ||
      autoReleaseGroupsRes.error ||
      vendorsRes.error
    ) {
      throw new Error(
        [
          productsRes.error?.message,
          ordersRes.error?.message,
          cartsRes.error?.message,
          applicationsRes.error?.message,
          payoutsRes.error?.message,
          cartItemsRes.error?.message,
          autoReleaseGroupsRes.error?.message,
          vendorsRes.error?.message,
        ]
          .filter(Boolean)
          .join(" | ")
      );
    }

    const cartIdsWithItems = new Set(
      (cartItemsRes.data ?? []).map((row: Record<string, unknown>) => String(row.cart_id || ""))
    );
    const vendorById = new Map(
      (vendorsRes.data ?? []).map((row: Record<string, unknown>) => [String(row.id), row])
    );

    for (const row of autoReleaseGroupsRes.data ?? []) {
      const vendor = vendorById.get(String(row.vendor_id || ""));
      const sellerProfile = deriveSellerTrustProfile({
        vendor: vendor
          ? {
              verificationLevel: String(vendor.verification_level || "bronze") as "bronze" | "silver" | "gold" | "henryco",
              trustScore: Number(vendor.trust_score || 0),
              disputeRate: Number(vendor.dispute_rate || 0),
              fulfillmentRate: Number(vendor.fulfillment_rate || 0),
              ownerType: String(vendor.owner_type || "vendor") as "company" | "vendor",
            }
          : null,
      });

      if (
        !shouldAutoReleasePayout({
          deliveredAt: String(row.delivered_at || ""),
          profile: sellerProfile,
        })
      ) {
        continue;
      }

      await admin
        .from("marketplace_order_groups")
        .update({ payout_status: "payout_releasable" } as never)
        .eq("id", row.id);
      await admin
        .from("marketplace_orders")
        .update({ status: "payout_releasable" } as never)
        .eq("order_no", row.order_no)
        .neq("status", "disputed");

      summary.autoReleasedPayouts += 1;
      await sendMarketplaceEvent({
        event: "owner_alert",
        recipientEmail: process.env.RESEND_SUPPORT_INBOX || "marketplace@henrycogroup.com",
        actorEmail: "automation@henrycogroup.com",
        entityType: "order_group",
        entityId: String(row.id),
        payload: {
          note: `Order ${String(row.order_no || "")} is now payout-releasable after the seller reserve window elapsed.`,
        },
      });
    }

    for (const row of productsRes.data ?? []) {
      await sendMarketplaceEvent({
        event: "low_stock",
        recipientEmail: process.env.RESEND_SUPPORT_INBOX || "marketplace@henrycogroup.com",
        actorEmail: "automation@henrycogroup.com",
        entityType: "product",
        entityId: String(row.id),
        payload: {
          productTitle: String(row.title || row.slug || "Marketplace product"),
          note: `${String(row.title || "Product")} is down to ${Number(row.total_stock || 0)} units.`,
        },
      });
      summary.lowStockAlerts += 1;
    }

    for (const row of ordersRes.data ?? []) {
      const ageHours = hoursBetween(now, String(row.updated_at || row.placed_at || ""));
      const status = String(row.status || "");
      const paymentStatus = String(row.payment_status || "");

      if (paymentStatus === "pending" && ageHours >= 12) {
        await sendMarketplaceEvent({
          event: "payment_reminder",
          userId: row.user_id ? String(row.user_id) : null,
          normalizedEmail: row.normalized_email ? String(row.normalized_email) : null,
          recipientEmail: row.buyer_email ? String(row.buyer_email) : null,
          recipientPhone: row.buyer_phone ? String(row.buyer_phone) : null,
          actorEmail: "automation@henrycogroup.com",
          entityType: "order",
          entityId: String(row.id),
          payload: {
            orderNo: String(row.order_no || ""),
            statusLabel: "awaiting payment verification",
          },
        });
        summary.paymentReminders += 1;
      }

      if (["placed", "awaiting_payment", "processing"].includes(status) && ageHours >= 24) {
        await sendMarketplaceEvent({
          event: "stale_order",
          recipientEmail: process.env.RESEND_SUPPORT_INBOX || "marketplace@henrycogroup.com",
          actorEmail: "automation@henrycogroup.com",
          entityType: "order",
          entityId: String(row.id),
          payload: {
            orderNo: String(row.order_no || ""),
            note: `${String(row.order_no || "Order")} has been ${status} for ${Math.floor(ageHours)} hours.`,
          },
        });
        summary.staleOrders += 1;
      }
    }

    for (const row of cartsRes.data ?? []) {
      if (!cartIdsWithItems.has(String(row.id || ""))) continue;
      if (!row.normalized_email) continue;
      const ageHours = hoursBetween(now, String(row.updated_at || ""));
      if (ageHours < 18) continue;

      await sendMarketplaceEvent({
        event: "abandoned_cart",
        userId: row.user_id ? String(row.user_id) : null,
        normalizedEmail: String(row.normalized_email || ""),
        recipientEmail: String(row.normalized_email || ""),
        actorEmail: "automation@henrycogroup.com",
        entityType: "cart",
        entityId: String(row.id),
        payload: {
          note: `Your cart has been waiting for ${Math.floor(ageHours)} hours and is still available.`,
        },
      });
      summary.abandonedCarts += 1;
    }

    for (const row of applicationsRes.data ?? []) {
      const ageHours = hoursBetween(now, String(row.submitted_at || ""));
      if (ageHours < 24) continue;

      await sendMarketplaceEvent({
        event: "owner_alert",
        recipientEmail: process.env.RESEND_SUPPORT_INBOX || "marketplace@henrycogroup.com",
        actorEmail: "automation@henrycogroup.com",
        entityType: "vendor_application",
        entityId: String(row.id),
        payload: {
          note: `Vendor application ${String(row.store_name || row.id)} has been waiting ${Math.floor(ageHours)} hours.`,
        },
      });
      summary.pendingApplications += 1;
    }

    for (const row of payoutsRes.data ?? []) {
      const ageHours = hoursBetween(now, String(row.created_at || ""));
      if (ageHours < 24) continue;

      await sendMarketplaceEvent({
        event: "owner_alert",
        recipientEmail: process.env.RESEND_SUPPORT_INBOX || "marketplace@henrycogroup.com",
        actorEmail: "automation@henrycogroup.com",
        entityType: "payout_request",
        entityId: String(row.id),
        payload: {
          note: `Payout ${String(row.reference || row.id)} has been waiting ${Math.floor(ageHours)} hours.`,
        },
      });
      summary.pendingPayouts += 1;
    }

    await logMarketplaceAction({
      eventType: "marketplace_automation_sweep_completed",
      actorEmail: "automation@henrycogroup.com",
      details: summary,
    });

    if (automationRunId) {
      await admin
        .from("marketplace_automation_runs")
        .update({
          status: "completed",
          summary,
          completed_at: new Date().toISOString(),
        } as never)
        .eq("id", automationRunId);
    }
  } catch (error) {
    summary.blocked = true;
    summary.errors.push(error instanceof Error ? error.message : "Marketplace automation sweep failed.");

    if (automationRunId) {
      try {
        const admin = createAdminSupabase();
        await admin
          .from("marketplace_automation_runs")
          .update({
            status: "failed",
            summary,
            completed_at: new Date().toISOString(),
          } as never)
          .eq("id", automationRunId);
      } catch {
        // ignore automation run update failure
      }
    }
  }

  return summary;
}
