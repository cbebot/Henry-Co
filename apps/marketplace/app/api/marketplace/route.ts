import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDivisionConfig } from "@henryco/config";
import { applyVerificationTrustControls, normalizeVerificationStatus } from "@henryco/trust";
import { normalizeEmail } from "@/lib/env";
import { getMarketplaceViewer, viewerHasRole } from "@/lib/marketplace/auth";
import { getMarketplaceHomeData } from "@/lib/marketplace/data";
import {
  buildOrderSettlementSnapshot,
  computePayoutBalance,
  deriveBuyerRiskProfile,
  deriveSellerTrustProfile,
  evaluateListingSubmission,
  getAutoReleaseAt,
  titleCaseMarketplaceValue,
} from "@/lib/marketplace/governance";
import { checkReviewAuthenticity, syncVendorTrustScore } from "@/lib/marketplace/trust";
import { logMarketplaceAction, sendMarketplaceEvent } from "@/lib/marketplace/notifications";
import { buildSharedAccountLoginUrl } from "@/lib/marketplace/shared-account";
import { createAdminSupabase } from "@/lib/supabase";
import { computeMarketplaceCheckoutBreakdown } from "@henryco/pricing";

export const runtime = "nodejs";

const marketplace = getDivisionConfig("marketplace");

function getVendorVerificationLevel(status: unknown) {
  const normalized = normalizeVerificationStatus(status);
  if (normalized === "verified") return "gold";
  if (normalized === "pending") return "silver";
  return "bronze";
}

/**
 * Initial trust score for a newly approved vendor.
 * Uses verification status to set a reasonable starting point —
 * the score will be recalculated from real behavioral signals by
 * syncVendorTrustScore() as the vendor operates.
 *
 * Base: 58 (new vendor starting point), not 82 — a new seller has
 * no track record yet and should earn higher trust through behavior.
 * Verified identity allows a slightly higher initial score.
 */
function getInitialVendorTrustScore(status: unknown) {
  return applyVerificationTrustControls({
    verificationStatus: status,
    baseScore: 58,
    baseTier: "basic_verified" as never,
    verifiedBonus: 8,
    caps: {
      none: {
        maxScore: 48,
        maxTier: "basic",
      },
      pending: {
        maxScore: 60,
        maxTier: "verified",
      },
      rejected: {
        maxScore: 30,
        maxTier: "basic",
      },
    },
  }).score;
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function truthyValue(formData: FormData, key: string) {
  return ["1", "true", "yes", "on"].includes(text(formData, key).toLowerCase());
}

function makeRef(prefix: string) {
  const now = new Date();
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}`;
  const nonce = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${date}-${nonce}`;
}

function slugify(value: string) {
  return textLike(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || randomUUID().slice(0, 8);
}

function textLike(value?: string | null) {
  return String(value || "").trim();
}

function normalizeTimeline(input: unknown) {
  return Array.isArray(input) ? input.map((item) => textLike(String(item))).filter(Boolean) : [];
}

async function appendOrderTimeline(
  admin: ReturnType<typeof createAdminSupabase>,
  orderNo: string,
  entries: string[]
) {
  if (!orderNo || !entries.length) return;

  const { data: order } = await admin
    .from("marketplace_orders")
    .select("timeline")
    .eq("order_no", orderNo)
    .maybeSingle();

  const existing = normalizeTimeline(order?.timeline);
  const nextTimeline = [...existing];

  for (const entry of entries.map((item) => textLike(item)).filter(Boolean)) {
    if (!nextTimeline.includes(entry)) {
      nextTimeline.push(entry);
    }
  }

  await admin
    .from("marketplace_orders")
    .update({ timeline: nextTimeline } as never)
    .eq("order_no", orderNo);
}

async function createModerationCase(
  admin: ReturnType<typeof createAdminSupabase>,
  input: {
    subjectType: string;
    subjectId: string | null | undefined;
    queue: string;
    status?: string;
    decision?: string | null;
    note?: string | null;
    assignedTo?: string | null;
  }
) {
  if (!input.subjectId) return;

  try {
    await admin.from("marketplace_moderation_cases").insert({
      subject_type: input.subjectType,
      subject_id: input.subjectId,
      queue: input.queue,
      status: input.status || "open",
      decision: input.decision ?? null,
      note: input.note ?? null,
      assigned_to: input.assignedTo ?? null,
    } as never);
  } catch {
    // tolerate moderation schema lag until migrations are fully applied
  }
}

async function writeMarketplaceEvent(
  admin: ReturnType<typeof createAdminSupabase>,
  input: {
    eventType: string;
    userId?: string | null;
    normalizedEmail?: string | null;
    actorUserId?: string | null;
    actorEmail?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    payload?: Record<string, unknown>;
  }
) {
  try {
    await admin.from("marketplace_events").insert({
      event_type: input.eventType,
      user_id: input.userId ?? null,
      normalized_email: normalizeEmail(input.normalizedEmail) ?? null,
      actor_user_id: input.actorUserId ?? null,
      actor_email: normalizeEmail(input.actorEmail) ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      payload: input.payload ?? {},
    } as never);
  } catch {
    // ignore until event schema is available everywhere
  }
}

async function syncOrderLifecycle(admin: ReturnType<typeof createAdminSupabase>, orderNo: string) {
  const [{ data: order }, { data: groups }, { data: disputes }] = await Promise.all([
    admin.from("marketplace_orders").select("id, payment_status").eq("order_no", orderNo).maybeSingle(),
    admin
      .from("marketplace_order_groups")
      .select("fulfillment_status, payout_status, payment_status")
      .eq("order_no", orderNo),
    admin
      .from("marketplace_disputes")
      .select("status")
      .eq("order_no", orderNo)
      .in("status", ["open", "investigating"]),
  ]);

  if (!order?.id) return;

  const groupRows = (groups ?? []) as Array<Record<string, unknown>>;
  const openDisputes = (disputes ?? []).length > 0;
  const allDelivered = groupRows.length > 0 && groupRows.every((group) => String(group.fulfillment_status) === "delivered");
  const anyShipped = groupRows.some((group) => ["shipped", "delivered"].includes(String(group.fulfillment_status)));
  const anyConfirmed = groupRows.some((group) =>
    ["confirmed", "packed", "shipped", "delivered", "fulfillment_in_progress"].includes(String(group.fulfillment_status))
  );
  const payoutStatuses = groupRows.map((group) => String(group.payout_status || ""));

  let nextStatus = String(order.payment_status || "") === "verified" ? "paid_held" : "awaiting_payment";
  if (openDisputes) nextStatus = "disputed";
  else if (payoutStatuses.some((status) => status === "payout_frozen")) nextStatus = "payout_frozen";
  else if (payoutStatuses.length > 0 && payoutStatuses.every((status) => status === "payout_released" || status === "paid")) nextStatus = "payout_released";
  else if (payoutStatuses.some((status) => status === "payout_releasable")) nextStatus = "payout_releasable";
  else if (payoutStatuses.some((status) => status === "awaiting_auto_release")) nextStatus = "awaiting_auto_release";
  else if (allDelivered) nextStatus = "delivered_pending_confirmation";
  else if (anyShipped) nextStatus = "partially_shipped";
  else if (anyConfirmed) nextStatus = "fulfillment_in_progress";
  else if (String(order.payment_status || "") === "verified") nextStatus = "paid_held";

  await admin
    .from("marketplace_orders")
    .update({ status: nextStatus } as never)
    .eq("order_no", orderNo);
}

function redirectTo(request: Request, target: string) {
  return NextResponse.redirect(new URL(target, request.url));
}

function redirectToSharedAccountLogin(request: Request, nextPath: string) {
  return redirectTo(request, buildSharedAccountLoginUrl(nextPath, new URL(request.url).origin));
}

function wantsJson(request: Request, formData: FormData) {
  return (
    text(formData, "response_mode") === "json" ||
    (request.headers.get("accept") || "").includes("application/json")
  );
}

function mapAddressRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    label: String(row.label || ""),
    recipient: String(row.recipient_name || ""),
    phone: String(row.phone || ""),
    line1: String(row.line1 || ""),
    line2: row.line2 ? String(row.line2) : null,
    city: String(row.city || ""),
    region: String(row.region || ""),
    country: String(row.country || "Nigeria"),
    isDefault: Boolean(row.is_default),
  };
}

