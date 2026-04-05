"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [pending, setPending] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const form = button?.form;
    if (!button || !form) return;

    const handleSubmit = () => setPending(true);
    const handleInvalid = () => setPending(false);
    const handlePageShow = () => setPending(false);

    form.addEventListener("submit", handleSubmit);
    form.addEventListener("invalid", handleInvalid, true);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      form.removeEventListener("submit", handleSubmit);
      form.removeEventListener("invalid", handleInvalid, true);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      type="submit"
      aria-disabled={pending}
      aria-busy={pending}
      className={cn(
        variant === "primary" ? "property-button-primary" : "property-button-secondary",
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold",
        pending && "pointer-events-none cursor-wait opacity-80",
        className
      )}
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : idleIcon}
      <span>{pending ? pendingLabel : idleLabel}</span>
    </button>
  );
}
