export type NotificationCategory =
  | "care"
  | "marketplace"
  | "studio"
  | "jobs"
  | "learn"
  | "property"
  | "logistics"
  | "wallet"
  | "security"
  | "support"
  | "general";

export type ChannelDecision = {
  inApp: boolean;
  email: boolean;
  push: boolean;
  whatsapp: boolean;
};

type Preferences = {
  email_transactional?: boolean | null;
  email_marketing?: boolean | null;
  push_enabled?: boolean | null;
  whatsapp_enabled?: boolean | null;
  notification_care?: boolean | null;
  notification_marketplace?: boolean | null;
  notification_studio?: boolean | null;
  notification_jobs?: boolean | null;
  notification_learn?: boolean | null;
  notification_property?: boolean | null;
  notification_logistics?: boolean | null;
  notification_wallet?: boolean | null;
  notification_security?: boolean | null;
};

type RoutingInput = {
  category: NotificationCategory;
  priority?: "low" | "normal" | "high" | "critical";
  isMarketing?: boolean;
  preferences: Preferences | null | undefined;
};

const DIVISION_PREF_KEY: Partial<Record<NotificationCategory, keyof Preferences>> = {
  care: "notification_care",
  marketplace: "notification_marketplace",
  studio: "notification_studio",
  jobs: "notification_jobs",
  learn: "notification_learn",
  property: "notification_property",
  logistics: "notification_logistics",
  wallet: "notification_wallet",
  security: "notification_security",
};

// Security and critical-priority notifications ignore opt-out preferences —
// they must reach the user regardless of channel settings.
function isMandatory(category: NotificationCategory, priority?: string) {
  return category === "security" || priority === "critical";
}

export function resolveNotificationChannels(input: RoutingInput): ChannelDecision {
  const { category, priority, isMarketing, preferences } = input;
  const prefs: Preferences = preferences ?? {};

  if (isMandatory(category, priority)) {
    return {
      inApp: true,
      email: prefs.email_transactional !== false,
      push: Boolean(prefs.push_enabled),
      whatsapp: Boolean(prefs.whatsapp_enabled),
    };
  }

  const divKey = DIVISION_PREF_KEY[category];
  const divisionEnabled = divKey ? prefs[divKey] !== false : true;

  const emailAllowed = isMarketing
    ? Boolean(prefs.email_marketing)
    : prefs.email_transactional !== false;

  return {
    inApp: divisionEnabled,
    email: divisionEnabled && emailAllowed,
    push: divisionEnabled && Boolean(prefs.push_enabled),
    whatsapp: divisionEnabled && Boolean(prefs.whatsapp_enabled),
  };
}
