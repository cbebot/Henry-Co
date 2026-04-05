import { getAccountUrl, getDivisionUrl, getHqUrl } from "@henryco/config";
import { sellerPlans } from "@/lib/marketplace/governance";

export const sellerTrustTierRules = [
  {
    tier: "Unverified",
    privileges: "Up to 8 active listings, strict moderation, no premium high-risk category access, longest payout reserve.",
    payoutWindow: "10-day payout reserve, 5-day auto-release after verified delivery.",
  },
  {
    tier: "Basic verified",
    privileges: "Up to 30 active listings, standard moderation, growth plan economics, featured placement only after clean history.",
    payoutWindow: "7-day payout reserve, 4-day auto-release after verified delivery.",
  },
  {
    tier: "Trusted seller",
    privileges: "Up to 90 active listings, high-risk category access, featured placement eligibility, lighter moderation unless risk spikes.",
    payoutWindow: "4-day payout reserve, 3-day auto-release after verified delivery.",
  },
  {
    tier: "Premium verified business",
    privileges: "Up to 250 active listings, stronger merchandising access, faster payout posture, stronger trust badge treatment.",
    payoutWindow: "2-day payout reserve, 2-day auto-release after verified delivery.",
  },
  {
    tier: "HenryCo verified partner",
    privileges: "Partner inventory terms, direct placement controls, lowest payout friction, top trust passport treatment.",
    payoutWindow: "1-day payout reserve, 1-day auto-release after verified delivery.",
  },
];

export const ecosystemOffers = [
  {
    title: "Studio launch services",
    body: "Sellers can buy HenryCo Studio help for storefront setup, product photography, creative assets, conversion copy, and merchandising refreshes.",
    href: `${getDivisionUrl("studio")}/services`,
  },
  {
    title: "Learn seller academy",
    body: "Seller coaching routes into Learn so onboarding, moderation hygiene, and trust readiness can materially improve seller performance.",
    href: `${getDivisionUrl("learn")}/courses/marketplace-seller-academy`,
  },
  {
    title: "Logistics verification",
    body: "Delivery proof, tracking confidence, and payout-release evidence can route through HenryCo Logistics where supported.",
    href: `${getDivisionUrl("logistics")}/track`,
  },
  {
    title: "HQ operator controls",
    body: "Moderation, finance, payout review, and trust operations can escalate into HenryCo HQ and Workspace operating surfaces.",
    href: getHqUrl("/"),
  },
  {
    title: "Shared account continuity",
    body: "Orders, disputes, seller application state, and marketplace notifications follow the shared HenryCo account instead of a competing auth silo.",
    href: getAccountUrl("/marketplace"),
  },
];

