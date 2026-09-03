/**
 * V3-04 (S5) — `@henryco/ui/share`.
 *
 * The ShareButton component (Web Share API + clipboard fallback, with
 * `?ref=share&from=<hash>` attribution and `henry.share.clicked`
 * telemetry). Share-link URL helpers + the server-only sharer-hash
 * functions live in `@henryco/seo/deeplinks` so they can be reused
 * outside React (e.g. an arrival-attribution route handler).
 */

export { ShareButton, type ShareButtonProps } from "./ShareButton";
