import "server-only";

import { getDivisionConfig } from "@henryco/config";
import { sendTransactionalEmail } from "@henryco/email";
import { normalizeEmail } from "@/lib/env";
import { renderMarketplaceEmailTemplate, type MarketplaceTemplateInput, type MarketplaceTemplateKey } from "@/lib/email/marketplace-templates";
import { syncMarketplaceAccountProjection } from "@/lib/marketplace/projections";
import { createAdminSupabase } from "@/lib/supabase";

type QueueStatus = "queued" | "sent" | "skipped" | "failed";
type DeliveryResult = {
  ok: boolean;
  status: QueueStatus;
  reason: string | null;
  messageId: string | null;
  provider?: string | null;
};

type MarketplaceEventInput = {
  event: MarketplaceTemplateKey;
  userId?: string | null;
  normalizedEmail?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload: Record<string, unknown>;
};

type EventCopy = {
  inAppTitle: string;
  inAppBody: string;
  email?: MarketplaceTemplateInput | null;
  whatsappText?: string | null;
  whatsappTemplateEnv?: string | null;
  whatsappTemplateValues?: string[];
};

const marketplace = getDivisionConfig("marketplace");
const marketplaceBaseUrl =
  process.env.NODE_ENV === "production"
    ? "https://marketplace.henrycogroup.com"
    : "http://localhost:3000";

function getMarketplaceSenderAddress() {
  const fallback = "onboarding@resend.dev";
  const candidate = cleanText(process.env.RESEND_FROM_EMAIL || process.env.RESEND_SUPPORT_INBOX || marketplace.supportEmail)
    .replace(/[\r\n]+/g, "")
    .trim();

  if (!candidate || !candidate.includes("@")) {
    return fallback;
  }

  return candidate;
}

const marketingEvents = new Set<MarketplaceTemplateKey>([
  "cart_saved",
  "abandoned_cart",
  "featured_campaign_alert",
  "review_request",
]);

const cooldownByEvent: Partial<Record<MarketplaceTemplateKey, number>> = {
  buyer_welcome: 168,
  cart_saved: 8,
  abandoned_cart: 18,
  checkout_started: 8,
  payment_reminder: 12,
  payment_verified: 2,
  order_shipped: 2,
  order_delivered: 4,
  order_delayed: 6,
  dispute_updated: 4,
  low_stock: 8,
  stale_order: 8,
  payout_requested: 6,
  owner_alert: 2,
  review_request: 72,
  featured_campaign_alert: 24,
  support_escalation: 2,
  security_notice: 12,
};

function ownerAlertEmail() {
  return (
    cleanText(process.env.MARKETPLACE_OWNER_ALERT_EMAIL) ||
    cleanText(process.env.RESEND_SUPPORT_INBOX) ||
    marketplace.supportEmail
  );
}

function isMarketingEvent(event: MarketplaceTemplateKey) {
  return marketingEvents.has(event);
}

function getEventCooldownHours(event: MarketplaceTemplateKey) {
  return cooldownByEvent[event] ?? 0;
}

function buildEventDedupeKey(input: MarketplaceEventInput) {
  const audience =
    normalizeEmail(input.recipientEmail) ||
    normalizeEmail(input.normalizedEmail) ||
    cleanText(input.recipientPhone) ||
    cleanText(input.userId) ||
    "marketplace";
  const entity = `${cleanText(input.entityType) || "general"}:${cleanText(input.entityId) || "none"}`;
  return `${input.event}:${audience}:${entity}`;
}

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function normalizePhone(value?: string | null) {
  const raw = cleanText(value);
  if (!raw) return null;

  if (raw.startsWith("+")) {
    const digits = raw.replace(/[^\d+]/g, "");
    return digits.length > 8 ? digits : null;
  }

  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;
  if (digits.startsWith("234") && digits.length >= 13) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.length >= 10) return `+${digits}`;
  return null;
}

