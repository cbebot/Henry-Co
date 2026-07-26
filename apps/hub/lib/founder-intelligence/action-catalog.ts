import "server-only";

import type { ZodType } from "zod";
import { createAdminSupabase } from "@/lib/supabase";
import {
  applyCompanySettingsWrite,
  readCompanySettingsRow,
} from "@/lib/company-settings-write";
import { applyStaffStatusToggle, readStaffStatus } from "@/lib/staff-status-write";
import { applyKycReview, readKycSubmission, type KycDecision } from "@/lib/kyc-review-write";
import {
  applySellerDecision,
  readSellerApplication,
  type SellerDecision,
} from "@/lib/seller-decision-write";
import { applyDivisionStatus, readDivisionStatus } from "@/lib/division-status-write";
import { applySupportReply, readSupportThread } from "@/lib/support-reply-write";
import { postToX, readXCreds } from "@/lib/social/x-client";
import {
  applyProductReview,
  readProductReview,
  type ProductReviewDecision,
} from "@/lib/product-review-write";
import { applySecureAccount, readSecureAccountTarget } from "@/lib/security-response-write";
import {
  brandSettingsGovernance,
  staffStatusGovernance,
  kycReviewGovernance,
  sellerDecisionGovernance,
  divisionStatusGovernance,
  supportReplyGovernance,
  socialPostGovernance,
  supportReplyBatchGovernance,
  productReviewGovernance,
  securitySecureAccountGovernance,
  studioProposalSendGovernance,
  studioDeployApproveGovernance,
  studioJobCancelGovernance,
  studioJobBudgetIncreaseGovernance,
  studioJobPauseGovernance,
  studioJobResumeGovernance,
  studioClientReplyGovernance,
  type FounderActionGovernance,
} from "./action-governance";
import {
  applyStudioClientReply,
  applyStudioDeployApprove,
  applyStudioJobBudgetIncrease,
  applyStudioJobCancel,
  applyStudioJobHold,
  applyStudioProposalSend,
  readStudioJobForBudgetIncrease,
  readStudioJobForCancel,
  readStudioJobForDeployApprove,
  readStudioJobForHold,
  readStudioProjectForReply,
  readStudioProposalForSend,
} from "@/lib/studio-agency-write";
import { formatNairaFromKobo } from "./studio-agency-model";

/**
 * Founder Intelligence F3 — THE closed write-action catalog.
 *
 * The F3 analogue of the F2 navigation catalog: the ONLY way the founder's
 * assistant can affect state. The AI names a `key` and fills the declared
 * params; the server does everything else. Adding an action = adding one entry
 * here, which keeps the write surface closed and greppable.
 *
 * Governance baked into the shape (the adversarial-audit fixes, 2026-07-10):
 *  - paramsSchema is `.strict()` — unknown keys are REJECTED, and no money
 *    entry may declare a free amount field (asserted by a test gate).
 *  - ownerPermission is "founder-only": every entry re-checks that the caller
 *    is the owner (is_owner), NEVER inherits a division-role union — an AI is
 *    in the loop, so the gate is founder-only by construction.
 *  - moneyAdjacent forces requiresReauth (asserted): "reversible" never
 *    substitutes for "no cash effect".
 *  - trueStateReader is a SERVER read of the record; driftKeys are re-read at
 *    confirm and any change aborts to a fresh card.
 *  - executionBinding calls the EXACT existing guarded write path (the shared
 *    core the human console also calls), with a server-derived idempotency key.
 */

export type FounderActionTrueState = Record<string, unknown>;

export type FounderActionResolveContext = {
  /** The validated params (post-strict-parse). */
  params: Record<string, unknown>;
};

export type FounderActionExecuteContext = {
  params: Record<string, unknown>;
  trueState: FounderActionTrueState;
  ownerId: string;
  ownerRole: string;
  /** Deterministic per-proposal token — the idempotency anchor. */
  token: string;
};

