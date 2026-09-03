/**
 * V3 follow-up — Settings hero state derivation.
 *
 * Profile + preferences shapes match the `customer_profiles` and
 * `customer_preferences` tables read by `apps/account/lib/account-data.ts`
 * (`getProfile`, `getPreferences`). All inputs are nullable to honor the
 * Vercel preview-env degradation contract — if the admin Supabase env is
 * absent we still render a coherent (unverified, no-prefs) hero.
 */

export type SettingsProfile = Record<string, string | null> | null;
export type SettingsPreferences = Record<string, boolean | string> | null;

export type IdentityState =
  | "unverified"
  | "verified-base"
  | "verified-rich"
  | "power-user";

export type DivisionKey =
  | "care"
  | "marketplace"
  | "studio"
  | "jobs"
  | "learn"
  | "property"
  | "logistics"
  | "wallet"
  | "security"
  | "referrals";

const DIVISION_KEYS: ReadonlyArray<DivisionKey> = [
  "care",
  "marketplace",
  "studio",
  "jobs",
  "learn",
  "property",
  "logistics",
  "wallet",
  "security",
  "referrals",
];

const CHANNEL_KEYS = [
  "email_transactional",
  "email_marketing",
  "email_digest",
  "push_enabled",
  "whatsapp_enabled",
  "sms_enabled",
  "in_app_toast_enabled",
] as const;

function readBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function readString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

export function profileCompleteness(profile: SettingsProfile): {
  filled: number;
  total: number;
  ratio: number;
} {
  const fields = [
    "full_name",
    "phone",
    "country",
    "language",
    "avatar_url",
    "contact_preference",
  ];
  const filled = fields.reduce(
    (acc, key) => (readString(profile?.[key as keyof typeof profile] ?? null) ? acc + 1 : acc),
    0,
  );
  return { filled, total: fields.length, ratio: filled / fields.length };
}

export function activeChannels(preferences: SettingsPreferences): {
  count: number;
  total: number;
} {
  const count = CHANNEL_KEYS.reduce(
    (acc, key) => (readBool(preferences?.[key], false) ? acc + 1 : acc),
    0,
  );
  return { count, total: CHANNEL_KEYS.length };
}

export function activeDivisions(preferences: SettingsPreferences): {
  count: number;
  total: number;
  perDivision: Record<DivisionKey, boolean>;
} {
  const perDivision = DIVISION_KEYS.reduce(
    (acc, key) => {
      acc[key] = readBool(preferences?.[`notification_${key}`], true);
      return acc;
    },
    {} as Record<DivisionKey, boolean>,
  );
  const count = Object.values(perDivision).filter(Boolean).length;
  return { count, total: DIVISION_KEYS.length, perDivision };
}

export function regionFingerprint(profile: SettingsProfile): {
  country: string | null;
  language: string | null;
  timezone: string | null;
  filled: number;
} {
  const country = readString(profile?.country);
  const language = readString(profile?.language);
  const timezone = readString(profile?.timezone);
  const filled = [country, language, timezone].filter(Boolean).length;
  return { country, language, timezone, filled };
}

export function identityState(
  profile: SettingsProfile,
  preferences: SettingsPreferences,
): IdentityState {
  const { ratio } = profileCompleteness(profile);
  const divisions = activeDivisions(preferences).count;
  const channels = activeChannels(preferences).count;
  if (ratio < 0.4) return "unverified";
  if (ratio < 0.75 && divisions <= 3) return "verified-base";
  if (divisions >= 7 && channels >= 4) return "power-user";
  return "verified-rich";
}

export function identityHeadline(
  state: IdentityState,
  profile: SettingsProfile,
  preferences: SettingsPreferences,
): string {
  const fullName = readString(profile?.full_name);
  const firstName = fullName ? fullName.split(/\s+/)[0] : null;
  const divisions = activeDivisions(preferences).count;

  if (state === "unverified") {
    return firstName
      ? `One short pass and Henry Onyx recognises you, ${firstName}.`
      : "A short pass and Henry Onyx recognises you across every division.";
  }
  if (state === "verified-base") {
    return firstName
      ? `${firstName} — identity confirmed, ready for full reach.`
      : "Identity confirmed — ready for full Henry Onyx reach.";
  }
  if (state === "power-user") {
    return firstName
      ? `${firstName} — account tuned across ${divisions} divisions.`
      : `Account tuned across ${divisions} divisions.`;
  }
  // verified-rich
  return firstName
    ? `${firstName} — preferences shaping ${divisions} divisions.`
    : `Preferences shaping ${divisions} divisions of Henry Onyx.`;
}

export function identityBlurb(state: IdentityState): string {
  if (state === "unverified") {
    return "Add a phone, a region and a language and Henry Onyx will recognise you in every division — same identity, same trust, same address book.";
  }
  if (state === "verified-base") {
    return "Profile basics are set. Add a photo and pin your preferred language to lift the experience to fully personalised across Henry Onyx.";
  }
  if (state === "power-user") {
    return "Every signal you toggle here propagates instantly across Care, Marketplace, Studio, Jobs, Learn, Property and Logistics. One identity, many divisions.";
  }
  return "Identity, channels and per-division reach — every change here propagates across Henry Onyx within seconds.";
}

export const DIVISION_LABEL: Record<DivisionKey, string> = {
  care: "Care",
  marketplace: "Marketplace",
  studio: "Studio",
  jobs: "Jobs",
  learn: "Learn",
  property: "Property",
  logistics: "Logistics",
  wallet: "Wallet",
  security: "Security",
  referrals: "Referrals",
};

/**
 * Per-division accent CSS variable. Mirrors the inbox-aggregate
 * `DIVISION_ACCENT_VAR` map but extends it to cover the wallet /
 * security / referrals signal lanes that ship in `customer_preferences`
 * but aren't navigation portals.
 */
export const DIVISION_ACCENT_VAR: Record<DivisionKey, string> = {
  care: "--acct-div-care",
  marketplace: "--acct-div-marketplace",
  studio: "--acct-div-studio",
  jobs: "--acct-div-jobs",
  learn: "--acct-div-learn",
  property: "--acct-div-property",
  logistics: "--acct-div-logistics",
  wallet: "--acct-gold",
  security: "--acct-sev-security",
  referrals: "--acct-gold-strong",
};

export const DIVISION_ORDER: ReadonlyArray<DivisionKey> = DIVISION_KEYS;
