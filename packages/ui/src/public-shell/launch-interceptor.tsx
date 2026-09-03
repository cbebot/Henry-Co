"use client";

import { useEffect } from "react";
import { LaunchTransitionProvider, useLaunchTransition } from "./launch-transition";

/**
 * A single, self-contained mount that makes the branded launch transition fire
 * on EVERY division→division switch from ANYWHERE — footer division masthead,
 * cross-app columns, the account ecosystem switcher, or any future link —
 * without per-link wiring.
 *
 * It mounts {@link LaunchTransitionProvider} (which renders the fixed-position
 * overlay) plus a document-level, capture-phase click listener. Because the
 * listener is global and the overlay is `position: fixed`, this component
 * renders no children and can be dropped once into any shared chrome surface
 * (e.g. the public footer, which is present on every public page).
 *
 * Naming stays generic ("launch"/"target", "division") — it ships in client JS
 * and must not describe the platform's internal SSO topology.
 */
export interface LaunchDivision {
  /** Display name shown in the overlay (e.g. "Henry Onyx Care"). */
  name: string;
  /** Absolute canonical URL, e.g. https://care.henryonyx.com. */
  url: string;
  /** Accent hex used for the overlay aurora/monogram/rail. */
  accent: string;
}

export function LaunchInterceptor({ divisions }: { divisions: LaunchDivision[] }) {
  return (
    <LaunchTransitionProvider>
      <LaunchClickBridge divisions={divisions} />
    </LaunchTransitionProvider>
  );
}

function LaunchClickBridge({ divisions }: { divisions: LaunchDivision[] }) {
  const { launch } = useLaunchTransition();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const byHost = new Map<string, LaunchDivision>();
    const currentHost = window.location.host;
    for (const division of divisions) {
      try {
        byHost.set(new URL(division.url).host, division);
      } catch {
        // Skip malformed catalog entries.
      }
    }
    if (byHost.size === 0) return;

    function onClick(event: MouseEvent) {
      // Only plain, unmodified left-clicks — let the browser handle the rest
      // (new-tab via cmd/ctrl, middle-click, right-click, etc.).
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a");
      if (
        !anchor ||
        anchor.hasAttribute("data-no-transition") ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href) return;

      let destination: URL;
      try {
        destination = new URL(href, window.location.href);
      } catch {
        return;
      }

      // Same division → ordinary navigation. Non-division host → external link.
      if (destination.host === currentHost) return;
      const division = byHost.get(destination.host);
      if (!division) return;

      // Capture-phase preventDefault + stopPropagation also suppresses any
      // per-link handler (e.g. the hub homepage's own launch wiring), so the
      // transition fires exactly once regardless of where it is mounted.
      event.preventDefault();
      event.stopPropagation();

      launch({
        url: destination.href,
        name: division.name,
        tagline: null,
        accent: division.accent,
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [divisions, launch]);

  return null;
}
