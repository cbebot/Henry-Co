import { Panel, EmptyState } from "@henryco/dashboard-shell/components";
import { createAdminSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type FleetRider = {
  id: string;
  display_name: string;
  status: string;
  active: boolean;
  trust_score: number | null;
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

async function getFleet() {
  try {
    const admin = createAdminSupabase();
    const [{ data: riders }, { data: vehicles }] = await Promise.all([
      admin
        .from("logistics_fleet_riders")
        .select("id, display_name, status, active, trust_score, phone")
        .order("display_name"),
      admin
        .from("logistics_fleet_vehicles")
        .select("id, license_plate, vehicle_type, status, capacity_kg, active")
        .order("license_plate"),
    ]);
    return {
      riders: (riders ?? []) as FleetRider[],
      vehicles: (vehicles ?? []) as FleetVehicle[],
    };
  } catch (err) {
    console.error("[manager-fleet] fetch failed", err);
    return { riders: [], vehicles: [] };
  }
}

export default async function ManagerFleetPage() {
  const { riders, vehicles } = await getFleet();

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          Fleet
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Vehicles + riders directory
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          Manage the operating fleet. Onboarding flows for new riders live in
          the owner workspace; this is the operational view.
        </p>
      </header>

      <Panel tone="flat">
        <header className="border-b border-[var(--logistics-line)] pb-3">
          <h2 className="text-base font-semibold tracking-tight text-white">
            Riders
          </h2>
        </header>
        {riders.length === 0 ? (
          <EmptyState
            kicker="No riders"
            headline="Roster empty"
            body="Add riders to assemble your fleet — without riders the dispatcher has nobody to assign."
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {riders.map((rider) => (
              <li
                key={rider.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-semibold tracking-tight text-white">
                    {rider.display_name}
                  </p>
                  <p className="text-xs text-[var(--logistics-muted)]">
                    {rider.phone ?? "Phone TBD"} ·{" "}
                    {rider.active ? "active" : "off"} · trust{" "}
                    {rider.trust_score ?? "—"}
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
            Vehicles
          </h2>
        </header>
        {vehicles.length === 0 ? (
          <EmptyState
            kicker="No vehicles"
            headline="Fleet inventory empty"
            body="Register vehicles to enable dispatch + assignment."
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
                    {vehicle.capacity_kg ? `${vehicle.capacity_kg} kg` : "capacity TBD"}
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
