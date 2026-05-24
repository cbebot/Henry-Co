"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  authMethodOAuthProvider,
  type AuthMethod,
} from "@henryco/auth";
import {
  createSessionBroadcaster,
  releaseIdempotencyKey,
} from "@henryco/auth/client";
import { emitEvent } from "@henryco/observability/events";
import { persistEvent } from "@henryco/observability/persist-event";
import { ReauthScreen, type ReauthResult, type ReauthViewer } from "@henryco/ui";
import type { AuthSessionCopy } from "@henryco/i18n";

import { createSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * ReauthClient — V3-01 reauth route client wrapper.
 *
 * Wires the per-method Supabase calls (password / magic link / OAuth)
 * into the shared ReauthScreen component, emits the
 * `henry.auth.session.reauth_succeeded` event on success, broadcasts
 * `user-changed` across tabs, releases the in-flight Idempotency-Key
 * for the captured draft, and navigates to the return path.
 *
 * Slice 5b dual-write: `handleSuccess` also `persistEvent`s the
 * reauth_succeeded row so the owner session-health tile's "Reauths
 * today" metric actually populates. Server-side events (refreshed,
 * refresh_failed) are persisted in verify-supabase-session; reauth
 * is browser-side because the success state only exists here.
 */

export type ReauthClientProps = {
  viewer: ReauthViewer;
  authMethod: AuthMethod;
  returnPath: string;
  returnAbsoluteUrl: string;
  intent: "form" | "page";
  draftKey: string | null;
  copy: AuthSessionCopy;
};

export function ReauthClient(props: ReauthClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const handleSuccess = useCallback(() => {
    emitEvent({
      name: "henry.auth.session.reauth_succeeded",
      classification: "user_action",
      outcome: "completed",
      payload: {
        intent: props.intent,
        method: props.authMethod,
        hasDraft: props.draftKey != null,
      },
    });

    // Slice 5b dual-write to henry_events. The RLS policy accepts
    // inserts where actor_id IS NULL OR actor_id = auth.uid(); we
    // send null because ReauthViewer doesn't carry the user id and
    // the owner tile counts rows by name (not by actor) — `actor_id`
    // is reserved for downstream analytics, not the rollback gate.
    // Fire-and-forget — persistEvent swallows failures so a telemetry
    // hiccup never blocks the draft restore / redirect.
    void persistEvent({
      supabase,
      name: "henry.auth.session.reauth_succeeded",
      actorId: null,
      payload: {
        intent: props.intent,
        method: props.authMethod,
        hasDraft: props.draftKey != null,
      },
    });

    const broadcaster = createSessionBroadcaster();
    broadcaster.publish({
      type: "user-changed",
      userId: "self",
    });
    broadcaster.close();

    router.replace(props.returnPath);
  }, [
    props.authMethod,
    props.draftKey,
    props.intent,
    props.returnPath,
    router,
    supabase,
  ]);

  const onPasswordSubmit = useCallback(
    async (password: string): Promise<ReauthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: props.viewer.email,
        password,
      });
      if (error) {
        const message = error.message?.toLowerCase() ?? "";
        const incorrect =
          message.includes("invalid") || message.includes("credential");
        return { ok: false, reason: incorrect ? "password_incorrect" : "unknown" };
      }
      return { ok: true };
    },
    [supabase, props.viewer.email],
  );

  const onMagicLinkRequest = useCallback(async (): Promise<ReauthResult> => {
    const { error } = await supabase.auth.signInWithOtp({
      email: props.viewer.email,
      options: {
        emailRedirectTo: props.returnAbsoluteUrl,
        shouldCreateUser: false,
      },
    });
    if (error) return { ok: false, reason: "magic_link_failed" };
    return { ok: true };
  }, [supabase, props.viewer.email, props.returnAbsoluteUrl]);

  const onOAuthRequest = useCallback(
    async (silent: boolean): Promise<ReauthResult> => {
      const provider = authMethodOAuthProvider(props.authMethod);
      if (!provider) return { ok: false, reason: "oauth_failed" };

      // Supabase narrows `provider` to a literal union of supported
      // OAuth providers. The auth-method helper guarantees we only
      // reach this branch for OAuth methods, so the cast is safe.
      const { error } = await supabase.auth.signInWithOAuth({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider: provider as any,
        options: {
          redirectTo: props.returnAbsoluteUrl,
          queryParams: silent ? { prompt: "none" } : undefined,
          skipBrowserRedirect: silent,
        },
      });

      if (error) return { ok: false, reason: "oauth_failed" };
      // For non-silent OAuth, Supabase handles the redirect itself —
      // returning ok here is informational only; the browser is
      // navigating away.
      return { ok: true };
    },
    [supabase, props.authMethod, props.returnAbsoluteUrl],
  );

  const onDiscardAndSwitch = useCallback(async () => {
    if (props.draftKey) {
      releaseIdempotencyKey(props.draftKey);
      // Best-effort draft localStorage cleanup (slice 3 owns the full
      // useFormDraft contract; this releases what slice 1 stored).
      try {
        window.localStorage.removeItem(`henryco.draft.${props.draftKey}`);
      } catch {
        // sessionStorage disabled — ignore
      }
    }
    await supabase.auth.signOut();
    router.replace("/login");
  }, [supabase, router, props.draftKey]);

  return (
    <ReauthScreen
      viewer={props.viewer}
      authMethod={props.authMethod}
      returnPath={props.returnPath}
      intent={props.intent}
      draftKey={props.draftKey}
      copy={props.copy}
      callbacks={{
        onPasswordSubmit,
        onMagicLinkRequest,
        onOAuthRequest,
        onDiscardAndSwitch,
        onReauthSucceeded: handleSuccess,
      }}
    />
  );
}
