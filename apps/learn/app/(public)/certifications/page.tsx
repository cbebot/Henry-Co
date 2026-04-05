import Link from "next/link";
import { CourseCard, LearnPanel, LearnSectionIntro } from "@/components/learn/ui";
import { getPublicAcademyData } from "@/lib/learn/data";
import { getAccountLearnUrl } from "@/lib/learn/links";

export const metadata = { title: "Certificates - HenryCo Learn" };

export default async function CertificationsPage() {
  const academy = await getPublicAcademyData();
  const certifications = academy.courses.filter((course) => course.certification);

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro
        kicker="Verified certificates"
        title="Earn credentials you can show—and others can confirm."
        body="Not every course issues a certificate. When you see the certificate badge on a program, it means: finish the required lessons, meet any quiz rules, and we record completion in HenryCo Learn. You’ll get a PDF you can download plus a verification code for employers, clients, or partners."
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-lg font-semibold text-[var(--learn-ink)]">Who it’s for</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
            Anyone who completes an eligible program—public learners, assigned staff, or partners—can hold the same standard of proof.
          </p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-lg font-semibold text-[var(--learn-ink)]">What “qualified” means</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
            Requirements are set per course (lessons + sometimes a passing assessment). Your learning room shows a simple checklist until everything is satisfied.
          </p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-lg font-semibold text-[var(--learn-ink)]">After you earn it</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
            Add it to your CV or profile, share the verification link, or keep it in your HenryCo account alongside the rest of your learning history.
          </p>
        </LearnPanel>
      </div>

      <LearnPanel className="mt-10 rounded-[2rem]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--learn-ink)]">Verify someone’s certificate</p>
            <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--learn-ink-soft)]">
              Enter the code printed on their credential. You’ll see whether HenryCo Learn has a matching, active record—no account required to check.
            </p>
          </div>
        </div>
        <form action="/certifications/verify" method="get" className="mt-6 grid gap-4 md:grid-cols-[1fr,auto]">
          <input name="code" required placeholder="Verification code (e.g. from certificate or email)" className="learn-input rounded-2xl px-4 py-3" />
          <button type="submit" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
            Verify
          </button>
        </form>
      </LearnPanel>

      <LearnSectionIntro
        className="mt-14"
        kicker="Certificate programs"
        title="Courses that currently award a HenryCo certificate"
        body="Open any program for the full syllabus, quiz details, and enrollment options."
      />

      {certifications.length === 0 ? (
        <LearnPanel className="mt-8 rounded-[2rem] text-center">
          <p className="text-sm leading-7 text-[var(--learn-ink-soft)]">
            No certificate-track courses are published in the catalog yet. Browse all programs on the{" "}
            <Link href="/courses" className="font-semibold text-[var(--learn-mint-soft)] underline-offset-2 hover:underline">
              course catalog
            </Link>{" "}
            —we’ll label new credentials clearly as they go live.
          </p>
        </LearnPanel>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {certifications.map((course) => (
            <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} />
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <a href={getAccountLearnUrl("certificates")} className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
          My certificates in account
        </a>
      </div>
    </main>
  );
}
