import { useEffect, useState } from "react";

import type { ActivityItem } from "@/platform/contracts/database";
import { usePlatform } from "@/providers/PlatformProvider";

export function useActivity(limit = 8) {
  const { database } = usePlatform();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const r = await database.listActivity(limit);
      if (!alive) return;
      if (r.ok) setItems(r.data);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [database, limit]);

  return { items, loading };
}
