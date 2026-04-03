import { CourseCard, LearnPanel, LearnSectionIntro } from "@/components/learn/ui";
import { getPublicAcademyData } from "@/lib/learn/data";

export const metadata = { title: "Certifications - HenryCo Learn" };

export default async function CertificationsPage() {
  const academy = await getPublicAcademyData();
  const certifications = academy.courses.filter((course) => course.certification);

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro
        kicker="Certifications"
        title="Programs designed for measurable completion and public trust."
        body="HenryCo Learn certifications combine lessons, assessments, score tracking, and certificate verification so the result is operationally meaningful, not decorative."
      />

      <LearnPanel className="mt-8 rounded-[2rem]">
        <form action="/certifications/verify" className="grid gap-4 md:grid-cols-[1fr,auto]">
          <input name="code" placeholder="Enter certificate verification code" className="learn-input rounded-2xl px-4 py-3" />
          <button type="submit" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">Verify certificate</button>
        </form>
      </LearnPanel>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {certifications.map((course) => (
          <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} />
        ))}
      </div>
    </main>
  );
}
