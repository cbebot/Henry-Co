import { getEnv, isSupabaseConfigured } from "@/core/env";
import { getSupabaseClient } from "@/core/supabase";
import { ConsoleAnalyticsAdapter, NoOpAnalyticsAdapter } from "@/platform/adapters/mock/analytics.mock";
import { MockAuthAdapter } from "@/platform/adapters/mock/auth.mock";
import { MockDatabaseAdapter } from "@/platform/adapters/mock/database.mock";
import { MockNotificationsAdapter } from "@/platform/adapters/mock/notifications.mock";
import { MockPaymentsAdapter } from "@/platform/adapters/mock/payments.mock";
import { NoOpMonitoringAdapter } from "@/platform/adapters/mock/monitoring.mock";
import { MockUploadMediaAdapter, CloudinaryMediaAdapter } from "@/platform/cloudinary.media";
import { ExpoNotificationsAdapter } from "@/platform/adapters/expo/notifications.expo";
import { DeferredPaymentsAdapter } from "@/platform/adapters/payments.deferred";
import { SentryMonitoringAdapter } from "@/platform/adapters/sentry.monitoring";
import { SupabaseAuthAdapter } from "@/platform/adapters/supabase/auth.supabase";
import { SupabaseDatabaseAdapter } from "@/platform/adapters/supabase/database.supabase";
import type { AnalyticsAdapter } from "@/platform/contracts/analytics";
import type { AuthAdapter } from "@/platform/contracts/auth";
import type { DatabaseAdapter } from "@/platform/contracts/database";
import type { MediaAdapter } from "@/platform/contracts/media";
import type { MonitoringAdapter } from "@/platform/contracts/monitoring";
import type { NotificationsAdapter } from "@/platform/contracts/notifications";
import type { PaymentsAdapter } from "@/platform/contracts/payments";
import { getFeatureFlags, type FeatureFlags } from "@/platform/featureFlags";
import { getRuntimeMode, type RuntimeMode } from "@/platform/runtime";

export type PlatformBundle = {
  mode: RuntimeMode;
  flags: FeatureFlags;
  auth: AuthAdapter;
  database: DatabaseAdapter;
  media: MediaAdapter;
  notifications: NotificationsAdapter;
  payments: PaymentsAdapter;
  analytics: AnalyticsAdapter;
  monitoring: MonitoringAdapter;
};

function warnStagingWithoutSupabase(mode: RuntimeMode, flags: FeatureFlags, hasClient: boolean) {
  if (mode === "staging" && flags.remoteDatabase && !hasClient) {
    console.warn(
      "[henryco] Staging expects EXPO_PUBLIC_SUPABASE_* for remote database. Using in-app mocks until configured.",
    );
  }
}

/** Compose adapters from runtime mode, feature flags, and env (no secrets in code). */
export function createPlatformBundle(): PlatformBundle {
  const mode = getRuntimeMode();
  const flags = getFeatureFlags(mode);
  const env = getEnv();
  const supabaseConfigured = isSupabaseConfigured(env);
  const client = supabaseConfigured ? getSupabaseClient() : null;
  const hasClient = Boolean(client);
  const useRemote = flags.remoteDatabase && hasClient;

  warnStagingWithoutSupabase(mode, flags, hasClient);

  const auth: AuthAdapter =
    useRemote && client ? new SupabaseAuthAdapter(client) : new MockAuthAdapter();

  const database: DatabaseAdapter =
    useRemote && client ? new SupabaseDatabaseAdapter(client) : new MockDatabaseAdapter();

  const media: MediaAdapter =
    mode === "local" ? new MockUploadMediaAdapter() : new CloudinaryMediaAdapter();

  const notifications: NotificationsAdapter =
    mode === "local"
      ? new MockNotificationsAdapter()
      : flags.livePush
        ? new ExpoNotificationsAdapter()
        : new MockNotificationsAdapter();

  const payments: PaymentsAdapter =
    mode === "local"
      ? new MockPaymentsAdapter()
      : flags.payments
        ? new DeferredPaymentsAdapter()
        : new MockPaymentsAdapter();

  const analytics: AnalyticsAdapter =
    mode === "local"
      ? new ConsoleAnalyticsAdapter()
      : flags.analytics
        ? new ConsoleAnalyticsAdapter()
        : new NoOpAnalyticsAdapter();

  const monitoring: MonitoringAdapter =
    flags.liveMonitoring && Boolean(env.SENTRY_DSN?.trim())
      ? new SentryMonitoringAdapter()
      : new NoOpMonitoringAdapter();

  return {
    mode,
    flags,
    auth,
    database,
    media,
    notifications,
    payments,
    analytics,
    monitoring,
  };
}
