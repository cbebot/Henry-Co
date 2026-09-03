import { Panel, EmptyState } from "@henryco/dashboard-shell/components";
import { translateSurfaceLabel } from "@henryco/i18n";
import { createAdminSupabase } from "@/lib/supabase";
import { getLogisticsPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

type AssignmentRow = {
  id: string;
  rider_id: string;
  vehicle_id: string | null;
  shift_starts_at: string;
  shift_ends_at: string;
  status: string;
};

async function getAssignments() {
  try {
    const admin = createAdminSupabase();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 14);
    const { data, error } = await admin
      .from("logistics_rider_assignments")
      .select("id, rider_id, vehicle_id, shift_starts_at, shift_ends_at, status")
      .gte("shift_starts_at", new Date().toISOString())
      .lte("shift_starts_at", horizon.toISOString())
      .order("shift_starts_at");
    if (error) {
      console.error("[owner-calendar] fetch failed", error);
      return [] as AssignmentRow[];
    }
    return (data ?? []) as AssignmentRow[];
  } catch (err) {
    console.error("[owner-calendar] fetch threw", err);
    return [] as AssignmentRow[];
  }
}

export default async function OwnerCalendarPage() {
  const locale = await getLogisticsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const assignments = await getAssignments();

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          {t("Calendar")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {t("Shifts ahead (14 days)")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          {t("Forward-looking shift schedule. Edit cadence from the manager workspace — this is the strategic view.")}
        </p>
      </header>

      <Panel tone="flat">
        {assignments.length === 0 ? (
          <EmptyState
            kicker={t("No shifts scheduled")}
            headline={t("Calendar is empty")}
            body={t("Schedule rider shifts in the manager workspace to surface them on this 14-day horizon.")}
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {assignments.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-semibold tracking-tight text-white">
                    {t("Rider")} {row.rider_id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-[var(--logistics-muted)]">
                    {new Date(row.shift_starts_at).toLocaleString(locale)} →{" "}
                    {new Date(row.shift_ends_at).toLocaleTimeString(locale)}
                  </p>
                </div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/70">
                  {t(row.status.replaceAll("_", " "))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