export const policyPages = [
  {
    slug: "buyer-protection",
    title: "Buyer Protection Policy",
    kicker: "Protected commerce",
    summary: "HenryCo receives buyer payment first, holds funds through fulfillment, and can freeze seller payout when delivery proof or dispute posture is weak.",
    bullets: [
      "Buyer payment is held by HenryCo until verified delivery and completion logic clears the payout segment.",
      "Open disputes freeze payout release on affected order groups.",
      "Verified delivery plus timeout can trigger payout release when buyers do not confirm promptly and no dispute exists.",
    ],
  },
  {
    slug: "seller-policy",
    title: "Seller Policy",
    kicker: "Seller operating standards",
    summary: "Seller trust tier, listing quality, dispute history, and payout hygiene directly affect posting rights, category access, featured placement, and payout speed.",
    bullets: [
      "Seller trust is not cosmetic; it changes listing limits, high-risk category access, featured eligibility, and payout reserve windows.",
      "Off-platform payment steering, duplicate spam listings, and suspicious media reuse can block submission or trigger moderation cases.",
      "Seller payouts stay server-controlled and can be delayed, frozen, or rejected after trust review.",
    ],
  },
  {
    slug: "listing-standards",
    title: "Listing Standards",
    kicker: "Listing quality rules",
    summary: "Marketplace listings are scored for quality and risk before they move into approval queues.",
    bullets: [
      "Thin titles, weak summaries, missing images, vague delivery notes, and missing SKU metadata reduce listing quality score.",
      "Duplicate primary images, suspicious wording, and listing velocity spikes increase risk score and can force manual review.",
      "Featured placement requests only unlock for eligible trust tiers and still remain subject to operator approval.",
    ],
  },
  {
    slug: "prohibited-goods-services",
    title: "Prohibited Goods & Services",
    kicker: "Prohibited inventory",
    summary: "Counterfeit goods, unsafe products, deceptive services, and content designed to route payments off-platform are not allowed.",
    bullets: [
      "Counterfeit, stolen, deceptive, or unsafe products are prohibited.",
      "Listings asking buyers to pay directly on WhatsApp, Telegram, crypto, or outside HenryCo checkout can be blocked automatically.",
      "Higher-risk categories require stronger seller trust before listing access opens.",
    ],
  },
  {
    slug: "returns-refunds",
    title: "Return & Refund Policy",
    kicker: "Refund governance",
    summary: "Refund and return outcomes must align with order evidence, payout state, and dispute review.",
    bullets: [
      "Refund decisions are recorded against disputes and reflected in payout state changes.",
      "Affected seller funds can remain frozen or be marked refunded before payout release.",
      "Buyer-facing expectations stay visible in account, tracking, and dispute flows.",
    ],
  },
  {
    slug: "dispute-resolution",
    title: "Dispute Resolution Policy",
    kicker: "Evidence-led resolution",
    summary: "Disputes create a formal case, freeze affected payout segments, and route into support and moderation queues.",
    bullets: [
      "Evidence capture, notes, and decision trail are stored server-side.",
      "Resolved disputes can return funds to auto-release monitoring or mark affected segments as refunded.",
      "False buyer or seller behavior can degrade future trust posture.",
    ],
  },
  {
    slug: "payout-policy",
    title: "Payout Policy",
    kicker: "Controlled payout release",
    summary: "Seller funds move through held, releasable, requested, approved, released, or frozen states with audit trail and finance review.",
    bullets: [
      "Payout requests can only draw from releasable balances calculated from order-group truth.",
      "Newer or weaker-trust sellers face longer reserve windows before funds become releasable.",
      "Finance can approve, reject, freeze, or release payout requests; client-side balance mutation is not allowed.",
    ],
  },
  {
    slug: "seller-verification",
    title: "Seller Verification Policy",
    kicker: "Trust ladder",
    summary: "Seller verification combines account identity, delivery reliability, dispute posture, and staff review into real privilege changes.",
    bullets: [
      "Verification levels influence listing limits, payout speed, category access, and featured placement rights.",
      "Stronger seller history can shorten payout reserve and auto-release windows.",
      "Moderation incidents and dispute spikes can pull sellers back into stricter review posture.",
    ],
  },
  {
    slug: "trust-safety",
    title: "Trust & Safety Rules",
    kicker: "Multi-angle fraud control",
    summary: "Marketplace trust combines risk scoring, moderation queues, watchlist behaviors, delivery verification, and communication review.",
    bullets: [
      "Suspicious messaging, risky listing copy, repeated media, and unusual payout patterns trigger queue visibility.",
      "High-risk behaviors can freeze payout, reduce permissions, or route a seller into manual review.",
      "Buyer abuse patterns are also monitored to reduce false disputes and refund abuse.",
    ],
  },
  {
    slug: "referral-reward",
    title: "Referral & Reward Policy",
    kicker: "Referral controls",
    summary: "Referral and reward programs must remain abuse-resistant and consistent with trust posture.",
    bullets: [
      "Rapid multi-account creation or suspicious transaction loops can disqualify referral value.",
      "Rewards remain subject to payout fraud review.",
      "Promotional incentives do not override moderation, dispute, or payout controls.",
    ],
  },
  {
    slug: "featured-listings",
    title: "Featured Listing Policy",
    kicker: "Sponsored placement governance",
    summary: "Featured placement is a paid privilege gated by seller trust, listing quality, and operator approval.",
    bullets: [
      "Featured placement pricing depends on seller plan and trust posture.",
      "Only eligible sellers can request featured slots, and risky listings can still be denied placement.",
      "Featured spend does not override prohibited goods, quality, or anti-fraud rules.",
    ],
  },
];

export const sellerPlanRows = sellerPlans.map((plan) => ({
  ...plan,
  monthlyLabel: plan.monthlyFee == null ? "Custom" : plan.monthlyFee === 0 ? "Free" : `NGN ${plan.monthlyFee.toLocaleString()}/month`,
  marketplaceFeeLabel: `${Math.round(plan.commissionRate * 100)}% commission`,
  payoutFeeLabel:
    plan.payoutFeeRate === 0 && plan.payoutFeeFlat === 0
      ? "Custom payout terms"
      : `${Math.round(plan.payoutFeeRate * 1000) / 10}% + NGN ${plan.payoutFeeFlat.toLocaleString()}`,
}));
