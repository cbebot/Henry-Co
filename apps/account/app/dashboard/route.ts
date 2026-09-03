import { permanentRedirect } from "next/navigation";

/**
 * V3 Wave A1 — `/dashboard` permanent 308 redirect to `/`.
 *
 * Per audit §1.2 + §8.1 + master orchestration §A.4: the unified shell
 * lives at `account.henrycogroup.com/` (Track A canonical). Any legacy
 * `/dashboard` deep-link is permanently redirected to the new canonical
 * path.
 *
 * Implementation note: `next/navigation`'s `permanentRedirect()` emits
 * HTTP **308 Permanent Redirect** (vs. `redirect()` which emits 307
 * Temporary Redirect). 308 preserves the request method + body AND
 * tells crawlers / clients to update their bookmarks — exactly what we
 * want for a permanent move.
 *
 * The redirect is a route handler (not a `<Link>` page) so that
 * external linkers (emails, search engines, mobile deep-links) get
 * a real HTTP redirect rather than a client-side navigation that
 * leaves the URL bar showing the old path.
 */
export const dynamic = "force-static";

export function GET(): Response {
  permanentRedirect("/");
}

export function HEAD(): Response {
  permanentRedirect("/");
}

export function POST(): Response {
  permanentRedirect("/");
}