export type FounderActionEntry = FounderActionGovernance & {
  /** Owner-facing action name (company voice, no exclamation). */
  title: string;
  /** Whitelists + coerces the AI-fillable params. MUST be `.strict()`. */
  paramsSchema: ZodType;
  /** Server read of the record; null = missing/ineligible → no card. */
  trueStateReader: (ctx: FounderActionResolveContext) => Promise<FounderActionTrueState | null>;
  /** Card copy, rendered against the true state. */
  confirmationCopy: (trueState: FounderActionTrueState, params: Record<string, unknown>) => {
    title: string;
    body: string;
    confirmLabel: string;
  };
  /** Executes THROUGH the existing guarded path; returns an execution ref. */
  executionBinding: (ctx: FounderActionExecuteContext) => Promise<
    { ok: true; executionRef: string } | { ok: false; error: string }
  >;
  auditAction: string;
  entityType: string;
};

// ── Entry 1: brand settings text update (content, reversible, no money) ──────
//
// The AI may propose changing ONE branding text field to a new value. The value
// is caller-authored (allowed: it is content, never money), and the owner sees
// the exact old→new on the card before confirming. Deliberately EXCLUDES
// support_phone (trust invariant: the number lives at exactly one line and is
// never surfaced), media, and socials.

const brandSettingsUpdate: FounderActionEntry = {
  ...brandSettingsGovernance,
  title: "Update a brand text field",
  trueStateReader: async ({ params }) => {
    const row = await readCompanySettingsRow();
    const field = params.field as string;
    return {
      settingsId: row?.id ?? null,
      field,
      currentValue: (row?.[field] as string | null) ?? null,
      newValue: params.text as string,
      // Full current row snapshot so the binding can merge onto it (avoids the
      // normalizeCompanySettings defaults-fill trap on a single-field patch).
      currentRow: row,
    };
  },
  // driftKeys is single-sourced from the governance descriptor (spread above);
  // never re-declare it here or the confirm-route drift check can silently use
  // a stale value (review finding, 2026-07-10).
  confirmationCopy: (trueState) => ({
    title: "Update brand text",
    body: `Change ${String(trueState.field)} from "${trueState.currentValue ?? "(empty)"}" to "${trueState.newValue}". This updates the public site.`,
    confirmLabel: "Update text",
  }),
  executionBinding: async ({ trueState }) => {
    const currentRow = (trueState.currentRow as Record<string, unknown> | null) ?? {};
    const field = String(trueState.field);
    const merged = { ...currentRow, [field]: trueState.newValue };
    const result = await applyCompanySettingsWrite(merged);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, executionRef: `company_settings:${field}` };
  },
  auditAction: "founder.owner.brand.settings.update",
  entityType: "company_settings",
};

// ── Entry 2: staff suspend / reactivate (identity, reversible, no money) ─────

const staffStatusToggle: FounderActionEntry = {
  ...staffStatusGovernance,
  title: "Suspend or reactivate a staff account",
  trueStateReader: async ({ params }) => {
    const status = await readStaffStatus(params.userId as string);
    if (!status) return null;
    const intent = params.intent as "suspend" | "reactivate";
    // No-op guard at PROPOSE: proposing the state the account is already in
    // returns null, so no misleading confirmation card is ever shown for a
    // redundant toggle (review finding, 2026-07-10). The execute binding keeps
    // its own guard as defense-in-depth.
    if ((intent === "suspend") === status.suspended) {
      return null;
    }
    return { ...status, intent, alreadyInTargetState: false };
  },
  // driftKeys single-sourced from the governance spread (see above).
  confirmationCopy: (trueState) => {
    const intent = String(trueState.intent);
    const email = String(trueState.email ?? "this account");
    return {
      title: intent === "suspend" ? "Suspend staff access" : "Reactivate staff access",
      body:
        intent === "suspend"
          ? `Suspend access for ${email}. They lose sign-in until reactivated.`
          : `Reactivate access for ${email}. They can sign in again.`,
      confirmLabel: intent === "suspend" ? "Suspend access" : "Reactivate access",
    };
  },
  executionBinding: async ({ trueState, ownerId, ownerRole }) => {
    if (trueState.alreadyInTargetState === true) {
      return { ok: false, error: "This account is already in that state." };
    }
    const applied = await applyStaffStatusToggle({
      userId: String(trueState.userId),
      intent: trueState.intent as "suspend" | "reactivate",
      actorId: ownerId,
      actorRole: ownerRole,
    });
    if (!applied.ok) return { ok: false, error: applied.error };
    return { ok: true, executionRef: `staff:${String(trueState.userId)}:${String(trueState.intent)}` };
  },
  auditAction: "founder.owner.staff.status.toggle",
  entityType: "staff",
};

