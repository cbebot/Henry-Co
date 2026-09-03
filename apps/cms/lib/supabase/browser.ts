import { createBrowserClient } from "@supabase/ssr";
import { getSharedCookieDomain } from "@henryco/config";

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser Supabase client (singleton). On a non-`.henrycogroup.com` host
 * `getSharedCookieDomain` returns `undefined`, giving per-host cookies — the
 * standalone CMS session is independent of the hub's shared session by design.
 */
export function createCmsSupabaseBrowser() {
  if (client) return client;

  const cookieDomain =
    typeof window === "undefined"
      ? undefined
      : getSharedCookieDomain(window.location.hostname);

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookieDomain
      ? {
          cookieOptions: {
            domain: cookieDomain,
            path: "/",
            sameSite: "lax",
            secure: true,
          },
        }
      : undefined
  );

  return client;
}
