import Link from "next/link";
import { ArrowRight, BadgeCheck, KeySquare, ShieldCheck } from "lucide-react";

export const metadata = { title: "Trust - HenryCo Learn" };

export default function TrustPage() {
  const pillars = [
    {
      icon: ShieldCheck,
      title: "Enrollment & access",
      body: "Starting a course, paying where required, and unlocking lessons happen through secure workflows. You can’t “fake” completion from the client side.",
    },
    {
      icon: KeySquare,
      title: "Internal & assigned training",
      body: "Some programs are visible only to invited staff or partners. Those rules are enforced the same way as the rest of the academy — not by hoping people stay on the right URL.",
    },
    {
      icon: BadgeCheck,
      title: "Certificates & verification",
      body: "When you earn a credential, we issue a record you can download and a code third parties can check. That’s the difference between decoration and proof.",
    },
  ] as const;

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--learn-mint-soft)]">
              Trust &amp; safety
            </p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              Learning records you can rely on.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)]">
              Enrollments, progress, quizzes, and certificates are handled on the server &mdash;
              not hidden in a browser. Internal courses stay restricted to the right people;
              certificates carry a verification code anyone can check.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="learn-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Browse the catalog
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/certifications/verify"
                className="learn-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Verify a certificate
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              { label: "Records", value: "Server-side, not browser-side" },
              { label: "Access control", value: "Public · staff · partners" },
              { label: "Credentials", value: "Downloadable + publicly verifiable" },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-baseline gap-3 border-b border-[var(--learn-line)] py-3 last:border-b-0"
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                  {item.label}
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-16">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
          Three operating standards
        </p>
        <ul className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--learn-line)]">
          {pillars.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                <Icon className="h-5 w-5 text-[var(--learn-copper)]" aria-hidden />
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-[var(--learn-ink)]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-16 border-t border-[var(--learn-line)] pt-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
              Where to next
            </p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.85rem]">
              Verify a credential, or start a program built to be checkable.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--learn-ink-soft)]">
              Anyone can verify a HenryCo certificate from its code &mdash; no account required.
              Learners get the same standard of proof whether the program is public, assigned, or
              partner-only.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/certifications/verify"
              className="learn-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Verify a certificate
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/certifications"
              className="learn-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Certificate programs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
