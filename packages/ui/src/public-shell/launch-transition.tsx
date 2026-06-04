"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Launch transition — a premium full-screen handoff shown the moment a
 * user opens another Henry Onyx property from a link. It bridges the
 * ~300ms gap before the destination tab paints with a branded, accent-
 * aware overlay so the jump never feels like a dead click.
 *
 * Naming is intentionally generic ("launch", "target") — this ships in
 * client JS, so it must not describe the platform's internal topology.
 */

export interface LaunchTarget {
  /** Absolute destination URL. */
  url: string;
  /** Human label shown in the overlay (e.g. the property name). */
  name: string;
  /** Optional one-line descriptor under the name. */
  tagline?: string | null;
  /** Accent hex used for the aurora, monogram, and progress rail. */
  accent: string;
}

interface LaunchContextValue {
  launch: (target: LaunchTarget) => void;
}

const fallback: LaunchContextValue = {
  launch: (t) => window.open(t.url, "_blank", "noopener,noreferrer"),
};

const LaunchContext = createContext<LaunchContextValue>(fallback);

type Phase = "idle" | "enter" | "hold" | "exit";

export function LaunchTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [target, setTarget] = useState<LaunchTarget | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const launch = useCallback(
    (next: LaunchTarget) => {
      clearTimers();
      setTarget(next);
      setPhase("enter");

      // One frame to paint the overlay before it fades in.
      timers.current.push(setTimeout(() => setPhase("hold"), 30));
      // Open the destination once the entrance has settled.
      timers.current.push(
        setTimeout(() => {
          window.open(next.url, "_blank", "noopener,noreferrer");
        }, 480),
      );
      // Gracefully retire the overlay.
      timers.current.push(
        setTimeout(() => {
          setPhase("exit");
          timers.current.push(
            setTimeout(() => {
              setPhase("idle");
              setTarget(null);
            }, 320),
          );
        }, 820),
      );
    },
    [clearTimers],
  );

  return (
    <LaunchContext.Provider value={{ launch }}>
      {children}
      {target && phase !== "idle" ? (
        <LaunchOverlay target={target} phase={phase} />
      ) : null}
    </LaunchContext.Provider>
  );
}

export function useLaunchTransition(): LaunchContextValue {
  return useContext(LaunchContext);
}

// ─── Overlay ─────────────────────────────────────────────────────────────────

function LaunchOverlay({
  target,
  phase,
}: {
  target: LaunchTarget;
  phase: Phase;
}) {
  const visible = phase === "hold" || phase === "enter";
  const { accent, name, tagline } = target;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        aria-live="polite"
        aria-label={`Opening ${name}`}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(5, 7, 13, 0.9)",
          backdropFilter: "blur(28px) saturate(1.4)",
          WebkitBackdropFilter: "blur(28px) saturate(1.4)",
          opacity: visible ? 1 : 0,
          transition: "opacity 240ms cubic-bezier(0.16, 1, 0.3, 1)",
          pointerEvents: visible ? "all" : "none",
        }}
      >
        {/* Accent aurora */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: [
              `radial-gradient(ellipse 72% 52% at 50% 18%, ${accent}2b, transparent 64%)`,
              `radial-gradient(ellipse 42% 32% at 82% 82%, ${accent}16, transparent 58%)`,
              `radial-gradient(ellipse 38% 30% at 16% 88%, ${accent}10, transparent 56%)`,
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        {/* Sheen sweep */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "-40%",
              width: "40%",
              height: "100%",
              background: `linear-gradient(105deg, transparent, ${accent}0c, transparent)`,
              transform: "skewX(-18deg)",
              animation: "hc-launch-sheen 1.4s cubic-bezier(0.4,0,0.2,1) infinite",
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
            textAlign: "center",
            padding: "0 28px",
            maxWidth: 420,
            transform: visible
              ? "translateY(0) scale(1)"
              : "translateY(14px) scale(0.94)",
            transition: "transform 380ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Breathing monogram */}
          <div
            style={{
              position: "relative",
              width: 68,
              height: 68,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `1.5px solid ${accent}55`,
                animation: "hc-launch-ring 1.8s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: 27,
                fontFamily: "'Fraunces', 'Georgia', serif",
                fontWeight: 700,
                color: accent,
                animation: "hc-launch-breathe 1.8s ease-in-out infinite",
                textShadow: `0 0 22px ${accent}40`,
              }}
            >
              H
            </span>
          </div>

          {/* Name + tagline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <span
              style={{
                display: "block",
                fontSize: "clamp(23px, 5vw, 31px)",
                fontFamily: "'Fraunces', 'Georgia', serif",
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "-0.025em",
                lineHeight: 1.14,
              }}
            >
              {name}
            </span>
            {tagline ? (
              <span
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "system-ui, sans-serif",
                  letterSpacing: "0.01em",
                  lineHeight: 1.5,
                }}
              >
                {tagline}
              </span>
            ) : null}
          </div>

          {/* Progress rail */}
          <div
            style={{
              width: 52,
              height: 2,
              borderRadius: 1,
              background: `${accent}24`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: accent,
                borderRadius: 1,
                animation:
                  "hc-launch-progress 0.6s cubic-bezier(0.4,0,0.2,1) forwards",
              }}
            />
          </div>

          <span
            style={{
              fontSize: 11,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: `${accent}8c`,
            }}
          >
            Opening
          </span>
        </div>
      </div>
    </>
  );
}

const KEYFRAMES = `
@keyframes hc-launch-breathe {
  0%, 100% { opacity: 1;    transform: scale(1);    }
  50%      { opacity: 0.72; transform: scale(0.9);  }
}
@keyframes hc-launch-ring {
  0%, 100% { transform: scale(1);    opacity: 0.7; }
  50%      { transform: scale(1.12); opacity: 0.25; }
}
@keyframes hc-launch-progress {
  from { width: 0%;   }
  to   { width: 100%; }
}
@keyframes hc-launch-sheen {
  0%   { left: -40%; }
  100% { left: 130%; }
}
`;
