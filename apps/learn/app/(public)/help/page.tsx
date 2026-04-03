import { createSupportRequestAction } from "@/lib/learn/actions";
import { LearnPanel, LearnSectionIntro } from "@/components/learn/ui";

export const metadata = { title: "Help - HenryCo Learn" };

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro
        kicker="Help"
        title="Get support without leaving the academy system."
        body="HenryCo Learn routes support requests into the shared HenryCo support stack so learner issues, assignment questions, and certificate verification requests stay visible."
      />

      {params.sent ? (
        <LearnPanel className="mt-8 rounded-[2rem]">
          <p className="text-sm text-[var(--learn-mint-soft)]">Your support request has been sent to HenryCo Learn operations.</p>
        </LearnPanel>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,0.9fr]">
        <LearnPanel className="rounded-[2rem]">
          <form action={createSupportRequestAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--learn-ink)]">Subject</label>
              <input name="subject" required className="learn-input mt-2 rounded-2xl px-4 py-3" placeholder="Certificate question, assignment issue, billing help..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--learn-ink)]">Message</label>
              <textarea name="body" required rows={6} className="learn-textarea mt-2 rounded-2xl px-4 py-3" placeholder="Describe the issue clearly so support can resolve it faster." />
            </div>
            <button className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold" type="submit">Send support request</button>
          </form>
        </LearnPanel>

        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Frequently asked</h3>
          <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--learn-ink-soft)]">
            <div>
              <p className="font-semibold text-[var(--learn-ink)]">How do certificates work?</p>
              <p className="mt-1">Courses with completion requirements issue a live academy certificate once lessons and assessment rules are satisfied.</p>
            </div>
            <div>
              <p className="font-semibold text-[var(--learn-ink)]">Can internal training be assigned?</p>
              <p className="mt-1">Yes. HenryCo managers can assign role-restricted courses and monitor completion from the academy operations workspace.</p>
            </div>
            <div>
              <p className="font-semibold text-[var(--learn-ink)]">Will my activity appear in the future shared account?</p>
              <p className="mt-1">Yes. HenryCo Learn already writes academy activity into shared Supabase records for future account visibility.</p>
            </div>
          </div>
        </LearnPanel>
      </div>
    </main>
  );
}
