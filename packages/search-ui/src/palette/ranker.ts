/**
 * Palette ranker re-export. The implementation lives in
 * `@henryco/search-core/palette-ranker` so it can be unit-tested
 * alongside the role-isolation probes (search-core has Jest set up;
 * search-ui does not).
 *
 * search-ui's `PaletteRow` and `StoredRecent` structurally satisfy
 * the search-core `RankablePaletteRow` / `RankableStoredRecent`
 * interfaces, so the typed re-export below preserves the previous
 * call-site shape with zero changes for consumers.
 */

export {
  rankPaletteRows,
  type RankablePaletteRow,
  type RankableStoredRecent,
  type RankerInput,
  type RankerOutput,
} from "@henryco/search-core";