// ── Entry 3: identity-verification (KYC) review — tranche 2, no money ────────
//
// The owner can clear or reject a customer's identity submission from HQ. The
// binding runs the EXACT hub-local core that mirrors apps/staff /api/kyc/review
// (audit-first-abort → submission update → verified/pending/rejected profile
// derivation → activity + notification). The model can only name a submission
// and a decision; the value/effect is server-derived.

const kycReview: FounderActionEntry = {
  ...kycReviewGovernance,
  title: "Approve or reject an identity verification",
  trueStateReader: async ({ params }) => {
    const state = await readKycSubmission(params.submissionId as string);
    if (!state) return null;
    const decision = params.decision as string;
    // No-op guard at PROPOSE: proposing the state the submission is already in
    // shows no misleading card (the binding keeps its own guard too).
    if (state.status === decision) return null;
    return { ...state, decision, note: (params.note as string) ?? "" };
  },
  // driftKeys single-sourced from the governance spread (["status"]).
  confirmationCopy: (trueState) => {
    const decision = String(trueState.decision);
    const who = String(trueState.userEmail || "this customer");
    const doc = String(trueState.documentType) || "identity";
    return {
      title: decision === "approved" ? "Approve identity verification" : "Reject identity verification",
      body:
        decision === "approved"
          ? `Approve the ${doc} submission for ${who}. If a government ID or selfie is now approved, their account becomes Verified and they are notified.`
          : `Reject the ${doc} submission for ${who} and ask for more information. They are notified.`,
      confirmLabel: decision === "approved" ? "Approve verification" : "Reject verification",
    };
  },
  executionBinding: async ({ trueState, ownerId, ownerRole }) => {
    const applied = await applyKycReview({
      submissionId: String(trueState.submissionId),
      decision: trueState.decision as KycDecision,
      note: String(trueState.note ?? ""),
      actorId: ownerId,
      actorRole: ownerRole,
    });
    if (!applied.ok) return { ok: false, error: applied.error };
    return { ok: true, executionRef: applied.executionRef };
  },
  auditAction: "founder.owner.kyc.review",
  entityType: "customer_verification_submission",
};

// ── Entry 4: marketplace seller (vendor) application decision — tranche 2 ────
//
// The owner can approve / request changes / reject a seller application from HQ.
// The binding runs the hub-local core mirroring the marketplace staff console:
// on approval it activates the vendor store + grants the vendor role. No money
// field — the model names an application + a decision only.

const sellerDecision: FounderActionEntry = {
  ...sellerDecisionGovernance,
  title: "Approve, reject, or request changes on a seller application",
  trueStateReader: async ({ params }) => {
    const state = await readSellerApplication(params.applicationId as string);
    if (!state) return null;
    const decision = params.decision as string;
    if (state.status === decision) return null;
    return { ...state, decision, note: (params.note as string) ?? "" };
  },
  // driftKeys single-sourced from the governance spread (["status"]).
  confirmationCopy: (trueState) => {
    const decision = String(trueState.decision);
    const store = String(trueState.storeName || "this store");
    const who = String(trueState.userEmail || "the applicant");
    if (decision === "approved") {
      return {
        title: "Approve seller application",
        body: `Approve ${store} (${who}) to sell on the marketplace — this activates their vendor store and grants the seller role. They are notified.`,
        confirmLabel: "Approve seller",
      };
    }
    if (decision === "changes_requested") {
      return {
        title: "Request changes to seller application",
        body: `Ask ${store} (${who}) for changes before approval. They are notified with your note.`,
        confirmLabel: "Request changes",
      };
    }
    return {
      title: "Reject seller application",
      body: `Reject the seller application for ${store} (${who}). They are notified.`,
      confirmLabel: "Reject seller",
    };
  },
  executionBinding: async ({ trueState, ownerId, ownerRole }) => {
    const applied = await applySellerDecision({
      applicationId: String(trueState.applicationId),
      decision: trueState.decision as SellerDecision,
      note: String(trueState.note ?? ""),
      actorId: ownerId,
      actorRole: ownerRole,
    });
    if (!applied.ok) return { ok: false, error: applied.error };
    return { ok: true, executionRef: applied.executionRef };
  },
  auditAction: "founder.owner.marketplace.seller.decision",
  entityType: "marketplace_vendor_application",
};

