"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "../lib/cn";

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export function AvatarFallback({
  src,
  alt,
  displayName,
  size = "md",
  className,
}: {
  src?: string | null;
  alt?: string;
  displayName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const cleanSrc = typeof src === "string" && src.trim() ? src.trim() : null;
  const showImage = cleanSrc && !failed;

  const sizeClasses = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-12 w-12 text-sm",
  };

  const imageSizes = { sm: "32px", md: "40px", lg: "48px" };

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-teal-600 font-bold text-white ring-2 ring-white/80 dark:from-amber-500 dark:to-teal-500 dark:ring-zinc-800",
        sizeClasses[size],
        className
      )}
    >
      {showImage ? (
        <Image
          src={cleanSrc}
          alt={alt || `${displayName} avatar`}
          fill
          className="object-cover"
          sizes={imageSizes[size]}
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        getInitials(displayName)
      )}
    </span>
  );
}
