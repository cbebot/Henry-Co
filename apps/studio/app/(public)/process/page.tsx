import Link from "next/link";
import { getStudioCatalog } from "@/lib/studio/catalog";

export default async function ProcessPage() {
  const catalog = await getStudioCatalog();
  const primaryCta = catalog.platform.primaryCta || "Start a Studio project";

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.4rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="max-w-4xl">
          <div className="studio-kicker">Process</div>
          <h1 className="studio-heading mt-4">
            A clear process designed to keep you informed at every stage.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[var(--studio-ink-soft)]">
            From your first brief to final delivery — scope, pricing, payments, and progress
            stay visible and structured throughout.
          </p>
        </div>
      </section>

      <div className="mt-10 space-y-5">
        {catalog.process.map((step, index) => (
          <section key={step} className="studio-panel rounded-[2rem] p-6">
            <div className="studio-kicker">Step {index + 1}</div>
            <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
              {step}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <Link href="/request" className="studio-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold">
          {primaryCta}
        </Link>
      </div>
    </main>
  );
}
