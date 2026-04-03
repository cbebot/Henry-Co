import { ArrowRight, Layers3, Sparkles, Waypoints } from "lucide-react";
import { StudioRequestBuilder } from "@/components/studio/request-builder";
import { getStudioCatalog } from "@/lib/studio/catalog";

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const params = await searchParams;
  const catalog = await getStudioCatalog();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-8 sm:px-8 lg:px-10">
      <section className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <div className="space-y-6">
          <div className="studio-panel studio-hero studio-mesh rounded-[2.9rem] px-7 py-8 sm:px-10 sm:py-10">
            <div className="studio-kicker">Studio brief builder</div>
            <h1 className="studio-display mt-5 max-w-4xl text-[var(--studio-ink)]">
              Scope the work like a real delivery program, not a contact form.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--studio-ink-soft)] sm:text-lg">
              Use the package lane when the work already fits a premium delivery pattern. Use the custom
              path when you need a specific website, app, client portal, internal system, or bespoke
              software platform scoped on its actual commercial and operational requirements.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <Layers3 className="h-5 w-5 text-[var(--studio-signal)]" />
                <div className="mt-4 text-lg font-semibold text-[var(--studio-ink)]">
                  Package-led buying
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  For executive websites, commerce lanes, dashboards, and other repeatable premium work with faster commercial clarity.
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <Sparkles className="h-5 w-5 text-[var(--studio-signal)]" />
                <div className="mt-4 text-lg font-semibold text-[var(--studio-ink)]">
                  First-class custom path
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  For tailored digital products and systems where workflow, architecture, and operating context matter.
                </p>
              </div>
            </div>
          </div>

          <div className="studio-panel rounded-[2.4rem] p-6 sm:p-8">
            <div className="studio-kicker">What this brief is designed to produce</div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: Waypoints,
                  title: "Commercially useful intake",
                  body: "Business type, investment band, urgency, platform direction, features, and delivery context are captured in one record.",
                },
                {
                  icon: ArrowRight,
                  title: "Proposal-ready next move",
                  body: "The brief is meant to become a proposal and project surface, not a dead-end inquiry waiting for manual interpretation.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <item.icon className="h-5 w-5 text-[var(--studio-signal)]" />
                  <div className="mt-4 text-lg font-semibold text-[var(--studio-ink)]">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["Published services", String(catalog.services.length)],
                ["Package lanes", String(catalog.packages.length)],
                ["Specialist teams", String(catalog.teams.length)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">{label}</div>
                  <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <StudioRequestBuilder
          services={catalog.services}
          packages={catalog.packages}
          teams={catalog.teams}
          preferredTeamId={params.team || null}
        />
      </section>
    </main>
  );
}
