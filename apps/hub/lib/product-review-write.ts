import "server-only";

import { publishNotification } from "@henryco/notifications";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * Product review core — approve / request changes / reject a marketplace
 * product from a confirmed founder action (F3 owner.marketplace.product.review).
 *
 * Mirrors the marketplace console's admin_product_decision write EXACTLY
 * (marketplace_products.approval_status + moderation_note + reviewed_at +
 * reviewed_by), with the app-local sendMarketplaceEvent email fan-out replaced
 * by publishNotification to the vendor's account (hub cannot import another
 * Next app — the seller-decision precedent).
 *
 * CALLERS MUST AUTHORIZE FIRST (requireOwner at the confirm route) and pass
 * the resolved actor — this module does not gate or resolve identity itself.
 * Discipline: validate → re-fetch → AUDIT-FIRST-ABORT → write → best-effort
 * vendor-notification tail (never flips the result).
 */

export type ProductReviewDecision = "approved" | "changes_requested" | "rejected";

const DECISIONS: ReadonlyArray<ProductReviewDecision> = ["approved", "changes_requested", "rejected"];

export type ProductReviewState = {
  productId: string;
  title: string;
  status: string;
  vendorId: string | null;
  vendorStore: string;
  vendorUserId: string | null;
};

export async function readProductReview(productIdInput: string): Promise<ProductReviewState | null> {
  const productId = String(productIdInput ?? "").trim();
  if (!productId) return null;
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("marketplace_products")
    .select("id, title, approval_status, vendor_id")
    .eq("id", productId)
    .maybeSingle();
  const product = data as
    | { id: string; title: string | null; approval_status: string | null; vendor_id: string | null }
    | null;
  if (!product) return null;

  let vendorStore = "the seller";
  let vendorUserId: string | null = null;
  if (product.vendor_id) {
    const { data: vendorRow } = await admin
      .from("marketplace_vendors")
      .select("id, name, owner_user_id")
      .eq("id", product.vendor_id)
      .maybeSingle();
    const vendor = vendorRow as { name: string | null; owner_user_id: string | null } | null;
    if (vendor) {
      vendorStore = vendor.name || vendorStore;
      vendorUserId = vendor.owner_user_id;
    }
  }

  return {
    productId: product.id,
    title: String(product.title ?? "Untitled product"),
    status: String(product.approval_status ?? "pending"),
    vendorId: product.vendor_id,
    vendorStore,
    vendorUserId,
  };
}

export async function applyProductReview(input: {
  productId: string;
  decision: ProductReviewDecision;
  note: string;
  actorId: string;
  actorRole: string;
}): Promise<{ ok: true; executionRef: string } | { ok: false; error: string }> {
  if (!DECISIONS.includes(input.decision)) {
    return { ok: false, error: "That decision isn't recognised." };
  }
  const note = String(input.note ?? "").trim();

  const current = await readProductReview(input.productId);
  if (!current) {
    return { ok: false, error: "That product no longer exists." };
  }
  if (current.status === input.decision) {
    return { ok: false, error: `The product is already ${input.decision.replace("_", " ")}.` };
  }

  const admin = createAdminSupabase();

  // AUDIT-FIRST-ABORT: no trail, no verdict.
  const { error: auditError } = await admin.from("staff_audit_logs").insert({
    actor_id: input.actorId,
    actor_role: input.actorRole || "owner",
    action: "product.review",
    entity: "marketplace_product",
    entity_id: current.productId,
    meta: {
      via: "founder_action",
      decision: input.decision,
      from_status: current.status,
      note: note || null,
    },
  } as never);
  if (auditError) {
    console.error("[product-review-write] audit insert failed", auditError.message);
    return { ok: false, error: "Audit logging failed; the product was not changed." };
  }

  const { error: writeError } = await admin
    .from("marketplace_products")
    .update({
      approval_status: input.decision,
      moderation_note: note || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.actorId,
    } as never)
    .eq("id", current.productId);
  if (writeError) {
    return { ok: false, error: "The verdict could not be saved." };
  }

  // Best-effort vendor notification tail — the verdict already landed.
  if (current.vendorUserId) {
    try {
      await publishNotification({
        userId: current.vendorUserId,
        division: "marketplace",
        eventType: "marketplace.product.review",
        severity: input.decision === "approved" ? "success" : "warning",
        title:
          input.decision === "approved"
            ? "Product approved"
            : input.decision === "changes_requested"
              ? "Product: changes requested"
              : "Product review update",
        body: note
          ? `"${current.title}" — ${note}`
          : `"${current.title}" has been ${input.decision.replace("_", " ")}.`,
        deepLink: "/vendor",
        relatedType: "marketplace_product",
        relatedId: current.productId,
        actorUserId: input.actorId,
        publisher: "bridge:apps/hub/lib/product-review-write",
      });
    } catch (e) {
      console.error("[product-review-write] notify step failed (verdict landed)", e);
    }
  }

  return { ok: true, executionRef: `product:${current.productId}:${input.decision}` };
}
