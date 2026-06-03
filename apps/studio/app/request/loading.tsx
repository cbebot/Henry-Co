import { StudioPublicLoading } from "@/components/studio/studio-public-loading";

/**
 * Focused brief-flow (/request, /request/build, /request/copilot,
 * /request/guided) route fallback.
 *
 * V3-STUDIO-LOADING-POLISH — the /request subtree had NO loading.tsx, so it
 * fell through to the ROOT `app/loading.tsx`, which renders OUTSIDE the
 * `.studio-public` wrapper on the dark dashboard body → a sharp dark flash
 * before the light composer mounts. This light, self-themed skeleton (the
 * composer shape) keeps the focused brief flow on the warm-paper canvas with
 * the teal accent from the first paint.
 */
export default function RequestLoading() {
  return <StudioPublicLoading variant="compose" />;
}
