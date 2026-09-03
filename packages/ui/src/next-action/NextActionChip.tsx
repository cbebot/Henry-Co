"use client";

/**
 * V3-39 — <NextActionChip /> — the subtle bottom-right "Continue: <action>"
 * floating chip. One chip max per page; dismissible; the SHARED host across
 * every division surface, so behavior is identical everywhere.
 *
 * Placement arbitrates with the IntelligenceLauncher FAB per the contract in
 * `./arbitration.ts`: same right edge, bottom offset = corner base
 * (+ mobile lift) + launcher clearance, z-index below the launcher — no
 * overlap, no z-fight, ever. CLS ≈ 0 by construction (position: fixed).
 *
 * Privacy/authority posture: the chip receives ONLY the final resolved action
 * (id, localized copy, deep link) — never the candidate catalog, never a
 * score, never a confidence tier. Sensitive actions are refused structurally
 * here as a second wall (the server resolver is the first).
 *
 * Visual language: seam tokens with a light default + `.dark` override; the
 * accent CTA glyph is dark-ink-on-gold in BOTH themes (the documented house AA
 * pattern — never white-on-gold); the label renders in the brand reading serif
 * via the shared `--font-reading` seam; `prefers-reduced-motion` disables the
 * entrance rise.
 */

import { useState } from "react";
import type { CSSProperties } from "react";
import { ArrowUpRight, X } from "lucide-react";
import {
  CHROME_CORNER_BOTTOM_BASE,
  NEXT_ACTION_CHIP_CLEARANCE_REM,
  NEXT_ACTION_CHIP_Z_INDEX,
} from "./arbitration";

/** The client-safe projection of a resolved NextAction — exactly the fields
 *  the chip needs. No reason codes, no confidence, no numeric anything. */
export interface NextActionChipAction {
  id: string;
  contextKind: string;
  division: string;
  title: string;
  ctaHref: string;
  ctaLabel: string;
  placement: "inline" | "floating_chip";
  sensitive: boolean;
  stitched: boolean;
}

export interface NextActionChipLabels {
  /** The chip prefix, e.g. localized "Continue". */
  prefix: string;
  /** Accessible label for the dismiss control. */
  dismiss: string;
  /** Accessible label for the chip region. */
  region: string;
}

export interface NextActionChipProps {
  action: NextActionChipAction;
  labels: NextActionChipLabels;
  /**
   * Mobile-only extra lift (any CSS length) — pass the SAME value the layout
   * passes to `IntelligenceLauncher`'s `bottomOffset`, so both affordances
   * clear a fixed bottom nav bar together (arbitration contract).
   */
  bottomOffset?: string;
  /** Persist the dismissal (server action). Fire-and-forget; the chip hides immediately. */
  onDismiss?: () => void | Promise<void>;
  /** Click telemetry (server action). Fire-and-forget; navigation proceeds. */
  onActivate?: () => void | Promise<void>;
}

export function NextActionChip({
  action,
  labels,
  bottomOffset,
  onDismiss,
  onActivate,
}: NextActionChipProps) {
  const [hidden, setHidden] = useState(false);

  // Structural wall #2 (the resolver is #1): a sensitive or inline action can
  // never float, no matter what a host passes.
  if (hidden || action.sensitive || action.placement !== "floating_chip") return null;

  const rootStyle = {
    ...(bottomOffset ? { ["--hc-na-lift" as string]: bottomOffset } : {}),
  } as CSSProperties;

  return (
    <>
      <NextActionChipStyles />
      <div className="hc-na-root" style={rootStyle} role="region" aria-label={labels.region}>
        <div className="hc-na-chip">
          <a
            className="hc-na-cta"
            href={action.ctaHref}
            onClick={() => {
              if (onActivate) void Promise.resolve(onActivate()).catch(() => undefined);
            }}
          >
            <span className="hc-na-label">
              <span className="hc-na-prefix">{labels.prefix}</span>
              <span className="hc-na-title">{action.title}</span>
            </span>
            <span className="hc-na-glyph" aria-hidden>
              <ArrowUpRight />
            </span>
          </a>
          <button
            type="button"
            className="hc-na-dismiss"
            aria-label={labels.dismiss}
            onClick={() => {
              setHidden(true);
              if (onDismiss) void Promise.resolve(onDismiss()).catch(() => undefined);
            }}
          >
            <X aria-hidden />
          </button>
        </div>
      </div>
    </>
  );
}

