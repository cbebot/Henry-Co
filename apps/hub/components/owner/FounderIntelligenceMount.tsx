"use client";

import { FounderCommandPortal } from "@henryco/ui/intelligence";

/**
 * FounderIntelligenceMount — the single founder shell (OCC-2).
 *
 * One full-screen command portal, responsive from phone to command desk. There
 * is exactly ONE mounted shell so the client history never forks against the
 * shared conversation store; the portal itself handles its own open/closed
 * state (FAB when closed, cockpit when open) so there is no breakpoint gate to
 * flash. The brain (useIntelligenceChat) and the F3 governed actions are shared
 * with every other division — only this shell is bespoke to the owner.
 */
export default function FounderIntelligenceMount() {
  return (
    <FounderCommandPortal
      division="hub"
      endpoint="/api/owner/intelligence/chat"
      briefingEndpoint="/api/owner/intelligence/briefing"
      conversationsEndpoint="/api/owner/intelligence/conversations"
      healthEndpoint="/api/owner/intelligence/health"
      accent="#C9A227"
    />
  );
}
