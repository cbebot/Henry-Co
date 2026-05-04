import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ScrollText, ShieldCheck } from "lucide-react";
import { studioPolicyIndex } from "@/lib/studio/policies";

export const metadata: Metadata = {
  title: "Policies & governance | HenryCo Studio",
  description:
    "The agreements that govern every HenryCo Studio engagement — terms, privacy, refunds, intellectual property, security, delivery SLA, and acceptable use.",
  alternates: { canonical: "/policies" },
  robots: { index: true, follow: true },
};

export default function StudioPoliciesPage() {
  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="mx-auto max-w-[80rem] px-5 pb-24 pt-10 sm:px-8 lg:px-10"
    >
      <header className="max-w-3xl">
        <p className="studio-kicker">Governance</p>
        <h1 className="mt-4 text-balance text-[2.1rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.6rem] md:text-[3rem]">
          Real agreements. In writing. Before any money moves.
        </h1>
        <p className="mt-5 text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          These are the agreements every HenryCo Studio engagement runs against. They are not
          stock templates. They are written against how the platform actually operates — bank
          transfer in naira, milestone discipline in the portal, NDPA-aligned data handling, and
          IP transfer on verified final payment. Read them once and they will hold up across
          every project.
        </p>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[12px] font-semibold text-[var(--studio-ink-soft)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--studio-signal)]" />
          Last reviewed {studioPolicyIndex[0].lastUpdated} · Governed by Nigerian law
        </div>
      </header>

      <ul className="mt-12 grid gap-3 sm:grid-cols-2">
        {studioPolicyIndex.map((policy) => (
          <li key={policy.slug}>
            <Link
              href={`/policies/${policy.slug}`}
              className="group flex h-full flex-col rounded-[1.4rem] border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] p-5 transition hover:-translate-y-0.5 hover:border-[rgba(151,244,243,0.45)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--studio-line-strong)] bg-[rgba(151,244,243,0.06)] text-[var(--studio-signal)]">
                  <ScrollText className="h-4 w-4" />
                </span>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                  {policy.shortTitle}
                </span>
              </div>
              <h2 className="mt-4 text-[1.05rem] font-semibold tracking-[-0.005em] text-[var(--studio-ink)]">
                {policy.title}
              </h2>
              <p className="mt-2 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
                {policy.description}
              </p>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[12px] font-semibold text-[var(--studio-signal)]">
                Read in full
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-16 grid gap-8 rounded-[1.6rem] border border-[var(--studio-line)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-8 md:grid-cols-3">
        <div>
          <p className="studio-kicker">Engagement</p>
          <h3 className="mt-2 text-[1.1rem] font-semibold tracking-[-0.005em] text-[var(--studio-ink)]">
            Terms run from the moment you reserve.
          </h3>
          <p className="mt-2 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
            Reserving a template, accepting a proposal, or paying a deposit is acceptance of the
            current Terms. The version you accepted is logged in your Client portal.
          </p>
        </div>
        <div>
          <p className="studio-kicker">Privacy</p>
          <h3 className="mt-2 text-[1.1rem] font-semibold tracking-[-0.005em] text-[var(--studio-ink)]">
            Built to NDPA — minimum data, controlled access.
          </h3>
          <p className="mt-2 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
            We collect what we need to deliver the engagement, store it under row-level security,
            and respect every NDPA right — access, correction, erasure, portability.
          </p>
        </div>
        <div>
          <p className="studio-kicker">Money</p>
          <h3 className="mt-2 text-[1.1rem] font-semibold tracking-[-0.005em] text-[var(--studio-ink)]">
            Bank transfer to the verified company account.
          </h3>
          <p className="mt-2 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
            Always to <strong>{`Henry & Co. Group Ltd.`}</strong> If anyone, internal or external,
            asks you to pay anywhere else, treat it as fraud and contact finance.
          </p>
        </div>
      </section>
    </main>
  );
}
