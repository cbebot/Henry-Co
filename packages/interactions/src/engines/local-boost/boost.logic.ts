/**
 * Local Boost Engine — pure projection math (doctrine Engine 10).
 *
 * Sellers see a REAL projected impressions/clicks figure for their bid and
 * locale BEFORE they pay, and transparent outcome reporting after. The
 * baseline (cpm + ctr) is server-computed from the locale's actual history;
 * this core only does the arithmetic — honestly, including "zero" when the
 * inputs can't support a projection.
 */

export interface BoostBaseline {
  /** Cost per 1000 impressions, integer minor units, from live locale data. */
  cpmMinor: number;
  /** Click-through rate as a fraction (0.02 = 2%), from live locale data. */
  ctr: number;
}

export interface BoostProjection {
  impressions: number;
  clicks: number;
}

export function projectBoost(
  bidMinor: number,
  locale: string,
  baseline: BoostBaseline,
): BoostProjection {
  void locale; // reserved: locale-specific adjustments arrive with the server baseline
  if (bidMinor <= 0 || baseline.cpmMinor <= 0) return { impressions: 0, clicks: 0 };
  const impressions = Math.floor((bidMinor / baseline.cpmMinor) * 1000);
  const clicks = Math.round(impressions * Math.max(0, baseline.ctr));
  return { impressions, clicks };
}
