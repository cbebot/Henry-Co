"use client";

/**
 * V3-02 S4 — Client side of the sensitive-action reauth flow.
 *
 * The server guard returns `401` + `WWW-Authenticate:
 * SensitiveActionReauth` + `X-HenryCo-Reauth-Intent: <action>` when
 * the user lacks a fresh credential for a sensitive route. This file
 * provides three pieces that compose to the spec contract:
 *
 *   1. `fetchWithSensitiveAction(input, init?)` — drop-in fetch
 *      replacement. When it sees the 401 challenge, it opens the
 *      modal, awaits a fresh reauth, then RETRIES the original
 *      request with the SAME `Idempotency-Key` header (Addendum
 *      A11). The retry response is what the caller receives.
 *   2. `SensitiveActionModalProvider` — wraps an app at the root.
 *      Hosts the modal singleton and listens for re-auth requests
 *      via a module-level event bus.
 *   3. `useSensitiveAction()` — opt-in React hook for components
 *      that want to invoke the modal directly (rare; most callers
 *      use the fetch wrapper).
 *
 * The modal supports password + magic-link reauth only — Addendum
 * A4 explicitly removes biometric from the web pass.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { emitEvent } from "@henryco/observability/events";

/* -------------------------------------------------------------------------- */
/*  Module-level coordination                                                 */
/* -------------------------------------------------------------------------- */

type ReauthSubmitter = (params: { method: "password" | "magic-link"; email?: string; password?: string }) => Promise<ReauthOutcome>;

export type ReauthOutcome =
  | { ok: true }
  | { ok: false; reason: "incorrect" | "magic_link_failed" | "rate_limited" | "unknown"; retryAfterSeconds?: number };

export type ReauthRequest = {
  intent: string;
  resolve: (success: boolean) => void;
};

type Listener = (req: ReauthRequest) => void;

const listeners = new Set<Listener>();

