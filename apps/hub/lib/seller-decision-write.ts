import "server-only";

import { publishNotification } from "@henryco/notifications";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * THE marketplace seller (vendor) application review write path for the founder
 * action rail — a hub-local core that executes the SAME state transition
 * apps/marketplace's `admin_vendor_application_decision` intent does (see
 * apps/marketplace/app/api/marketplace/route.ts around line 1892): update the
 * application status/review columns; on approval upsert the vendor store record
 * + grant the marketplace_role_memberships vendor role; then notify the
 * applicant. This lets the owner approve / request-changes / reject a seller
 * application from HQ through the F3 confirmation card. One behaviour, two
 * callers (marketplace admin console + owner F3).
 *
 * CALLERS MUST AUTHORIZE FIRST (requireOwner at the confirm route) and pass the
 * resolved actor — this module does not gate or resolve identity itself.
 *
 * NOTIFICATION PATH: the staff route fires `sendMarketplaceEvent(...)` which
 * lives INSIDE apps/marketplace (marketplace-only email templates + queue
 * tables) and cannot be imported from apps/hub (separate Next app). So the
 * applicant notification is replicated via `publishNotification` from
 * @henryco/notifications — the same import kyc-review-write.ts uses — writing
 * the in-app inbox row + audit log. The best-effort transactional email/WhatsApp
 * fan-out is intentionally skipped from this HQ path (the marketplace console
 * remains the email-capable surface); the DB state change is faithful and the
 * applicant is still notified in-app.
 *
 * TRUST HELPERS: the staff route computes the vendor's initial trust_score /
 * verification_level via @henryco/trust (getInitialVendorTrustScore /
 * getVendorVerificationLevel). Those are inlined here as small pure helpers so
 * this hub-local file carries no new cross-package import — the numbers match
 * the staff route's exactly (base 58, verified bonus 8; caps none 48 / pending
 * 60 / rejected 30; level gold/silver/bronze).
 */

export type SellerDecision = "approved" | "changes_requested" | "rejected";

export type SellerApplicationState = {
  applicationId: string;
  userId: string | null;
  storeName: string;
  status: string;
  userEmail: string | null;
};

/** Normalizes a shared verification status the way @henryco/trust does. */
function normalizeVerificationStatus(value: unknown): "none" | "pending" | "verified" | "rejected" {
  const status = String(value || "").trim().toLowerCase();
  if (status === "pending" || status === "verified" || status === "rejected") return status;
  return "none";
}

/** Faithful mirror of apps/marketplace getVendorVerificationLevel(). */
function getVendorVerificationLevel(status: unknown): "gold" | "silver" | "bronze" {
  const normalized = normalizeVerificationStatus(status);
  if (normalized === "verified") return "gold";
  if (normalized === "pending") return "silver";
  return "bronze";
}

/**
 * Faithful mirror of apps/marketplace getInitialVendorTrustScore() — base 58,
 * verified bonus 8, caps none 48 / pending 60 / rejected 30. Resolves to
 * verified→66, none→48, pending→58, rejected→30.
 */
function getInitialVendorTrustScore(status: unknown): number {
  const normalized = normalizeVerificationStatus(status);
  const baseScore = 58;
  if (normalized === "verified") return Math.min(100, baseScore + 8);
  if (normalized === "pending") return Math.min(baseScore, 60);
  if (normalized === "rejected") return Math.min(baseScore, 30);
  return Math.min(baseScore, 48);
}

/** Live state of a seller application — the F3 true-state reader. */
export async function readSellerApplication(
  applicationId: string,
): Promise<SellerApplicationState | null> {
  const admin = createAdminSupabase();
  const { data: application, error } = await admin
    .from("marketplace_vendor_applications")
    .select("id, user_id, store_name, status, normalized_email")
    .eq("id", applicationId)
    .maybeSingle();
  if (error || !application) return null;

  return {
    applicationId,
    userId: application.user_id ? String(application.user_id) : null,
    storeName: String(application.store_name || ""),
    status: String(application.status || "draft"),
    userEmail: (application.normalized_email as string | null) ?? null,
  };
}

/**
 * Apply an owner/staff seller-application review. Mirrors the marketplace
 * `admin_vendor_application_decision` intent in effect: the staff_audit_logs
 * insert is the gate (its failure aborts before any state moves), then the
 * application status/review columns are updated, then on approval the vendor
 * store is upserted and the vendor role membership is granted, then activity +
 * notification fire best-effort. Returns an execution ref for the F3 audit
 * trail.
 */
