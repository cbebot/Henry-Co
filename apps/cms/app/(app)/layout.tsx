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
  return <AppShell ownerEmail={auth.user.email ?? null}>{children}</AppShell>;
}
