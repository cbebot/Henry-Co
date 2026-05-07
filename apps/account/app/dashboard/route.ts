import { redirect } from "next/navigation";

/**
 * V2-DASH-01 G7 — `/dashboard` 308 redirect to `/`.
 *
 * Per audit §A.4 + master orchestration: the unified shell lives at
 * `account.henrycogroup.com/` (Track A canonical). Any legacy
 * `/dashboard` deep-link is permanently redirected to the new
 * canonical path. 308 preserves the request method + body, ensuring
 * any POST that accidentally targets `/dashboard` still lands on the
 * canonical route.
 *
 * The redirect is a route handler (not a `<Link>` page) so that
 * external linkers (emails, search engines, mobile deep-links) get
 * a real HTTP redirect rather than a client-side navigation that
 * leaves the URL bar showing the old path.
 */
export const dynamic = "force-static";

export function GET(): Response {
  redirect("/");
}

export function HEAD(): Response {
  redirect("/");
}

export function POST(): Response {
  redirect("/");
}
