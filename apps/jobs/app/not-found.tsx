import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="jobs-panel max-w-xl rounded-[2rem] p-8 text-center">
        <p className="jobs-kicker">Not Found</p>
        <h1 className="mt-3 jobs-heading">That page is no longer on the hiring map.</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--jobs-muted)]">
          The role, employer page, or Jobs module surface you requested could not be found.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
            Return Home
          </Link>
          <Link href="/jobs" className="jobs-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
            Browse Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
