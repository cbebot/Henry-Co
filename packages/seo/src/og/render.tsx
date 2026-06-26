import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { OG_SIZE } from "./template";
import { loadBrandOgFonts } from "./fonts";

/**
 * Render a shared OG card to a 1200x630 PNG with the Henry Onyx brand serif
 * loaded. Every `opengraph-image` / `twitter-image` route delegates here so the
 * font set + size are wired in exactly one place. If the brand font can't be
 * fetched, it renders in the default font rather than failing (see ./fonts).
 */
export async function renderDefaultOgImage(node: ReactElement): Promise<ImageResponse> {
  const fonts = await loadBrandOgFonts();
  return new ImageResponse(node, {
    ...OG_SIZE,
    ...(fonts.length ? { fonts: fonts as never } : {}),
  });
}
