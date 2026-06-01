"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";

// The depth field is a separate chunk that never reaches the server render or
// the first paint — it is fetched only after hydration, and only once the gate
// below says it is welcome.
const HomeAmbientField = dynamic(() => import("./home-ambient-field"), {
  ssr: false,
});

const QUERY_WIDE = "(min-width: 1024px)";
const QUERY_SAVE_DATA = "(prefers-reduced-data: reduce)";

let wideMql: MediaQueryList | null = null;
let saveMql: MediaQueryList | null = null;
function mediaQueries() {
  if (!wideMql) wideMql = window.matchMedia(QUERY_WIDE);
  if (!saveMql) saveMql = window.matchMedia(QUERY_SAVE_DATA);
  return [wideMql, saveMql] as const;
}

// `matchMedia` is an external store; subscribing this way (rather than
// useEffect + setState) keeps SSR honest and avoids a post-paint re-render.
function subscribeMedia(onChange: () => void) {
  const [wide, save] = mediaQueries();
  wide.addEventListener("change", onChange);
  save.addEventListener("change", onChange);
  return () => {
    wide.removeEventListener("change", onChange);
    save.removeEventListener("change", onChange);
  };
}
function getMediaSnapshot() {
  const [wide, save] = mediaQueries();
  return wide.matches && !save.matches;
}
function getServerMediaSnapshot() {
  return false;
}

/**
 * HomeAmbient — the restrained depth layer behind The Standard.
 *
 * Two strata, in order of cost:
 *   1. An always-on static gradient wash (pure CSS, paints with the section).
 *      This is the depth everyone sees — phones, data-saver, reduced-motion.
 *   2. A genuine drifting point field, mounted ONLY when motion is allowed, the
 *      viewport is wide, and the user has not asked to save data.
 *
 * The gate is enforced in JS on purpose: the field animates via a JS rAF loop,
 * which the global `prefers-reduced-motion` CSS kill-switch cannot stop. So we
 * must refuse to *mount* it rather than hope CSS suppresses it. The viewport /
 * data-saver checks read `matchMedia` through `useSyncExternalStore`, so the
 * server render (and the matching first client render) show the static wash
 * only; the field is added after hydration when welcome.
 */
export function HomeAmbient({ accent }: { accent: string }) {
  const reduce = useReducedMotion() ?? false;
  const mediaAllows = useSyncExternalStore(
    subscribeMedia,
    getMediaSnapshot,
    getServerMediaSnapshot,
  );
  const allowField = !reduce && mediaAllows;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(60% 50% at 50% -8%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)",
            "radial-gradient(50% 40% at 82% 12%, rgb(var(--home-ink-rgb) / 0.05), transparent 60%)",
            "radial-gradient(65% 55% at 12% 88%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 66%)",
          ].join(", "),
        }}
      />
      {allowField ? <HomeAmbientField accent={accent} /> : null}
    </div>
  );
}
