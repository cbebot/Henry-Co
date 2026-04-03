import Link from "next/link";
import { LearnSignupForm } from "@/components/learn/signup-form";

export const metadata = { title: "Create Account - HenryCo Learn" };

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[92rem] items-center justify-center px-5 py-16 sm:px-8 xl:px-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="learn-panel learn-hero rounded-[2.4rem] p-8 sm:p-10">
          <p className="learn-kicker">Create academy account</p>
          <h1 className="learn-heading mt-5 text-[3rem] text-[var(--learn-ink)] sm:text-[4.2rem]">
            Build one academy identity for public learning and internal readiness.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-8 text-[var(--learn-ink-soft)] sm:text-[15px]">
            Your HenryCo Learn account keeps enrollments, assignments, quiz attempts, and certificates ready for future unified-account visibility.
          </p>
          <p className="mt-5 text-sm text-[var(--learn-ink-soft)]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--learn-mint-soft)]">
              Sign in
            </Link>
          </p>
        </div>
        <LearnSignupForm />
      </div>
    </div>
  );
}
