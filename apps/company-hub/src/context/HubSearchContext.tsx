import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type HubSearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
  clearQuery: () => void;
};

const HubSearchContext = createContext<HubSearchContextValue | null>(null);

export function HubSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQueryState] = useState("");

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  const clearQuery = useCallback(() => setQueryState(""), []);

  const value = useMemo(
    () => ({
      query,
      setQuery,
      clearQuery,
    }),
    [query, setQuery, clearQuery],
  );

  return <HubSearchContext.Provider value={value}>{children}</HubSearchContext.Provider>;
}

export function useHubSearch() {
  const ctx = useContext(HubSearchContext);
  if (!ctx) throw new Error("useHubSearch must be used within HubSearchProvider");
  return ctx;
}