// ── Entry 5: division pause / resume (operations, reversible, REAUTH) ────────
//
// "Pause care" by voice. Removing a division from every public surface is a
// deep action, so the governance demands the founder's print (fresh password
// step-up) at confirm even though no money moves. Writes the same
// company_divisions.status the settings page writes; the public live-divisions
// filter reacts within a minute.

const divisionStatus: FounderActionEntry = {
  ...divisionStatusGovernance,
  title: "Pause or resume a division",
  trueStateReader: async ({ params }) => {
    const state = await readDivisionStatus(params.slug as string);
    if (!state) return null;
    const intent = params.intent as "pause" | "resume";
    const targetStatus = intent === "pause" ? "paused" : "active";
    // No-op guard at PROPOSE: already in the target state → no card.
    if (state.status === targetStatus) return null;
    return { ...state, intent };
  },
  // driftKeys single-sourced from the governance spread (["status"]).
  confirmationCopy: (trueState) => {
    const name = String(trueState.name || trueState.slug);
    const intent = String(trueState.intent);
    return intent === "pause"
      ? {
          title: `Pause ${name}`,
          body: `Pause the ${name} division. It disappears from every public footer and listing within a minute; nothing is deleted and resume restores it instantly.`,
          confirmLabel: "Pause division",
        }
      : {
          title: `Resume ${name}`,
          body: `Bring the ${name} division back live. It returns to every public surface within a minute.`,
          confirmLabel: "Resume division",
        };
  },
  executionBinding: async ({ trueState, ownerId, ownerRole }) => {
    const applied = await applyDivisionStatus({
      slug: String(trueState.slug),
      intent: trueState.intent as "pause" | "resume",
      actorId: ownerId,
      actorRole: ownerRole,
    });
    if (!applied.ok) return { ok: false, error: applied.error };
    return { ok: true, executionRef: applied.executionRef };
  },
  auditAction: "founder.owner.division.status.set",
  entityType: "company_division",
};

// ── Entry 6: support reply (comms, hard-to-reverse, caller-authored body) ────
//
// The AI composes the reply; the OWNER reads the exact text on the card and
// confirms; the core posts it through the same support_messages spine the
// staff console uses. A sent message cannot be unsent — the copy says so.

const supportReply: FounderActionEntry = {
  ...supportReplyGovernance,
  title: "Reply to a support thread as the team",
  trueStateReader: async ({ params }) => {
    const state = await readSupportThread(params.threadId as string);
    if (!state) return null;
    return { ...state, threadId: state.id, body: params.body as string };
  },
  // driftKeys single-sourced from the governance spread (["status"]).
  confirmationCopy: (trueState) => ({
    title: `Reply to "${String(trueState.subject)}"`,
    body: `Send this reply to the customer (it cannot be unsent):\n\n"${String(trueState.body)}"`,
    confirmLabel: "Send the reply",
  }),
  executionBinding: async ({ trueState, ownerId, ownerRole }) => {
    const applied = await applySupportReply({
      threadId: String(trueState.threadId),
      body: String(trueState.body),
      actorId: ownerId,
      actorRole: ownerRole,
    });
    if (!applied.ok) return { ok: false, error: applied.error };
    return { ok: true, executionRef: applied.executionRef };
  },
  auditAction: "founder.owner.support.reply",
  entityType: "support_thread",
};

// ── Entry 7: social post to X (public voice, IRREVERSIBLE, reauth) ───────────
//
// The AI composes; the OWNER reads the exact text on the card, passes the
// print (requiresReauth), and only then does the post publish through the
// company's X account (OAuth 1.0a — non-expiring bot tokens, no refresh
// rotation to burn). No card is ever shown while X isn't connected.

