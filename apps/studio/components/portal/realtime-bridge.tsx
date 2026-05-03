"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { usePortalToast } from "@/components/portal/toast-provider";

/**
 * PortalRealtimeBridge subscribes to the project messages and project
 * updates tables for the projects this viewer owns. New rows raise an
 * in-app toast and trigger a router refresh so the unread count and
 * activity feed stay live.
 *
 * Subscriptions are server-rendered into the layout so the bridge
 * receives the projectIds it needs without a client-side fetch.
 */
export function PortalRealtimeBridge({
  viewerId,
  projectIds,
}: {
  viewerId: string;
  projectIds: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = usePortalToast();
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    if (!projectIds || projectIds.length === 0) return;

    let supabase: ReturnType<typeof getBrowserSupabase> | null = null;
    try {
      supabase = getBrowserSupabase();
    } catch {
      return;
    }

    const filter = `project_id=in.(${projectIds.join(",")})`;

    const channel = supabase
      .channel(`portal-bridge-${viewerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "studio_project_messages",
          filter,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as {
            sender_id?: string | null;
            sender?: string | null;
            sender_role?: string | null;
            body?: string | null;
            project_id?: string;
            is_internal?: boolean;
          };
          if (row.is_internal) return;
          if (row.sender_id === viewerId) return;
          if (row.sender_role === "client") return;

          const onProjectPage = pathname?.startsWith(`/client/projects/${row.project_id}`);
          if (!onProjectPage) {
            toast.push({
              tone: "message",
              title: `New message from ${row.sender || "the team"}`,
              body: row.body ? row.body.slice(0, 120) : undefined,
              href: `/client/projects/${row.project_id}`,
            });
          }

          softRefresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "studio_project_updates",
          filter,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as {
            title?: string | null;
            update_type?: string | null;
            kind?: string | null;
            project_id?: string;
          };
          const type = row.update_type || row.kind || "note";

          if (type === "file_shared") {
            toast.push({
              tone: "info",
              title: row.title || "New file shared",
              body: "Open the project to review and approve.",
              href: row.project_id ? `/client/projects/${row.project_id}` : undefined,
            });
          } else if (type === "milestone_complete") {
            toast.push({
              tone: "success",
              title: row.title || "Milestone complete",
              href: row.project_id ? `/client/projects/${row.project_id}` : undefined,
            });
          } else if (type === "payment_verified") {
            toast.push({
              tone: "success",
              title: row.title || "Payment verified",
            });
          }

          softRefresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "studio_invoices",
          filter,
        },
        () => {
          softRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };

    function softRefresh() {
      const now = Date.now();
      if (now - lastRefreshRef.current < 1500) return;
      lastRefreshRef.current = now;
      router.refresh();
    }
  }, [projectIds, viewerId, router, pathname, toast]);

  return null;
}
