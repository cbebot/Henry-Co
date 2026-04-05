/**
 * Production: all live adapters gated by EXPO_PUBLIC_LIVE_SERVICES_APPROVED=true
 * plus per-feature EXPO_PUBLIC_FEATURE_* flags.
 */
export const productionConfig = {
  description:
    "No hardcoded secrets. Requires explicit approval flag before payments, remote DB, monitoring, etc.",
  requiresApprovalEnv: "EXPO_PUBLIC_LIVE_SERVICES_APPROVED",
} as const;
