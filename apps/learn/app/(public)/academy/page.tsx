import { LearnPanel, LearnSectionIntro } from "@/components/learn/ui";
import { getPublicAcademyData } from "@/lib/learn/data";

export const metadata = { title: "Academy - HenryCo Learn" };

export default async function AcademyPage() {
  const academy = await getPublicAcademyData();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro
        kicker="Academy Model"
        title="One academy system for public learning, onboarding, certification, and internal readiness."
        body="HenryCo Learn is designed as a company-wide academy platform, not a marketplace-only training surface. It supports public discovery, paid programs, internal assignments, vendor enablement, onboarding, and future HenryCo knowledge products."
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Public learners</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">Discover courses, compare paths, enroll into free or paid programs, and earn progress visibility without dashboard clutter.</p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Internal training</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">Managers can assign restricted training, monitor overdue completion, and verify readiness across care, support, logistics, and future teams.</p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Knowledge products</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">HenryCo Learn is ready for premium education offers, certification ladders, partner education, and cross-division capability programs.</p>
        </LearnPanel>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <LearnPanel className="rounded-[2rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">Categories</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{academy.categories.length}</p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">Published courses</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{academy.courses.length}</p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">Structured paths</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{academy.paths.length}</p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">Instructor spots</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{academy.instructors.length}</p>
        </LearnPanel>
      </div>
    </main>
  );
}
