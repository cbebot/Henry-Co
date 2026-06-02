/**
 * Client-safe FAQ types + constants, shared by the server data layer
 * (lib/cms/faqs.ts) and the client manager (FaqsManager.tsx). Kept free of any
 * server-only imports so it can be bundled into the browser.
 */

/** A single public FAQ entry, normalized from a raw company_faqs row. */
export type Faq = {
  id: string;
  page_key: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
  updated_at: string | null;
};

/** A page_key bucket of FAQs, already ordered by sort_order for the UI. */
export type FaqGroup = {
  page_key: string;
  label: string;
  faqs: Faq[];
};

/** The page_key values the public site recognises, in the order we show them. */
export const FAQ_PAGE_KEYS = ["home", "about", "contact", "privacy", "terms"] as const;

const PAGE_LABELS: Record<string, string> = {
  home: "Homepage",
  about: "About",
  contact: "Contact",
  privacy: "Privacy",
  terms: "Terms",
};

export function faqPageLabel(pageKey: string): string {
  return PAGE_LABELS[pageKey] ?? pageKey.charAt(0).toUpperCase() + pageKey.slice(1);
}
