"use client";

import { Eye } from "lucide-react";
import { useTransition } from "react";
import { startImpersonationAction } from "./actions";

export function ImpersonateButton({
  targetUserId,
  targetName,
  disabled,
}: {
  targetUserId: string;
  targetName: string;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={disabled || pending}
      onClick={() =>
        startTransition(() => startImpersonationAction({ targetUserId }))
      }
      className="care-button-primary mt-auto flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Eye className="h-4 w-4" />
      {pending ? "Switching..." : `View as ${targetName}`}
    </button>
  );
}
