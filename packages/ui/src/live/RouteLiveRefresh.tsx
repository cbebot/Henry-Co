"use client";

import { startTransition, useEffect, useEffectEvent } from "react";
import { useRouter } from "next/navigation";

export type RouteLiveRefreshProps = {
  intervalMs?: number;
  enabled?: boolean;
};

function shouldPauseLiveRefresh(element: Element | null) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element.closest("[data-live-refresh-pause='true']")) {
    return true;
  }

  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.tagName === "SELECT" ||
    element.isContentEditable
  );
}

export function RouteLiveRefresh({
  intervalMs = 15_000,
  enabled = true,
}: RouteLiveRefreshProps) {
  const router = useRouter();

  const refreshRoute = useEffectEvent(() => {
    if (!enabled || document.visibilityState !== "visible") {
      return;
    }

    if (shouldPauseLiveRefresh(document.activeElement)) {
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      refreshRoute();
    }, intervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshRoute();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, intervalMs]);

  return null;
}
