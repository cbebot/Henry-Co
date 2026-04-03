import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CheckCheck,
  CircleAlert,
  Info,
  ShieldAlert,
} from "lucide-react";
import { markRoleNotificationsReadAction } from "@/app/(staff)/actions";
import type { RoleNotificationCenter, RoleNotificationItem } from "@/lib/notifications";
import { roleLabel } from "@/lib/staff-shell";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toneClasses(tone: RoleNotificationItem["tone"]) {
  if (tone === "critical") {
    return {
      icon: ShieldAlert,
      pill: "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100",
      card: "border-red-300/22 bg-red-500/[0.08]",
    };
  }

  if (tone === "warning") {
    return {
      icon: CircleAlert,
      pill: "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100",
      card: "border-amber-300/22 bg-amber-500/[0.07]",
    };
  }

  if (tone === "success") {
    return {
      icon: CheckCheck,
      pill: "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100",
      card: "border-emerald-300/22 bg-emerald-500/[0.08]",
    };
  }

  return {
    icon: Info,
    pill: "border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100",
    card: "border-cyan-300/22 bg-cyan-500/[0.07]",
  };
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.8rem] border border-black/10 bg-black/[0.03] px-5 py-6 text-sm leading-7 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
      {children}
    </div>
  );
}

export default function NotificationCenterPanel({
  center,
  mode = "full",
  sourceRoute,
}: {
  center: RoleNotificationCenter;
  mode?: "summary" | "full";
  sourceRoute: string;
}) {
  const visibleItems = mode === "summary" ? center.items.slice(0, 3) : center.items;
  const title =
    mode === "summary"
      ? `${roleLabel(center.role)} notifications`
      : `${roleLabel(center.role)} notification center`;

  return (
    <section className="rounded-[2.2rem] border border-black/10 bg-white/82 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/18 bg-[color:var(--accent)]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
            <BellRing className="h-4 w-4" />
            {title}
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
            {center.unreadCount > 0
              ? `${center.unreadCount} unread operational alert${center.unreadCount === 1 ? "" : "s"}`
              : "No unread operational alerts"}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-white/65">
            Notifications are grouped around the work this role actually owns, so critical issues do
            not disappear inside a generic dashboard stream.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {mode === "summary" ? (
            <Link
              href={`/${center.role}/notifications`}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              Open center
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}

          {mode === "full" && center.unreadCount > 0 ? (
            <form action={markRoleNotificationsReadAction}>
              <input type="hidden" name="role" value={center.role} />
              <input type="hidden" name="section" value="all" />
              <input type="hidden" name="source_route" value={sourceRoute} />
              <input type="hidden" name="unread_count" value={center.unreadCount} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
              >
                <CheckCheck className="h-4 w-4 text-[color:var(--accent)]" />
                Mark all as read
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => {
            const tone = toneClasses(item.tone);
            const Icon = tone.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "group rounded-[1.8rem] border px-5 py-5 transition hover:-translate-y-[1px] hover:border-[color:var(--accent)]/32",
                  tone.card
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex h-11 w-11 items-center justify-center rounded-2xl border",
                      tone.pill
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                      tone.pill
                    )}
                  >
                    {item.group}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold text-zinc-950 dark:text-white">
                      {item.title}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
                      {item.body}
                    </p>
                  </div>

                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-[color:var(--accent)] dark:text-white/35" />
                </div>
              </Link>
            );
          })
        ) : (
          <EmptyState>
            Everything currently visible for this role has already been handled, or there are no
            open operational alerts to escalate.
          </EmptyState>
        )}
      </div>
    </section>
  );
}
