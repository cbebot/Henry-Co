import { PublicShell } from "@/components/public-shell";
import { getJobsHomeData } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";

export default async function TalentPage() {
  const home = await getJobsHomeData();

  return (
    <PublicShell primaryCta={{ label: "Build candidate profile", href: "/candidate/profile" }}>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="jobs-panel rounded-[2.2rem] p-8 sm:p-10">
          <p className="jobs-kicker">For candidates</p>
          <h1 className="mt-3 jobs-heading">Build a profile that employers actually trust.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--jobs-muted)]">
            HenryCo Jobs uses your profile completeness, uploaded documents, verified skills, and work history to help
            employers see the real you — not just a name and a CV attachment.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {home.differentiators.slice(0, 5).map((item) => (
            <div key={item.id} className="jobs-panel rounded-[2rem] p-6">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">{item.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
