"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { ButtonPendingContent } from "@henryco/ui";

export function TemplateReserveSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="portal-button portal-button-primary min-h-[52px] min-w-[248px] justify-center disabled:cursor-wait disabled:opacity-90"
    >
      <ButtonPendingContent
        pending={pending}
        pendingLabel="Reserving your slot..."
        spinnerLabel="Reserving your slot"
        indicatorSize="sm"
        textClassName="font-semibold"
        spinnerClassName="text-current"
      >
        <span className="inline-flex items-center gap-2">
          Reserve and continue to payment
          <ArrowRight className="h-4 w-4" />
        </span>
      </ButtonPendingContent>
    </button>
  );
}
