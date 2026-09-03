/**
 * @henryco/data/inbox-href — pure deep-link helpers for the unified inbox.
 *
 * Deliberately NOT `"server-only"`: these are tiny, side-effect-free URL
 * builders that the server-only `inbox-aggregate` consumes, but which can
 * also be unit-tested under `tsx --test` / plain Node without dragging in
 * the Supabase admin client or the `server-only` guard.
 */

/** Deep-link to a specific support thread (vs the division root). Pure + testable. */
export function supportThreadHref(threadId: string): string {
  return `/support/${threadId}`;
}
