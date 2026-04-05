import type { RuntimeMode } from "@/platform/runtime";
import { getRuntimeMode, isLiveServicesApproved, isProductionMode } from "@/platform/runtime";

export type FeatureFlags = {
  /** Real or sandbox payment flows (Stripe, Paystack, etc.). */
  payments: boolean;
  /** Product analytics (Segment, PostHog, etc.). */
  analytics: boolean;
  /** Expo push with real provider backend. */
  livePush: boolean;
  /** Sentry (or similar) with real DSN. */
  liveMonitoring: boolean;
  /** Reads/writes via Supabase (or other DB backend). */
  remoteDatabase: boolean;
  /** Upload binary media via signed API (e.g. Cloudinary upload). */
  mediaUpload: boolean;
  /** Account tab mock/sandbox checkout button (hide when deferred / not ready). */
  paymentsDemoUi: boolean;
  /** Runtime mode + adapter strip for QA (keep off in beta store builds). */
  runtimeDiagnostics: boolean;
};

function readBool(key: string, defaultValue: boolean): boolean {
  const v = process.env[key]?.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return defaultValue;
}

/**
 * Feature flags per mode. Env vars can override individual flags for staging experiments.
 * Pattern: EXPO_PUBLIC_FEATURE_<NAME>=true|false
 */
export function getFeatureFlags(mode: RuntimeMode = getRuntimeMode()): FeatureFlags {
  if (mode === "local") {
    return {
      payments: readBool("EXPO_PUBLIC_FEATURE_PAYMENTS", false),
      analytics: readBool("EXPO_PUBLIC_FEATURE_ANALYTICS", false),
      livePush: readBool("EXPO_PUBLIC_FEATURE_LIVE_PUSH", false),
      liveMonitoring: readBool("EXPO_PUBLIC_FEATURE_LIVE_MONITORING", false),
      remoteDatabase: readBool("EXPO_PUBLIC_FEATURE_REMOTE_DATABASE", false),
      mediaUpload: readBool("EXPO_PUBLIC_FEATURE_MEDIA_UPLOAD", false),
      paymentsDemoUi: readBool("EXPO_PUBLIC_FEATURE_PAYMENTS_DEMO", true),
      runtimeDiagnostics: readBool("EXPO_PUBLIC_FEATURE_RUNTIME_DIAGNOSTICS", true),
    };
  }

  if (mode === "staging") {
    return {
      payments: readBool("EXPO_PUBLIC_FEATURE_PAYMENTS", true),
      analytics: readBool("EXPO_PUBLIC_FEATURE_ANALYTICS", true),
      livePush: readBool("EXPO_PUBLIC_FEATURE_LIVE_PUSH", true),
      liveMonitoring: readBool("EXPO_PUBLIC_FEATURE_LIVE_MONITORING", true),
      remoteDatabase: readBool("EXPO_PUBLIC_FEATURE_REMOTE_DATABASE", true),
      mediaUpload: readBool("EXPO_PUBLIC_FEATURE_MEDIA_UPLOAD", true),
      paymentsDemoUi: readBool("EXPO_PUBLIC_FEATURE_PAYMENTS_DEMO", false),
      runtimeDiagnostics: readBool("EXPO_PUBLIC_FEATURE_RUNTIME_DIAGNOSTICS", false),
    };
  }

  // production
  const approved = isLiveServicesApproved();
  return {
    payments: approved && readBool("EXPO_PUBLIC_FEATURE_PAYMENTS", true),
    analytics: approved && readBool("EXPO_PUBLIC_FEATURE_ANALYTICS", true),
    livePush: approved && readBool("EXPO_PUBLIC_FEATURE_LIVE_PUSH", true),
    liveMonitoring:
      approved && readBool("EXPO_PUBLIC_FEATURE_LIVE_MONITORING", Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN)),
    remoteDatabase: approved && readBool("EXPO_PUBLIC_FEATURE_REMOTE_DATABASE", true),
    mediaUpload: approved && readBool("EXPO_PUBLIC_FEATURE_MEDIA_UPLOAD", true),
    paymentsDemoUi: approved && readBool("EXPO_PUBLIC_FEATURE_PAYMENTS_DEMO", false),
    runtimeDiagnostics: approved && readBool("EXPO_PUBLIC_FEATURE_RUNTIME_DIAGNOSTICS", false),
  };
}

/** In production, block live adapters unless explicitly approved. */
export function assertProductionGate(feature: keyof FeatureFlags, flags: FeatureFlags): boolean {
  if (!isProductionMode()) return true;
  if (isLiveServicesApproved()) return true;
  return !flags[feature];
}
