import { StudioPublicLoading } from "@/components/studio/studio-public-loading";

/**
 * Studio public-shell route fallback.
 *
 * V3-STUDIO-LOADING-POLISH — the Studio public surface is LIGHT-PRIMARY
 * (warm paper) + Fraunces + a teal accent. The shared `PublicHomeSkeleton`
 * defaulted to `tone="onDark"` (white bars) which read wrong on the light
 * canvas, and the dark dashboard body bled through before the page streamed.
 * `StudioPublicLoading` is the self-contained light skeleton — it carries its
 * own `.studio-public` theme so it resolves the same warm canvas + teal
 * accent as the real pages. No dark flash.
 */
export default function StudioPublicLoading_Route() {
  return <StudioPublicLoading variant="home" />;
}
