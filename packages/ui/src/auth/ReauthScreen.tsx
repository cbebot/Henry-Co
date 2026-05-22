"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import {
  authMethodProviderName,
  isOAuthMethod,
  type AuthMethod,
} from "@henryco/auth";
import type { AuthSessionCopy } from "@henryco/i18n";

/**
 * ReauthScreen — the V3-01 user-facing surface that catches a user
 * whose session decayed mid-task and lets them sign back in WITHOUT
 * losing their draft.
 *
 * Key UX principles (Addendum A1 + V3-01 prompt S1/S2):
 *   1. Method-aware. The original auth method drives the primary UI:
 *      - "email" users see password + "send sign-in link" side by side.
 *      - "oauth_*" users see "Continue with {provider}" and we attempt
 *        a silent reauth on mount (`prompt=none`); full re-consent
 *        only fires on the user's explicit click.
 *   2. The screen NEVER offers "sign in as a different user" inline.
 *      Account-switch requires explicit draft discard with confirm.
 *   3. Visible draft-preservation notice — the user must SEE that
 *      their in-flight work is safe before being asked to sign in.
 *   4. No email-edit on this screen — the email is locked to whoever
 *      the JWT identified, so the rebound session is the SAME user.
 *
 * Layout-only component. The host page wires the Supabase calls via
 * callbacks; this component owns state + UI + telemetry hooks.
 */

export type ReauthViewer = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ReauthCallbacks = {
  /**
   * Re-validate the user's password via Supabase. The host wires this
   * to `supabase.auth.signInWithPassword({ email, password })`. Return
   * `{ ok: true }` on success or `{ ok: false, reason }` on failure.
   */
  onPasswordSubmit: (password: string) => Promise<ReauthResult>;
  /**
   * Send a magic sign-in link via `signInWithOtp`. Return ok when the
   * email was queued. The user completes via inbox.
   */
  onMagicLinkRequest: () => Promise<ReauthResult>;
  /**
   * Re-trigger OAuth with this user's provider. `silent=true` runs
   * `prompt=none` (no UI if the upstream session is still valid).
   * `silent=false` does full re-consent.
   */
  onOAuthRequest: (silent: boolean) => Promise<ReauthResult>;
  /**
   * Discard the saved draft + sign the user out + send them to the
   * sign-in page so they can choose a different account.
   */
  onDiscardAndSwitch: () => Promise<void>;
  /**
   * Fires once after any successful reauth method. The host emits
   * `henry.auth.session.reauth_succeeded` and navigates to the
   * `returnPath`.
   */
  onReauthSucceeded: () => void;
};

export type ReauthResult =
  | { ok: true }
  | { ok: false; reason: "password_incorrect" | "magic_link_failed" | "oauth_failed" | "unknown" };

