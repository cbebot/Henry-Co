import { History } from "lucide-react";
import { createDataAdminClient, listUserAbandonedTasks } from "@henryco/data";
import { buildDivisionResumeModel } from "@henryco/dashboard-modules-account/resume";
import { NextStepRow } from "@henryco/dashboard-shell/surfaces";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getAccountAppLocale } from "@/lib/locale-server";

/**
 * DivisionResumeChip — SP6's "continue where you left off", scoped to one
 * division's landing.
 *
 * Renders NOTHING when the viewer has no pending journey in this division —
 * an empty resume chip would be exactly the fabricated urgency the voice
 * forbids. When a pending journey exists it renders the shared NextStepRow
 * (same primitive the landings already use) with the journey's REAL captured
 * continueUrl, so one tap lands back at the exact step. Attribution rides
 * utm_source=henryco_resume so the S8 deep-link telemetry can tell
 * resume-driven arrivals from organic ones.
 *
 * Server component: one indexed read (pending abandoned_tasks for this user),
 * shared with the dashboard widget's model builder so the two surfaces can
 * never disagree about what is resumable.
 */
export async function DivisionResumeChip({
  division,
  userId,
}: {
  division: string;
  userId: string;
}) {
  const [locale, model] = await Promise.all([
    getAccountAppLocale(),
    listUserAbandonedTasks(createDataAdminClient(), userId, {
      statuses: ["pending"],
      limit: 6,
    })
      .then((tasks) => buildDivisionResumeModel(tasks, division))
      .catch(() => null),
  ]);

  if (!model) return null;
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <NextStepRow
      kicker={t("Continue where you left off")}
      title={t(model.headline)}
      detail={t("Pick up exactly where you stopped — nothing was lost.")}
      icon={<History size={18} aria-hidden />}
      tone="attention"
      cta={{ label: t("Resume"), href: model.href }}
    />
  );
}
