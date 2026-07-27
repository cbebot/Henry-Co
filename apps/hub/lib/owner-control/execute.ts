import "server-only";

import { readSellerApplication, applySellerDecision } from "@/lib/seller-decision-write";
import { readProductReview, applyProductReview } from "@/lib/product-review-write";
import { readKycSubmission, applyKycReview } from "@/lib/kyc-review-write";
import {
  readLearnTeacherApplication,
  applyLearnTeacherDecision,
} from "@/lib/learn-teacher-decision-write";
import { readVendorStatus, applyVendorStatus } from "@/lib/vendor-status-write";
import { readModerationQueueItem, applyModerationVerdict } from "@/lib/moderation-resolve-write";
import type { OwnerControlAction } from "./registry";

/**
 * V3-OWNER-CONTROL-01 — the execution bindings.
 *
 * Every action in the registry maps to an EXISTING hub-local write core, or to
 * one added by this pass built to the same shape. Nothing here re-implements a
 * state transition: the point of the pass is that the owner reaches the write
 * paths the product already trusts, not that HQ grows a parallel set.
 *
 * Each core is audit-first-abort — the `staff_audit_logs` row is written before
 * the state moves and its failure aborts the mutation. So "no trail, no action"
 * holds beneath the ledger the route keeps as well, and an action is recorded
 * in two independent places before anything changes.
 */

/** The freshly-read state an action is judged against. */
export type OwnerControlEntityState = {
  /** Current lifecycle status — matched against the action's `fromStates`. */
  status: string;
  /** Human-readable subject, for audit payloads and operator messages. */
  subject: string;
  /** The affected end user, when the entity has one. */
  subjectUserId: string | null;
};

export type OwnerControlExecution =
  | { ok: true; executionRef: string; changed: boolean }
  | { ok: false; error: string };

/**
 * Re-read live state for the entity an action names. Called by the route
 * IMMEDIATELY BEFORE executing, never trusting whatever the queue rendered:
 * an approvals page held open in a tab is a snapshot, and acting on a snapshot
 * is how a seller already rejected gets approved by a stale click.
 *
 * Returns null when the entity does not exist — which the route reports as the
 * same opaque refusal it uses for authorization failures, so this endpoint
 * cannot be walked as an existence oracle for ids the caller guesses.
 */
export async function readOwnerControlState(
  action: OwnerControlAction,
  entityId: string,
): Promise<OwnerControlEntityState | null> {
  switch (action.entityType) {
    case "marketplace_vendor_application": {
      const state = await readSellerApplication(entityId);
      return state
        ? { status: state.status, subject: state.storeName, subjectUserId: state.userId }
        : null;
    }
    case "marketplace_vendor": {
      const state = await readVendorStatus(entityId);
      return state ? { status: state.status, subject: state.name, subjectUserId: state.ownerUserId } : null;
    }
    case "marketplace_product": {
      const state = await readProductReview(entityId);
      return state
        ? { status: state.status, subject: state.title, subjectUserId: state.vendorUserId }
        : null;
    }
    case "customer_verification_submission": {
      const state = await readKycSubmission(entityId);
      return state
        ? { status: state.status, subject: state.documentType, subjectUserId: state.userId }
        : null;
    }
    case "learn_teacher_application": {
      const state = await readLearnTeacherApplication(entityId);
      return state ? { status: state.status, subject: state.fullName, subjectUserId: state.userId } : null;
    }
    case "platform_moderation_queue": {
      const state = await readModerationQueueItem(entityId);
      return state
        ? {
            status: state.status,
            subject: `${state.division} · ${state.entityType}`,
            subjectUserId: null,
          }
        : null;
    }
    default:
      return null;
  }
}

/**
 * Run the action. `priorStatus` is the state the route verified a moment ago and
 * is passed down so cores that support compare-and-set can anchor on it.
 */
export async function executeOwnerControlAction(input: {
  action: OwnerControlAction;
  entityId: string;
  note: string;
  actorId: string;
  actorRole: string;
  priorStatus: string;
}): Promise<OwnerControlExecution> {
  const { action, entityId, note, actorId, actorRole, priorStatus } = input;
  const common = { note, actorId, actorRole };

  switch (action.key) {
    case "marketplace.seller.approve":
    case "marketplace.seller.request_changes":
    case "marketplace.seller.reject": {
      const decision =
        action.key === "marketplace.seller.approve"
          ? "approved"
          : action.key === "marketplace.seller.reject"
            ? "rejected"
            : "changes_requested";
      const result = await applySellerDecision({ applicationId: entityId, decision, ...common });
      return result.ok
        ? { ok: true, executionRef: result.executionRef, changed: true }
        : { ok: false, error: result.error };
    }

    case "marketplace.vendor.suspend":
    case "marketplace.vendor.reinstate": {
      const result = await applyVendorStatus({
        vendorId: entityId,
        intent: action.key === "marketplace.vendor.suspend" ? "suspend" : "reinstate",
        ...common,
      });
      return result.ok
        ? { ok: true, executionRef: result.executionRef, changed: result.changed }
        : { ok: false, error: result.error };
    }

    case "marketplace.product.approve":
    case "marketplace.product.request_changes":
    case "marketplace.product.reject": {
      const decision =
        action.key === "marketplace.product.approve"
          ? "approved"
          : action.key === "marketplace.product.reject"
            ? "rejected"
            : "changes_requested";
      const result = await applyProductReview({ productId: entityId, decision, ...common });
      return result.ok
        ? { ok: true, executionRef: result.executionRef, changed: true }
        : { ok: false, error: result.error };
    }

    case "account.kyc.approve":
    case "account.kyc.reject": {
      const result = await applyKycReview({
        submissionId: entityId,
        decision: action.key === "account.kyc.approve" ? "approved" : "rejected",
        ...common,
      });
      return result.ok
        ? { ok: true, executionRef: result.executionRef, changed: true }
        : { ok: false, error: result.error };
    }

    case "learn.teacher.approve":
    case "learn.teacher.reject": {
      const result = await applyLearnTeacherDecision({
        applicationId: entityId,
        decision: action.key === "learn.teacher.approve" ? "approved" : "rejected",
        ...common,
      });
      return result.ok
        ? { ok: true, executionRef: result.executionRef, changed: true }
        : { ok: false, error: result.error };
    }

    case "moderation.item.remove":
    case "moderation.item.dismiss": {
      const result = await applyModerationVerdict({
        itemId: entityId,
        verdict: action.key === "moderation.item.remove" ? "actioned" : "dismissed",
        expectedStatus: priorStatus,
        ...common,
      });
      return result.ok
        ? { ok: true, executionRef: result.executionRef, changed: result.changed }
        : { ok: false, error: result.error };
    }

    default: {
      // Exhaustiveness guard: adding a key to the registry without a binding
      // here is a compile error, not a runtime surprise on the owner's console.
      const unreachable: never = action.key;
      return { ok: false, error: `Unhandled action ${String(unreachable)}` };
    }
  }
}
