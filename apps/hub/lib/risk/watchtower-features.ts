// V3-40 — watchtower → risk-feature bridge (pure).
//
// One threat vocabulary, one engine: the watchtower (threat-signals.ts) DETECTS;
// this mapper only ATTRIBUTES its detections to the accounts they involve, in the
// `ThreatInvolvement` shape the risk engine consumes. No detection logic lives here.

import type { ThreatAssessment } from "@/lib/security/threat-signals";
import type { ThreatInvolvement } from "@henryco/intelligence";

/** Group the fleet assessment's signals by involved account id. */
export function threatInvolvementsByAccount(
  assessment: ThreatAssessment,
): Map<string, ThreatInvolvement[]> {
  const byAccount = new Map<string, ThreatInvolvement[]>();
  for (const signal of assessment.signals) {
    for (const userId of signal.subjectUserIds) {
      if (!userId) continue;
      const list = byAccount.get(userId) ?? [];
      list.push({
        kind: signal.kind,
        severity: signal.severity,
        evidenceCount: signal.evidenceCount,
      });
      byAccount.set(userId, list);
    }
  }
  return byAccount;
}
