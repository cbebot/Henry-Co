import Link from "next/link";
import type { HubPublicCopy } from "@henryco/i18n";
import ContactHeroForm from "./ContactHeroForm";

/**
 * ContactHeroLayout — places the contact form above the fold (CHROME-01B
 * FIX 3). The "Explore divisions / About the company" buttons are demoted
 * to a small secondary rail beneath the form so the contact page actually
 * leads with contact, not navigation.
 */
export default function ContactHeroLayout({
  supportEmail,
  responseTime,
  initialReason,
  planContext,
  copy,
}: {
  supportEmail: string;
  responseTime?: string;
  initialReason?: string;
  planContext?: string | null;
  copy: HubPublicCopy["contactHero"];
}) {
  return (
    <section className="relative">
      <div className="mx-auto grid max-w-[88rem] gap-10 px-5 pb-12 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pt-20">
        <div className="order-2 lg:order-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[#d6a851]">
            {copy.eyebrow}
          </p>
          <h1
            style={{
              fontSize: "clamp(1.7rem, 2.4vw + 0.8rem, 2.4rem)",
              lineHeight: 1.16,
              letterSpacing: "-0.014em",
            }}
            className="mt-3 max-w-2xl text-balance font-semibold text-white"
          >
            {copy.title}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-[15px] leading-[1.7] text-white/70">
            {copy.body}
          </p>

          <ul className="mt-8 space-y-3 text-sm leading-7 text-white/72">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d6a851]" />
              <span>{copy.bulletPartnerships}</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d6a851]" />
              <span>{copy.bulletPress}</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d6a851]" />
              <span>{copy.bulletSupplier}</span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#divisions"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-transparent px-4 py-2 text-[13px] font-medium text-white/72 transition hover:border-white/30 hover:bg-white/[0.04] hover:text-white"
            >
              {copy.ctaDivisions}
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-transparent px-4 py-2 text-[13px] font-medium text-white/72 transition hover:border-white/30 hover:bg-white/[0.04] hover:text-white"
            >
              {copy.ctaAbout}
            </Link>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <ContactHeroForm
            supportEmail={supportEmail}
            responseTime={responseTime}
            initialReason={initialReason}
            planContext={planContext ?? null}
          />
        </div>
      </div>
    </section>
  );
}
