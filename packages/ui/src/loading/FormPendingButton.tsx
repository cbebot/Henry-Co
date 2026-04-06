"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ButtonPendingContent } from "./ButtonPendingContent";

export function FormPendingButton({
  children,
  pendingLabel,
  spinnerLabel,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: ReactNode;
  spinnerLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button {...props} disabled={disabled || pending}>
      <ButtonPendingContent
        pending={pending}
        pendingLabel={pendingLabel}
        spinnerLabel={spinnerLabel}
      >
        {children}
      </ButtonPendingContent>
    </button>
  );
}
