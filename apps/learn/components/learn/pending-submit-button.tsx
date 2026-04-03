"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type PendingSubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
};

export function PendingSubmitButton({
  children,
  pendingLabel = "Working...",
  variant = "primary",
  className,
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
      className={cn(
        variant === "primary" ? "learn-button-primary" : "learn-button-secondary",
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70",
        className
      )}
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
