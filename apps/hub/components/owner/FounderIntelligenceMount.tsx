"use client";

import { useEffect, useState } from "react";
import { FounderCommandDock, IntelligenceLauncher } from "@henryco/ui/intelligence";

/**
 * FounderIntelligenceMount — exactly ONE founder shell at a time (OCC-2).
 *
 * Desktop (≥1280px) gets the persistent command dock; smaller screens keep the
 * floating launcher. This is a JS breakpoint gate, not CSS hiding, because two
 * MOUNTED shells would each hold their own client history against the same
 * conversation store and drift. Renders nothing until the breakpoint is known
 * (first client frame) — both shells are client-interactive anyway.
 */
export default function FounderIntelligenceMount() {
  const [desktop, setDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const apply = () => setDesktop(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  if (desktop === null) return null;

  return desktop ? (
    <FounderCommandDock
      division="hub"
      endpoint="/api/owner/intelligence/chat"
      briefingEndpoint="/api/owner/intelligence/briefing"
      conversationsEndpoint="/api/owner/intelligence/conversations"
      accent="#C9A227"
    />
  ) : (
    <IntelligenceLauncher division="hub" endpoint="/api/owner/intelligence/chat" accent="#C9A227" />
  );
}
