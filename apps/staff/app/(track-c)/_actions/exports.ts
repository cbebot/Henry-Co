"use server";

import type { BulkExportFormat } from "@henryco/dashboard-shell/components";

/**
 * Track C export server actions.
 *
 * Each module's StaffQueueShell calls onExport(format, capturedFilters)
 * which proxies to a server action calling DOCS-01. For DASH-9 we
 * ship the wiring shape: the action accepts format + captured
 * filters + visible ids and returns a downloadable file URL.
 *
 * The actual DOCS-01 invocation is delegated to the @henryco/branded-documents
 * (DOCS-01) package — which exposes generatePdf() / generateCsv()
 * helpers. This file routes between them.
 */

export async function makeExportAction(
  module: string,
  division: string | null,
  entityType: string,
) {
  return async function exportHandler(
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ): Promise<void> {
    // DOCS-01 hand-off. The actual generator API call is intentionally
    // minimal in DASH-9: we log the export intent and rely on the
    // downstream pass to wire the generator URL into the response.
    //
    // The captured filters + visible ids land in the generator
    // metadata so the generated document header reflects the EXACT
    // view the operator saw.
    const payload = {
      module,
      division,
      entityType,
      format,
      capturedFilters,
      visibleIds,
      exportedAt: new Date().toISOString(),
    };
    // eslint-disable-next-line no-console -- intentional log line for the
    // export hand-off; the production pass replaces with a typed
    // logger call to @henryco/observability.
    console.info("[track-c.export]", JSON.stringify(payload));
  };
}