export async function applySellerDecision(input: {
  applicationId: string;
  decision: SellerDecision;
  note: string;
  actorId: string;
  actorRole: string;
}): Promise<{ ok: true; executionRef: string } | { ok: false; error: string }> {
  const { applicationId, decision, note, actorId, actorRole } = input;

  if (decision !== "approved" && decision !== "changes_requested" && decision !== "rejected") {
    return { ok: false, error: "Choose a valid seller review decision." };
  }
  if ((decision === "rejected" || decision === "changes_requested") && !note.trim()) {
    return { ok: false, error: "Add a review note before requesting changes or rejecting." };
  }

  const admin = createAdminSupabase();
  const now = new Date().toISOString();

  const { data: application } = await admin
    .from("marketplace_vendor_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();
  if (!application) {
    return { ok: false, error: "That seller application could not be found." };
  }

  const applicantUserId = application.user_id ? String(application.user_id) : null;
  const storeName = String(application.store_name || "your store");

  // Audit-first: its failure aborts before any state moves (staff-route parity).
  const { error: auditError } = await admin.from("staff_audit_logs").insert({
    actor_id: actorId,
    actor_role: actorRole || "owner",
    action: `marketplace.seller.${decision}`,
    entity: "marketplace_vendor_application",
    entity_id: applicationId,
    meta: {
      target_user_id: applicantUserId,
      store_name: storeName,
      proposed_store_slug: String(application.proposed_store_slug || ""),
      review_status: decision,
      reviewer_note_present: Boolean(note.trim()),
      via: "founder_action",
    },
  } as never);
  if (auditError) {
    console.error("[seller-decision-write] staff audit insert failed", auditError.message);
    return { ok: false, error: "Audit logging failed; seller application was not changed." };
  }

  // The application status update — matches the marketplace route's columns
  // exactly (status, review_note, reviewed_at, reviewed_by).
  await admin
    .from("marketplace_vendor_applications")
    .update({
      status: decision,
      review_note: note.trim() || null,
      reviewed_at: now,
      reviewed_by: actorId,
    } as never)
    .eq("id", applicationId);

  // On approval, actually activate the seller: upsert the vendor store record
  // and grant the vendor role membership (marketplace route parity).
  if (decision === "approved") {
    const { data: ownerProfile } = await admin
      .from("customer_profiles")
      .select("verification_status")
      .eq("id", applicantUserId)
      .maybeSingle();
    const sharedVerificationStatus = normalizeVerificationStatus(
      (ownerProfile as { verification_status?: string | null } | null)?.verification_status,
    );
    const vendorVerificationLevel = getVendorVerificationLevel(sharedVerificationStatus);
    const vendorTrustScore = getInitialVendorTrustScore(sharedVerificationStatus);

    const { data: vendor } = await admin
      .from("marketplace_vendors")
      .upsert(
        {
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
          hero_image_url: null,
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
        } as never,
        { onConflict: "slug" },
      )
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

  const reviewerBody =
    decision === "approved"
      ? note.trim() || `${storeName} is approved — the vendor workspace is now enabled.`
      : decision === "changes_requested"
        ? note.trim() || `${storeName} needs a few updates before approval.`
        : note.trim() || `${storeName} could not be approved in its current form.`;

  // Best-effort tail — the decision already landed; these must never flip it.
  try {
    if (applicantUserId) {
      await admin.from("customer_activity").insert({
        user_id: applicantUserId,
        division: "marketplace",
        activity_type: "seller_application_reviewed",
        title:
          decision === "approved"
            ? "Seller application approved"
            : decision === "changes_requested"
              ? "Seller application changes requested"
              : "Seller application update",
        description: reviewerBody,
        status: decision,
        reference_type: "vendor_application",
        reference_id: applicationId,
        action_url: decision === "approved" ? "/vendor" : "/account/seller-application",
        metadata: {
          application_id: applicationId,
          store_name: storeName,
          review_status: decision,
          reviewer_id: actorId,
          via: "founder_action",
        },
      } as never);

      await publishNotification({
        userId: applicantUserId,
        division: "marketplace",
        eventType: "marketplace.seller.review",
        severity: decision === "approved" ? "success" : "warning",
        title:
          decision === "approved"
            ? "Seller application approved"
            : decision === "changes_requested"
              ? "Seller application: changes requested"
              : "Seller application update",
        body: reviewerBody,
        deepLink: decision === "approved" ? "/vendor" : "/account/seller-application",
        relatedType: "vendor_application",
        relatedId: applicationId,
        actorUserId: actorId,
        publisher: "bridge:apps/hub/lib/seller-decision-write",
      });
    }
  } catch (e) {
    console.error("[seller-decision-write] post-write notify step failed (decision landed)", e);
  }

  return { ok: true, executionRef: `seller:${applicationId}:${decision}` };
}
