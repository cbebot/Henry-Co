"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { CareLoadingGlyph } from "@/components/ui/CareLoading";

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  pendingLabel?: string;
  icon?: ReactNode;
  pendingIcon?: ReactNode;
  variant?: "primary" | "secondary" | "danger";
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function variantClasses(variant: PendingSubmitButtonProps["variant"]) {
  if (variant === "secondary") {
    return "border border-black/10 bg-white text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white";
  }

  if (variant === "danger") {
    return "border border-red-300/30 bg-red-500/10 text-red-700 shadow-sm dark:text-red-100";
  }

  return "care-button-primary text-white";
}

export default function PendingSubmitButton({
  label,
  pendingLabel,
  icon,
  pendingIcon,
  variant = "primary",
  className,
  disabled,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={cn(
        "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent,#bb7542)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#071020] active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:translate-y-0",
        pending && "translate-y-[0.5px] saturate-90",
        variantClasses(variant),
        className
      )}
      {...props}
    >
      <span className="inline-flex items-center justify-center">
        {pending ? pendingIcon ?? <CareLoadingGlyph size="sm" className="text-current" /> : icon}
      </span>
      <span>{pending ? pendingLabel ?? `${label}...` : label}</span>
    </button>
  );
}
