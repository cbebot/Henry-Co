"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type PropertyPendingButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  variant?: "primary" | "secondary";
  className?: string;
  idleIcon?: ReactNode;
};

export function PropertyPendingButton({
  idleLabel,
  pendingLabel,
  variant = "primary",
  className,
  idleIcon,
}: PropertyPendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      aria-busy={pending}
      className={cn(
        variant === "primary" ? "property-button-primary" : "property-button-secondary",
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold",
        pending && "cursor-wait opacity-80",
        className
      )}
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : idleIcon}
      <span>{pending ? pendingLabel : idleLabel}</span>
    </button>
  );
}
