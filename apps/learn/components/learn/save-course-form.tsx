"use client";

import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { toast } from "@henryco/ui/feedback";
import { toggleSavedCourseAction } from "@/lib/learn/actions";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";

/**
 * V3-FEEDBACK-01 — save-course with real acknowledgement.
 *
 * Previously the server action revalidated and the only feedback was the
 * button label flipping somewhere below the fold — the weakest completion
 * feedback in the customer surfaces. The action itself is unchanged; this
 * client form awaits it and then acknowledges through the unified toast
 * (+ the Onyx chime on the save — never on removal).
 */
export function SaveCourseForm({
  courseId,
  saved,
}: {
  courseId: string;
  /** Whether the course is currently saved (the action toggles it). */
  saved: boolean;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const submit = async (formData: FormData) => {
    // The server action redirects on auth failure (the await then throws a
    // navigation, so no toast) and throws on a real failure.
    try {
      await toggleSavedCourseAction(formData);
    } catch (error) {
      // Next.js redirect/navigation signals must propagate untouched.
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("Couldn't update your saved courses."), {
        body: t("Please try again."),
      });
      return;
    }
    if (saved) {
      toast.success(t("Removed from saved courses"));
    } else {
      toast.success(t("Course saved"), {
        body: t("Find it under Saved in your learner home."),
        chime: true,
      });
    }
  };

  return (
    <form action={submit}>
      <input type="hidden" name="courseId" value={courseId} />
      <PendingSubmitButton
        variant="secondary"
        pendingLabel={saved ? t("Updating saved list...") : t("Saving course...")}
      >
        {saved ? t("Saved") : t("Save course")}
      </PendingSubmitButton>
    </form>
  );
}
