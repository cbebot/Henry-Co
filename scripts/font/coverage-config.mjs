// scripts/font/coverage-config.mjs
// Latin faces must cover Latin (incl. the African-Latin extensions used by
// yo/ig/ha). Companions must cover their script blocks. Tier-1 (exact copy
// codepoints) is wired in Phase 5 when the copy corpus is enumerated.
const LATIN = [
  { name: "Basic Latin", start: 0x0020, end: 0x007e },
  { name: "Latin-1 Supplement", start: 0x00a0, end: 0x00ff },
  { name: "Latin Extended-A", start: 0x0100, end: 0x017f },
  { name: "Latin Extended-B", start: 0x0180, end: 0x024f },
  { name: "Latin Extended Additional", start: 0x1e00, end: 0x1eff }, // ẹ ọ ṣ ṅ …
];
const ARABIC = [{ name: "Arabic", start: 0x0600, end: 0x06ff }];
const CJK = [{ name: "CJK Unified (sample)", start: 0x4e00, end: 0x4eff }];

export const FACES = [
  { file: "packages/ui/fonts/henryonyx-serif-interim.woff2", label: "serif", blocks: LATIN },
  { file: "packages/ui/fonts/henryonyx-sans-interim.woff2", label: "sans", blocks: LATIN },
  { file: "packages/ui/fonts/henryonyx-mono-interim.woff2", label: "mono", blocks: [LATIN[0], LATIN[1]] },
  { file: "packages/ui/fonts/henryonyx-arabic-interim.woff2", label: "arabic-companion", blocks: ARABIC },
  { file: "packages/ui/fonts/henryonyx-cjk-interim.woff2", label: "cjk-companion", blocks: CJK },
];

export const COPY_GLOBS = []; // Tier-1: populated in Phase 5
