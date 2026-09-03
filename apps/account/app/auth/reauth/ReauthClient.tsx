"use client";
/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MailCheck, ShieldCheck } from "lucide-react";
import {
  authMethodOAuthProvider,
  authMethodProviderName,
  isOAuthMethod,
  type AuthMethod,
} from "@henryco/auth";
import {
  createSessionBroadcaster,
  releaseIdempotencyKey,
} from "@henryco/auth/client";
import { emitEvent } from "@henryco/observability/events";
import { persistEvent } from "@henryco/observability/persist-event";
import { translateSurfaceLabel, type AuthSessionCopy } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import PasswordField from "@/components/auth/PasswordField";
import AuthSubmit from "@/components/auth/AuthSubmit";
import AuthErrorNotice from "@/components/auth/AuthErrorNotice";

import "./reauth.css";

/**
 * ReauthClient — V3-01 reauth route client wrapper (premium rebuild).
 *
 * Presentation now runs through the shared Henry Onyx auth primitives
 * (rendered inside the page's <AuthShell>): the password path uses the
 * canonical PasswordField + AuthSubmit, the magic-link and OAuth
 * alternates are .auth-provider buttons under an .auth-divider, and the
 * identity card + draft notice + switch-account section use the auth.css
 * language. No hand-rolled eye-toggle; no @henryco/ui/ReauthScreen.
 *
 * The security spine is VERBATIM from the prior wrapper: the per-method
 * Supabase calls (password / magic link / OAuth / signOut discard), the
 * `henry.auth.session.reauth_succeeded` emit + Slice 5b persistEvent
 * dual-write + cross-tab `user-changed` broadcast, the idempotency-key
 * release, and the `router.replace(returnPath)` handoff are unchanged.
 *
 * All reauth copy leaves route through Pattern B runtime translation
 * (`translateSurfaceLabel`), matching the auth-session-copy contract.
 */

export type ReauthViewer = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ReauthResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "password_incorrect"
        | "magic_link_failed"
        | "oauth_failed"
        | "unknown";
    };

export type ReauthClientProps = {
  viewer: ReauthViewer;
  authMethod: AuthMethod;
  returnPath: string;
  returnAbsoluteUrl: string;
  intent: "form" | "page";
  draftKey: string | null;
  copy: AuthSessionCopy;
};

type ScreenState =
  | { kind: "idle" }
  | { kind: "silent_oauth" }
  | { kind: "submitting_password" }
  | { kind: "sending_magic_link" }
  | { kind: "magic_link_sent" }
  | { kind: "opening_oauth" }
  | { kind: "error"; message: string }
  | { kind: "success" };

