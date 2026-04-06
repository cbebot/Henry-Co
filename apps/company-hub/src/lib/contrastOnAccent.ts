function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  if (h.length === 6) {
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return null;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  return null;
}

function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const linear = [rgb.r, rgb.g, rgb.b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** Pick readable label/icon color on top of a solid accent fill. */
export function contrastOnAccent(accentHex: string): "#0B0B0C" | "#FFFFFF" {
  const rgb = parseHex(accentHex);
  if (!rgb) return "#0B0B0C";
  return relativeLuminance(rgb) > 0.55 ? "#0B0B0C" : "#FFFFFF";
}
