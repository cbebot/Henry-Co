import { ChevronRight } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";

export default async function FaqPage() {
  const catalog = await getStudioCatalog();

  return (
    <main className="mx-auto max-w-[72rem] px-5 py-12 sm:px-8">
      <section>
        <p className="studio-kicker">FAQ</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          Before you reach out.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          The essentials clients usually check before starting a project with Studio.
        </p>
      </section>

      <ul className="mt-12 border-t border-[var(--studio-line)]">
        {catalog.faqs.map((item) => (
          <li
            key={item.id}
            className="border-b border-[var(--studio-line)] py-5"
          >
            <details className="group">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <h2 className="text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--studio-ink)] sm:text-[1.15rem]">
                  {item.question}
                </h2>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--studio-ink-soft)] transition group-open:rotate-90 group-open:text-[var(--studio-signal)]" />
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
                {item.answer}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </main>
  );
}
