"use client";

/**
 * apps/hub/app/global-error.tsx — V3-10 last-resort fallback.
 *
 * DIAG-IOS-01 architectural safety net. See
 * `apps/account/app/global-error.tsx` for the canonical pattern doc.
 *
 * Hub-specific notes:
 *
 *   - Hub's `(site)/layout.tsx` uses `Promise.allSettled` to barrier
 *     each server fetcher, so single-fetcher failures degrade rather
 *     than blow up the layout. This file is the safety net for the
 *     remaining cases (client-side hydration crash, missing chunk on
 *     a stale CDN edge, etc.).
 *   - Inline-only styling per the global-error invariants: no CSS
 *     bundle, no theme provider, no i18n.
 *   - The /api/runtime-error endpoint is hub-app-local — added by this
 *     pass for symmetry with the account app endpoint.
 */
import { useEffect } from "react";

const DIVISION = "hub.global";

export default function HubGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
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
      }).catch(() => {});
    } catch {}
  }, [error]);

  return (
    <html lang="en" dir="ltr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#050816",
          color: "#F5F1E8",
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
              color: "rgba(245, 241, 232, 0.55)",
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
              color: "rgba(245, 241, 232, 0.72)",
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
                color: "rgba(245, 241, 232, 0.55)",
              }}
            >
              Reference: {error.digest}
              <span style={{ color: "rgba(245, 241, 232, 0.4)" }}>
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
                color: "#050816",
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
                broken) without tripping the rule. */}
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
