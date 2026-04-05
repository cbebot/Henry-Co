"use client";

import type { ButtonHTMLAttributes } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

type CertificateDownloadButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  variant?: "primary" | "secondary";
};

export function CertificateDownloadButton({
  label = "Download certificate",
  className,
  type = "button",
  variant = "primary",
  onClick,
  ...props
}: CertificateDownloadButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        variant === "primary" ? "learn-button-primary" : "learn-button-secondary",
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold",
        className
      )}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        window.print();
      }}
      {...props}
    >
      <Download className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
