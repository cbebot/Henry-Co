import Link from "next/link";
import { ArrowRight, BadgeCheck, ClipboardList, GraduationCap } from "lucide-react";
import { CourseCard, LearnSectionIntro } from "@/components/learn/ui";
import { getPublicAcademyData } from "@/lib/learn/data";
import { getAccountLearnUrl } from "@/lib/learn/links";

export const metadata = { title: "Certificates - HenryCo Learn" };

export default async function CertificationsPage() {
  const academy = await getPublicAcademyData();
  const certifications = academy.courses.filter((course) => course.certification);

  const pillars = [
    {
      icon: GraduationCap,
      title: "Who it’s for",
      body: "Anyone who completes an eligible program — public learners, assigned staff, or partners — holds the same standard of proof.",
    },
    {
      icon: ClipboardList,
      title: "What “qualified” means",
      body: "Requirements are set per course (lessons + sometimes a passing assessment). Your learning room shows a simple checklist until everything is satisfied.",
    },
    {
      icon: BadgeCheck,
      title: "After you earn it",
      body: "Add it to your CV or profile, share the verification link, or keep it in your HenryCo account alongside the rest of your learning history.",
    },
  ] as const;

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--learn-mint-soft)]">
              Verified certificates
            </p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              Credentials you can show. Anyone can verify.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)]">
              Certificate-eligible courses carry a badge. Finish the required lessons, pass any
              assessments, and HenryCo Learn records the completion. You get a downloadable PDF
              plus a public verification code for employers, clients, and partners.
            </p>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              { label: "Format", value: "Downloadable PDF + public link" },
              { label: "Verification", value: "Code-checkable, no account needed" },
              { label: "Storage", value: "Saved on your HenryCo account" },
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
          How a credential works
        </p>
        <ul className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--learn-line)]">
          {pillars.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                <Icon className="h-5 w-5 text-[var(--learn-copper)]" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-[var(--learn-ink)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-16 border-t border-[var(--learn-line)] pt-10">
        <div className="grid gap-6 lg:grid-cols-[1fr,0.9fr] lg:items-end">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
              Verify someone’s certificate
            </p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.85rem]">
              Enter the code, see whether the record matches.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--learn-ink-soft)]">
              Enter the code printed on their credential. You’ll see whether HenryCo Learn has a
              matching, active record &mdash; no account required to check.
            </p>
          </div>
          <form
            action="/certifications/verify"
            method="get"
            className="grid gap-3 sm:grid-cols-[1fr,auto]"
          >
            <input
              name="code"
              required
              placeholder="Verification code"
              className="learn-input rounded-2xl px-4 py-3"
            />
            <button
              type="submit"
              className="learn-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              Verify
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      <section className="mt-16">
        <LearnSectionIntro
          kicker="Certificate programs"
          title="Courses that currently award a HenryCo certificate"
          body="Open any program for the full syllabus, quiz details, and enrollment options."
        />

        {certifications.length === 0 ? (
          <p className="mt-8 max-w-2xl border-l-2 border-[var(--learn-mint-soft)]/55 pl-5 text-sm leading-7 text-[var(--learn-ink-soft)]">
            No certificate-track courses are published in the catalog yet. Browse all programs on
            the{" "}
            <Link
              href="/courses"
              className="font-semibold text-[var(--learn-mint-soft)] underline-offset-2 hover:underline"
            >
              course catalog
            </Link>{" "}
            &mdash; we’ll label new credentials clearly as they go live.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {certifications.map((course) => (
              <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 flex flex-wrap gap-3 border-t border-[var(--learn-line)] pt-8">
        <a
          href={getAccountLearnUrl("certificates")}
          className="learn-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          My certificates in account
        </a>
        <Link
          href="/trust"
          className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
        >
          How verification works
        </Link>
      </section>
    </main>
  );
}
