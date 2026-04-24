import type {
  NewsletterBrandVoiceRule,
  NewsletterCampaignClass,
  NewsletterCampaignContent,
} from "./types";

export type VoiceGuardWarning = {
  ruleKey: string;
  kind: NewsletterBrandVoiceRule["kind"];
  severity: NewsletterBrandVoiceRule["severity"];
  message: string;
  location: "subject" | "preview" | "headline" | "body" | "cta" | "footer";
};

export type VoiceGuardResult = {
  score: number;
  warnings: VoiceGuardWarning[];
  blocks: VoiceGuardWarning[];
};

const DEFAULT_BANNED_PHRASES: Array<Omit<NewsletterBrandVoiceRule, "id" | "createdAt">> = [
  {
    ruleKey: "no_buy_now_pressure",
    kind: "banned_phrase",
    pattern: "\\bbuy now!?\\b",
    reason: "Avoid pressure sales language; use clear, calm CTAs.",
    severity: "warning",
    appliesToClasses: ["company_wide", "division_digest", "announcement"],
    active: true,
  },
  {
    ruleKey: "no_fake_urgency_last_chance",
    kind: "banned_phrase",
    pattern: "\\blast chance\\b",
    reason: "Fake urgency erodes trust.",
    severity: "warning",
    appliesToClasses: ["company_wide", "division_digest", "announcement", "lifecycle_journey"],
    active: true,
  },
  {
    ruleKey: "no_limited_time_fake_scarcity",
    kind: "banned_phrase",
    pattern: "\\blimited time (only|offer)!?\\b",
    reason: "Avoid fake scarcity.",
    severity: "warning",
    appliesToClasses: ["company_wide", "division_digest", "announcement"],
    active: true,
  },
  {
    ruleKey: "no_fabricated_trust_claims",
    kind: "truth_constraint",
    pattern: "\\b(100% guaranteed|guaranteed results|zero risk|risk[- ]free|no.1 in the world)\\b",
    reason: "Do not fabricate trust claims that cannot be substantiated.",
    severity: "block",
    appliesToClasses: [
      "company_wide",
      "division_digest",
      "announcement",
      "lifecycle_journey",
      "transactional_education",
    ],
    active: true,
  },
  {
    ruleKey: "no_customer_testimonial_fabrication",
    kind: "truth_constraint",
    pattern: "\\b(loved by millions|thousands of happy customers say|rated #1 by experts)\\b",
    reason: "Do not invent customer testimonials or ratings.",
    severity: "block",
    appliesToClasses: ["company_wide", "division_digest", "announcement"],
    active: true,
  },
  {
    ruleKey: "avoid_ai_phrasing_filler",
    kind: "tone_rule",
    pattern: "\\b(in today's fast-paced world|in this digital age|unlock the power of|revolutionize)\\b",
    reason: "Generic corporate/AI filler; rewrite with specific, human language.",
    severity: "warning",
    appliesToClasses: ["company_wide", "division_digest", "announcement"],
    active: true,
  },
  {
    ruleKey: "required_unsubscribe_footer",
    kind: "required_disclosure",
    pattern: "(unsubscribe|manage preferences|email preferences)",
    reason: "Marketing emails must include a visible unsubscribe/preferences link.",
    severity: "block",
    appliesToClasses: ["company_wide", "division_digest", "announcement", "lifecycle_journey"],
    active: true,
  },
  {
    ruleKey: "avoid_robotic_greeting",
    kind: "tone_rule",
    pattern: "\\bdear valued customer\\b",
    reason: "Sounds generic/robotic. Use the subscriber's name when available, or a direct opener.",
    severity: "info",
    appliesToClasses: ["company_wide", "division_digest", "announcement", "lifecycle_journey"],
    active: true,
  },
  {
    ruleKey: "no_click_here_cta",
    kind: "tone_rule",
    pattern: "\\bclick here\\b",
    reason: 'CTA copy should describe the action ("Read the brief", "Open your wallet").',
    severity: "warning",
    appliesToClasses: ["company_wide", "division_digest", "announcement", "lifecycle_journey"],
    active: true,
  },
  {
    ruleKey: "no_spammy_caps_in_subject",
    kind: "tone_rule",
    pattern: "([A-Z]{6,})",
    reason: "Long all-caps words look spammy.",
    severity: "warning",
    appliesToClasses: ["company_wide", "division_digest", "announcement"],
    active: true,
  },
];

