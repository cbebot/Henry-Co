import { NextResponse } from "next/server";

import { requireOwner } from "@/app/lib/owner-auth";
import { isAiGatewayLive } from "@henryco/ai-gateway";
import { getAiProviderConfig } from "@henryco/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/owner/intelligence/health — the AI readiness check.
 *
 * WHY THIS EXISTS: the Founder AI has THREE independent deploy-time gates, and
 * when any is off the portal opens but every turn silently refuses ("Not
 * available") — indistinguishable from a code bug. That silence has cost real
 * time. This endpoint names, in plain language, exactly which gate is closed so
 * the owner can fix it himself in one glance.
 *
 * CRITICAL: gated ONLY by requireOwner — NOT by any AI flag. It must answer
 * precisely WHEN the AI is dark, because that is when it is needed. It returns
 * booleans only (never the key value), so it leaks no secret.
 *
 * Note on NEXT_PUBLIC_* gates: those are inlined at BUILD time. Setting them on
 * the host does nothing until the app is REDEPLOYED — the single most common
 * reason "I set everything and it still doesn't work".
 */
export async function GET() {
  const auth = await requireOwner();
  if (!auth.ok) {
    // Same opaque 404 as every owner surface — a non-owner learns nothing.
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const env = process.env;
  const founderFlag = env.NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE === "1";
  const masterSwitch = isAiGatewayLive(env);
  const providerConfigured = getAiProviderConfig().isConfigured;
  const actionsLive = env.FOUNDER_ACTIONS_LIVE === "1";
  const actionsTranche = Number.isFinite(Number(env.FOUNDER_ACTIONS_TRANCHE))
    ? Math.max(0, Math.floor(Number(env.FOUNDER_ACTIONS_TRANCHE)))
    : 0;

  const gates = [
    {
      key: "NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE",
      label: "Owner AI portal + route",
      ok: founderFlag,
      buildTime: true,
      set: "=1",
    },
    {
      key: "NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY",
      label: "Master AI switch — lights up EVERY AI surface, every division",
      ok: masterSwitch,
      buildTime: true,
      set: "=true",
    },
    {
      key: "ANTHROPIC_API_KEY",
      label: "Model access key — the AI cannot reply without it",
      ok: providerConfigured,
      buildTime: false,
      set: "=<your key>",
    },
    {
      key: "FOUNDER_ACTIONS_LIVE",
      label: "Governed actions — X post, support replies, division controls",
      ok: actionsLive,
      buildTime: false,
      set: "=1",
    },
    {
      key: "FOUNDER_ACTIONS_TRANCHE",
      label: "Action depth — 2 unlocks the full owner action catalog",
      ok: actionsTranche >= 2,
      buildTime: false,
      set: "=2",
    },
  ];

  // Replying needs the first three; acting needs the two action gates on top.
  const replyReady = founderFlag && masterSwitch && providerConfigured;
  const actionsReady = replyReady && actionsLive && actionsTranche >= 2;
  const missing = gates.filter((g) => !g.ok);
  const missingBuildTime = missing.some((g) => g.buildTime);

  const summary = replyReady
    ? actionsReady
      ? "All systems live — the AI can reply AND act."
      : `The AI can reply, but governed actions (X post, replies, controls) are off. Set ${missing
          .map((g) => `${g.key}${g.set}`)
          .join(" and ")}.`
    : `The AI is OFF. Set ${missing.map((g) => `${g.key}${g.set}`).join(" and ")}.${
        missingBuildTime
          ? " Some of these are NEXT_PUBLIC_ (build-time) — you MUST redeploy the app after setting them, or they never take effect."
          : ""
      }`;

  return NextResponse.json({
    ready: replyReady,
    actionsReady,
    actionsTranche,
    gates,
    missing: missing.map((g) => g.key),
    mustRedeploy: missingBuildTime,
    summary,
  });
}
