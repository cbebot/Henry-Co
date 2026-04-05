import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

  const name = items[0].categoryName;

  return (
    <PublicShell primaryCta={{ label: "Search in this category", href: `/jobs?category=${encodeURIComponent(slug)}` }} secondaryCta={{ label: "All jobs", href: "/jobs" }}>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <nav className="text-sm text-[var(--jobs-muted)]">
          <Link href="/jobs" className="inline-flex items-center gap-1 font-semibold text-[var(--jobs-accent)] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            All jobs
          </Link>
        </nav>

        <div className="jobs-panel rounded-[2.2rem] p-8 sm:p-10">
          <p className="jobs-kicker">Category</p>
          <h1 className="mt-3 jobs-heading">{name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">
            {items.length} open role{items.length === 1 ? "" : "s"} in this job family. Use filters on the main job search
            to combine category with location, work mode, or verified employers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/jobs?category=${encodeURIComponent(slug)}`} className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
              Refine with filters
            </Link>
            <Link href="/hire" className="jobs-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
              Post in this space
            </Link>
          </div>
        </div>

        <ul className="grid list-none gap-5 p-0 lg:grid-cols-2">
          {items.map((job) => (
            <li key={job.slug}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      </div>
    </PublicShell>
  );
}
