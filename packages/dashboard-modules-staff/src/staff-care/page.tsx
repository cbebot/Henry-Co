"use client";

import { useMemo, useState } from "react";
import {
  Section,
  PageHeader,
  Chip,
  type FilterValueMap,
  type QueueColumn,
  type QueueRow,
  type BulkAction,
  type BulkExportFormat,
} from "@henryco/dashboard-shell/components";

import { StaffQueueShell, DEFAULT_STAFF_QUEUE_FILTERS, deriveSLABucket, formatRelative, STAFF_DIVISION_ACCENT } from "../shared";
import type { CareBookingRow, CareQueueSnapshot } from "./data";

/**
 * staff-care — client-side queue page.
 *
 * Server component (`StaffCarePageServer`) hydrates the snapshot;
 * this client component owns the filter state + bulk action callbacks.
 *
 * Filters:
 *   status (segmented)            — open / in_progress / escalated / resolved
 *   payment_status (select)       — paid / outstanding / overdue
 *   service_type (select)         — all configured service types
 *   sla (select)                  — breach / warning / healthy
 *   pickup_date (daterange)       — restrict to a window
 *   search (text)                 — tracking code, customer name, phone
 *
 * Bulk actions:
 *   assign-rider                  — primary, no reason
 *   request-payment               — primary, no reason
 *   mark-pickup-attempted         — secondary, no reason
 *   refund                        — destructive, REASON REQUIRED
 *   cancel                        — destructive, REASON REQUIRED
 */

const CARE_FILTER_FIELDS = [
  ...DEFAULT_STAFF_QUEUE_FILTERS,
  {
    id: "payment_status",
    label: "Payment",
    kind: "select" as const,
    options: [
      { value: "paid", label: "Paid" },
      { value: "outstanding", label: "Outstanding" },
      { value: "overdue", label: "Overdue" },
    ],
  },
];

const CARE_BULK_ACTIONS: ReadonlyArray<BulkAction> = [
  {
    id: "assign-rider",
    label: "Assign rider",
    variant: "primary",
    confirmCopy: (n) => `Assign ${n} ${n === 1 ? "booking" : "bookings"} to next available rider.`,
  },
  {
    id: "request-payment",
    label: "Request payment",
    variant: "primary",
    confirmCopy: (n) => `Send payment-request emails to ${n} ${n === 1 ? "customer" : "customers"} with outstanding balance.`,
  },
  {
    id: "mark-pickup-attempted",
    label: "Mark pickup attempted",
    variant: "secondary",
    confirmCopy: (n) => `Mark ${n} ${n === 1 ? "booking" : "bookings"} as pickup attempted.`,
  },
  {
    id: "refund",
    label: "Refund",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) =>
      `Refund ${n} ${n === 1 ? "booking" : "bookings"}. This will issue a refund and write a Care.refund audit row per booking.`,
  },
  {
    id: "cancel",
    label: "Cancel",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) =>
      `Cancel ${n} ${n === 1 ? "booking" : "bookings"}. The customer will receive a cancellation notice.`,
  },
];

export type StaffCarePageClientProps = {
  snapshot: CareQueueSnapshot;
  /** Server action to handle a bulk action. Receives the raw payload. */
  bulkActionHandler: (
    actionId: string,
    selectedIds: string[],
    reason: string | null,
  ) => Promise<void>;
  exportHandler: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ) => Promise<void>;
  rowDeepLink: (row: CareBookingRow) => string;
};

