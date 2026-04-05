import { ArrowRight, Layers3, Sparkles, Waypoints } from "lucide-react";
import { StudioRequestBuilder } from "@/components/studio/request-builder";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { resolveStudioRequestPreset } from "@/lib/studio/request-presets";

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; preset?: string }>;
}) {
  const params = await searchParams;
  const catalog = await getStudioCatalog();
  const presetHint = resolveStudioRequestPreset(params.preset, catalog.requestConfig);

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-8 sm:px-8 lg:px-10">
      <section className="studio-panel studio-hero studio-mesh rounded-[2.9rem] px-7 py-8 sm:px-10 sm:py-10">
        <div className="studio-kicker">Project brief</div>
        <h1 className="studio-display mt-5 max-w-5xl text-[var(--studio-ink)]">
          Tell us what you need—we turn it into a clear plan.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--studio-ink-soft)] sm:text-lg">
          Work through the steps at your own pace. Skip nothing you are unsure about—we will ask follow-up
          questions if needed. You can choose a package path or a fully custom route; both end with a proper
          summary and payment instructions, not a silent inbox.
        </p>
        <p className="mt-4 max-w-3xl rounded-2xl border border-[var(--studio-line)] bg-black/15 px-4 py-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
          <span className="font-semibold text-[var(--studio-ink)]">Stuck on a question?</span> Write “not sure”
          and move on. Honest answers help more than perfect ones.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {[
            {
              icon: Layers3,
              title: "Package or custom",
              body: "Packages suit familiar builds. Custom suits one-of-a-kind software, portals, and operations tools.",
            },
            {
              icon: Sparkles,
              title: "You stay in control",
              body: "Change your mind as you go—the form is a guide, not a test.",
            },
            {
              icon: Waypoints,
              title: "A record you can trust",
              body: "Your brief becomes the basis for scope and pricing—nothing disappears into a black hole.",
            },
            {
              icon: ArrowRight,
              title: "What happens next is spelled out",
              body: "Deposits, references, and uploads are explained before you pay—no surprises.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <item.icon className="h-5 w-5 text-[var(--studio-signal)]" />
              <div className="mt-4 text-lg font-semibold text-[var(--studio-ink)]">{item.title}</div>
              <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Published services", String(catalog.services.length)],
            ["Package lanes", String(catalog.packages.length)],
            [
              "Service categories",
              String(catalog.requestConfig.projectTypes.filter((item) => item.isActive !== false).length),
            ],
            [
              "Timeline lanes",
              String(catalog.requestConfig.timelineOptions.filter((item) => item.isActive !== false).length),
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">{label}</div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <StudioRequestBuilder
          services={catalog.services}
          packages={catalog.packages}
          teams={catalog.teams}
          requestConfig={catalog.requestConfig}
          preferredTeamId={params.team || null}
          presetHint={presetHint}
        />
      </section>
    </main>
  );
}
