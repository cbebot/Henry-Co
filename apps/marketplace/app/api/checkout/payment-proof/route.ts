import { NextResponse } from "next/server";
import { logger as baseLogger, emitEvent } from "@henryco/observability";
import { uploadMarketplacePaymentProof } from "@/lib/marketplace/payment";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Mirrors the canonical set in `apps/marketplace/lib/marketplace/payment.ts`
// (PAYMENT_PROOF_TYPES). Keep both in sync — the dual check exists so the
// route returns a clean 400 BEFORE attempting the Cloudinary round-trip.
const ALLOWED_PROOF_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_PROOF_BYTES = 10 * 1024 * 1024; // 10 MB — pairs with the client-side cap.

const log = baseLogger.child({ module: "marketplace.checkout.payment-proof" });

type ErrorBody = {
  ok: false;
  error: string;
  code:
    | "unauthorized"
    | "missing_file"
    | "invalid_type"
    | "too_large"
    | "cloudinary_unavailable"
    | "internal_error";
  degraded?: ReadonlyArray<"cloudinary_unavailable">;
};

type SuccessBody = {
  ok: true;
  url: string;
  public_id: string;
  name: string;
  size: number;
  mime: string;
};

function errorBody(
  error: string,
  code: ErrorBody["code"],
  degraded?: ReadonlyArray<"cloudinary_unavailable">,
): ErrorBody {
  return degraded ? { ok: false, error, code, degraded } : { ok: false, error, code };
}

/**
 * Distinguish "Cloudinary is transiently unreachable / 5xx'd" from
 * "the user supplied a bad file". The marketplace helper throws a
 * surfaced Error in both cases; we treat anything that looks like a
 * Cloudinary 5xx, network failure, or generic "Upload failed" as
 * transient (degraded), and treat client-input rejections (size/MIME)
 * as permanent. This matches the V3-10 degraded-side-effect pattern:
 * permanent errors yield 4xx, transient errors yield 503 + degraded.
 */
function classifyUploadError(message: string): {
  code: ErrorBody["code"];
  status: number;
  degraded?: ReadonlyArray<"cloudinary_unavailable">;
} {
  const lower = message.toLowerCase();

  if (lower.includes("under") && lower.includes("mb")) {
    return { code: "too_large", status: 413 };
  }
  if (lower.includes("png") || lower.includes("jpg") || lower.includes("webp") || lower.includes("pdf")) {
    return { code: "invalid_type", status: 415 };
  }
  if (lower.includes("upload a payment proof")) {
    return { code: "missing_file", status: 400 };
  }

  // Everything else — Cloudinary 5xx, network failure, signature mismatch
  // due to env drift, etc. — is treated as a transient outage so the UI
  // can surface a retry CTA instead of pretending the user did something
  // wrong.
  return {
    code: "cloudinary_unavailable",
    status: 503,
    degraded: ["cloudinary_unavailable"],
  };
}

