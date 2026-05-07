import Link from "next/link";
import Image from "next/image";
import { Bell, Sparkles } from "lucide-react";
import type { ClientPortalViewer } from "@/types/portal";

function getInitials(name: string | null, email: string | null) {
  const candidate = (name || email || "").trim();
  if (!candidate) return "S";
  const parts = candidate.split(/[\s@.]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || candidate[0]?.toUpperCase() || "S";
}

export function PortalMobileHeader({
  viewer,
  attentionCount,
}: {
  viewer: ClientPortalViewer;
  attentionCount: number;
}) {
  const initials = getInitials(viewer.fullName, viewer.email);

  return (
    <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[var(--studio-line)] bg-[color-mix(in_srgb,var(--studio-bg)_92%,transparent)] px-4 py-3 backdrop-blur-xl">
      <Link href="/client/dashboard" className="flex items-center gap-2.5 min-w-0">
        <span className="grid h-8 w-8 place-items-center rounded-xl border border-[var(--studio-line-strong)] bg-[linear-gradient(135deg,#dff8fb,#4eb8c2)] text-[#021016]">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="flex flex-col leading-tight min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">
            HenryCo
          </span>
          <span className="truncate text-[13px] font-semibold text-[var(--studio-ink)]">
            Studio portal
          </span>
        </span>
      </Link>

      <div className="flex items-center gap-2.5">
        <Link
          href="/client/dashboard"
          className="relative inline-grid h-9 w-9 place-items-center rounded-full border border-[var(--studio-line)] bg-[rgba(255,255,255,0.04)] text-[var(--studio-ink-soft)]"
          aria-label={`Notifications${attentionCount > 0 ? ` (${attentionCount})` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {attentionCount > 0 ? (
            <span className="absolute right-0.5 top-0.5 grid h-3.5 min-w-[0.875rem] place-items-center rounded-full bg-[#ff8f8f] px-1 text-[9px] font-bold text-[#02060a]">
              {attentionCount > 9 ? "9+" : attentionCount}
            </span>
          ) : null}
        </Link>
        <Link
          href="/client/profile"
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--studio-line-strong)] bg-[rgba(151,244,243,0.08)] text-[12px] font-semibold text-[var(--studio-signal)]"
          aria-label="Profile"
        >
          {viewer.avatarUrl ? (
            <Image
              src={viewer.avatarUrl}
              alt={viewer.fullName || "Profile"}
              width={36}
              height={36}
              unoptimized
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </Link>
      </div>
    </header>
  );
}
