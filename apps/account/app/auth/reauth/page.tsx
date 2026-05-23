import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { detectAuthMethod } from "@henryco/auth";
import { getAuthSessionCopy } from "@henryco/i18n";
import { henrySubdomain, isRecoverableSupabaseAuthError, normalizeTrustedRedirect } from "@henryco/config";

import { getAccountAppLocale } from "@/lib/locale-server";
import { createSupabaseServer } from "@/lib/supabase/server";

import { ReauthClient } from "./ReauthClient";

/**
 * /auth/reauth — V3-01 session-recovery surface.
 *
 * Behaviour:
 *   - If no Supabase session is present, fall back to /login (the
 *     legacy sign-in surface). Reauth requires a JWT to identify
 *     which user is round-tripping.
 *   - Read the V3-01 query params (return / intent / drafts) so we
 *     can land the user back exactly where they were.
 *   - Detect the auth method (Addendum A1) from app_metadata so the
 *     screen renders the matching reauth flow.
 *   - Compose i18n copy for the auth-session surface and hand off to
 *     the client component.
 *
 * The user's session is intentionally treated as PRESENT-BUT-STALE
 * here: we still have a JWT (Supabase auto-refreshed during the proxy
 * pass, or the access token is still valid for read-only scope) but
 * the proxy decided refresh failed for the in-flight request. Either
 * way, `supabase.auth.getUser()` from this server component should
 * return the user we'll be re-authenticating as.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAuthSessionCopy(locale);
  return { title: `${copy.reauth.headingFallback} — Henry & Co.` };
}

type ReauthSearchParams = {
  return?: string;
  intent?: string;
  drafts?: string;
};

export default async function ReauthPage({
  searchParams,
}: {
  searchParams: Promise<ReauthSearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServer();

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;
  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
  }

  if (!user) {
    // No JWT → can't reauth, fall back to /login with the same return.
    const returnPath = normalizeTrustedRedirect(params.return ?? "/");
    const loginUrl =
      returnPath === "/" ? "/login" : `/login?next=${encodeURIComponent(returnPath)}`;
    redirect(loginUrl);
  }

  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const forwardedProto = headerStore.get("x-forwarded-proto") || "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : henrySubdomain("account");

  const locale = await getAccountAppLocale();
  const copy = getAuthSessionCopy(locale);
  const authMethod = detectAuthMethod(user);

  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    typeof userMetadata.full_name === "string"
      ? userMetadata.full_name
      : typeof userMetadata.name === "string"
        ? userMetadata.name
        : null;
  const avatarUrl =
    typeof userMetadata.avatar_url === "string"
      ? userMetadata.avatar_url
      : typeof userMetadata.picture === "string"
        ? userMetadata.picture
        : null;

  const returnPath = normalizeTrustedRedirect(params.return ?? "/");
  const intent: "form" | "page" = params.intent === "form" ? "form" : "page";
  const draftKey = params.drafts && params.drafts.length > 0 ? params.drafts : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4 py-12">
      <ReauthClient
        viewer={{
          email: user.email ?? "",
          displayName,
          avatarUrl,
        }}
        authMethod={authMethod}
        returnPath={returnPath}
        returnAbsoluteUrl={`${origin}${returnPath}`}
        intent={intent}
        draftKey={draftKey}
        copy={copy}
      />
    </div>
  );
}
