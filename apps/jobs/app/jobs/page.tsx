import { JobCard } from "@/components/job-card";
import { PublicShell } from "@/components/public-shell";
import { getEmployerProfiles, searchJobs } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const [jobs, employers] = await Promise.all([searchJobs(params), getEmployerProfiles()]);

  return (
    <PublicShell primaryCta={{ label: "Create Candidate Profile", href: "/candidate/profile" }}>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="jobs-panel rounded-[2.2rem] p-7 sm:p-9">
          <p className="jobs-kicker">Search Roles</p>
          <h1 className="mt-3 jobs-heading">Search without the clutter tax.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--jobs-muted)]">
            Filter by role intent, work mode, employer trust, internal HenryCo tracks, and category without getting buried under noisy cards.
          </p>
          <form className="mt-6 grid gap-4 lg:grid-cols-5" method="GET">
            <input className="jobs-input lg:col-span-2" name="q" defaultValue={typeof params.q === "string" ? params.q : ""} placeholder="Product designer, operations lead, recruiter" />
            <input className="jobs-input" name="category" defaultValue={typeof params.category === "string" ? params.category : ""} placeholder="Category slug" />
            <select className="jobs-select" name="mode" defaultValue={typeof params.mode === "string" ? params.mode : ""}>
              <option value="">Any mode</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
            <button className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">Search</button>
          </form>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          <aside className="jobs-panel rounded-[2rem] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--jobs-muted)]">Employers</h2>
            <div className="mt-4 space-y-2">
              {employers.filter((employer) => employer.openRoleCount > 0).map((employer) => (
                <a key={employer.slug} href={`/employers/${employer.slug}`} className="block rounded-2xl bg-[var(--jobs-paper-soft)] px-4 py-3 text-sm font-medium hover:bg-[var(--jobs-accent-soft)]">
                  {employer.name}
                </a>
              ))}
            </div>
          </aside>

          <section className="space-y-5">
            {jobs.length === 0 ? (
              <div className="jobs-panel rounded-[2rem] p-8 text-center text-sm text-[var(--jobs-muted)]">
                No roles matched that search yet. Try a broader keyword or remove one of the filters.
              </div>
            ) : (
              jobs.map((job) => <JobCard key={job.slug} job={job} />)
            )}
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