const socialPost: FounderActionEntry = {
  ...socialPostGovernance,
  title: "Post to the company X account",
  trueStateReader: async ({ params }) => {
    if (params.platform !== "x") return null;
    const platformReady = Boolean(readXCreds());
    if (!platformReady) return null;
    return { platform: "x", platformReady: true, text: params.text as string };
  },
  // driftKeys single-sourced from the governance spread (["platformReady"]).
  confirmationCopy: (trueState) => ({
    title: "Post to X",
    body: `Publish this to the company X account — a public post cannot be unpublished:\n\n"${String(trueState.text)}"`,
    confirmLabel: "Post to X",
  }),
  executionBinding: async ({ trueState, ownerId, ownerRole }) => {
    // AUDIT-FIRST-ABORT, matching every core: no trail, no post.
    const admin = createAdminSupabase();
    const { error: auditError } = await admin.from("staff_audit_logs").insert({
      actor_id: ownerId,
      actor_role: ownerRole || "owner",
      action: "social.post.x",
      entity: "social_post",
      entity_id: null,
      meta: { via: "founder_action", platform: "x", chars: String(trueState.text).length },
    } as never);
    if (auditError) {
      return { ok: false, error: "Audit logging failed; nothing was posted." };
    }
    const posted = await postToX(String(trueState.text));
    if (!posted.ok) return { ok: false, error: posted.error };
    return { ok: true, executionRef: `social:x:${posted.tweetId}` };
  },
  auditAction: "founder.owner.social.post",
  entityType: "social_post",
};

// ── Entry 8: BATCH support replies (compose many, confirm once) ──────────────
//
// "Reply to all of them" — the AI composes a reply per thread; the card lists
// EVERY reply verbatim; one confirm (behind the print — mass outbound) sends
// them one by one through the same core as the single reply. Threads that
// closed since composing are dropped at propose; if the ready set changes
// between card and confirm, the driftKey (readyCount) aborts to a fresh card.

const supportReplyBatch: FounderActionEntry = {
  ...supportReplyBatchGovernance,
  title: "Send replies to several support threads",
  trueStateReader: async ({ params }) => {
    const raw = params.replies as Array<{ threadId: string; body: string }>;
    const items: Array<{ threadId: string; subject: string; division: string; body: string }> = [];
    for (const reply of raw) {
      const thread = await readSupportThread(reply.threadId);
      if (!thread) continue; // gone or closed — dropped from the batch
      items.push({
        threadId: thread.id,
        subject: thread.subject,
        division: thread.division,
        body: reply.body,
      });
    }
    if (items.length === 0) return null;
    return { readyCount: items.length, items };
  },
  // driftKeys single-sourced from the governance spread (["readyCount"]).
  confirmationCopy: (trueState) => {
    const items = trueState.items as Array<{ subject: string; body: string }>;
    const lines = items
      .map((item, i) => `${i + 1}. "${item.subject}" → "${item.body}"`)
      .join("\n\n");
    return {
      title: `Send ${items.length} ${items.length === 1 ? "reply" : "replies"}`,
      body: `These go out as the team, one by one — sent messages cannot be unsent:\n\n${lines}`,
      confirmLabel: `Send ${items.length} ${items.length === 1 ? "reply" : "replies"}`,
    };
  },
  executionBinding: async ({ trueState, ownerId, ownerRole }) => {
    const items = trueState.items as Array<{ threadId: string; body: string }>;
    let sent = 0;
    let firstError: string | null = null;
    // Sequential on purpose: each reply audits + notifies independently, and a
    // mid-batch failure must not abort the ones already sent — the ref reports
    // the honest count.
    for (const item of items) {
      const applied = await applySupportReply({
        threadId: item.threadId,
        body: item.body,
        actorId: ownerId,
        actorRole: ownerRole,
      });
      if (applied.ok) sent += 1;
      else if (!firstError) firstError = applied.error;
    }
    if (sent === 0) {
      return { ok: false, error: firstError || "None of the replies could be sent." };
    }
    return { ok: true, executionRef: `support:batch:${sent}/${items.length}` };
  },
  auditAction: "founder.owner.support.reply_batch",
  entityType: "support_thread",
};

// ── Entry 9: marketplace product review (catalog verdicts, reversible) ───────
//
// "Approve the new product from <store>" — mirrors the marketplace console's
// admin_product_decision write; the vendor is notified with the verdict.

