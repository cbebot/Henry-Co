import { translateSurfaceLabel } from "@henryco/i18n/server";
import { LearnWorkspaceLoading } from "@/components/learn/loading-state";
import { getLearnPublicLocale } from "@/lib/locale-server";

export default async function OwnerLoading() {
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <LearnWorkspaceLoading
      kicker={t("Preparing academy operations")}
      title={t("Loading courses, learners, assignments, and communications.")}
      body={t("Bringing live academy records into one polished operations view so decisions stay grounded in the current state.")}
    />
  );
}
