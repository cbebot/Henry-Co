import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDivisionConfig } from "@henryco/config";
import { normalizeEmail } from "@/lib/env";
import { getMarketplaceViewer, viewerHasRole } from "@/lib/marketplace/auth";
import { getMarketplaceHomeData } from "@/lib/marketplace/data";
import { logMarketplaceAction, sendMarketplaceEvent } from "@/lib/marketplace/notifications";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const marketplace = getDivisionConfig("marketplace");

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function makeRef(prefix: string) {
  const now = new Date();
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}`;
  const nonce = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${date}-${nonce}`;
}

function redirectTo(request: Request, target: string) {
  return NextResponse.redirect(new URL(target, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const intent = text(formData, "intent");
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
            httpOnly: true,
            sameSite: "lax",
            path: "/",
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
          return redirectTo(request, "/login?next=/checkout");
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
        const shippingTotal = subtotal > 350000 ? 0 : 18000;
        const grandTotal = subtotal + shippingTotal;

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
            buyer_name: buyerName,
            buyer_email: viewer.user.email,
            buyer_phone: buyerPhone || null,
            shipping_city: shippingCity,
            shipping_region: shippingRegion,
            timeline: [
              "Order placed",
              paymentMethod === "cod" ? "Awaiting vendor acceptance" : "Awaiting payment verification",
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
          const commissionAmount = vendor?.ownerType === "vendor" ? Math.round(groupSubtotal * 0.15) : 0;
          const { data: group } = await admin
            .from("marketplace_order_groups")
            .insert({
              order_id: orderId,
              order_no: orderNo,
              vendor_id: vendor?.id ?? null,
              owner_type: vendor?.ownerType ?? "company",
              fulfillment_status: "awaiting_acceptance",
              payment_status: "pending",
              payout_status: vendor?.ownerType === "vendor" ? "eligible" : "paid",
              subtotal: groupSubtotal,
              commission_amount: commissionAmount,
              net_vendor_amount: groupSubtotal - commissionAmount,
            } as never)
            .select("id")
            .maybeSingle();

          for (const item of items) {
            const product = snapshot.products.find((entry) => entry.id === String(item.product_id));
            await admin.from("marketplace_order_items").insert({
              order_id: orderId,
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

        await admin.from("marketplace_payment_records").insert({
          order_id: orderId,
          order_no: orderNo,
          provider: paymentMethod === "cod" ? "cod" : "manual",
          method: paymentMethod,
          status: "pending",
          reference: makeRef("MKT-PMT"),
          amount: grandTotal,
        } as never);

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
        if (!viewer.user) return redirectTo(request, "/login?next=/sell");

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
        if (!viewer.user) return redirectTo(request, "/login?next=/account/wishlist");

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
        if (!viewer.user) return redirectTo(request, "/login?next=/account/following");

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
        if (!viewer.user) return redirectTo(request, "/login?next=/account/addresses");

        const isDefault = text(formData, "is_default") === "on";
        if (isDefault) {
          await admin
            .from("marketplace_addresses")
            .update({ is_default: false } as never)
            .eq("user_id", viewer.user.id);
        }

        await admin.from("marketplace_addresses").insert({
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
        } as never);

        revalidatePath("/account/addresses");
        return redirectTo(request, "/account/addresses?saved=1");
      }

      case "review_submit": {
        if (!viewer.user) return redirectTo(request, "/login?next=/account/reviews");

        const productSlug = text(formData, "product_slug");
        const product = snapshot.products.find((item) => item.slug === productSlug);
        if (!product) return redirectTo(request, "/account/reviews?error=missing-product");

        const rating = Math.min(5, Math.max(1, numberValue(formData, "rating", 5)));
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

        await admin.from("marketplace_reviews").insert({
          order_item_id: verifiedItem?.id ? String(verifiedItem.id) : null,
          product_id: product.id,
          vendor_id:
            verifiedItem?.vendor_id
              ? String(verifiedItem.vendor_id)
              : snapshot.vendors.find((item) => item.slug === product.vendorSlug)?.id ?? null,
          user_id: viewer.user.id,
          buyer_name: viewer.user.fullName || "HenryCo Buyer",
          rating,
          title: text(formData, "title"),
          body: text(formData, "body"),
          is_verified_purchase: Boolean(verifiedItem?.id),
          status: verifiedItem?.id ? "published" : "pending",
        } as never);

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

        revalidatePath("/account/reviews");
        revalidatePath(`/product/${product.slug}`);
        return redirectTo(request, "/account/reviews?submitted=1");
      }

      case "support_thread_create": {
        const contactEmail = normalizeEmail(text(formData, "contact_email") || viewer.user?.email);
        const contactName = text(formData, "contact_name") || viewer.user?.fullName || "Marketplace contact";
        const subject = text(formData, "subject");
        const message = text(formData, "message");

        const { data: thread } = await admin
          .from("marketplace_support_threads")
          .insert({
            user_id: viewer.user?.id ?? null,
            normalized_email: contactEmail,
            subject,
            status: "open",
            channel: "web",
            last_message: message,
          } as never)
          .select("id")
          .maybeSingle();

        try {
          await admin.from("marketplace_support_messages").insert({
            thread_id: thread?.id ?? null,
            user_id: viewer.user?.id ?? null,
            normalized_email: contactEmail,
            sender_type: viewer.user ? "buyer" : "guest",
            body: message,
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
          return redirectTo(request, "/login?next=/vendor/products/new");
        }

        const vendorScopeId =
          viewer.memberships.find((membership) => membership.role === "vendor")?.scopeId ??
          snapshot.vendors.find((item) => item.slug === text(formData, "vendor_slug"))?.id ??
          snapshot.vendors[1]?.id;
        const categoryId =
          snapshot.categories.find((item) => item.slug === text(formData, "category_slug"))?.id ??
          snapshot.categories[0].id;
        const brandId =
          snapshot.brands.find((item) => item.slug === text(formData, "brand_slug"))?.id ?? null;
        const slug = text(formData, "slug") || text(formData, "title").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const decision = text(formData, "submission_mode") || "draft";

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
          approval_status: decision === "submit" ? "submitted" : "draft",
          status: "active",
          trust_badges: ["Seller submitted"],
          filter_data: {
            verifiedSeller: true,
            codEligible: text(formData, "cod_eligible") === "on",
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

        const imageUrl = text(formData, "image_url");
        if (imageUrl && product?.id) {
          await admin.from("marketplace_product_media").upsert({
            product_id: product.id,
            url: imageUrl,
            kind: "image",
            is_primary: true,
            sort_order: 0,
          } as never);
        }

        if (decision === "submit") {
          await sendMarketplaceEvent({
            event: "owner_alert",
            recipientEmail: process.env.RESEND_SUPPORT_INBOX || marketplace.supportEmail,
            actorUserId: viewer.user.id,
            actorEmail: viewer.user.email,
            entityType: "product",
            entityId: product?.id ? String(product.id) : null,
            payload: {
              note: `Product ${payload.title} was submitted for moderation.`,
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
          const { data: vendor } = await admin
            .from("marketplace_vendors")
            .upsert({
              slug: application.proposed_store_slug,
              name: application.store_name,
              description: application.story || `${application.store_name} storefront`,
              owner_user_id: application.user_id,
              owner_type: "vendor",
              status: "approved",
              verification_level: "gold",
              trust_score: 82,
              response_sla_hours: 6,
              fulfillment_rate: 93,
              dispute_rate: 2.5,
              review_score: 4.5,
              followers_count: 0,
              accent: "#4D5F34",
              hero_image_url: snapshot.vendors[1]?.heroImage || null,
              badges: ["Approved vendor"],
              support_email: application.normalized_email,
              support_phone: application.contact_phone,
            } as never, { onConflict: "slug" })
            .select("id")
            .maybeSingle();

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
            status: "processing",
          } as never)
          .eq("order_no", orderNo);
        await admin
          .from("marketplace_order_groups")
          .update({
            payment_status: "verified",
          } as never)
          .eq("order_no", orderNo);

        const { data: order } = await admin
          .from("marketplace_orders")
          .select("id, user_id, normalized_email, buyer_email, buyer_phone")
          .eq("order_no", orderNo)
          .maybeSingle();

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

        revalidatePath("/finance");
        revalidatePath(`/track/${orderNo}`);
        return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}verified=1`);
      }

      case "dispute_create": {
        if (!viewer.user) return redirectTo(request, "/login?next=/account/disputes");

        const orderNo = text(formData, "order_no");
        const reason = text(formData, "reason");
        const note = text(formData, "note");
        const vendorSlug = text(formData, "vendor_slug");
        const vendor = snapshot.vendors.find((item) => item.slug === vendorSlug) ?? null;
        const disputeNo = makeRef("MKT-DSP");

        const { data: dispute } = await admin
          .from("marketplace_disputes")
          .insert({
            dispute_no: disputeNo,
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

        revalidatePath("/support");
        return redirectTo(request, `${returnTo}${returnTo.includes("?") ? "&" : "?"}updated=1`);
      }

      case "payout_request": {
        if (!viewer.user || !viewerHasRole(viewer, ["vendor"])) {
          return redirectTo(request, "/login?next=/vendor/payouts");
        }

        const vendorId = viewer.memberships.find((membership) => membership.role === "vendor")?.scopeId;
        if (!vendorId) return redirectTo(request, "/vendor/payouts?error=missing-vendor");

        const reference = makeRef("MKT-PAY");
        const amount = numberValue(formData, "amount", 0);
        const { data: payout } = await admin
          .from("marketplace_payout_requests")
          .insert({
            reference,
            vendor_id: vendorId,
            amount,
            status: "requested",
            requested_by: viewer.user.id,
          } as never)
          .select("id")
          .maybeSingle();

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
            note: `${vendor?.name || "Vendor"} requested payout review.`,
          },
        });

        revalidatePath("/vendor/payouts");
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

        await admin
          .from("marketplace_order_groups")
          .update({
            fulfillment_status: fulfillmentStatus,
            shipment_carrier: shipmentCarrier || null,
            shipment_tracking_code: shipmentTrackingCode || null,
            delivered_at: fulfillmentStatus === "delivered" ? new Date().toISOString() : null,
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
        }

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

        await admin
          .from("marketplace_payout_requests")
          .update({
            status: decision,
            reviewed_by: viewer.user?.id ?? null,
            reviewed_at: new Date().toISOString(),
            review_note: note || null,
          } as never)
          .eq("id", payoutId);

        const vendor = snapshot.vendors.find((item) => item.id === String(payout.vendor_id));
        await sendMarketplaceEvent({
          event: decision === "approved" ? "payout_approved" : "payout_rejected",
          recipientEmail: vendor?.supportEmail || null,
          recipientPhone: vendor?.supportPhone || null,
          actorUserId: viewer.user?.id ?? null,
          actorEmail: viewer.user?.email ?? null,
          entityType: "payout_request",
          entityId: payoutId,
          payload: {
            payoutReference: payout.reference,
            note,
          },
        });

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
