"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import {
  NOTIFICATION_TOAST_DISMISS_MS,
  projectChannelName,
} from "@/lib/messaging/constants";
import { excerpt } from "@/lib/messaging/utils";

type Notification = {
  id: string;
  projectId: string;
  projectTitle: string;
  senderName: string;
  body: string;
  arrivedAt: number;
  href: string;
};

type Props = {
  /** Project ids the viewer participates in — we subscribe to each. */
  projectSubscriptions: Array<{ projectId: string; projectTitle: string }>;
  /** Resolve viewer id (don't toast on viewer's own messages). */
  viewerId: string | null;
  /** Build the destination href for the project messages tab. */
  hrefForProject: (projectId: string) => string;
  /**
   * Pause notifications when truthy — used to suppress toasts while
   * the user is in the middle of a form input or upload. The host
   * page sets this via context (e.g. a focus listener on textareas).
   */
  paused?: boolean;
};

/**
 * Surface 3 — the system-level notification overlay. Subscribes to
 * all project channels the viewer participates in and surfaces an
 * inbound message as a slide-in toast. Auto-dismisses after 6
 * seconds; can be dismissed manually; never interrupts an in-progress
 * input/upload (the parent provides the `paused` flag via context).
 */
export function NotificationToast({
  projectSubscriptions,
  viewerId,
  hrefForProject,
  paused,
}: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projectSubscriptions) map.set(p.projectId, p.projectTitle);
    return map;
  }, [projectSubscriptions]);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const seenIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!viewerId) return;
    if (projectSubscriptions.length === 0) return;
    const supabase = getBrowserSupabase();
    const channels = projectSubscriptions.map(({ projectId }) => {
      const channel = supabase.channel(`${projectChannelName(projectId)}:notify`, {
        config: { broadcast: { self: false } },
      });
      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "studio_project_messages",
            filter: `project_id=eq.${projectId}`,
          },
          (
            payload: RealtimePostgresChangesPayload<{
              id: string;
              sender: string | null;
              sender_id: string | null;
              body: string | null;
              project_id: string;
            }>,
          ) => {
            if (pausedRef.current) return;
            const raw = payload.new as {
              id: string;
              sender: string | null;
              sender_id: string | null;
              body: string | null;
              project_id: string;
            };
            if (!raw?.id || seenIdsRef.current.has(raw.id)) return;
            if (raw.sender_id && raw.sender_id === viewerId) return;
            seenIdsRef.current.add(raw.id);

            const projectTitle =
              projectMap.get(raw.project_id) || "Project update";

            const notification: Notification = {
              id: raw.id,
              projectId: raw.project_id,
              projectTitle,
              senderName: raw.sender || "HenryCo Studio",
              body: excerpt(raw.body || "(attachment)", 80),
              arrivedAt: Date.now(),
              href: hrefForProject(raw.project_id),
            };
            setNotifications((current) => {
              // Cap visible toasts at 3 to avoid stacking spam.
              const next = [notification, ...current].slice(0, 3);
              return next;
            });
          },
        )
        .subscribe();
      return channel;
    });

    return () => {
      for (const channel of channels) {
        void channel.unsubscribe();
        void supabase.removeChannel(channel);
      }
    };
  }, [hrefForProject, projectMap, projectSubscriptions, viewerId]);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((n) => n.id !== id));
  }, []);

  // Auto-dismiss timers per notification.
  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map((notification) =>
      window.setTimeout(
        () => dismiss(notification.id),
        Math.max(
          1000,
          NOTIFICATION_TOAST_DISMISS_MS -
            (Date.now() - notification.arrivedAt),
        ),
      ),
    );
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [notifications, dismiss]);

  if (notifications.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col gap-2 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-[360px]"
      role="region"
      aria-label="Project notifications"
      aria-live="polite"
    >
      {notifications.map((notification) => (
        <Link
          key={notification.id}
          href={notification.href}
          onClick={() => dismiss(notification.id)}
          className="group pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-[#0A0E1A]/95 px-3.5 py-3 shadow-[0_24px_64px_-18px_rgba(0,0,0,0.6)] backdrop-blur-md motion-safe:animate-[studio-msg-toast-in_220ms_ease-out]"
        >
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d4b14e]/30 to-[#d4b14e]/10 text-[12px] font-semibold text-[#d4b14e]"
            aria-hidden
          >
            {(notification.senderName || "S")
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() || "")
              .join("") || "S"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[12px] font-semibold text-[#F5F4EE]">
                {notification.senderName}
              </span>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.08em] text-[#d4b14e]/85">
                New
              </span>
            </div>
            <div className="mt-0.5 truncate text-[10px] text-white/45">
              {notification.projectTitle}
            </div>
            <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-white/80">
              {notification.body}
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              dismiss(notification.id);
            }}
            className="shrink-0 rounded-full p-1 text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/80"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </Link>
      ))}
    </div>
  );
}