export type ReauthScreenProps = {
  viewer: ReauthViewer;
  authMethod: AuthMethod;
  /** The URL we round-trip back to after a successful reauth. */
  returnPath: string;
  /** `form` (user was mid-typing) drives the more emphatic draft notice. */
  intent: "form" | "page";
  /** Opaque draft key supplied by S2/S6 — surfaced only as metadata. */
  draftKey: string | null;
  /** i18n bundle for the auth-session surface (`getAuthSessionCopy(locale)`). */
  copy: AuthSessionCopy;
  callbacks: ReauthCallbacks;
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

const FIRST_NAME_RE = /^([^\s]+)/;
function firstName(viewer: ReauthViewer): string | null {
  const name = viewer.displayName?.trim();
  if (!name) return null;
  const m = name.match(FIRST_NAME_RE);
  return m ? m[1] : null;
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

export function ReauthScreen(props: ReauthScreenProps) {
  const { viewer, authMethod, intent, draftKey, copy } = props;
  const c = copy.reauth;

  const [state, setState] = useState<ScreenState>({ kind: "idle" });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const isOAuth = isOAuthMethod(authMethod);

  // Silent OAuth attempt on mount for OAuth users — most users skip
  // the screen entirely if upstream still has a valid session.
  const silentAttemptedRef = useRef(false);
  useEffect(() => {
    if (!isOAuth || silentAttemptedRef.current) return;
    silentAttemptedRef.current = true;
    let cancelled = false;
    setState({ kind: "silent_oauth" });
    (async () => {
      const result = await props.callbacks.onOAuthRequest(true);
      if (cancelled) return;
      if (result.ok) {
        setState({ kind: "success" });
        props.callbacks.onReauthSucceeded();
        return;
      }
      // Silent failed — drop to idle so the user can click the
      // explicit "Continue with {provider}" button.
      setState({ kind: "idle" });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOAuth]);

  // Focus the password input when email-method users land idle.
  useEffect(() => {
    if (!isOAuth && state.kind === "idle") {
      passwordInputRef.current?.focus();
    }
  }, [isOAuth, state.kind]);

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (state.kind === "submitting_password") return;
    setState({ kind: "submitting_password" });
    const result = await props.callbacks.onPasswordSubmit(password);
    if (result.ok) {
      setState({ kind: "success" });
      props.callbacks.onReauthSucceeded();
      return;
    }
    const message =
      result.reason === "password_incorrect"
        ? c.errorPasswordIncorrect
        : c.errorGeneric;
    setState({ kind: "error", message });
  }

  async function handleMagicLink() {
    if (state.kind === "sending_magic_link") return;
    setState({ kind: "sending_magic_link" });
    const result = await props.callbacks.onMagicLinkRequest();
    if (result.ok) {
      setState({ kind: "magic_link_sent" });
      return;
    }
    setState({ kind: "error", message: c.errorMagicLinkFailed });
  }

  async function handleOAuthClick() {
    if (state.kind === "opening_oauth") return;
    setState({ kind: "opening_oauth" });
    const result = await props.callbacks.onOAuthRequest(false);
    if (result.ok) {
      setState({ kind: "success" });
      props.callbacks.onReauthSucceeded();
      return;
    }
    setState({ kind: "error", message: c.errorOAuthFailed });
  }

  async function handleConfirmDiscard() {
    setShowDiscardConfirm(false);
    await props.callbacks.onDiscardAndSwitch();
  }

  const name = firstName(viewer);
  const heading = name ? fill(c.headingWithName, { name }) : c.headingFallback;
  const providerLabel = authMethodProviderName(authMethod);
  const draftBody =
    intent === "form" ? c.draftPreservedFormBody : c.draftPreservedPageBody;
  const isBusy =
    state.kind === "silent_oauth" ||
    state.kind === "submitting_password" ||
    state.kind === "sending_magic_link" ||
    state.kind === "opening_oauth";

  return (
    <div className="hc-reauth-root mx-auto w-full max-w-md">
      {/* ─── header ──────────────────────────────────────────── */}
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {heading}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{c.subheading}</p>
      </header>

      {/* ─── identity card ───────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        {viewer.avatarUrl ? (
          <img
            src={viewer.avatarUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="h-9 w-9 shrink-0 rounded-full bg-muted text-sm font-semibold uppercase text-muted-foreground flex items-center justify-center">
            {viewer.email.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {c.emailLockedLabel}
          </div>
          <div className="truncate text-sm font-medium text-foreground">
            {viewer.email}
          </div>
        </div>
      </div>

      {/* ─── draft notice ────────────────────────────────────── */}
      <div
        className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/20"
        role="status"
        aria-live="polite"
      >
        <ShieldCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {c.draftPreservedTitle}
          </div>
          <div className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-200/80">
            {draftBody}
          </div>
          {draftKey ? (
            <div className="mt-1 font-mono text-[10px] text-amber-700/80 dark:text-amber-300/70">
              {draftKey}
            </div>
          ) : null}
        </div>
      </div>

      {/* ─── error banner ────────────────────────────────────── */}
      {state.kind === "error" ? (
        <div
          className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <div className="font-medium">{c.errorTitle}</div>
            <div className="mt-0.5 text-xs">{state.message}</div>
          </div>
        </div>
      ) : null}

      {/* ─── method-specific block ───────────────────────────── */}
      {isOAuth ? (
        <OAuthBlock
          state={state}
          providerLabel={providerLabel ?? "your provider"}
          copy={c}
          onClick={handleOAuthClick}
        />
      ) : (
        <EmailBlock
          state={state}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          passwordInputRef={passwordInputRef}
          onPasswordSubmit={handlePasswordSubmit}
          onMagicLink={handleMagicLink}
          copy={c}
        />
      )}

      {/* ─── discard / switch-account ────────────────────────── */}
      <div className="mt-8 border-t border-border pt-5">
        <div className="text-xs font-medium text-muted-foreground">
          {c.switchAccountTitle}
        </div>
        <div className="mt-1 text-xs text-muted-foreground/80">
          {c.switchAccountBody}
        </div>
        <button
          type="button"
          onClick={() => setShowDiscardConfirm(true)}
          disabled={isBusy}
          className="mt-2 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
        >
          {c.switchAccountButton}
        </button>
      </div>

      {/* ─── discard confirm dialog ──────────────────────────── */}
      {showDiscardConfirm ? (
        <DiscardConfirm
          copy={c}
          onCancel={() => setShowDiscardConfirm(false)}
          onConfirm={handleConfirmDiscard}
        />
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */

function EmailBlock(props: {
  state: ScreenState;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  passwordInputRef: React.RefObject<HTMLInputElement | null>;
  onPasswordSubmit: (e: FormEvent) => Promise<void>;
  onMagicLink: () => Promise<void>;
  copy: AuthSessionCopy["reauth"];
}) {
  const c = props.copy;
  const passwordBusy = props.state.kind === "submitting_password";
  const magicLinkBusy = props.state.kind === "sending_magic_link";
  const magicLinkSent = props.state.kind === "magic_link_sent";

  if (magicLinkSent) {
    return (
      <div
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm dark:border-emerald-900/40 dark:bg-emerald-900/20"
        role="status"
        aria-live="polite"
      >
        <div className="font-medium text-emerald-900 dark:text-emerald-100">
          {c.magicLinkSentTitle}
        </div>
        <div className="mt-1 text-xs text-emerald-800/90 dark:text-emerald-200/80">
          {c.magicLinkSentBody}
        </div>
        <button
          type="button"
          onClick={props.onMagicLink}
          className="mt-3 text-xs font-medium text-emerald-900 underline underline-offset-2 hover:text-emerald-700 dark:text-emerald-100"
        >
          {c.magicLinkResend}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={props.onPasswordSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="hc-reauth-password"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {c.passwordLabel}
        </label>
        <div className="relative">
          <input
            id="hc-reauth-password"
            ref={props.passwordInputRef}
            type={props.showPassword ? "text" : "password"}
            value={props.password}
            onChange={(e) => props.setPassword(e.target.value)}
            placeholder={c.passwordPlaceholder}
            required
            autoComplete="current-password"
            className="block w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm shadow-sm outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => props.setShowPassword(!props.showPassword)}
            aria-label={props.showPassword ? c.passwordHideAria : c.passwordShowAria}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {props.showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={passwordBusy || !props.password}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
      >
        {passwordBusy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {c.submitPasswordBusy}
          </>
        ) : (
          <>
            {c.submitPassword}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            {c.magicLinkPrompt}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={props.onMagicLink}
        disabled={magicLinkBusy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
      >
        {magicLinkBusy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {c.magicLinkBusy}
          </>
        ) : (
          c.magicLinkButton
        )}
      </button>
    </form>
  );
}

function OAuthBlock(props: {
  state: ScreenState;
  providerLabel: string;
  copy: AuthSessionCopy["reauth"];
  onClick: () => Promise<void>;
}) {
  const c = props.copy;
  const silent = props.state.kind === "silent_oauth";
  const opening = props.state.kind === "opening_oauth";

  if (silent) {
    return (
      <div
        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-6 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {c.oauthSilentAttempting}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {props.state.kind === "idle" ? (
        <p className="text-xs text-muted-foreground">{c.oauthSilentFailed}</p>
      ) : null}
      <button
        type="button"
        onClick={props.onClick}
        disabled={opening}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
      >
        {opening ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {c.oauthBusy}
          </>
        ) : (
          <>
            {fill(c.oauthContinueWith, { provider: props.providerLabel })}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
}

function DiscardConfirm(props: {
  copy: AuthSessionCopy["reauth"];
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const c = props.copy;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hc-reauth-discard-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl">
        <h2
          id="hc-reauth-discard-title"
          className="text-lg font-semibold text-foreground"
        >
          {c.switchAccountConfirmTitle}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {c.switchAccountConfirmBody}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={props.onCancel}
            className="inline-flex justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {c.switchAccountConfirmCancel}
          </button>
          <button
            type="button"
            onClick={props.onConfirm}
            className="inline-flex justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {c.switchAccountConfirmYes}
          </button>
        </div>
      </div>
    </div>
  );
}
