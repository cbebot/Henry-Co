"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent } from "@henryco/ui";
import { toast } from "@henryco/ui/feedback";

type Props = {
  token: string;
};

/**
 * V3-ACTIONS-01 — undo an unsubscribe in place. The previous anchor was a
 * document GET to the API route (mutate + redirect + full reload); this
 * fetches the same endpoint's JSON mode, acknowledges with the
 * V3-FEEDBACK-01 toast, and soft-replaces the page state.
 */
export function ResubscribeButton({ token }: Props) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      let payload: Record<string, unknown> | null = null;
      let ok = false;
      try {
        const response = await fetch(
          `/api/care/preferences/unsubscribe?mode=resubscribe&token=${encodeURIComponent(token)}`,
          { headers: { Accept: "application/json", "x-henryco-async": "1" } }
        );
        payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        ok = response.ok && payload?.ok === true;
      } catch {
        payload = null;
      }

      if (!ok) {
        toast.error(t("Reminders could not be restored."), {
          body: t("The link may have expired. Contact support and we will restore them for you."),
        });
        return;
      }

      toast.success(t("Reminders are back on."), { chime: true });

      const next = new URLSearchParams({ mode: "resubscribe", status: "success" });
      if (typeof payload?.email === "string" && payload.email) next.set("email", payload.email);
      if (typeof payload?.phone === "string" && payload.phone) next.set("phone", payload.phone);
      next.set("token", token);
      router.replace(`/unsubscribe?${next.toString()}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={pending}
      aria-busy={pending}
      className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[color:var(--home-accent-text)] underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-80"
    >
      <ButtonPendingContent
        pending={pending}
        pendingLabel={t("Restoring reminders")}
        spinnerLabel={t("Restoring reminders")}
        indicatorSize="sm"
      >
        <span className="inline-flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          {t("Undo and keep reminders on")}
        </span>
      </ButtonPendingContent>
    </button>
  );
}
