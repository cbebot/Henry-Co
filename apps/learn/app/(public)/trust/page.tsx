import { LearnPanel, LearnSectionIntro } from "@/components/learn/ui";

export const metadata = { title: "Trust - HenryCo Learn" };

export default function TrustPage() {
  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro
        kicker="Trust Layer"
        title="Certificates, assignments, and access rules built for real accountability."
        body="HenryCo Learn protects privileged flows server-side, keeps restricted training role-aware, and persists academy history in Supabase for future unified-account visibility."
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Server-side enrollment control</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">Enrollments, assignments, certificates, and payment confirmations are written through server-side workflows instead of weak client-only state.</p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Role-restricted internal access</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">Internal programs remain visible only through staff roles, explicit assignments, or privileged academy management access.</p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Public verification readiness</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">Issued certificates map to a verification route and shared-account document history instead of floating outside the academy system.</p>
        </LearnPanel>
      </div>
    </main>
  );
}
