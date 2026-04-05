"use client";

const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || "";

export default function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  if (LOGO_URL) {
    return (
      <img
        src={LOGO_URL}
        alt="Henry & Co."
        width={size}
        height={size}
        className={`object-contain ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-[var(--acct-gold)] font-bold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      H
    </div>
  );
}
