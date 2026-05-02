export type MotionCurve = {
  name: string;
  cubicBezier: string;
  durationMs: number;
  description: string;
};

export const henrycoSendReady: MotionCurve = {
  name: "henrycoSendReady",
  cubicBezier: "cubic-bezier(0.22, 0.85, 0.32, 1)",
  durationMs: 180,
  description:
    "Send button readiness — slight scale + fill saturation when content becomes sendable.",
};

export const henrycoSendCommit: MotionCurve = {
  name: "henrycoSendCommit",
  cubicBezier: "cubic-bezier(0.16, 0.84, 0.44, 1)",
  durationMs: 280,
  description:
    "Send commit — text + chips fade out, send pulses, composer resets.",
};

export const henrycoSendFail: MotionCurve = {
  name: "henrycoSendFail",
  cubicBezier: "cubic-bezier(0.36, 0.07, 0.19, 0.97)",
  durationMs: 360,
  description:
    "Subtle 4px shake announcing a failed send without aggression.",
};

export const henrycoExpandComposer: MotionCurve = {
  name: "henrycoExpandComposer",
  cubicBezier: "cubic-bezier(0.18, 0.7, 0.22, 1)",
  durationMs: 320,
  description:
    "Inline → full-screen composer takeover and reverse collapse.",
};

export const henrycoDraftPulse: MotionCurve = {
  name: "henrycoDraftPulse",
  cubicBezier: "cubic-bezier(0.4, 0, 0.2, 1)",
  durationMs: 720,
  description:
    "Draft saved indicator — quiet pulse while user is paused mid-typing.",
};

export const HENRYCO_COMPOSER_MOTION = {
  henrycoSendReady,
  henrycoSendCommit,
  henrycoSendFail,
  henrycoExpandComposer,
  henrycoDraftPulse,
} as const;

export const ALL_COMPOSER_CURVES: MotionCurve[] = Object.values(
  HENRYCO_COMPOSER_MOTION
);
