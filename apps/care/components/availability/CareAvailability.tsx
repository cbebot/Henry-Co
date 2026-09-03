"use client";

/**
 * V3-38 — care's availability client surface (flag-dark).
 *
 * The server pages mount this ONLY when the governed
 * `personalization_availability` flag is on, and pass the localized copy down
 * (Pattern A — no user-facing literals live here). One provider = one batch
 * POST to `/api/availability` for the whole page; chips and the notice consume
 * the shared result via context.
 *
 * Honesty invariants, mirrored from the engine:
 *   - `unknown` renders NOTHING (no data must never read as "not here yet").
 *   - Only `unavailable` (backed by real coverage rows that exclude the
 *     viewer's area) renders the graceful state — which is never a dead end
 *     (FindSimilarCta always ships with it).
 *   - The viewer's area label comes from the server response (their OWN saved
 *     address, or a coarse IP region) — the client sends no location, ever.
 *   - IP-inferred results carry the approximate-location disclosure.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MapPin, ArrowRight } from "lucide-react";
import type { AvailabilityCopy } from "@henryco/i18n";
import {
  AvailabilityBadge,
  FindSimilarCta,
  UnavailableState,
  type AvailabilityBadgeStatus,
} from "@henryco/ui/availability";

type AvailabilityStrings = AvailabilityCopy["availability"];

type OfferingResult = { status: AvailabilityBadgeStatus; matchedScope: string };

type AvailabilityState = {
  results: Record<string, OfferingResult>;
  areaLabel: string | null;
  locationSource: "saved_address" | "ip_approximate" | null;
};

type AvailabilityContextValue = {
  state: AvailabilityState | null;
  copy: AvailabilityStrings;
};

const AvailabilityContext = createContext<AvailabilityContextValue | null>(null);

function sendAvailabilityBeacon(kind: "unavailable_shown" | "find_similar_clicked", offeringKey: string) {
  // Fire-and-forget telemetry beacon; the server decides what (if anything)
  // persists — only the aggregate coverage-gap counter, never this render.
  void fetch("/api/availability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telemetry: { kind, offeringKey } }),
    keepalive: true,
  }).catch(() => undefined);
}

export function CareAvailabilityProvider({
  offeringKeys,
  copy,
  children,
}: {
  offeringKeys: string[];
  copy: AvailabilityStrings;
  children: ReactNode;
}) {
  const [state, setState] = useState<AvailabilityState | null>(null);
  const keysRef = useRef(offeringKeys.join("|"));

  useEffect(() => {
    const controller = new AbortController();
    const keys = keysRef.current.split("|").filter(Boolean);
    if (keys.length === 0) return undefined;
    void (async () => {
      try {
        const res = await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offeringKeys: keys }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const body = (await res.json()) as {
          off?: boolean;
          results?: Record<string, OfferingResult>;
          areaLabel?: string | null;
          locationSource?: "saved_address" | "ip_approximate" | null;
        };
        if (body.off || !body.results) return;
        setState({
          results: body.results,
          areaLabel: body.areaLabel ?? null,
          locationSource: body.locationSource ?? null,
        });
      } catch {
        // Degrade to nothing rendered — the deterministic floor is untouched.
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <AvailabilityContext.Provider value={{ state, copy }}>{children}</AvailabilityContext.Provider>
  );
}

/**
 * Inline availability chip for a catalog row. Renders only for
 * available/limited — sized to sit inside an existing flex row (no layout
 * shift: the row's height is owned by its text, not the chip).
 */
export function CareAvailabilityChip({ offeringKey }: { offeringKey: string }) {
  const ctx = useContext(AvailabilityContext);
  if (!ctx?.state) return null;
  const result = ctx.state.results[offeringKey];
  if (!result) return null;
  const approximate = ctx.state.locationSource === "ip_approximate";
  const label =
    result.status === "limited"
      ? ctx.copy.badgeLimited
      : approximate
        ? ctx.copy.badgeApproximate
        : ctx.copy.badgeAvailable;
  return (
    <AvailabilityBadge
      status={result.status}
      label={label}
      disclosure={approximate ? ctx.copy.approximateDisclosure : undefined}
      icon={<MapPin className="h-3 w-3" aria-hidden />}
      className="rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-surface-04)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--home-accent-text)]"
    />
  );
}

/**
 * The graceful unavailable block for one offering. Emits the
 * `unavailable_shown` beacon exactly once per mount when it actually renders
 * (the coverage-gap signal the owner soaks on) and always carries a working
 * CTA back to the directory (never a dead end).
 */
export function CareAvailabilityNotice({ offeringKey }: { offeringKey: string }) {
  const ctx = useContext(AvailabilityContext);
  const unavailable = ctx?.state?.results[offeringKey]?.status === "unavailable";
  const shownRef = useRef(false);

  useEffect(() => {
    if (unavailable && !shownRef.current) {
      shownRef.current = true;
      sendAvailabilityBeacon("unavailable_shown", offeringKey);
    }
  }, [unavailable, offeringKey]);

  if (!ctx?.state || !unavailable) return null;
  const approximate = ctx.state.locationSource === "ip_approximate";
  const body = ctx.state.areaLabel
    ? ctx.copy.unavailableBody.replace("{area}", ctx.state.areaLabel)
    : ctx.copy.unavailableBodyNoArea;

  return (
    <UnavailableState
      title={ctx.copy.unavailableTitle}
      body={body}
      disclosure={approximate ? ctx.copy.approximateDisclosure : undefined}
      className="mt-6 rounded-[1.5rem] border border-[color:var(--home-line)] bg-[color:var(--home-sheet)] px-6 py-5"
      titleClassName="text-[0.95rem] font-semibold tracking-tight text-[color:var(--home-ink)]"
      bodyClassName="mt-1.5 text-sm leading-6 text-[color:var(--home-ink-70)]"
    >
      <FindSimilarCta
        href="/services"
        label={ctx.copy.findSimilar}
        onClick={() => sendAvailabilityBeacon("find_similar_clicked", offeringKey)}
        icon={<ArrowRight className="h-4 w-4" aria-hidden />}
        className="mt-3 text-sm font-semibold text-[color:var(--home-accent-text)]"
      />
    </UnavailableState>
  );
}
