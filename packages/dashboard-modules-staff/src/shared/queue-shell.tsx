"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import {
  AdvancedFilterBar,
  BulkActionBar,
  BulkExportButton,
  QueueTable,
  summarizeActiveFilters,
  type BulkAction,
  type BulkActionBarHandle,
  type BulkExportFormat,
  type FilterField,
  type FilterValue,
  type FilterValueMap,
  type QueueColumn,
  type QueueRow,
} from "@henryco/dashboard-shell/components";

import { DEFAULT_STAFF_QUEUE_FILTERS } from "./queue-filters";

/**
 * StaffQueueShell — composed queue surface for Track C modules.
 *
 * Wraps:
 *   - AdvancedFilterBar (sticky filters)
 *   - QueueTable (density-first row table)
 *   - BulkActionBar (selection toolbar with reason-capture)
 *   - BulkExportButton (DOCS-01 export with active-filter capture)
 *
 * Each module's page renders <StaffQueueShell rows={...} /> with
 * module-specific filter fields, columns, and bulk actions. The shell
 * handles all state plumbing (filter state, selection state, working
 * state, error state).
 *
 * The shell takes ALREADY-FILTERED rows — the caller's server
 * component runs the query against the database and passes the
 * resulting rows in. Filter state changes call onFilterChange so the
 * caller can re-fetch (typically by encoding into URL searchParams).
 */

export type StaffQueueShellProps<T = unknown> = {
  /** Filter field definitions (module-specific). */
  filterFields: ReadonlyArray<FilterField>;
  /** Current filter values (controlled). */
  filterValues: FilterValueMap;
  /** Called when filter values change. */
  onFilterChange: (next: FilterValueMap) => void;

  /** Already-filtered queue rows from the server. */
  rows: ReadonlyArray<QueueRow<T>>;
  /** Column definitions. */
  columns: ReadonlyArray<QueueColumn<T>>;

  /** Bulk-action descriptors. */
  bulkActions: ReadonlyArray<BulkAction>;
  /**
   * Called when a bulk action is confirmed. Returns Promise — bar
   * shows in-flight state until resolved.
   */
  onBulkAction: (
    actionId: string,
    selectedIds: ReadonlyArray<string>,
    reason: string | null,
  ) => Promise<void>;

  /**
   * Called when the operator activates a single row (Enter key or
   * row click). Typically opens a deep-link.
   */
  onActivate?: (row: QueueRow<T>) => void;

  /**
   * Called when the operator triggers an export. Receives format and
   * captured filter summary. Caller is responsible for fetching the
   * actual rows + delegating to DOCS-01.
   */
  onExport: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
  ) => Promise<void>;

  /** Optional selection-change callback (controlled selection). */
  onSelectionChange?: (selectedIds: ReadonlyArray<string>) => void;

  /** Optional title above the queue. */
  title?: string;

  /** Optional empty-state. */
  emptyState?: ReactNode;
};

export function StaffQueueShell<T = unknown>({
  filterFields,
  filterValues,
  onFilterChange,
  rows,
  columns,
  bulkActions,
  onBulkAction,
  onActivate,
  onExport,
  onSelectionChange,
  title,
  emptyState,
}: StaffQueueShellProps<T>) {
  const [internalSelected, setInternalSelected] = useState<ReadonlyArray<string>>(
    [],
  );
  const bulkBarRef = useRef<BulkActionBarHandle>(null);

  const handleFilterChange = useCallback(
    (id: string, value: FilterValue) => {
      onFilterChange({ ...filterValues, [id]: value });
    },
    [filterValues, onFilterChange],
  );

  const handleClearAllFilters = useCallback(() => {
    onFilterChange({});
  }, [onFilterChange]);

  const handleSelection = useCallback(
    (next: ReadonlyArray<string>) => {
      setInternalSelected(next);
      onSelectionChange?.(next);
    },
    [onSelectionChange],
  );

  const summary = useMemo(() => summarizeActiveFilters(filterFields, filterValues), [
    filterFields,
    filterValues,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {title ? (
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 600,
            margin: 0,
            color: "var(--hc-ink, #0A0A0A)",
          }}
        >
          {title}
        </h3>
      ) : null}

      <AdvancedFilterBar
        fields={filterFields}
        values={filterValues}
        onChange={handleFilterChange}
        onClearAll={handleClearAllFilters}
        trailing={
          <BulkExportButton
            capturedFilters={summary}
            onExport={onExport}
            disabled={rows.length === 0}
          />
        }
      />

      <QueueTable<T>
        rows={rows}
        columns={columns}
        selectedIds={internalSelected}
        onSelectionChange={handleSelection}
        onActivate={onActivate}
        emptyState={emptyState}
      />

      <BulkActionBar
        ref={bulkBarRef}
        selectedIds={internalSelected}
        onClear={() => handleSelection([])}
        actions={bulkActions}
        onActionConfirm={async (id, ids, reason) => {
          await onBulkAction(id, ids, reason);
          handleSelection([]);
        }}
      />
    </div>
  );
}

// DEFAULT_STAFF_QUEUE_FILTERS lives in ./queue-filters.ts so server
// components can spread it without crossing a "use client" boundary.
// Re-exported here for the existing barrel callers.
export { DEFAULT_STAFF_QUEUE_FILTERS } from "./queue-filters";
