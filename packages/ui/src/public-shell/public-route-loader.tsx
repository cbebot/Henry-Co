import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { HenryCoMonogram } from "../brand/HenryCoMonogram";

/**
 * PublicRouteLoader — THE shared public loading experience (V3-LOADER).
 *
 * One component, every `loading.tsx`. Invisible on fast navigation; a crafted
 * Onyx brand moment when a load genuinely takes time. It adapts to each surface
 * automatically: theme-aware via the global `--home-*` tokens, and
 * division-accent-aware via `--home-accent` inherited from the page's
 * `.home-accent-scope` (Care cobalt, Logistics copper, Studio teal, the hub
 * gold …) — with ZERO per-division config. Pure CSS: SSR-safe,
 * reduced-motion-aware, CLS-safe, no JS, no layout thrash. The visual styles +
 * progressive-disclosure timings live in
 * `packages/ui/src/styles/public-design.css` (`.ho-route-loader*`).
 *
 * Progressive disclosure by elapsed time:
 *   0–280ms   nothing visible (the common case — feels instant)
 *   280ms+    a hairline accent progress rail sweeps the viewport top
 *   560ms+    the centered Onyx mark fades up: a breathing serif "H · Onyx"
 *             monogram + accent aurora + polish sheen + comet rail.
 *
 * Evolution of the 2026-05-03 "thin bar" pivot: that pivot rightly killed the
 * cheap 50vh spinner + "Preparing your experience" theater. This keeps that
 * calm thin bar for the common (fast) case and adds, ONLY for genuinely slow
 * loads, a crafted, restrained brand moment — no spinner, no copy. The legacy
 * `eyebrow`/`title`/`subtitle`/`tone`/`size` props are accepted for
 * backwards-compatibility with existing call sites but ignored at the visible
 * layer — the loader is one uniform, world-class experience platform-wide.
 */
export function PublicRouteLoader({
  eyebrow: _eyebrow,
  title: _title,
  subtitle: _subtitle,
  className,
  spinnerClassName: _spinnerClassName,
  tone: _tone,
  size: _size,
  variant = "brand",
  children,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  spinnerClassName?: string;
  tone?: "default" | "onDark";
  size?: "md" | "lg" | "xl";
  /**
   * "brand" (default) renders the full Onyx brand moment — for public /
   * discovery surfaces. "rail" renders ONLY the calm hairline progress bar
   * (no brand stage) — for flow surfaces (e.g. account routes) that want the
   * minimal PERF-01 signal without a brand splash on high-frequency nav.
   */
  variant?: "brand" | "rail";
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("ho-route-loader", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading</span>

      {/* 1 — the calm cross-page signal: a hairline accent rail at the top */}
      <div aria-hidden="true" className="ho-route-loader__rail">
        <span className="ho-route-loader__rail-fill" />
      </div>

      {/* 2 — the Onyx brand moment, revealed only on genuinely slow loads
            (brand variant only; flow surfaces opt out via variant="rail") */}
      {variant === "rail" ? null : (
        <div aria-hidden="true" className="ho-route-loader__stage">
          <span className="ho-route-loader__halo" />
          <span className="ho-route-loader__mark">
            <HenryCoMonogram
              size={64}
              accent="var(--home-accent)"
              aria-hidden
              className="ho-route-loader__monogram"
            />
            <span className="ho-route-loader__sheen" />
          </span>
          <span className="ho-route-loader__track">
            <span className="ho-route-loader__comet" />
          </span>
        </div>
      )}

      {children}
    </div>
  );
}
