"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import {
  ActionButton,
  EmptyState,
  Panel,
  Section,
} from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";

import { submitScorecard as submitScorecardAction } from "../server/actions";
import { isRoomError } from "../types";
import type { RoomError, ScorecardDimensions } from "../types";

/**
 * ScorecardSidebar — interviewer / reviewer scorecard.
 *
 * JSON-driven dimensions so each consumer (Jobs interview vs Studio
 * collab review) drives its own shape. Wave A2 ships:
 *   - Default scaffold per audit §4.3: `{ technical, communication,
 *     culture, recommendation }`.
 *   - A `dimensions` prop the consumer can pass to override the shape.
 *
 * Dimension types:
 *   - { kind: "score", scale: 5 }  — 0-N score (Likert)
 *   - { kind: "choice", options: ["strong_yes", "yes", "no", "strong_no"] }
 *   - { kind: "boolean" }
 *
 * The sidebar is OWNER + INTERVIEWER ONLY by visual contract — the
 * consumer must gate rendering via the viewer role. The component itself
 * does NOT do the gate (it's not server-only; rendering it for a
 * candidate would surface their reviewer's notes which is wrong).
 *
 * Anti-patterns avoided:
 *   - No new tokens.
 *   - <ActionButton> with success-lock on submit (idempotent re-submit
 *     within 1.2s).
 *   - Empty state via <EmptyState>.
 */

export type ScorecardDimensionSpec =
  | { kind: "score"; label: string; field: string; scale?: number }
  | {
      kind: "choice";
      label: string;
      field: string;
      options: ReadonlyArray<{ value: string; label: string }>;
    }
  | { kind: "boolean"; label: string; field: string };

export const DEFAULT_INTERVIEW_DIMENSIONS: ReadonlyArray<ScorecardDimensionSpec> = [
  { kind: "score", label: "Technical", field: "technical", scale: 5 },
  { kind: "score", label: "Communication", field: "communication", scale: 5 },
  { kind: "score", label: "Culture", field: "culture", scale: 5 },
  {
    kind: "choice",
    label: "Recommendation",
    field: "recommendation",
    options: [
      { value: "strong_yes", label: "Strong yes" },
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "strong_no", label: "Strong no" },
    ],
  },
];

export type ScorecardSidebarProps = {
  sessionId: string;
  /** Optional initial scorecard (pre-filled from a prior unsubmitted draft). */
  initial?: {
    dimensions: ScorecardDimensions;
    notesMd: string;
  };
  /** Dimensions schema; defaults to the four-dimension interview scaffold. */
  dimensions?: ReadonlyArray<ScorecardDimensionSpec>;
  /** Kicker copy above the scorecard. */
  kicker?: string;
  /** Title — defaults to "Scorecard". */
  title?: string;
};

