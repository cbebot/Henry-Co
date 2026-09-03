import Link from "next/link";
import type { HubHomeCopy, HubPublicCopy } from "@henryco/i18n";
import ContactHeroForm from "./ContactHeroForm";

/**
 * ContactHeroLayout — places the contact form above the fold (CHROME-01B FIX 3):
 * the page leads with contact, not navigation. V3-PUBLIC-DESIGN-01 moved it onto the
 * theme-aware `--home-*` public design system + the editorial serif heading.
 */
export default function ContactHeroLayout({
  supportEmail,
  responseTime,
  initialReason,
  planContext,
  copy,
  formCopy,
}: {
  supportEmail: string;
  responseTime?: string;
  initialReason?: string;
  planContext?: string | null;
  copy: HubPublicCopy["contactHero"];
  formCopy: HubHomeCopy["contactHeroForm"];
}) {
  return (
    <section className="relative">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-12 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-20">
        <div className="order-2 lg:order-1">
          <p className="home-eyebrow text-[color:var(--home-accent-text)]">{copy.eyebrow}</p>
          <h1 className="home-display mt-3 max-w-2xl">{copy.title}</h1>
          <p className="home-lede mt-4 max-w-xl">{copy.body}</p>

          <ul className="mt-8 space-y-3 text-sm leading-7 text-[color:var(--home-ink-65)]">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--home-accent)]" />
              <span>{copy.bulletPartnerships}</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--home-accent)]" />
              <span>{copy.bulletPress}</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--home-accent)]" />
              <span>{copy.bulletSupplier}</span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#divisions"
              className="home-focus inline-flex items-center gap-2 rounded-full border border-[color:var(--home-line-12)] bg-transparent px-4 py-2 text-[13px] font-medium text-[color:var(--home-ink-65)] transition hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-04)] hover:text-[color:var(--home-ink)]"
            >
              {copy.ctaDivisions}
            </Link>
            <Link
              href="/about"
              className="home-focus inline-flex items-center gap-2 rounded-full border border-[color:var(--home-line-12)] bg-transparent px-4 py-2 text-[13px] font-medium text-[color:var(--home-ink-65)] transition hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-04)] hover:text-[color:var(--home-ink)]"
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
            copy={formCopy}
          />
        </div>
      </div>
    </section>
  );
}
