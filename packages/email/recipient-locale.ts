/**
 * PASS 18C — Recipient locale resolver.
 *
 * Given a Supabase service-role client and an identifier (email or user_id),
 * returns the recipient's preferred AppLocale. Reads the canonical column
 * `customer_profiles.language` (set by `ensureAccountProfileRecords` on signup
 * and editable by users from the account preferences panel).
 *
 * Falls back to "en" on any error or missing data — never throws. Email
 * dispatch must keep working even if locale lookup fails.
 *
 * The supabase client argument is duck-typed so this module stays free of a
 * direct `@supabase/supabase-js` dependency (matches the pattern used by
 * `translate-runtime.ts` in @henryco/i18n).
 */

type AppLocaleString =
  | "en"
  | "fr"
  | "ig"
  | "yo"
  | "ha"
  | "ar"
  | "es"
  | "pt"
  | "de"
  | "it"
  | "zh"
  | "hi";

const VALID_LOCALES = new Set<AppLocaleString>([
  "en",
  "fr",
  "ig",
  "yo",
  "ha",
  "ar",
  "es",
  "pt",
  "de",
  "it",
  "zh",
  "hi",
]);

export function normalizeAppLocaleSafe(value: unknown): AppLocaleString {
  if (typeof value !== "string") return "en";
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "en";
  const base = trimmed.split("-")[0];
  return VALID_LOCALES.has(base as AppLocaleString) ? (base as AppLocaleString) : "en";
}

type DuckQueryResult = Promise<{
  data: { language: string | null; user_id?: string | null } | null;
  error: unknown;
}>;

type DuckSupabaseClient = {
  from(table: string): {
    select(cols: string): {
      eq(col: string, value: string): {
        maybeSingle(): DuckQueryResult;
        limit(n: number): {
          maybeSingle(): DuckQueryResult;
        };
      };
    };
  };
};

export type RecipientLocaleIdentifier = {
  /** User UUID — preferred when available (most precise). */
  userId?: string | null;
  /** Email address — falls back when userId not provided. */
  email?: string | null;
  /** Pre-resolved locale (cookie/profile from caller). When set, wins. */
  hint?: string | null;
};

/**
 * Look up the recipient's AppLocale. Priority order:
 * 1. `hint` if a valid AppLocale (caller already resolved it).
 * 2. `customer_profiles.language` matched by `id = userId`.
 * 3. `customer_profiles.language` matched by `email = email`.
 * 4. Default "en".
 *
 * Always returns a valid AppLocale. Never throws.
 */
export async function resolveRecipientLocale(
  supabaseAdmin: DuckSupabaseClient | null | undefined,
  identifier: RecipientLocaleIdentifier,
): Promise<AppLocaleString> {
  const hinted = normalizeAppLocaleSafe(identifier.hint);
  if (identifier.hint && hinted !== "en") return hinted;
  if (identifier.hint && hinted === "en" && (identifier.hint || "").toLowerCase().startsWith("en")) {
    return "en";
  }

  if (!supabaseAdmin) return "en";

  const userId = (identifier.userId || "").trim();
  const email = (identifier.email || "").trim().toLowerCase();

  try {
    if (userId) {
      const { data } = await supabaseAdmin
        .from("customer_profiles")
        .select("language")
        .eq("id", userId)
        .maybeSingle();
      const lang = data?.language || null;
      if (lang) return normalizeAppLocaleSafe(lang);
    }

    if (email) {
      const { data } = await supabaseAdmin
        .from("customer_profiles")
        .select("language")
        .eq("email", email)
        .maybeSingle();
      const lang = data?.language || null;
      if (lang) return normalizeAppLocaleSafe(lang);
    }
  } catch {
    // best-effort — never break email/notification dispatch on lookup failure.
  }

  return "en";
}

/**
 * Bulk variant — useful for batch dispatch (digests, reminders) where many
 * recipients share infra and you want to look them up in parallel.
 */
export async function resolveRecipientLocales(
  supabaseAdmin: DuckSupabaseClient | null | undefined,
  identifiers: RecipientLocaleIdentifier[],
): Promise<AppLocaleString[]> {
  return Promise.all(identifiers.map((id) => resolveRecipientLocale(supabaseAdmin, id)));
}
