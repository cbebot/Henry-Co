"use client";

import { useId, type CSSProperties, type ReactNode } from "react";

import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";

/**
 * AdvancedFilterBar — composable filter strip for staff queue tables.
 *
 * Per Track C power requirement:
 *   "Advanced filters: division, status, assignee, SLA bucket, date
 *    range, free-text search across the active queue."
 *
 * The bar is field-driven — callers pass a `fields` array describing
 * the dimensions they want surfaced. The bar renders the appropriate
 * control type (select, segmented, daterange, text) and emits change
 * events via `onChange(fieldId, value)`.
 *
 * State is OWNED by the caller (controlled component). Caller decides
 * whether to debounce text inputs, persist to URL search params, etc.
 *
 * Visible-active filter affordance: the bar surfaces an "X active filters"
 * pill on the right edge with a "clear all" action. This pairs with
 * BulkExportButton, which captures the active filter state into the
 * exported document header so the operator knows what view they
 * downloaded.
 */

type FilterFieldBase = {
  id: string;
  label: string;
  /** Optional help string, shown as a small kicker. */
  help?: string;
};

type SelectField = FilterFieldBase & {
  kind: "select";
  options: ReadonlyArray<{ value: string; label: string }>;
  /** Multi-value version. */
  multi?: boolean;
};

type SegmentedField = FilterFieldBase & {
  kind: "segmented";
  options: ReadonlyArray<{ value: string; label: string }>;
};

type TextField = FilterFieldBase & {
  kind: "text";
  placeholder?: string;
};

type DateRangeField = FilterFieldBase & {
  kind: "daterange";
};

export type FilterField = SelectField | SegmentedField | TextField | DateRangeField;

export type FilterValue =
  | string
  | ReadonlyArray<string>
  | { from: string; to: string }
  | null;

export type FilterValueMap = Readonly<Record<string, FilterValue>>;

export type AdvancedFilterBarProps = {
  fields: ReadonlyArray<FilterField>;
  /** Current values keyed by field.id. */
  values: FilterValueMap;
  /** Called when any field value changes. */
  onChange: (fieldId: string, value: FilterValue) => void;
  /** Optional clear-all callback. When omitted, the clear-all chip is hidden. */
  onClearAll?: () => void;
  /** Optional trailing slot — caller may render export buttons here. */
  trailing?: ReactNode;
};

function activeCount(values: FilterValueMap): number {
  let n = 0;
  for (const v of Object.values(values)) {
    if (v == null) continue;
    if (typeof v === "string") {
      if (v.trim().length > 0) n++;
    } else if (Array.isArray(v)) {
      if (v.length > 0) n++;
    } else if (typeof v === "object") {
      const range = v as { from: string; to: string };
      if (range.from || range.to) n++;
    }
  }
  return n;
}

function fieldStyle(): CSSProperties {
  return {
    ...typeStyle("small"),
    border: `1px solid var(${CSS_VARS.hairline})`,
    borderRadius: RADIUS.md,
    background: `var(${CSS_VARS.surface})`,
    color: `var(${CSS_VARS.ink})`,
    padding: "0.4rem 0.6rem",
    minHeight: "2.25rem",
    minWidth: "8rem",
  };
}

