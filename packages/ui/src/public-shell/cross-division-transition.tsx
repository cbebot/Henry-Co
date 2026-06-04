"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface CrossDivisionTarget {
  url: string;
  name: string;
  tagline?: string | null;
  accent: string;
}

interface CrossDivisionContextValue {
  navigate: (target: CrossDivisionTarget) => void;
}

const noop: CrossDivisionContextValue = {
  navigate: (t) => window.open(t.url, "_blank", "noopener,noreferrer"),
};

const CrossDivisionContext = createContext<CrossDivisionContextValue>(noop);

type Phase = "idle" | "enter" | "hold" | "exit";

export function CrossDivisionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [target, setTarget] = useState<CrossDivisionTarget | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const t1 = useRef<ReturnType<typeof setTimeout>>(undefined);
  const t2 = useRef<ReturnType<typeof setTimeout>>(undefined);
  const t3 = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(t1.current);
      clearTimeout(t2.current);
      clearTimeout(t3.current);
    };
  }, []);

  const navigate = useCallback((next: CrossDivisionTarget) => {
    clearTimeout(t1.current);
    clearTimeout(t2.current);
    clearTimeout(t3.current);

    setTarget(next);
    setPhase("enter");

    // Give browser one frame to paint the overlay
    t1.current = setTimeout(() => setPhase("hold"), 30);

    // Open the target tab after the animation settles
    t2.current = setTimeout(() => {
      window.open(next.url, "_blank", "noopener,noreferrer");
    }, 480);

    // Begin exit
    t3.current = setTimeout(() => {
      setPhase("exit");
      setTimeout(() => {
        setPhase("idle");
        setTarget(null);
      }, 320);
    }, 820);
  }, []);

  return (
    <CrossDivisionContext.Provider value={{ navigate }}>
      {children}
      {target && phase !== "idle" ? (
        <CrossDivisionOverlay target={target} phase={phase} />
      ) : null}
    </CrossDivisionContext.Provider>
  );
}

export function useCrossDivisionNavigation(): CrossDivisionContextValue {
  return useContext(CrossDivisionContext);
}

// ─── Overlay ─────────────────────────────────────────────────────────────────

function CrossDivisionOverlay({
  target,
  phase,
}: {
  target: CrossDivisionTarget;
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
          background: "rgba(5, 7, 13, 0.88)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          opacity: visible ? 1 : 0,
          transition: "opacity 220ms cubic-bezier(0.16, 1, 0.3, 1)",
          pointerEvents: visible ? "all" : "none",
        }}
      >
        {/* Aurora gradient derived from division accent */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: [
              `radial-gradient(ellipse 70% 50% at 50% 20%, ${accent}28, transparent 65%)`,
              `radial-gradient(ellipse 40% 30% at 80% 80%, ${accent}14, transparent 60%)`,
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        {/* Content card */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            textAlign: "center",
            padding: "0 28px",
            maxWidth: 400,
            transform: visible
              ? "translateY(0) scale(1)"
              : "translateY(12px) scale(0.95)",
            transition:
              "transform 360ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Monogram tile */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: `1.5px solid ${accent}50`,
              background: `${accent}14`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontFamily:
                "'Fraunces', 'Georgia', 'Times New Roman', serif",
              fontWeight: 700,
              color: accent,
              animation: "hc-cross-breathe 1.8s ease-in-out infinite",
              boxShadow: `0 0 24px ${accent}22`,
            }}
          >
            H
          </div>

          {/* Division name + tagline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span
              style={{
                display: "block",
                fontSize: "clamp(22px, 5vw, 30px)",
                fontFamily:
                  "'Fraunces', 'Georgia', 'Times New Roman', serif",
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
              }}
            >
              {name}
            </span>
            {tagline ? (
              <span
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "rgba(255, 255, 255, 0.48)",
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
              width: 48,
              height: 2,
              borderRadius: 1,
              background: `${accent}22`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: accent,
                borderRadius: 1,
                animation:
                  "hc-cross-progress 0.55s cubic-bezier(0.4, 0, 0.2, 1) forwards",
              }}
            />
          </div>

          {/* Opening label */}
          <span
            style={{
              fontSize: 11,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: `${accent}80`,
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
@keyframes hc-cross-breathe {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.75; transform: scale(0.93); }
}
@keyframes hc-cross-progress {
  from { width: 0%; }
  to   { width: 100%; }
}
`;
