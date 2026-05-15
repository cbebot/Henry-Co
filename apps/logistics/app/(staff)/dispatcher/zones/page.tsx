import { Panel, EmptyState } from "@henryco/dashboard-shell/components";
import { getDispatchDashboardData } from "@/lib/logistics/data";

export const dynamic = "force-dynamic";

export default async function DispatcherZonesPage() {
  const data = await getDispatchDashboardData();
  const zones = data.zones;

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          Zones
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Corridor configuration
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          The lanes your fleet is licensed to operate. Edit base fee, SLA, and
          urgency multipliers per zone.
        </p>
      </header>

      <Panel tone="flat">
        {zones.length === 0 ? (
          <EmptyState
            kicker="No zones"
            headline="Configure your first zone"
            body="Zones describe a corridor (Enugu metro, Lagos mainland, etc) and feed rate cards + SLA."
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {zones.map((zone) => (
              <li key={zone.id} className="py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold tracking-tight text-white">
                      {zone.name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--logistics-muted)]">
                      {zone.city}, {zone.region} · {zone.summary}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                      Base fee
                    </p>
                    <p className="mt-1 font-semibold tracking-tight text-white">
                      {zone.baseFee} NGN
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--logistics-muted)]">
                      ETA {zone.etaHoursMin}–{zone.etaHoursMax}h
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