export function StaffCarePageClient({
  snapshot,
  bulkActionHandler,
  exportHandler,
  rowDeepLink,
}: StaffCarePageClientProps) {
  const [filters, setFilters] = useState<FilterValueMap>({});

  const filteredRows = useMemo<ReadonlyArray<QueueRow<CareBookingRow>>>(() => {
    const status = typeof filters.status === "string" ? filters.status : null;
    const payment = typeof filters.payment_status === "string" ? filters.payment_status : null;
    const sla = typeof filters.sla === "string" ? filters.sla : null;
    const search =
      typeof filters.search === "string" ? filters.search.toLowerCase() : null;
    const dr = filters.createdAt as { from?: string; to?: string } | null | undefined;

    return snapshot.rows
      .filter((r) => {
        if (status === "open" && (r.status === "completed" || r.status === "cancelled"))
          return false;
        if (status === "resolved" && r.status !== "completed") return false;
        if (status === "in_progress" && !["picked_up", "in_service"].includes(r.status))
          return false;
        if (status === "escalated" && r.status !== "escalated") return false;
        if (payment) {
          if (payment === "paid" && r.paymentStatus !== "paid" && r.paymentStatus !== "settled")
            return false;
          if (payment === "outstanding" && (r.paymentStatus === "paid" || r.paymentStatus === "settled"))
            return false;
          if (payment === "overdue") {
            if (!r.paymentDueAt) return false;
            if (Date.parse(r.paymentDueAt) >= Date.now()) return false;
          }
        }
        if (sla) {
          const bucket = deriveSLABucket(r.paymentDueAt, {
            donePredicate: r.paymentStatus === "paid" || r.paymentStatus === "settled",
          });
          if (bucket !== sla) return false;
        }
        if (search) {
          const hay = `${r.trackingCode} ${r.customerName} ${r.pickupAddress} ${r.serviceType}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        if (dr?.from && r.pickupDate < dr.from) return false;
        if (dr?.to && r.pickupDate > dr.to) return false;
        return true;
      })
      .map((r) => ({
        id: r.id,
        sla: deriveSLABucket(r.paymentDueAt, {
          donePredicate: r.paymentStatus === "paid" || r.paymentStatus === "settled",
        }),
        slaDueAt: r.paymentDueAt ?? undefined,
        divisionAccent: STAFF_DIVISION_ACCENT.care,
        data: r,
      }));
  }, [filters, snapshot.rows]);

  const columns = useMemo<ReadonlyArray<QueueColumn<CareBookingRow>>>(
    () => [
      {
        id: "tracking",
        label: "Tracking",
        width: "10rem",
        render: (row) => (
          <span style={{ fontFamily: "ui-monospace,monospace", fontSize: "0.8rem" }}>
            {row.data.trackingCode || row.id.slice(0, 8)}
          </span>
        ),
      },
      {
        id: "customer",
        label: "Customer",
        width: "minmax(12rem,1fr)",
        render: (row) => (
          <span>
            <strong>{row.data.customerName}</strong>
            <span style={{ color: "rgba(10,10,10,0.55)", marginLeft: "0.5rem", fontSize: "0.78rem" }}>
              {row.data.pickupAddress}
            </span>
          </span>
        ),
      },
      {
        id: "service",
        label: "Service",
        width: "minmax(8rem,1fr)",
        render: (row) => <Chip tone="neutral">{row.data.serviceType}</Chip>,
      },
      {
        id: "pickup",
        label: "Pickup",
        width: "9rem",
        render: (row) => (
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "0.82rem" }}>
            {row.data.pickupDate} · {row.data.pickupSlot}
          </span>
        ),
      },
      {
        id: "status",
        label: "Status",
        width: "8rem",
        render: (row) => <Chip tone={statusToTone(row.data.status)}>{row.data.status}</Chip>,
      },
      {
        id: "payment",
        label: "Payment",
        width: "8rem",
        align: "right",
        render: (row) => (
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "0.82rem" }}>
            ₦{row.data.quotedTotal.toLocaleString()}{" "}
            <Chip tone={paymentToTone(row.data.paymentStatus)}>{row.data.paymentStatus}</Chip>
          </span>
        ),
      },
      {
        id: "created",
        label: "Created",
        width: "5rem",
        render: (row) => (
          <span style={{ fontSize: "0.74rem", color: "rgba(10,10,10,0.55)" }}>
            {formatRelative(row.data.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <PageHeader
        kicker="Care · operator"
        title="Pickups & dispatch"
        description={`${snapshot.pendingCount} pending · ${snapshot.slaBreachCount} SLA breach · ${snapshot.slaWarningCount} warning`}
      />
      <Section kicker="Care queue">
        <StaffQueueShell<CareBookingRow>
          filterFields={CARE_FILTER_FIELDS}
          filterValues={filters}
          onFilterChange={setFilters}
          rows={filteredRows}
          columns={columns}
          bulkActions={CARE_BULK_ACTIONS}
          onBulkAction={async (id, ids, reason) => {
            await bulkActionHandler(id, [...ids], reason);
          }}
          onActivate={(row) => {
            window.location.href = rowDeepLink(row.data);
          }}
          onExport={async (format, filters) => {
            await exportHandler(
              format,
              filters,
              filteredRows.map((r) => r.id),
            );
          }}
          emptyState={
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>No care bookings match the active filters.</p>
              <p style={{ margin: "0.25rem 0 0", color: "rgba(10,10,10,0.55)" }}>
                Try clearing the SLA filter or extending the date range.
              </p>
            </div>
          }
        />
      </Section>
    </div>
  );
}

function statusToTone(status: string): "success" | "warning" | "urgent" | "neutral" | "accent" {
  if (status === "completed" || status === "settled") return "success";
  if (status === "escalated" || status === "cancelled") return "urgent";
  if (status === "in_service" || status === "picked_up") return "accent";
  return "neutral";
}

function paymentToTone(payment: string): "success" | "warning" | "urgent" | "neutral" {
  if (payment === "paid" || payment === "settled") return "success";
  if (payment === "overdue") return "urgent";
  if (payment === "outstanding") return "warning";
  return "neutral";
}
