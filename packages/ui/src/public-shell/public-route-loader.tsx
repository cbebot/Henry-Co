import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Public route-level loading indicator — premium, calm, near-invisible.
 *
 * Design intent (2026-05-03 owner pivot):
 *   • Premium ecosystems do NOT show a "Preparing the public Care experience"
 *     splash. Splashes read as cheap and unfocused. Real Apple / Stripe /
 *     Linear loading states are a thin progress bar at the top of the
 *     viewport — barely perceptible on fast nav, only briefly visible on
 *     slow nav.
 *   • The previous implementation rendered a 50vh min-height flex container
 *     with a dual-arc 1600ms-cycle spinner and theatrical title/subtitle
 *     copy ("Preparing your creative workspace"). This shipped across every
 *     `/loading.tsx` in the platform and made every nav feel laggy.
 *   • Replaced with a thin, brand-accent progress bar pinned to the top of
 *     the viewport. CSS `animation-delay: 320ms` keeps the bar invisible on
 *     fast navigations (the common case) and lets it appear only when the
 *     page genuinely takes time to render.
 *   • `aria-live="polite"` + `aria-busy="true"` retained for screen-reader
 *     parity. `prefers-reduced-motion: reduce` collapses the bar to a static
 *     accent line.
 *
 * The component still accepts `eyebrow`, `title`, `subtitle`, `tone`,
 * `size`, and `children` for full backwards compatibility with the dozens
 * of existing call sites under `apps/<app>/app/.../loading.tsx`. Those
 * props are now ignored at the visible layer — the loader is intentionally
 * minimal and uniform across the platform.
 */
export function PublicRouteLoader({
  eyebrow: _eyebrow,
  title: _title,
  subtitle: _subtitle,
  className,
  spinnerClassName: _spinnerClassName,
  tone: _tone,
  size: _size,
  children,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  spinnerClassName?: string;
  tone?: "default" | "onDark";
  size?: "md" | "lg" | "xl";
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("pointer-events-none", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading</span>
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[120] h-[2px] overflow-hidden bg-transparent"
      >
        <span
          className="block h-full w-1/3 bg-[color:var(--accent,#C9A227)] opacity-90 motion-reduce:animate-none"
          style={{
            animation: "henryco-route-progress 1100ms cubic-bezier(0.4,0,0.2,1) 320ms infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes henryco-route-progress {
          0%   { transform: translate3d(-100%, 0, 0); }
          50%  { transform: translate3d(60%, 0, 0); }
          100% { transform: translate3d(220%, 0, 0); }
        }
      `}</style>
      {children}
    </div>
  );
}
