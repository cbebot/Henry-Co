/**
 * SA-1 — deterministic "ask only what matters" mapping. The copilot's
 * synthesis already models its own doubt (`BriefCopilotStructured.
 * uncertainties`); this maps each uncertainty onto the composer section
 * that answers it, so a seeded brief opens EXACTLY the cards that still
 * need the person's judgment and leaves everything inferred collapsed.
 * Pure keyword routing — no model call, nothing metered.
 */

export type BriefAttentionSection =
  | "project"
  | "scope"
  | "stack"
  | "business"
  | "domain"
  | "goals";

const SECTION_RULES: Array<{ section: BriefAttentionSection; pattern: RegExp }> = [
  { section: "business", pattern: /budget|price|cost|invest|deadline|timeline|launch date|urgen|how soon|when.*live/i },
  { section: "stack", pattern: /stack|tech|framework|backend|hosting|platform|integration|cms|database/i },
  { section: "domain", pattern: /domain|web address|\.com|\.ng|url/i },
  { section: "scope", pattern: /feature|scope|page|screen|module|content|catalog|checkout|portal/i },
  { section: "project", pattern: /brand|design|style|look|visual|service|package/i },
  { section: "goals", pattern: /goal|outcome|audience|purpose|success|priorit/i },
];

/**
 * First matching section per uncertainty; the first uncertainty to land on
 * a section provides its follow-up line. Unmatched uncertainties are NOT
 * routed anywhere — opening a random card on a vague doubt is friction,
 * and the goals card already invites free text.
 */
export function sectionsNeedingAttention(
  uncertainties: readonly string[],
): Partial<Record<BriefAttentionSection, string>> {
  const attention: Partial<Record<BriefAttentionSection, string>> = {};
  for (const raw of uncertainties) {
    const text = String(raw ?? "").trim();
    if (!text) continue;
    const rule = SECTION_RULES.find((entry) => entry.pattern.test(text));
    if (!rule) continue;
    if (!attention[rule.section]) attention[rule.section] = text;
  }
  return attention;
}
