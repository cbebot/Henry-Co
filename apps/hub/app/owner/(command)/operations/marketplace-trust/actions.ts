"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/owner-auth";
import { applyProductReview } from "@/lib/product-review-write";
import { createAdminSupabase } from "@/lib/supabase";

const PAGE = "/owner/operations/marketplace-trust";

/**
 * V3-MKT-TRUST-01 — restore or uphold a listing the publish gate took down.
 *
 * This is NOT a second way to publish. It calls the existing audited product
 * review write (the same one the F3 owner action uses): "restore" is the
 * ordinary approval, "uphold" the ordinary rejection. The database guard then
 * decides whether the approval is allowed — it requires the acting account to be
 * marketplace staff — and closes the take-down itself.
 *
 * The actor is the signed-in owner from the session; nothing in the form names one.
 */
export async function resolveHiddenListing(formData: FormData): Promise<void> {
  const owner = await requireOwner();

  const productId = String(formData.get("product_id") ?? "").trim();
  const choice = String(formData.get("decision") ?? "");
  const decision = choice === "restore" ? "approved" : choice === "uphold" ? "rejected" : null;
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 500);

  if (!productId || !decision) {
    redirect(`${PAGE}?done=failed`);
  }

  // This page decides take-downs, and nothing else: a listing with no open
  // take-down is decided in the product review queue, not here.
  const admin = createAdminSupabase();
  const { data: openHide } = await admin
    .from("marketplace_listing_enforcement")
    .select("id")
    .eq("product_id", productId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!openHide) {
    redirect(`${PAGE}?done=failed`);
  }

  const result = await applyProductReview({
    productId,
    decision,
    note,
    actorId: owner.id,
    actorRole: owner.ownerRole,
  });

  revalidatePath(PAGE);
  if (result.ok) {
    redirect(`${PAGE}?done=${decision === "approved" ? "restored" : "upheld"}`);
  }
  redirect(`${PAGE}?done=${result.code === "not_marketplace_staff" ? "staff-role" : "failed"}`);
}
