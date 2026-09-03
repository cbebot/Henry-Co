"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormDraft } from "@henryco/lifecycle/drafts";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent } from "@henryco/ui";
import { toast } from "@henryco/ui/feedback";

type Props = {
  projectId: string;
  projectTitle: string;
  redirectPath: string;
};

/**
 * V3-ACTIONS-01 — in-place support request from the studio project page.
 * Progressive enhancement over the native post to /api/support/create:
 * pending on the control, V3-FEEDBACK-01 toast on completion, draft-preserved
 * message (V3-01), soft refresh — no document reload.
 */
export function StudioSupportRequestForm({ projectId, projectTitle, redirectPath }: Props) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const draft = useFormDraft<{ body: string }>(`studio-support-${projectId}`, { body: "" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);

    setPending(true);
    try {
      let payload: Record<string, unknown> | null = null;
      let ok = false;
      try {
        const response = await fetch("/api/support/create", {
          method: "POST",
          headers: { Accept: "application/json", "x-henryco-async": "1" },
          body: formData,
        });
        payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        ok = response.ok && payload?.ok === true;
      } catch {
        payload = null;
      }

      if (!ok) {
        toast.error(t("Support request could not be sent."), {
          body:
            typeof payload?.error === "string"
              ? payload.error
              : t("Your message is preserved. Try again."),
        });
        return;
      }

      draft.discard();
      toast.success(t("Support thread opened."), {
        body: t("Replies arrive in your Henry Onyx account."),
        chime: true,
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action="/api/support/create"
      method="post"
      onSubmit={(event) => void handleSubmit(event)}
      className="mt-6 space-y-3"
      data-live-refresh-pause="true"
    >
      <input type="hidden" name="redirectTo" value={redirectPath} />
      <input type="hidden" name="subject" value={`Support request for ${projectTitle}`} />
      <input type="hidden" name="category" value="project" />
      <input type="hidden" name="priority" value="normal" />
      <input type="hidden" name="referenceType" value="studio_project" />
      <input type="hidden" name="referenceId" value={projectId} />
      <textarea
        name="body"
        required
        rows={3}
        value={draft.value.body}
        onChange={(event) => draft.setValue({ body: event.target.value })}
        className="studio-textarea min-h-24 w-full rounded-[1.5rem] px-4 py-4"
        placeholder={t("Describe your question or concern — we'll respond in your account.")}
      />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="studio-button-primary inline-flex min-h-[52px] min-w-[200px] items-center justify-center rounded-full px-6 py-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-80"
      >
        <ButtonPendingContent
          pending={pending}
          pendingLabel={t("Opening…")}
          spinnerLabel={t("Opening support thread")}
          indicatorSize="sm"
          textClassName="font-semibold"
        >
          {t("Open support thread")}
        </ButtonPendingContent>
      </button>
    </form>
  );
}
