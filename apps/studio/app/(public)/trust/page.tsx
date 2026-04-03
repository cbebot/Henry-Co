import { ShieldCheck, Sparkles, Star, Waypoints } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";

export default async function TrustPage() {
  const catalog = await getStudioCatalog();
  const highlights = [
    { title: "Server-side controls", body: "Privileged operations remain on the server side.", icon: ShieldCheck },
    { title: "Milestone visibility", body: "Payments and delivery checkpoints stay visible to the client.", icon: Waypoints },
    { title: "Proposal-first process", body: "Leads become real proposal objects, not dead-end forms.", icon: Sparkles },
    { title: "Premium finish", body: "The product surface feels considered, modern, and high-trust.", icon: Star },
  ];

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.4rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="studio-kicker">Trust layer</div>
        <h1 className="studio-heading mt-4">Designed to remove uncertainty from premium digital delivery.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--studio-ink-soft)]">
          HenryCo Studio is structured around scope clarity, milestone visibility, secure file handling,
          payment checkpoints, and accountable communication so clients always know what is happening.
        </p>
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
        <div className="studio-kicker">Why buyers switch</div>
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
