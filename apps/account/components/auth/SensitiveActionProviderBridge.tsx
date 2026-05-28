"use client";

/**
 * V3-02 S4 — host wrapper that mounts the SensitiveActionModalProvider.
 *
 * The provider lives in `@henryco/auth/client` (a pure UI/state
 * component) but it needs a `submit` callback that knows how to call
 * THIS app's Supabase browser client. This bridge keeps the wiring in
 * apps/account so the package stays decoupled from any one app's
 * factory.
 *
 * Mounted once in the account root layout — every route below it can
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
        const supabase = createSupabaseBrowser();
        if (params.method === "password") {
          const targetEmail = params.email || email;
          if (!targetEmail || !params.password) {
            return { ok: false, reason: "unknown" };
          }
          const { error } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: params.password,
          });
          if (error) {
            const msg = error.message?.toLowerCase() ?? "";
            const incorrect = msg.includes("invalid") || msg.includes("credential");
            const rateLimited = msg.includes("rate") || msg.includes("too many");
            return {
              ok: false,
              reason: incorrect
                ? "incorrect"
                : rateLimited
                  ? "rate_limited"
                  : "unknown",
            };
          }
          return { ok: true };
        }

        // magic-link path
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
