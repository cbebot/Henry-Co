export * from "./types";
export * from "./topics";
export * from "./subscriber";
export * from "./suppression";
export * from "./segmentation";
export * from "./voice";
export * from "./draft";
export * from "./brevo";
export * from "./sanity";

export const NEWSLETTER_SUBSCRIBERS_TABLE = "email_subscribers";
export const NEWSLETTER_SUBSCRIBER_TOPICS_TABLE = "email_subscriber_topics";
export const NEWSLETTER_SUPPRESSION_TABLE = "email_suppression_list";
export const NEWSLETTER_SEGMENTS_TABLE = "email_audience_segments";
export const NEWSLETTER_CAMPAIGNS_TABLE = "email_campaigns";
export const NEWSLETTER_CAMPAIGN_SENDS_TABLE = "email_campaign_sends";
export const NEWSLETTER_EDITORIAL_EVENTS_TABLE = "email_editorial_events";
export const NEWSLETTER_VOICE_RULES_TABLE = "email_brand_voice_rules";
export const NEWSLETTER_DRAFT_ASSISTS_TABLE = "email_draft_assists";

export const NEWSLETTER_EVENT_NAMES = {
  SUBSCRIBER_CREATED: "henry.newsletter.subscriber.created",
  SUBSCRIBER_PREFERENCES_UPDATED: "henry.newsletter.subscriber.preferences_updated",
  SUBSCRIBER_UNSUBSCRIBED: "henry.newsletter.subscriber.unsubscribed",
  SUBSCRIBER_SUPPRESSED: "henry.newsletter.subscriber.suppressed",
  CAMPAIGN_DRAFT_CREATED: "henry.newsletter.campaign.draft_created",
  CAMPAIGN_DRAFT_UPDATED: "henry.newsletter.campaign.draft_updated",
  CAMPAIGN_APPROVED: "henry.newsletter.campaign.approved",
  CAMPAIGN_SCHEDULED: "henry.newsletter.campaign.scheduled",
  CAMPAIGN_PAUSED: "henry.newsletter.campaign.paused",
  CAMPAIGN_CANCELLED: "henry.newsletter.campaign.cancelled",
  CAMPAIGN_SEND_STARTED: "henry.newsletter.campaign.send_started",
  CAMPAIGN_SEND_COMPLETED: "henry.newsletter.campaign.send_completed",
  CAMPAIGN_SEND_RECIPIENT_SUPPRESSED: "henry.newsletter.campaign.recipient_suppressed",
  VOICE_GUARD_TRIGGERED: "henry.newsletter.voice.guard_triggered",
} as const;

export type NewsletterEventName =
  (typeof NEWSLETTER_EVENT_NAMES)[keyof typeof NEWSLETTER_EVENT_NAMES];
