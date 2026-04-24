import { LearnPanel, LearnSectionIntro } from "@/components/learn/ui";

export const metadata = { title: "Trust - HenryCo Learn" };

export default function TrustPage() {
  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro
        kicker="Trust &amp; safety"
        title="Learning records you can rely on."
        body="Enrollments, progress, quizzes, and certificates are handled on the server &mdash; not hidden in a browser. Internal courses stay restricted to the right people; certificates carry a verification code anyone can check."
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Enrollment & access</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
            Starting a course, paying where required, and unlocking lessons happen through secure workflows. You can’t “fake” completion from the client side.
          </p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Internal & assigned training</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
            Some programs are visible only to invited staff or partners. Those rules are enforced the same way as the rest of the academy—not by hoping people stay on the right URL.
          </p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Certificates & verification</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
            When you earn a credential, we issue a record you can download and a code third parties can check. That’s the difference between decoration and proof.
          </p>
        </LearnPanel>
      </div>
    </main>
  );
}
