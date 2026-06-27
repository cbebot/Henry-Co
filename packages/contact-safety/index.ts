export type ContactSafetyAction = "allow" | "mask" | "block";

export interface ContactSafetyResult {
  action: ContactSafetyAction;
  maskedText: string;
  patterns: string[];
  severity: "low" | "medium" | "high" | "critical";
}

import { shouldAutoFlag } from "@henryco/trust/moderation";
import { detectExternalLinks, normalizeForDetection, maskContactsForDisplay } from "@henryco/trust/detect";

const RANK = { low: 0, medium: 1, high: 2, critical: 3 } as const;
type Sev = keyof typeof RANK;

// Contact-leak floor: the canonical detectors deliberately rank a bare social
// handle as `low` (detected, flagged, but low). For contact safety a DETECTED
// off-platform contact must never come back as `allow` — escalate any detector
// that fired-but-ranked-low to `medium` (mask) so handles/links are removed.
function contactFloor(fired: boolean, sev: Sev): Sev {
  return fired && RANK[sev] < RANK.medium ? "medium" : sev;
}

export function contactSafety(text: string): ContactSafetyResult {
  const raw = shouldAutoFlag(text);
  const norm = shouldAutoFlag(normalizeForDetection(text));
  const links = detectExternalLinks(text);

  const candidates: Sev[] = [
    contactFloor(raw.flag, raw.severity as Sev),
    contactFloor(norm.flag, norm.severity as Sev),
    contactFloor(links.detected, links.severity as Sev),
  ];
  const severity = candidates.reduce<Sev>((a, b) => (RANK[b] > RANK[a] ? b : a), "low");

  let action: ContactSafetyAction;
  if (RANK[severity] >= RANK.high) action = "block";
  else if (RANK[severity] === RANK.medium) action = "mask";
  else action = "allow";

  const maskedText = action === "allow" ? text : maskContactsForDisplay(text);
  return { action, maskedText, patterns: links.patterns, severity };
}
