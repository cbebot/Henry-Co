import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/owner-auth";
import { AppShell } from "./_components/AppShell";

// The owner gate must run on every request — never prerender a gated segment
// (a build-time render would freeze in the unauthenticated redirect).
export const dynamic = "force-dynamic";

/**
 * Server-level gate for every authenticated surface. Unauthenticated requests
 * are redirected to /login; signed-in-but-not-owner (and misconfigured) land on
 * /no-access. No dashboard UI is ever sent to a non-owner.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const auth = await requireOwner();
  if (!auth.ok) {
    redirect(auth.reason === "unauthorized" ? "/login" : "/no-access");
  }

  // Enforce 2FA: if the owner has enrolled an authenticator, the session must be
  // elevated to aal2 before any dashboard surface is shown. Enrollment on
  // /settings still works at aal1 because a new factor stays unverified (and
  // thus doesn't raise the required level) until it's confirmed.
  // NOTE: redirect() throws NEXT_REDIRECT, so it must run OUTSIDE the try/catch.
  let needsMfa = false;
  try {
    const { data: aal } = await auth.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    needsMfa = Boolean(aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2");
  } catch {
    needsMfa = false;
  }
  if (needsMfa) {
    redirect("/login?next=/dashboard");
  }

  return <AppShell ownerEmail={auth.user.email ?? null}>{children}</AppShell>;
}
