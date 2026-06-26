// OG-SOCIAL-METADATA — load the Henry Onyx brand serif (Newsreader) for the
// shared OG card. Satori (next/og) only ships a default sans, so the elegant
// serif wordmark + italic tagline need the real face supplied at render time.
//
// CRITICAL: font loading is best-effort. If Google Fonts is unreachable, we
// return an empty font set and the card renders in Satori's default font rather
// than throwing — an OG image must NEVER fail to render (a 0-byte image is what
// this whole effort set out to kill). Newsreader is the brand serif declared in
// packages/ui/src/brand/static/icon.svg.

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal" | "italic";
};

// The glyphs the card can render (brand strings + any division name/tagline are
// Latin). Subsetting keeps each fetch tiny and yields a single @font-face that
// parses cleanly.
const OG_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?:;·—–-'’&/()@";

async function loadGoogleFont(
  family: string,
  weight: number,
  italic: boolean,
): Promise<ArrayBuffer> {
  const axis = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
  const url =
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:${axis}` +
    `&text=${encodeURIComponent(OG_CHARSET)}`;
  // No browser UA → Google serves a TrueType `src` we can hand straight to
  // Satori (it does not support woff2).
  const css = await (await fetch(url)).text();
  const match = css.match(/src:\s*url\((.+?)\)\s*format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error(`No TTF/OTF face for ${family} ${weight}${italic ? "i" : ""}`);
  const res = await fetch(match[1]);
  if (!res.ok) throw new Error(`Font fetch ${res.status} for ${family}`);
  return res.arrayBuffer();
}

let cached: OgFont[] | null = null;

/**
 * The three Newsreader faces the card uses: regular (eyebrow / url), medium
 * (wordmark), and italic (tagline). Returns `[]` on any failure so the caller
 * falls back to the default font instead of failing the image.
 */
export async function loadBrandOgFonts(): Promise<OgFont[]> {
  if (cached) return cached;
  try {
    const [regular, medium, italic] = await Promise.all([
      loadGoogleFont("Newsreader", 400, false),
      loadGoogleFont("Newsreader", 500, false),
      loadGoogleFont("Newsreader", 400, true),
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