export function AdvancedFilterBar({
  fields,
  values,
  onChange,
  onClearAll,
  trailing,
}: AdvancedFilterBarProps) {
  const id = useId();
  const active = activeCount(values);

  return (
    <div
      role="search"
      aria-label="Advanced filters"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.625rem 0.75rem",
        background: `var(${CSS_VARS.surfaceElevated})`,
        borderRadius: RADIUS.md,
        boxShadow: `inset 0 0 0 1px var(${CSS_VARS.hairline})`,
      }}
    >
      {fields.map((field) => {
        const fieldId = `${id}-${field.id}`;
        if (field.kind === "select") {
          const cur = values[field.id];
          const value = field.multi
            ? Array.isArray(cur)
              ? cur
              : []
            : typeof cur === "string"
              ? cur
              : "";
          return (
            <label
              key={field.id}
              htmlFor={fieldId}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <span
                style={{
                  ...typeStyle("kicker"),
                  color: `var(${CSS_VARS.inkMuted})`,
                  whiteSpace: "nowrap",
                }}
              >
                {field.label}
              </span>
              <select
                id={fieldId}
                multiple={field.multi}
                value={value as string | string[]}
                onChange={(e) => {
                  if (field.multi) {
                    const opts = Array.from(e.currentTarget.selectedOptions).map((o) => o.value);
                    onChange(field.id, opts);
                  } else {
                    onChange(field.id, e.currentTarget.value || null);
                  }
                }}
                style={fieldStyle()}
              >
                {!field.multi ? <option value="">Any</option> : null}
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (field.kind === "segmented") {
          const cur = typeof values[field.id] === "string" ? (values[field.id] as string) : "";
          return (
            <fieldset
              key={field.id}
              style={{
                border: `1px solid var(${CSS_VARS.hairline})`,
                borderRadius: RADIUS.pill,
                padding: "0.125rem",
                margin: 0,
                display: "inline-flex",
                gap: "0.125rem",
              }}
              aria-label={field.label}
            >
              {field.options.map((opt) => {
                const isSelected = cur === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(field.id, isSelected ? null : opt.value)}
                    aria-pressed={isSelected}
                    style={{
                      ...typeStyle("small"),
                      border: "none",
                      borderRadius: RADIUS.pill,
                      padding: "0.3rem 0.7rem",
                      background: isSelected
                        ? `var(${CSS_VARS.accent})`
                        : "transparent",
                      color: isSelected ? "#0A0A0A" : `var(${CSS_VARS.ink})`,
                      cursor: "pointer",
                      minHeight: "2rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </fieldset>
          );
        }

        if (field.kind === "text") {
          const cur = typeof values[field.id] === "string" ? (values[field.id] as string) : "";
          return (
            <label
              key={field.id}
              htmlFor={fieldId}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <span
                style={{
                  ...typeStyle("kicker"),
                  color: `var(${CSS_VARS.inkMuted})`,
                  whiteSpace: "nowrap",
                }}
              >
                {field.label}
              </span>
              <input
                id={fieldId}
                type="search"
                value={cur}
                placeholder={field.placeholder ?? "Search…"}
                onChange={(e) => onChange(field.id, e.currentTarget.value || null)}
                style={{ ...fieldStyle(), minWidth: "12rem" }}
              />
            </label>
          );
        }

        // daterange
        const range = (values[field.id] as { from: string; to: string } | null) ?? {
          from: "",
          to: "",
        };
        return (
          <fieldset
            key={field.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              border: "none",
              padding: 0,
              margin: 0,
            }}
          >
            <legend
              style={{
                ...typeStyle("kicker"),
                color: `var(${CSS_VARS.inkMuted})`,
                whiteSpace: "nowrap",
                padding: 0,
              }}
            >
              {field.label}
            </legend>
            <input
              id={`${fieldId}-from`}
              type="date"
              value={range.from}
              onChange={(e) =>
                onChange(field.id, {
                  from: e.currentTarget.value,
                  to: range.to,
                })
              }
              style={fieldStyle()}
              aria-label={`${field.label} from`}
            />
            <span style={{ ...typeStyle("small"), color: `var(${CSS_VARS.inkMuted})` }}>→</span>
            <input
              id={`${fieldId}-to`}
              type="date"
              value={range.to}
              onChange={(e) =>
                onChange(field.id, {
                  from: range.from,
                  to: e.currentTarget.value,
                })
              }
              style={fieldStyle()}
              aria-label={`${field.label} to`}
            />
          </fieldset>
        );
      })}

      <span style={{ flex: 1, minWidth: 0 }} />

      {active > 0 && onClearAll ? (
        <button
          type="button"
          onClick={onClearAll}
          style={{
            ...typeStyle("kicker"),
            border: `1px solid var(${CSS_VARS.hairline})`,
            background: "transparent",
            color: `var(${CSS_VARS.ink})`,
            borderRadius: RADIUS.pill,
            padding: "0.3rem 0.625rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Clear {active} {active === 1 ? "filter" : "filters"}
        </button>
      ) : null}

      {trailing}
    </div>
  );
}

/**
 * Helper: serialize the active filter state into a header payload that
 * BulkExportButton can write into the exported document. Callers use
 * this to ensure the export captures EXACTLY the view the operator
 * downloaded.
 */
export function summarizeActiveFilters(
  fields: ReadonlyArray<FilterField>,
  values: FilterValueMap,
): ReadonlyArray<{ label: string; value: string }> {
  const out: { label: string; value: string }[] = [];
  for (const field of fields) {
    const v = values[field.id];
    if (v == null) continue;
    if (typeof v === "string") {
      if (!v.trim()) continue;
      out.push({ label: field.label, value: v });
    } else if (Array.isArray(v)) {
      if (v.length === 0) continue;
      out.push({ label: field.label, value: v.join(", ") });
    } else if (typeof v === "object") {
      const r = v as { from: string; to: string };
      const label = `${r.from || "—"} to ${r.to || "—"}`;
      out.push({ label: field.label, value: label });
    }
  }
  return out;
}
