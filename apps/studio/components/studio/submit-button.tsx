"use client";

import { useFormStatus } from "react-dom";
import { ButtonPendingContent } from "@henryco/ui";

export function StudioSubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="studio-button-primary inline-flex min-h-[52px] min-w-[200px] items-center justify-center rounded-full px-6 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-80"
    >
      <ButtonPendingContent
        pending={pending}
        pendingLabel={pendingLabel}
        spinnerLabel={pendingLabel}
        indicatorSize="sm"
        textClassName="font-semibold"
      >
        {label}
      </ButtonPendingContent>
    </button>
  );
}
