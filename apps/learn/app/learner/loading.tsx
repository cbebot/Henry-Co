import { translateSurfaceLabel } from "@henryco/i18n/server";
import { LearnWorkspaceLoading } from "@/components/learn/loading-state";
import { getLearnPublicLocale } from "@/lib/locale-server";

export default async function LearnerLoading() {
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <LearnWorkspaceLoading
      kicker={t("Your courses")}
      title={t("Loading your progress and enrolled courses.")}
      body={t("Preparing your enrollments, lessons, and certificates.")}
    />
  );
}
