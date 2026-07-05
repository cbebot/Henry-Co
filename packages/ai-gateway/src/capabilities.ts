// Intelligence Live L4 — the CHARGEABLE deep-work capability registry. Free general support
// stays free (support.message.assist); these are the personalised pieces the person confirms a
// price for before they run. Each capability maps to a metered surface (surfaces.ts), so the
// wallet, rate card, reserve/settle, VAT, and receipt all reuse the existing rail verbatim.
//
// Pure + client-safe: this holds only WHAT is offered (keys, surfaces, user-facing copy),
// never HOW it is priced. The price is computed server-side (server/quote.ts) and only the
// final kobo total ever crosses to the client.

import type { AiSurfaceKey } from "./surfaces";

/** A deep-work capability the support brain can OFFER (never perform for free). */
export interface IntelligenceCapability {
  /** Stable id used in the support envelope `offer` and by the quote/run endpoints. */
  key: string;
  /** The metered surface this capability runs on. */
  surface: AiSurfaceKey;
  /** Short user-facing title (English canonical; localised at render). */
  title: string;
  /** One line on what the person gets. */
  blurb: string;
  /** What the AI needs from the person (or their account) to do it well. */
  needs: string;
}

export const INTELLIGENCE_CAPABILITIES: readonly IntelligenceCapability[] = [
  {
    key: "growth_plan",
    surface: "intelligence.deep.growth",
    title: "Growth plan",
    blurb: "A tailored, prioritised plan to grow your business over the next few months.",
    needs: "what you do, who your customers are, and where you feel stuck",
  },
  {
    key: "marketing_analysis",
    surface: "intelligence.deep.marketing",
    title: "Marketing analysis",
    blurb: "A deep look at how you reach and convert customers, with specific moves to make.",
    needs: "your store or product, your audience, and how you market today",
  },
  {
    key: "listing_review",
    surface: "intelligence.deep.listing",
    title: "Listing review",
    blurb: "A conversion review of your own listings or products, with concrete fixes.",
    needs: "which listings or products to review, and what result you want",
  },
] as const;

const BY_KEY = new Map(INTELLIGENCE_CAPABILITIES.map((c) => [c.key, c] as const));
const BY_SURFACE = new Map(INTELLIGENCE_CAPABILITIES.map((c) => [c.surface, c] as const));

/** The capability for a key, or null. */
export function getCapability(key: string | null | undefined): IntelligenceCapability | null {
  return (key && BY_KEY.get(key)) || null;
}

/** True when `key` names a real chargeable capability. Accepts unknown (raw model output). */
export function isCapabilityKey(key: unknown): boolean {
  return typeof key === "string" && BY_KEY.has(key);
}

/** The capability that runs on a given surface, or null (used to price a surface run). */
export function getCapabilityForSurface(surface: string): IntelligenceCapability | null {
  return BY_SURFACE.get(surface as AiSurfaceKey) || null;
}

/** The catalog as prompt lines (one per line) for the support brain. No em dashes, per doctrine. */
export function listCapabilitiesForPrompt(): string {
  return INTELLIGENCE_CAPABILITIES.map((c) => `${c.key} (${c.title}): ${c.blurb} Needs ${c.needs}.`).join("\n");
}
