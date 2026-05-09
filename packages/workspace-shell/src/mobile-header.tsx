import Link from "next/link";
import Image from "next/image";
import { Bell, Sparkles, type LucideIcon } from "lucide-react";
import type { WorkspaceBrand, WorkspaceViewer } from "./types";

export type WorkspaceMobileHeaderProps = {
  brand: WorkspaceBrand;
  viewer: WorkspaceViewer;
  attentionCount?: number;
  notificationsHref: string;
  profileHref: string;
};

function getInitials(viewer: WorkspaceViewer): string {
  if (viewer.initials) return viewer.initials;
  const candidate = (viewer.fullName || viewer.email || "").trim();
  if (!candidate) return "S";
  const parts = candidate.split(/[\s@.]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || candidate[0]?.toUpperCase() || "S";
}

/**
 * Mobile-only top bar. Hidden at lg+ via CSS. Shows the brand strip,
 * notifications bell (with attention count), and a profile chip.
 */
export function WorkspaceMobileHeader({
  brand,
  viewer,
  attentionCount = 0,
  notificationsHref,
  profileHref,
}: WorkspaceMobileHeaderProps) {
  const initials = getInitials(viewer);
  const BrandIcon: LucideIcon = brand.icon ?? Sparkles;
  const brandHref = brand.href ?? notificationsHref;

  return (
    <header className="ws-mobile-header">
      <Link href={brandHref} className="ws-mobile-brand">
        <span className="ws-mobile-brand-square" aria-hidden>
          <BrandIcon className="h-3.5 w-3.5" />
        </span>
        <span className="ws-mobile-brand-text">
          {brand.kicker ? <span className="ws-mobile-brand-kicker">{brand.kicker}</span> : null}
          <span className="ws-mobile-brand-name">{brand.shortName}</span>
        </span>
      </Link>

      <div className="ws-mobile-actions">
        <Link
          href={notificationsHref}
          className="ws-mobile-icon-button"
          aria-label={`Notifications${attentionCount > 0 ? ` (${attentionCount})` : ""}`}
        >
          <Bell className="h-4 w-4" aria-hidden />
          {attentionCount > 0 ? (
            <span className="ws-mobile-icon-badge">{attentionCount > 9 ? "9+" : attentionCount}</span>
          ) : null}
        </Link>
        <Link href={profileHref} className="ws-mobile-profile" aria-label="Profile">
          {viewer.avatarUrl ? (
            <Image
              src={viewer.avatarUrl}
              alt={viewer.fullName || "Profile"}
              width={36}
              height={36}
              unoptimized
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "9999px" }}
            />
          ) : (
            initials
          )}
        </Link>
      </div>
    </header>
  );
}
