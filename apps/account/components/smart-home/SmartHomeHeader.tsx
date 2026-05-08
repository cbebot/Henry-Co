import { PageHeader as ShellPageHeader } from "@henryco/dashboard-shell";

/**
 * SmartHomeHeader — content-first lead. Closes anti-pattern #17.
 *
 * No "Welcome to your dashboard". The header reads:
 *
 *   "{firstName ?? 'You'} · {N} unread signal{s} · {M} need attention · last activity {timeAgo}"
 *
 * If the viewer has zero signals AND zero attention items AND no last
 * activity, the description falls back to the lifecycle teaching
 * surface instead of a hollow welcome string.
 */
export type SmartHomeHeaderProps = {
  firstName: string | null;
  unreadCount: number;
  attentionCount: number;
  lastActivityIso: string | null;
  fallbackBody?: string;
};

export function SmartHomeHeader({
  firstName,
  unreadCount,
  attentionCount,
  lastActivityIso,
  fallbackBody,
}: SmartHomeHeaderProps) {
  const lead = buildLead({ unreadCount, attentionCount, lastActivityIso });
  const title = firstName ? firstName : "Your dashboard";
  const description = lead || fallbackBody || "Live signals across HenryCo will surface here as they land.";
  return <ShellPageHeader title={title} description={description} />;
}

function buildLead({
  unreadCount,
  attentionCount,
  lastActivityIso,
}: {
  unreadCount: number;
  attentionCount: number;
  lastActivityIso: string | null;
}): string | null {
  const parts: string[] = [];
  if (unreadCount > 0) {
    parts.push(`${unreadCount} unread signal${unreadCount === 1 ? "" : "s"}`);
  }
  if (attentionCount > 0) {
    parts.push(`${attentionCount} need${attentionCount === 1 ? "s" : ""} attention`);
  }
  const last = lastActivityIso ? formatLastActivity(lastActivityIso) : null;
  if (last) parts.push(`last activity ${last}`);
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

function formatLastActivity(iso: string): string | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const diffMs = Math.max(0, Date.now() - t);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
