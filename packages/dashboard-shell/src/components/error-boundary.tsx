"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";
import { ActionButton } from "./action-button";

/**
 * ErrorBoundary — captures render-time errors in shell modules and
 * renders a calm fallback with a retry primitive.
 *
 * Class component because React still requires componentDidCatch
 * for the catch boundary semantic. The fallback uses ActionButton's
 * `idle` → `pending` transition during retry; if the underlying
 * render keeps throwing, the boundary re-catches and re-shows the
 * fallback.
 *
 * The shell wraps each module's home widget in a boundary so one
 * widget's failure doesn't take down the whole feed (audit §C.10
 * principle: "no module's broken state should propagate").
 */
type ErrorBoundaryProps = {
  /** Fallback render — receives the error + a retry function. */
  fallback?: (error: Error, retry: () => void) => ReactNode;
  /** Optional label shown in the default fallback. */
  label?: string;
  children: ReactNode;
};

type ErrorBoundaryState = { error: Error | null };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, _info: ErrorInfo): void {
    // Defer to Sentry / structured logger — both are wired by
    // @henryco/observability at the shell root, so a thrown error here
    // bubbles to the same handler as an unhandled rejection. We don't
    // need to import Sentry directly; React's componentDidCatch fires
    // first, then the error propagates to React's standard error
    // pipeline which @henryco/observability hooks.
    // Intentionally no console.error — Sentry's instrumentation captures.
    void error;
  }

  retry = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }
      return (
        <div
          role="alert"
          style={{
            backgroundColor: `var(${CSS_VARS.surface})`,
            border: `1px solid var(${CSS_VARS.hairline})`,
            borderRadius: RADIUS.lg,
            padding: "1.25rem",
            color: `var(${CSS_VARS.ink})`,
          }}
        >
          <p
            style={{
              ...typeStyle("kicker"),
              color: `var(${CSS_VARS.inkMuted})`,
              margin: 0,
            }}
          >
            {this.props.label ?? "Couldn't render this section"}
          </p>
          <p
            style={{
              ...typeStyle("body"),
              color: `var(${CSS_VARS.inkSoft})`,
              marginTop: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            Reload the surface to try again. If the issue persists, the
            wider page still works — only this section is affected.
          </p>
          <ActionButton tone="secondary" onClick={this.retry}>
            Reload section
          </ActionButton>
        </div>
      );
    }
    return this.props.children;
  }
}
