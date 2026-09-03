"use client";

import { useState } from "react";
import { translateSurfaceLabel, useHenryCoLocale } from "@henryco/i18n";
import { ButtonPendingContent } from "@henryco/ui";
import { toast } from "@henryco/ui/feedback";
import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const handleMarkAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      // V3-DASH-TOAST-02: clean confirmation popup, not a feed notification.
      if (res.ok) toast.success(t("All notifications marked read"), { id: "notif-mark-all" });
      else toast.error(t("Notification update failed."), { id: "notif-action-error" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMarkAll}
      disabled={loading}
      className="acct-button-ghost text-sm"
    >
      <ButtonPendingContent pending={loading} pendingLabel="Marking all read..." spinnerLabel="Marking all read">
        <>
          <CheckCheck size={14} />
          Mark all read
        </>
      </ButtonPendingContent>
    </button>
  );
}
