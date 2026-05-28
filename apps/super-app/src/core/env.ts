import { z } from "zod";

import { henryWebOrigin } from "./domain";

/**
 * Public env vars only. Runtime mode for adapters is `EXPO_PUBLIC_HENRYCO_ENV`
 * (`local` | `staging` | `production`) — see `src/platform/runtime.ts`.
 *
 * Note (PROD-READY-01): `WEB_ORIGIN` defaults to `henryWebOrigin()` which
 * respects `EXPO_PUBLIC_BASE_DOMAIN`. When that env var is set (e.g. a future
 * brand-domain change) the default origin updates without a code change.
 * When unset it resolves to `https://www.henrycogroup.com` — identical
 * behaviour to the previous hardcoded default.
 */
const envSchema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).default("dhueyqvid"),
  CLOUDINARY_BASE_PATH: z.string().min(1).default("henryco"),
  SENTRY_DSN: z.string().optional().or(z.literal("")),
  WEB_ORIGIN: z.string().url(),
});

export type AppEnv = z.infer<typeof envSchema>;

/** Environment derived from Expo public env vars — safe to ship to the client. */
export function getEnv(): AppEnv {
  const fallbackWebOrigin = henryWebOrigin();
  const candidate = {
    APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    CLOUDINARY_CLOUD_NAME: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_BASE_PATH: process.env.EXPO_PUBLIC_CLOUDINARY_BASE_PATH,
    SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    WEB_ORIGIN: process.env.EXPO_PUBLIC_WEB_ORIGIN,
  };

  const parsed = envSchema.safeParse({
    APP_ENV: candidate.APP_ENV ?? (__DEV__ ? "development" : "staging"),
    SUPABASE_URL: candidate.SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY: candidate.SUPABASE_ANON_KEY ?? "",
    CLOUDINARY_CLOUD_NAME: candidate.CLOUDINARY_CLOUD_NAME ?? "dhueyqvid",
    CLOUDINARY_BASE_PATH: candidate.CLOUDINARY_BASE_PATH ?? "henryco",
    SENTRY_DSN: candidate.SENTRY_DSN ?? "",
    WEB_ORIGIN: candidate.WEB_ORIGIN ?? fallbackWebOrigin,
  });

  if (!parsed.success) {
    console.warn("[env] Invalid configuration; using safe defaults.", parsed.error.flatten());
    return envSchema.parse({ WEB_ORIGIN: fallbackWebOrigin });
  }
  return parsed.data;
}

export function isSupabaseConfigured(env: AppEnv): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}
