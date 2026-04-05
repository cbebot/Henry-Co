import { useEffect, useState } from "react";

import type { AuthSession } from "@/platform/contracts/auth";
import { usePlatform } from "@/providers/PlatformProvider";

export function useAuthSession() {
  const { auth } = usePlatform();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.subscribe((next) => {
      setSession(next);
      setLoading(false);
    });
    return unsub;
  }, [auth]);

  return { session, loading };
}
