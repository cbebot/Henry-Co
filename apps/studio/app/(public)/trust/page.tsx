import { ShieldCheck, Sparkles, Star, Waypoints } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";

export default async function TrustPage() {
  const catalog = await getStudioCatalog();
  const highlights = [
    {
      title: "Protected controls",
      body: "Sensitive actions stay behind secure access controls.",
      icon: ShieldCheck,
    },
    {
      title: "Milestone visibility",
      body: "Payments and delivery checkpoints stay visible to the client.",
      icon: Waypoints,
    },
    {
      title: "Structured proposals",
      body: "Every enquiry becomes a formal proposal with clear scope, pricing, and timelines.",
      icon: Sparkles,
    },
    {
      title: "Premium quality",
      body: "Every surface is designed to feel considered, modern, and worthy of your investment.",
      icon: Star,
    },
  ];

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10">
      <section>
        <p className="studio-kicker">Trust &amp; transparency</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          Confidence at every stage. In writing, in the workspace, in the bank.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          Scope clarity, milestone visibility, secure file handling, payment checkpoints, and
          accountable communication &mdash; structured so you always know what is happening and
          what comes next.
        </p>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline gap-4">
          <p className="studio-kicker">Four operating principles</p>
          <span className="h-px flex-1 bg-[var(--studio-line)]" />
        </div>
        <ul className="mt-7 grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-[var(--studio-line)]">
          {highlights.map((item, i) => (
            <li key={item.title} className={i > 0 ? "lg:pl-6" : ""}>
              <item.icon className="h-5 w-5 text-[var(--studio-signal)]" aria-hidden />
              <h2 className="mt-4 text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--studio-ink)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="studio-kicker">Trust signals</p>
          <h2 className="mt-4 max-w-md text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.85rem]">
            What stays visible from brief to bank.
          </h2>
          <ul className="mt-7 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
            {catalog.trustSignals.map((signal) => (
              <li
                key={signal}
                className="py-3 text-sm leading-7 text-[var(--studio-ink-soft)]"
              >
                {signal}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="studio-kicker">Client confidence</p>
          <h2 className="mt-4 max-w-md text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.85rem]">
            What clients actually say.
          </h2>
          <ul className="mt-7 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
            {catalog.testimonials.map((testimonial) => (
              <li key={testimonial.id} className="py-5">
                <p className="text-sm leading-7 text-[var(--studio-ink)]">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <p className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
                  {testimonial.name}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline gap-4">
          <p className="studio-kicker">Why clients choose HenryCo</p>
          <span className="h-px flex-1 bg-[var(--studio-line)]" />
        </div>
        <ol className="mt-6 grid gap-8 md:grid-cols-2 md:divide-x md:divide-[var(--studio-line)]">
          {catalog.valueComparisons.map((comparison, i) => (
            <li key={comparison.title} className={i > 0 ? "md:pl-8" : ""}>
              <h3 className="text-[1.15rem] font-semibold tracking-tight text-[var(--studio-ink)]">
                {comparison.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {comparison.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-2.5 text-sm leading-relaxed text-[var(--studio-ink-soft)]"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--studio-signal)]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
