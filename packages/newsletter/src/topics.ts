import type { NewsletterTopicDefinition, NewsletterDivision } from "./types";

export const NEWSLETTER_TOPICS: NewsletterTopicDefinition[] = [
  {
    key: "company_digest",
    division: "hub",
    label: "HenryCo Group Digest",
    description:
      "Flagship monthly update from HenryCo — new capabilities, trust updates, and selected cross-division highlights.",
    defaultFrequency: "monthly",
    editorialOnly: true,
    lifecycleOnly: false,
  },
  {
    key: "announcements",
    division: "hub",
    label: "Announcements",
    description:
      "Major launches, region expansions, platform-wide milestones, and compliance-relevant updates.",
    defaultFrequency: "ad_hoc",
    editorialOnly: true,
    lifecycleOnly: false,
  },
  {
    key: "marketplace_digest",
    division: "marketplace",
    label: "Marketplace Weekly",
    description:
      "Curated sellers, featured categories, trust improvements, and selected deal highlights — no spam, no fake urgency.",
    defaultFrequency: "weekly",
    editorialOnly: true,
    lifecycleOnly: false,
  },
  {
    key: "marketplace_seller_insights",
    division: "marketplace",
    label: "Seller Insights",
    description:
      "Operational guidance for sellers: policy updates, payout truth, trust signals, and listing quality guidance.",
    defaultFrequency: "biweekly",
    editorialOnly: true,
    lifecycleOnly: false,
  },
  {
    key: "jobs_digest",
    division: "jobs",
    label: "Jobs Digest",
    description:
      "New roles that match your profile, employer trust signals, and hiring opportunities across divisions.",
    defaultFrequency: "weekly",
    editorialOnly: false,
    lifecycleOnly: false,
  },
  {
    key: "jobs_employer_updates",
    division: "jobs",
    label: "Employer Updates",
    description:
      "For hiring teams: candidate pipeline guidance, trust flags, and compliance reminders.",
    defaultFrequency: "biweekly",
    editorialOnly: true,
    lifecycleOnly: false,
  },
  {
    key: "property_spotlights",
    division: "property",
    label: "Property Spotlights",
    description:
      "Selected verified property listings and neighborhood updates. Not a blast list — selection matters.",
    defaultFrequency: "biweekly",
    editorialOnly: true,
    lifecycleOnly: false,
  },
  {
    key: "care_updates",
    division: "care",
    label: "Care Updates",
    description:
      "Service availability, seasonal guidance, pickup schedule changes, and useful care advisories.",
    defaultFrequency: "monthly",
    editorialOnly: true,
    lifecycleOnly: false,
  },
  {
    key: "learn_programs",
    division: "learn",
    label: "Learn Programs",
    description:
      "New courses, instructor stories, and certificate opportunities — useful over promotional.",
    defaultFrequency: "monthly",
    editorialOnly: true,
    lifecycleOnly: false,
  },
  {
    key: "logistics_updates",
    division: "logistics",
    label: "Logistics Updates",
    description:
      "Coverage expansions, routing improvements, and dispatch notices for frequent senders.",
    defaultFrequency: "monthly",
    editorialOnly: true,
    lifecycleOnly: false,
  },
  {
    key: "studio_insights",
    division: "studio",
    label: "Studio Insights",
    description:
      "Design studio capabilities, case studies of completed briefs, and creative services availability.",
    defaultFrequency: "monthly",
    editorialOnly: true,
    lifecycleOnly: false,
  },
  {
    key: "account_lifecycle",
    division: "account",
    label: "Account Lifecycle Reminders",
    description:
      "Internal lifecycle class: onboarding, verification prompts, and recovery emails. Not directly subscribable.",
    defaultFrequency: "ad_hoc",
    editorialOnly: false,
    lifecycleOnly: true,
  },
];

const TOPIC_INDEX = new Map(NEWSLETTER_TOPICS.map((topic) => [topic.key, topic]));

export function getTopicDefinition(key: string): NewsletterTopicDefinition | null {
  return TOPIC_INDEX.get(key) ?? null;
}

export function listTopicsForDivision(division: NewsletterDivision): NewsletterTopicDefinition[] {
  return NEWSLETTER_TOPICS.filter((topic) => topic.division === division);
}

export function listPubliclySubscribableTopics(): NewsletterTopicDefinition[] {
  return NEWSLETTER_TOPICS.filter((topic) => !topic.lifecycleOnly);
}

export function isSubscribableTopic(key: string): boolean {
  const topic = TOPIC_INDEX.get(key);
  return Boolean(topic && !topic.lifecycleOnly);
}

export function describeTopicGroupings(): Array<{
  division: NewsletterDivision;
  topics: NewsletterTopicDefinition[];
}> {
  const groups = new Map<NewsletterDivision, NewsletterTopicDefinition[]>();
  for (const topic of NEWSLETTER_TOPICS) {
    if (topic.lifecycleOnly) continue;
    const bucket = groups.get(topic.division) ?? [];
    bucket.push(topic);
    groups.set(topic.division, bucket);
  }
  return Array.from(groups.entries()).map(([division, topics]) => ({ division, topics }));
}
