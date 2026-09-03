/**
 * SA-2 — the `studio_agency` kill switch. Runtime-checkable, DEFAULT DARK
 * (absent ⇒ false), matching the shipped studio env-flag idiom
 * (STUDIO_DOMAIN_RDAP_ENABLED / FOUNDER_ACTIONS_LIVE). Gates dispatch of new
 * jobs and the console; flipping it off halts the tick's spawn/resume path
 * (SAFETY-MODEL §4). Pure — no server import — so it is unit-testable.
 */

export function isStudioAgencyEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const v = String(env.STUDIO_AGENCY_LIVE ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}