export function ScorecardSidebar({
  sessionId,
  initial,
  dimensions = DEFAULT_INTERVIEW_DIMENSIONS,
  kicker = "Reviewer",
  title = "Scorecard",
}: ScorecardSidebarProps) {
  const [values, setValues] = useState<ScorecardDimensions>(
    () => initial?.dimensions ?? {},
  );
  const [notes, setNotes] = useState(initial?.notesMd ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<RoomError | undefined>(undefined);

  const setField = useCallback((field: string, next: number | string | boolean) => {
    setValues((current) => ({ ...current, [field]: next }));
  }, []);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(undefined);
    const result = await submitScorecardAction({
      sessionId,
      dimensions: values,
      notesMd: notes || undefined,
    });
    setSubmitting(false);
    if (isRoomError(result)) {
      setError(result);
      return;
    }
    setSubmitted(true);
  }, [sessionId, values, notes]);

  const completion = useMemo(() => {
    const required = dimensions.length;
    let filled = 0;
    for (const d of dimensions) {
      const v = values[d.field];
      if (v !== undefined && v !== null && v !== "") filled++;
    }
    return required === 0 ? 1 : filled / required;
  }, [dimensions, values]);

  if (dimensions.length === 0) {
    return (
      <Panel tone="flat" padding="lg">
        <EmptyState
          kicker={kicker}
          headline="No scorecard configured"
          body="Pass a `dimensions` prop to render a reviewer scorecard for this session."
        />
      </Panel>
    );
  }

  return (
    <Panel tone="flat" padding="lg" aria-label={title}>
      <Section kicker={kicker} headline={title}>
        <p
          style={{
            fontSize: "0.85rem",
            color: `var(${CSS_VARS.inkMuted})`,
            margin: 0,
          }}
        >
          {Math.round(completion * 100)}% complete
        </p>
      </Section>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        {dimensions.map((dim) => (
          <DimensionField
            key={dim.field}
            spec={dim}
            value={values[dim.field]}
            onChange={(next) => setField(dim.field, next)}
            disabled={submitting}
          />
        ))}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label
            htmlFor={`notes-${sessionId}`}
            style={{
              fontSize: "0.85rem",
              fontWeight: 500,
              color: `var(${CSS_VARS.inkSoft})`,
            }}
          >
            Notes
          </label>
          <textarea
            id={`notes-${sessionId}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything the next reviewer should know."
            rows={4}
            disabled={submitting}
            style={{
              resize: "vertical",
              minHeight: "5rem",
              padding: "0.6rem 0.75rem",
              borderRadius: "0.75rem",
              border: `1px solid var(${CSS_VARS.hairline})`,
              backgroundColor: `var(${CSS_VARS.surface})`,
              color: `var(${CSS_VARS.ink})`,
              fontFamily: "inherit",
              fontSize: "0.95rem",
              lineHeight: 1.5,
            }}
          />
        </div>
        {error ? (
          <p
            role="alert"
            style={{
              margin: 0,
              color: "var(--hc-status-danger-text, #B91C1C)",
              fontSize: "0.9rem",
            }}
          >
            We couldn&apos;t save your scorecard ({error.error}). Try again.
          </p>
        ) : null}
        <div>
          <ActionButton
            tone="primary"
            onClick={submit}
            spinner={submitting}
            success={submitted}
            icon={
              submitted ? (
                <CheckCircle2 size={16} aria-hidden />
              ) : undefined
            }
          >
            {submitted ? "Submitted" : "Submit scorecard"}
          </ActionButton>
        </div>
      </div>
    </Panel>
  );
}

function DimensionField({
  spec,
  value,
  onChange,
  disabled,
}: {
  spec: ScorecardDimensionSpec;
  value: ScorecardDimensions[string] | undefined;
  onChange: (next: number | string | boolean) => void;
  disabled: boolean;
}) {
  if (spec.kind === "score") {
    const scale = spec.scale ?? 5;
    return (
      <fieldset
        disabled={disabled}
        style={{
          border: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
        }}
      >
        <legend
          style={{
            fontSize: "0.85rem",
            fontWeight: 500,
            color: `var(${CSS_VARS.inkSoft})`,
            padding: 0,
          }}
        >
          {spec.label}
        </legend>
        <div
          role="radiogroup"
          aria-label={spec.label}
          style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}
        >
          {Array.from({ length: scale + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={value === i}
              onClick={() => onChange(i)}
              disabled={disabled}
              style={{
                minWidth: "2.5rem",
                minHeight: "2.5rem",
                borderRadius: "9999px",
                border: `1px solid ${
                  value === i
                    ? `var(${CSS_VARS.accent})`
                    : `var(${CSS_VARS.hairline})`
                }`,
                backgroundColor:
                  value === i
                    ? `var(${CSS_VARS.accentSoft})`
                    : `var(${CSS_VARS.surface})`,
                color: `var(${CSS_VARS.ink})`,
                fontWeight: 500,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {i === 0 ? <Star size={14} aria-hidden /> : i}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }

  if (spec.kind === "choice") {
    return (
      <fieldset
        disabled={disabled}
        style={{
          border: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
        }}
      >
        <legend
          style={{
            fontSize: "0.85rem",
            fontWeight: 500,
            color: `var(${CSS_VARS.inkSoft})`,
            padding: 0,
          }}
        >
          {spec.label}
        </legend>
        <div
          role="radiogroup"
          aria-label={spec.label}
          style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}
        >
          {spec.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={value === opt.value}
              onClick={() => onChange(opt.value)}
              disabled={disabled}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "9999px",
                border: `1px solid ${
                  value === opt.value
                    ? `var(${CSS_VARS.accent})`
                    : `var(${CSS_VARS.hairline})`
                }`,
                backgroundColor:
                  value === opt.value
                    ? `var(${CSS_VARS.accentSoft})`
                    : `var(${CSS_VARS.surface})`,
                color: `var(${CSS_VARS.ink})`,
                fontWeight: 500,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }

  // boolean
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "0.95rem",
        color: `var(${CSS_VARS.ink})`,
      }}
    >
      <input
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      {spec.label}
    </label>
  );
}
