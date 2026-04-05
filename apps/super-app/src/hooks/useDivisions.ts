import { useEffect, useState } from "react";

import { DIVISION_CATALOG } from "@/domain/divisionCatalog";
import type { Division } from "@/domain/division";
import { usePlatform } from "@/providers/PlatformProvider";

export function useDivisions(): Division[] {
  const { database } = usePlatform();
  const [list, setList] = useState<Division[]>(DIVISION_CATALOG);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const r = await database.fetchDivisions();
      if (!alive) return;
      if (r.ok && r.data && r.data.length > 0) {
        setList(r.data);
        return;
      }
      setList(DIVISION_CATALOG);
    })();
    return () => {
      alive = false;
    };
  }, [database]);

  return list;
}
