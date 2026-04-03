"use client";

import { useFormStatus } from "react-dom";

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
      className="studio-button-primary inline-flex items-center justify-center rounded-full px-6 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
