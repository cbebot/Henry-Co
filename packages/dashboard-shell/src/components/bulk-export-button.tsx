"use client";

import { useState, type CSSProperties } from "react";

import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";

/**
 * BulkExportButton — wraps DOCS-01 export with active-filter capture.
 *
 * Per Track C power requirement:
 *   "Exports: every staff queue can export via DOCS-01 — branded PDF
 *    for snapshot reports, CSV for analysis. Active filter state
 *    captured in the document header so the operator knows what view
 *    they downloaded."
 *
 * The button OWNS the format-picker UI (PDF + CSV side-by-side).
 * Caller passes a single `onExport(format, capturedFilters)` async
 * handler — the handler is responsible for calling the DOCS-01 service
 * (or equivalent) with the appropriate template + payload.
 *
 * Server-side flow (caller):
 *   1. Receive (format, capturedFilters) from this client.
 *   2. Run the queue query with the filters applied.
 *   3. Pass results + captured filters to the DOCS-01 PDF/CSV
 *      generator.
 *   4. Return the resulting URL or stream the file back.
 *
 * The button shows a working state while onExport runs and surfaces
 * errors inline.
 */

export type BulkExportFormat = "pdf" | "csv";

export type BulkExportButtonProps = {
  /** The active-filter summary captured from AdvancedFilterBar.summarizeActiveFilters. */
  capturedFilters: ReadonlyArray<{ label: string; value: string }>;
  /** Called when the operator picks a format. Should resolve when the export is complete. */
  onExport: (format: BulkExportFormat, capturedFilters: ReadonlyArray<{ label: string; value: string }>) => Promise<void>;
  /** Optional disabled state — disable when no rows match the filter. */
  disabled?: boolean;
  /** Display label — defaults to "Export". */
  label?: string;
};

export function BulkExportButton({
  capturedFilters,
  onExport,
  disabled,
  label = "Export",
}: BulkExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState<BulkExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(format: BulkExportFormat) {
    setError(null);
    setWorking(format);
    try {
      await onExport(format, capturedFilters);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setWorking(null);
    }
  }

  const triggerStyle: CSSProperties = {
    ...typeStyle("bodyStrong"),
    border: `1px solid var(${CSS_VARS.hairline})`,
    background: `var(${CSS_VARS.surface})`,
    color: `var(${CSS_VARS.ink})`,
    borderRadius: RADIUS.md,
    padding: "0.4rem 0.7rem",
    cursor: disabled ? "not-allowed" : "pointer",
    minHeight: "2.25rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={triggerStyle}
        className="hc-staff-export-trigger"
      >
        {label}
        <span aria-hidden style={{ fontSize: "0.7rem", opacity: 0.7 }}>
          ▾
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 0.375rem)",
            right: 0,
            background: `var(${CSS_VARS.surface})`,
            border: `1px solid var(${CSS_VARS.hairline})`,
            borderRadius: RADIUS.md,
            boxShadow: `0 12px 32px rgba(0,0,0,0.16)`,
            padding: "0.375rem",
            minWidth: "16rem",
            zIndex: 30,
          }}
        >
          <p
            style={{
              ...typeStyle("kicker"),
              margin: 0,
              padding: "0.375rem 0.5rem",
              color: `var(${CSS_VARS.inkMuted})`,
            }}
          >
            Export with active filters
          </p>
          {capturedFilters.length > 0 ? (
            <ul
              style={{
                listStyle: "none",
                padding: "0 0.5rem",
                margin: "0 0 0.375rem",
              }}
            >
              {capturedFilters.slice(0, 4).map((f) => (
                <li
                  key={f.label}
                  style={{ ...typeStyle("small"), color: `var(${CSS_VARS.inkSoft})` }}
                >
                  <span style={{ color: `var(${CSS_VARS.inkMuted})` }}>{f.label}: </span>
                  {f.value}
                </li>
              ))}
              {capturedFilters.length > 4 ? (
                <li
                  style={{ ...typeStyle("small"), color: `var(${CSS_VARS.inkMuted})` }}
                >
                  + {capturedFilters.length - 4} more
                </li>
              ) : null}
            </ul>
          ) : (
            <p
              style={{
                ...typeStyle("small"),
                margin: "0 0 0.375rem",
                padding: "0 0.5rem",
                color: `var(${CSS_VARS.inkMuted})`,
              }}
            >
              No filters active — export captures the full visible queue.
            </p>
          )}
          {(["pdf", "csv"] as const).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => handleExport(format)}
              disabled={working !== null}
              role="menuitem"
              style={{
                ...typeStyle("body"),
                width: "100%",
                textAlign: "left",
                padding: "0.5rem 0.5rem",
                border: "none",
                background: "transparent",
                color: `var(${CSS_VARS.ink})`,
                cursor: working ? "wait" : "pointer",
                borderRadius: RADIUS.sm,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{format === "pdf" ? "Branded PDF" : "CSV (analysis)"}</span>
              <span style={{ ...typeStyle("kicker"), color: `var(${CSS_VARS.inkMuted})` }}>
                {working === format ? "…working" : format.toUpperCase()}
              </span>
            </button>
          ))}
          {error ? (
            <p
              role="alert"
              style={{
                ...typeStyle("small"),
                color: "#B91C1C",
                margin: "0.375rem 0 0",
                padding: "0 0.5rem",
              }}
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
