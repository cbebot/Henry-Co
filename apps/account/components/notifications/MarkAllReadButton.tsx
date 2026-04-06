"use client";

import { useState } from "react";
import { ButtonPendingContent } from "@henryco/ui";
import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMarkAll = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
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