const productReview: FounderActionEntry = {
  ...productReviewGovernance,
  title: "Approve, reject, or request changes on a product",
  trueStateReader: async ({ params }) => {
    const state = await readProductReview(params.productId as string);
    if (!state) return null;
    const decision = params.decision as string;
    if (state.status === decision) return null; // no-op guard at propose
    return { ...state, decision, note: (params.note as string) ?? "" };
  },
  // driftKeys single-sourced from the governance spread (["status"]).
  confirmationCopy: (trueState) => {
    const decision = String(trueState.decision);
    const title = String(trueState.title);
    const store = String(trueState.vendorStore);
    if (decision === "approved") {
      return {
        title: "Approve product",
        body: `Approve "${title}" from ${store} — it goes live in the catalog. The seller is notified.`,
        confirmLabel: "Approve product",
      };
    }
    if (decision === "changes_requested") {
      return {
        title: "Request product changes",
        body: `Ask ${store} for changes to "${title}" before it can go live. They are notified with your note.`,
        confirmLabel: "Request changes",
      };
    }
    return {
      title: "Reject product",
      body: `Reject "${title}" from ${store}. It stays out of the catalog; the seller is notified.`,
      confirmLabel: "Reject product",
    };
  },
  executionBinding: async ({ trueState, ownerId, ownerRole }) => {
    const applied = await applyProductReview({
      productId: String(trueState.productId),
      decision: trueState.decision as ProductReviewDecision,
      note: String(trueState.note ?? ""),
      actorId: ownerId,
      actorRole: ownerRole,
    });
    if (!applied.ok) return { ok: false, error: applied.error };
    return { ok: true, executionRef: applied.executionRef };
  },
  auditAction: "founder.owner.marketplace.product.review",
  entityType: "marketplace_product",
};

// ── Entry 10: secure a customer account (containment, hard-to-reverse, REAUTH) ─
//
// The "respond" verb of the Threat watch. When an account shows a takeover
// pattern, the owner names it and, behind the print, revokes every recognised
// device — each must re-verify + re-alert on its next sign-in. Honest copy: this
// forces re-verification, it does not instantly kill a live token.

const secureAccount: FounderActionEntry = {
  ...securitySecureAccountGovernance,
  title: "Secure a customer account under attack",
  trueStateReader: async ({ params }) => {
    const target = await readSecureAccountTarget(params.userId as string);
    if (!target) return null;
    return { ...target };
  },
  // driftKeys single-sourced from the governance spread (["activeDeviceCount"]).
  confirmationCopy: (trueState) => {
    const who = String(trueState.userLabel || "this account");
    const count = Number(trueState.activeDeviceCount ?? 0);
    return {
      title: "Secure this account",
      body: `Secure ${who}: revoke ${count === 0 ? "its recognised devices" : `all ${count} recognised device${count === 1 ? "" : "s"}`} so each must re-verify and re-alert on the next sign-in, and drop every trusted mark. Their in-flight token expires normally; this stops the attacker's device from being remembered.`,
      confirmLabel: "Secure account",
    };
  },
  executionBinding: async ({ trueState, ownerId, ownerRole }) => {
    const applied = await applySecureAccount({
      userId: String(trueState.userId),
      actorId: ownerId,
      actorRole: ownerRole,
    });
    if (!applied.ok) return { ok: false, error: applied.error };
    return { ok: true, executionRef: applied.executionRef };
  },
  auditAction: "founder.owner.security.account.secure",
  entityType: "customer_account",
};

// ── Tranche 3 — SA-4 studio-agency operator actions ──────────────────────────
// Bindings are hub-local service-role mirrors of the studio console's guarded
// writes (lib/studio-agency-write.ts); the DB transition trigger + write-once
// approved_artifact_hash are the second wall. All dark until
// FOUNDER_ACTIONS_TRANCHE>=3 and null-carded until STUDIO_AGENCY_LIVE=1
// (every reader checks the agency flag first).

// ── Entry 11: release a held studio proposal (SA-D5 one-tap release) ─────────
const studioProposalSend: FounderActionEntry = {
  ...studioProposalSendGovernance,
  title: "Send a reviewed studio proposal to the client",
  trueStateReader: async ({ params }) => readStudioProposalForSend(params.proposalId as string),
  confirmationCopy: (trueState) => ({
    title: "Send this proposal",
    body: `Release "${String(trueState.title)}" to the client. They see it in their portal immediately — a sent proposal cannot be unsent.`,
    confirmLabel: "Send proposal",
  }),
  executionBinding: async ({ trueState, ownerId }) =>
    applyStudioProposalSend({ proposalId: String(trueState.proposalId), actorId: ownerId }),
  auditAction: "founder.owner.studio.proposal.send",
  entityType: "studio_proposal",
};

