"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";
import { Archive, CheckCheck, MailOpen, Trash2 } from "lucide-react";

type NotificationLifecycleControlsProps = {
  notificationId: string;
  isRead: boolean;
  redirectOnDelete?: string;
  compact?: boolean;
};

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  compact,
  pending,
  pendingLabel,
}: {
  label: string;
  icon: typeof Archive;
  onClick: () => void;
  disabled: boolean;
  compact?: boolean;
  pending?: boolean;
  pendingLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-xs font-semibold text-[var(--acct-muted)] transition hover:border-[var(--acct-gold)]/30 hover:text-[var(--acct-ink)] disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? "px-2.5 py-1.5 text-[0.7rem]" : ""
      }`}
    >
      <ButtonPendingContent
        pending={Boolean(pending)}
        pendingLabel={pendingLabel}
        spinnerLabel={pendingLabel || `Updating ${label.toLowerCase()}`}
      >
        <>
          <Icon size={compact ? 13 : 14} />
          {label}
        </>
      </ButtonPendingContent>
    </button>
  );
}

export default function NotificationLifecycleControls({
  notificationId,
  isRead,
  redirectOnDelete,
  compact,
}: NotificationLifecycleControlsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (method: "POST" | "DELETE", path: string, action: string) => {
    setPendingAction(action);
    setError(null);
    try {
      const response = await fetch(path, { method });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Request failed");
      }

      if (action === "delete" && redirectOnDelete) {
        router.push(redirectOnDelete);
        return;
      }

      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Notification update failed."
      );
    } finally {
      setPendingAction(null);
    }
  };

  const busy = pendingAction !== null;

  return (
    <div className="flex flex-wrap gap-2">
      {error ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--acct-red-soft)] px-3 py-2 text-xs font-semibold text-[var(--acct-red)]">
          {error}
        </span>
      ) : null}
      <ActionButton
        label={isRead ? "Mark unread" : "Mark read"}
        icon={isRead ? MailOpen : CheckCheck}
        onClick={() =>
          void runAction(
            "POST",
            `/api/notifications/${notificationId}/${isRead ? "unread" : "read"}`,
            isRead ? "unread" : "read"
          )
        }
        disabled={busy}
        compact={compact}
        pending={pendingAction === (isRead ? "unread" : "read")}
        pendingLabel={isRead ? "Marking unread..." : "Marking read..."}
      />
      <ActionButton
        label="Archive"
        icon={Archive}
        onClick={() =>
          void runAction("POST", `/api/notifications/${notificationId}/archive`, "archive")
        }
        disabled={busy}
        compact={compact}
        pending={pendingAction === "archive"}
        pendingLabel="Archiving..."
      />
      <ActionButton
        label="Delete"
        icon={Trash2}
        onClick={() => void runAction("DELETE", `/api/notifications/${notificationId}`, "delete")}
        disabled={busy}
        compact={compact}
        pending={pendingAction === "delete"}
        pendingLabel="Deleting..."
      />
    </div>
  );
}
