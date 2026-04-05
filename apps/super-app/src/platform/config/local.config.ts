/**
 * Local-first defaults (no paid services required).
 * Actual behavior is driven by `getRuntimeMode() === "local"` and `getFeatureFlags("local")`.
 * Override any feature with EXPO_PUBLIC_FEATURE_* in `.env.local`.
 */
export const localConfig = {
  description: "Mocks for auth, DB, payments, push; console analytics; optional Cloudinary read URLs.",
  defaultFlags: {
    payments: false,
    analytics: false,
    livePush: false,
    liveMonitoring: false,
    remoteDatabase: false,
    mediaUpload: false,
  },
} as const;
