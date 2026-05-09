"use client";

import { useMemo, useState } from "react";
import {
  Section,
  PageHeader,
  type FilterValueMap,
  type QueueColumn,
  type QueueRow,
  type BulkAction,
  type BulkExportFormat,
} from "@henryco/dashboard-shell/components";

import { StaffQueueShell } from "./queue-shell";
import { DEFAULT_STAFF_QUEUE_FILTERS } from "./queue-filters";
import { STAFF_DIVISION_ACCENT } from "./division-accent";
import { deriveSLABucket } from "./sla";
import type { FilterField } from "@henryco/dashboard-shell/components";
import type { StaffDivision } from "@henryco/auth/staff";

/**
 * GenericStaffQueueClient — re-usable client component that powers
 * any Track C division module's queue page.
 *
 * Each module's page passes:
 *   - a snapshot (rows + counts)
 *   - filter fields (defaults + module-specific)
 *   - columns (module-specific)
 *   - bulk actions (module-specific)
 *   - server action handlers for bulk-action + export + row activate
 *
 * The component owns the filter state + selection state. Filtering
 * is performed client-side against the snapshot (the shell snapshot
 * size is bounded; the server component re-fetches when the URL
 * filter state diverges substantially).
 */

export type GenericQueueSnapshot<T> = {
  rows: ReadonlyArray<T>;
  pendingCount: number;
  slaWarningCount: number;
  slaBreachCount: number;
};

export type GenericStaffQueueClientProps<T> = {
  /** Headline kicker (e.g. "Marketplace · operator"). */
  kicker: string;
  /** Page title. */
  title: string;
  /** Optional description line. */
  description?: string;
  /** Optional section kicker above the queue. */
  sectionKicker?: string;
  /** Snapshot. */
  snapshot: GenericQueueSnapshot<T>;
  /** Module-specific filter fields. */
  filterFields: ReadonlyArray<FilterField>;
  /** Maps a row to QueueRow<T> for the table. */
  rowAdapter: (row: T) => QueueRow<T>;
  /** Returns true when row passes the active filters. */
  matchesFilter: (row: T, filters: FilterValueMap) => boolean;
  /** Columns. */
  columns: ReadonlyArray<QueueColumn<T>>;
  /** Bulk actions. */
  bulkActions: ReadonlyArray<BulkAction>;
  /** Server-action proxy for bulk-action confirm. */
  onBulkAction: (
    actionId: string,
    selectedIds: string[],
    reason: string | null,
  ) => Promise<void>;
  /** Server-action proxy for export. */
  onExport: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ) => Promise<void>;
  /** Function returning the row deep-link href. Falls back to no-op. */
  rowDeepLink?: (row: T) => string | null;
};

export function GenericStaffQueueClient<T>({
  kicker,
  title,
  description,
  sectionKicker,
  snapshot,
  filterFields,
  rowAdapter,
  matchesFilter,
  columns,
  bulkActions,
  onBulkAction,
  onExport,
  rowDeepLink,
}: GenericStaffQueueClientProps<T>) {
  const [filters, setFilters] = useState<FilterValueMap>({});
  const filteredRows = useMemo(() => {
    return snapshot.rows
      .filter((r) => matchesFilter(r, filters))
      .map(rowAdapter);
  }, [snapshot.rows, filters, matchesFilter, rowAdapter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <PageHeader
        kicker={kicker}
        title={title}
        description={
          description ??
          `${snapshot.pendingCount} pending · ${snapshot.slaBreachCount} SLA breach · ${snapshot.slaWarningCount} warning`
        }
      />
      <Section kicker={sectionKicker ?? title}>
        <StaffQueueShell<T>
          filterFields={filterFields}
          filterValues={filters}
          onFilterChange={setFilters}
          rows={filteredRows}
          columns={columns}
          bulkActions={bulkActions}
          onBulkAction={async (id, ids, reason) => {
            await onBulkAction(id, [...ids], reason);
          }}
          onActivate={
            rowDeepLink
              ? (row) => {
                  const href = rowDeepLink(row.data);
                  if (href) window.location.href = href;
                }
              : undefined
          }
          onExport={async (format, capturedFilters) => {
            await onExport(
              format,
              capturedFilters,
              filteredRows.map((r) => r.id),
            );
          }}
        />
      </Section>
    </div>
  );
}

export { DEFAULT_STAFF_QUEUE_FILTERS, STAFF_DIVISION_ACCENT, deriveSLABucket };
export type { StaffDivision };
