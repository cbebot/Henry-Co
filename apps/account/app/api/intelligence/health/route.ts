import { NextResponse, type NextRequest } from "next/server";

import { isAiGatewayLive } from "@henryco/ai-gateway";
import { getAiProviderConfig } from "@henryco/config";
import { intelligenceCorsHeaders as corsHeaders, intelligencePreflight } from "@/lib/intelligence/cors";

export const runtime = "nodejs";

export function OPTIONS(request: NextRequest) {
  return intelligencePreflight(request);
}

/**
 * GET /api/intelligence/health — the activation readiness probe for Henry Onyx Intelligence.
 *
 * Returns ONLY booleans, never a secret or a model/provider name, so it is safe to call
 * unauthenticated. It reports the three independent switches a live turn needs, which is
 * exactly the gap that made the chat "open but never answer":
 *
 *   - live        NEXT_PUBLIC_INTELLIGENCE_LIVE=1  → mounts the launcher + stops the 404
 *   - gateway     the `ai_gateway` master flag on  → the model call is not kill-switched
 *   - configured  a provider key is present         → runAiTask is not `not_configured`
 *
 * `ready` is true only when all three are on. Hit https://account.henryonyx.com/api/intelligence/health
 * after setting env to see, at a glance, which switch is still off — no redeploy guessing.
 */
export async function GET(request: NextRequest) {
  const cors = corsHeaders(request);
  const live = process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE === "1";
  const gateway = isAiGatewayLive(process.env);
  const configured = getAiProviderConfig().isConfigured;
  return NextResponse.json(
    { service: "intelligence", live, gateway, configured, ready: live && gateway && configured },
    { headers: { ...cors, "Cache-Control": "no-store" } },
  );
}
