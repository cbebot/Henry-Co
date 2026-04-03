import { notFound } from "next/navigation";
import { JobCard } from "@/components/job-card";
import { PublicShell } from "@/components/public-shell";
import { getJobPosts } from "@/lib/jobs/data";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const jobs = await getJobPosts();
  const items = jobs.filter((job) => job.categorySlug === slug);
  if (items.length === 0) {
    notFound();
  }

  return (
    <PublicShell primaryCta={{ label: "Browse all jobs", href: "/jobs" }}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="jobs-panel rounded-[2.2rem] p-8">
          <p className="jobs-kicker">Category</p>
          <h1 className="mt-3 jobs-heading">{items[0].categoryName}</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">
            {items.length} live role{items.length === 1 ? "" : "s"} in this job family.
          </p>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {items.map((job) => (
            <JobCard key={job.slug} job={job} />
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