function requestReauth(intent: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (listeners.size === 0) {
      // No modal mounted — surface a console hint in dev and resolve
      // false so the caller can fall back to a hard redirect to
      // /auth/reauth. The provider not being mounted means the app's
      // root failed to wrap, which is a wiring bug.
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.warn(
          "[sensitive-action] No SensitiveActionModalProvider mounted; falling back to redirect.",
        );
        const url = `/auth/reauth?intent=form&action=${encodeURIComponent(intent)}&return=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        window.location.assign(url);
      }
      resolve(false);
      return;
    }
    const req: ReauthRequest = { intent, resolve };
    for (const listener of listeners) listener(req);
  });
}

/* -------------------------------------------------------------------------- */
/*  fetchWithSensitiveAction                                                  */
/* -------------------------------------------------------------------------- */

const SENSITIVE_AUTH_SCHEME = "SensitiveActionReauth";

/**
 * Spec-shape detection — match the guard's WWW-Authenticate header
 * verbatim. Case-insensitive on the scheme per RFC 7235.
 */
function isSensitiveActionChallenge(response: Response): boolean {
  if (response.status !== 401) return false;
  const header = response.headers.get("www-authenticate");
  if (!header) return false;
  return header.toLowerCase().includes(SENSITIVE_AUTH_SCHEME.toLowerCase());
}

function extractIntent(response: Response): string {
  // ONE canonical header name (X-HenryCo-Reauth-Intent, matching the guard). The old spaced
  // "X-Henry Onyx-..." variant is an invalid HTTP token — even READING it throws in
  // spec-compliant Headers implementations, so it must never be referenced again.
  return response.headers.get("x-henryco-reauth-intent") || "sensitive_action";
}

/**
 * Helper around `fetch` that handles the sensitive-action challenge.
 *
 * Behaviour:
 *   - Forward the original request.
 *   - If the response is a sensitive-action challenge, open the modal
 *     and `await` reauth. On success, replay the request with the
 *     same body / headers / Idempotency-Key. On failure, surface the
 *     original 401 response unchanged so the caller can decide.
 */
export async function fetchWithSensitiveAction(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const initial = await fetch(input, init);
  if (!isSensitiveActionChallenge(initial)) return initial;

  const intent = extractIntent(initial);
  const success = await requestReauth(intent);
  if (!success) return initial;

  emitEvent({
    name: "henry.auth.sensitive_action.reauth_succeeded",
    classification: "user_action",
    outcome: "completed",
    payload: { intent, retry: true },
  });

  // Re-issue the request. Body streams aren't reusable in modern
  // browsers, so for body-bearing requests the caller MUST pass a
  // serialised body (string / FormData / Blob / ArrayBuffer) rather
  // than a ReadableStream. Documented in the function jsdoc.
  return fetch(input, init);
}

/* -------------------------------------------------------------------------- */
/*  React provider + hook                                                     */
/* -------------------------------------------------------------------------- */

type ProviderContextValue = {
  request: (intent: string) => Promise<boolean>;
};

const ProviderContext = createContext<ProviderContextValue | null>(null);

export function useSensitiveAction(): ProviderContextValue {
  const ctx = useContext(ProviderContext);
  if (!ctx) {
    throw new Error(
      "useSensitiveAction must be used inside <SensitiveActionModalProvider>.",
    );
  }
  return ctx;
}

export type SensitiveActionCopy = {
  title: string;
  description: string;
  emailLabel: string;
  passwordLabel: string;
  passwordSubmit: string;
  magicLinkSubmit: string;
  magicLinkSent: string;
  rateLimited: string;
  incorrect: string;
  generic: string;
  cancel: string;
  switchToMagicLink: string;
  switchToPassword: string;
};

const DEFAULT_COPY: SensitiveActionCopy = {
  title: "Confirm your identity to continue",
  description:
    "For your security we need to re-verify it's you before this sensitive action goes through.",
  emailLabel: "Email",
  passwordLabel: "Password",
  passwordSubmit: "Confirm",
  magicLinkSubmit: "Send sign-in link",
  magicLinkSent: "Check your inbox — the link expires in 15 minutes.",
  rateLimited: "Too many attempts. Wait a moment, then try again.",
  incorrect: "That password didn't match. Try again.",
  generic: "We couldn't verify that. Please try again.",
  cancel: "Cancel",
  switchToMagicLink: "Use a sign-in link instead",
  switchToPassword: "Use my password instead",
};

export type SensitiveActionProviderProps = {
  children: ReactNode;
  /**
   * Email of the currently authenticated user. The modal uses this
   * to call signInWithPassword / signInWithOtp. When null the modal
   * falls back to redirecting to /auth/reauth.
   */
  email: string | null;
  /**
   * Async reauth submitter. Wired by the host app to the Supabase
   * browser client. Returns ReauthOutcome describing the result so
   * the modal can branch UI between incorrect-credential, rate-
   * limited, and magic-link-sent states.
   */
  submit: ReauthSubmitter;
  /** Optional i18n override; defaults to en-US copy. */
  copy?: Partial<SensitiveActionCopy>;
};

export function SensitiveActionModalProvider({
  children,
  email,
  submit,
  copy: copyOverride,
}: SensitiveActionProviderProps) {
  const [active, setActive] = useState<ReauthRequest | null>(null);
  const submitterRef = useRef(submit);
  submitterRef.current = submit;

  const copy = useMemo<SensitiveActionCopy>(
    () => ({ ...DEFAULT_COPY, ...(copyOverride ?? {}) }),
    [copyOverride],
  );

  useEffect(() => {
    const listener: Listener = (req) => setActive(req);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const close = useCallback(
    (success: boolean) => {
      if (active) {
        active.resolve(success);
        setActive(null);
      }
    },
    [active],
  );

  const value = useMemo<ProviderContextValue>(
    () => ({ request: (intent: string) => requestReauth(intent) }),
    [],
  );

  return (
    <ProviderContext.Provider value={value}>
      {children}
      {active ? (
        <SensitiveActionModalUI
          intent={active.intent}
          email={email}
          copy={copy}
          submit={(args) => submitterRef.current(args)}
          onClose={close}
        />
      ) : null}
    </ProviderContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modal UI                                                                  */
/* -------------------------------------------------------------------------- */

type ModalUIProps = {
  intent: string;
  email: string | null;
  copy: SensitiveActionCopy;
  submit: ReauthSubmitter;
  onClose: (success: boolean) => void;
};

type ModalState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "magic_sent" }
  | { kind: "error"; message: string };

type Method = "password" | "magic-link";

function SensitiveActionModalUI({
  intent,
  email,
  copy,
  submit,
  onClose,
}: ModalUIProps) {
  const [method, setMethod] = useState<Method>("password");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<ModalState>({ kind: "idle" });
  const dialogRef = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Telemetry: emit reauth_required so the modal appearing is
  // observable separately from the server-side guard event (the two
  // pair to confirm the round-trip closed cleanly).
  useEffect(() => {
    emitEvent({
      name: "henry.auth.sensitive_action.reauth_required",
      classification: "user_action",
      outcome: "started",
      payload: { intent, surface: "modal" },
    });
  }, [intent]);

  // Focus management — first input on open, ESC cancels.
  useEffect(() => {
    passwordRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (state.kind === "submitting") return;
      setState({ kind: "submitting" });
      const result = await submit({ method: "password", email: email ?? "", password });
      if (result.ok) {
        onClose(true);
        return;
      }
      const message =
        result.reason === "incorrect"
          ? copy.incorrect
          : result.reason === "rate_limited"
            ? copy.rateLimited
            : copy.generic;
      setState({ kind: "error", message });
    },
    [state.kind, submit, email, password, onClose, copy],
  );

  const handleMagicLink = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (state.kind === "submitting") return;
      setState({ kind: "submitting" });
      const result = await submit({ method: "magic-link", email: email ?? "" });
      if (result.ok) {
        setState({ kind: "magic_sent" });
        return;
      }
      setState({
        kind: "error",
        message: result.reason === "rate_limited" ? copy.rateLimited : copy.generic,
      });
    },
    [state.kind, submit, email, copy],
  );

  // Theme-aware via the host app's `--acct-*` CSS variables (which rebind under
  // `.dark`), each with a light fallback so the modal is still legible in an app
  // that doesn't define them. Replaces the old hardcoded `bg-white`/`text-neutral-*`
  // that rendered an un-themed white panel (invisible/jarring on a dark surface).
  const t = {
    surface: "var(--acct-surface, #ffffff)",
    ink: "var(--acct-ink, #171717)",
    muted: "var(--acct-muted, #525252)",
    line: "var(--acct-line, #e5e5e5)",
    bg: "var(--acct-bg, #ffffff)",
    bgSoft: "var(--acct-bg-soft, #f5f5f5)",
    gold: "var(--acct-gold-text, #b45309)",
    red: "var(--acct-red, #dc2626)",
    greenSoft: "var(--acct-green-soft, #ecfdf5)",
    green: "var(--acct-green, #047857)",
  } as const;
  const primaryBtn =
    "inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const primaryStyle = { background: t.ink, color: t.surface } as const;

  return (
    // The backdrop intentionally does NOT close on tap: this is a money/sensitive
    // reauth, and an accidental backdrop tap (easy on a mobile bottom-sheet) was
    // dismissing it mid-flow ("cancels itself"). Dismissal is explicit (Cancel/ESC).
    <div
      role="presentation"
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hc-sensitive-action-title"
        aria-describedby="hc-sensitive-action-desc"
        // max-h + scroll + safe-area padding so the Confirm button stays reachable
        // when the mobile keyboard opens over the bottom sheet ("no continue button").
        className="flex max-h-[92dvh] w-full max-w-[440px] flex-col overflow-y-auto overscroll-contain rounded-t-2xl p-6 shadow-2xl sm:rounded-2xl"
        style={{
          background: t.surface,
          color: t.ink,
          border: `1px solid ${t.line}`,
          paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
        }}
      >
        <header className="mb-4">
          <p
            data-intent={intent}
            className="text-[10.5px] font-semibold uppercase tracking-[0.32em]"
            style={{ color: t.gold }}
          >
            {intent.replaceAll(".", " ").replaceAll("_", " ")}
          </p>
          <h2 id="hc-sensitive-action-title" className="mt-1 text-lg font-semibold" style={{ color: t.ink }}>
            {copy.title}
          </h2>
          <p id="hc-sensitive-action-desc" className="mt-1 text-sm leading-relaxed" style={{ color: t.muted }}>
            {copy.description}
          </p>
        </header>

        {method === "password" ? (
          <form onSubmit={handlePassword} className="space-y-3">
            <label className="block text-sm font-medium" style={{ color: t.ink }}>
              {copy.emailLabel}
              <input
                type="email"
                value={email ?? ""}
                readOnly
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: t.bgSoft, border: `1px solid ${t.line}`, color: t.muted }}
              />
            </label>
            <label className="block text-sm font-medium" style={{ color: t.ink }}>
              {copy.passwordLabel}
              <input
                ref={passwordRef}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                style={{ background: t.bg, border: `1px solid ${t.line}`, color: t.ink }}
              />
            </label>
            {state.kind === "error" ? (
              <p role="alert" className="text-sm" style={{ color: t.red }}>
                {state.message}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                disabled={state.kind === "submitting" || password.length === 0}
                className={primaryBtn}
                style={primaryStyle}
              >
                {state.kind === "submitting" ? "…" : copy.passwordSubmit}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMethod("magic-link");
                  setState({ kind: "idle" });
                }}
                className="text-xs font-medium underline-offset-2 hover:underline"
                style={{ color: t.gold }}
              >
                {copy.switchToMagicLink}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <p className="text-sm leading-relaxed" style={{ color: t.muted }}>
              {copy.emailLabel}: <span className="font-medium" style={{ color: t.ink }}>{email}</span>
            </p>
            {state.kind === "magic_sent" ? (
              <p role="status" className="rounded-lg px-3 py-2 text-sm" style={{ background: t.greenSoft, color: t.green }}>
                {copy.magicLinkSent}
              </p>
            ) : null}
            {state.kind === "error" ? (
              <p role="alert" className="text-sm" style={{ color: t.red }}>
                {state.message}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 pt-1">
              {state.kind !== "magic_sent" ? (
                <button
                  type="submit"
                  disabled={state.kind === "submitting" || !email}
                  className={primaryBtn}
                  style={primaryStyle}
                >
                  {state.kind === "submitting" ? "…" : copy.magicLinkSubmit}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setMethod("password");
                  setState({ kind: "idle" });
                }}
                className="text-xs font-medium underline-offset-2 hover:underline"
                style={{ color: t.gold }}
              >
                {copy.switchToPassword}
              </button>
            </div>
          </form>
        )}

        <footer className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="text-xs hover:underline"
            style={{ color: t.muted }}
          >
            {copy.cancel}
          </button>
        </footer>
      </div>
    </div>
  );
}
