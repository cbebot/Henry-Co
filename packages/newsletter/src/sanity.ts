import {
  NEWSLETTER_DIVISIONS,
  NEWSLETTER_SUBSCRIBER_STATUSES,
  NEWSLETTER_SUPPRESSION_REASONS,
  NEWSLETTER_SUPPRESSION_SCOPES,
  NEWSLETTER_CAMPAIGN_STATUSES,
  NEWSLETTER_CAMPAIGN_CLASSES,
  NEWSLETTER_SEND_STATUSES,
} from "./types";
import {
  NEWSLETTER_TOPICS,
  describeTopicGroupings,
  isSubscribableTopic,
  listPubliclySubscribableTopics,
} from "./topics";
import {
  buildPreferenceToken,
  verifyPreferenceToken,
  normalizeEmail,
  normalizeCountry,
  normalizeLocale,
  normalizeSubscriptionInput,
  isDisposableEmail,
  isRoleEmail,
} from "./subscriber";
import { evaluateSuppression } from "./suppression";
import { DEFAULT_SEGMENTS, resolveSegment, estimateSegmentSize } from "./segmentation";
import { runVoiceGuard, getDefaultBrandVoiceRules } from "./voice";
import { buildDraftSkeleton, renderDraftAsHtml, estimateReadingTimeSeconds } from "./draft";
import { resolveBrevoConfig, isBrevoEnabled } from "./brevo";

export type SanityCheck = { name: string; ok: boolean; detail?: string };

