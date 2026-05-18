import { Panel, EmptyState } from "@henryco/dashboard-shell/components";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import { createAdminSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type FleetRider = {
  id: string;
  display_name: string;
  status: string;
  active: boolean;
  primary_zone_id: string | null;
  phone: string | null;
};

type FleetVehicle = {
  id: string;
  license_plate: string;
  vehicle_type: string;
  status: string;
  capacity_kg: number;
  active: boolean;
};

async function getFleetData() {
  try {
    const admin = createAdminSupabase();
    const [{ data: riders }, { data: vehicles }] = await Promise.all([
      admin
        .from("logistics_fleet_riders")
        .select("id, display_name, status, active, primary_zone_id, phone")
        .order("display_name", { ascending: true }),
      admin
        .from("logistics_fleet_vehicles")
        .select("id, license_plate, vehicle_type, status, capacity_kg, active")
        .order("license_plate", { ascending: true }),
    ]);
    return {
      riders: (riders ?? []) as FleetRider[],
      vehicles: (vehicles ?? []) as FleetVehicle[],
    };
  } catch (err) {
    console.error("[dispatcher-fleet] fetch failed", err);
    return { riders: [] as FleetRider[], vehicles: [] as FleetVehicle[] };
  }
}

export default async function DispatcherFleetPage() {
  const locale = await getLogisticsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const { riders, vehicles } = await getFleetData();

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          {t("Fleet")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {t("Vehicles and riders on shift")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          {t("Live fleet capacity. Editing shifts and rotation lives on the manager surface.")}
        </p>
      </header>

      <Panel tone="flat">
        <header className="border-b border-[var(--logistics-line)] pb-3">
          <h2 className="text-base font-semibold tracking-tight text-white">
            {t("Riders")}
          </h2>
        </header>
        {riders.length === 0 ? (
          <EmptyState
            kicker={t("No riders")}
            headline={t("Roster is empty")}
            body={t("Add riders from the manager workspace to surface them here.")}
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {riders.map((rider) => (
              <li key={rider.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold tracking-tight text-white">
                    {rider.display_name}
                  </p>
                  <p className="text-xs text-[var(--logistics-muted)]">
                    {rider.phone ?? t("Phone TBD")} ·{" "}
                    {rider.active ? t("active") : t("off")}
                  </p>
                </div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/70">
                  {rider.status.replaceAll("_", " ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel tone="flat">
        <header className="border-b border-[var(--logistics-line)] pb-3">
          <h2 className="text-base font-semibold tracking-tight text-white">
            {t("Vehicles")}
          </h2>
        </header>
        {vehicles.length === 0 ? (
          <EmptyState
            kicker={t("No vehicles")}
            headline={t("Fleet inventory empty")}
            body={t("Register vehicles from the manager workspace to track them here.")}
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {vehicles.map((vehicle) => (
              <li
                key={vehicle.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-mono text-sm font-semibold tracking-tight text-white">
                    {vehicle.license_plate}
                  </p>
                  <p className="text-xs text-[var(--logistics-muted)]">
                    {vehicle.vehicle_type} ·{" "}
                    {vehicle.capacity_kg ? `${vehicle.capacity_kg} kg` : t("capacity TBD")}
                  </p>
                </div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/70">
                  {vehicle.status.replaceAll("_", " ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
