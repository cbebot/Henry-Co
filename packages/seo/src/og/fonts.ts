// OWNED-TYPE / OG-SOCIAL-METADATA — the brand OG serif, now SELF-HOSTED.
//
// Previously fetched from Google Fonts at render time; now the faces are
// vendored under ./fonts and loaded via `fetch(new URL(...))`, which resolves
// on BOTH the Node and Edge runtimes and owes nothing to a CDN at render.
// Satori (next/og) supports woff / ttf / otf but NOT woff2, so these are .woff.
//
// CRITICAL (unchanged): loading is best-effort. Any failure returns an empty
// set so the card renders in Satori's default font rather than throwing — an OG
// image must NEVER be a 0-byte failure. At the owned-type reveal these files
// swap to the bespoke serif cut (same paths, no code change).

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal" | "italic";
};

async function loadLocalFont(file: string): Promise<ArrayBuffer> {
  const res = await fetch(new URL(`./fonts/${file}`, import.meta.url));
  if (!res.ok) throw new Error(`OG font ${file} → ${res.status}`);
  return res.arrayBuffer();
}

let cached: OgFont[] | null = null;

/**
 * The three brand OG serif faces the card uses: regular (eyebrow / url), medium
 * (wordmark), and italic (tagline). Returns `[]` on any failure so the caller
 * falls back to the default font instead of failing the image.
 */
export async function loadBrandOgFonts(): Promise<OgFont[]> {
  if (cached) return cached;
  try {
    const [regular, medium, italic] = await Promise.all([
      loadLocalFont("newsreader-400-normal.woff"),
      loadLocalFont("newsreader-500-normal.woff"),
      loadLocalFont("newsreader-400-italic.woff"),
    ]);
    cached = [
      { name: "Newsreader", data: regular, weight: 400, style: "normal" },
      { name: "Newsreader", data: medium, weight: 500, style: "normal" },
      { name: "Newsreader", data: italic, weight: 400, style: "italic" },
    ];
    return cached;
  } catch {
    return [];
  }
}