function mapReviewRow(
  row: Record<string, unknown>,
  productSlug: string,
  vendorSlug: string | null,
  buyerName: string
) {
  return {
    id: String(row.id),
    productSlug,
    vendorSlug: vendorSlug || "vendor",
    buyerName,
    rating: Number(row.rating || 0),
    title: String(row.title || ""),
    body: String(row.body || ""),
    verifiedPurchase: Boolean(row.is_verified_purchase),
    status: String(row.status || "pending"),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const intent = text(formData, "intent");
  const json = wantsJson(request, formData);
  const viewer = await getMarketplaceViewer();
  const admin = createAdminSupabase();
  const snapshot = await getMarketplaceHomeData();
  const returnTo = text(formData, "return_to") || request.headers.get("referer") || "/";

  try {
    switch (intent) {
      case "cart_add": {
        const productSlug = text(formData, "product_slug");
        const quantity = Math.max(1, numberValue(formData, "quantity", 1));
        const product = snapshot.products.find((item) => item.slug === productSlug);
        if (!product) {
          return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=missing-product`);
        }

        let cartToken = text(formData, "cart_token") || null;
        const { data: existingCart } = viewer.user
          ? await admin
              .from("marketplace_carts")
              .select("id, session_token")
              .eq("status", "active")
              .eq("user_id", viewer.user.id)
              .maybeSingle()
          : cartToken
          ? await admin
              .from("marketplace_carts")
              .select("id, session_token")
              .eq("status", "active")
              .eq("session_token", cartToken)
              .maybeSingle()
          : { data: null };

        let cartId = existingCart?.id ? String(existingCart.id) : null;
        cartToken = existingCart?.session_token ? String(existingCart.session_token) : cartToken;

        if (!cartId) {
          cartToken = cartToken || randomUUID();
          const { data: createdCart, error: cartError } = await admin
            .from("marketplace_carts")
            .insert({
              user_id: viewer.user?.id ?? null,
              normalized_email: normalizeEmail(viewer.user?.email) ?? null,
              session_token: cartToken,
              status: "active",
            } as never)
            .select("id")
            .maybeSingle();
          if (cartError || !createdCart?.id) throw cartError ?? new Error("Failed to create cart.");
          cartId = String(createdCart.id);
        }

        const { data: existingItem } = await admin
          .from("marketplace_cart_items")
          .select("id, quantity")
          .eq("cart_id", cartId)
          .eq("product_id", product.id)
          .maybeSingle();

        if (existingItem?.id) {
          await admin
            .from("marketplace_cart_items")
            .update({
              quantity: Number(existingItem.quantity || 0) + quantity,
              price: product.basePrice,
              compare_at_price: product.compareAtPrice,
            } as never)
            .eq("id", existingItem.id);
        } else {
          await admin.from("marketplace_cart_items").insert({
            cart_id: cartId,
            product_id: product.id,
            vendor_id: snapshot.vendors.find((item) => item.slug === product.vendorSlug)?.id ?? null,
            quantity,
            price: product.basePrice,
            compare_at_price: product.compareAtPrice,
          } as never);
        }

        await logMarketplaceAction({
          eventType: "cart_item_added",
          actorUserId: viewer.user?.id ?? null,
          actorEmail: viewer.user?.email ?? null,
          entityType: "product",
          entityId: product.id,
          details: { productSlug, quantity },
        });

        const response = redirectTo(request, "/cart?added=1");
        if (cartToken) {
          response.cookies.set("marketplace_cart_token", cartToken, {
            httpOnly: false,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
        }
        revalidatePath("/cart");
        return response;
      }

      case "cart_update": {
        const itemId = text(formData, "item_id");
        const quantity = Math.max(0, numberValue(formData, "quantity", 1));
        if (!itemId) return redirectTo(request, "/cart?error=missing-item");
        if (quantity <= 0) {
          await admin.from("marketplace_cart_items").delete().eq("id", itemId);
        } else {
          await admin
            .from("marketplace_cart_items")
            .update({ quantity } as never)
            .eq("id", itemId);
        }
        revalidatePath("/cart");
        return redirectTo(request, "/cart");
      }

      case "checkout_submit": {
        if (!viewer.user) {
          return redirectToSharedAccountLogin(request, "/checkout");
        }

        const cartToken = text(formData, "cart_token") || null;
        const { data: cart } =
          (await admin
            .from("marketplace_carts")
            .select("id, session_token")
            .eq("status", "active")
            .eq("user_id", viewer.user.id)
            .maybeSingle()) ??
          { data: null };

        const { data: cartByToken } =
          !cart?.id && cartToken
            ? await admin
                .from("marketplace_carts")
                .select("id, session_token")
                .eq("status", "active")
                .eq("session_token", cartToken)
                .maybeSingle()
            : { data: null };

        const cartId = cart?.id ? String(cart.id) : cartByToken?.id ? String(cartByToken.id) : null;
        if (!cartId) return redirectTo(request, "/cart?error=empty-cart");

        const { data: cartItems, error: itemsError } = await admin
          .from("marketplace_cart_items")
          .select("*")
          .eq("cart_id", cartId);
        if (itemsError || !cartItems?.length) {
          return redirectTo(request, "/cart?error=empty-cart");
        }

        const orderNo = makeRef("MKT-ORD");
        const paymentMethod = text(formData, "payment_method") || "bank_transfer";
        const shippingCity = text(formData, "shipping_city");
        const shippingRegion = text(formData, "shipping_region");
        const buyerName = text(formData, "buyer_name") || viewer.user.fullName || "HenryCo Buyer";
        const buyerPhone = text(formData, "buyer_phone");

        const subtotal = cartItems.reduce(
          (sum, item: Record<string, unknown>) =>
            sum + Number(item.price || 0) * Number(item.quantity || 0),
          0
        );
        const breakdown = computeMarketplaceCheckoutBreakdown({
          itemsSubtotalAmount: subtotal,
        });
        const shippingTotal = breakdown.lines.find((line) => line.code === "delivery")?.amount.amount ?? 0;
        const platformFeeTotal =
          breakdown.lines.find((line) => line.code === "platform_fee")?.amount.amount ?? 0;
        const grandTotal = breakdown.totals.customerTotal.amount;
        const { count: priorOrderCount } = await admin
          .from("marketplace_orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", viewer.user.id);
        const buyerRisk = deriveBuyerRiskProfile({
          orderCount: priorOrderCount ?? 0,
          emailVerified: Boolean(viewer.user.email),
          phoneVerified: Boolean(buyerPhone),
        });

        const { data: createdOrder, error: orderError } = await admin
          .from("marketplace_orders")
          .insert({
            order_no: orderNo,
            user_id: viewer.user.id,
            normalized_email: normalizeEmail(viewer.user.email),
            status: paymentMethod === "cod" ? "placed" : "awaiting_payment",
            payment_status: "pending",
            payment_method: paymentMethod,
            currency: "NGN",
            subtotal,
            shipping_total: shippingTotal,
            discount_total: 0,
            grand_total: grandTotal,
            platform_fee_total: platformFeeTotal,
            pricing_breakdown: breakdown as unknown as Record<string, unknown>,
            buyer_name: buyerName,
            buyer_email: viewer.user.email,
            buyer_phone: buyerPhone || null,
            shipping_city: shippingCity,
            shipping_region: shippingRegion,
            timeline: [
              "Order placed",
              paymentMethod === "cod" ? "Awaiting vendor acceptance" : "Awaiting payment verification",
              "HenryCo will hold seller funds in escrow until fulfillment and trust checks are complete.",
            ],
          } as never)
          .select("id")
          .maybeSingle();

        if (orderError || !createdOrder?.id) throw orderError ?? new Error("Failed to create order.");
        const orderId = String(createdOrder.id);

        const grouped = new Map<string, Array<Record<string, unknown>>>();
        for (const item of cartItems as Array<Record<string, unknown>>) {
          const product = snapshot.products.find((entry) => entry.id === String(item.product_id));
          const key = product?.vendorSlug || "henryco-company";
          const existing = grouped.get(key) ?? [];
          existing.push(item);
          grouped.set(key, existing);
        }

        for (const [vendorSlug, items] of grouped.entries()) {
          const vendor = snapshot.vendors.find((entry) => entry.slug === vendorSlug) ?? null;
          const groupSubtotal = items.reduce(
            (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
            0
          );
          const [{ count: productCount }, { count: disputeCount }, { count: deliveredOrderCount }] = await Promise.all([
            vendor?.id
              ? admin
                  .from("marketplace_products")
                  .select("id", { count: "exact", head: true })
                  .eq("vendor_id", vendor.id)
              : Promise.resolve({ count: 0 }),
            vendor?.id
              ? admin
                  .from("marketplace_disputes")
                  .select("id", { count: "exact", head: true })
                  .eq("vendor_id", vendor.id)
                  .in("status", ["open", "investigating"])
              : Promise.resolve({ count: 0 }),
            vendor?.id
              ? admin
                  .from("marketplace_order_groups")
                  .select("id", { count: "exact", head: true })
                  .eq("vendor_id", vendor.id)
                  .eq("fulfillment_status", "delivered")
              : Promise.resolve({ count: 0 }),
          ]);
          const sellerProfile = deriveSellerTrustProfile({
            vendor,
            deliveredOrderCount: deliveredOrderCount ?? 0,
            openDisputeCount: disputeCount ?? 0,
            productCount: productCount ?? 0,
          });
          const settlement = buildOrderSettlementSnapshot({
            vendor,
            subtotal: groupSubtotal,
            requestFeaturedPlacement: false,
          });
          const { data: group } = await admin
            .from("marketplace_order_groups")
            .insert({
              order_id: orderId,
              order_no: orderNo,
              vendor_id: vendor?.id ?? null,
              owner_type: vendor?.ownerType ?? "company",
              fulfillment_status: "awaiting_acceptance",
              payment_status: "pending",
              payout_status: vendor?.ownerType === "vendor" ? "awaiting_payment" : "paid",
              subtotal: groupSubtotal,
              commission_amount: settlement.commissionAmount,
              net_vendor_amount: settlement.netVendorAmount,
            } as never)
            .select("id")
            .maybeSingle();

          await writeMarketplaceEvent(admin, {
            eventType: "order_group_settlement_snapshot_created",
            userId: viewer.user.id,
            normalizedEmail: viewer.user.email,
            actorUserId: viewer.user.id,
            actorEmail: viewer.user.email,
            entityType: "order_group",
            entityId: group?.id ? String(group.id) : null,
            payload: {
              orderNo,
              vendorSlug,
              buyerRiskBand: buyerRisk.band,
              buyerRiskScore: buyerRisk.score,
              sellerTrustTier: sellerProfile.tier,
              sellerPlanId: sellerProfile.planId,
              settlement,
            },
          });

          for (const item of items) {
            const product = snapshot.products.find((entry) => entry.id === String(item.product_id));
            await admin.from("marketplace_order_items").insert({
              order_id: orderId,
              order_no: orderNo,
              order_group_id: group?.id ?? null,
              product_id: item.product_id,
              vendor_id: vendor?.id ?? null,
              quantity: item.quantity,
              unit_price: item.price,
              line_total: Number(item.price || 0) * Number(item.quantity || 0),
              title_snapshot: {
                title: product?.title || "Product",
                summary: product?.summary || "",
              },
            } as never);
          }
        }

        if (buyerRisk.band === "elevated" || buyerRisk.band === "high") {
          await createModerationCase(admin, {
            subjectType: "order",
            subjectId: orderId,
            queue: "risk_review",
            note: `Buyer risk ${buyerRisk.band} (${buyerRisk.score}) triggered manual trust review before payout release.`,
          });
        }

        await admin.from("marketplace_payment_records").insert({
          order_id: orderId,
          order_no: orderNo,
          provider: paymentMethod === "cod" ? "cod" : "manual",
          method: paymentMethod,
          status: "pending",
          reference: makeRef("MKT-PMT"),
          amount: grandTotal,
        } as never);

        await writeMarketplaceEvent(admin, {
          eventType: "order_checkout_submitted",
          userId: viewer.user.id,
          normalizedEmail: viewer.user.email,
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "order",
          entityId: orderId,
          payload: {
            orderNo,
            paymentMethod,
            subtotal,
            shippingTotal,
            grandTotal,
            buyerRiskBand: buyerRisk.band,
            buyerRiskScore: buyerRisk.score,
          },
        });

        await admin
          .from("marketplace_carts")
          .update({ status: "converted" } as never)
          .eq("id", cartId);

        await sendMarketplaceEvent({
          event: "order_placed",
          userId: viewer.user.id,
          normalizedEmail: normalizeEmail(viewer.user.email),
          recipientEmail: viewer.user.email,
          recipientPhone: buyerPhone || null,
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "order",
          entityId: orderId,
          payload: {
            orderNo,
            statusLabel:
              paymentMethod === "cod" ? "awaiting vendor acceptance" : "awaiting payment verification",
          },
        });

        if (paymentMethod !== "cod") {
          await sendMarketplaceEvent({
            event: "payment_reminder",
            userId: viewer.user.id,
            normalizedEmail: normalizeEmail(viewer.user.email),
            recipientEmail: viewer.user.email,
            recipientPhone: buyerPhone || null,
            actorUserId: viewer.user.id,
            actorEmail: viewer.user.email,
            entityType: "order",
            entityId: orderId,
            payload: {
              orderNo,
              statusLabel: "waiting for transfer proof",
            },
          });
        }

        const response = redirectTo(request, `/track/${orderNo}?placed=1`);
        if (cartToken) {
          response.cookies.delete("marketplace_cart_token");
        }
        revalidatePath("/cart");
        revalidatePath("/account/orders");
        return response;
      }

      case "vendor_apply": {
        if (!viewer.user) return redirectToSharedAccountLogin(request, "/account/seller-application");

        const storeName = text(formData, "store_name");
        const slug = text(formData, "store_slug") || storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const legalName = text(formData, "legal_name");
        const phone = text(formData, "phone");
        const categoryFocus = text(formData, "category_focus");
        const note = text(formData, "store_story");

        const { data: application, error } = await admin
          .from("marketplace_vendor_applications")
          .insert({
            user_id: viewer.user.id,
            normalized_email: normalizeEmail(viewer.user.email),
            store_name: storeName,
            proposed_store_slug: slug,
            legal_name: legalName,
            contact_phone: phone || null,
            category_focus: categoryFocus,
            story: note || null,
            status: "submitted",
            submitted_at: new Date().toISOString(),
          } as never)
          .select("id")
          .maybeSingle();

        if (error) throw error;

        await admin.from("marketplace_role_memberships").upsert({
          user_id: viewer.user.id,
          normalized_email: normalizeEmail(viewer.user.email),
          scope_type: "platform",
          scope_id: null,
          role: "vendor_applicant",
          is_active: true,
        } as never);

        await sendMarketplaceEvent({
          event: "vendor_application_submitted",
          userId: viewer.user.id,
          normalizedEmail: normalizeEmail(viewer.user.email),
          recipientEmail: viewer.user.email,
          recipientPhone: phone || null,
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "vendor_application",
          entityId: application?.id ? String(application.id) : null,
          payload: {
            storeName,
          },
        });

        await sendMarketplaceEvent({
          event: "owner_alert",
          recipientEmail: process.env.RESEND_SUPPORT_INBOX || marketplace.supportEmail,
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "vendor_application",
          entityId: application?.id ? String(application.id) : null,
          payload: {
            note: `New vendor application submitted for ${storeName}.`,
          },
        });

        revalidatePath("/account/seller-application");
        return redirectTo(request, "/account/seller-application?submitted=1");
      }

      case "wishlist_toggle": {
        if (!viewer.user) return redirectToSharedAccountLogin(request, "/account/wishlist");

        const productSlug = text(formData, "product_slug");
        const product = snapshot.products.find((item) => item.slug === productSlug);
        if (!product) {
          return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=missing-product`);
        }

        const { data: existing } = await admin
          .from("marketplace_wishlists")
          .select("id")
          .eq("user_id", viewer.user.id)
          .eq("product_id", product.id)
          .maybeSingle();

        if (existing?.id) {
          await admin.from("marketplace_wishlists").delete().eq("id", existing.id);
        } else {
          await admin.from("marketplace_wishlists").insert({
            user_id: viewer.user.id,
            normalized_email: normalizeEmail(viewer.user.email),
            product_id: product.id,
          } as never);
        }

        await logMarketplaceAction({
          eventType: existing?.id ? "wishlist_removed" : "wishlist_added",
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "product",
          entityId: product.id,
          details: { productSlug },
        });

        revalidatePath("/account/wishlist");
        revalidatePath(`/product/${product.slug}`);
        return redirectTo(
          request,
          `${returnTo}${returnTo.includes("?") ? "&" : "?"}${existing?.id ? "removed=1" : "saved=1"}`
        );
      }

      case "vendor_follow_toggle": {
        if (!viewer.user) return redirectToSharedAccountLogin(request, "/account/following");

        const vendorSlug = text(formData, "vendor_slug");
        const vendor = snapshot.vendors.find((item) => item.slug === vendorSlug);
        if (!vendor) {
          return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=missing-vendor`);
        }

        const { data: existing } = await admin
          .from("marketplace_vendor_follows")
          .select("id")
          .eq("user_id", viewer.user.id)
          .eq("vendor_id", vendor.id)
          .maybeSingle();

        if (existing?.id) {
          await admin.from("marketplace_vendor_follows").delete().eq("id", existing.id);
          await admin
            .from("marketplace_vendors")
            .update({ followers_count: Math.max(0, vendor.followersCount - 1) } as never)
            .eq("id", vendor.id);
        } else {
          await admin.from("marketplace_vendor_follows").insert({
            user_id: viewer.user.id,
            normalized_email: normalizeEmail(viewer.user.email),
            vendor_id: vendor.id,
          } as never);
          await admin
            .from("marketplace_vendors")
            .update({ followers_count: vendor.followersCount + 1 } as never)
            .eq("id", vendor.id);
        }

        await logMarketplaceAction({
          eventType: existing?.id ? "vendor_unfollowed" : "vendor_followed",
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "vendor",
          entityId: vendor.id,
          details: { vendorSlug },
        });

        revalidatePath("/account/following");
        revalidatePath(`/store/${vendor.slug}`);
        return redirectTo(
          request,
          `${returnTo}${returnTo.includes("?") ? "&" : "?"}${existing?.id ? "unfollowed=1" : "followed=1"}`
        );
      }

      case "address_upsert": {
        if (!viewer.user) return redirectToSharedAccountLogin(request, "/account/addresses");

        const addressId = text(formData, "address_id");
        const isDefault = truthyValue(formData, "is_default");
        if (isDefault) {
          await admin
            .from("marketplace_addresses")
            .update({ is_default: false } as never)
            .eq("user_id", viewer.user.id);
        }

        const addressPayload = {
          user_id: viewer.user.id,
          normalized_email: normalizeEmail(viewer.user.email),
          label: text(formData, "label"),
          recipient_name: text(formData, "recipient_name"),
          phone: text(formData, "phone"),
          line1: text(formData, "line1"),
          line2: text(formData, "line2") || null,
          city: text(formData, "city"),
          region: text(formData, "region"),
          country: text(formData, "country") || "Nigeria",
          is_default: isDefault,
        };

        const mutation = addressId
          ? admin
              .from("marketplace_addresses")
              .update(addressPayload as never)
              .eq("id", addressId)
              .eq("user_id", viewer.user.id)
              .select("*")
              .maybeSingle()
          : admin
              .from("marketplace_addresses")
              .insert(addressPayload as never)
              .select("*")
              .maybeSingle();

        const { data: address, error: addressError } = await mutation;
        if (addressError || !address) {
          if (json) {
            return NextResponse.json(
              { error: addressError?.message || "Address save failed." },
              { status: 400 }
            );
          }
          return redirectTo(request, "/account/addresses?error=save-failed");
        }

        revalidatePath("/account/addresses");
        if (json) {
          return NextResponse.json({
            ok: true,
            address: mapAddressRow(address as Record<string, unknown>),
            mode: addressId ? "updated" : "created",
          });
        }
        return redirectTo(request, "/account/addresses?saved=1");
      }

      case "address_delete": {
        if (!viewer.user) return redirectToSharedAccountLogin(request, "/account/addresses");

        const addressId = text(formData, "address_id");
        if (!addressId) {
          if (json) {
            return NextResponse.json({ error: "Address not found." }, { status: 400 });
          }
          return redirectTo(request, "/account/addresses?error=missing-address");
        }

        await admin
          .from("marketplace_addresses")
          .delete()
          .eq("id", addressId)
          .eq("user_id", viewer.user.id);

        await logMarketplaceAction({
          eventType: "address_deleted",
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "address",
          entityId: addressId,
          details: {},
        });

        revalidatePath("/account/addresses");
        if (json) {
          return NextResponse.json({ ok: true, addressId });
        }
        return redirectTo(request, "/account/addresses?deleted=1");
      }

      case "address_set_default": {
        if (!viewer.user) return redirectToSharedAccountLogin(request, "/account/addresses");

        const addressId = text(formData, "address_id");
        if (!addressId) {
          if (json) {
            return NextResponse.json({ error: "Address not found." }, { status: 400 });
          }
          return redirectTo(request, "/account/addresses?error=missing-address");
        }

        await admin
          .from("marketplace_addresses")
          .update({ is_default: false } as never)
          .eq("user_id", viewer.user.id);

        const { data: address, error: addressError } = await admin
          .from("marketplace_addresses")
          .update({ is_default: true } as never)
          .eq("id", addressId)
          .eq("user_id", viewer.user.id)
          .select("*")
          .maybeSingle();

        if (addressError || !address) {
          if (json) {
            return NextResponse.json(
              { error: addressError?.message || "Default address update failed." },
              { status: 400 }
            );
          }
          return redirectTo(request, "/account/addresses?error=default-failed");
        }

        await logMarketplaceAction({
          eventType: "address_set_default",
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "address",
          entityId: addressId,
          details: {},
        });

        revalidatePath("/account/addresses");
        if (json) {
          return NextResponse.json({ ok: true, address: mapAddressRow(address as Record<string, unknown>) });
        }
        return redirectTo(request, "/account/addresses?default=1");
      }

      case "review_submit": {
        if (!viewer.user) return redirectToSharedAccountLogin(request, "/account/reviews");

        const productSlug = text(formData, "product_slug");
        const product = snapshot.products.find((item) => item.slug === productSlug);
        if (!product) return redirectTo(request, "/account/reviews?error=missing-product");

        const rating = Math.min(5, Math.max(1, numberValue(formData, "rating", 5)));
        const reviewTitle = text(formData, "title");
        const reviewBody = text(formData, "body");

        // Determine verified-purchase status before running authenticity check
        const { data: orderItems } = await admin
          .from("marketplace_order_items")
          .select("id, order_id, vendor_id")
          .eq("product_id", product.id)
          .limit(25);

        const orderIds = (orderItems ?? [])
          .map((item: Record<string, unknown>) => String(item.order_id))
          .filter(Boolean);

        const verifiedOrderIds = orderIds.length
          ? (
              await admin
                .from("marketplace_orders")
                .select("id")
                .in("id", orderIds)
                .eq("user_id", viewer.user.id)
            ).data ?? []
          : [];
        const verifiedOrderIdSet = new Set(
          verifiedOrderIds.map((item: Record<string, unknown>) => String(item.id))
        );
        const verifiedItem = (orderItems ?? []).find((item: Record<string, unknown>) =>
          verifiedOrderIdSet.has(String(item.order_id))
        );
        const isVerifiedPurchase = Boolean(verifiedItem?.id);

        // ---- Authenticity checks (duplicate guard, rate limit, content safety)
        const authenticityCheck = await checkReviewAuthenticity({
          userId: viewer.user.id,
          productId: product.id,
          title: reviewTitle,
          body: reviewBody,
          isVerifiedPurchase,
        });

        if (!authenticityCheck.allowed) {
          if (json) {
            return NextResponse.json(
              { error: authenticityCheck.blockReason ?? "Review not accepted." },
              { status: 422 }
            );
          }
          return redirectTo(
            request,
            `/account/reviews?error=review-blocked&reason=${encodeURIComponent(
              authenticityCheck.blockReason ?? "review-not-accepted"
            )}`
          );
        }

        // Status: verified purchases publish immediately; unverified go to pending.
        // Content flagged for medium-severity goes to pending regardless.
        const reviewStatus =
          isVerifiedPurchase && !authenticityCheck.requiresModeration
            ? "published"
            : "pending";

        const vendorId =
          verifiedItem?.vendor_id
            ? String(verifiedItem.vendor_id)
            : snapshot.vendors.find((item) => item.slug === product.vendorSlug)?.id ?? null;

        const reviewPayload = {
          order_item_id: verifiedItem?.id ? String(verifiedItem.id) : null,
          product_id: product.id,
          vendor_id: vendorId,
          user_id: viewer.user.id,
          buyer_name: viewer.user.fullName || "HenryCo Buyer",
          rating,
          title: reviewTitle,
          body: reviewBody,
          is_verified_purchase: isVerifiedPurchase,
          status: reviewStatus,
        };

        const { data: createdReview, error: reviewError } = await admin
          .from("marketplace_reviews")
          .insert(reviewPayload as never)
          .select("*")
          .maybeSingle();

        if (reviewError || !createdReview) {
          if (json) {
            return NextResponse.json(
              { error: reviewError?.message || "Review submission failed." },
              { status: 400 }
            );
          }
          return redirectTo(request, "/account/reviews?error=review-failed");
        }

        // If medium-severity content detected, queue for moderation review
        if (authenticityCheck.requiresModeration && createdReview?.id) {
          await createModerationCase(admin, {
            subjectType: "review",
            subjectId: String(createdReview.id),
            queue: "review_content_check",
            note: `Content flag: ${authenticityCheck.moderationReason ?? "suspicious content detected"} (severity: ${authenticityCheck.moderationSeverity ?? "medium"})`,
          });
        }

        // Recalculate product rating from published reviews only
        const { data: publishedReviews } = await admin
          .from("marketplace_reviews")
          .select("rating")
          .eq("product_id", product.id)
          .eq("status", "published");
        const ratings = (publishedReviews ?? [])
          .map((item: Record<string, unknown>) => Number(item.rating || 0))
          .filter((value) => value > 0);

        if (ratings.length) {
          const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
          await admin
            .from("marketplace_products")
            .update({
              review_count: ratings.length,
              rating: average.toFixed(2),
            } as never)
            .eq("id", product.id);
        }

        // Sync vendor trust score if this is a verified-purchase review
        // (unverified reviews that enter "pending" do not affect trust yet)
        if (vendorId && isVerifiedPurchase && reviewStatus === "published") {
          void syncVendorTrustScore(vendorId, "verified_review_published").catch(() => {
            // Best-effort trust sync — do not block review creation
          });
        }

        revalidatePath("/account/reviews");
        revalidatePath(`/product/${product.slug}`);
        if (json) {
          return NextResponse.json({
            ok: true,
            review: mapReviewRow(
              createdReview as Record<string, unknown>,
              product.slug,
              product.vendorSlug,
              viewer.user.fullName || "HenryCo Buyer"
            ),
            mode: reviewStatus,
          });
        }
        return redirectTo(request, "/account/reviews?submitted=1");
      }

      case "support_thread_create": {
        const contactEmail = normalizeEmail(text(formData, "contact_email") || viewer.user?.email);
        const contactName = text(formData, "contact_name") || viewer.user?.fullName || "Marketplace contact";
        const rawSubject = text(formData, "subject");
        const message = text(formData, "message");
        const vendorSlugInput = text(formData, "vendor_slug");
        const vendorRecord = vendorSlugInput
          ? snapshot.vendors.find((item) => item.slug === vendorSlugInput) ?? null
          : null;
        const subject = vendorRecord
          ? `[Store: ${vendorRecord.name}] ${rawSubject}`
          : rawSubject;
        const vendorPrefix = vendorRecord
          ? `Store context: ${vendorRecord.name} (${vendorRecord.slug})\n\n`
          : "";
        const messageBody = `${vendorPrefix}${message}`;

        const { data: thread } = await admin
          .from("marketplace_support_threads")
          .insert({
            user_id: viewer.user?.id ?? null,
            normalized_email: contactEmail,
            subject,
            status: "open",
            channel: "web",
            last_message: messageBody,
          } as never)
          .select("id")
          .maybeSingle();

        try {
          await admin.from("marketplace_support_messages").insert({
            thread_id: thread?.id ?? null,
            user_id: viewer.user?.id ?? null,
            normalized_email: contactEmail,
            sender_type: viewer.user ? "buyer" : "guest",
            body: messageBody,
          } as never);
        } catch {
          // tolerate support message table not existing until schema is applied
        }

        await sendMarketplaceEvent({
          event: "owner_alert",
          userId: viewer.user?.id ?? null,
          normalizedEmail: contactEmail,
          recipientEmail: process.env.RESEND_SUPPORT_INBOX || marketplace.supportEmail,
          actorUserId: viewer.user?.id ?? null,
          actorEmail: contactEmail,
          entityType: "support_thread",
          entityId: thread?.id ? String(thread.id) : null,
          payload: {
            note: `New marketplace support thread from ${contactName}: ${subject}`,
          },
        });

        return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}thread=1`);
      }

      case "vendor_product_upsert": {
        if (!viewer.user || !viewerHasRole(viewer, ["vendor", "marketplace_owner", "marketplace_admin"])) {
          return redirectToSharedAccountLogin(request, "/vendor/products/new");
        }

        const vendorScopeId =
          viewer.memberships.find((membership) => membership.role === "vendor")?.scopeId ??
          snapshot.vendors.find((item) => item.slug === text(formData, "vendor_slug"))?.id ??
          snapshot.vendors[1]?.id;
        const vendorRecord = snapshot.vendors.find((item) => item.id === vendorScopeId) ?? null;
        const categoryId =
          snapshot.categories.find((item) => item.slug === text(formData, "category_slug"))?.id ??
          snapshot.categories[0].id;
        const brandId =
          snapshot.brands.find((item) => item.slug === text(formData, "brand_slug"))?.id ?? null;
        const slug = text(formData, "slug") || slugify(text(formData, "title"));
        const decision = text(formData, "submission_mode") || "draft";
        const imageUrl = text(formData, "image_url");
        const requestFeaturedPlacement = text(formData, "feature_requested") === "on";
        const [{ count: productCount }, { count: openDisputeCount }, { data: duplicateMedia }] = await Promise.all([
          admin.from("marketplace_products").select("id", { count: "exact", head: true }).eq("vendor_id", vendorScopeId),
          admin
            .from("marketplace_disputes")
            .select("id", { count: "exact", head: true })
            .eq("vendor_id", vendorScopeId)
            .in("status", ["open", "investigating"]),
          imageUrl
            ? admin
                .from("marketplace_product_media")
                .select("id, product_id")
                .eq("url", imageUrl)
                .limit(3)
            : Promise.resolve({ data: [] }),
        ]);
        const sellerProfile = deriveSellerTrustProfile({
          vendor: vendorRecord,
          productCount: productCount ?? 0,
          openDisputeCount: openDisputeCount ?? 0,
        });
        const assessment = evaluateListingSubmission({
          vendor: vendorRecord,
          title: text(formData, "title"),
          summary: text(formData, "summary"),
          description: text(formData, "description"),
          categorySlug: text(formData, "category_slug"),
          imageUrl,
          sku: text(formData, "sku"),
          leadTime: text(formData, "lead_time"),
          deliveryNote: text(formData, "delivery_note"),
          requestFeaturedPlacement,
          currentProductCount: productCount ?? 0,
          duplicateImageDetected: (duplicateMedia?.length ?? 0) > 0,
        });

        if (assessment.blockSubmission) {
          await createModerationCase(admin, {
            subjectType: "product_submission",
            subjectId: slug,
            queue: "listing_blocked",
            note: assessment.moderationReasons.join(" | "),
          });
          return redirectTo(request, `/vendor/products/new?error=listing-blocked&reason=${encodeURIComponent(assessment.moderationReasons.join(", "))}`);
        }

        const payload = {
          slug,
          vendor_id: vendorScopeId,
          category_id: categoryId,
          brand_id: brandId,
          title: text(formData, "title"),
          summary: text(formData, "summary"),
          description: text(formData, "description"),
          inventory_owner_type: "vendor",
          base_price: numberValue(formData, "base_price"),
          compare_at_price: numberValue(formData, "compare_at_price", 0) || null,
          total_stock: numberValue(formData, "stock", 0),
          sku: text(formData, "sku"),
          approval_status:
            decision === "submit"
              ? assessment.requiresManualReview
                ? "under_review"
                : "submitted"
              : "draft",
          status: "active",
          trust_badges: assessment.trustBadges,
          filter_data: {
            verifiedSeller: sellerProfile.tier !== "unverified",
            codEligible: text(formData, "cod_eligible") === "on",
            qualityScore: assessment.qualityScore,
            riskScore: assessment.riskScore,
            postingFee: assessment.postingFee,
            featuredFee: assessment.featuredFee,
            reviewReasons: assessment.moderationReasons,
            requestFeaturedPlacement,
            duplicateAssetDetected: (duplicateMedia?.length ?? 0) > 0,
            sellerPlanId: sellerProfile.planId,
            sellerTrustTier: sellerProfile.tier,
          },
          specifications: {
            Material: text(formData, "material"),
            Warranty: text(formData, "warranty"),
          },
          delivery_note: text(formData, "delivery_note"),
          lead_time: text(formData, "lead_time"),
          cod_eligible: text(formData, "cod_eligible") === "on",
        };

        const { data: product, error } = await admin
          .from("marketplace_products")
          .upsert(payload as never, { onConflict: "slug" })
          .select("id")
          .maybeSingle();
        if (error) throw error;

        if (imageUrl && product?.id) {
          await admin.from("marketplace_product_media").upsert({
            product_id: product.id,
            url: imageUrl,
            kind: "image",
            is_primary: true,
            sort_order: 0,
          } as never);
        }

        if (decision === "submit" || assessment.requiresManualReview) {
          await createModerationCase(admin, {
            subjectType: "product",
            subjectId: product?.id ? String(product.id) : slug,
            queue: assessment.requiresManualReview ? "product_risk_review" : "product_review",
            note: assessment.moderationReasons.join(" | ") || `Listing submitted with quality ${assessment.qualityScore}.`,
          });

          await writeMarketplaceEvent(admin, {
            eventType: "vendor_product_submission_assessed",
            userId: viewer.user.id,
            normalizedEmail: viewer.user.email,
            actorUserId: viewer.user.id,
            actorEmail: viewer.user.email,
            entityType: "product",
            entityId: product?.id ? String(product.id) : null,
            payload: {
              slug,
              assessment,
              sellerPlanId: sellerProfile.planId,
              sellerTrustTier: sellerProfile.tier,
            },
          });

          await sendMarketplaceEvent({
            event: "owner_alert",
            recipientEmail: process.env.RESEND_SUPPORT_INBOX || marketplace.supportEmail,
            actorUserId: viewer.user.id,
            actorEmail: viewer.user.email,
            entityType: "product",
            entityId: product?.id ? String(product.id) : null,
            payload: {
              note: `Product ${payload.title} was submitted with quality ${assessment.qualityScore} and risk ${assessment.riskScore}.`,
            },
          });
        }

        revalidatePath("/vendor/products");
        revalidatePath("/search");
        return redirectTo(request, `/vendor/products?${decision === "submit" ? "submitted=1" : "saved=1"}`);
      }

      case "admin_vendor_application_decision": {
        if (!viewerHasRole(viewer, ["marketplace_owner", "marketplace_admin", "moderation"])) {
          return redirectTo(request, "/account");
        }

        const applicationId = text(formData, "application_id");
        const decision = text(formData, "decision");
        const reviewNote = text(formData, "review_note");

        const { data: application } = await admin
          .from("marketplace_vendor_applications")
          .select("*")
          .eq("id", applicationId)
          .maybeSingle();
        if (!application) return redirectTo(request, "/admin?error=missing-application");

        await admin
          .from("marketplace_vendor_applications")
          .update({
            status: decision,
            review_note: reviewNote || null,
            reviewed_at: new Date().toISOString(),
            reviewed_by: viewer.user?.id ?? null,
          } as never)
          .eq("id", applicationId);

        if (decision === "approved") {
          const { data: ownerProfile } = await admin
            .from("customer_profiles")
            .select("verification_status")
            .eq("id", application.user_id)
            .maybeSingle();
          const sharedVerificationStatus = normalizeVerificationStatus(
            (ownerProfile as { verification_status?: string | null } | null)?.verification_status
          );
          const vendorVerificationLevel = getVendorVerificationLevel(sharedVerificationStatus);
          const vendorTrustScore = getInitialVendorTrustScore(sharedVerificationStatus);
          const { data: vendor } = await admin
            .from("marketplace_vendors")
            .upsert({
              slug: application.proposed_store_slug,
              name: application.store_name,
              description: application.story || `${application.store_name} storefront`,
              owner_user_id: application.user_id,
              owner_type: "vendor",
              status: "approved",
              verification_level: vendorVerificationLevel,
              trust_score: vendorTrustScore,
              response_sla_hours: 6,
              fulfillment_rate: 93,
              dispute_rate: 2.5,
              review_score: 4.5,
              followers_count: 0,
              accent: "#4D5F34",
              hero_image_url: snapshot.vendors[1]?.heroImage || null,
              badges: [
                "Approved vendor",
                sharedVerificationStatus === "verified"
                  ? "Identity verified"
                  : sharedVerificationStatus === "pending"
                    ? "Identity under review"
                    : "Identity required",
              ],
              support_email: application.normalized_email,
              support_phone: application.contact_phone,
            } as never, { onConflict: "slug" })
            .select("id")
            .maybeSingle();

          // Seed initial trust snapshot for audit trail
          if (vendor?.id) {
            void syncVendorTrustScore(
              String(vendor.id),
              "vendor_application_approved"
            ).catch(() => {
              // Best-effort — do not block application approval
            });
          }

          await admin.from("marketplace_role_memberships").upsert({
            user_id: application.user_id,
            normalized_email: application.normalized_email,
            scope_type: "vendor",
            scope_id: vendor?.id ?? null,
            role: "vendor",
            is_active: true,
          } as never);
        }

        await sendMarketplaceEvent({
          event: decision === "approved" ? "vendor_application_approved" : "vendor_application_rejected",
          userId: application.user_id,
          normalizedEmail: application.normalized_email,
          recipientEmail: application.normalized_email,
          recipientPhone: application.contact_phone,
          actorUserId: viewer.user?.id ?? null,
          actorEmail: viewer.user?.email ?? null,
          entityType: "vendor_application",
          entityId: applicationId,
          payload: {
            storeName: application.store_name,
            note: reviewNote || null,
          },
        });

        revalidatePath("/admin");
        revalidatePath("/vendor");
        return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}decision=${decision}`);
      }

      case "admin_product_decision": {
        if (!viewerHasRole(viewer, ["marketplace_owner", "marketplace_admin", "moderation"])) {
          return redirectTo(request, "/account");
        }

        const productId = text(formData, "product_id");
        const decision = text(formData, "decision");
        const reviewNote = text(formData, "review_note");

        const { data: product } = await admin
          .from("marketplace_products")
          .select("*")
          .eq("id", productId)
          .maybeSingle();
        if (!product) return redirectTo(request, "/moderation?error=missing-product");

        await admin
          .from("marketplace_products")
          .update({
            approval_status: decision,
            moderation_note: reviewNote || null,
            reviewed_at: new Date().toISOString(),
            reviewed_by: viewer.user?.id ?? null,
          } as never)
          .eq("id", productId);

        const vendor = snapshot.vendors.find((item) => item.id === String(product.vendor_id));
        await sendMarketplaceEvent({
          event:
            decision === "approved"
              ? "product_approved"
              : decision === "changes_requested"
              ? "product_changes_requested"
              : "product_rejected",
          recipientEmail: vendor?.supportEmail || null,
          recipientPhone: vendor?.supportPhone || null,
          actorUserId: viewer.user?.id ?? null,
          actorEmail: viewer.user?.email ?? null,
          entityType: "product",
          entityId: productId,
          payload: {
            productTitle: product.title,
            note: reviewNote || null,
          },
        });

        revalidatePath("/moderation");
        revalidatePath("/search");
        return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}decision=${decision}`);
      }

      case "payment_verify": {
        if (!viewerHasRole(viewer, ["marketplace_owner", "marketplace_admin", "finance", "support"])) {
          return redirectTo(request, "/account");
        }

        const orderNo = text(formData, "order_no");
        const note = text(formData, "review_note");
        await admin
          .from("marketplace_payment_records")
          .update({
            status: "verified",
            verified_at: new Date().toISOString(),
            verified_by: viewer.user?.id ?? null,
            evidence_note: note || null,
          } as never)
          .eq("order_no", orderNo);
        await admin
          .from("marketplace_orders")
          .update({
            payment_status: "verified",
            status: "paid_held",
          } as never)
          .eq("order_no", orderNo);
        await admin
          .from("marketplace_order_groups")
          .update({
            payment_status: "verified",
            payout_status: "paid_held",
          } as never)
          .eq("order_no", orderNo);

        await appendOrderTimeline(admin, orderNo, [
          "Payment verified by HenryCo finance.",
          "Seller funds are now held in escrow pending fulfillment, delivery proof, and trust review.",
        ]);

        const { data: order } = await admin
          .from("marketplace_orders")
          .select("id, user_id, normalized_email, buyer_email, buyer_phone")
          .eq("order_no", orderNo)
          .maybeSingle();

        await writeMarketplaceEvent(admin, {
          eventType: "payment_verified_and_escrow_activated",
          userId: order?.user_id ?? null,
          normalizedEmail: order?.normalized_email ?? null,
          actorUserId: viewer.user?.id ?? null,
          actorEmail: viewer.user?.email ?? null,
          entityType: "order",
          entityId: order?.id ? String(order.id) : null,
          payload: {
            orderNo,
            reviewNote: note || null,
            payoutStatus: "paid_held",
          },
        });

        await sendMarketplaceEvent({
          event: "payment_verified",
          userId: order?.user_id ?? null,
          normalizedEmail: order?.normalized_email ?? null,
          recipientEmail: order?.buyer_email ?? null,
          recipientPhone: order?.buyer_phone ?? null,
          actorUserId: viewer.user?.id ?? null,
          actorEmail: viewer.user?.email ?? null,
          entityType: "order",
          entityId: order?.id ? String(order.id) : null,
          payload: {
            orderNo,
            statusLabel: "verified",
          },
        });

        await syncOrderLifecycle(admin, orderNo);

        revalidatePath("/finance");
        revalidatePath(`/track/${orderNo}`);
        return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}verified=1`);
      }

      case "order_confirm_completion": {
        if (!viewer.user) {
          return redirectToSharedAccountLogin(request, "/account/orders");
        }

        const orderNo = text(formData, "order_no");
        const { data: order } = await admin
          .from("marketplace_orders")
          .select("id, user_id, normalized_email, buyer_email, buyer_phone")
          .eq("order_no", orderNo)
          .maybeSingle();

        const isOwner =
          order?.user_id === viewer.user.id ||
          (normalizeEmail(order?.normalized_email) &&
            normalizeEmail(order?.normalized_email) === normalizeEmail(viewer.user.email));
        if (!order?.id || !isOwner) {
          return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=forbidden`);
        }

        const { count: openDisputeCount } = await admin
          .from("marketplace_disputes")
          .select("id", { count: "exact", head: true })
          .eq("order_no", orderNo)
          .in("status", ["open", "investigating"]);

        if ((openDisputeCount ?? 0) > 0) {
          return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=dispute-open`);
        }

        await admin
          .from("marketplace_order_groups")
          .update({ payout_status: "payout_releasable" } as never)
          .eq("order_no", orderNo)
          .eq("fulfillment_status", "delivered")
          .in("payout_status", ["awaiting_auto_release", "paid_held"]);

        await appendOrderTimeline(admin, orderNo, [
          "Buyer confirmed completion.",
          "HenryCo marked eligible seller funds as releasable.",
        ]);

        await writeMarketplaceEvent(admin, {
          eventType: "buyer_confirmed_completion",
          userId: order.user_id ?? null,
          normalizedEmail: order.normalized_email ?? null,
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "order",
          entityId: String(order.id),
          payload: {
            orderNo,
          },
        });

        await syncOrderLifecycle(admin, orderNo);
        revalidatePath(`/track/${orderNo}`);
        revalidatePath(`/account/orders/${orderNo}`);
        revalidatePath("/vendor/payouts");
        return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}confirmed=1`);
      }

      case "dispute_create": {
        if (!viewer.user) return redirectToSharedAccountLogin(request, "/account/disputes");

        const orderNo = text(formData, "order_no");
        const reason = text(formData, "reason");
        const note = text(formData, "note");
        const vendorSlug = text(formData, "vendor_slug");
        const vendor = snapshot.vendors.find((item) => item.slug === vendorSlug) ?? null;
        const disputeNo = makeRef("MKT-DSP");
        const { data: order } = await admin
          .from("marketplace_orders")
          .select("id, user_id, normalized_email")
          .eq("order_no", orderNo)
          .maybeSingle();

        const { data: dispute } = await admin
          .from("marketplace_disputes")
          .insert({
            dispute_no: disputeNo,
            order_id: order?.id ?? null,
            order_no: orderNo,
            opened_by_user_id: viewer.user.id,
            normalized_email: normalizeEmail(viewer.user.email),
            vendor_id: vendor?.id ?? null,
            reason,
            details: note || null,
            status: "open",
          } as never)
          .select("id")
          .maybeSingle();

        await admin
          .from("marketplace_orders")
          .update({ status: "disputed" } as never)
          .eq("order_no", orderNo);
        await admin
          .from("marketplace_order_groups")
          .update({
            payout_status: "payout_frozen",
          } as never)
          .eq("order_no", orderNo)
          .eq(vendor?.id ? "vendor_id" : "order_no", vendor?.id ?? orderNo);

        await appendOrderTimeline(admin, orderNo, [
          `Dispute opened: ${titleCaseMarketplaceValue(reason || "issue reported")}.`,
          "HenryCo froze seller payout release while support and moderation review evidence.",
        ]);

        await createModerationCase(admin, {
          subjectType: "dispute",
          subjectId: dispute?.id ? String(dispute.id) : disputeNo,
          queue: "disputes",
          note: note || reason,
        });

        await writeMarketplaceEvent(admin, {
          eventType: "dispute_created_and_payout_frozen",
          userId: viewer.user.id,
          normalizedEmail: viewer.user.email,
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "dispute",
          entityId: dispute?.id ? String(dispute.id) : null,
          payload: {
            orderNo,
            disputeNo,
            vendorSlug: vendorSlug || null,
            reason,
            note,
          },
        });

        await sendMarketplaceEvent({
          event: "dispute_opened",
          userId: viewer.user.id,
          normalizedEmail: normalizeEmail(viewer.user.email),
          recipientEmail: viewer.user.email,
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "dispute",
          entityId: dispute?.id ? String(dispute.id) : null,
          payload: {
            disputeNo,
            orderNo,
            note,
          },
        });

        await syncOrderLifecycle(admin, orderNo);

        return redirectTo(request, "/account/disputes?opened=1");
      }

      case "dispute_update": {
        if (!viewerHasRole(viewer, ["marketplace_owner", "marketplace_admin", "support", "moderation"])) {
          return redirectTo(request, "/account");
        }

        const disputeId = text(formData, "dispute_id");
        const status = text(formData, "status");
        const note = text(formData, "note");
        const { data: dispute } = await admin
          .from("marketplace_disputes")
          .select("*")
          .eq("id", disputeId)
          .maybeSingle();
        if (!dispute) return redirectTo(request, "/support?error=missing-dispute");

        await admin
          .from("marketplace_disputes")
          .update({
            status,
            details: note || dispute.details || null,
            updated_at: new Date().toISOString(),
            resolution_type: status === "resolved" ? "manual_review" : dispute.resolution_type,
          } as never)
          .eq("id", disputeId);

        if (status === "resolved") {
          const resolutionType = text(formData, "resolution_type") || dispute.resolution_type || "manual_review";
          const refundAmount = numberValue(formData, "refund_amount", Number(dispute.refund_amount || 0));

          await admin
            .from("marketplace_disputes")
            .update({
              resolution_type: resolutionType,
              refund_amount: refundAmount || null,
            } as never)
            .eq("id", disputeId);

          await admin
            .from("marketplace_order_groups")
            .update({
              payout_status: resolutionType === "refund_to_buyer" ? "refunded" : "awaiting_auto_release",
            } as never)
            .eq("order_no", dispute.order_no)
            .eq(dispute.vendor_id ? "vendor_id" : "order_no", dispute.vendor_id ?? dispute.order_no);

          await appendOrderTimeline(admin, dispute.order_no, [
            `Dispute ${dispute.dispute_no} resolved.`,
            resolutionType === "refund_to_buyer"
              ? "HenryCo marked the affected payout segment as refunded."
              : "HenryCo returned the payout segment to controlled release monitoring.",
          ]);

          // Sync vendor trust score on dispute resolution — dispute rate changes
          if (dispute.vendor_id) {
            void syncVendorTrustScore(
              String(dispute.vendor_id),
              `dispute_resolved_${resolutionType}`
            ).catch(() => {});
          }
        } else {
          await admin
            .from("marketplace_order_groups")
            .update({
              payout_status: "payout_frozen",
            } as never)
            .eq("order_no", dispute.order_no)
            .eq(dispute.vendor_id ? "vendor_id" : "order_no", dispute.vendor_id ?? dispute.order_no);
        }

        await writeMarketplaceEvent(admin, {
          eventType: "dispute_status_changed",
          userId: dispute.opened_by_user_id,
          normalizedEmail: dispute.normalized_email,
          actorUserId: viewer.user?.id ?? null,
          actorEmail: viewer.user?.email ?? null,
          entityType: "dispute",
          entityId: disputeId,
          payload: {
            disputeNo: dispute.dispute_no,
            orderNo: dispute.order_no,
            status,
            note,
          },
        });

        await sendMarketplaceEvent({
          event: status === "resolved" ? "dispute_resolved" : "dispute_updated",
          userId: dispute.opened_by_user_id,
          normalizedEmail: dispute.normalized_email,
          recipientEmail: dispute.normalized_email,
          actorUserId: viewer.user?.id ?? null,
          actorEmail: viewer.user?.email ?? null,
          entityType: "dispute",
          entityId: disputeId,
          payload: {
            disputeNo: dispute.dispute_no,
            orderNo: dispute.order_no,
            statusLabel: status,
            note,
          },
        });

        await syncOrderLifecycle(admin, String(dispute.order_no || ""));
        revalidatePath("/support");
        return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}updated=1`);
      }

      case "payout_request": {
        if (!viewer.user || !viewerHasRole(viewer, ["vendor"])) {
          return redirectToSharedAccountLogin(request, "/vendor/payouts");
        }

        const vendorId = viewer.memberships.find((membership) => membership.role === "vendor")?.scopeId;
        if (!vendorId) return redirectTo(request, "/vendor/payouts?error=missing-vendor");

        const { data: openRequest } = await admin
          .from("marketplace_payout_requests")
          .select("id, reference, status")
          .eq("vendor_id", vendorId)
          .in("status", ["requested", "approved"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (openRequest?.id) {
          return redirectTo(request, "/vendor/payouts?error=open-request-exists");
        }

        const { data: vendorGroups, error: groupsError } = await admin
          .from("marketplace_order_groups")
          .select("id, order_no, payout_status, net_vendor_amount, delivered_at")
          .eq("vendor_id", vendorId)
          .order("delivered_at", { ascending: true });
        if (groupsError) throw groupsError;

        const balance = computePayoutBalance({
          groups: (vendorGroups ?? []).map((group: Record<string, unknown>) => ({
            id: String(group.id),
            payoutStatus: String(group.payout_status || ""),
            netVendorAmount: Number(group.net_vendor_amount || 0),
          })),
        });

        const requestedAmount = Math.round(numberValue(formData, "amount", balance.releasable));
        if (requestedAmount <= 0 || requestedAmount > balance.releasable) {
          return redirectTo(request, "/vendor/payouts?error=amount-exceeds-releasable");
        }

        const selectedGroupIds: string[] = [];
        let runningAmount = 0;
        for (const group of (vendorGroups ?? []) as Array<Record<string, unknown>>) {
          if (String(group.payout_status || "") !== "payout_releasable") continue;
          selectedGroupIds.push(String(group.id));
          runningAmount += Number(group.net_vendor_amount || 0);
          if (runningAmount >= requestedAmount) break;
        }

        if (!selectedGroupIds.length) {
          return redirectTo(request, "/vendor/payouts?error=no-releasable-balance");
        }

        const reference = makeRef("MKT-PAY");
        const { data: payout } = await admin
          .from("marketplace_payout_requests")
          .insert({
            reference,
            vendor_id: vendorId,
            amount: requestedAmount,
            status: "requested",
            requested_by: viewer.user.id,
          } as never)
          .select("id")
          .maybeSingle();

        await admin
          .from("marketplace_order_groups")
          .update({ payout_status: "requested" } as never)
          .in("id", selectedGroupIds);

        await writeMarketplaceEvent(admin, {
          eventType: "vendor_payout_requested",
          userId: viewer.user.id,
          normalizedEmail: viewer.user.email,
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "payout_request",
          entityId: payout?.id ? String(payout.id) : null,
          payload: {
            reference,
            vendorId,
            selectedGroupIds,
            requestedAmount,
            balance,
          },
        });

        const vendor = snapshot.vendors.find((item) => item.id === vendorId);
        await sendMarketplaceEvent({
          event: "payout_requested",
          recipientEmail: process.env.RESEND_SUPPORT_INBOX || marketplace.supportEmail,
          actorUserId: viewer.user.id,
          actorEmail: viewer.user.email,
          entityType: "payout_request",
          entityId: payout?.id ? String(payout.id) : null,
          payload: {
            payoutReference: reference,
            amount: requestedAmount,
            note: `${vendor?.name || "Vendor"} requested payout review for ${selectedGroupIds.length} releasable settlement group(s).`,
          },
        });

        revalidatePath("/vendor/payouts");
        revalidatePath("/finance/payouts");
        return redirectTo(request, "/vendor/payouts?requested=1");
      }

      case "vendor_order_update": {
        if (!viewerHasRole(viewer, ["vendor", "marketplace_owner", "marketplace_admin", "operations"])) {
          return redirectTo(request, "/account");
        }

        const orderGroupId = text(formData, "order_group_id");
        const fulfillmentStatus = text(formData, "fulfillment_status");
        const shipmentCarrier = text(formData, "shipment_carrier");
        const shipmentTrackingCode = text(formData, "shipment_tracking_code");

        const { data: group } = await admin
          .from("marketplace_order_groups")
          .select("*")
          .eq("id", orderGroupId)
          .maybeSingle();
        if (!group) return redirectTo(request, "/vendor/orders?error=missing-group");

        const vendorScopeId = viewer.memberships.find((membership) => membership.role === "vendor")?.scopeId;
        const isVendorOnly =
          viewerHasRole(viewer, ["vendor"]) &&
          !viewerHasRole(viewer, ["marketplace_owner", "marketplace_admin", "operations"]);
        if (isVendorOnly && vendorScopeId !== String(group.vendor_id || "")) {
          return redirectTo(request, "/vendor/orders?error=forbidden");
        }

        const vendor = snapshot.vendors.find((item) => item.id === String(group.vendor_id || "")) ?? null;
        const { count: openDisputeCount } = await admin
          .from("marketplace_disputes")
          .select("id", { count: "exact", head: true })
          .eq("order_no", String(group.order_no || ""))
          .eq(group.vendor_id ? "vendor_id" : "order_no", group.vendor_id ?? group.order_no)
          .in("status", ["open", "investigating"]);
        const sellerProfile = deriveSellerTrustProfile({ vendor });
        const deliveredAt =
          fulfillmentStatus === "delivered" ? new Date().toISOString() : group.delivered_at ? String(group.delivered_at) : null;
        const nextPayoutStatus =
          fulfillmentStatus === "delivered"
            ? (openDisputeCount ?? 0) > 0
              ? "payout_frozen"
              : String(group.payment_status || "") === "verified"
                ? "awaiting_auto_release"
                : "awaiting_payment"
            : String(group.payout_status || "awaiting_payment");

        await admin
          .from("marketplace_order_groups")
          .update({
            fulfillment_status: fulfillmentStatus,
            shipment_carrier: shipmentCarrier || null,
            shipment_tracking_code: shipmentTrackingCode || null,
            delivered_at: fulfillmentStatus === "delivered" ? deliveredAt : null,
            payout_status: nextPayoutStatus,
          } as never)
          .eq("id", orderGroupId);

        if (
          shipmentCarrier ||
          shipmentTrackingCode ||
          fulfillmentStatus === "shipped" ||
          fulfillmentStatus === "delivered"
        ) {
          try {
            await admin.from("marketplace_shipments").upsert(
              {
                order_group_id: group.id,
                order_no: group.order_no,
                shipment_no: `${group.order_no}-${String(group.id).slice(0, 6)}`,
                carrier: shipmentCarrier || null,
                tracking_code: shipmentTrackingCode || null,
                status: fulfillmentStatus,
                shipped_at: fulfillmentStatus === "shipped" ? new Date().toISOString() : null,
                delivered_at: fulfillmentStatus === "delivered" ? new Date().toISOString() : null,
              } as never,
              { onConflict: "shipment_no" }
            );
          } catch {
            // tolerate shipment table not existing until schema is applied
          }
        }

        const { data: order } = await admin
          .from("marketplace_orders")
          .select("id, user_id, normalized_email, buyer_email, buyer_phone")
          .eq("id", group.order_id)
          .maybeSingle();

        const event =
          fulfillmentStatus === "shipped"
            ? "order_shipped"
            : fulfillmentStatus === "delivered"
            ? "order_delivered"
            : fulfillmentStatus === "delayed"
            ? "order_delayed"
            : null;

        if (event) {
          await appendOrderTimeline(admin, String(group.order_no || ""), [
            fulfillmentStatus === "shipped"
              ? `Shipment dispatched with ${shipmentCarrier || "assigned carrier"}.`
              : fulfillmentStatus === "delivered"
                ? `Delivery verified. HenryCo will auto-release seller funds after ${sellerProfile.autoReleaseDays} day(s) unless a dispute or risk hold is triggered.`
                : `Order updated to ${titleCaseMarketplaceValue(fulfillmentStatus)}.`,
          ]);

          await writeMarketplaceEvent(admin, {
            eventType: "vendor_order_group_updated",
            userId: order?.user_id ?? null,
            normalizedEmail: order?.normalized_email ?? null,
            actorUserId: viewer.user?.id ?? null,
            actorEmail: viewer.user?.email ?? null,
            entityType: "order_group",
            entityId: group.id ? String(group.id) : null,
            payload: {
              orderNo: group.order_no,
              fulfillmentStatus,
              nextPayoutStatus,
              autoReleaseAt:
                fulfillmentStatus === "delivered" && deliveredAt
                  ? getAutoReleaseAt(deliveredAt, sellerProfile)
                  : null,
            },
          });

          await sendMarketplaceEvent({
            event,
            userId: order?.user_id ?? null,
            normalizedEmail: order?.normalized_email ?? null,
            recipientEmail: order?.buyer_email ?? null,
            recipientPhone: order?.buyer_phone ?? null,
            actorUserId: viewer.user?.id ?? null,
            actorEmail: viewer.user?.email ?? null,
            entityType: "order_group",
            entityId: group.id ? String(group.id) : null,
            payload: {
              orderNo: group.order_no,
              statusLabel: fulfillmentStatus,
            },
          });

          // Sync vendor trust score on delivery — fulfillment rate changes
          if (fulfillmentStatus === "delivered" && group.vendor_id) {
            void syncVendorTrustScore(
              String(group.vendor_id),
              "order_delivered"
            ).catch(() => {});
          }
        }

        await syncOrderLifecycle(admin, String(group.order_no || ""));

        revalidatePath("/vendor/orders");
        revalidatePath(`/track/${group.order_no}`);
        return redirectTo(request, "/vendor/orders?updated=1");
      }

      case "vendor_store_update": {
        if (!viewerHasRole(viewer, ["vendor", "marketplace_owner", "marketplace_admin"])) {
          return redirectTo(request, "/account");
        }

        const vendorId =
          viewer.memberships.find((membership) => membership.role === "vendor")?.scopeId ??
          snapshot.vendors.find((item) => item.slug === text(formData, "vendor_slug"))?.id;
        if (!vendorId) {
          return redirectTo(
            request,
            `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=missing-vendor`
          );
        }

        await admin
          .from("marketplace_vendors")
          .update({
            name: text(formData, "name") || undefined,
            description: text(formData, "description") || undefined,
            support_email: normalizeEmail(text(formData, "support_email")) || undefined,
            support_phone: text(formData, "support_phone") || undefined,
            response_sla_hours: numberValue(formData, "response_sla_hours", 0) || undefined,
            accent: text(formData, "accent") || undefined,
          } as never)
          .eq("id", vendorId);

        revalidatePath("/vendor/store");
        revalidatePath("/vendor/settings");
        return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}saved=1`);
      }

      case "payout_decision": {
        if (!viewerHasRole(viewer, ["marketplace_owner", "marketplace_admin", "finance"])) {
          return redirectTo(request, "/account");
        }

        const payoutId = text(formData, "payout_id");
        const decision = text(formData, "decision");
        const note = text(formData, "note");
        const { data: payout } = await admin
          .from("marketplace_payout_requests")
          .select("*")
          .eq("id", payoutId)
          .maybeSingle();
        if (!payout) return redirectTo(request, "/finance?error=missing-payout");

        const requestedStatuses = decision === "released" ? ["requested", "approved"] : ["requested"];
        const groupDecisionStatus =
          decision === "approved"
            ? "approved"
            : decision === "released"
              ? "payout_released"
              : decision === "frozen"
                ? "payout_frozen"
                : "payout_releasable";
        const { data: affectedGroups } = await admin
          .from("marketplace_order_groups")
          .select("order_no")
          .eq("vendor_id", payout.vendor_id)
          .in("payout_status", requestedStatuses);

        await admin
          .from("marketplace_payout_requests")
          .update({
            status: decision,
            reviewed_by: viewer.user?.id ?? null,
            reviewed_at: new Date().toISOString(),
            review_note: note || null,
          } as never)
          .eq("id", payoutId);

        await admin
          .from("marketplace_order_groups")
          .update({
            payout_status: groupDecisionStatus,
          } as never)
          .eq("vendor_id", payout.vendor_id)
          .in("payout_status", requestedStatuses);

        await writeMarketplaceEvent(admin, {
          eventType: "finance_payout_decision_recorded",
          actorUserId: viewer.user?.id ?? null,
          actorEmail: viewer.user?.email ?? null,
          entityType: "payout_request",
          entityId: payoutId,
          payload: {
            reference: payout.reference,
            decision,
            amount: payout.amount,
            note,
            vendorId: payout.vendor_id,
            groupDecisionStatus,
          },
        });

        const vendor = snapshot.vendors.find((item) => item.id === String(payout.vendor_id));
        await sendMarketplaceEvent({
          event: decision === "approved" || decision === "released" ? "payout_approved" : "payout_rejected",
          recipientEmail: vendor?.supportEmail || null,
          recipientPhone: vendor?.supportPhone || null,
          actorUserId: viewer.user?.id ?? null,
          actorEmail: viewer.user?.email ?? null,
          entityType: "payout_request",
          entityId: payoutId,
          payload: {
            payoutReference: payout.reference,
            amount: payout.amount,
            note,
          },
        });

        const affectedOrderNos = Array.from(
          new Set((affectedGroups ?? []).map((group: Record<string, unknown>) => String(group.order_no || "")).filter(Boolean))
        );
        await Promise.all(affectedOrderNos.map((orderNo) => syncOrderLifecycle(admin, orderNo)));
        revalidatePath("/finance");
        revalidatePath("/vendor/payouts");
        return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}decision=${decision}`);
      }
    }

    return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=unknown-intent`);
  } catch (error) {
    await logMarketplaceAction({
      eventType: "marketplace_mutation_failed",
      actorUserId: viewer.user?.id ?? null,
      actorEmail: viewer.user?.email ?? null,
      details: {
        intent,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=mutation-failed`);
  }
}
