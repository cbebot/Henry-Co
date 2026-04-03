import type { Metadata } from "next";
import { Building2, Home, Sparkles } from "lucide-react";
import BookingRailWorkspace from "@/components/dashboard/BookingRailWorkspace";
import {
  WorkspaceHero,
  WorkspaceInfoTile,
  WorkspacePanel,
  WorkspaceEmptyState,
} from "@/components/dashboard/WorkspacePrimitives";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { requireRoles } from "@/lib/auth/server";
import { getAdminBookings } from "@/lib/admin/care-admin";
import { isServiceBookingRecord } from "@/lib/care-booking-shared";
import { findSelectedBooking, groupBookingsForOperations } from "@/lib/dashboard-queues";
import {
  getServiceFamilyLabel,
  getTrackingStatusLabel,
  getTrackingStatusOptions,
  inferCareServiceFamily,
  isRecurringService,
  parseServiceBookingSummary,
} from "@/lib/care-tracking";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { updateServiceExecutionStatusAction } from "../../owner/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff Assignments | Henry & Co. Fabric Care",
  description: "Grouped live service assignments for home and office cleaning execution.",
};

type PageSearchParams = {
  q?: string | string[];
  booking?: string | string[];
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function suggestedStatuses(statuses: string[], current: string) {
  const index = Math.max(0, statuses.indexOf(current));
  return statuses.slice(index + 1, index + 3);
}

export default async function StaffAssignmentsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  await requireRoles(["owner", "manager", "staff"]);
  const params = (await searchParams) ?? {};
  const q = readParam(params.q).toLowerCase();
  const lookup = readParam(params.booking);

  await logProtectedPageAccess("/staff/assignments", {
    q: q || null,
    booking: lookup || null,
  });

  const bookings = await getAdminBookings({ scope: "active", limit: 500 });
  const activeQueue = bookings
    .filter((booking) => isServiceBookingRecord(booking))
    .filter(
      (booking) =>
        !["customer_confirmed", "inspection_completed", "service_completed", "supervisor_signoff", "cancelled"].includes(
          String(booking.status || "").toLowerCase()
        )
    )
    .filter((booking) =>
      q ? JSON.stringify(booking).toLowerCase().includes(q.toLowerCase()) : true
    );

  const groups = groupBookingsForOperations(activeQueue).filter((group) => group.bookings.length > 0);
  const selectedBooking = findSelectedBooking(activeQueue, lookup);
  const family = selectedBooking ? inferCareServiceFamily(selectedBooking) : null;
  const summary = selectedBooking ? parseServiceBookingSummary(selectedBooking.item_summary) : null;
  const options = selectedBooking && family ? getTrackingStatusOptions(family) : [];
  const quickStatuses =
    selectedBooking && family
      ? suggestedStatuses(options, String(selectedBooking.status || "").toLowerCase())
      : [];

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Assignments"
        title="Run active field work from a grouped queue."
        description="Home and office execution stays in one service-first workspace with grouped priorities, cleaner detail, and fast stage updates."
      />

      <BookingRailWorkspace
        groups={groups}
        selectedBooking={selectedBooking}
        buildBookingHref={(booking) =>
          `/staff/assignments?booking=${encodeURIComponent(booking.tracking_code)}${
            q ? `&q=${encodeURIComponent(q)}` : ""
          }`
        }
        emptyTitle="No active assignments matched this view"
        emptyText="Try a broader search or check history if the visit is already complete."
        detail={
          selectedBooking && family ? (
            <WorkspacePanel
              eyebrow="Selected assignment"
              title={selectedBooking.customer_name}
              subtitle="Keep the service stage honest, confirm the site details, and move the visit only when the work has actually advanced."
            >
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <WorkspaceInfoTile label="Tracking code" value={selectedBooking.tracking_code} />
                  <WorkspaceInfoTile label="Service family" value={getServiceFamilyLabel(family)} />
                  <WorkspaceInfoTile label="Current stage" value={getTrackingStatusLabel(selectedBooking.status, family)} />
                  <WorkspaceInfoTile label="Visit date" value={formatDate(selectedBooking.pickup_date)} />
                  <WorkspaceInfoTile label="Window" value={summary?.serviceWindow || selectedBooking.pickup_slot || "Not set"} />
                  <WorkspaceInfoTile label="Quoted total" value={`₦${Number(selectedBooking.quoted_total || 0).toLocaleString()}`} />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[1.5rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                      Service brief
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        summary?.categoryLabel,
                        summary?.serviceLabel,
                        summary?.zoneLabel,
                        summary?.urgencyLabel,
                        summary?.propertyLabel,
                        summary?.siteContactName,
                        ...(summary?.preferredDays ?? []).map((day) => `Day: ${day}`),
                        ...(summary?.addOnLabels ?? []),
                        ...(summary?.highlights ?? []),
                      ]
                        .filter(Boolean)
                        .map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
                          >
                            {item}
                          </span>
                        ))}
                      {summary && isRecurringService(summary) ? (
                        <span className="rounded-full border border-[color:var(--accent)]/25 bg-[color:var(--accent)]/10 px-3 py-2 text-xs font-semibold text-[color:var(--accent)]">
                          {summary.frequencyLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 text-sm leading-7 text-zinc-700 dark:text-white/68">
                      {selectedBooking.pickup_address}
                    </div>
                    {selectedBooking.special_instructions ? (
                      <div className="mt-4 rounded-[1.2rem] border border-black/10 bg-white/75 px-4 py-4 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/66">
                        {selectedBooking.special_instructions}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    {quickStatuses.length > 0 ? (
                      <div className="rounded-[1.5rem] border border-black/10 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                          Quick moves
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {quickStatuses.map((status) => (
                            <form key={status} action={updateServiceExecutionStatusAction}>
                              <input type="hidden" name="id" value={selectedBooking.id} />
                              <input type="hidden" name="status" value={status} />
                              <input type="hidden" name="source_route" value="/staff/assignments" />
                              <PendingSubmitButton
                                label={`Move to ${getTrackingStatusLabel(status, family)}`}
                                pendingLabel="Updating..."
                                variant="secondary"
                                icon={<Sparkles className="h-4 w-4" />}
                                className="rounded-2xl border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 px-4 py-3 text-[color:var(--accent)]"
                              />
                            </form>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <form action={updateServiceExecutionStatusAction} className="rounded-[1.5rem] border border-black/10 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                      <input type="hidden" name="id" value={selectedBooking.id} />
                      <input type="hidden" name="source_route" value="/staff/assignments" />

                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                        Stage control
                      </div>

                      <div className="mt-4 grid gap-3">
                        <select
                          name="status"
                          defaultValue={String(selectedBooking.status || "").toLowerCase()}
                          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                        >
                          {options.map((status) => (
                            <option key={status} value={status}>
                              {getTrackingStatusLabel(status, family)}
                            </option>
                          ))}
                        </select>

                        <PendingSubmitButton
                          label="Save stage"
                          pendingLabel="Saving..."
                          icon={family === "home" ? <Home className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                          className="rounded-2xl px-5 py-3 text-[#07111F]"
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </WorkspacePanel>
          ) : (
            <WorkspacePanel
              eyebrow="Selected assignment"
              title="Choose an active visit"
              subtitle="Select a booking from the queue to inspect the service brief and update the execution stage."
            >
              <WorkspaceEmptyState
                title="No assignment selected"
                text="Open a visit from the queue to review the property details and move the work forward."
              />
            </WorkspacePanel>
          )
        }
      />
    </div>
  );
}
