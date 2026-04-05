"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { initials } from "@/lib/format";

type UserAvatarProps = {
  name: string | null;
  src: string | null;
  size?: number;
  roundedClassName?: string;
  className?: string;
};

export default function UserAvatar({
  name,
  src,
  size = 40,
  roundedClassName = "rounded-full",
  className = "",
}: UserAvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name ? `${name} avatar` : "Account avatar"}
        width={size}
        height={size}
        className={`${roundedClassName} border border-[var(--acct-line)] object-cover ${className}`}
      />
    );
  }

  if (name) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--acct-gold-soft)] text-sm font-bold text-[var(--acct-gold)] ${roundedClassName} ${className}`}
        style={{ width: size, height: size }}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-[var(--acct-surface)] text-[var(--acct-muted)] ${roundedClassName} ${className}`}
      style={{ width: size, height: size }}
    >
      <User size={Math.max(16, Math.floor(size * 0.42))} />
    </div>
  );
}
