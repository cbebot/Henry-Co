import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { logMarketplaceAction, sendMarketplaceEvent } from "@/lib/marketplace/notifications";

type AutomationSummary = {
  lowStockAlerts: number;
  staleOrders: number;
  paymentReminders: number;
  abandonedCarts: number;
  pendingApplications: number;
  pendingPayouts: number;
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
    blocked: false,
    errors: [],
  };

  try {
    const admin = createAdminSupabase();
    const [productsRes, ordersRes, cartsRes, applicationsRes, payoutsRes, cartItemsRes] =
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
      ]);

    if (
      productsRes.error ||
      ordersRes.error ||
      cartsRes.error ||
      applicationsRes.error ||
      payoutsRes.error ||
      cartItemsRes.error
    ) {
      throw new Error(
        [
          productsRes.error?.message,
          ordersRes.error?.message,
          cartsRes.error?.message,
          applicationsRes.error?.message,
          payoutsRes.error?.message,
          cartItemsRes.error?.message,
        ]
          .filter(Boolean)
          .join(" | ")
      );
    }

    const cartIdsWithItems = new Set(
      (cartItemsRes.data ?? []).map((row: Record<string, unknown>) => String(row.cart_id || ""))
    );

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
  } catch (error) {
    summary.blocked = true;
    summary.errors.push(error instanceof Error ? error.message : "Marketplace automation sweep failed.");
  }

  return summary;
}
