import { notFound } from "next/navigation";
import { Layers3, Quote, Star } from "lucide-react";
import { formatSurfaceTemplate, translateSurfaceLabel } from "@henryco/i18n/server";
import { getCourseBySlug } from "@/lib/learn/data";
import { getLearnViewer } from "@/lib/learn/auth";
import { enrollInCourseAction, toggleSavedCourseAction } from "@/lib/learn/actions";
import { getAccountLearnUrl, getLearnCourseRoomUrl, getSharedAuthUrl } from "@/lib/learn/links";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";
import { ActionLink, CourseCard, humanizeLabel, LearnMarkdown, LearnPanel, LearnSectionIntro, LearnStatusBadge } from "@/components/learn/ui";

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

  const { course, category, instructor, modules, quiz, questions, reviews, related, paths, enrollment, saved, averageRating } = data;
  const canStart = enrollment && ["active", "completed"].includes(enrollment.status);
  const signInHref = getSharedAuthUrl("login", `/courses/${course.slug}`);
  const visibilityLabel =
    course.visibility === "public"
      ? t("Public access")
      : course.visibility === "internal"
        ? t("Assigned access")
        : t("Private access");

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <section className="learn-panel learn-hero rounded-[2.8rem] p-8 sm:p-10 xl:p-12">
        <div className="flex flex-wrap items-center gap-2">
          <LearnStatusBadge label={visibilityLabel} tone={course.visibility === "public" ? "signal" : "warning"} />
          <LearnStatusBadge label={course.accessModel === "free" ? t("Free") : course.accessModel === "paid" ? t("Paid") : t("Sponsored")} tone={course.accessModel === "free" ? "success" : "neutral"} />
          {course.certification ? <LearnStatusBadge label={t("Certificate")} tone="signal" /> : null}
          {category ? <LearnStatusBadge label={t(category.name)} /> : null}
        </div>
        <h1 className="learn-heading mt-6 text-[3rem] text-[var(--learn-ink)] sm:text-[4.2rem]">{course.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--learn-ink-soft)]">{course.subtitle}</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-[2rem] border border-[var(--learn-line)] bg-white/5 p-5">
            <p className="text-sm leading-8 text-[var(--learn-ink-soft)]">{course.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[var(--learn-line)] px-3 py-1 text-xs font-semibold text-[var(--learn-ink-soft)]">{tag}</span>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-[var(--learn-line)] bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">{t("Average rating")}</p>
                <p className="mt-2 flex items-center gap-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]"><Star className="h-5 w-5 text-[var(--learn-copper)]" /> {averageRating || t("New")}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">{t("Modules")}</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{modules.length}</p>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm text-[var(--learn-ink-soft)]">
              <p>{course.durationText}</p>
              <p>{t(humanizeLabel(course.difficulty))}</p>
              <p>{tf("Pass score: {score}%", { score: course.passingScore })}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {canStart ? <ActionLink href={getLearnCourseRoomUrl(course.id)} label={t("Open learning room")} /> : null}
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
                  <PendingSubmitButton pendingLabel={course.accessModel === "paid" ? t("Reserving your seat...") : t("Enrolling you now...")}>
                    {course.accessModel === "paid" ? t("Reserve your seat") : t("Start this course")}
                  </PendingSubmitButton>
                </form>
              ) : null}
              {!viewer.user ? <ActionLink href={signInHref} label={t("Sign in to enroll")} variant="secondary" /> : null}
              {viewer.user ? (
                <form action={toggleSavedCourseAction}>
                  <input type="hidden" name="courseId" value={course.id} />
                  <PendingSubmitButton variant="secondary" pendingLabel={saved ? t("Updating saved list...") : t("Saving course...")}>
                    {saved ? t("Saved") : t("Save course")}
                  </PendingSubmitButton>
                </form>
              ) : null}
            </div>
            {enrollment?.status === "awaiting_payment" ? (
              <p className="mt-4 text-sm text-amber-200">
                {t("We’re confirming your payment. Your seat is held—this page will unlock fully as soon as your HenryCo account shows a completed payment.")}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <LearnPanel className="rounded-[2rem] p-7">
          <LearnSectionIntro
            kicker={t("What to expect")}
            title={t("How this course works on HenryCo Learn")}
            body={t("Lessons are meant to be taken in order. When you’re enrolled, each step unlocks as you finish the one before it. If this program includes a certificate, you’ll see exactly what you must complete—including any final quiz and passing score—inside your learning room and in your HenryCo account.")}
          />
          <ul className="mt-6 grid gap-4 text-sm leading-7 text-[var(--learn-ink-soft)] sm:grid-cols-2">
            <li className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
              <span className="font-semibold text-[var(--learn-ink)]">{t("Progress")}</span>
              <span className="mt-2 block">{t("Saved automatically. Resume from this course page or from Learn in your HenryCo account.")}</span>
            </li>
            <li className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
              <span className="font-semibold text-[var(--learn-ink)]">{t("Quiz")}</span>
              <span className="mt-2 block">
                {quiz
                  ? tf("Opens after all lessons. Pass at {score}% (up to {attempts} attempts on this program).", { score: quiz.passScore, attempts: quiz.maxAttempts })
                  : t("This course may be completion-based only—check the learning room for details.")}
              </span>
            </li>
            <li className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
              <span className="font-semibold text-[var(--learn-ink)]">{t("Certificate")}</span>
              <span className="mt-2 block">
                {course.certification
                  ? t("Eligible learners receive a downloadable certificate and a verification code employers or partners can check online.")
                  : t("This track may not include a credential; you still get a full record of completion in your account where applicable.")}
              </span>
            </li>
            <li className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
              <span className="font-semibold text-[var(--learn-ink)]">{t("Next step")}</span>
              <span className="mt-2 block">
                {canStart
                  ? t("Open your learning room to continue the next unlocked lesson.")
                  : viewer.user
                    ? t("Enroll to unlock the full sequence.")
                    : t("Sign in with your HenryCo account, then enroll to begin.")}
              </span>
            </li>
          </ul>
        </LearnPanel>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <LearnPanel className="rounded-[2rem] p-7">
          <LearnSectionIntro
            kicker={t("Course structure")}
            title={t("Lessons in order—so you always know what’s next.")}
            body={course.completionRule}
          />
          <div className="mt-8 space-y-4">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="rounded-[1.6rem] border border-[var(--learn-line)] bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-[var(--learn-line)] bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--learn-mint-soft)]">{tf("Module {number}", { number: moduleIndex + 1 })}</div>
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">{module.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">{module.summary}</p>
                <div className="mt-4 space-y-4">
                  {module.lessons.map((lesson) => {
                    const locked = !lesson.preview && !canStart;
                    return (
                      <div key={lesson.id} className="rounded-[1.4rem] border border-[var(--learn-line)] bg-black/10 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-[var(--learn-ink)]">{lesson.title}</div>
                            <div className="mt-1 text-sm text-[var(--learn-ink-soft)]">{lesson.summary}</div>
                          </div>
                          <LearnStatusBadge label={locked ? t("Locked") : lesson.preview ? t("Preview") : t("Included")} tone={locked ? "warning" : "signal"} />
                        </div>
                        {!locked ? <div className="mt-4"><LearnMarkdown value={lesson.bodyMarkdown} /></div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {quiz ? (
            <div className="mt-8 rounded-[1.8rem] border border-[var(--learn-line)] bg-white/5 p-5">
              <div className="flex items-center gap-3 text-[var(--learn-ink)]">
                <Layers3 className="h-5 w-5 text-[var(--learn-copper)]" />
                <h3 className="text-xl font-semibold tracking-[-0.03em]">{quiz.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">{quiz.description}</p>
              <p className="mt-2 text-sm text-[var(--learn-ink-soft)]">{tf("Assessment questions: {count} • Pass score: {score}%", { count: questions.length, score: quiz.passScore })}</p>
            </div>
          ) : null}
        </LearnPanel>

        <div className="space-y-6">
          <LearnPanel className="rounded-[2rem]">
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">{t("Instructor spotlight")}</h3>
            {instructor ? (
              <>
                <p className="mt-4 text-lg font-semibold text-[var(--learn-ink)]">{instructor.fullName}</p>
                <p className="mt-1 text-sm text-[var(--learn-ink-soft)]">{instructor.title}</p>
                <p className="mt-4 text-sm leading-7 text-[var(--learn-ink-soft)]">{instructor.bio}</p>
                <p className="mt-4 rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4 text-sm italic text-[var(--learn-ink)]">“{instructor.spotlightQuote}”</p>
              </>
            ) : null}
          </LearnPanel>

          {reviews.length > 0 ? (
            <LearnPanel className="rounded-[2rem]">
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">{t("Learner feedback")}</h3>
              <div className="mt-5 space-y-4">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-[var(--learn-copper)]"><Quote className="h-4 w-4" /> {review.rating}/5</div>
                    <div className="mt-2 font-semibold text-[var(--learn-ink)]">{review.title}</div>
                    <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{review.body}</p>
                  </div>
                ))}
              </div>
            </LearnPanel>
          ) : null}

          {paths.length > 0 ? (
            <LearnPanel className="rounded-[2rem]">
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">{t("Included in these paths")}</h3>
              <div className="mt-4 space-y-3">
                {paths.map((path) => (
                  <div key={path.id} className="rounded-[1.4rem] border border-[var(--learn-line)] bg-white/5 p-4">
                    <div className="font-semibold text-[var(--learn-ink)]">{path.title}</div>
                    <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{path.summary}</p>
                  </div>
                ))}
              </div>
            </LearnPanel>
          ) : null}
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mt-10">
          <LearnSectionIntro
            kicker={t("Related programs")}
            title={t("Keep going with courses in the same lane.")}
            body={t("These picks are curated to match the topic you’re viewing—same clear structure, same account-wide progress.")}
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {related.map((item) => (
              <CourseCard key={item.id} course={item} href={`/courses/${item.slug}`} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
