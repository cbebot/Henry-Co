import { notFound } from "next/navigation";
import { Layers3, Quote, Star } from "lucide-react";
import { JsonLd, buildCourseLd } from "@henryco/seo";
import { getDivisionUrl } from "@henryco/config";
import {
  formatSurfaceTemplate,
  resolveLocalizedDynamicField,
  translateSurfaceLabel,
} from "@henryco/i18n/server";
import { getCourseBySlug } from "@/lib/learn/data";
import { getLearnViewer } from "@/lib/learn/auth";
import { enrollInCourseAction, toggleSavedCourseAction } from "@/lib/learn/actions";
import { getAccountLearnUrl, getLearnCourseRoomUrl, getSharedAuthUrl } from "@/lib/learn/links";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import {
  ActionLink,
  CourseCard,
  humanizeLabel,
  LearnMarkdown,
  LearnSectionIntro,
  LearnStatusBadge,
} from "@/components/learn/ui";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getLearnViewer();
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const tf = (template: string, values: Record<string, string | number>) =>
    formatSurfaceTemplate(template, values);
  const data = await getCourseBySlug(slug, viewer);
  if (!data) notFound();

  const {
    course,
    category,
    instructor,
    modules,
    quiz,
    questions,
    reviews,
    related,
    paths,
    enrollment,
    saved,
    averageRating,
  } = data;
  const canStart = enrollment && ["active", "completed"].includes(enrollment.status);
  const signInHref = getSharedAuthUrl("login", `/courses/${course.slug}`);
  const visibilityLabel =
    course.visibility === "public"
      ? t("Public access")
      : course.visibility === "internal"
        ? t("Assigned access")
        : t("Private access");

  // WAVE A — translate Supabase-row-driven text via the cached DeepL pipeline.
  const machineTranslate = locale !== "en";
  const courseRecord = course as unknown as Record<string, unknown>;
  const categoryRecord = category as unknown as Record<string, unknown> | null;
  const instructorRecord = instructor as unknown as Record<string, unknown> | null;
  const quizRecord = quiz as unknown as Record<string, unknown> | null;

  const [
    courseTitle,
    courseSubtitle,
    courseDescription,
    courseCompletionRule,
    categoryName,
    instructorFullName,
    instructorTitle,
    instructorBio,
    instructorSpotlightQuote,
    quizTitle,
    quizDescription,
  ] = await Promise.all([
    resolveLocalizedDynamicField({
      record: courseRecord,
      field: "title",
      locale,
      fallback: course.title ?? "",
      machineTranslate,
    }),
    resolveLocalizedDynamicField({
      record: courseRecord,
      field: "subtitle",
      locale,
      fallback: course.subtitle ?? "",
      machineTranslate,
    }),
    resolveLocalizedDynamicField({
      record: courseRecord,
      field: "description",
      locale,
      fallback: course.description ?? "",
      machineTranslate,
    }),
    resolveLocalizedDynamicField({
      record: courseRecord,
      field: "completionRule",
      locale,
      fallback: course.completionRule ?? "",
      machineTranslate,
    }),
    categoryRecord
      ? resolveLocalizedDynamicField({
          record: categoryRecord,
          field: "name",
          locale,
          fallback: category?.name ?? "",
          machineTranslate,
        })
      : Promise.resolve(""),
    instructorRecord
      ? resolveLocalizedDynamicField({
          record: instructorRecord,
          field: "fullName",
          locale,
          fallback: instructor?.fullName ?? "",
          machineTranslate,
        })
      : Promise.resolve(""),
    instructorRecord
      ? resolveLocalizedDynamicField({
          record: instructorRecord,
          field: "title",
          locale,
          fallback: instructor?.title ?? "",
          machineTranslate,
        })
      : Promise.resolve(""),
    instructorRecord
      ? resolveLocalizedDynamicField({
          record: instructorRecord,
          field: "bio",
          locale,
          fallback: instructor?.bio ?? "",
          machineTranslate,
        })
      : Promise.resolve(""),
    instructorRecord
      ? resolveLocalizedDynamicField({
          record: instructorRecord,
          field: "spotlightQuote",
          locale,
          fallback: instructor?.spotlightQuote ?? "",
          machineTranslate,
        })
      : Promise.resolve(""),
    quizRecord
      ? resolveLocalizedDynamicField({
          record: quizRecord,
          field: "title",
          locale,
          fallback: quiz?.title ?? "",
          machineTranslate,
        })
      : Promise.resolve(""),
    quizRecord
      ? resolveLocalizedDynamicField({
          record: quizRecord,
          field: "description",
          locale,
          fallback: quiz?.description ?? "",
          machineTranslate,
        })
      : Promise.resolve(""),
  ]);

  // Module + lesson fan-out — each module gets its title/summary translated, plus all lesson titles/summaries/bodies.
  const modulesLocalized = await Promise.all(
    modules.map(async (module) => {
      const moduleRecord = module as unknown as Record<string, unknown>;
      const [title, summary, lessons] = await Promise.all([
        resolveLocalizedDynamicField({
          record: moduleRecord,
          field: "title",
          locale,
          fallback: module.title ?? "",
          machineTranslate,
        }),
        resolveLocalizedDynamicField({
          record: moduleRecord,
          field: "summary",
          locale,
          fallback: module.summary ?? "",
          machineTranslate,
        }),
        Promise.all(
          module.lessons.map(async (lesson) => {
            const lessonRecord = lesson as unknown as Record<string, unknown>;
            const [lessonTitle, lessonSummary, lessonBody] = await Promise.all([
              resolveLocalizedDynamicField({
                record: lessonRecord,
                field: "title",
                locale,
                fallback: lesson.title ?? "",
                machineTranslate,
              }),
              resolveLocalizedDynamicField({
                record: lessonRecord,
                field: "summary",
                locale,
                fallback: lesson.summary ?? "",
                machineTranslate,
              }),
              resolveLocalizedDynamicField({
                record: lessonRecord,
                field: "bodyMarkdown",
                locale,
                fallback: lesson.bodyMarkdown ?? "",
                machineTranslate,
              }),
            ]);
            return {
              ...lesson,
              title: lessonTitle,
              summary: lessonSummary,
              bodyMarkdown: lessonBody,
            };
          }),
        ),
      ]);
      return { ...module, title, summary, lessons };
    }),
  );

  // Reviews — title + body.
  const reviewsLocalized = await Promise.all(
    reviews.slice(0, 3).map(async (review) => {
      const reviewRecord = review as unknown as Record<string, unknown>;
      const [title, body] = await Promise.all([
        resolveLocalizedDynamicField({
          record: reviewRecord,
          field: "title",
          locale,
          fallback: review.title ?? "",
          machineTranslate,
        }),
        resolveLocalizedDynamicField({
          record: reviewRecord,
          field: "body",
          locale,
          fallback: review.body ?? "",
          machineTranslate,
        }),
      ]);
      return { ...review, title, body };
    }),
  );

  // Paths sidebar — title + summary for each path the course is part of.
  const pathsLocalized = await Promise.all(
    paths.map(async (path) => {
      const pathRecord = path as unknown as Record<string, unknown>;
      const [title, summary] = await Promise.all([
        resolveLocalizedDynamicField({
          record: pathRecord,
          field: "title",
          locale,
          fallback: path.title ?? "",
          machineTranslate,
        }),
        resolveLocalizedDynamicField({
          record: pathRecord,
          field: "summary",
          locale,
          fallback: path.summary ?? "",
          machineTranslate,
        }),
      ]);
      return { ...path, title, summary };
    }),
  );

  const learnUrl = getDivisionUrl("learn");
  const courseLd = buildCourseLd({
    name: courseTitle,
    description: course.summary || courseDescription,
    url: `${learnUrl}/courses/${course.slug}`,
    inLanguage: locale,
    educationalLevel: course.difficulty,
    offers:
      course.accessModel === "free"
        ? { price: "0", priceCurrency: course.currency || "NGN", category: "Free" }
        : course.price != null
          ? {
              price: String(course.price),
              priceCurrency: course.currency || "NGN",
              category: "Paid",
            }
          : undefined,
    hasCourseInstance: {
      courseMode: "Online",
      courseWorkload: course.durationText,
    },
  });

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-14 sm:px-8 xl:px-10">
      <JsonLd id={`learn-course-${course.id}-jsonld`} data={courseLd} />
      {/* Editorial course hero — no big rounded panel */}
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <LearnStatusBadge
            label={visibilityLabel}
            tone={course.visibility === "public" ? "signal" : "warning"}
          />
          <LearnStatusBadge
            label={
              course.accessModel === "free"
                ? t("Free")
                : course.accessModel === "paid"
                  ? t("Paid")
                  : t("Sponsored")
            }
            tone={course.accessModel === "free" ? "success" : "neutral"}
          />
          {course.certification ? <LearnStatusBadge label={t("Certificate")} tone="signal" /> : null}
          {category ? <LearnStatusBadge label={categoryName || t(category.name)} /> : null}
        </div>
        <h1 className="mt-6 max-w-4xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[3rem] md:text-[3.6rem]">
          {courseTitle}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)] sm:text-lg">
          {courseSubtitle}
        </p>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.2fr,0.8fr]">
          {/* Description + tags — editorial column */}
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-copper)]">
              {t("About this program")}
            </p>
            <p className="mt-4 max-w-3xl text-[15px] leading-[1.75] text-[var(--learn-ink-soft)]">
              {courseDescription}
            </p>
            {course.tags.length ? (
              <div className="mt-6 flex flex-wrap gap-1.5">
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--learn-line)] px-2.5 py-1 text-[11px] font-semibold tracking-tight text-[var(--learn-ink-soft)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* Stats + actions — divided <dl> + editorial CTA stack */}
          <aside className="lg:pt-2">
            <dl className="divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
              <div className="flex items-baseline gap-3 py-3">
                <Star className="h-3.5 w-3.5 text-[var(--learn-copper)]" />
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                  {t("Average rating")}
                </dt>
                <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                  {averageRating || t("New")}
                </dd>
              </div>
              <div className="flex items-baseline gap-3 py-3">
                <Layers3 className="h-3.5 w-3.5 text-[var(--learn-copper)]" />
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                  {t("Modules")}
                </dt>
                <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                  {modules.length}
                </dd>
              </div>
              <div className="flex items-baseline gap-3 py-3">
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                  {t("Duration")}
                </dt>
                <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                  {course.durationText}
                </dd>
              </div>
              <div className="flex items-baseline gap-3 py-3">
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                  {t("Difficulty")}
                </dt>
                <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                  {t(humanizeLabel(course.difficulty))}
                </dd>
              </div>
              <div className="flex items-baseline gap-3 py-3">
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                  {t("Pass score")}
                </dt>
                <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                  {tf("{score}%", { score: course.passingScore })}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              {canStart ? (
                <ActionLink
                  href={getLearnCourseRoomUrl(course.id)}
                  label={t("Open learning room")}
                />
              ) : null}
              {viewer.user ? (
                <ActionLink
                  href={getAccountLearnUrl(canStart ? "active" : "overview")}
                  label={t("View in HenryCo account")}
                  variant="secondary"
                />
              ) : null}
              {!canStart && viewer.user ? (
                <form action={enrollInCourseAction}>
                  <input type="hidden" name="courseId" value={course.id} />
                  <PendingSubmitButton
                    pendingLabel={
                      course.accessModel === "paid"
                        ? t("Reserving your seat...")
                        : t("Enrolling you now...")
                    }
                  >
                    {course.accessModel === "paid"
                      ? t("Reserve your seat")
                      : t("Start this course")}
                  </PendingSubmitButton>
                </form>
              ) : null}
              {!viewer.user ? (
                <ActionLink href={signInHref} label={t("Sign in to enroll")} variant="secondary" />
              ) : null}
              {viewer.user ? (
                <form action={toggleSavedCourseAction}>
                  <input type="hidden" name="courseId" value={course.id} />
                  <PendingSubmitButton
                    variant="secondary"
                    pendingLabel={
                      saved ? t("Updating saved list...") : t("Saving course...")
                    }
                  >
                    {saved ? t("Saved") : t("Save course")}
                  </PendingSubmitButton>
                </form>
              ) : null}
            </div>
            {enrollment?.status === "awaiting_payment" ? (
              <p className="mt-4 border-l-2 border-amber-400/55 pl-4 text-sm leading-7 text-amber-200">
                {t(
                  "We're confirming your payment. Your seat is held—this page will unlock fully as soon as your HenryCo account shows a completed payment.",
                )}
              </p>
            ) : null}
          </aside>
        </div>
      </section>

      {/* How this course works — editorial 4-col with hairlines, no panel */}
      <section className="mt-16">
        <LearnSectionIntro
          kicker={t("What to expect")}
          title={t("How this course works on HenryCo Learn")}
          body={t(
            "Lessons are meant to be taken in order. When you're enrolled, each step unlocks as you finish the one before it. If this program includes a certificate, you'll see exactly what you must complete—including any final quiz and passing score—inside your learning room and in your HenryCo account.",
          )}
        />
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 sm:divide-x sm:divide-[var(--learn-line)] lg:grid-cols-4">
          {[
            {
              label: t("Progress"),
              body: t(
                "Saved automatically. Resume from this course page or from Learn in your HenryCo account.",
              ),
            },
            {
              label: t("Quiz"),
              body: quiz
                ? tf(
                    "Opens after all lessons. Pass at {score}% (up to {attempts} attempts on this program).",
                    { score: quiz.passScore, attempts: quiz.maxAttempts },
                  )
                : t(
                    "This course may be completion-based only—check the learning room for details.",
                  ),
            },
            {
              label: t("Certificate"),
              body: course.certification
                ? t(
                    "Eligible learners receive a downloadable certificate and a verification code employers or partners can check online.",
                  )
                : t(
                    "This track may not include a credential; you still get a full record of completion in your account where applicable.",
                  ),
            },
            {
              label: t("Next step"),
              body: canStart
                ? t("Open your learning room to continue the next unlocked lesson.")
                : viewer.user
                  ? t("Enroll to unlock the full sequence.")
                  : t("Sign in with your HenryCo account, then enroll to begin."),
            },
          ].map((item, i) => (
            <li key={item.label} className={i > 0 ? "sm:pl-6 lg:pl-8" : ""}>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--learn-copper)]">
                {item.label}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Modules + sidebar — editorial split */}
      <section className="mt-16 grid gap-12 xl:grid-cols-[1.2fr,0.8fr]">
        <div>
          <LearnSectionIntro
            kicker={t("Course structure")}
            title={t("Lessons in order—so you always know what's next.")}
            body={courseCompletionRule}
          />
          <div className="mt-8 space-y-10">
            {modulesLocalized.map((module, moduleIndex) => (
              <div key={module.id}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-copper)]">
                    {tf("Module {number}", { number: String(moduleIndex + 1).padStart(2, "0") })}
                  </span>
                  <span className="h-px flex-1 bg-[var(--learn-line)]" />
                </div>
                <h3 className="mt-4 text-[1.45rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.7rem]">
                  {module.title}
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--learn-ink-soft)]">
                  {module.summary}
                </p>
                <ul className="mt-5 divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
                  {module.lessons.map((lesson) => {
                    const locked = !lesson.preview && !canStart;
                    return (
                      <li key={lesson.id} className="py-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="text-[1rem] font-semibold leading-snug tracking-tight text-[var(--learn-ink)]">
                              {lesson.title}
                            </h4>
                            <p className="mt-1.5 text-sm leading-7 text-[var(--learn-ink-soft)]">
                              {lesson.summary}
                            </p>
                          </div>
                          <LearnStatusBadge
                            label={
                              locked ? t("Locked") : lesson.preview ? t("Preview") : t("Included")
                            }
                            tone={locked ? "warning" : "signal"}
                          />
                        </div>
                        {!locked ? (
                          <div className="mt-4 max-w-3xl border-l border-[var(--learn-line)] pl-4">
                            <LearnMarkdown value={lesson.bodyMarkdown} />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {quiz ? (
            <div className="mt-12 border-l-2 border-[var(--learn-copper)]/55 pl-5">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-[var(--learn-copper)]" />
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-copper)]">
                  {t("Final assessment")}
                </p>
              </div>
              <h3 className="mt-3 text-[1.3rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.5rem]">
                {quizTitle || quiz.title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--learn-ink-soft)]">
                {quizDescription || quiz.description}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                {tf("Assessment questions: {count} • Pass score: {score}%", {
                  count: questions.length,
                  score: quiz.passScore,
                })}
              </p>
            </div>
          ) : null}
        </div>

        {/* Sidebar — instructor + reviews + paths, editorial blocks with hairlines */}
        <aside className="space-y-12">
          {instructor ? (
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-copper)]">
                {t("Instructor spotlight")}
              </p>
              <h3 className="mt-4 text-[1.25rem] font-semibold leading-tight tracking-tight text-[var(--learn-ink)]">
                {instructorFullName || instructor.fullName}
              </h3>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                {instructorTitle || instructor.title}
              </p>
              <p className="mt-4 text-sm leading-7 text-[var(--learn-ink-soft)]">
                {instructorBio || instructor.bio}
              </p>
              <p className="mt-5 border-l-2 border-[var(--learn-copper)]/55 pl-4 text-sm italic leading-7 text-[var(--learn-ink)]">
                &ldquo;{instructorSpotlightQuote || instructor.spotlightQuote}&rdquo;
              </p>
            </div>
          ) : null}

          {reviews.length > 0 ? (
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-copper)]">
                {t("Learner feedback")}
              </p>
              <ul className="mt-4 divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
                {reviewsLocalized.map((review) => (
                  <li key={review.id} className="py-5">
                    <div className="flex items-center gap-2">
                      <Quote className="h-3.5 w-3.5 text-[var(--learn-copper)]" />
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-copper)]">
                        {review.rating}/5
                      </span>
                    </div>
                    <h4 className="mt-2 text-[1rem] font-semibold leading-snug tracking-tight text-[var(--learn-ink)]">
                      {review.title}
                    </h4>
                    <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                      {review.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {paths.length > 0 ? (
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-copper)]">
                {t("Included in these paths")}
              </p>
              <ul className="mt-4 divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
                {pathsLocalized.map((path) => (
                  <li key={path.id} className="py-4">
                    <h4 className="text-[1rem] font-semibold leading-snug tracking-tight text-[var(--learn-ink)]">
                      {path.title}
                    </h4>
                    <p className="mt-1.5 text-sm leading-7 text-[var(--learn-ink-soft)]">
                      {path.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </section>

      {related.length > 0 ? (
        <section className="mt-16">
          <LearnSectionIntro
            kicker={t("Related programs")}
            title={t("Keep going with courses in the same lane.")}
            body={t(
              "These picks are curated to match the topic you're viewing—same clear structure, same account-wide progress.",
            )}
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {related.map((item) => (
              <CourseCard
                key={item.id}
                course={item}
                href={`/courses/${item.slug}`}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
