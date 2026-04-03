import "server-only";

import { getDivisionConfig } from "@henryco/config";
import { normalizeEmail } from "@/lib/env";
import { renderMarketplaceEmailTemplate, type MarketplaceTemplateInput, type MarketplaceTemplateKey } from "@/lib/email/marketplace-templates";
import { createAdminSupabase } from "@/lib/supabase";

type QueueStatus = "queued" | "sent" | "skipped" | "failed";
type DeliveryResult = {
  ok: boolean;
  status: QueueStatus;
  reason: string | null;
  messageId: string | null;
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
          ctaHref: `${process.env.NODE_ENV === "production" ? "https://marketplace.henrycogroup.com" : "http://localhost:3000"}/account`,
        },
        whatsappText: "HenryCo Marketplace: your account is ready. Browse premium products, track orders, and follow verified stores from one place.",
        whatsappTemplateEnv: "WHATSAPP_TEMPLATE_ORDER_CONFIRMATION",
        whatsappTemplateValues: ["HenryCo Marketplace", "Your account is ready"],
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

async function updateQueueRecord(id: string | null, status: QueueStatus, payload: Record<string, unknown>) {
  if (!id) return;
  try {
    const admin = createAdminSupabase();
    await admin
      .from("marketplace_notification_queue")
      .update({
        status,
        payload,
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

async function deliverEmail(
  userId: string | null | undefined,
  normalizedEmailValue: string | null | undefined,
  recipientEmail: string | null | undefined,
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  template: MarketplaceTemplateInput
): Promise<DeliveryResult> {
  const email = normalizeEmail(recipientEmail);
  if (!email) {
    return { ok: false, status: "skipped", reason: "Recipient email is missing.", messageId: null };
  }

  const queueId = await createQueueRecord({
    userId,
    normalizedEmail: normalizedEmailValue,
    channel: "email",
    templateKey: template.templateKey,
    recipient: email,
    subject: template.headline,
    entityType,
    entityId,
    payload: template as unknown as Record<string, unknown>,
  });

  const rendered = renderMarketplaceEmailTemplate(template);
  const resendKey = cleanText(process.env.RESEND_API_KEY);

  if (!resendKey) {
    await updateQueueRecord(queueId, "queued", {
      ...rendered,
      reason: "RESEND_API_KEY is not configured.",
    });
    return { ok: false, status: "queued", reason: "RESEND_API_KEY is not configured.", messageId: null };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${marketplace.name} <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
        to: [email],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (!response.ok) {
      const reason = payload?.message || `Resend rejected the email with status ${response.status}.`;
      await updateQueueRecord(queueId, "failed", { ...rendered, reason });
      return { ok: false, status: "failed", reason, messageId: null };
    }

    await updateQueueRecord(queueId, "sent", { ...rendered, provider: "resend", resend_id: payload?.id ?? null });
    return { ok: true, status: "sent", reason: null, messageId: payload?.id ?? null };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Email delivery failed.";
    await updateQueueRecord(queueId, "failed", { reason });
    return { ok: false, status: "failed", reason, messageId: null };
  }
}

async function sendViaTwilio(phone: string, body: string): Promise<DeliveryResult> {
  const accountSid = cleanText(process.env.TWILIO_ACCOUNT_SID);
  const authToken = cleanText(process.env.TWILIO_AUTH_TOKEN);
  const from = cleanText(process.env.TWILIO_WHATSAPP_FROM);

  if (!accountSid || !authToken || !from) {
    return { ok: false, status: "skipped", reason: "Twilio WhatsApp is not configured.", messageId: null };
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
    };
  }

  return { ok: true, status: "sent", reason: null, messageId: json.sid };
}

async function sendViaMetaTemplate(phone: string, templateName: string, values: string[]): Promise<DeliveryResult> {
  const phoneNumberId = cleanText(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const accessToken = cleanText(process.env.WHATSAPP_ACCESS_TOKEN);

  if (!phoneNumberId || !accessToken) {
    return { ok: false, status: "skipped", reason: "Meta WhatsApp is not configured.", messageId: null };
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
    };
  }

  return { ok: true, status: "sent", reason: null, messageId };
}

async function deliverWhatsApp(
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
    return { ok: false, status: "skipped", reason: "Recipient phone is missing.", messageId: null };
  }

  const queueId = await createQueueRecord({
    userId,
    normalizedEmail: normalizedEmailValue,
    channel: "whatsapp",
    templateKey,
    recipient: phone,
    entityType,
    entityId,
    payload: {
      body,
      templateEnvName,
      templateValues,
    },
  });

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
    };
  }

  await updateQueueRecord(queueId, result.status, {
    body,
    reason: result.reason,
    messageId: result.messageId,
  });
  return result;
}

export async function sendMarketplaceEvent(input: MarketplaceEventInput) {
  const copy = buildEventCopy(input.event, input.payload);

  await createInAppNotification({
    userId: input.userId,
    normalizedEmail: input.normalizedEmail,
    title: copy.inAppTitle,
    body: copy.inAppBody,
    payload: input.payload,
  });

  const [emailResult, whatsappResult] = await Promise.all([
    copy.email
      ? deliverEmail(
          input.userId,
          input.normalizedEmail,
          input.recipientEmail,
          input.entityType,
          input.entityId,
          copy.email
        )
      : Promise.resolve<DeliveryResult>({
          ok: false,
          status: "skipped",
          reason: "No email payload for this event.",
          messageId: null,
        }),
    copy.whatsappText || copy.whatsappTemplateEnv
      ? deliverWhatsApp(
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
          reason: "No WhatsApp payload for this event.",
          messageId: null,
        }),
  ]);

  await logMarketplaceAudit({
    eventType: `marketplace_event_${input.event}`,
    actorUserId: input.actorUserId,
    actorEmail: input.actorEmail,
    entityType: input.entityType,
    entityId: input.entityId,
    details: {
      email: emailResult,
      whatsapp: whatsappResult,
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