// ── Entry 12: approve a build for production deploy (HARD GATE, reauth) ──────
const studioDeployApprove: FounderActionEntry = {
  ...studioDeployApproveGovernance,
  title: "Approve a studio build for production deploy",
  trueStateReader: async ({ params }) => readStudioJobForDeployApprove(params.jobId as string),
  confirmationCopy: (trueState) => ({
    title: `Approve deploy — ${String(trueState.projectTitle)}`,
    body: `Approve this reviewed build for production. The deploy is pinned to the exact build you are approving (${String(trueState.artifactHash).slice(0, 12)}…) — a later change can never ship under this approval. Spend so far ${formatNairaFromKobo(Number(trueState.costKobo))} of ${formatNairaFromKobo(Number(trueState.budgetKobo))}.`,
    confirmLabel: "Approve deploy",
  }),
  executionBinding: async ({ trueState, ownerId }) =>
    applyStudioDeployApprove({
      jobId: String(trueState.jobId),
      artifactHash: String(trueState.artifactHash),
      actorId: ownerId,
    }),
  auditAction: "founder.owner.studio.deploy.approve",
  entityType: "studio_build_job",
};

// ── Entry 13: cancel a build job (reauth — refund policy follows) ────────────
const studioJobCancel: FounderActionEntry = {
  ...studioJobCancelGovernance,
  title: "Cancel a studio build job",
  trueStateReader: async ({ params }) => readStudioJobForCancel(params.jobId as string),
  confirmationCopy: (trueState) => ({
    title: `Cancel build — ${String(trueState.projectTitle)}`,
    body: `Stop this build job (currently ${String(trueState.stage).replace(/_/g, " ")}). Nothing ships; any refund follows the standard policy through the existing rails. This cannot be undone for this job.`,
    confirmLabel: "Cancel the job",
  }),
  executionBinding: async ({ trueState, ownerId }) =>
    applyStudioJobCancel({ jobId: String(trueState.jobId), actorId: ownerId }),
  auditAction: "founder.owner.studio.job.cancel",
  entityType: "studio_build_job",
};

// ── Entry 14: raise a job's cost envelope (money-adjacent, reauth) ───────────
const studioJobBudgetIncrease: FounderActionEntry = {
  ...studioJobBudgetIncreaseGovernance,
  title: "Raise a build job's cost envelope",
  trueStateReader: async ({ params }) =>
    readStudioJobForBudgetIncrease(params.jobId as string, params.step as "10" | "25" | "50"),
  confirmationCopy: (trueState) => ({
    title: `Raise the envelope — ${String(trueState.projectTitle)}`,
    body: `Raise this job's cost envelope by ${String(trueState.step)}%: ${formatNairaFromKobo(Number(trueState.budgetKobo))} → ${formatNairaFromKobo(Number(trueState.newBudgetKobo))} (computed by the server from the preset step). Spend so far ${formatNairaFromKobo(Number(trueState.costKobo))}. A stalled job resumes on the new envelope.`,
    confirmLabel: "Raise envelope",
  }),
  executionBinding: async ({ trueState, ownerId }) =>
    applyStudioJobBudgetIncrease({
      jobId: String(trueState.jobId),
      step: String(trueState.step) as "10" | "25" | "50",
      actorId: ownerId,
    }),
  auditAction: "founder.owner.studio.job.budget_increase",
  entityType: "studio_build_job",
};

// ── Entry 15/16: pause / resume a job (claim-hold, reversible) ───────────────
const studioJobPause: FounderActionEntry = {
  ...studioJobPauseGovernance,
  title: "Pause a studio build job",
  trueStateReader: async ({ params }) => readStudioJobForHold(params.jobId as string, "pause"),
  confirmationCopy: (trueState) => ({
    title: `Pause build — ${String(trueState.projectTitle)}`,
    body: `Hold this job where it is (${String(trueState.stage).replace(/_/g, " ")}). The orchestrator will not touch it — including stall watching — until you resume it.`,
    confirmLabel: "Pause the job",
  }),
  executionBinding: async ({ trueState, ownerId }) =>
    applyStudioJobHold({ jobId: String(trueState.jobId), intent: "pause", actorId: ownerId }),
  auditAction: "founder.owner.studio.job.pause",
  entityType: "studio_build_job",
};

