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

/**
 * Reported when the storefront row landed but the vendor role membership did
 * not. The partial state is stated plainly rather than softened, because the
 * owner needs to know two different things: the store IS live to buyers, and the
 * seller CANNOT yet reach their workspace.
 *
 * The named recovery is real and in-product. Suspend followed by Reinstate both
 * route through `owner_set_vendor_active`, which writes the storefront status
 * and the role membership inside ONE transaction — so the pair repairs exactly
 * the row that failed here, and does it atomically. Re-running Approve would
 * not work: the application now reads `approved`, which is not a state the
 * approve action accepts.
 */
const GRANT_FAILED_MESSAGE =
  "The store was created but workspace access could not be granted, so this seller cannot sign in to sell yet. Use Suspend store then Reinstate store on the sellers panel to repair it.";

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
  /**
   * Prior status the decision was made against — the compare-and-set anchor.
   * The console's fresh read and this write are two round trips, and between
   * them another operator can decide the same application. CAS makes the UPDATE
   * itself the check, so the second decision matches nothing instead of
   * silently overwriting the first and re-running the activation below.
   */
  expectedStatus?: string;
}): Promise<{ ok: true; executionRef: string; changed: boolean } | { ok: false; error: string }> {
  const { applicationId, decision, note, actorId, actorRole, expectedStatus } = input;

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
  const proposedSlug = String(application.proposed_store_slug || "").trim();

  // STORE-URL COLLISION GATE (V3-OWNER-CONTROL-01).
  //
  // `proposed_store_slug` is typed by the applicant and never checked for
  // uniqueness at submission. `marketplace_vendors.slug` carries a UNIQUE
  // constraint, and the approval below used to upsert `onConflict: "slug"` —
  // which is an UPDATE when the slug already exists, setting every supplied
  // column including `owner_user_id`. Store slugs are public (/store/[slug]).
  //
  // So: apply naming yourself as some existing seller's slug, wait for the
  // one-tap approve, and the approval hands you their store row, their vendor
  // role membership, and with it their catalogue and their payout balance. The
  // guard the rail already had was on the wrong entity — it verified the
  // APPLICATION was pending, and nothing verified the VENDOR row the write
  // actually lands on.
  //
  // Refuse the approval instead. The owner is told exactly what is wrong, and
  // no state moves: an applicant cannot be allowed to choose which row the
  // owner's button writes to.
  let existingVendorId: string | null = null;
  if (decision === "approved") {
    if (!proposedSlug) {
      return { ok: false, error: "That application has no store URL, so no store can be opened for it." };
    }
    const { data: slugHolder, error: slugError } = await admin
      .from("marketplace_vendors")
      .select("id, owner_user_id, status")
      .eq("slug", proposedSlug)
      .maybeSingle();
    if (slugError) {
      return { ok: false, error: "The store URL could not be checked; the seller was not approved." };
    }
    const holderOwnerId = slugHolder?.owner_user_id ? String(slugHolder.owner_user_id) : null;
    if (slugHolder && holderOwnerId !== applicantUserId) {
      return {
        ok: false,
        error: `The store URL "${proposedSlug}" already belongs to another seller. Ask the applicant to choose a different one before approving.`,
      };
    }

    // SUSPENDED-STORE GATE (V3-OWNER-CONTROL-01, round 2).
    //
    // The collision gate above deliberately PERMITS the case where the slug
    // holder is the applicant themselves — that is their own store, and
    // approving simply updates it. But `vendorPayload` below hardcodes
    // `status: "approved"` and the block after it reactivates the vendor role
    // membership. So if that self-held store is SUSPENDED, a one-tap "Approve
    // seller" quietly reinstates it.
    //
    // That is a bypass of this pass's own gate. `marketplace.vendor.reinstate`
    // requires a fresh password step-up and refuses anything not currently
    // suspended (the `not_suspended` branch of `owner_set_vendor_active`);
    // re-submitting an application is free and forces the row back to
    // `submitted` (apps/marketplace/app/api/seller-applications/route.ts:232),
    // so a suspended seller could re-apply and have the ungated approve button
    // undo their suspension. The rail's freshness check could not catch it: it
    // reads the APPLICATION's status and never looks at the vendor row the
    // write actually lands on — the same "guard was on the wrong entity" shape
    // as the slug-takeover above.
    //
    // Refuse, and name the control that is allowed to do this. Reinstatement is
    // a decision the owner should take deliberately about a store, not one that
    // arrives as a side effect of clearing an application queue.
    const holderStatus = String((slugHolder as { status?: unknown } | null)?.status ?? "").trim();
    if (slugHolder && holderStatus === "suspended") {
      return {
        ok: false,
        error: `"${proposedSlug}" is a suspended store. Approving this application would put it back online — use Reinstate store on the sellers panel if that is what you intend.`,
      };
    }

    existingVendorId = slugHolder?.id ? String(slugHolder.id) : null;
  }

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


  // THE STATUS FLIP RUNS FIRST, AND ITS FAILURE IS COMPENSATED. Both halves
  // matter, and the pass tried each one alone before arriving here.
  //
  // Flip-first alone was unrecoverable. The application committed `approved`,
  // then the vendor upsert or role grant failed, and because
  // SELLER_APPLICATION_PENDING excludes `approved` the route's legality gate
  // 409'd every retry forever: a record the console broke and could not heal.
  //
  // Flip-LAST alone was worse, and in a way that is easy to miss. It removes the
  // stuck record but opens an orphan: two owners deciding at once — one
  // approving, one rejecting — would have the approver create the store and
  // grant the vendor role, and only then lose the compare-and-set to the
  // rejection. Application `rejected`, storefront live, seller role granted. A
  // rejected applicant selling is a worse outcome than an approval that needs
  // retrying.
  //
  // So the CAS stays first, where losing it means NOTHING happened, and the
  // activation failures below restore the prior status instead of leaving the
  // row stranded. The result is retryable in the common case and orphan-free in
  // the racing case.
  //
  // Compensation can itself fail. That window is far narrower than what it
  // replaces (one UPDATE by primary key, against a row this request just wrote)
  // and it is logged loudly rather than swallowed.
  //
  // `vendor-status-write.ts` does the strictly correct thing — one guarded RPC
  // doing SELECT FOR UPDATE and every write in a single transaction — and that
  // is the right eventual home for this core too. It is not this pass, because
  // it means moving slug-collision resolution and role-grant logic into plpgsql.
  let statusUpdate = admin
    .from("marketplace_vendor_applications")
    .update({
      status: decision,
      review_note: note.trim() || null,
      reviewed_at: now,
      reviewed_by: actorId,
    } as never)
    .eq("id", applicationId);
  if (expectedStatus) statusUpdate = statusUpdate.eq("status", expectedStatus);
  const { data: statusUpdated, error: statusError } = await statusUpdate.select("id");
  if (statusError) {
    console.error("[seller-decision-write] status update failed", statusError.message);
    return { ok: false, error: "That application could not be updated." };
  }
  if (!Array.isArray(statusUpdated) || statusUpdated.length !== 1) {
    return {
      ok: false,
      error: "That application moved while you were deciding it. Refresh to see where it stands now.",
    };
  }

  /**
   * Put the application back where it was, so a failed activation leaves a row
   * the owner can decide again rather than one that is terminal and unusable.
   * Guarded on the status this request itself set, so it can never overwrite a
   * decision somebody else made in the meantime.
   */
  const revertStatusAfterFailedActivation = async (why: string): Promise<void> => {
    if (!expectedStatus) return;
    const { error: revertError } = await admin
      .from("marketplace_vendor_applications")
      .update({ status: expectedStatus, reviewed_at: null, reviewed_by: null } as never)
      .eq("id", applicationId)
      .eq("status", decision);
    if (revertError) {
      console.error(
        "[seller-decision-write] COULD NOT REVERT after failed activation — the application " +
          "reads approved but the seller was never activated, and the console cannot retry it",
        { applicationId, why, error: revertError.message },
      );
    }
  };

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

    // Written by id when the applicant already has this store, by insert when
    // they do not — never keyed on the applicant's own text. The old
    // `onConflict: "slug"` upsert let the applicant pick which row this write
    // landed on; see the collision gate above.
    const vendorPayload = {
      slug: proposedSlug,
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
    };

    const written = existingVendorId
      ? await admin
          .from("marketplace_vendors")
          .update(vendorPayload as never)
          .eq("id", existingVendorId)
          .select("id")
          .maybeSingle()
      : await admin
          .from("marketplace_vendors")
          .insert(vendorPayload as never)
          .select("id")
          .maybeSingle();

    if (written.error || !written.data) {
      await revertStatusAfterFailedActivation("vendor store write failed");
      return {
        ok: false,
        error: "The store record could not be written, so the seller was not activated.",
      };
    }
    const vendorId = String((written.data as { id: string }).id);

    // Read-then-write rather than upsert. The only unique index on
    // marketplace_role_memberships is an EXPRESSION index —
    // `(user_id, normalized_email, scope_type, coalesce(scope_id, '000…'), role)`
    // at marketplace_init.sql:539, confirmed on prod at
    // supabase/prod-actual/schema.sql:7018 — which PostgREST cannot name in
    // `onConflict`, so an upsert here degrades to a plain insert and a repeat
    // approval raises a unique violation instead of being a no-op. Learn teacher
    // grants already do it this way for the same reason.
    //
    // EVERY RESULT BELOW IS CHECKED, which none of them previously were. This is
    // the step that makes an approved seller able to sell: `/vendor` is gated by
    // `requireMarketplaceRoles`, which reads `marketplace_role_memberships`
    // ALONE (apps/marketplace/lib/marketplace/auth.ts:92-106). A silent failure
    // here therefore ends with the console saying "Done", the application
    // reading `approved`, the storefront row live — and the seller bounced to
    // /account when they try to open their workspace. That is materially the
    // same broken outcome as the incident this whole pass was commissioned to
    // fix, only harder to diagnose because every surface claims success.
    //
    // `.limit(1)` + array rather than `.maybeSingle()`: the expression index
    // permits near-duplicate rows that the four `.eq()` filters below cannot
    // distinguish (they do not constrain `normalized_email`), and `maybeSingle`
    // turns "two matches" into an ERROR. Reading one row and reactivating it is
    // the correct handling of that case; erroring is not.
    const { data: existingRows, error: membershipReadError } = await admin
      .from("marketplace_role_memberships")
      .select("id")
      .eq("user_id", application.user_id)
      .eq("scope_type", "vendor")
      .eq("scope_id", vendorId)
      .eq("role", "vendor")
      .limit(1);
    if (membershipReadError) {
      console.error(
        "[seller-decision-write] membership lookup failed",
        membershipReadError.message,
      );
      await revertStatusAfterFailedActivation("membership lookup failed");
      return { ok: false, error: GRANT_FAILED_MESSAGE };
    }

    const existingMembershipId = (existingRows ?? [])[0]?.id;
    const grant = existingMembershipId
      ? await admin
          .from("marketplace_role_memberships")
          .update({ is_active: true } as never)
          .eq("id", existingMembershipId)
          .select("id")
      : await admin
          .from("marketplace_role_memberships")
          .insert({
            user_id: application.user_id,
            normalized_email: application.normalized_email,
            scope_type: "vendor",
            scope_id: vendorId,
            role: "vendor",
            is_active: true,
          } as never)
          .select("id");

    if (grant.error || !Array.isArray(grant.data) || grant.data.length !== 1) {
      console.error(
        "[seller-decision-write] vendor role grant failed",
        grant.error?.message ?? "no row written",
      );
      await revertStatusAfterFailedActivation("vendor role grant failed");
      return { ok: false, error: GRANT_FAILED_MESSAGE };
    }
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

  return { ok: true, executionRef: `seller:${applicationId}:${decision}`, changed: true };
}
