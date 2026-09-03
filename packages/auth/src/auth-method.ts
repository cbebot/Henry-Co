/**
 * detectAuthMethod — read the Supabase `app_metadata.provider` claim
 * (and a small amount of `user_metadata` heuristic) to determine which
 * reauth flow to render on /auth/reauth.
 *
 * Per Addendum A1, the ReauthScreen routes per the original sign-in
 * method:
 *   - email / password → password-prompt + magic-link fallback
 *   - email / magic-link → magic-link prompt + password fallback
 *   - OAuth → "continue with <provider>" with silent `prompt=none`
 *     first, then full re-consent
 *
 * Supabase normalises both password and magic-link sign-ins under
 * `app_metadata.provider === "email"`, so the two collapse to a single
 * "email" auth method at the screen level (both UIs are shown; the
 * user picks). OAuth providers each get their own enum value so the
 * UI can render the right provider button.
 *
 * Client-safe — reads structured user data, no server-only side effect.
 */

export type AuthMethod =
  | "email"
  | "oauth_google"
  | "oauth_apple"
  | "oauth_github"
  | "oauth_facebook"
  | "oauth_other"
  | "unknown";

export type AuthMethodSubject = {
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
  email?: string | null;
};

/**
 * Provider name as it would be rendered in user-facing copy
 * ("Continue with {provider}"). Returns `null` when the method is
 * `email` / `unknown` — in those cases the screen doesn't render an
 * OAuth-style button.
 */
export function authMethodProviderName(method: AuthMethod): string | null {
  switch (method) {
    case "oauth_google":
      return "Google";
    case "oauth_apple":
      return "Apple";
    case "oauth_github":
      return "GitHub";
    case "oauth_facebook":
      return "Facebook";
    case "oauth_other":
      return "your provider";
    case "email":
    case "unknown":
    default:
      return null;
  }
}

/**
 * The Supabase OAuth provider slug to pass into
 * `supabase.auth.signInWithOAuth({ provider })` for this method.
 * Returns `null` for non-OAuth methods.
 */
export function authMethodOAuthProvider(method: AuthMethod): string | null {
  switch (method) {
    case "oauth_google":
      return "google";
    case "oauth_apple":
      return "apple";
    case "oauth_github":
      return "github";
    case "oauth_facebook":
      return "facebook";
    case "oauth_other":
    case "email":
    case "unknown":
    default:
      return null;
  }
}

export function isOAuthMethod(method: AuthMethod): boolean {
  return method.startsWith("oauth_");
}

export function detectAuthMethod(
  user: AuthMethodSubject | null | undefined,
): AuthMethod {
  if (!user) return "unknown";
  const appMetadata = user.app_metadata ?? {};
  const rawProvider = String(
    (appMetadata as { provider?: unknown }).provider ?? "",
  )
    .trim()
    .toLowerCase();

  if (rawProvider === "email") {
    return "email";
  }
  if (rawProvider === "google") return "oauth_google";
  if (rawProvider === "apple") return "oauth_apple";
  if (rawProvider === "github") return "oauth_github";
  if (rawProvider === "facebook") return "oauth_facebook";
  if (rawProvider) return "oauth_other";

  // Some legacy Supabase users have no provider claim — fall back to
  // checking the identities list when present, otherwise we treat them
  // as email (the original Supabase auth method).
  const providers = (appMetadata as { providers?: unknown }).providers;
  if (Array.isArray(providers) && providers.length > 0) {
    const first = String(providers[0] ?? "").trim().toLowerCase();
    if (first === "email") return "email";
    if (first === "google") return "oauth_google";
    if (first === "apple") return "oauth_apple";
    if (first === "github") return "oauth_github";
    if (first === "facebook") return "oauth_facebook";
    if (first) return "oauth_other";
  }

  if (user.email) return "email";
  return "unknown";
}