export function runNewsletterSanity(): SanityCheck[] {
  const checks: SanityCheck[] = [];

  const allowedTopicKeys = new Set(listPubliclySubscribableTopics().map((t) => t.key));

  checks.push({
    name: "topics.coverage.minimum",
    ok: NEWSLETTER_TOPICS.length >= 10,
    detail: `topics count=${NEWSLETTER_TOPICS.length}`,
  });

  checks.push({
    name: "topics.every_division_has_topic",
    ok: NEWSLETTER_DIVISIONS.filter(
      (d) => d !== "account"
    ).every((division) => NEWSLETTER_TOPICS.some((t) => t.division === division)),
    detail: NEWSLETTER_DIVISIONS.filter((d) => d !== "account").join(","),
  });

  checks.push({
    name: "topics.groupings_exclude_lifecycle_only",
    ok: describeTopicGroupings().every((group) =>
      group.topics.every((topic) => !topic.lifecycleOnly)
    ),
  });

  checks.push({
    name: "subscribable.lifecycle_only_rejected",
    ok: !isSubscribableTopic("account_lifecycle") && isSubscribableTopic("company_digest"),
  });

  checks.push({
    name: "email.normalize.trim_lowercase",
    ok: normalizeEmail("  Henry@HenryCo.com  ") === "henry@henryco.com",
  });

  checks.push({
    name: "email.normalize.invalid_returns_null",
    ok: normalizeEmail("not-an-email") === null,
  });

  checks.push({
    name: "email.disposable_detected",
    ok: isDisposableEmail("someone@mailinator.com"),
  });

  checks.push({
    name: "email.role_detected",
    ok: isRoleEmail("noreply@henrycogroup.com"),
  });

  checks.push({
    name: "locale.normalize",
    ok: normalizeLocale("en_NG") === "en-NG" && normalizeLocale(null) === "en-NG",
  });

  checks.push({
    name: "country.normalize_valid",
    ok: normalizeCountry("ng") === "NG" && normalizeCountry("NGA") === null,
  });

  const normalized = normalizeSubscriptionInput(
    {
      email: " Reader@HenryCo.com ",
      topicKeys: ["company_digest", "not_a_topic"],
      locale: "en-NG",
      country: "NG",
    },
    { allowedTopicKeys }
  );

  checks.push({
    name: "subscriber.normalize.ok_drops_unknown_topics",
    ok:
      normalized.ok && normalized.value.topicKeys.length === 1 && normalized.value.topicKeys[0] === "company_digest",
  });

  const rejected = normalizeSubscriptionInput(
    { email: "not-email", topicKeys: [] },
    { allowedTopicKeys }
  );
  checks.push({
    name: "subscriber.normalize.rejects_invalid",
    ok: !rejected.ok && rejected.ok === false && rejected.errors.length >= 2,
  });

  const secret = "test-secret-at-least-32-chars-please-long";
  const token = buildPreferenceToken({
    secret,
    email: "reader@henryco.com",
    subscriberId: "sub_123",
  });
  const verified = verifyPreferenceToken({ secret, token });
  checks.push({
    name: "token.roundtrip",
    ok: verified.ok === true && verified.ok && verified.payload.e === "reader@henryco.com",
  });

  const tampered = verifyPreferenceToken({
    secret,
    token: token.replace(/.$/, token.endsWith("A") ? "B" : "A"),
  });
  checks.push({
    name: "token.tampered_rejected",
    ok: !tampered.ok,
  });

  const wrongSecret = verifyPreferenceToken({
    secret: "different-secret-at-least-32-chars-long",
    token,
  });
  checks.push({
    name: "token.wrong_secret_rejected",
    ok: !wrongSecret.ok,
  });

  const suppressionDecision = evaluateSuppression({
    subscriber: {
      email: "reader@henryco.com",
      status: "active",
      hardBounceCount: 0,
      softBounceCount: 0,
      lastBouncedAt: null,
    },
    campaignClass: "division_digest",
    suppressionEntries: [],
    supportState: {
      unresolvedCriticalThreads: 0,
      unresolvedDisputes: 0,
      activeTrustHold: false,
      activePaymentIncident: false,
      legalHold: false,
    },
  });
  checks.push({
    name: "suppression.clean_subscriber_allowed",
    ok: suppressionDecision.allowed,
  });

  const disputeDecision = evaluateSuppression({
    subscriber: {
      email: "reader@henryco.com",
      status: "active",
      hardBounceCount: 0,
      softBounceCount: 0,
      lastBouncedAt: null,
    },
    campaignClass: "division_digest",
    suppressionEntries: [],
    supportState: {
      unresolvedCriticalThreads: 0,
      unresolvedDisputes: 1,
      activeTrustHold: false,
      activePaymentIncident: false,
      legalHold: false,
    },
  });
  checks.push({
    name: "suppression.dispute_blocks_marketing",
    ok: !disputeDecision.allowed && disputeDecision.reason === "dispute_active",
  });

  const disputeTransactional = evaluateSuppression({
    subscriber: {
      email: "reader@henryco.com",
      status: "active",
      hardBounceCount: 0,
      softBounceCount: 0,
      lastBouncedAt: null,
    },
    campaignClass: "transactional_education",
    suppressionEntries: [],
    supportState: {
      unresolvedCriticalThreads: 0,
      unresolvedDisputes: 1,
      activeTrustHold: false,
      activePaymentIncident: false,
      legalHold: false,
    },
  });
  checks.push({
    name: "suppression.dispute_still_allows_transactional",
    ok: disputeTransactional.allowed,
  });

  const hardBounce = evaluateSuppression({
    subscriber: {
      email: "reader@henryco.com",
      status: "active",
      hardBounceCount: 2,
      softBounceCount: 0,
      lastBouncedAt: null,
    },
    campaignClass: "division_digest",
    suppressionEntries: [],
  });
  checks.push({
    name: "suppression.hard_bounce_blocks_all",
    ok: !hardBounce.allowed && hardBounce.reason === "hard_bounce",
  });

  const segmentSize = estimateSegmentSize(
    { excludeDormant: true },
    [
      {
        subscriber: {
          id: "s1",
          email: "a@b.com",
          userId: null,
          locale: "en-NG",
          country: "NG",
          status: "active",
          sourceSurface: null,
          sourceDivision: null,
          consentGivenAt: null,
          confirmedAt: null,
          unsubscribedAt: null,
          lastEngagementAt: null,
          lastBouncedAt: null,
          hardBounceCount: 0,
          softBounceCount: 0,
          createdAt: "",
          updatedAt: "",
        },
        topicKeys: ["company_digest"],
        lifecycleStage: "active",
      },
      {
        subscriber: {
          id: "s2",
          email: "c@d.com",
          userId: null,
          locale: "en-NG",
          country: "NG",
          status: "active",
          sourceSurface: null,
          sourceDivision: null,
          consentGivenAt: null,
          confirmedAt: null,
          unsubscribedAt: null,
          lastEngagementAt: null,
          lastBouncedAt: null,
          hardBounceCount: 0,
          softBounceCount: 0,
          createdAt: "",
          updatedAt: "",
        },
        topicKeys: ["company_digest"],
        lifecycleStage: "dormant",
      },
    ]
  );
  checks.push({
    name: "segment.exclude_dormant_works",
    ok: segmentSize === 1,
  });

  const voice = runVoiceGuard({
    content: {
      subject: "BUY NOW!! Last chance 100% guaranteed",
      previewText: "Limited time offer for our valued customer",
      headline: "Unlock the power of HenryCo",
      bodyBlocks: [{ kind: "paragraph", text: "Click here to claim your risk-free bonus." }],
      footerNote: null,
      ctaPrimary: null,
      ctaSecondary: null,
    },
    campaignClass: "division_digest",
  });
  checks.push({
    name: "voice.catches_spammy_draft",
    ok: voice.blocks.length > 0 && voice.warnings.length >= 4,
  });

  const clean = runVoiceGuard({
    content: {
      subject: "This week at HenryCo marketplace",
      previewText: "Three small updates worth your time.",
      headline: "Three small updates",
      bodyBlocks: [
        { kind: "paragraph", text: "We shipped seller trust scoring, a clearer payout view, and better search." },
        { kind: "paragraph", text: "If it isn't useful, manage preferences below." },
      ],
      footerNote: "You can unsubscribe or manage preferences any time.",
      ctaPrimary: { label: "Open marketplace", href: "https://henryco.com/marketplace" },
      ctaSecondary: null,
    },
    campaignClass: "division_digest",
  });
  checks.push({
    name: "voice.clean_draft_passes",
    ok: clean.blocks.length === 0,
  });

  const skeleton = buildDraftSkeleton({
    division: "marketplace",
    campaignClass: "division_digest",
    topic: NEWSLETTER_TOPICS.find((t) => t.key === "marketplace_digest") ?? null,
    angle: "three improvements to seller trust",
    audienceDescription: "marketplace digest subscribers",
    primaryCta: { label: "Open marketplace", href: "https://henrycogroup.com/marketplace" },
    secondaryCta: null,
    factsToInclude: [
      "Seller trust scoring is live",
      "Payout visibility improved",
      "Search now filters protected routes",
    ],
    authorName: "Henry",
  });
  checks.push({
    name: "draft.skeleton_has_cta_and_facts",
    ok:
      skeleton.ctaPrimary !== null &&
      skeleton.bodyBlocks.some((block) => block.kind === "heading") &&
      skeleton.bodyBlocks.filter((block) => block.kind === "paragraph").length >= 3,
  });

  const reading = estimateReadingTimeSeconds(skeleton);
  checks.push({
    name: "draft.reading_time_reasonable",
    ok: reading >= 15 && reading < 120,
    detail: `reading=${reading}s`,
  });

  checks.push({
    name: "draft.render_html_includes_footer_placeholders",
    ok: renderDraftAsHtml(skeleton).includes("{{unsubscribe_url}}") && renderDraftAsHtml(skeleton).includes("{{preferences_url}}"),
  });

  const brevoConfig = resolveBrevoConfig({});
  checks.push({
    name: "brevo.disabled_without_key",
    ok: !isBrevoEnabled(brevoConfig),
  });

  const brevoConfigKey = resolveBrevoConfig({ BREVO_API_KEY: "xkeysib-abc" });
  checks.push({
    name: "brevo.enabled_with_key",
    ok: isBrevoEnabled(brevoConfigKey),
  });

  checks.push({
    name: "segments.defaults_present",
    ok: DEFAULT_SEGMENTS.length >= 5 && DEFAULT_SEGMENTS.every((s) => s.criteria !== undefined),
  });

  checks.push({
    name: "rules.defaults_cover_banned_and_disclosure",
    ok:
      getDefaultBrandVoiceRules().some((r) => r.kind === "banned_phrase") &&
      getDefaultBrandVoiceRules().some((r) => r.kind === "required_disclosure"),
  });

  checks.push({
    name: "enums.stable",
    ok:
      NEWSLETTER_SUBSCRIBER_STATUSES.length === 5 &&
      NEWSLETTER_SUPPRESSION_REASONS.length >= 11 &&
      NEWSLETTER_SUPPRESSION_SCOPES.length === 5 &&
      NEWSLETTER_CAMPAIGN_STATUSES.length === 10 &&
      NEWSLETTER_CAMPAIGN_CLASSES.length === 5 &&
      NEWSLETTER_SEND_STATUSES.length >= 11,
  });

  const segmentResolution = resolveSegment({
    segment: {
      id: "seg",
      key: "t",
      label: "t",
      description: "",
      criteria: { topics: ["company_digest"] },
      estimatedSize: null,
      lastResolvedAt: null,
      ownerTeam: "Editorial",
      createdAt: "",
      updatedAt: "",
    },
    candidates: [
      {
        subscriber: {
          id: "s1",
          email: "clean@henryco.com",
          userId: null,
          locale: "en-NG",
          country: "NG",
          status: "active",
          sourceSurface: null,
          sourceDivision: null,
          consentGivenAt: null,
          confirmedAt: null,
          unsubscribedAt: null,
          lastEngagementAt: null,
          lastBouncedAt: null,
          hardBounceCount: 0,
          softBounceCount: 0,
          createdAt: "",
          updatedAt: "",
        },
        topicKeys: ["company_digest"],
      },
      {
        subscriber: {
          id: "s2",
          email: "suppressed@henryco.com",
          userId: null,
          locale: "en-NG",
          country: "NG",
          status: "active",
          sourceSurface: null,
          sourceDivision: null,
          consentGivenAt: null,
          confirmedAt: null,
          unsubscribedAt: null,
          lastEngagementAt: null,
          lastBouncedAt: null,
          hardBounceCount: 2,
          softBounceCount: 0,
          createdAt: "",
          updatedAt: "",
        },
        topicKeys: ["company_digest"],
      },
    ],
    suppressionEntries: [],
    campaignClass: "division_digest",
  });
  checks.push({
    name: "segment.resolution_filters_bounced",
    ok: segmentResolution.matchedCount === 1 && segmentResolution.skippedCount === 1,
  });

  return checks;
}

export function summarizeSanity(checks: SanityCheck[]): {
  passed: number;
  failed: number;
  failures: SanityCheck[];
} {
  const failed = checks.filter((c) => !c.ok);
  return {
    passed: checks.length - failed.length,
    failed: failed.length,
    failures: failed,
  };
}
