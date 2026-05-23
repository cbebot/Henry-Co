"use client";

/**
 * apps/account/app/global-error.tsx — V3-10 last-resort fallback.
 *
 * DIAG-IOS-01 architectural safety net.
 *
 * Next.js renders this when the root `app/error.tsx` itself throws —
 * which happens whenever the canonical error boundary depends on a
 * context that is also missing (the classic "double-throw" trap that
 * surfaced in `apps/care` and again on `(account)/error.tsx` before
 * this pass).
 *
 * Critical invariants for global-error:
 *
 *   1. Renders its own `<html>` + `<body>` because Next.js replaces the
 *      root layout when this boundary fires.
 *   2. Imports ZERO context-dependent hooks. No `useHenryCoLocale`, no
 *      `useTheme`, no `useRouter` — anything that could itself throw.
 *   3. Static English copy + inline styles only. No CSS imports — if
 *      the bundle that defines `--acct-*` tokens failed to load, the
 *      CSS variables would resolve to `initial` and the fallback would
 *      paint as a blank page. Inline styles bypass the cascade entirely.
 *   4. Self-contained error reporting via `fetch(/api/runtime-error)`.
 *      The endpoint is hardened to swallow malformed payloads.
 *   5. The visual matches the V3-10 calm fallback shape so a user who
 *      double-throws sees a consistent design language, not a stack
 *      trace or a stark "Application error" white page.
 *
 * Anti-pattern reference: this file MUST NOT depend on
 * `@henryco/ui/public-shell` (`HenryCoErrorFallback`) because that
 * component is hooked into the i18n + Sentry chain — if either fails to
 * load (e.g. iOS Safari Private Browsing localStorage throw cascades
 * into a chunk-load failure), the boundary would re-throw. Inline JSX
 * + inline styles only.
 */
import { useEffect } from "react";

const DIVISION = "account.global";

export default function AccountGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Best-effort phone-home. ALL fields nullable; the server route is
    // idempotent and silently swallows malformed bodies. Wrapped in
    // try/catch so a network failure cannot rethrow inside a boundary
    // that already exists because of an earlier rethrow.
    try {
      void fetch("/api/runtime-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          surface: DIVISION,
          digest: error?.digest ?? null,
          message: error?.message ?? null,
          stack: error?.stack ?? null,
          path: typeof window !== "undefined" ? window.location.pathname : null,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          at: new Date().toISOString(),
        }),
      }).catch(() => {
        // Network failure must not crash the boundary.
      });
    } catch {
      // Even payload serialization must not throw.
    }
  }, [error]);

  return (
    <html lang="en" dir="ltr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#0a0807",
          color: "#f5f1eb",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <main
          role="alert"
          style={{
            margin: "0 auto",
            display: "flex",
            minHeight: "60vh",
            maxWidth: "42rem",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "4rem 1.25rem",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(245, 241, 235, 0.55)",
              margin: 0,
            }}
          >
            Something didn&rsquo;t load
          </p>
          <h1
            style={{
              marginTop: "0.75rem",
              fontSize: "1.875rem",
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: "#ffffff",
            }}
          >
            This page failed to render.
          </h1>
          <p
            style={{
              marginTop: "1rem",
              maxWidth: "36rem",
              fontSize: "1rem",
              lineHeight: 1.75,
              color: "rgba(245, 241, 235, 0.72)",
            }}
          >
            Your data is safe. Try again — and if the issue persists, share the
            reference below with support so it can be traced quickly.
          </p>
          {error?.digest ? (
            <p
              style={{
                marginTop: "1rem",
                fontSize: "0.75rem",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                color: "rgba(245, 241, 235, 0.55)",
              }}
            >
              Reference: {error.digest}
              <span style={{ color: "rgba(245, 241, 235, 0.4)" }}>
                {" "}
                — share with support if this repeats
              </span>
            </p>
          ) : null}
          <div
            style={{ marginTop: "1.75rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "9999px",
                background: "#ffffff",
                color: "#0a0807",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Try again
            </button>
            {/* global-error.tsx sits ABOVE the root layout — Next's
                router context is unavailable here, so `<Link>` would
                not work. The `@next/next/no-html-link-for-pages` rule
                does not know about that exception. Using a `<button>`
                + `window.location.assign` keeps full-reload semantics
                (correct at this boundary; everything below us is
                broken) without tripping the rule. Mirrors the same
                pattern shipped in apps/hub/app/global-error.tsx. */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.assign("/");
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "9999px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "transparent",
                color: "#ffffff",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Go to homepage
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
