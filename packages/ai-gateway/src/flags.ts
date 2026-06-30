import { isFlagEnabled, parseHenryFeatureFlags } from "@henryco/intelligence";

/**
 * Is the company-wide Henry Onyx Intelligence master switch on? Reads the SAME `ai_gateway`
 * feature flag the gateway kill switch checks, so a surface panel never renders while the
 * gateway would refuse the call (and vice versa). One shared variable
 * (`NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY=true`, or `NEXT_PUBLIC_HENRY_FLAGS=ai_gateway`) lights
 * up every AI surface across every division.
 *
 * Pure + client-safe (no provider/model). Pass `process.env`.
 */
export function isAiGatewayLive(env: Record<string, string | undefined> = {}): boolean {
  return isFlagEnabled(parseHenryFeatureFlags(env), "ai_gateway");
}

/**
 * Should an AI surface render? True when the company master switch is on, OR the surface's
 * own opt-in flag is explicitly `"true"` (for isolating a single surface in a pre-launch env).
 * The master switch is the simple, standard control; the per-surface flag is the override.
 */
export function isAiSurfaceEnabled(surfaceFlagValue: string | undefined, env: Record<string, string | undefined> = {}): boolean {
  return surfaceFlagValue === "true" || isAiGatewayLive(env);
}
