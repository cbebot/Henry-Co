import { LearnLoginForm } from "@/components/learn/login-form";

export const metadata = { title: "Sign In - HenryCo Learn" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next || "/learner";

  return (
    <div className="mx-auto flex min-h-screen max-w-[92rem] items-center justify-center px-5 py-16 sm:px-8 xl:px-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="learn-panel learn-hero rounded-[2.4rem] p-8 sm:p-10">
          <p className="learn-kicker">Return to the academy</p>
          <h1 className="learn-heading mt-5 text-[3rem] text-[var(--learn-ink)] sm:text-[4.2rem]">
            Resume progress, assignments, and certificates without friction.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-8 text-[var(--learn-ink-soft)] sm:text-[15px]">
            HenryCo Learn keeps public learning, internal training, notifications, and verified certificates inside one premium workspace.
          </p>
        </div>
        <LearnLoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
