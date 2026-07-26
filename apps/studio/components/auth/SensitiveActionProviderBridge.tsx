"use client";

/**
 * SA-2 — studio-origin host wrapper mounting the SensitiveActionModalProvider,
 * so the reauth-gated deploy approval can prompt for a password on the studio
 * subdomain (studio previously had no reauth surface). Mirrors the shipped
 * apps/jobs bridge; the password path POSTs same-origin /api/auth/reauth which
 * verifies server-side and writes the hc_last_reauth marker the guard reads.
 */

import { useMemo, type ReactNode } from "react";
import {
  SensitiveActionModalProvider,
  type ReauthOutcome,
} from "@henryco/auth/client/sensitive-action-modal";

import { getBrowserSupabase } from "@/lib/supabase/browser";

export function SensitiveActionProviderBridge({
  email,
  children,
}: {
  email: string | null;
  children: ReactNode;
}) {
  const submit = useMemo(
    () =>
      async (params: {
        method: "password" | "magic-link";
        email?: string;
        password?: string;
      }): Promise<ReauthOutcome> => {
        if (params.method === "password") {
          if (!params.password) return { ok: false, reason: "unknown" };
          let res: Response;
          try {
            res = await fetch("/api/auth/reauth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ method: "password", password: params.password }),
            });
          } catch {
            return { ok: false, reason: "unknown" };
          }
          const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string };
          if (data.ok) return { ok: true };
          const reason =
            data.reason === "incorrect" || data.reason === "rate_limited" ? data.reason : "unknown";
          return { ok: false, reason };
        }

        const supabase = getBrowserSupabase();
        const targetEmail = params.email || email;
        if (!targetEmail) return { ok: false, reason: "unknown" };
        const { error } = await supabase.auth.signInWithOtp({
          email: targetEmail,
          options: {
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}${window.location.pathname}${window.location.search}`
                : undefined,
            shouldCreateUser: false,
          },
        });
        if (error) {
          const msg = error.message?.toLowerCase() ?? "";
          const rateLimited = msg.includes("rate") || msg.includes("too many");
          return { ok: false, reason: rateLimited ? "rate_limited" : "magic_link_failed" };
        }
        return { ok: true };
      },
    [email],
  );

  return (
    <SensitiveActionModalProvider email={email} submit={submit}>
      {children}
    </SensitiveActionModalProvider>
  );
}
