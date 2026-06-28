/**
 * Lightweight formatting helpers for the play module's widgets. Mirrors
 * `packages/dashboard-modules-marketplace/src/format.ts` so each module
 * package stays self-contained (no shared formatting import).
 */

const RATING_FORMATTER = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
});

/**
 * Format an Elo-style rating as a plain grouped integer ("1,240").
 */
export function formatRating(rating: number): string {
  return RATING_FORMATTER.format(Math.round(rating ?? 0));
}

/**
 * Format a win/loss/tie record as "12 / 4 / 1".
 */
export function formatRecord(
  wins: number,
  losses: number,
  ties: number,
): string {
  return `${wins ?? 0} / ${losses ?? 0} / ${ties ?? 0}`;
}

/**
 * 1-based leaderboard rank with an ordinal suffix ("1st", "2nd", "3rd").
 */
export function ordinalRank(index: number): string {
  const n = index + 1;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
