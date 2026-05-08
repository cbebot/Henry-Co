import type { StaffViewer } from "@henryco/auth/staff";
import type { BulkExportFormat } from "@henryco/dashboard-shell/components";

import { StaffCarePageClient } from "./page";
import { loadCareQueueSnapshot, type CareBookingRow, type CareSupabaseClient } from "./data";

/**
 * staff-care — server component.
 *
 * Hydrates the snapshot via the host-app supabase server client and
 * renders the client page with bulk-action + export server actions
 * threaded in.
 *
 * The host app injects:
 *   - supabase client (RLS-scoped to the calling viewer)
 *   - bulkActionHandler — server action invoked from the client
 *   - exportHandler — server action that calls DOCS-01
 */

export type StaffCarePageServerProps = {
  viewer: StaffViewer;
  supabase: CareSupabaseClient;
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
};

export async function StaffCarePageServer({
  supabase,
  bulkActionHandler,
  exportHandler,
}: StaffCarePageServerProps) {
  const snapshot = await loadCareQueueSnapshot(supabase);
  return (
    <StaffCarePageClient
      snapshot={snapshot}
      bulkActionHandler={bulkActionHandler}
      exportHandler={exportHandler}
      rowDeepLink={(row: CareBookingRow) => `/care/${row.id}`}
    />
  );
}
