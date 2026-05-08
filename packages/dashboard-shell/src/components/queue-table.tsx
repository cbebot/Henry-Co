"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";
import { SLAChip, type SLABucket } from "./sla-chip";

/**
 * QueueTable — density-first row table for staff queue surfaces.
 *
 * Per Track C density requirement:
 *   "Tables-first for ALL queues (support, moderation, dispute,
 *    application, listing-review, project-coordination, etc.)."
 *
 * The table is keyboard-driven:
 *   j / ArrowDown      → next row
 *   k / ArrowUp        → previous row
 *   x                  → toggle row selection
 *   Space              → toggle row selection (alt)
 *   shift+x            → range select from last anchor
 *   Enter              → activate row (caller decides — open detail, etc.)
 *
 * Hotkeys can be wired to bulk actions externally (the per-module
 * page passes a BulkActionBar ref + uses `triggerAction(actionId)`
 * from action key bindings).
 *
 * Selection state is OWNED by the caller (controlled). The table
 * surfaces the focus row + selection chrome.
 */

export type QueueRow<T = unknown> = {
  /** Stable id, unique within the table. */
  id: string;
  /** SLA bucket — drives the row's left-edge accent. */
  sla?: SLABucket;
  /** Optional ISO timestamp the SLA chip computes against. */
  slaDueAt?: string;
  /** Optional division accent (CSS color) — left-edge stripe. */
  divisionAccent?: string;
  /** Arbitrary caller-defined data the row renderer reads. */
  data: T;
};

export type QueueColumn<T = unknown> = {
  /** Stable id. */
  id: string;
  /** Header label — short, density-first. */
  label: string;
  /** Width hint (CSS width — e.g. "8rem", "minmax(12rem, 1fr)"). */
  width?: string;
  /** Cell renderer. */
  render: (row: QueueRow<T>) => ReactNode;
  /** Optional alignment. */
  align?: "left" | "right" | "center";
};

export type QueueTableProps<T = unknown> = {
  rows: ReadonlyArray<QueueRow<T>>;
  columns: ReadonlyArray<QueueColumn<T>>;
  /** Selected row ids. Caller owns the state. */
  selectedIds: ReadonlyArray<string>;
  /** Called when selection changes. */
  onSelectionChange: (ids: ReadonlyArray<string>) => void;
  /** Optional row activation handler — fires on Enter or row click. */
  onActivate?: (row: QueueRow<T>) => void;
  /** Optional empty-state block (rendered in the table body when rows is empty). */
  emptyState?: ReactNode;
  /** Optional max-height — table scrolls beyond this. */
  maxHeight?: string;
  /** Optional aria-label override. */
  ariaLabel?: string;
};

