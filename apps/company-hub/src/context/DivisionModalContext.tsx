import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { DivisionDetailModal } from "@/components/DivisionDetailModal";
import { getBookmarks, toggleBookmark } from "@/store/bookmarks";
import type { Division } from "@/types/division";

type DivisionModalContextValue = {
  openDivision: (division: Division) => void;
  bookmarkedIds: Set<string>;
  refreshBookmarks: () => void;
  handleToggleBookmark: (divisionId: string) => Promise<void>;
};

const DivisionModalContext = createContext<DivisionModalContextValue | null>(null);

export function DivisionModalProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Division | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const loadBookmarks = useCallback(async () => {
    const items = await getBookmarks();
    setBookmarkedIds(new Set(items.map((b) => b.divisionId)));
  }, []);

  useEffect(() => {
    void loadBookmarks();
  }, [loadBookmarks]);

  const openDivision = useCallback((division: Division) => setSelected(division), []);
  const close = useCallback(() => setSelected(null), []);

  const handleToggleBookmark = useCallback(
    async (divisionId: string) => {
      const isNow = await toggleBookmark(divisionId);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isNow) next.add(divisionId);
        else next.delete(divisionId);
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ openDivision, bookmarkedIds, refreshBookmarks: loadBookmarks, handleToggleBookmark }),
    [openDivision, bookmarkedIds, loadBookmarks, handleToggleBookmark],
  );

  return (
    <DivisionModalContext.Provider value={value}>
      {children}
      <DivisionDetailModal
        visible={selected !== null}
        division={selected}
        onDismiss={close}
        isBookmarked={selected ? bookmarkedIds.has(selected.id) : false}
        onToggleBookmark={selected ? () => handleToggleBookmark(selected.id) : undefined}
      />
    </DivisionModalContext.Provider>
  );
}

export function useDivisionModal() {
  const ctx = useContext(DivisionModalContext);
  if (!ctx) throw new Error("useDivisionModal must be used within DivisionModalProvider");
  return ctx;
}
