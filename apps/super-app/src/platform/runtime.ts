import { z } from "zod";

/** Three supported deployment modes (local-first, staging-safe, production-gated). */
export type RuntimeMode = "local" | "staging" | "production";

const modeSchema = z.enum(["local", "staging", "production"]);

/**
 * Resolve runtime mode from env. Production live services still require
 * `EXPO_PUBLIC_LIVE_SERVICES_APPROVED=true` at the adapter layer.
 */
export function getRuntimeMode(): RuntimeMode {
  const raw = process.env.EXPO_PUBLIC_HENRYCO_ENV?.trim().toLowerCase();
  if (raw) {
    const parsed = modeSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
  }
  if (__DEV__) return "local";
  // Release builds without explicit env default to staging (never assume production).
  return "staging";
}

export function isLocalMode(): boolean {
  return getRuntimeMode() === "local";
}

export function isProductionMode(): boolean {
  return getRuntimeMode() === "production";
}

/** Explicit gate for production-only live billing/monitoring/push. */
export function isLiveServicesApproved(): boolean {
  return process.env.EXPO_PUBLIC_LIVE_SERVICES_APPROVED === "true";
}