export function QueueTable<T = unknown>({
  rows,
  columns,
  selectedIds,
  onSelectionChange,
  onActivate,
  emptyState,
  maxHeight,
  ariaLabel,
}: QueueTableProps<T>) {
  const [focusIdx, setFocusIdx] = useState<number>(0);
  const lastAnchorIdx = useRef<number>(0);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = rows.length > 0 && rows.every((r) => selectedSet.has(r.id));
  const someSelected = !allSelected && rows.some((r) => selectedSet.has(r.id));

  const tbodyRef = useRef<HTMLDivElement | null>(null);

  const toggleRow = useCallback(
    (idx: number, range: boolean) => {
      if (idx < 0 || idx >= rows.length) return;
      const target = rows[idx];
      const newSet = new Set(selectedSet);
      if (range && lastAnchorIdx.current !== idx) {
        const lo = Math.min(lastAnchorIdx.current, idx);
        const hi = Math.max(lastAnchorIdx.current, idx);
        for (let i = lo; i <= hi; i++) newSet.add(rows[i].id);
      } else {
        if (newSet.has(target.id)) newSet.delete(target.id);
        else newSet.add(target.id);
        lastAnchorIdx.current = idx;
      }
      onSelectionChange(Array.from(newSet));
    },
    [rows, selectedSet, onSelectionChange],
  );

  const selectAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(rows.map((r) => r.id));
    }
  }, [rows, allSelected, onSelectionChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (rows.length === 0) return;
      const k = e.key;
      if (k === "ArrowDown" || k === "j") {
        e.preventDefault();
        setFocusIdx((i) => Math.min(rows.length - 1, i + 1));
      } else if (k === "ArrowUp" || k === "k") {
        e.preventDefault();
        setFocusIdx((i) => Math.max(0, i - 1));
      } else if (k === " " || k === "x") {
        e.preventDefault();
        toggleRow(focusIdx, e.shiftKey);
      } else if (k === "Enter") {
        e.preventDefault();
        const target = rows[focusIdx];
        if (target && onActivate) onActivate(target);
      } else if (k === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAll();
      }
    },
    [rows, focusIdx, toggleRow, onActivate, selectAll],
  );

  useEffect(() => {
    if (focusIdx >= rows.length) {
      setFocusIdx(Math.max(0, rows.length - 1));
    }
  }, [rows.length, focusIdx]);

  const gridTemplateColumns = useMemo(() => {
    const checkboxCol = "2.25rem";
    const slaCol = "5rem";
    const cols = columns.map((c) => c.width ?? "minmax(8rem, 1fr)").join(" ");
    return `${checkboxCol} ${slaCol} ${cols}`;
  }, [columns]);

  return (
    <div
      role="grid"
      aria-label={ariaLabel ?? "Queue rows"}
      aria-rowcount={rows.length + 1}
      tabIndex={0}
      ref={tbodyRef}
      onKeyDown={handleKeyDown}
      style={{
        position: "relative",
        background: `var(${CSS_VARS.surface})`,
        border: `1px solid var(${CSS_VARS.hairline})`,
        borderRadius: RADIUS.md,
        overflow: "auto",
        maxHeight,
        outline: "none",
      }}
    >
      <div
        role="row"
        style={{
          display: "grid",
          gridTemplateColumns,
          alignItems: "center",
          padding: "0.5rem 0.75rem",
          background: `var(${CSS_VARS.surfaceElevated})`,
          borderBottom: `1px solid var(${CSS_VARS.hairline})`,
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <div role="columnheader" style={{ display: "flex", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={selectAll}
            aria-label={allSelected ? "Deselect all rows" : "Select all rows"}
            style={{ accentColor: "#0A0A0A" }}
          />
        </div>
        <div role="columnheader" style={{ ...typeStyle("kicker"), color: `var(${CSS_VARS.inkMuted})` }}>
          SLA
        </div>
        {columns.map((col) => (
          <div
            key={col.id}
            role="columnheader"
            style={{
              ...typeStyle("kicker"),
              color: `var(${CSS_VARS.inkMuted})`,
              textAlign: col.align ?? "left",
            }}
          >
            {col.label}
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div role="row" style={{ padding: "1.25rem", color: `var(${CSS_VARS.inkMuted})` }}>
          {emptyState ?? "No queue rows match the current filters."}
        </div>
      ) : (
        rows.map((row, idx) => {
          const isFocused = idx === focusIdx;
          const isSelected = selectedSet.has(row.id);
          const accent = row.divisionAccent;
          const rowStyle: CSSProperties = {
            display: "grid",
            gridTemplateColumns,
            alignItems: "center",
            padding: "0.55rem 0.75rem 0.55rem 0.75rem",
            borderBottom: `1px solid var(${CSS_VARS.hairline})`,
            position: "relative",
            background: isSelected
              ? `color-mix(in oklab, var(${CSS_VARS.accent}) 7%, var(${CSS_VARS.surface}))`
              : `var(${CSS_VARS.surface})`,
            outline: isFocused
              ? `2px solid var(${CSS_VARS.focusRing})`
              : "2px solid transparent",
            outlineOffset: "-2px",
            cursor: "pointer",
            ...typeStyle("body"),
            color: `var(${CSS_VARS.ink})`,
          };
          return (
            <div
              key={row.id}
              role="row"
              aria-selected={isSelected}
              onClick={(e) => {
                if ((e.target as HTMLElement).tagName === "INPUT") return;
                setFocusIdx(idx);
                if (onActivate) onActivate(row);
              }}
              style={rowStyle}
            >
              {accent ? (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "3px",
                    background: accent,
                    borderTopLeftRadius: idx === 0 ? RADIUS.md : undefined,
                  }}
                />
              ) : null}
              <div role="gridcell">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    setFocusIdx(idx);
                    toggleRow(idx, e.nativeEvent instanceof MouseEvent && e.nativeEvent.shiftKey);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={isSelected ? "Deselect row" : "Select row"}
                  style={{ accentColor: "#0A0A0A" }}
                />
              </div>
              <div role="gridcell">
                <SLAChip
                  bucket={row.sla ?? "healthy"}
                  dueAt={row.slaDueAt}
                />
              </div>
              {columns.map((col) => (
                <div
                  key={col.id}
                  role="gridcell"
                  style={{ textAlign: col.align ?? "left", minWidth: 0 }}
                >
                  {col.render(row)}
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