export function NextActionChipStyles() {
  return (
    <style>{`
/* V3-39 next-action chip — arbitrated with the IntelligenceLauncher corner
   (see ./arbitration.ts): same right edge, launcher clearance added to the
   bottom offset, z-index ${NEXT_ACTION_CHIP_Z_INDEX} (below the launcher's 60). */
.hc-na-root{position:fixed;right:max(1rem,env(safe-area-inset-right));bottom:calc(${CHROME_CORNER_BOTTOM_BASE} + ${NEXT_ACTION_CHIP_CLEARANCE_REM}rem);z-index:${NEXT_ACTION_CHIP_Z_INDEX};max-width:min(22rem,calc(100vw - 2rem))}
/* Mobile: rise with the launcher above a host bottom nav bar (same lift value). */
@media (max-width:767px){.hc-na-root{bottom:calc(${CHROME_CORNER_BOTTOM_BASE} + var(--hc-na-lift,0px) + ${NEXT_ACTION_CHIP_CLEARANCE_REM}rem)}}
.hc-na-chip{
  --hc-na-surface:#ffffff;--hc-na-ink:#0b1220;--hc-na-ink-soft:rgba(11,18,32,.62);
  --hc-na-line:rgba(11,18,32,.12);--hc-na-accent:#C9A227;
  /* Dark ink on the gold accent in BOTH themes — the house AA pattern. */
  --hc-na-on-accent:#0b1220;
  display:flex;align-items:center;gap:.25rem;
  background:var(--hc-na-surface);color:var(--hc-na-ink);
  border:1px solid color-mix(in srgb,var(--hc-na-accent) 40%,var(--hc-na-line));
  border-radius:999px;padding:.3rem .3rem .3rem .95rem;
  box-shadow:0 14px 34px -14px rgba(11,18,32,.35),0 4px 12px rgba(11,18,32,.14);
  animation:hc-na-rise .22s cubic-bezier(.22,1,.36,1)}
:where(html.dark,html[data-theme="dark"],.dark) .hc-na-chip{
  --hc-na-surface:#0f1a2c;--hc-na-ink:#F5F1E8;--hc-na-ink-soft:rgba(245,241,232,.64);
  --hc-na-line:rgba(245,241,232,.16);
  box-shadow:0 16px 40px -14px rgba(0,0,0,.55),0 4px 12px rgba(0,0,0,.4)}
@keyframes hc-na-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.hc-na-cta{display:inline-flex;align-items:center;gap:.6rem;min-width:0;text-decoration:none;color:var(--hc-na-ink)}
.hc-na-label{display:flex;flex-direction:column;min-width:0;line-height:1.25}
.hc-na-prefix{font-size:.66rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--hc-na-ink-soft)}
/* The action title carries the brand reading serif via the shared seam token. */
.hc-na-title{font-family:var(--font-reading,serif);font-size:.92rem;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hc-na-glyph{flex:none;display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:999px;background:var(--hc-na-accent);color:var(--hc-na-on-accent)}
.hc-na-glyph svg{width:1rem;height:1rem}
.hc-na-cta:hover .hc-na-glyph{filter:brightness(1.05)}
.hc-na-cta:focus-visible{outline:none}
.hc-na-cta:focus-visible .hc-na-glyph{box-shadow:0 0 0 3px rgba(255,255,255,.92),0 0 0 6px rgba(11,18,32,.55)}
.hc-na-dismiss{flex:none;display:inline-flex;align-items:center;justify-content:center;width:1.75rem;height:1.75rem;border-radius:999px;border:none;background:transparent;color:var(--hc-na-ink-soft);cursor:pointer;transition:background .15s,color .15s}
.hc-na-dismiss:hover{background:color-mix(in srgb,var(--hc-na-ink) 8%,transparent);color:var(--hc-na-ink)}
.hc-na-dismiss:focus-visible{outline:2px solid var(--hc-na-accent);outline-offset:2px}
.hc-na-dismiss svg{width:.95rem;height:.95rem}
@media (prefers-reduced-motion:reduce){.hc-na-chip{animation:none}}
`}</style>
  );
}