const studioJobResume: FounderActionEntry = {
  ...studioJobResumeGovernance,
  title: "Resume a paused studio build job",
  trueStateReader: async ({ params }) => readStudioJobForHold(params.jobId as string, "resume"),
  confirmationCopy: (trueState) => ({
    title: `Resume build — ${String(trueState.projectTitle)}`,
    body: `Release the hold on this job (${String(trueState.stage).replace(/_/g, " ")}). The orchestrator picks it back up on its next pass.`,
    confirmLabel: "Resume the job",
  }),
  executionBinding: async ({ trueState, ownerId }) =>
    applyStudioJobHold({ jobId: String(trueState.jobId), intent: "resume", actorId: ownerId }),
  auditAction: "founder.owner.studio.job.resume",
  entityType: "studio_build_job",
};

// ── Entry 17: send an AI-drafted reply into a client project thread ──────────
const studioClientReply: FounderActionEntry = {
  ...studioClientReplyGovernance,
  title: "Reply in a studio client's project thread",
  trueStateReader: async ({ params }) => {
    const state = await readStudioProjectForReply(params.projectId as string);
    if (!state) return null;
    return { ...state, body: params.body as string };
  },
  confirmationCopy: (trueState) => ({
    title: `Reply to ${String(trueState.projectTitle)}`,
    body: `Send this to the client's project thread (it is contact-safety screened, and it cannot be unsent):\n\n"${String(trueState.body)}"`,
    confirmLabel: "Send the reply",
  }),
  executionBinding: async ({ trueState, ownerId }) =>
    applyStudioClientReply({
      projectId: String(trueState.projectId),
      body: String(trueState.body),
      actorId: ownerId,
    }),
  auditAction: "founder.owner.studio.client.reply",
  entityType: "studio_project",
};

export const FOUNDER_ACTION_CATALOG: Record<string, FounderActionEntry> = {
  [brandSettingsUpdate.key]: brandSettingsUpdate,
  [staffStatusToggle.key]: staffStatusToggle,
  [kycReview.key]: kycReview,
  [sellerDecision.key]: sellerDecision,
  [divisionStatus.key]: divisionStatus,
  [supportReply.key]: supportReply,
  [socialPost.key]: socialPost,
  [supportReplyBatch.key]: supportReplyBatch,
  [productReview.key]: productReview,
  [secureAccount.key]: secureAccount,
  [studioProposalSend.key]: studioProposalSend,
  [studioDeployApprove.key]: studioDeployApprove,
  [studioJobCancel.key]: studioJobCancel,
  [studioJobBudgetIncrease.key]: studioJobBudgetIncrease,
  [studioJobPause.key]: studioJobPause,
  [studioJobResume.key]: studioJobResume,
  [studioClientReply.key]: studioClientReply,
};

/** Own-property lookup (prototype-key probes resolve to undefined). */
export function getFounderAction(key: string): FounderActionEntry | undefined {
  if (!Object.prototype.hasOwnProperty.call(FOUNDER_ACTION_CATALOG, key)) return undefined;
  return FOUNDER_ACTION_CATALOG[key];
}

/**
 * The catalog rendered for the system prompt — key, title, and the exact param
 * names + allowed values each action accepts. Only entries at or below the
 * live tranche are shown, so a dark tranche is invisible to the model.
 */
export function listFounderActionsForPrompt(maxTranche: number): string {
  return Object.values(FOUNDER_ACTION_CATALOG)
    .filter((entry) => entry.tranche <= maxTranche)
    .map((entry) => {
      const shape = (entry.paramsSchema as unknown as { shape?: Record<string, unknown> }).shape;
      const params = shape ? Object.keys(shape).join(", ") : "(see schema)";
      return `${entry.key} — ${entry.title}. params: ${params}`;
    })
    .join("\n");
}

/** For the tests + the CI no-money-field gate. */
export function paramsSchemaKeys(entry: FounderActionEntry): string[] {
  const shape = (entry.paramsSchema as unknown as { shape?: Record<string, unknown> }).shape;
  return shape ? Object.keys(shape) : [];
}

export { createAdminSupabase };
