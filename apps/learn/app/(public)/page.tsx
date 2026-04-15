import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpen, BriefcaseBusiness, ChartNoAxesCombined, GraduationCap, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { createDivisionMetadata, getDivisionConfig } from "@henryco/config";
import { CourseCard, LearnMetricCard, LearnPanel, LearnSectionIntro, PathCard, QuickMetricStrip } from "@/components/learn/ui";
import { getLearnViewer } from "@/lib/learn/auth";
import { getPublicAcademyData } from "@/lib/learn/data";
import { getAccountLearnUrl, getSharedAuthUrl } from "@/lib/learn/links";

const learn = getDivisionConfig("learn");
export const metadata: Metadata = createDivisionMetadata("learn", {
  path: "/",
});

function learnHeroFirstName(viewer: Awaited<ReturnType<typeof getLearnViewer>>) {
  if (!viewer.user) return null;
  const full = viewer.user.fullName?.trim();
  if (full) return full.split(/\s+/)[0] ?? null;
  const local = viewer.user.email?.split("@")[0]?.trim();
  return local || null;
}

export default async function HomePage() {
  const [academy, viewer] = await Promise.all([getPublicAcademyData(), getLearnViewer()]);
  const heroFirstName = learnHeroFirstName(viewer);
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
            <p className="learn-kicker">HenryCo Learn</p>
            {viewer.user ? (
              <p className="mt-4 text-sm font-semibold tracking-tight text-[var(--learn-ink-soft)]">
                Welcome back{heroFirstName ? `, ${heroFirstName}` : ""}.
              </p>
            ) : null}
            <h1 className={`learn-display max-w-5xl text-[var(--learn-ink)] ${viewer.user ? "mt-5" : "mt-6"}`}>
              Learn skills that stick—with structure, support, and proof you finished.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--learn-ink-soft)]">
              Pick a course, move through lessons in order, check your progress anytime in your HenryCo account, and—when your program includes it—earn a certificate others can verify online. Built for busy adults who want clarity, not jargon.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                Browse courses
              </Link>
              {viewer.user ? (
                <a
                  href={getAccountLearnUrl("active")}
                  className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Continue learning
                </a>
              ) : (
                <a
                  href={getSharedAuthUrl("signup", "/courses")}
                  className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Create free account
                </a>
              )}
              <Link href="/academy" className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                How it works
              </Link>
            </div>
            <div className="mt-10">
              <QuickMetricStrip
                items={[
                  { label: "Programs open now", value: String(academy.courses.length) },
                  { label: "Guided paths", value: String(academy.paths.length) },
                  { label: "Subject areas", value: String(academy.categories.length) },
                  { label: "Learner reviews", value: String(academy.reviews.length) },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 xl:px-10">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <LearnMetricCard
            label="For you if…"
            value="You want to grow"
            hint="Operators, sellers, team leads, and curious professionals who prefer short, structured lessons over endless videos."
            icon={<BookOpen className="h-5 w-5" />}
          />
          <LearnMetricCard
            label="Your rhythm"
            value="At your pace"
            hint="Open a course when you have time; your place is saved. Resume from your HenryCo account or straight from the course page."
            icon={<GraduationCap className="h-5 w-5" />}
          />
          <LearnMetricCard
            label="When there’s a quiz"
            value="Fair & clear"
            hint="Many programs unlock a final assessment only after the lessons. Pass at the stated score, within the attempt limit, to complete the program."
            icon={<Award className="h-5 w-5" />}
          />
          <LearnMetricCard
            label="Certificates"
            value="Real verification"
            hint="Eligible courses issue a certificate with a code anyone can check—useful for employers, partners, or your own records."
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 xl:px-10">
        <LearnSectionIntro
          kicker="Start here"
          title="Featured programs our team highlights right now."
          body="Each card opens the full course page: what you’ll learn, how long it takes, whether there’s an assessment, and how to enroll."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/courses" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
            See all courses
          </Link>
          <a href={getAccountLearnUrl("active")} className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
            Continue in my account
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 xl:px-10">
        <LearnSectionIntro
          kicker="Learning paths"
          title="Follow a sequence when one course isn’t enough."
          body="Paths group related courses so you build a capability step by step—ideal when you’re onboarding to a role or deepening a specialty."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {featuredPaths.map((path) => (
            <PathCard key={path.id} path={path} courseCount={pathItemCounts.get(path.id) || 0} href={`/paths/${path.slug}`} />
          ))}
        </div>
        <div className="mt-8">
          <Link href="/paths" className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
            Explore every path
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 xl:px-10">
        <div className="grid gap-5 lg:grid-cols-3">
          <LearnPanel className="rounded-[2rem]">
            <div className="rounded-2xl border border-[var(--learn-line)] bg-white/5 p-4">
              <BriefcaseBusiness className="h-5 w-5 text-[var(--learn-copper)]" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Teams & assignments</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
              Some courses are assigned inside HenryCo. If you’re on a team program, you’ll see it in your account alongside anything you chose yourself.
            </p>
          </LearnPanel>
          <LearnPanel className="rounded-[2rem]">
            <div className="rounded-2xl border border-[var(--learn-line)] bg-white/5 p-4">
              <GraduationCap className="h-5 w-5 text-[var(--learn-mint-soft)]" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">What “done” means</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
              Completion follows each course’s rules—usually all lessons, then a passing quiz where applicable. We show your status plainly in the learning room and in your account.
            </p>
          </LearnPanel>
          <LearnPanel className="rounded-[2rem]">
            <div className="rounded-2xl border border-[var(--learn-line)] bg-white/5 p-4">
              <ShieldCheck className="h-5 w-5 text-[var(--learn-copper)]" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">One HenryCo account</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
              Sign in once. Enrollments, progress, certificates, billing, and teaching applications stay tied to the same profile—no duplicate logins to remember.
            </p>
          </LearnPanel>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 xl:px-10">
        <div className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
          <LearnPanel className="learn-mesh rounded-[2.4rem] p-7 sm:p-8">
            <p className="learn-kicker">Teach with HenryCo</p>
            <h2 className="learn-heading mt-4 text-[2.4rem] text-[var(--learn-ink)] sm:text-[3.1rem]">
              Apply if you can teach with depth, structure, and professionalism.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--learn-ink-soft)]">
              We review every application by hand. Approval is not automatic. Strong candidates move through identity checks, quality expectations, and onboarding—not a self-serve creator rush.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/teach" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                Start application
              </Link>
              <Link href="/trust" className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                Standards & trust
              </Link>
            </div>
          </LearnPanel>

          <div className="grid gap-5 sm:grid-cols-2">
            <LearnPanel className="rounded-[2rem]">
              <Sparkles className="h-5 w-5 text-[var(--learn-copper)]" />
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Quality bar</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
                We look for real subject expertise, respectful delivery, and outlines learners can actually finish—not hype or recycled slides.
              </p>
            </LearnPanel>
            <LearnPanel className="rounded-[2rem]">
              <UsersRound className="h-5 w-5 text-[var(--learn-copper)]" />
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Aligned with HenryCo</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
                Topics that fit our ecosystem—operations, customer experience, digital skills, and partner enablement—get the closest match with our learners’ needs.
              </p>
            </LearnPanel>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 pb-16 sm:px-8 xl:px-10">
        <LearnPanel className="rounded-[2rem] border border-[var(--learn-line-strong)]/30">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="learn-kicker">Inside HenryCo</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">Why {learn.name} exists</h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--learn-ink-soft)]">
                {learn.tagline} We invest in education so customers, partners, and staff share the same standards—and so capable people can prove what they know.
              </p>
            </div>
            <ChartNoAxesCombined className="h-10 w-10 shrink-0 text-[var(--learn-mint-soft)] opacity-80" aria-hidden />
          </div>
        </LearnPanel>
      </section>
    </main>
  );
}
