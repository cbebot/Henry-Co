import { PropertySectionIntro } from "@/components/property/ui";
import { getPropertySnapshot } from "@/lib/property/data";

export const dynamic = "force-dynamic";

export default async function PropertyFaqPage() {
  const snapshot = await getPropertySnapshot();

  return (
    <main className="mx-auto max-w-[80rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker="FAQ"
        title="Before you reach out."
        description="The essentials renters, buyers, owners, and managed-property clients usually check before a viewing or submission."
      />

      <div className="mt-8 space-y-4">
        {snapshot.faqs.map((faq) => (
          <details key={faq.id} className="property-paper rounded-[1.8rem] p-5">
            <summary className="cursor-pointer list-none text-lg font-semibold text-[var(--property-ink)]">
              {faq.question}
            </summary>
            <p className="mt-4 text-sm leading-7 text-[var(--property-ink-soft)]">{faq.answer}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
