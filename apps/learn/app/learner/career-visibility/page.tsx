import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createDivisionMetadata } from "@henryco/config";
import { getLearnToEarnCopy } from "@henryco/i18n";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { LearnEmptyState, LearnSectionIntro } from "@/components/learn/ui";
import { CareerVisibilityClient } from "@/components/learn/CareerVisibilityClient";
import { getLearnerCareerVisibility } from "@/lib/learn/career-visibility-data";
import { getSharedAuthUrl } from "@/lib/learn/links";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLearnPublicLocale();
  const copy = getLearnToEarnCopy(locale);
  return createDivisionMetadata("learn", {
    title: copy.optin.title,
    description: copy.optin.body,
    path: "/learner/career-visibility",
  });
}

export default async function CareerVisibilityPage() {
  const locale = await getLearnPublicLocale();
  const copy = getLearnToEarnCopy(locale);

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(getSharedAuthUrl("login", "/learner/career-visibility"));
  }

  const courses = await getLearnerCareerVisibility(user.id);

  const items = await Promise.all(
    courses.map(async (course) => ({
      courseId: course.courseId,
      slug: course.slug,
      listed: course.listed,
      title: await resolveLocalizedDynamicField({
        record: course.record ?? undefined,
        field: "title",
        locale,
        fallback: course.title,
      }),
    })),
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <LearnSectionIntro kicker={copy.optin.eyebrow} title={copy.optin.title} body={copy.optin.body} />

      <div className="mt-8">
        {items.length === 0 ? (
          <LearnEmptyState title={copy.optin.title} body={copy.optin.empty} />
        ) : (
          <CareerVisibilityClient
            items={items}
            copy={{
              listLabel: copy.optin.listLabel,
              unlistLabel: copy.optin.unlistLabel,
              consentNote: copy.optin.consentNote,
              listedStatus: copy.optin.listedStatus,
              notListedStatus: copy.optin.notListedStatus,
            }}
          />
        )}
      </div>
    </main>
  );
}