async function getCommPreference(userId?: string | null, normalizedEmailValue?: string | null) {
  if (!userId && !normalizedEmailValue) {
    return null;
  }

  try {
    const admin = createAdminSupabase();
    const query = userId
      ? admin
          .from("marketplace_user_comm_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
      : admin
          .from("marketplace_user_comm_preferences")
          .select("*")
          .eq("normalized_email", normalizedEmailValue)
          .maybeSingle();

    const { data } = await query;
    return data as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

async function hasRecentEvent(dedupeKey: string, cooldownHours: number) {
  if (!dedupeKey || cooldownHours <= 0) {
    return false;
  }

  try {
    const admin = createAdminSupabase();
    const since = new Date(Date.now() - cooldownHours * 60 * 60 * 1000).toISOString();
    const { data } = await admin
      .from("marketplace_events")
      .select("id")
      .eq("dedupe_key", dedupeKey)
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();

    return Boolean(data?.id);
  } catch {
    return false;
  }
}

async function createMarketplaceEventRecord(input: MarketplaceEventInput, dedupeKey: string) {
  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("marketplace_events")
      .insert({
        event_type: input.event,
        dedupe_key: dedupeKey,
        user_id: input.userId ?? null,
        normalized_email: input.normalizedEmail ?? null,
        actor_user_id: input.actorUserId ?? null,
        actor_email: normalizeEmail(input.actorEmail) ?? null,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        payload: input.payload,
      } as never)
      .select("id")
      .maybeSingle();

    return data?.id ? String(data.id) : null;
  } catch {
    return null;
  }
}

function hasTwilioConfig() {
  return Boolean(
    cleanText(process.env.TWILIO_ACCOUNT_SID) &&
      cleanText(process.env.TWILIO_AUTH_TOKEN) &&
      cleanText(process.env.TWILIO_WHATSAPP_FROM)
  );
}

function hasMetaConfig() {
  return Boolean(
    cleanText(process.env.WHATSAPP_PHONE_NUMBER_ID) &&
      cleanText(process.env.WHATSAPP_ACCESS_TOKEN) &&
      cleanText(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID)
  );
}

function buildEventCopy(event: MarketplaceTemplateKey, payload: Record<string, unknown>): EventCopy {
  const orderNo = String(payload.orderNo || payload.order_no || "");
  const productTitle = String(payload.productTitle || payload.product_title || "your product");
  const storeName = String(payload.storeName || payload.store_name || "your store");
  const disputeNo = String(payload.disputeNo || payload.dispute_no || "");
  const payoutReference = String(payload.payoutReference || payload.reference || "");
  const note = String(payload.note || payload.reviewNote || payload.review_note || "");
  const statusLabel = String(payload.statusLabel || payload.status_label || "");

  switch (event) {
    case "buyer_welcome":
      return {
        inAppTitle: "Welcome to HenryCo Marketplace",
        inAppBody: "Your account is ready for premium browsing, tracked orders, and trusted seller discovery.",
        email: {
          templateKey: event,
          eyebrow: "Buyer onboarding",
          headline: "Your marketplace account is ready.",
          summary:
            "You can now save products, follow verified stores, track split orders, manage disputes, and move into seller onboarding later from the same HenryCo identity.",
          bullets: [
            "Track orders and payments from one account",
            "Follow stores and save products for later",
            "See clearer trust signals before checkout",
          ],
          ctaLabel: "Open your account",
          ctaHref: `${marketplaceBaseUrl}/account`,
        },
        whatsappText: "HenryCo Marketplace: your account is ready. Browse premium products, track orders, and follow verified stores from one place.",
        whatsappTemplateEnv: "WHATSAPP_TEMPLATE_ORDER_CONFIRMATION",
        whatsappTemplateValues: ["HenryCo Marketplace", "Your account is ready"],
      };
    case "cart_saved":
      return {
        inAppTitle: "Cart saved",
        inAppBody: note || "Your shortlist is saved and ready when you want to continue.",
        email: {
          templateKey: event,
          eyebrow: "Cart saved",
          headline: "Your shortlist is still ready.",
          summary:
            note ||
            "We saved the products you were considering so you can return without rebuilding the basket or losing trust and delivery context.",
          bullets: [
            "Items remain tied to your HenryCo account",
            "Split-order and delivery notes stay visible at checkout",
          ],
          ctaLabel: "Return to cart",
          ctaHref: "/cart",
        },
      };
    case "checkout_started":
      return {
        inAppTitle: "Checkout started",
        inAppBody: orderNo
          ? `${orderNo} is waiting for completion.`
          : "You started checkout and can resume where you stopped.",
        email: {
          templateKey: event,
          eyebrow: "Checkout recovery",
          headline: "Your checkout is still open.",
          summary:
            note ||
            "Your delivery details and selected products are still waiting, so you can complete the order without starting over.",
          bullets: [
            "Payment instructions remain visible before confirmation",
            "Order tracking will attach to the same HenryCo identity",
          ],
          ctaLabel: "Resume checkout",
          ctaHref: "/checkout",
        },
      };
    case "payment_instructions":
      return {
        inAppTitle: "Payment instructions ready",
        inAppBody: `${orderNo} is waiting for transfer confirmation.`,
        email: {
          templateKey: event,
          eyebrow: "Payment instructions",
          headline: "Your payment instructions are ready.",
          summary:
            note ||
            "Use the referenced transfer details, then upload or send proof so finance can verify the payment and release the order to fulfillment.",
          bullets: [`Order: ${orderNo}`, "Manual verification keeps payment and dispute trails accountable."],
          ctaLabel: "Track this order",
          ctaHref: `/track/${orderNo}`,
        },
        whatsappText: `Payment instructions are ready for ${orderNo}. Submit transfer proof after payment so finance can verify it.`,
        whatsappTemplateEnv: "WHATSAPP_TEMPLATE_PAYMENT_REMINDER",
        whatsappTemplateValues: [orderNo, "payment instructions ready"],
      };
    case "order_confirmed":
      return {
        inAppTitle: "Order confirmed",
        inAppBody: `${orderNo} has moved into the confirmed order queue.`,
        email: {
          templateKey: event,
          eyebrow: "Order lifecycle",
          headline: "Your order is confirmed.",
          summary:
            note ||
            `${orderNo} has cleared the first operational checkpoint and is now in the confirmed processing queue.`,
          bullets: [`Order: ${orderNo}`, statusLabel ? `Status: ${statusLabel}` : "Status: confirmed"],
          ctaLabel: "Track order",
          ctaHref: `/track/${orderNo}`,
        },
        whatsappText: `HenryCo Marketplace confirmed ${orderNo}.`,
        whatsappTemplateEnv: "WHATSAPP_TEMPLATE_ORDER_CONFIRMATION",
        whatsappTemplateValues: [orderNo, "confirmed"],
      };
    case "order_packed":
      return {
        inAppTitle: "Order packed",
        inAppBody: `${orderNo} is packed and preparing for dispatch.`,
        email: {
          templateKey: event,
          eyebrow: "Fulfillment update",
          headline: "Your order has been packed.",
          summary: note || `${orderNo} is packed and moving toward shipment.`,
          bullets: [`Order: ${orderNo}`, statusLabel ? `Status: ${statusLabel}` : "Status: packed"],
          ctaLabel: "Track order",
          ctaHref: `/track/${orderNo}`,
        },
        whatsappText: `HenryCo Marketplace packed ${orderNo} and is preparing it for dispatch.`,
        whatsappTemplateEnv: "WHATSAPP_TEMPLATE_ORDER_SHIPPED",
        whatsappTemplateValues: [orderNo, "packed"],
      };
    case "vendor_application_submitted":
      return {
        inAppTitle: "Seller application submitted",
        inAppBody: `${storeName} is now in the review queue.`,
        email: {
          templateKey: event,
          eyebrow: "Seller onboarding",
          headline: "Your seller application is in review.",
          summary:
            "HenryCo Marketplace has received your store application and queued it for trust, category, and service-level review.",
          bullets: [
            `Store: ${storeName}`,
            "You will be notified after review or if more information is required.",
            "Publishing remains locked until approval is complete.",
          ],
          ctaLabel: "View application",
          ctaHref: "/account/seller-application",
        },
        whatsappText: `${storeName} has been submitted to HenryCo Marketplace for review. We will update you once trust and category checks are complete.`,
      };
    case "vendor_application_approved":
      return {
        inAppTitle: "Seller application approved",
        inAppBody: `${storeName} can now set up the storefront and submit products for review.`,
        email: {
          templateKey: event,
          eyebrow: "Seller onboarding",
          headline: "Your store has been approved.",
          summary:
            "You can now enter the vendor workspace, configure the storefront, and start submitting products for moderation.",
          bullets: [`Store: ${storeName}`, "Vendor dashboard access is now enabled.", "Publishing still requires product-level approval."],
          ctaLabel: "Open vendor workspace",
          ctaHref: "/vendor",
        },
        whatsappText: `${storeName} has been approved on HenryCo Marketplace. Your vendor workspace is ready.`,
      };
    case "vendor_application_rejected":
      return {
        inAppTitle: "Seller application update",
        inAppBody: note || "Your application needs changes before approval.",
        email: {
          templateKey: event,
          eyebrow: "Seller onboarding",
          headline: "Your seller application needs attention.",
          summary: note || "The marketplace review team could not approve the application in its current form.",
          bullets: ["Review the notes carefully", "Update your trust, KYC, or store information", "Resubmit once the gaps are resolved"],
          ctaLabel: "Review application notes",
          ctaHref: "/account/seller-application",
        },
        whatsappText: `HenryCo Marketplace updated your seller application. ${note || "Please review the notes and resubmit."}`,
      };
    case "vendor_application_changes_requested":
      return {
        inAppTitle: "Seller application changes requested",
        inAppBody: note || "Your application needs a few updates before approval.",
        email: {
          templateKey: event,
          eyebrow: "Seller onboarding",
          headline: "Your seller application needs changes.",
          summary:
            note ||
            "The review team has asked for updates before the store can move forward to approval.",
          bullets: [
            `Store: ${storeName}`,
            "Review the notes carefully",
            "Update documents, trust context, or store details before resubmitting",
          ],
          ctaLabel: "Continue application",
          ctaHref: "/account/seller-application/review",
        },
        whatsappText: `HenryCo Marketplace requested changes for ${storeName}. Review the notes in your account.`,
      };
    case "seller_onboarding_complete":
      return {
        inAppTitle: "Vendor onboarding complete",
        inAppBody: `${storeName} is now ready for product submissions and order operations.`,
        email: {
          templateKey: event,
          eyebrow: "Vendor onboarding",
          headline: "Your vendor onboarding is complete.",
          summary:
            note ||
            "Store setup, trust profile, and operational basics are complete. You can now submit products and begin managing marketplace operations.",
          bullets: [
            `Store: ${storeName}`,
            "Product submissions are now unlocked",
            "Orders, payouts, and analytics live inside the vendor workspace",
          ],
          ctaLabel: "Open vendor workspace",
          ctaHref: "/vendor",
        },
        whatsappText: `${storeName} completed vendor onboarding and is ready for product submissions.`,
      };
    case "product_submitted_for_review":
      return {
        inAppTitle: "Product submitted for review",
        inAppBody: `${productTitle} is now in the moderation queue.`,
        email: {
          templateKey: event,
          eyebrow: "Catalog moderation",
          headline: "Your product is in review.",
          summary:
            note ||
            `${productTitle} has entered moderation and will move to approval, changes requested, or rejection after review.`,
          bullets: [
            `Product: ${productTitle}`,
            "Moderation checks listing quality, trust, delivery, and category fit",
          ],
          ctaLabel: "Open product workspace",
          ctaHref: "/vendor/products",
        },
        whatsappText: `${productTitle} was submitted for review on HenryCo Marketplace.`,
      };
    case "product_approved":
    case "product_changes_requested":
    case "product_rejected":
      return {
        inAppTitle:
          event === "product_approved"
            ? "Product approved"
            : event === "product_changes_requested"
            ? "Product changes requested"
            : "Product rejected",
        inAppBody:
          event === "product_approved"
            ? `${productTitle} is now eligible for public discovery.`
            : note || `${productTitle} needs updates before it can go live.`,
        email: {
          templateKey: event,
          eyebrow: "Catalog moderation",
          headline:
            event === "product_approved"
              ? "Your product is approved."
              : event === "product_changes_requested"
              ? "Your product needs changes."
              : "Your product was rejected.",
          summary:
            event === "product_approved"
              ? `${productTitle} has passed moderation and can now appear on the marketplace.`
              : note || `Review the moderation feedback for ${productTitle} and decide the next step.`,
          bullets: [`Product: ${productTitle}`, event === "product_approved" ? "Public listing is now allowed." : "Moderation notes are attached to this decision."],
          ctaLabel: "Open product workspace",
          ctaHref: "/vendor/products",
        },
        whatsappText:
          event === "product_approved"
            ? `${productTitle} is now approved on HenryCo Marketplace.`
            : `HenryCo Marketplace updated ${productTitle}. ${note || "Review the moderation notes in your vendor workspace."}`,
      };
    case "order_placed":
    case "payment_reminder":
    case "payment_verified":
    case "order_shipped":
    case "order_delivered":
    case "order_delayed":
      return {
        inAppTitle:
          event === "order_placed"
            ? "Order placed"
            : event === "payment_reminder"
            ? "Payment reminder"
            : event === "payment_verified"
            ? "Payment verified"
            : event === "order_shipped"
            ? "Order shipped"
            : event === "order_delivered"
            ? "Order delivered"
            : "Delivery update",
        inAppBody:
          event === "order_placed"
            ? `${orderNo} is confirmed and awaiting the next step.`
            : event === "payment_reminder"
            ? `We are still waiting for payment evidence on ${orderNo}.`
            : event === "payment_verified"
            ? `${orderNo} has been verified by finance.`
            : event === "order_shipped"
            ? `${orderNo} is now in transit.`
            : event === "order_delivered"
            ? `${orderNo} was marked delivered.`
            : `There is a delivery delay update for ${orderNo}.`,
        email: {
          templateKey: event,
          eyebrow: "Order lifecycle",
          headline:
            event === "order_placed"
              ? "Your order is confirmed."
              : event === "payment_reminder"
              ? "Payment is still pending."
              : event === "payment_verified"
              ? "Payment verified."
              : event === "order_shipped"
              ? "Your order is in transit."
              : event === "order_delivered"
              ? "Your order was delivered."
              : "Your order timeline changed.",
          summary:
            event === "order_delayed"
              ? note || `A fulfillment delay was recorded for ${orderNo}.`
              : `${orderNo} has a new marketplace status update.`,
          bullets: [`Order: ${orderNo}`, statusLabel ? `Status: ${statusLabel}` : null, note || null].filter(Boolean) as string[],
          ctaLabel: "Track order",
          ctaHref: `/track/${orderNo}`,
        },
        whatsappText: `HenryCo Marketplace update for ${orderNo}: ${statusLabel || event.replace(/_/g, " ")}.`,
        whatsappTemplateEnv:
          event === "order_placed"
            ? "WHATSAPP_TEMPLATE_ORDER_CONFIRMATION"
            : event === "payment_reminder"
            ? "WHATSAPP_TEMPLATE_PAYMENT_REMINDER"
            : event === "payment_verified"
            ? "WHATSAPP_TEMPLATE_PAYMENT_VERIFIED"
            : event === "order_shipped"
            ? "WHATSAPP_TEMPLATE_ORDER_SHIPPED"
            : event === "order_delivered"
            ? "WHATSAPP_TEMPLATE_ORDER_DELIVERED"
            : "WHATSAPP_TEMPLATE_ORDER_SHIPPED",
        whatsappTemplateValues: [orderNo, statusLabel || event.replace(/_/g, " ")],
      };
    case "dispute_opened":
    case "dispute_updated":
    case "dispute_resolved":
      return {
        inAppTitle:
          event === "dispute_opened"
            ? "Dispute opened"
            : event === "dispute_updated"
            ? "Dispute updated"
            : "Dispute resolved",
        inAppBody: `${disputeNo} now reflects the latest operations note.`,
        email: {
          templateKey: event,
          eyebrow: "Issue resolution",
          headline:
            event === "dispute_resolved"
              ? "Your dispute has a resolution."
              : "Your dispute has been updated.",
          summary: note || `${disputeNo} is moving through the marketplace support workflow.`,
          bullets: [`Dispute: ${disputeNo}`, orderNo ? `Order: ${orderNo}` : null].filter(Boolean) as string[],
          ctaLabel: "Open disputes",
          ctaHref: "/account/disputes",
        },
        whatsappText: `HenryCo Marketplace dispute update: ${disputeNo}. ${note || ""}`.trim(),
        whatsappTemplateEnv: "WHATSAPP_TEMPLATE_DISPUTE_UPDATE",
        whatsappTemplateValues: [disputeNo, statusLabel || "updated"],
      };
    case "return_requested":
      return {
        inAppTitle: "Return requested",
        inAppBody: `${orderNo} now has an active return request.`,
        email: {
          templateKey: event,
          eyebrow: "Returns",
          headline: "A return request is now active.",
          summary: note || `${orderNo} has entered the return workflow and is waiting for the next resolution step.`,
          bullets: [`Order: ${orderNo}`, statusLabel ? `Status: ${statusLabel}` : "Status: return requested"],
          ctaLabel: "Open support",
          ctaHref: "/account/disputes",
        },
      };
    case "refund_approved":
    case "refund_rejected":
      return {
        inAppTitle: event === "refund_approved" ? "Refund approved" : "Refund update",
        inAppBody:
          event === "refund_approved"
            ? `${orderNo} has an approved refund action.`
            : note || `${orderNo} received a refund decision update.`,
        email: {
          templateKey: event,
          eyebrow: "Refund decision",
          headline: event === "refund_approved" ? "Your refund is approved." : "Your refund was not approved.",
          summary:
            note ||
            (event === "refund_approved"
              ? `${orderNo} now has an approved refund path.`
              : `${orderNo} received a refund rejection or alternate resolution.`),
          bullets: [`Order: ${orderNo}`, disputeNo ? `Dispute: ${disputeNo}` : null].filter(Boolean) as string[],
          ctaLabel: "View order support",
          ctaHref: "/account/disputes",
        },
      };
    case "payout_requested":
    case "payout_approved":
    case "payout_rejected":
      return {
        inAppTitle:
          event === "payout_requested"
            ? "Payout requested"
            : event === "payout_approved"
            ? "Payout approved"
            : "Payout update",
        inAppBody: `${payoutReference} has a finance update.`,
        email: {
          templateKey: event,
          eyebrow: "Vendor finance",
          headline:
            event === "payout_requested"
              ? "A vendor payout needs review."
              : event === "payout_approved"
              ? "Your payout is approved."
              : "Your payout was rejected.",
          summary: note || `${payoutReference} has progressed through the marketplace finance workflow.`,
          bullets: [`Reference: ${payoutReference}`, note || null].filter(Boolean) as string[],
          ctaLabel: "Open payouts",
          ctaHref: event === "payout_requested" ? "/finance" : "/vendor/payouts",
        },
        whatsappText: `HenryCo Marketplace payout update: ${payoutReference}. ${note || ""}`.trim(),
      };
    case "low_stock":
      return {
        inAppTitle: "Low stock alert",
        inAppBody: note || `${productTitle} is approaching stockout and needs vendor attention.`,
        email: {
          templateKey: event,
          eyebrow: "Inventory alert",
          headline: "A marketplace listing is running low on stock.",
          summary: note || `${productTitle} crossed the low-stock threshold and needs replenishment or listing action.`,
          bullets: [productTitle].filter(Boolean) as string[],
          ctaLabel: "Open vendor analytics",
          ctaHref: "/vendor/analytics",
        },
        whatsappText: `HenryCo Marketplace low stock alert: ${note || productTitle || "A listing needs replenishment."}`,
      };
    case "stale_order":
      return {
        inAppTitle: "Stale order alert",
        inAppBody: note || `${orderNo} needs operational attention.`,
        email: {
          templateKey: event,
          eyebrow: "Operations alert",
          headline: "An order is falling behind expected progress.",
          summary: note || `${orderNo} crossed the stale-order threshold and needs intervention.`,
          bullets: [orderNo].filter(Boolean) as string[],
          ctaLabel: "Open operations workspace",
          ctaHref: "/operations",
        },
        whatsappText: `HenryCo Marketplace stale order alert: ${note || orderNo || "An order needs intervention."}`,
      };
    case "abandoned_cart":
      return {
        inAppTitle: "Your cart is still waiting",
        inAppBody: note || "The products you shortlisted are still available right now.",
        email: {
          templateKey: event,
          eyebrow: "Cart recovery",
          headline: "Your premium shortlist is still ready.",
          summary:
            note ||
            "Your HenryCo Marketplace cart is still active. If you were comparing trust signals, delivery notes, or split-order timing, you can continue where you stopped.",
          bullets: ["Your cart stays linked to your HenryCo identity", "Checkout still shows split-order clarity before confirmation"],
          ctaLabel: "Return to cart",
          ctaHref: "/cart",
        },
        whatsappText: "HenryCo Marketplace reminder: your cart is still active if you want to continue checkout.",
      };
    case "featured_campaign_alert":
      return {
        inAppTitle: "Campaign spotlight",
        inAppBody: note || "A new premium campaign edit is live on the marketplace.",
        email: {
          templateKey: event,
          eyebrow: "Campaign spotlight",
          headline: "A new HenryCo campaign is live.",
          summary:
            note || "Curated products, premium trust signals, and cleaner merchandising are now live in this new campaign edit.",
          bullets: [statusLabel || "Curated launch rail", productTitle !== "your product" ? `Featured: ${productTitle}` : null].filter(Boolean) as string[],
          ctaLabel: "Explore the campaign",
          ctaHref: "/deals",
        },
      };
    case "review_request":
      return {
        inAppTitle: "Share your review",
        inAppBody: `${orderNo} is complete. Your review helps future buyers assess quality and trust.`,
        email: {
          templateKey: event,
          eyebrow: "Review request",
          headline: "How did the order go?",
          summary:
            note ||
            `${orderNo} has reached a stable delivery state. A thoughtful review now improves trust for other buyers and gives the seller clearer feedback.`,
          bullets: [`Order: ${orderNo}`, productTitle !== "your product" ? `Product: ${productTitle}` : null].filter(Boolean) as string[],
          ctaLabel: "Write a review",
          ctaHref: "/account/reviews",
        },
      };
    case "review_moderation_outcome":
      return {
        inAppTitle: "Review moderation update",
        inAppBody: note || "Your review has a new moderation decision.",
        email: {
          templateKey: event,
          eyebrow: "Review moderation",
          headline: "Your review has a moderation update.",
          summary: note || "The marketplace moderation team updated the status of your review.",
          bullets: [productTitle !== "your product" ? `Product: ${productTitle}` : null].filter(Boolean) as string[],
          ctaLabel: "Open reviews",
          ctaHref: "/account/reviews",
        },
      };
    case "support_reply":
    case "support_escalation":
      return {
        inAppTitle: event === "support_reply" ? "Support replied" : "Support escalation",
        inAppBody:
          event === "support_reply"
            ? note || "A new support reply is available in your thread."
            : note || "Your support thread has been escalated for faster attention.",
        email: {
          templateKey: event,
          eyebrow: "Support",
          headline: event === "support_reply" ? "There is a new support reply." : "Your support issue was escalated.",
          summary:
            note ||
            (event === "support_reply"
              ? "A support agent responded inside your marketplace thread."
              : "Your issue was escalated into a higher-priority support workflow."),
          bullets: [orderNo ? `Order: ${orderNo}` : null, disputeNo ? `Dispute: ${disputeNo}` : null].filter(Boolean) as string[],
          ctaLabel: "Open support",
          ctaHref: "/help",
        },
      };
    case "security_notice":
      return {
        inAppTitle: "Important account notice",
        inAppBody: note || "There is an important marketplace notice tied to your account.",
        email: {
          templateKey: event,
          eyebrow: "Account notice",
          headline: "Important security or account notice.",
          summary:
            note ||
            "We recorded an important marketplace account event. Review the details and continue with any recommended action.",
          bullets: ["This notice is part of your HenryCo account trail"],
          ctaLabel: "Open account",
          ctaHref: "/account",
        },
      };
    case "owner_alert":
    default:
      return {
        inAppTitle: "Marketplace alert",
        inAppBody: note || "A marketplace event requires attention.",
        email: {
          templateKey: event,
          eyebrow: "Operations alert",
          headline: "Marketplace attention required.",
          summary: note || "A tracked marketplace workflow crossed an operational threshold.",
          bullets: [orderNo || disputeNo || payoutReference || storeName || productTitle].filter(Boolean) as string[],
          ctaLabel: "Open workspace",
          ctaHref: "/owner",
        },
        whatsappText: `HenryCo Marketplace alert: ${note || "Operator attention required."}`,
        whatsappTemplateEnv: "WHATSAPP_TEMPLATE_OWNER_ALERT",
        whatsappTemplateValues: [note || "Operator alert"],
      };
  }
}

async function logMarketplaceAudit(input: {
  eventType: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminSupabase();
    await admin.from("marketplace_audit_logs").insert({
      event_type: input.eventType,
      actor_user_id: input.actorUserId ?? null,
      actor_email: normalizeEmail(input.actorEmail) ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      details: input.details ?? {},
    } as never);
  } catch {
    // ignore audit failure when schema is not available yet
  }
}

async function createQueueRecord(input: {
  userId?: string | null;
  normalizedEmail?: string | null;
  eventId?: string | null;
  dedupeKey?: string | null;
  channel: "email" | "whatsapp";
  templateKey: MarketplaceTemplateKey;
  recipient: string;
  subject?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("marketplace_notification_queue")
      .insert({
        user_id: input.userId ?? null,
        normalized_email: input.normalizedEmail ?? null,
        event_id: input.eventId ?? null,
        dedupe_key: input.dedupeKey ?? null,
        channel: input.channel,
        template_key: input.templateKey,
        recipient: input.recipient,
        subject: input.subject ?? null,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        payload: input.payload ?? {},
        status: "queued",
      } as never)
      .select("id")
      .maybeSingle();
    return data?.id ? String(data.id) : null;
  } catch {
    return null;
  }
}

async function createAttemptRecord(input: {
  queueId: string | null;
  channel: "email" | "whatsapp" | "in_app";
  status: QueueStatus;
  provider?: string | null;
  reason?: string | null;
  messageId?: string | null;
  payload?: Record<string, unknown>;
}) {
  if (!input.queueId) return;
  try {
    const admin = createAdminSupabase();
    await admin.from("marketplace_notification_attempts").insert({
      queue_id: input.queueId,
      channel: input.channel,
      status: input.status,
      provider: input.provider ?? null,
      reason: input.reason ?? null,
      message_id: input.messageId ?? null,
      payload: input.payload ?? {},
    } as never);
  } catch {
    // ignore attempt-log failure
  }
}

async function updateQueueRecord(
  id: string | null,
  status: QueueStatus,
  input: {
    payload?: Record<string, unknown>;
    reason?: string | null;
    provider?: string | null;
    messageId?: string | null;
    attemptCount?: number;
  }
) {
  if (!id) return;
  try {
    const admin = createAdminSupabase();
    const now = new Date().toISOString();
    const attemptCount = Math.max(1, Number(input.attemptCount || 1));
    const nextRetryAt =
      status === "failed" && attemptCount < 3
        ? new Date(Date.now() + attemptCount * 30 * 60 * 1000).toISOString()
        : null;

    await admin
      .from("marketplace_notification_queue")
      .update({
        status,
        payload: input.payload ?? {},
        provider: input.provider ?? null,
        provider_message_id: input.messageId ?? null,
        delivery_attempts: attemptCount,
        last_attempted_at: now,
        next_retry_at: nextRetryAt,
        sent_at: status === "sent" ? now : null,
        skipped_reason: status === "skipped" ? input.reason ?? null : null,
        last_error: status === "failed" ? input.reason ?? null : null,
      } as never)
      .eq("id", id);
  } catch {
    // ignore queue update failure
  }
}

async function createInAppNotification(input: {
  userId?: string | null;
  normalizedEmail?: string | null;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}) {
  if (!input.userId && !input.normalizedEmail) return;

  try {
    const admin = createAdminSupabase();
    await admin.from("marketplace_user_notifications").insert({
      user_id: input.userId ?? null,
      normalized_email: input.normalizedEmail ?? null,
      channel: "in_app",
      title: input.title,
      body: input.body,
      payload: input.payload ?? {},
    } as never);
  } catch {
    // ignore when schema does not exist yet
  }
}

async function performEmailDelivery(
  queueId: string | null,
  attemptCount: number,
  userId: string | null | undefined,
  normalizedEmailValue: string | null | undefined,
  recipientEmail: string | null | undefined,
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  template: MarketplaceTemplateInput
): Promise<DeliveryResult> {
  const email = normalizeEmail(recipientEmail) || normalizeEmail(normalizedEmailValue);
  if (!email) {
    const result = {
      ok: false,
      status: "skipped" as const,
      reason: "Recipient email is missing.",
      messageId: null,
      provider: null,
    };
    await updateQueueRecord(queueId, result.status, {
      payload: { template },
      reason: result.reason,
      provider: null,
      attemptCount,
    });
    await createAttemptRecord({
      queueId,
      channel: "email",
      status: result.status,
      reason: result.reason,
      payload: { template },
    });
    return result;
  }

  const rendered = renderMarketplaceEmailTemplate(template);

  const dispatch = await sendTransactionalEmail({
    to: email,
    purpose: "marketplace",
    from: getMarketplaceSenderAddress(),
    fromName: marketplace.name,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  if (dispatch.status === "skipped") {
    const reason = dispatch.skippedReason || "Email provider not configured.";
    await updateQueueRecord(queueId, "queued", {
      payload: { template, rendered },
      reason,
      attemptCount,
    });
    await createAttemptRecord({
      queueId,
      channel: "email",
      status: "queued",
      reason,
      payload: { template, rendered },
    });
    return { ok: false, status: "queued", reason, messageId: null, provider: dispatch.provider };
  }

  if (dispatch.status === "error") {
    const reason = dispatch.safeError || "Email delivery failed.";
    await updateQueueRecord(queueId, "failed", {
      payload: { template, rendered },
      reason,
      provider: dispatch.provider,
      attemptCount,
    });
    await createAttemptRecord({
      queueId,
      channel: "email",
      status: "failed",
      provider: dispatch.provider,
      reason,
      payload: { template, rendered },
    });
    return { ok: false, status: "failed", reason, messageId: null, provider: dispatch.provider };
  }

  await updateQueueRecord(queueId, "sent", {
    payload: { template, rendered },
    provider: dispatch.provider,
    messageId: dispatch.messageId ?? null,
    attemptCount,
  });
  await createAttemptRecord({
    queueId,
    channel: "email",
    status: "sent",
    provider: dispatch.provider,
    messageId: dispatch.messageId ?? null,
    payload: { template, rendered },
  });
  return { ok: true, status: "sent", reason: null, messageId: dispatch.messageId ?? null, provider: dispatch.provider };
}

async function sendViaTwilio(phone: string, body: string): Promise<DeliveryResult> {
  const accountSid = cleanText(process.env.TWILIO_ACCOUNT_SID);
  const authToken = cleanText(process.env.TWILIO_AUTH_TOKEN);
  const from = cleanText(process.env.TWILIO_WHATSAPP_FROM);

  if (!accountSid || !authToken || !from) {
    return { ok: false, status: "skipped", reason: "Twilio WhatsApp is not configured.", messageId: null, provider: "twilio" };
  }

  const payload = new URLSearchParams();
  payload.set("From", from.startsWith("whatsapp:") ? from : `whatsapp:${from}`);
  payload.set("To", phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`);
  payload.set("Body", body);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    }
  );

  const json = (await response.json().catch(() => null)) as { sid?: string; message?: string } | null;
  if (!response.ok || !json?.sid) {
    return {
      ok: false,
      status: "failed",
      reason: json?.message || `Twilio rejected the message with status ${response.status}.`,
      messageId: null,
      provider: "twilio",
    };
  }

  return { ok: true, status: "sent", reason: null, messageId: json.sid, provider: "twilio" };
}

async function sendViaMetaTemplate(phone: string, templateName: string, values: string[]): Promise<DeliveryResult> {
  const phoneNumberId = cleanText(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const accessToken = cleanText(process.env.WHATSAPP_ACCESS_TOKEN);

  if (!phoneNumberId || !accessToken) {
    return { ok: false, status: "skipped", reason: "Meta WhatsApp is not configured.", messageId: null, provider: "meta" };
  }

  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace(/^\+/, ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US" },
        components: values.length
          ? [
              {
                type: "body",
                parameters: values.map((value) => ({ type: "text", text: value })),
              },
            ]
          : undefined,
      },
    }),
  });

  const json = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string };
        messages?: Array<{ id?: string }>;
      }
    | null;

  const messageId = json?.messages?.[0]?.id ?? null;
  if (!response.ok || !messageId) {
    return {
      ok: false,
      status: "failed",
      reason: json?.error?.message || `Meta template send failed with status ${response.status}.`,
      messageId: null,
      provider: "meta",
    };
  }

  return { ok: true, status: "sent", reason: null, messageId, provider: "meta" };
}

async function performWhatsAppDelivery(
  queueId: string | null,
  attemptCount: number,
  userId: string | null | undefined,
  normalizedEmailValue: string | null | undefined,
  recipientPhone: string | null | undefined,
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  templateKey: MarketplaceTemplateKey,
  body: string | null | undefined,
  templateEnvName: string | null | undefined,
  templateValues: string[] | undefined
): Promise<DeliveryResult> {
  const phone = normalizePhone(recipientPhone);
  if (!phone) {
    const result = { ok: false, status: "skipped" as const, reason: "Recipient phone is missing.", messageId: null, provider: null };
    await updateQueueRecord(queueId, result.status, {
      payload: { body, templateEnvName, templateValues },
      reason: result.reason,
      attemptCount,
    });
    await createAttemptRecord({
      queueId,
      channel: "whatsapp",
      status: result.status,
      reason: result.reason,
      payload: { body, templateEnvName, templateValues },
    });
    return result;
  }

  let result: DeliveryResult;
  if (hasTwilioConfig()) {
    result = await sendViaTwilio(phone, body || "");
  } else if (hasMetaConfig()) {
    const templateName = templateEnvName ? cleanText(process.env[templateEnvName]) : "";
    if (!templateName) {
      result = {
        ok: false,
        status: "skipped",
        reason: `${templateEnvName || "WhatsApp template"} is not configured for Meta proactive delivery.`,
        messageId: null,
        provider: "meta",
      };
    } else {
      result = await sendViaMetaTemplate(phone, templateName, templateValues ?? []);
    }
  } else {
    result = {
      ok: false,
      status: "skipped",
      reason: "WhatsApp delivery is not configured.",
      messageId: null,
      provider: null,
    };
  }

  await updateQueueRecord(queueId, result.status, {
    payload: {
      body,
      templateEnvName,
      templateValues,
    },
    reason: result.reason,
    provider: result.provider ?? null,
    messageId: result.messageId,
    attemptCount,
  });
  await createAttemptRecord({
    queueId,
    channel: "whatsapp",
    status: result.status,
    provider: result.provider ?? null,
    reason: result.reason,
    messageId: result.messageId,
    payload: {
      body,
      templateEnvName,
      templateValues,
    },
  });
  return result;
}

export async function sendMarketplaceEvent(input: MarketplaceEventInput) {
  const dedupeKey = buildEventDedupeKey(input);
  const cooldownHours = getEventCooldownHours(input.event);

  if (await hasRecentEvent(dedupeKey, cooldownHours)) {
    await logMarketplaceAudit({
      eventType: `marketplace_event_${input.event}_skipped_duplicate`,
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail,
      entityType: input.entityType,
      entityId: input.entityId,
      details: {
        dedupeKey,
        cooldownHours,
      },
    });

    return {
      inApp: {
        ok: false,
        status: "skipped" as const,
        reason: "Skipped because an equivalent event was sent recently.",
        messageId: null,
      },
      email: {
        ok: false,
        status: "skipped" as const,
        reason: "Skipped because an equivalent event was sent recently.",
        messageId: null,
        provider: null,
      },
      whatsapp: {
        ok: false,
        status: "skipped" as const,
        reason: "Skipped because an equivalent event was sent recently.",
        messageId: null,
        provider: null,
      },
    };
  }

  const eventId = await createMarketplaceEventRecord(input, dedupeKey);
  const copy = buildEventCopy(input.event, input.payload);
  const prefs = await getCommPreference(input.userId, input.normalizedEmail);
  const emailAllowed = prefs ? Boolean(prefs.email_enabled) : true;
  const whatsappAllowed = prefs ? Boolean(prefs.whatsapp_enabled) : true;
  const marketingAllowed = prefs ? Boolean(prefs.marketing_enabled) : true;
  const operationalEvent = !isMarketingEvent(input.event);
  const recipientEmail =
    input.event === "owner_alert"
      ? input.recipientEmail || ownerAlertEmail()
      : input.recipientEmail || input.normalizedEmail || null;

  await createInAppNotification({
    userId: input.userId,
    normalizedEmail: input.normalizedEmail,
    title: copy.inAppTitle,
    body: copy.inAppBody,
    payload: input.payload,
  });

  await syncMarketplaceAccountProjection({
    userId: input.userId,
    normalizedEmail: input.normalizedEmail,
    title: copy.inAppTitle,
    body: copy.inAppBody,
    category: input.event,
    priority:
      input.event === "owner_alert" || input.event === "security_notice" || input.event === "dispute_opened"
        ? "high"
        : input.event === "payment_verified" || input.event === "order_delivered"
          ? "normal"
          : "low",
    entityType: input.entityType,
    entityId: input.entityId,
    amountKobo:
      typeof input.payload.amount === "number"
        ? Math.round(Number(input.payload.amount) * 100)
        : typeof input.payload.grandTotal === "number"
          ? Math.round(Number(input.payload.grandTotal) * 100)
          : null,
    metadata: input.payload,
    actionLabel:
      input.entityType === "order"
        ? "View order"
        : input.entityType === "dispute"
          ? "View dispute"
          : input.entityType === "payout_request"
            ? "View payout"
            : "Open Marketplace",
    status: operationalEvent ? "active" : "info",
  }).catch(() => null);

  const emailQueueId =
    copy.email && emailAllowed && (operationalEvent || marketingAllowed)
      ? await createQueueRecord({
          userId: input.userId,
          normalizedEmail: input.normalizedEmail,
          eventId,
          dedupeKey,
          channel: "email",
          templateKey: copy.email.templateKey,
          recipient: normalizeEmail(recipientEmail) || "unavailable@invalid.local",
          subject: copy.email.headline,
          entityType: input.entityType,
          entityId: input.entityId,
          payload: { template: copy.email },
        })
      : null;

  const whatsappQueueId =
    (copy.whatsappText || copy.whatsappTemplateEnv) && whatsappAllowed && (operationalEvent || marketingAllowed)
      ? await createQueueRecord({
          userId: input.userId,
          normalizedEmail: input.normalizedEmail,
          eventId,
          dedupeKey,
          channel: "whatsapp",
          templateKey: input.event,
          recipient: normalizePhone(input.recipientPhone) || "unavailable",
          entityType: input.entityType,
          entityId: input.entityId,
          payload: {
            body: copy.whatsappText,
            templateEnvName: copy.whatsappTemplateEnv,
            templateValues: copy.whatsappTemplateValues,
          },
        })
      : null;

  const [emailResult, whatsappResult] = await Promise.all([
    copy.email
      ? emailAllowed && (operationalEvent || marketingAllowed)
        ? performEmailDelivery(
            emailQueueId,
            1,
            input.userId,
            input.normalizedEmail,
            recipientEmail,
            input.entityType,
            input.entityId,
            copy.email
          )
        : Promise.resolve<DeliveryResult>({
            ok: false,
            status: "skipped",
            reason: emailAllowed ? "Marketing communication is disabled for this recipient." : "Email notifications are disabled for this recipient.",
            messageId: null,
            provider: null,
          })
      : Promise.resolve<DeliveryResult>({
          ok: false,
          status: "skipped",
          reason: "No email payload for this event.",
          messageId: null,
          provider: null,
        }),
    copy.whatsappText || copy.whatsappTemplateEnv
      ? whatsappAllowed && (operationalEvent || marketingAllowed)
        ? performWhatsAppDelivery(
            whatsappQueueId,
            1,
            input.userId,
            input.normalizedEmail,
            input.recipientPhone,
            input.entityType,
            input.entityId,
            input.event,
            copy.whatsappText,
            copy.whatsappTemplateEnv,
            copy.whatsappTemplateValues
          )
        : Promise.resolve<DeliveryResult>({
            ok: false,
            status: "skipped",
            reason: whatsappAllowed ? "Marketing communication is disabled for this recipient." : "WhatsApp notifications are disabled for this recipient.",
            messageId: null,
            provider: null,
          })
      : Promise.resolve<DeliveryResult>({
          ok: false,
          status: "skipped",
          reason: "No WhatsApp payload for this event.",
          messageId: null,
          provider: null,
        }),
  ]);

  if (emailQueueId && emailResult.status === "skipped") {
    await updateQueueRecord(emailQueueId, "skipped", {
      payload: { template: copy.email },
      reason: emailResult.reason,
      attemptCount: 1,
    });
    await createAttemptRecord({
      queueId: emailQueueId,
      channel: "email",
      status: "skipped",
      reason: emailResult.reason,
      payload: { template: copy.email },
    });
  }

  if (whatsappQueueId && whatsappResult.status === "skipped") {
    await updateQueueRecord(whatsappQueueId, "skipped", {
      payload: {
        body: copy.whatsappText,
        templateEnvName: copy.whatsappTemplateEnv,
        templateValues: copy.whatsappTemplateValues,
      },
      reason: whatsappResult.reason,
      provider: whatsappResult.provider ?? null,
      attemptCount: 1,
    });
    await createAttemptRecord({
      queueId: whatsappQueueId,
      channel: "whatsapp",
      status: "skipped",
      provider: whatsappResult.provider ?? null,
      reason: whatsappResult.reason,
      payload: {
        body: copy.whatsappText,
        templateEnvName: copy.whatsappTemplateEnv,
        templateValues: copy.whatsappTemplateValues,
      },
    });
  }

  await logMarketplaceAudit({
    eventType: `marketplace_event_${input.event}`,
    actorUserId: input.actorUserId,
    actorEmail: input.actorEmail,
    entityType: input.entityType,
    entityId: input.entityId,
    details: {
      eventId,
      dedupeKey,
      email: emailResult,
      whatsapp: whatsappResult,
      prefs: prefs
        ? {
            emailEnabled: Boolean(prefs.email_enabled),
            whatsappEnabled: Boolean(prefs.whatsapp_enabled),
            marketingEnabled: Boolean(prefs.marketing_enabled),
          }
        : null,
      payload: input.payload,
    },
  });

  return {
    inApp: {
      ok: true,
      status: "sent" as const,
      reason: null,
      messageId: null,
    },
    email: emailResult,
    whatsapp: whatsappResult,
  };
}

export async function retryMarketplaceQueuedNotifications(limit = 20) {
  try {
    const admin = createAdminSupabase();
    const now = new Date().toISOString();
    const { data: rows, error } = await admin
      .from("marketplace_notification_queue")
      .select("*")
      .in("status", ["queued", "failed"])
      .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
      .lt("delivery_attempts", 3)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      return {
        attempted: 0,
        recovered: 0,
        failed: 0,
        skipped: 0,
        issue: error.message,
      };
    }

    let recovered = 0;
    let failed = 0;
    let skipped = 0;

    for (const row of rows ?? []) {
      const attemptCount = Number(row.delivery_attempts || 0) + 1;
      const payload =
        row.payload && typeof row.payload === "object" ? (row.payload as Record<string, unknown>) : {};

      let result: DeliveryResult = {
        ok: false,
        status: "skipped",
        reason: "Queue payload could not be retried.",
        messageId: null,
        provider: null,
      };

      if (String(row.channel) === "email" && payload.template && typeof payload.template === "object") {
        result = await performEmailDelivery(
          String(row.id),
          attemptCount,
          row.user_id ? String(row.user_id) : null,
          row.normalized_email ? String(row.normalized_email) : null,
          String(row.recipient || ""),
          row.entity_type ? String(row.entity_type) : null,
          row.entity_id ? String(row.entity_id) : null,
          payload.template as MarketplaceTemplateInput
        );
      } else if (String(row.channel) === "whatsapp") {
        result = await performWhatsAppDelivery(
          String(row.id),
          attemptCount,
          row.user_id ? String(row.user_id) : null,
          row.normalized_email ? String(row.normalized_email) : null,
          String(row.recipient || ""),
          row.entity_type ? String(row.entity_type) : null,
          row.entity_id ? String(row.entity_id) : null,
          String(row.template_key || "owner_alert") as MarketplaceTemplateKey,
          payload.body ? String(payload.body) : null,
          payload.templateEnvName ? String(payload.templateEnvName) : null,
          Array.isArray(payload.templateValues) ? payload.templateValues.map(String) : []
        );
      }

      if (result.status === "sent") {
        recovered += 1;
      } else if (result.status === "failed") {
        failed += 1;
      } else {
        skipped += 1;
      }
    }

    return {
      attempted: (rows ?? []).length,
      recovered,
      failed,
      skipped,
      issue: null,
    };
  } catch (error) {
    return {
      attempted: 0,
      recovered: 0,
      failed: 0,
      skipped: 0,
      issue: error instanceof Error ? error.message : "Notification retry sweep failed.",
    };
  }
}

export async function logMarketplaceAction(input: {
  eventType: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown>;
}) {
  await logMarketplaceAudit(input);
}
