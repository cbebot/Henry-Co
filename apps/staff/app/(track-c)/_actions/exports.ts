"use server";

import type { BulkExportFormat } from "@henryco/dashboard-shell/components";

/**
 * Track C export server actions.
 *
 * Each module's StaffQueueShell calls `onExport(format, capturedFilters)`
 * which proxies to one of the per-module server actions below. For
 * DASH-9 the action records the export intent (module, division,
 * entity_type, format, captured filters, visible ids, exportedAt) so
 * a downstream pass can wire the actual DOCS-01 generator call. The
 * captured-filter payload preserves the EXACT view the operator saw.
 *
 * The integration with `@henryco/branded-documents` (DOCS-01) lands
 * in a follow-up sub-pass.
 */

async function recordExport(payload: {
  module: string;
  division: string | null;
  entityType: string;
  format: BulkExportFormat;
  capturedFilters: ReadonlyArray<{ label: string; value: string }>;
  visibleIds: string[];
}) {
  console.info("[track-c.export]", JSON.stringify({
    ...payload,
    exportedAt: new Date().toISOString(),
  }));
}

export async function handleStaffOverviewExport(
  format: BulkExportFormat,
  capturedFilters: ReadonlyArray<{ label: string; value: string }>,
  visibleIds: string[],
): Promise<void> {
  await recordExport({ module: "staff-overview", division: null, entityType: "overview", format, capturedFilters, visibleIds });
}

export async function handleStaffCareExport(
  format: BulkExportFormat,
  capturedFilters: ReadonlyArray<{ label: string; value: string }>,
  visibleIds: string[],
): Promise<void> {
  await recordExport({ module: "staff-care", division: "care", entityType: "care_booking", format, capturedFilters, visibleIds });
}

export async function handleStaffMarketplaceExport(
  format: BulkExportFormat,
  capturedFilters: ReadonlyArray<{ label: string; value: string }>,
  visibleIds: string[],
): Promise<void> {
  await recordExport({ module: "staff-marketplace", division: "marketplace", entityType: "marketplace_order", format, capturedFilters, visibleIds });
}

export async function handleStaffPropertyExport(
  format: BulkExportFormat,
  capturedFilters: ReadonlyArray<{ label: string; value: string }>,
  visibleIds: string[],
): Promise<void> {
  await recordExport({ module: "staff-property", division: "property", entityType: "property_listing", format, capturedFilters, visibleIds });
}

export async function handleStaffStudioExport(
  format: BulkExportFormat,
  capturedFilters: ReadonlyArray<{ label: string; value: string }>,
  visibleIds: string[],
): Promise<void> {
  await recordExport({ module: "staff-studio", division: "studio", entityType: "studio_project", format, capturedFilters, visibleIds });
}

export async function handleStaffJobsExport(
  format: BulkExportFormat,
  capturedFilters: ReadonlyArray<{ label: string; value: string }>,
  visibleIds: string[],
): Promise<void> {
  await recordExport({ module: "staff-jobs", division: "jobs", entityType: "jobs_application", format, capturedFilters, visibleIds });
}

export async function handleStaffLearnExport(
  format: BulkExportFormat,
  capturedFilters: ReadonlyArray<{ label: string; value: string }>,
  visibleIds: string[],
): Promise<void> {
  await recordExport({ module: "staff-learn", division: "learn", entityType: "learn_course", format, capturedFilters, visibleIds });
}

export async function handleStaffLogisticsExport(
  format: BulkExportFormat,
  capturedFilters: ReadonlyArray<{ label: string; value: string }>,
  visibleIds: string[],
): Promise<void> {
  await recordExport({ module: "staff-logistics", division: "logistics", entityType: "logistics_shipment", format, capturedFilters, visibleIds });
}

export async function handleStaffSupportExport(
  format: BulkExportFormat,
  capturedFilters: ReadonlyArray<{ label: string; value: string }>,
  visibleIds: string[],
): Promise<void> {
  await recordExport({ module: "staff-support", division: null, entityType: "support_thread", format, capturedFilters, visibleIds });
}

export async function handleStaffModerationExport(
  format: BulkExportFormat,
  capturedFilters: ReadonlyArray<{ label: string; value: string }>,
  visibleIds: string[],
): Promise<void> {
  await recordExport({ module: "staff-moderation", division: null, entityType: "moderation_case", format, capturedFilters, visibleIds });
}

export async function handleStaffFinanceOperatorExport(
  format: BulkExportFormat,
  capturedFilters: ReadonlyArray<{ label: string; value: string }>,
  visibleIds: string[],
): Promise<void> {
  await recordExport({ module: "staff-finance-operator", division: null, entityType: "payout_request", format, capturedFilters, visibleIds });
}
