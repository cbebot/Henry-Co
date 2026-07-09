import { ArrowRight, ArrowUpRight, ChartNoAxesCombined, Sparkles, UsersRound } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { PublicSpotlight } from "@henryco/ui/public-shell";
import {
  DisplayHeading,
  EditorialList,
  EditorialRow,
  Eyebrow,
  Lede,
  PublicCTA,
  PublicProofRail,
  Section,
  SectionHeader,
} from "@henryco/ui/public-design";
import { CourseCard, PathCard } from "@/components/learn/ui";
import { getLearnViewer } from "@/lib/learn/auth";
import { getPublicAcademyData } from "@/lib/learn/data";
import { getAccountLearnUrl, getSharedAuthUrl } from "@/lib/learn/links";
import { getLearnPublicLocale } from "@/lib/locale-server";

function learnHeroFirstName(viewer: Awaited<ReturnType<typeof getLearnViewer>>) {
  if (!viewer.user) return null;
  const full = viewer.user.fullName?.trim();
  if (full) return full.split(/\s+/)[0] ?? null;
  const local = viewer.user.email?.split("@")[0]?.trim();
  return local || null;
}

export default async function HomePage() {
  const [locale, academy, viewer] = await Promise.all([
    getLearnPublicLocale(),
    getPublicAcademyData(),
    getLearnViewer(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const heroFirstName = learnHeroFirstName(viewer);
  const featuredCourses = academy.courses.filter((item) => item.featured).slice(0, 4);
  const featuredPaths = academy.paths.filter((item) => item.featured).slice(0, 3);
  const pathItemCounts = new Map(
    academy.paths.map((path) => [
      path.id,
      academy.pathItems.filter((item) => item.pathId === path.id).length,
    ])
  );
  const proof = (n: number) => (n > 0 ? String(n) : null);

  return (
    <main id="henryco-main" tabIndex={-1}>
      {/* ── HERO — editorial, full-bleed, on the shared --home-* system. The old
          boxed .learn-panel "hero card" is gone: the masthead now reads as a
          sibling of the studio / marketplace homes, in learn's viridian soul. ── */}
      <section id="top" className="relative isolate overflow-hidden home-section-hero">
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-12%] top-[-18%] h-[34rem] w-[34rem] rounded-full opacity-[0.16] blur-[2px]"
          style={{ background: "radial-gradient(circle, var(--home-accent) 0%, transparent 68%)" }}
        />
        <div className="home-shell relative">
          <Eyebrow className="home-rise">{t("Henry Onyx Learn")}</Eyebrow>
          <div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-[1.55fr_1fr] lg:items-end">
            <div>
              {viewer.user ? (
                <p className="home-body-sm home-rise home-delay-1 text-[color:var(--home-ink-70)]">
                  {t("Welcome back")}
                  {heroFirstName ? `, ${heroFirstName}` : ""}.
                </p>
              ) : null}
              <DisplayHeading
                level={1}
                size="xl"
                className={`home-rise home-delay-2 ${viewer.user ? "mt-3" : ""}`}
              >
                {t("Skills that stick.")}{" "}
                <span className="italic text-[color:var(--home-accent-text)]">
                  {t("Proof that travels.")}
                </span>
              </DisplayHeading>
              <Lede className="mt-6 max-w-xl home-rise home-delay-3">
                {t(
                  "Pick a course, move through lessons in order, track progress in your Henry Onyx account, and earn a certificate others can verify online. Built for busy adults who want clarity, not jargon.",
                )}
              </Lede>
              <div className="mt-9 flex flex-wrap items-center gap-3 home-rise home-delay-4">
                <PublicCTA
                  href="/courses"
                  variant="primary"
                  size="lg"
                  trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
                >
                  {t("Browse courses")}
                </PublicCTA>
                {viewer.user ? (
                  <PublicCTA href={getAccountLearnUrl("active")} variant="secondary" size="lg">
                    {t("Continue learning")}
                  </PublicCTA>
                ) : (
                  <PublicCTA href={getSharedAuthUrl("signup", "/courses")} variant="secondary" size="lg">
                    {t("Create free account")}
                  </PublicCTA>
                )}
                <PublicCTA href="/academy" variant="ghost" size="lg">
                  {t("How it works")}
                </PublicCTA>
              </div>
            </div>
            <PublicProofRail
              className="home-rise home-delay-4"
              label={t("At a glance")}
              items={[
                { value: proof(academy.courses.length), label: t("Programs open now") },
                { value: proof(academy.paths.length), label: t("Guided paths") },
                { value: proof(academy.categories.length), label: t("Subject areas") },
                { value: proof(academy.reviews.length), label: t("Learner reviews") },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── FEATURED PROGRAMS ── */}
      <Section>
        <SectionHeader
          eyebrow={t("Start here")}
          title={t("Featured programs our team highlights right now.")}
          lede={t("Each card opens the full course page: what you’ll learn, how long it takes, whether there’s an assessment, and how to enroll.")}
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} locale={locale} />
          ))}
        </div>
        <div className="mt-9 flex flex-wrap gap-3">
          <PublicCTA href="/courses" variant="primary" trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}>
            {t("See all courses")}
          </PublicCTA>
          <PublicCTA href={getAccountLearnUrl("active")} variant="secondary">
            {t("Continue in my account")}
          </PublicCTA>
        </div>
      </Section>

      {/* ── HOW LEARNING RUNS — the shared spotlight (already standard) ── */}
      <Section>
        <PublicSpotlight
          tone="contrast"
          eyebrow={t("How learning runs here")}
          title={t("Structured lessons, fair assessments, real verification.")}
          body={t(
            "Sign in once. Enrollments, progress, certificates, billing, and teaching applications all live on the same Henry Onyx profile — no duplicate logins, no parallel inboxes.",
          )}
          aside={
            <ul className="space-y-5">
              <li className="border-l border-white/15 pl-4">
                <p className="text-sm font-semibold text-white">{t("Teams & assignments")}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  {t("Some courses are assigned inside Henry Onyx. Team programs appear in your account alongside anything you chose yourself.")}
                </p>
              </li>
              <li className="border-l border-white/15 pl-4">
                <p className="text-sm font-semibold text-white">{t("What “done” means")}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  {t("Completion follows each course’s rules — usually all lessons, then a passing quiz where applicable. Status shows plainly in the learning room.")}
                </p>
              </li>
              <li className="border-l border-white/15 pl-4">
                <p className="text-sm font-semibold text-white">{t("Verification anyone can check")}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  {t("Eligible courses issue a certificate with a code anyone can verify online — useful for employers, partners, or your own records.")}
                </p>
              </li>
            </ul>
          }
        />
      </Section>

      {/* ── LEARNING PATHS ── */}
      <Section>
        <SectionHeader
          eyebrow={t("Learning paths")}
          title={t("Follow a sequence when one course isn’t enough.")}
          lede={t("Paths group related courses so you build a capability step by step—ideal when you’re onboarding to a role or deepening a specialty.")}
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {featuredPaths.map((path) => (
            <PathCard key={path.id} path={path} courseCount={pathItemCounts.get(path.id) || 0} href={`/paths/${path.slug}`} locale={locale} />
          ))}
        </div>
        <div className="mt-9">
          <PublicCTA href="/paths" variant="secondary" trailingIcon={<ArrowUpRight aria-hidden className="h-4 w-4" />}>
            {t("Explore every path")}
          </PublicCTA>
        </div>
      </Section>

      {/* ── TEACH WITH HENRY ONYX — editorial split, hairline list (no boxed card) ── */}
      <Section tone="sunken">
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_0.92fr] lg:items-start">
          <div>
            <Eyebrow>{t("Teach with Henry Onyx")}</Eyebrow>
            <DisplayHeading level={2} size="display" className="mt-4">
              {t("Apply if you can teach with")}{" "}
              <span className="italic text-[color:var(--home-accent-text)]">{t("depth and structure.")}</span>
            </DisplayHeading>
            <Lede className="mt-5">
              {t("We review every application by hand. Approval is not automatic. Strong candidates move through identity checks, quality expectations, and onboarding—not a self-serve creator rush.")}
            </Lede>
            <div className="mt-8 flex flex-wrap gap-3">
              <PublicCTA href="/teach" variant="primary" trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}>
                {t("Start application")}
              </PublicCTA>
              <PublicCTA href="/trust" variant="secondary">
                {t("Standards & trust")}
              </PublicCTA>
            </div>
          </div>

          <EditorialList>
            <EditorialRow
              index={<Sparkles aria-hidden className="h-4 w-4" />}
              title={t("Quality bar")}
              body={t("We look for real subject expertise, respectful delivery, and outlines learners can actually finish — not hype or recycled slides.")}
            />
            <EditorialRow
              index={<UsersRound aria-hidden className="h-4 w-4" />}
              title={t("Aligned with Henry Onyx")}
              body={t("Topics that fit our ecosystem — operations, customer experience, digital skills, partner enablement — get the closest match with our learners' needs.")}
            />
            <EditorialRow
              index={<ChartNoAxesCombined aria-hidden className="h-4 w-4" />}
              title={t("Why Henry Onyx Learn exists")}
              body={t("We invest in education so customers, partners, and staff share the same standards — and so capable people can prove what they know.")}
            />
          </EditorialList>
        </div>
      </Section>
    </main>
  );
}
