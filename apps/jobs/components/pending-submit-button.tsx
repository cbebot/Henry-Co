"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  pendingLabel?: string;
  tone?: "primary" | "secondary";
};

const toneClassName = {
  primary: "jobs-button-primary",
  secondary: "jobs-button-secondary",
} as const;

export function PendingSubmitButton({
  children,
  pendingLabel = "Working...",
  tone = "primary",
  className = "",
  disabled,
  type = "submit",
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending}
      className={`${toneClassName[tone]} inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-70 ${className}`.trim()}
      {...props}
    >
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          <span>{pendingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
