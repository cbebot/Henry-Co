import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { JobCard } from "@/components/job-card";
import { PublicShell } from "@/components/public-shell";
import { getJobPosts } from "@/lib/jobs/data";
import { getJobsPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getJobsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const jobs = await getJobPosts({ locale });
  const items = jobs.filter((job) => job.categorySlug === slug);
  if (items.length === 0) {
    notFound();
  }

  const name = items[0].categoryName;
  const verifiedInCat = items.filter(
    (job) => job.employerVerification === "verified",
  ).length;

  return (
    <PublicShell
      primaryCta={{
        label: t("Search in this category"),
        href: `/jobs?category=${encodeURIComponent(slug)}`,
      }}
      secondaryCta={{ label: t("All jobs"), href: "/jobs" }}
    >
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <nav className="text-sm text-[var(--jobs-muted)]">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("All jobs")}
          </Link>
        </nav>

        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="jobs-kicker">{t("Category")}</p>
              <h1 className="mt-4 jobs-display max-w-3xl text-balance">{name}</h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--jobs-muted)]">
                {items.length} {items.length === 1 ? t("open role") : t("open roles")} {t("in this job family. Use filters on the main job search to combine category with location, work mode, or verified employers.")}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/jobs?category=${encodeURIComponent(slug)}`}
                  className="jobs-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                >
                  {t("Refine with filters")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/hire"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--jobs-line)] px-5 py-3 text-sm font-semibold text-[var(--jobs-ink)] transition hover:border-[var(--jobs-accent)]/40"
                >
                  {t("Post in this space")}
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                { label: t("Open roles"), value: String(items.length) },
                { label: t("Verified employers"), value: String(verifiedInCat) },
                { label: t("Apply with"), value: t("One HenryCo account") },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-baseline gap-3 border-b border-[var(--jobs-line)] py-3 last:border-b-0"
                >
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    {item.label}
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--jobs-ink)]">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <div className="flex items-baseline gap-4">
            <p className="jobs-kicker">{t("Live in this family")}</p>
            <span className="h-px flex-1 bg-[var(--jobs-line)]" />
          </div>
          <ul className="mt-8 grid list-none gap-5 p-0 lg:grid-cols-2">
            {items.map((job) => (
              <li key={job.slug}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PublicShell>
  );
}
