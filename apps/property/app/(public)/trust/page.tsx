import { Building2, CalendarRange, ShieldCheck, Sparkles } from "lucide-react";
import {
  PropertyDifferentiatorCard,
  PropertySectionIntro,
  PropertyTrustPill,
} from "@/components/property/ui";
import { getPropertySnapshot } from "@/lib/property/data";

export const dynamic = "force-dynamic";

export default async function TrustPage() {
  const snapshot = await getPropertySnapshot();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker="Trust"
        title="Trust architecture built into listing quality, viewing coordination, and managed-property follow-through."
        description="HenryCo Property is structured to reduce the usual real-estate friction: weak listing copy, low-information tours, vague follow-up, and poor owner visibility."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PropertyTrustPill
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Verification notes"
          body="Listings surface verification and readiness context before a prospect commits attention."
        />
        <PropertyTrustPill
          icon={<CalendarRange className="h-5 w-5" />}
          title="Scheduled viewing flow"
          body="Viewing requests, reminders, and confirmations are persisted instead of living in ad hoc chat threads."
        />
        <PropertyTrustPill
          icon={<Building2 className="h-5 w-5" />}
          title="Managed-property continuity"
          body="The operating layer can stay involved after the listing, lease, or occupancy event."
        />
        <PropertyTrustPill
          icon={<Sparkles className="h-5 w-5" />}
          title="Editorial moderation"
          body="Weak media and weak copy do not pass straight through to the public surface."
        />
      </div>

      <section className="mt-10">
        <div className="grid gap-5 xl:grid-cols-2">
          {snapshot.differentiators.map((item) => (
            <PropertyDifferentiatorCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