export function getDefaultBrandVoiceRules(): Array<
  Omit<NewsletterBrandVoiceRule, "id" | "createdAt">
> {
  return DEFAULT_BANNED_PHRASES.map((rule) => ({ ...rule }));
}

function allContentText(content: NewsletterCampaignContent): Array<{
  location: VoiceGuardWarning["location"];
  text: string;
}> {
  const sections: Array<{ location: VoiceGuardWarning["location"]; text: string }> = [
    { location: "subject", text: content.subject },
    { location: "preview", text: content.previewText },
    { location: "headline", text: content.headline },
  ];
  for (const block of content.bodyBlocks) {
    if (block.text) {
      sections.push({
        location: block.kind === "cta" ? "cta" : "body",
        text: block.text,
      });
    }
  }
  if (content.ctaPrimary?.label) {
    sections.push({ location: "cta", text: content.ctaPrimary.label });
  }
  if (content.ctaSecondary?.label) {
    sections.push({ location: "cta", text: content.ctaSecondary.label });
  }
  if (content.footerNote) {
    sections.push({ location: "footer", text: content.footerNote });
  }
  return sections;
}

function fullBodyText(content: NewsletterCampaignContent): string {
  const parts: string[] = [];
  parts.push(content.subject, content.previewText, content.headline);
  for (const block of content.bodyBlocks) {
    if (block.text) parts.push(block.text);
  }
  if (content.ctaPrimary) parts.push(content.ctaPrimary.label, content.ctaPrimary.href);
  if (content.ctaSecondary) parts.push(content.ctaSecondary.label, content.ctaSecondary.href);
  if (content.footerNote) parts.push(content.footerNote);
  return parts.join("\n");
}

export type RunVoiceGuardInput = {
  content: NewsletterCampaignContent;
  campaignClass: NewsletterCampaignClass;
  rules?: Array<Pick<NewsletterBrandVoiceRule, "ruleKey" | "kind" | "pattern" | "reason" | "severity" | "appliesToClasses" | "active">>;
};

export function runVoiceGuard(input: RunVoiceGuardInput): VoiceGuardResult {
  const rules = input.rules ?? getDefaultBrandVoiceRules();
  const warnings: VoiceGuardWarning[] = [];
  const blocks: VoiceGuardWarning[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;
    if (!rule.appliesToClasses.includes(input.campaignClass)) continue;
    let regex: RegExp;
    try {
      regex = new RegExp(rule.pattern, "i");
    } catch {
      continue;
    }

    if (rule.kind === "required_disclosure") {
      const corpus = fullBodyText(input.content);
      if (!regex.test(corpus)) {
        const warning: VoiceGuardWarning = {
          ruleKey: rule.ruleKey,
          kind: rule.kind,
          severity: rule.severity,
          message: `Missing required disclosure: ${rule.reason}`,
          location: "footer",
        };
        if (rule.severity === "block") blocks.push(warning);
        warnings.push(warning);
      }
      continue;
    }

    for (const section of allContentText(input.content)) {
      if (!section.text) continue;
      if (!regex.test(section.text)) continue;
      const warning: VoiceGuardWarning = {
        ruleKey: rule.ruleKey,
        kind: rule.kind,
        severity: rule.severity,
        message: rule.reason,
        location: section.location,
      };
      if (rule.severity === "block") blocks.push(warning);
      warnings.push(warning);
    }
  }

  const penalty = warnings.reduce((acc, w) => {
    if (w.severity === "block") return acc + 35;
    if (w.severity === "warning") return acc + 10;
    return acc + 2;
  }, 0);
  const score = Math.max(0, 100 - penalty);

  return { score, warnings, blocks };
}

export function summarizeVoiceWarnings(warnings: VoiceGuardWarning[]): string[] {
  return warnings.map((w) => `[${w.severity}] ${w.location}: ${w.ruleKey} — ${w.message}`);
}
