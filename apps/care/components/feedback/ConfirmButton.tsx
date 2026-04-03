"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import { emitCareToast } from "@/components/feedback/CareToaster";
import { CareLoadingGlyph } from "@/components/ui/CareLoading";

type ConfirmButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmTitle: string;
  confirmDescription?: string;
  pendingLabel?: string;
};

export default function ConfirmButton({
  confirmTitle,
  confirmDescription,
  pendingLabel,
  onClick,
  children,
  disabled,
  ...props
}: ConfirmButtonProps) {
  const { pending } = useFormStatus();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (pending || disabled) {
      return;
    }

    const confirmed = window.confirm(
      confirmDescription ? `${confirmTitle}\n\n${confirmDescription}` : confirmTitle
    );

    if (!confirmed) {
      event.preventDefault();
      event.stopPropagation();
      emitCareToast({
        tone: "warning",
        title: "Action cancelled",
        description: "No changes were applied.",
      });
      return;
    }

    onClick?.(event);
  }

  return (
    <button
      {...props}
      disabled={disabled || pending}
      onClick={handleClick}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <CareLoadingGlyph size="sm" className="text-current" />
          <span>{pendingLabel || children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
