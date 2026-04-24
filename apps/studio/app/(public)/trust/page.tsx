import { ShieldCheck, Sparkles, Star, Waypoints } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";

export default async function TrustPage() {
  const catalog = await getStudioCatalog();
  const highlights = [
    { title: "Protected controls", body: "Sensitive actions stay behind secure access controls.", icon: ShieldCheck },
    { title: "Milestone visibility", body: "Payments and delivery checkpoints stay visible to the client.", icon: Waypoints },
    { title: "Structured proposals", body: "Every enquiry becomes a formal proposal with clear scope, pricing, and timelines.", icon: Sparkles },
    { title: "Premium quality", body: "Every surface is designed to feel considered, modern, and worthy of your investment.", icon: Star },
  ];

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.4rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="max-w-3xl">
          <div className="studio-kicker">Trust &amp; transparency</div>
          <h1 className="studio-heading mt-4 text-balance">
            Confidence at every stage. In writing, in the workspace, in the bank.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--studio-ink-soft)] sm:text-lg">
            Scope clarity, milestone visibility, secure file handling, payment checkpoints, and accountable communication &mdash; structured so you always know what is happening and what comes next.
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map((item) => (
          <article key={item.title} className="studio-panel rounded-[1.75rem] p-6">
            <item.icon className="h-6 w-6 text-[var(--studio-signal)]" />
            <h2 className="mt-4 text-xl font-semibold text-[var(--studio-ink)]">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Trust signals</div>
          <div className="mt-5 space-y-4">
            {catalog.trustSignals.map((signal) => (
              <div key={signal} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                <p className="text-sm leading-7 text-[var(--studio-ink-soft)]">{signal}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Client confidence</div>
          <div className="mt-5 space-y-4">
            {catalog.testimonials.map((testimonial) => (
              <div key={testimonial.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                <p className="text-sm leading-7 text-[var(--studio-ink)]">{testimonial.quote}</p>
                <div className="mt-3 text-sm text-[var(--studio-ink-soft)]">{testimonial.name}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-10 studio-panel rounded-[1.75rem] p-6">
        <div className="studio-kicker">Why clients choose HenryCo</div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {catalog.valueComparisons.map((comparison) => (
            <article key={comparison.title} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <div className="text-lg font-semibold text-[var(--studio-ink)]">{comparison.title}</div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                {comparison.points.map((point) => (
                  <div key={point}>• {point}</div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
