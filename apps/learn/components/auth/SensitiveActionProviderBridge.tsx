"use client";

/**
 * V3-02 S4 — host wrapper that mounts the SensitiveActionModalProvider.
 *
 * The provider lives in `@henryco/auth/client` (a pure UI/state
 * component) but it needs a `submit` callback that knows how to call
 * THIS app's Supabase browser client. This bridge keeps the wiring in
 * apps/learn so the package stays decoupled from any one app's
 * factory.
 *
 * Mounted once in the learn root layout — every route below it can
 * trigger the reauth modal via the module-level event bus inside
 * `fetchWithSensitiveAction` (drop-in `fetch` replacement) or via the
 * `useSensitiveAction()` hook.
 */

import { useMemo, type ReactNode } from "react";
import {
  SensitiveActionModalProvider,
  type ReauthOutcome,
} from "@henryco/auth/client/sensitive-action-modal";

import { createSupabaseBrowser } from "@/lib/supabase/browser";

export type SensitiveActionProviderBridgeProps = {
  email: string | null;
  children: ReactNode;
};

export function SensitiveActionProviderBridge({
  email,
  children,
}: SensitiveActionProviderBridgeProps) {
  const submit = useMemo(
    () =>
      async (params: {
        method: "password" | "magic-link";
        email?: string;
        password?: string;
      }): Promise<ReauthOutcome> => {
        if (params.method === "password") {
          // V3-02-FIX: reauth MUST be verified server-side so the guard's
          // `hc_last_reauth` marker gets written. A client-only signInWithPassword
          // refreshed the session but never set that cookie, so every sensitive
          // action re-challenged forever ("confirm your identity" loop).
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
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            reason?: string;
          };
          if (data.ok) return { ok: true };
          const reason =
            data.reason === "incorrect" || data.reason === "rate_limited"
              ? data.reason
              : "unknown";
          return { ok: false, reason };
        }

        // magic-link path
        const supabase = createSupabaseBrowser();
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
          return {
            ok: false,
            reason: rateLimited ? "rate_limited" : "magic_link_failed",
          };
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
