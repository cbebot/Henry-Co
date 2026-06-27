"use server";

import { runAiTask, createPgBillingPort, parseDraftOutput } from "@henryco/ai-gateway/server";
import type { AiUsageReceipt } from "@henryco/ai-gateway";
import { getMarketplaceViewer, viewerHasRole } from "@/lib/marketplace/auth";
import { getPaymentsSqlExecutor } from "@/lib/payments/db";

export interface ListingDraft {
  summary: string;
  description: string;
  category: string;
  specifications: string;
}

export type DraftListingResult =
  | { ok: true; draft: ListingDraft; receipt: AiUsageReceipt }
  | { ok: false; code: string; message: string };

/**
 * V3-AI-01 — Henry Onyx Intelligence draft-a-listing (METERED, behind the AI kill switch).
 *
 * Runs server-side through the governed gateway ONLY: it never imports a provider SDK and
 * never sees a provider id, model, cost, or margin. The gateway prices the call, reserves
 * against the vendor's wallet (refusing before any provider call if it can't cover the
 * estimate), meters the actuals, and settles atomically through the guarded
 * `payments_private` RPCs. The AI only DRAFTS copy — this never writes the DB or bypasses
 * the human-submitted `vendor_product_upsert` (and its slug-owner + moderation guards).
 */
export async function draftListingAction(input: {
  title: string;
  notes?: string;
  category?: string;
  idempotencyKey: string;
}): Promise<DraftListingResult> {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user || !viewerHasRole(viewer, ["vendor", "marketplace_owner", "marketplace_admin"])) {
    return { ok: false, code: "rate_limited", message: "Sign in as a seller to use Henry Onyx Intelligence." };
  }

  const title = (input.title ?? "").trim();
  if (title.length < 3) {
    return { ok: false, code: "rate_limited", message: "Add a product idea first." };
  }

  const result = await runAiTask(
    {
      surface: "marketplace.listing.draft",
      actorId: viewer.user.id,
      input: { title, notes: input.notes ?? "", category: input.category ?? "" },
      idempotencyKey: input.idempotencyKey,
    },
    { billing: createPgBillingPort(getPaymentsSqlExecutor()) },
  );

  if (!result.ok) {
    return { ok: false, code: result.error.code, message: result.error.message };
  }

  const draft = parseDraftOutput(result.value.output);
  if (!draft || (!draft.summary && !draft.description)) {
    return { ok: false, code: "schema_validation_failed", message: "Henry Onyx Intelligence couldn’t format that. Please try again." };
  }

  return { ok: true, draft, receipt: result.value.receipt };
}
