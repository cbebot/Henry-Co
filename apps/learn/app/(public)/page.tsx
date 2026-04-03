import Link from "next/link";
import { Award, BookOpen, BriefcaseBusiness, ChartNoAxesCombined, GraduationCap, ShieldCheck } from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import { CourseCard, LearnMetricCard, LearnPanel, LearnSectionIntro, PathCard, QuickMetricStrip } from "@/components/learn/ui";
import { getPublicAcademyData } from "@/lib/learn/data";

const learn = getDivisionConfig("learn");

export default async function HomePage() {
  const academy = await getPublicAcademyData();
  const featuredCourses = academy.courses.filter((item) => item.featured).slice(0, 4);
  const featuredPaths = academy.paths.filter((item) => item.featured).slice(0, 3);
  const pathItemCounts = new Map(
    academy.paths.map((path) => [
      path.id,
      academy.pathItems.filter((item) => item.pathId === path.id).length,
    ])
  );

  return (
    <main>
      <section className="learn-hero">
        <div className="mx-auto max-w-[92rem] px-5 py-16 sm:px-8 sm:py-20 xl:px-10">
          <div className="learn-panel learn-mesh rounded-[2.8rem] p-8 sm:p-12 xl:p-14">
            <p className="learn-kicker">Premium Academy Platform</p>
            <h1 className="learn-display mt-6 max-w-5xl text-[var(--learn-ink)]">
              Learning that feels calmer, sharper, and more operationally serious than the average LMS.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--learn-ink-soft)]">
              {learn.description} Built for public learners, internal staff training, onboarding, vendor enablement, certifications, and future HenryCo knowledge products.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                Explore courses
              </Link>
              <Link href="/academy" className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                See the academy system
              </Link>
            </div>
            <div className="mt-10">
              <QuickMetricStrip
                items={[
                  { label: "Public courses", value: String(academy.courses.length) },
                  { label: "Structured paths", value: String(academy.paths.length) },
                  { label: "Featured categories", value: String(academy.categories.filter((item) => item.featured).length) },
                  { label: "Published reviews", value: String(academy.reviews.length) },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 xl:px-10">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <LearnMetricCard label="Public learning" value="Discover" hint="Editorial catalog pages, learning paths, and smoother course selection for public learners." icon={<BookOpen className="h-5 w-5" />} />
          <LearnMetricCard label="Internal training" value="Assign" hint="Restricted courses and monitored completion flows for HenryCo teams and operations managers." icon={<ShieldCheck className="h-5 w-5" />} />
          <LearnMetricCard label="Certification" value="Verify" hint="Quizzes, score tracking, certificates, and public verification designed for trust and accountability." icon={<Award className="h-5 w-5" />} />
          <LearnMetricCard label="Business value" value="Scale" hint="Training becomes an operating asset across seller enablement, onboarding, and future knowledge products." icon={<ChartNoAxesCombined className="h-5 w-5" />} />
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 xl:px-10">
        <LearnSectionIntro
          kicker="Featured Courses"
          title="Launch stronger, certify faster, and train teams with less clutter."
          body="The HenryCo Learn catalog is seeded from live academy records, not a dead demo page. Each program is designed as part of a bigger academy system, not an isolated course card."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 xl:px-10">
        <LearnSectionIntro
          kicker="Academy Paths"
          title="Tracks that sequence confidence, not just content."
          body="HenryCo Learn treats academy tracks as first-class learning experiences for sellers, internal operations, managers, logistics teams, and growth operators."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {featuredPaths.map((path) => (
            <PathCard key={path.id} path={path} courseCount={pathItemCounts.get(path.id) || 0} href={`/paths/${path.slug}`} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 xl:px-10">
        <div className="grid gap-5 lg:grid-cols-3">
          <LearnPanel className="rounded-[2rem]">
            <div className="rounded-2xl border border-[var(--learn-line)] bg-white/5 p-4">
              <BriefcaseBusiness className="h-5 w-5 text-[var(--learn-copper)]" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Internal assignment monitoring</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">Managers can assign role-restricted training, monitor completion, and keep proof of readiness attached to one learner identity.</p>
          </LearnPanel>
          <LearnPanel className="rounded-[2rem]">
            <div className="rounded-2xl border border-[var(--learn-line)] bg-white/5 p-4">
              <GraduationCap className="h-5 w-5 text-[var(--learn-mint-soft)]" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Verified certificate trust</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">Certificates are issued from live academy records and linked to a public verification route instead of becoming decorative PDFs.</p>
          </LearnPanel>
          <LearnPanel className="rounded-[2rem]">
            <div className="rounded-2xl border border-[var(--learn-line)] bg-white/5 p-4">
              <ShieldCheck className="h-5 w-5 text-[var(--learn-copper)]" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Unified account readiness</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">Enrollments, progress, certificates, payments, notifications, and assignments persist cleanly for future account.henrycogroup.com integration.</p>
          </LearnPanel>
        </div>
      </section>
    </main>
  );
}
