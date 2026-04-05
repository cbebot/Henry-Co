/**
 * Staging: real non-production backends (Supabase staging project, sandbox payments, etc.).
 * Set EXPO_PUBLIC_HENRYCO_ENV=staging and provide staging Supabase keys.
 */
export const stagingConfig = {
  description: "Remote Supabase when keys present; Expo push; deferred real payments until provider wired; Sentry optional.",
  defaultFlags: {
    payments: true,
    analytics: true,
    livePush: true,
    liveMonitoring: true,
    remoteDatabase: true,
    mediaUpload: true,
  },
} as const;
