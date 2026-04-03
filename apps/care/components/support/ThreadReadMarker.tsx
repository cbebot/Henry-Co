"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markSupportThreadViewedAction } from "@/app/(staff)/support/actions";

export default function ThreadReadMarker({
  threadId,
  enabled,
}: {
  threadId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const triggered = useRef(false);

  useEffect(() => {
    if (!enabled || !threadId || triggered.current || isPending) {
      return;
    }

    triggered.current = true;
    startTransition(async () => {
      const result = await markSupportThreadViewedAction({ threadId });
      if (result.ok) {
        router.refresh();
      } else {
        triggered.current = false;
      }
    });
  }, [enabled, isPending, router, threadId]);

  return null;
}
