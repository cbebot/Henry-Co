import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";

export default async function ProcessPage() {
  const catalog = await getStudioCatalog();
  const primaryCta = catalog.platform.primaryCta || "Start a Studio project";

  return (
    <main id="henryco-main" tabIndex={-1} className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10">
      <section>
        <p className="studio-kicker">Process</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          From brief to launch, nothing stays hidden.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          Scope, pricing, milestones, payments, and delivery progress stay visible in one
          structured record from the first brief to final handoff.
        </p>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline gap-4">
          <p className="studio-kicker">Studio process</p>
          <span className="h-px flex-1 bg-[var(--studio-line)]" />
        </div>
        <ol className="mt-8 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
          {catalog.process.map((step, index) => (
            <li
              key={step}
              className="grid gap-5 py-6 md:grid-cols-[0.18fr,0.82fr] md:items-baseline"
            >
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Step {String(index + 1).padStart(2, "0")}
              </p>
              <p className="text-[1.15rem] font-semibold leading-snug tracking-tight text-[var(--studio-ink)] sm:text-[1.3rem]">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12">
        <Link
          href="/request"
          className="studio-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
        >
          {primaryCta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