export async function POST(request: Request) {
  // Trace id stitches the requested/succeeded|failed/degraded events for
  // this single upload attempt. The observability tile joins on this id.
  const traceId =
    globalThis.crypto?.randomUUID?.() ?? `proof-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const startedAt = Date.now();

  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      log.warn("payment_proof:auth_missing", { traceId });
      return NextResponse.json<ErrorBody>(
        errorBody("Sign in to upload payment proof.", "unauthorized"),
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const proofValue = formData.get("proof");
    const proof = proofValue instanceof File ? proofValue : null;

    if (!proof || proof.size <= 0) {
      log.warn("payment_proof:missing_file", { traceId, actorId: user.id });
      emitEvent({
        name: "henry.marketplace.payment_proof.failed",
        classification: "user_action",
        outcome: "failed",
        actorId: user.id,
        traceId,
        payload: { reason: "missing_file" },
      });
      return NextResponse.json<ErrorBody>(
        errorBody("Choose a payment proof file before uploading.", "missing_file"),
        { status: 400 },
      );
    }

    const mime = (proof.type || "").toLowerCase();
    if (!ALLOWED_PROOF_TYPES.has(mime)) {
      log.warn("payment_proof:invalid_type", {
        traceId,
        actorId: user.id,
        mime,
        size: proof.size,
      });
      emitEvent({
        name: "henry.marketplace.payment_proof.failed",
        classification: "user_action",
        outcome: "failed",
        actorId: user.id,
        traceId,
        payload: { reason: "invalid_type", mime },
      });
      return NextResponse.json<ErrorBody>(
        errorBody(
          "Upload a PNG, JPG, WebP, or PDF payment proof.",
          "invalid_type",
        ),
        { status: 415 },
      );
    }

    if (proof.size > MAX_PROOF_BYTES) {
      log.warn("payment_proof:too_large", {
        traceId,
        actorId: user.id,
        size: proof.size,
      });
      emitEvent({
        name: "henry.marketplace.payment_proof.failed",
        classification: "user_action",
        outcome: "failed",
        actorId: user.id,
        traceId,
        payload: { reason: "too_large", size: proof.size },
      });
      return NextResponse.json<ErrorBody>(
        errorBody(
          "Please upload payment proof under 10 MB.",
          "too_large",
        ),
        { status: 413 },
      );
    }

    // The order_no is not yet known at proof-upload time (the order is
    // created on /api/marketplace#checkout_submit). We tag the upload
    // folder with a stable per-user pre-order id derived from this
    // session attempt — it survives until checkout submit, where the
    // marketplace route stitches the final order_no into the proof
    // record. The Cloudinary public_id includes a UUID slice so collisions
    // across users / repeated attempts are impossible.
    const preOrderTag = `pre-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;

    emitEvent({
      name: "henry.uploads.cloudinary.requested",
      classification: "user_action",
      outcome: "requested",
      actorId: user.id,
      traceId,
      payload: {
        target_folder: "marketplace/payment-proofs",
        file_size: proof.size,
        mime,
        pre_order_tag: preOrderTag,
      },
    });

    let upload: Awaited<ReturnType<typeof uploadMarketplacePaymentProof>>;
    let attempt = 0;
    const MAX_ATTEMPTS = 3;
    const BACKOFF_MS = [250, 1000, 4000];

    // Retry loop only for transient errors. Validation errors are caught
    // and rethrown immediately (the helper's own checks ran above, so
    // anything raised here is post-upload — meaning a Cloudinary 5xx /
    // network blip). We CAP at 3 attempts to keep the user-facing route
    // budget under ~6s for the worst case.
    let lastError: Error | null = null;
    while (attempt < MAX_ATTEMPTS) {
      try {
        upload = await uploadMarketplacePaymentProof(proof, user.id, preOrderTag);
        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const classification = classifyUploadError(lastError.message);

        // Permanent (validation-class) errors are not retriable — break
        // immediately and surface to the caller.
        if (classification.code !== "cloudinary_unavailable") {
          break;
        }

        attempt += 1;
        if (attempt >= MAX_ATTEMPTS) break;

        emitEvent({
          name: "henry.uploads.cloudinary.failed",
          classification: "system_state",
          outcome: "failed",
          actorId: user.id,
          traceId,
          payload: {
            error_code: classification.code,
            retriable: true,
            attempt_n: attempt,
            error_message: lastError.message,
          },
        });

        await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS[attempt - 1] ?? 4000));
      }
    }

    if (lastError) {
      const classification = classifyUploadError(lastError.message);
      log.error("payment_proof:upload_failed", {
        traceId,
        actorId: user.id,
        attempts: attempt + 1,
        code: classification.code,
        error: { message: lastError.message },
      });

      // Permanent failure — emit `failed`; transient exhaustion — emit
      // both `failed` (the last attempt) AND `degraded` (the budget-exhausted
      // signal that the owner tile aggregates).
      emitEvent({
        name: "henry.uploads.cloudinary.failed",
        classification: "system_state",
        outcome: "failed",
        actorId: user.id,
        traceId,
        payload: {
          error_code: classification.code,
          retriable: classification.code === "cloudinary_unavailable",
          attempt_n: attempt + 1,
          error_message: lastError.message,
        },
      });

      if (classification.code === "cloudinary_unavailable") {
        emitEvent({
          name: "henry.uploads.cloudinary.degraded",
          classification: "system_state",
          outcome: "failed",
          actorId: user.id,
          traceId,
          payload: {
            retried_attempts: MAX_ATTEMPTS,
            last_error: lastError.message,
          },
        });
      }

      emitEvent({
        name: "henry.marketplace.payment_proof.failed",
        classification: "user_action",
        outcome: "failed",
        actorId: user.id,
        traceId,
        payload: { reason: classification.code, error_message: lastError.message },
      });

      return NextResponse.json<ErrorBody>(
        errorBody(
          classification.code === "cloudinary_unavailable"
            ? "Proof upload is temporarily unavailable. Please retry in a moment."
            : lastError.message,
          classification.code,
          classification.degraded,
        ),
        { status: classification.status },
      );
    }

    // upload is assigned in the success branch of the loop. The variable
    // is declared above with `let` and TypeScript flow analysis doesn't
    // narrow through the loop, so we re-assert here.
    if (!upload!) {
      // Defensive — should be unreachable because the loop either fills
      // `upload` or sets `lastError`.
      throw new Error("Upload helper returned no result.");
    }

    const durationMs = Date.now() - startedAt;
    log.info("payment_proof:uploaded", {
      traceId,
      actorId: user.id,
      duration_ms: durationMs,
      public_id: upload!.publicId,
      size: proof.size,
      mime,
    });

    emitEvent({
      name: "henry.uploads.cloudinary.succeeded",
      classification: "system_state",
      outcome: "completed",
      actorId: user.id,
      traceId,
      payload: {
        file_size: proof.size,
        duration_ms: durationMs,
        public_id: upload!.publicId,
        target_folder: "marketplace/payment-proofs",
      },
    });

    emitEvent({
      name: "henry.marketplace.payment_proof.uploaded",
      classification: "user_action",
      outcome: "completed",
      actorId: user.id,
      traceId,
      payload: {
        public_id: upload!.publicId,
        file_size: proof.size,
        mime,
        duration_ms: durationMs,
      },
    });

    return NextResponse.json<SuccessBody>(
      {
        ok: true,
        url: upload!.secureUrl,
        public_id: upload!.publicId,
        name: proof.name,
        size: proof.size,
        mime,
      },
      { status: 200 },
    );
  } catch (err) {
    // This catch is the *outer* guard — it should fire only on auth
    // helper failures, formData parsing failures, or genuinely
    // unexpected exceptions. The inner retry loop already returns
    // structured envelopes for Cloudinary errors.
    const message = err instanceof Error ? err.message : "Unable to upload payment proof.";
    log.error("payment_proof:unexpected", {
      traceId,
      error: { message },
    });
    emitEvent({
      name: "henry.marketplace.payment_proof.failed",
      classification: "system_state",
      outcome: "failed",
      traceId,
      payload: { reason: "internal_error", error_message: message },
    });
    return NextResponse.json<ErrorBody>(
      errorBody("Unable to upload payment proof. Please retry.", "internal_error"),
      { status: 500 },
    );
  }
}
