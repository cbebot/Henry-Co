import type { HomepageFaqItem } from "../lib/homepage-faqs";
import { ChevronRight } from "lucide-react";

export default function HomepageFaqBlock({
  heading,
  description,
  items,
}: {
  heading: string;
  description: string;
  items: HomepageFaqItem[];
}) {
  if (!items.length) return null;

  return (
    <section id="faq" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-[36px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/58">
            Frequently asked
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl text-white">
            {heading}
          </h2>

          <p className="mt-3 text-sm leading-7 text-white/64">{description}</p>
        </div>

        <div className="mt-8 grid gap-3">
          {items.map((item) => (
            <details
              key={item.id}
              className="group rounded-[26px] border border-white/10 bg-black/20 p-5 open:bg-white/[0.06]"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">
                    {item.question}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/60 transition duration-200 group-open:rotate-90" />
                </div>
              </summary>
              <div className="mt-3 text-sm leading-7 text-white/64">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}