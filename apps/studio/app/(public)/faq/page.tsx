import { getStudioCatalog } from "@/lib/studio/catalog";

export default async function FaqPage() {
  const catalog = await getStudioCatalog();

  return (
    <main className="mx-auto max-w-[72rem] px-5 py-10 sm:px-8">
      <section className="studio-panel studio-mesh rounded-[2.4rem] px-7 py-10 sm:px-10">
        <div className="max-w-3xl">
          <div className="studio-kicker">FAQ</div>
          <h1 className="studio-heading mt-4 text-balance">Before you reach out.</h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--studio-ink-soft)] sm:text-lg">
            The essentials clients usually check before starting a project with Studio.
          </p>
        </div>
      </section>

      <div className="mt-10 space-y-4">
        {catalog.faqs.map((item) => (
          <section key={item.id} className="studio-panel rounded-[2rem] p-6">
            <h2 className="text-xl font-semibold text-[var(--studio-ink)]">{item.question}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.answer}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