export function ReauthClient(props: ReauthClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const locale = useHenryCoLocale();
  const c = props.copy.reauth;

  // Localize a reauth copy leaf (Pattern B runtime translation).
  const t = useCallback(
    (label: string) => translateSurfaceLabel(locale, label),
    [locale],
  );

  const isOAuth = isOAuthMethod(props.authMethod);
  const providerLabel = authMethodProviderName(props.authMethod) ?? "your provider";

  const [state, setState] = useState<ScreenState>({ kind: "idle" });
  const [password, setPassword] = useState("");

  // ─── Security spine (verbatim) ─────────────────────────────────────────
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
  // ─── end security spine ────────────────────────────────────────────────

  // Silent OAuth attempt on mount for OAuth users — most users skip the
  // screen entirely if upstream still has a valid session.
  const silentAttemptedRef = useRef(false);
  useEffect(() => {
    if (!isOAuth || silentAttemptedRef.current) return;
    silentAttemptedRef.current = true;
    let cancelled = false;
    setState({ kind: "silent_oauth" });
    (async () => {
      const result = await onOAuthRequest(true);
      if (cancelled) return;
      if (result.ok) {
        setState({ kind: "success" });
        handleSuccess();
        return;
      }
      // Silent failed — drop to idle so the user can click the explicit
      // "Continue with {provider}" button.
      setState({ kind: "idle" });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOAuth]);

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (state.kind === "submitting_password") return;
    setState({ kind: "submitting_password" });
    const result = await onPasswordSubmit(password);
    if (result.ok) {
      setState({ kind: "success" });
      handleSuccess();
      return;
    }
    const message =
      result.reason === "password_incorrect"
        ? t(c.errorPasswordIncorrect)
        : t(c.errorGeneric);
    setState({ kind: "error", message });
  }

  async function handleMagicLink() {
    if (state.kind === "sending_magic_link") return;
    setState({ kind: "sending_magic_link" });
    const result = await onMagicLinkRequest();
    if (result.ok) {
      setState({ kind: "magic_link_sent" });
      return;
    }
    setState({ kind: "error", message: t(c.errorMagicLinkFailed) });
  }

  async function handleOAuthClick() {
    if (state.kind === "opening_oauth") return;
    setState({ kind: "opening_oauth" });
    const result = await onOAuthRequest(false);
    if (result.ok) {
      setState({ kind: "success" });
      handleSuccess();
      return;
    }
    setState({ kind: "error", message: t(c.errorOAuthFailed) });
  }

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  async function handleConfirmDiscard() {
    setShowDiscardConfirm(false);
    await onDiscardAndSwitch();
  }

  const draftBody =
    props.intent === "form" ? c.draftPreservedFormBody : c.draftPreservedPageBody;
  const isBusy =
    state.kind === "silent_oauth" ||
    state.kind === "submitting_password" ||
    state.kind === "sending_magic_link" ||
    state.kind === "opening_oauth";
  const magicLinkSent = state.kind === "magic_link_sent";
  const errorMessage = state.kind === "error" ? state.message : null;

  return (
    <div className="reauth">
      <AuthErrorNotice message={errorMessage} />

      {/* ─── identity card (email locked to the JWT subject) ───────────── */}
      <div className="reauth-identity">
        {props.viewer.avatarUrl ? (
          <img
            src={props.viewer.avatarUrl}
            alt=""
            className="reauth-identity-avatar"
          />
        ) : (
          <span className="reauth-identity-avatar reauth-identity-avatar--fallback" aria-hidden>
            {props.viewer.email.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="reauth-identity-body">
          <span className="reauth-identity-label">{t(c.emailLockedLabel)}</span>
          <span className="reauth-identity-email">{props.viewer.email}</span>
        </span>
      </div>

      {/* ─── draft-preservation notice ────────────────────────────────── */}
      <div className="reauth-draft" role="status" aria-live="polite">
        <span className="reauth-draft-icon" aria-hidden>
          <ShieldCheck size={18} />
        </span>
        <span className="reauth-draft-body">
          <span className="reauth-draft-title">{t(c.draftPreservedTitle)}</span>
          <span className="reauth-draft-note">{t(draftBody)}</span>
        </span>
      </div>

      {/* ─── method-specific block ────────────────────────────────────── */}
      {magicLinkSent ? (
        <div className="auth-success" role="status" aria-live="polite">
          <span className="auth-success-icon" aria-hidden>
            <MailCheck size={22} />
          </span>
          <div>
            <p className="reauth-success-title">{t(c.magicLinkSentTitle)}</p>
            <p className="reauth-success-body">{t(c.magicLinkSentBody)}</p>
          </div>
          <button
            type="button"
            className="reauth-link-button"
            onClick={handleMagicLink}
          >
            {t(c.magicLinkResend)}
          </button>
        </div>
      ) : isOAuth ? (
        <div>
          {state.kind === "silent_oauth" ? (
            <p className="reauth-oauth-status" role="status" aria-live="polite">
              {t(c.oauthSilentAttempting)}
            </p>
          ) : (
            <>
              {state.kind === "idle" ? (
                <p className="auth-field-hint reauth-oauth-hint">
                  {t(c.oauthSilentFailed)}
                </p>
              ) : null}
              <button
                type="button"
                className="auth-provider reauth-provider-primary"
                onClick={handleOAuthClick}
                disabled={state.kind === "opening_oauth"}
              >
                {state.kind === "opening_oauth"
                  ? t(c.oauthBusy)
                  : t(c.oauthContinueWith).replace("{provider}", providerLabel)}
              </button>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="auth-stagger" noValidate>
          <div className="auth-fieldset">
            <PasswordField
              label={t(c.passwordLabel)}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t(c.passwordPlaceholder)}
              autoComplete="current-password"
              required
              invalid={state.kind === "error"}
              showLabel={t(c.passwordShowAria)}
              hideLabel={t(c.passwordHideAria)}
            />
          </div>

          <AuthSubmit
            label={t(c.submitPassword)}
            pendingLabel={t(c.submitPasswordBusy)}
            pending={state.kind === "submitting_password"}
            disabled={!password}
          />

          <div className="auth-divider">{t(c.magicLinkPrompt)}</div>

          <button
            type="button"
            className="auth-provider"
            onClick={handleMagicLink}
            disabled={state.kind === "sending_magic_link"}
          >
            {state.kind === "sending_magic_link"
              ? t(c.magicLinkBusy)
              : t(c.magicLinkButton)}
          </button>
        </form>
      )}

      {/* ─── discard / switch-account ─────────────────────────────────── */}
      <div className="reauth-switch">
        <p className="reauth-switch-title">{t(c.switchAccountTitle)}</p>
        <p className="reauth-switch-body">{t(c.switchAccountBody)}</p>
        <button
          type="button"
          className="reauth-link-button"
          onClick={() => setShowDiscardConfirm(true)}
          disabled={isBusy}
        >
          {t(c.switchAccountButton)}
        </button>
      </div>

      {/* ─── discard confirm dialog ───────────────────────────────────── */}
      {showDiscardConfirm ? (
        <div
          className="reauth-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reauth-confirm-title"
        >
          <div className="reauth-confirm">
            <p id="reauth-confirm-title" className="reauth-confirm-title">
              {t(c.switchAccountConfirmTitle)}
            </p>
            <p className="reauth-confirm-body">{t(c.switchAccountConfirmBody)}</p>
            <div className="reauth-confirm-actions">
              <button
                type="button"
                className="auth-provider reauth-confirm-cancel"
                onClick={() => setShowDiscardConfirm(false)}
              >
                {t(c.switchAccountConfirmCancel)}
              </button>
              <button
                type="button"
                className="reauth-confirm-discard"
                onClick={handleConfirmDiscard}
              >
                <CheckCircle2 size={16} aria-hidden />
                {t(c.switchAccountConfirmYes)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
