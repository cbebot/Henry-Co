import Link from "next/link";
import { getJobsCandidateSurfaceCopy } from "@henryco/i18n";
import { getJobsPublicLocale } from "@/lib/locale-server";

export default async function NotFound() {
  const locale = await getJobsPublicLocale();
  const copy = getJobsCandidateSurfaceCopy(locale).notFound;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="jobs-panel max-w-xl rounded-[2rem] p-8 text-center">
        <p className="jobs-kicker">{copy.kicker}</p>
        <h1 className="mt-3 jobs-heading">{copy.title}</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--jobs-muted)]">
          {copy.body}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
            {copy.returnHome}
          </Link>
          <Link href="/jobs" className="jobs-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
            {copy.browseJobs}
          </Link>
        </div>
      </div>
    </div>
  );
}
