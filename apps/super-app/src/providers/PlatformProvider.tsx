import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

import { createPlatformBundle, type PlatformBundle } from "@/platform/bundle";

const PlatformContext = createContext<PlatformBundle | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const bundle = useMemo(() => createPlatformBundle(), []);

  useEffect(() => {
    bundle.monitoring.init();
  }, [bundle]);

  return <PlatformContext.Provider value={bundle}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformBundle {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    throw new Error("usePlatform must be used within PlatformProvider.");
  }
  return ctx;
}
