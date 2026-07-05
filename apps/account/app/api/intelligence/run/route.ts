import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { runAiTask, createPgBillingPort, noBillingPort } from "@henryco/ai-gateway/server";
import { getCapability } from "@henryco/ai-gateway";
import { getPaymentsSqlExecutor, isPaymentsDbConfigured } from "@henryco/payments-db";
import { createSupabaseServer } from "@/lib/supabase/server";
import { intelligenceCorsHeaders as corsHeaders, intelligencePreflight } from "@/lib/intelligence/cors";
import { persistDeepResult } from "@/lib/intelligence/persist";

export const runtime = "nodejs";

export function OPTIONS(request: NextRequest) {
  return intelligencePreflight(request);
}

/**
 * POST /api/intelligence/run — run a chargeable deep-work capability the person already
 * confirmed a price for. This charges the wallet through the SAME metered rail as every other
 * paid AI surface: runAiTask reserves the quote, runs, settles atomically, and returns a
 * redacted receipt. Because settle is hard-capped at the reservation, the person is never
 * charged above the price they saw. A signed-in person is required (identity from the cookie,
 * never the body). Fail-closed billing: if the payments DB is not configured the run is
 * refused rather than silently free.
 *
 * Flag-dark behind NEXT_PUBLIC_INTELLIGENCE_LIVE.
 */
export async function POST(request: NextRequest) {
  const cors = corsHeaders(request);
  if (process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE !== "1") {
    return NextResponse.json({ error: "Not available." }, { status: 404, headers: cors });
  }

  const body = (await request.json().catch(() => null)) as {
    capabilityKey?: unknown;
    input?: unknown;
    idempotencyKey?: unknown;
    conversationId?: unknown;
    division?: unknown;
  } | null;
  const capabilityKey = typeof body?.capabilityKey === "string" ? body.capabilityKey : "";
  const input = typeof body?.input === "string" ? body.input.slice(0, 6000) : "";
  const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.slice(0, 64) : randomUUID();
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;
  const division = typeof body?.division === "string" ? body.division : "account";

  const capability = getCapability(capabilityKey);
  if (!capability) {
    return NextResponse.json({ error: "That deep-work option is not available." }, { status: 400, headers: cors });
  }
  if (!input.trim()) {
    return NextResponse.json({ error: "Tell me a little about what to work on first." }, { status: 400, headers: cors });
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to run this, so it can be charged to your wallet.", needsSignIn: true },
      { status: 401, headers: cors },
    );
  }

  // The same rail as every paid surface. Fail closed if the wallet DB is not configured.
  const billing = isPaymentsDbConfigured() ? createPgBillingPort(getPaymentsSqlExecutor()) : noBillingPort;
  const result = await runAiTask(
    {
      surface: capability.surface,
      actorId: user.id,
      input: { text: input },
      idempotencyKey,
    },
    { billing, audit: { supabase: supabase as never } },
  );

  if (!result.ok) {
    const status =
      result.error.code === "insufficient_funds"
        ? 402
        : result.error.code === "rate_limited"
          ? 429
          : result.error.code === "auth_required"
            ? 401
            : 502;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status, headers: cors });
  }

  // Persist the paid result into the conversation (best-effort — never blocks the answer).
  await persistDeepResult({
    conversationId,
    userId: user.id,
    division,
    capability: { key: capability.key, title: capability.title },
    output: result.value.output,
  }).catch(() => {});

  const receipt = result.value.receipt;
  return NextResponse.json(
    {
      output: result.value.output,
      receipt: { totalKobo: receipt.totalKobo, vatKobo: receipt.vatKobo, tier: receipt.tier, billed: receipt.billed },
    },
    { headers: cors },
  );
}
