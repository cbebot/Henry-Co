"use client";

/**
 * Trust Reveal Engine — `<TrustStair>` + stage parts (doctrine Engine 3).
 *
 * A page declares its trust budget:
 *
 *   <TrustStair surfaceId="care_provider" stages={["browse","consider","commit","pay"]}
 *               interactions={savesCount}>
 *     <TrustOutcome>…real photo + number…</TrustOutcome>
 *     <TrustQuote>…one verified quote…</TrustQuote>
 *     <TrustSafetyNet>…money-back terms…</TrustSafetyNet>
 *     <TrustPaymentMarks>…provider logos…</TrustPaymentMarks>
 *   </TrustStair>
 *
 * Each part renders ONLY at (or after) its stage, resolved by the tested
 * `resolveVisibleStage` from live scroll depth + interaction count +
 * which stage-section is in view. `trust_stage_entered` fires once per
 * stage per mount. Trust content itself is passed by the app from
 * verified records — never marketing-managed JSON.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@henryco/ui/cn";
import { useInteractionTelemetry } from "../../context";
import {
  resolveVisibleStage,
  stageIndex,
  TRUST_STAGES,
  type TrustStage,
} from "./trust.logic";

const StageContext = createContext<TrustStage>("browse");

/** The stage currently resolved for the surrounding TrustStair. */
export function useTrustStage(): TrustStage {
  return useContext(StageContext);
}

export interface TrustStairProps {
  surfaceId: string;
  /** Ordered subset of the canonical stages this page budgets. */
  stages: TrustStage[];
  /** Count of meaningful user interactions on this flow (saves, selections…). */
  interactions?: number;
  children: ReactNode;
  className?: string;
}

export function TrustStair({ surfaceId, stages, interactions = 0, children, className }: TrustStairProps) {
  const telemetry = useInteractionTelemetry();
  const [scrollDepth, setScrollDepth] = useState(0);
  const [sectionVisible, setSectionVisible] = useState<TrustStage | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const enteredRef = useRef<Set<TrustStage>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      setScrollDepth(total <= 0 ? 100 : Math.min(100, Math.round(((window.scrollY || 0) / total) * 100)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Observe stage-owning sections ([data-trust-stage]) inside the stair.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const sections = root.querySelectorAll<HTMLElement>("[data-trust-stage]");
    if (sections.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => (e.target as HTMLElement).dataset.trustStage as TrustStage)
          .filter((s): s is TrustStage => TRUST_STAGES.includes(s))
          .sort((a, b) => stageIndex(b) - stageIndex(a));
        if (visible.length > 0) setSectionVisible(visible[0]);
      },
      { threshold: 0.4 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [children]);

  const stage = useMemo(
    () => resolveVisibleStage({ scrollDepth, interactions, sectionVisible }, stages),
    [scrollDepth, interactions, sectionVisible, stages],
  );

  useEffect(() => {
    if (enteredRef.current.has(stage)) return;
    enteredRef.current.add(stage);
    telemetry.emit({
      name: "trust_stage_entered",
      props: { surface_id: surfaceId, stage, via: sectionVisible === stage ? "section_visible" : "behavior" },
    });
  }, [stage, surfaceId, sectionVisible, telemetry]);

  return (
    <StageContext.Provider value={stage}>
      <div ref={rootRef} data-trust-current={stage} className={className}>
        {children}
      </div>
    </StageContext.Provider>
  );
}

function StagePart({
  stage,
  children,
  className,
}: {
  stage: TrustStage;
  children: ReactNode;
  className?: string;
}) {
  const current = useTrustStage();
  const show = stageIndex(current) >= stageIndex(stage);
  return (
    <div
      data-trust-stage={stage}
      aria-hidden={show ? undefined : true}
      className={cn(!show && "hidden", className)}
    >
      {show ? children : null}
    </div>
  );
}

/** Stage 1 — browse: outcome evidence only. No badges, no logos. */
export function TrustOutcome(props: { children: ReactNode; className?: string }) {
  return <StagePart stage="browse" {...props} />;
}

/** Stage 2 — consider: ONE short verified quote inline (name + city + mark). */
export function TrustQuote(props: { children: ReactNode; className?: string }) {
  return <StagePart stage="consider" {...props} />;
}

/** Stage 3 — commit: the safety net inline near the commit button. */
export function TrustSafetyNet(props: { children: ReactNode; className?: string }) {
  return <StagePart stage="commit" {...props} />;
}

/** Stage 4 — pay: trust marks ONLY here. Earlier they were noise. */
export function TrustPaymentMarks(props: { children: ReactNode; className?: string }) {
  return <StagePart stage="pay" {...props} />;
}
