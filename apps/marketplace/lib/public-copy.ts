import type { AppLocale } from "@henryco/i18n/server";
import { deepMergeMessages, translateSurfaceLabel, type DeepPartial } from "@henryco/i18n";

export type MarketplacePublicCopy = {
  home: {
    heroKicker: string;
    heroTitle: string;
    heroBody: string;
    primaryCta: string;
    secondaryCta: string;
    quickCards: Array<{ title: string; body: string }>;
    whyKicker: string;
    whyTitle: string;
    whyCards: Array<{ title: string; body: string }>;
    emptyTitle: string;
    emptyBody: string;
    emptyCta: string;
    categoryKicker: string;
    categoryTitle: string;
    categoryLink: string;
    freshKicker: string;
    freshTitle: string;
    featuredKicker: string;
    featuredTitle: string;
    browseAll: string;
    collectionsKicker: string;
    collectionsTitle: string;
    vendorsKicker: string;
    vendorsTitle: string;
    standardsKicker: string;
    standardsTitle: string;
    standardsBullets: string[];
    sellerKicker: string;
    sellerTitle: string;
    sellerBody: string;
    sellerBullets: string[];
  };
  kpiLabels: {
    verifiedStores: string;
    activeListings: string;
    trustRating: string;
  };
  kpiHints: {
    verifiedStores: string;
    activeListings: string;
    trustRating: string;
  };
  footer: {
    brandSubtitle: string;
    brandBody: string;
    shopTitle: string;
    sellTitle: string;
    supportTitle: string;
    supportBody: string;
    shopLinks: Array<{ href: string; label: string }>;
    sellLinks: Array<{ href: string; label: string; external?: boolean }>;
  };
  productCard: {
    stockedByHenryCo: string;
    verifiedSeller: string;
    onlyLeft: string;
    saveToWishlist: string;
    removeFromWishlist: string;
    updatingWishlist: string;
    codReady: string;
    addToCart: string;
    addingToCart: string;
    view: string;
  };
  trustPassport: {
    title: string;
    verification: string;
    fulfillment: string;
    disputeRate: string;
    responseSla: string;
    visitStore: string;
  };
  workspace: {
    kicker: string;
    operatorKicker: string;
  };
  cart: {
    pageIntro: {
      kicker: string;
      title: string;
      description: string;
    };
    emptyState: {
      title: string;
      body: string;
      ctaLabel: string;
    };
  };
  track: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      kicker: string;
      titlePrefix: string;
      orderValueLabel: string;
      paymentLabel: string;
      payoutControlLabel: string;
      payoutFrozen: string;
      payoutEscrowActive: string;
    };
    paymentRecord: {
      kicker: string;
      walletBody: string;
      proofBody: string;
      awaitingBody: string;
      methodLabel: string;
      statusLabel: string;
      proofLabel: string;
      viewProof: string;
      walletDebit: string;
      pending: string;
    };
    timeline: {
      title: string;
    };
    segments: {
      title: string;
      henrycoSegment: string;
      fulfillmentLabel: string;
      trackingLabel: string;
      payoutLabel: string;
      trackingPending: string;
    };
    completion: {
      kicker: string;
      body: string;
      confirmCta: string;
    };
    help: {
      kicker: string;
      title: string;
      body: string;
      openSupportCta: string;
      viewAllOrdersCta: string;
    };
  };
  deals: {
    metadata: {
      title: string;
      description: string;
    };
    pageIntro: {
      kicker: string;
      title: string;
    };
    sectionLabel: string;
    listEyebrow: string;
    discountBadgePrefix: string;
    emptyState: {
      title: string;
    };
  };
  category: {
    hero: {
      kicker: string;
      searchCta: string;
      trustCta: string;
      quickFiltersLabel: string;
    };
    stats: {
      activeListingsLabel: string;
    };
    collectionsRail: {
      title: string;
    };
    catalog: {
      title: string;
      openSearch: string;
    };
    metadata: {
      titleTemplate: string;
      descriptionTemplate: string;
      fallbackDescription: string;
    };
  };
  brand: {
    eyebrow: string;
    bodyFallback: string;
    searchCta: string;
    trustCta: string;
    stats: {
      activeProducts: string;
      buyerProtection: string;
      buyerProtectionValue: string;
    };
    liveKicker: string;
    openFullSearch: string;
    metadataTitle: string;
    metadataDescription: string;
  };
  store: {
    metadataTitle: string;
    metadataDescription: string;
    metadataDescriptionFallback: string;
    hero: {
      eyebrow: string;
      bodyFallback: string;
    };
    stats: {
      trustScore: string;
      followers: string;
    };
    standards: {
      eyebrow: string;
    };
    support: {
      eyebrow: string;
      ctaLabel: string;
      subjectTemplate: string;
    };
    reviews: {
      eyebrow: string;
      verifiedPurchase: string;
      review: string;
    };
    catalog: {
      title: string;
      exploreLink: string;
      emptyTitle: string;
      emptyBody: string;
    };
  };
  sell: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      kicker: string;
      title: string;
      body: string;
      primaryCta: string;
      secondaryCta: string;
      signInCta: string;
      highlights: Array<{ label: string; value: string }>;
    };
    onboarding: {
      kicker: string;
      stepLabel: string;
      steps: Array<{ step: string; title: string }>;
    };
    plans: {
      kicker: string;
      title: string;
      feeLabel: string;
      payoutLabel: string;
      includedLabel: string;
      includedSuffix: string;
      featuredLabel: string;
      featuredCurrencyPrefix: string;
    };
    closing: {
      kicker: string;
      title: string;
      primaryCta: string;
      secondaryCta: string;
    };
  };
  sellPricing: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      kicker: string;
      title: string;
      body: string;
      primaryCta: string;
      secondaryCta: string;
      statsLabels: {
        planTiers: string;
        trustTiers: string;
        featuredSlots: string;
      };
      featuredSlotsValue: string;
    };
    plans: {
      kicker: string;
      feeLabel: string;
      payoutLabel: string;
      includedLabel: string;
      includedSuffix: string;
      extraListingLabel: string;
      featuredSlotLabel: string;
      currencyPrefix: string;
      ctaPartner: string;
      ctaTemplate: string;
    };
    economics: {
      title: string;
      items: string[];
    };
    trustTiers: {
      title: string;
    };
    closing: {
      kicker: string;
      title: string;
      primaryCta: string;
      secondaryCta: string;
    };
  };
  help: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      kicker: string;
      title: string;
    };
    stillNeedHelp: {
      kicker: string;
      title: string;
      ctaLabel: string;
    };
  };
  trust: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      kicker: string;
      title: string;
    };
    guardrails: {
      items: Array<{ title: string; body: string }>;
    };
    policySurfaces: {
      title: string;
    };
  };
  collections: {
    metadata: {
      titleTemplate: string;
      descriptionTemplate: string;
      fallbackDescription: string;
    };
    hero: {
      primaryCta: string;
      secondaryCta: string;
    };
    sidebar: {
      itemsLabel: string;
      buyerProtectionLabel: string;
      buyerProtectionValue: string;
    };
    rail: {
      kicker: string;
      itemsSuffix: string;
    };
  };
  policies: {
    metadata: {
      titleTemplate: string;
      descriptionTemplate: string;
      fallbackTitle: string;
      fallbackDescription: string;
    };
    hero: {
      backToTrust: string;
      openSupport: string;
    };
    details: {
      coverageLabel: string;
      updatedLabel: string;
    };
    coverageBySlug: {
      buyerProtection: string;
      sellerPolicy: string;
      fallback: string;
    };
    updatedBySlug: {
      buyerProtection: string;
      sellerPolicy: string;
      fallback: string;
    };
    provisions: {
      kicker: string;
    };
  };
  product: {
    metadata: {
      titleTemplate: string;
      descriptionTemplate: string;
      fallbackDescription: string;
    };
    fulfillment: {
      availabilityLabel: string;
      availabilityValueSingular: string;
      availabilityValuePlural: string;
      fulfillmentLabel: string;
      paymentLabel: string;
      paymentValueCod: string;
      paymentValueVerified: string;
      protectionLabel: string;
      protectionValue: string;
    };
    price: {
      label: string;
      leadTimeLabel: string;
    };
    detail: {
      title: string;
      deliverySummaryTitle: string;
      deliveryTail: string;
      specsTitle: string;
      passportTitle: string;
      visitVendorTemplate: string;
      exploreCategoryTemplate: string;
      seeBrandTemplate: string;
    };
    related: {
      title: string;
    };
    reviews: {
      kicker: string;
      title: string;
      verifiedPurchase: string;
      reviewLabel: string;
    };
    rail: {
      kicker: string;
      headline: string;
      ctaLabel: string;
    };
  };
};

function buildEN(locale: AppLocale): MarketplacePublicCopy {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  home: {
    heroKicker: t("Refined premium marketplace"),
    heroTitle: t("Buy from verified stores without the noise, clutter, or trust guesswork."),
    heroBody:
      t("Henry Onyx Marketplace turns multi-vendor commerce into a calmer experience: cleaner discovery, quick-add from every card, split-order clarity, stronger seller passports, and a single Henry Onyx account for orders, payments, reviews, and support."),
    primaryCta: t("Explore the catalog"),
    secondaryCta: t("Sell on Henry Onyx"),
    quickCards: [
      {
        title: t("Quick-add everywhere"),
        body: t("Small card-level cart controls, instant mini-cart updates, and no clumsy refresh loops."),
      },
      {
        title: t("Verified trust rails"),
        body: t("Seller passports, delivery promises, review quality, and stock ownership stay easy to read."),
      },
      {
        title: t("One account, less friction"),
        body: t("Orders, payments, wishlist, follows, and notifications stay together in one Henry Onyx account."),
      },
    ],
    whyKicker: t("Why this feels different"),
    whyTitle: t("Trust is visible before payment."),
    whyCards: [
      {
        title: t("Trust is visible before payment"),
        body: t("Verification level, dispute rate, support responsiveness, and fulfillment reliability stay close to the buying decision."),
      },
      {
        title: t("Split-order clarity stays readable"),
        body: t("When inventory comes from different vendors or Henry Onyx stock, delivery segmentation stays obvious instead of becoming checkout confusion."),
      },
      {
        title: t("Sellers are curated, not dumped into a grid"),
        body: t("The marketplace favors stronger stores, cleaner listings, and better post-order accountability over catalog sprawl."),
      },
    ],
    emptyTitle: t("The catalog is being prepared."),
    emptyBody: t("Approved products, collections, and campaigns will appear here as they go live."),
    emptyCta: t("Contact marketplace support"),
    categoryKicker: t("Category discovery"),
    categoryTitle: t("Discover by mood, room, and trust level."),
    categoryLink: t("Open search"),
    freshKicker: t("Fresh approvals"),
    freshTitle: t("New in the marketplace right now."),
    featuredKicker: t("Featured products"),
    featuredTitle: t("Premium cards, instant carting, and cleaner buying signals."),
    browseAll: t("Browse all"),
    collectionsKicker: t("Editorial collections"),
    collectionsTitle: t("Curated rails that guide decisions without shouting."),
    vendorsKicker: t("Trusted stores"),
    vendorsTitle: t("Verified vendors with clearer accountability."),
    standardsKicker: t("Marketplace standards"),
    standardsTitle: t("Built for trust, clarity, and a calmer buying experience."),
    standardsBullets: [
      t("Seller applications, moderation, and approvals are reviewed through dedicated Henry Onyx review lanes."),
      t("Order updates, reviews, support, and payments stay connected to the same buyer account."),
      t("Support, payment review, and delivery operations stay organized so responses remain consistent."),
    ],
    sellerKicker: t("Seller quality"),
    sellerTitle: t("Serious sellers start inside their Henry Onyx account."),
    sellerBody:
      t("Public visitors can learn about selling on /sell, while the application, draft progress, review updates, and approval status stay inside the seller account experience."),
    sellerBullets: [
      t("Draft saving and progress visibility"),
      t("Private document handling in the right place"),
      t("Clear approval updates for every seller"),
    ],
  },
  kpiLabels: {
    verifiedStores: t("Approved stores"),
    activeListings: t("Active listings"),
    trustRating: t("Trust rating"),
  },
  kpiHints: {
    verifiedStores: t("Curated sellers and Henry Onyx-owned inventory with clearer accountability."),
    activeListings: t("Approved listings surfaced with delivery, trust, and ownership clarity."),
    trustRating: t("Marketplace review quality and seller reliability are surfaced before checkout."),
  },
  footer: {
    brandSubtitle: t("Refined commerce with one connected Henry Onyx account"),
    brandBody: t("Henry Onyx Marketplace is built for high-trust buying, verified sellers, and a cleaner experience from checkout to delivery."),
    shopTitle: t("Shop"),
    sellTitle: t("Sell"),
    supportTitle: t("Support"),
    supportBody:
      t("Orders, seller conversations, support updates, and payment records stay connected in one Henry Onyx account."),
    shopLinks: [
      { href: "/search", label: t("Search the marketplace") },
      { href: "/deals", label: t("Deals and timed edits") },
      { href: "/trust", label: t("Trust passport") },
      { href: "/policies/buyer-protection", label: t("Buyer protection policy") },
      { href: "/help", label: t("Support and resolution") },
    ],
    sellLinks: [
      { href: "/sell", label: t("Why sell on Henry Onyx") },
      { href: "/sell/pricing", label: t("Seller pricing and fees") },
      { href: "/policies/seller-policy", label: t("Seller policy") },
      { href: "/account/seller-application", label: t("Seller application") },
      { href: "/vendor", label: t("Vendor workspace") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("Henry Onyx stocked"),
    verifiedSeller: t("Verified seller"),
    onlyLeft: t("Only {count} left"),
    saveToWishlist: t("Save to wishlist"),
    removeFromWishlist: t("Remove from wishlist"),
    updatingWishlist: t("Updating wishlist"),
    codReady: t("COD ready"),
    addToCart: t("Add to cart"),
    addingToCart: t("Adding to cart"),
    view: t("View"),
  },
  trustPassport: {
    title: t("Trust Passport"),
    verification: t("Verification"),
    fulfillment: t("Fulfillment"),
    disputeRate: t("Dispute Rate"),
    responseSla: t("Response SLA"),
    visitStore: t("Visit store"),
  },
  workspace: {
    kicker: t("Workspace"),
    operatorKicker: t("Operator Surface"),
  },
  cart: {
    pageIntro: {
      kicker: t("Cart"),
      title: t("Your cart"),
      description: t("Review your items, then continue to checkout."),
    },
    emptyState: {
      title: t("Your cart is still empty."),
      body: t("Add products from any listing."),
      ctaLabel: t("Browse products"),
    },
  },
  track: {
    metadata: {
      title: t("Order tracking — Henry Onyx Marketplace"),
      description: t("Follow an order's payment and delivery status on Henry Onyx Marketplace."),
    },
    hero: {
      kicker: t("Order tracking"),
      titlePrefix: t("Tracking"),
      orderValueLabel: t("Order value"),
      paymentLabel: t("Payment"),
      payoutControlLabel: t("Payout control"),
      payoutFrozen: t("Frozen"),
      payoutEscrowActive: t("Escrow active"),
    },
    paymentRecord: {
      kicker: t("Payment record"),
      walletBody: t("Wallet balance was debited and the order is held in escrow for fulfillment."),
      proofBody: t("Your transfer proof is attached and under review."),
      awaitingBody: t("This payment is waiting for your transfer to be confirmed, or for delivery to be completed."),
      methodLabel: t("Method"),
      statusLabel: t("Status"),
      proofLabel: t("Proof"),
      viewProof: t("View proof"),
      walletDebit: t("Wallet debit"),
      pending: t("Pending"),
    },
    timeline: {
      title: t("Timeline"),
    },
    segments: {
      title: t("Shipments by seller"),
      henrycoSegment: t("Henry Onyx"),
      fulfillmentLabel: t("Fulfillment"),
      trackingLabel: t("Tracking"),
      payoutLabel: t("Payout"),
      trackingPending: t("Pending"),
    },
    completion: {
      kicker: t("Completion confirmation"),
      body: t("Confirm completion once the order is satisfactory. Henry Onyx only releases seller payout after delivery is confirmed or the order qualifies for auto-release."),
      confirmCta: t("Confirm completion"),
    },
    help: {
      kicker: t("Need help?"),
      title: t("Disputes and delivery concerns route through one thread."),
      body: t("Refunds are arranged by our team after review."),
      openSupportCta: t("Open support thread"),
      viewAllOrdersCta: t("View all orders"),
    },
  },
  deals: {
    metadata: {
      title: t("Deals — Henry Onyx Marketplace"),
      description: t("Approved listings currently priced below their compare-at price on Henry Onyx Marketplace."),
    },
    pageIntro: {
      kicker: t("Deals"),
      title: t("Approved listings priced below their compare-at price."),
    },
    sectionLabel: t("Deals"),
    listEyebrow: t("Current deals"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("No deals right now"),
    },
  },
  category: {
    hero: {
      kicker: t("Category edit"),
      searchCta: t("Search this category"),
      trustCta: t("Review trust standards"),
      quickFiltersLabel: t("Quick filters"),
    },
    stats: {
      activeListingsLabel: t("Active listings"),
    },
    collectionsRail: {
      title: t("Collections"),
    },
    catalog: {
      title: t("Products"),
      openSearch: t("Open full search"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
      descriptionTemplate: t("Shop {category} from approved stores on Henry Onyx Marketplace."),
      fallbackDescription: t("Browse a category on Henry Onyx Marketplace."),
    },
  },
  brand: {
    eyebrow: t("Brand"),
    bodyFallback: t("A brand on Henry Onyx Marketplace."),
    searchCta: t("Search this brand"),
    trustCta: t("Trust standards"),
    stats: {
      activeProducts: t("Active products"),
      buyerProtection: t("Buyer protection"),
      buyerProtectionValue: t("Card and wallet payments held until delivery"),
    },
    liveKicker: t("Live from {brand}"),
    openFullSearch: t("Open full search"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
    metadataDescription: t("Products from {brand} on Henry Onyx Marketplace."),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    metadataDescription: t("Products from {store} on Henry Onyx Marketplace."),
    metadataDescriptionFallback: t("A store on Henry Onyx Marketplace."),
    hero: {
      eyebrow: t("Store"),
      bodyFallback: t("An approved seller on Henry Onyx Marketplace."),
    },
    stats: {
      trustScore: t("Trust score"),
      followers: t("Followers"),
    },
    standards: {
      eyebrow: t("Store standards"),
    },
    support: {
      eyebrow: t("Support"),
      ctaLabel: t("Contact this store"),
      subjectTemplate: t("Question for {store}"),
    },
    reviews: {
      eyebrow: t("Recent reviews"),
      verifiedPurchase: t("Ordered on Henry Onyx"),
      review: t("Review"),
    },
    catalog: {
      title: t("Products"),
      exploreLink: t("Explore more verified listings"),
      emptyTitle: t("No live listings just yet"),
      emptyBody: t("Approved products from this store will appear here as they go live."),
    },
  },
  sell: {
    metadata: {
      title: t("Sell on Henry Onyx Marketplace"),
      description: t("Apply to sell on Henry Onyx Marketplace. Every store is reviewed and approved before it can sell."),
    },
    hero: {
      kicker: t("Sell on Henry Onyx"),
      title: t("Selective by design. Built for sellers who lead on trust."),
      body: t("Every store is reviewed and approved by Henry Onyx before it can sell."),
      primaryCta: t("Open seller application"),
      secondaryCta: t("See seller pricing"),
      signInCta: t("Sign in with Henry Onyx account"),
      highlights: [
        { label: t("Selection"), value: t("Manual review, not pay-to-list") },
        { label: t("Storefront"), value: t("Trust passport visible to buyers") },
        { label: t("Workspace"), value: t("Orders, payouts, support unified") },
      ],
    },
    onboarding: {
      kicker: t("How onboarding works"),
      stepLabel: t("Step"),
      steps: [
        { step: "01", title: t("Start the seller application") },
        { step: "02", title: t("Add business details") },
        { step: "03", title: t("Application review") },
        { step: "04", title: t("Vendor onboarding") },
      ],
    },
    plans: {
      kicker: t("Plan economics"),
      title: t("Tiers stated up front, not after publishing."),
      feeLabel: t("Fee"),
      payoutLabel: t("Payout"),
      includedLabel: t("Included"),
      includedSuffix: t("listings"),
      featuredLabel: t("Featured"),
      featuredCurrencyPrefix: "NGN",
    },
    closing: {
      kicker: t("Move forward"),
      title: t("Ready to apply?"),
      primaryCta: t("Start application"),
      secondaryCta: t("Visit vendor workspace"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Seller pricing — Henry Onyx Marketplace"),
      description: t("Commission and payout processing fees for Henry Onyx Marketplace sellers, by trust tier."),
    },
    hero: {
      kicker: t("Seller pricing"),
      title: t("Clear economics."),
      body: t("Commission and payout processing are shown per plan before you publish."),
      primaryCta: t("Apply as seller"),
      secondaryCta: t("Back to seller overview"),
      statsLabels: {
        planTiers: t("Plan tiers"),
        trustTiers: t("Trust tiers"),
        featuredSlots: t("Featured slots"),
      },
      featuredSlotsValue: t("Reviewed individually"),
    },
    plans: {
      kicker: t("Plans at a glance"),
      feeLabel: t("Fee"),
      payoutLabel: t("Payout"),
      includedLabel: t("Included"),
      includedSuffix: t("listings"),
      extraListingLabel: t("Extra listing"),
      featuredSlotLabel: t("Featured slot"),
      currencyPrefix: "NGN",
      ctaPartner: t("Contact for partner terms"),
      ctaTemplate: t("Start with {plan}"),
    },
    economics: {
      title: t("How fees are charged"),
      items: [
        t("Commission and the payout processing fee are both deducted from your settlement."),
        t("Plan subscriptions, posting fees and featured placement are not charged yet."),
      ],
    },
    trustTiers: {
      title: t("Payout timing by trust tier"),
    },
    closing: {
      kicker: t("Ready to apply?"),
      title: t("Application opens in your Henry Onyx account."),
      primaryCta: t("Apply as seller"),
      secondaryCta: t("Trust standards"),
    },
  },
  help: {
    metadata: {
      title: t("Help centre — Henry Onyx Marketplace"),
      description:
        t("Browse the answers buyers and sellers ask most. If you do not find what you need, open a support ticket and a person on the team will read it."),
    },
    hero: {
      kicker: t("Help centre"),
      title: t("Find an answer in seconds — or talk to a person."),
    },
    stillNeedHelp: {
      kicker: t("Still need help"),
      title: t("Open a support ticket and a person will read it."),
      ctaLabel: t("Open a support ticket"),
    },
  },
  trust: {
    metadata: {
      title: t("Trust & safety — Henry Onyx Marketplace"),
      description: t("Card and wallet payments are held until delivery is confirmed. Every store is reviewed and approved before it can sell."),
    },
    hero: {
      kicker: t("Trust & safety"),
      title: t("Visible before checkout. Enforced after it."),
    },
    guardrails: {
      items: [
        {
          title: t("Payments held"),
          body: t("Card and wallet payments are held by Henry Onyx until you confirm delivery or the seller's auto-release window passes."),
        },
        {
          title: t("Disputes"),
          body: t("An open dispute freezes the seller's payout while our team reviews it and arranges any refund."),
        },
        {
          title: t("Cash on delivery"),
          body: t("Cash-on-delivery orders are paid to the rider and are not held."),
        },
        {
          title: t("Approved sellers"),
          body: t("Every store is reviewed and approved by Henry Onyx before it can sell."),
        },
      ],
    },
    policySurfaces: {
      title: t("Policies"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Henry Onyx Marketplace"),
      descriptionTemplate: t("{collection} — a collection on Henry Onyx Marketplace."),
      fallbackDescription: t("A collection on Henry Onyx Marketplace."),
    },
    hero: {
      primaryCta: t("Open full search"),
      secondaryCta: t("Trust standards"),
    },
    sidebar: {
      itemsLabel: t("Items in collection"),
      buyerProtectionLabel: t("Buyer protection"),
      buyerProtectionValue: t("Card and wallet payments held until delivery"),
    },
    rail: {
      kicker: t("In this collection"),
      itemsSuffix: t("items"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{policy} on Henry Onyx Marketplace — clear rules, buyer protection, and seller standards."),
      fallbackTitle: t("Marketplace policy — Henry Onyx Marketplace"),
      fallbackDescription:
        t("A Henry Onyx Marketplace policy — clear rules, buyer protection, and seller standards."),
    },
    hero: {
      backToTrust: t("Back to trust standards"),
      openSupport: t("Open support thread"),
    },
    details: {
      coverageLabel: t("Coverage"),
      updatedLabel: t("Updated"),
    },
    coverageBySlug: {
      buyerProtection: t("Buyers"),
      sellerPolicy: t("Sellers"),
      fallback: t("Marketplace participants"),
    },
    updatedBySlug: {
      buyerProtection: t("On payment + dispute revisions"),
      sellerPolicy: t("On seller standards revisions"),
      fallback: t("On policy revisions"),
    },
    provisions: {
      kicker: t("Policy provisions"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
      descriptionTemplate: t("{title} on Henry Onyx Marketplace."),
      fallbackDescription: t("A listing on Henry Onyx Marketplace."),
    },
    fulfillment: {
      availabilityLabel: t("Availability"),
      availabilityValueSingular: t("{count} unit in current stock"),
      availabilityValuePlural: t("{count} units in current stock"),
      fulfillmentLabel: t("Seller delivery note"),
      paymentLabel: t("Payment"),
      paymentValueCod: t("Card (where available), wallet, or cash on delivery"),
      paymentValueVerified: t("Card (where available) or wallet"),
      protectionLabel: t("Buyer protection"),
      protectionValue: t("Card and wallet payments held until delivery"),
    },
    price: {
      label: t("Price"),
      leadTimeLabel: t("Lead time"),
    },
    detail: {
      title: t("Product details"),
      deliverySummaryTitle: t("Delivery, support, and post-order care"),
      deliveryTail:
        t("Orders stay traceable from payment to fulfillment, and disputes or support threads stay attached to the same order record."),
      specsTitle: t("Specifications"),
      passportTitle: t("Explore more"),
      visitVendorTemplate: t("Visit {vendor}"),
      exploreCategoryTemplate: t("Explore {category}"),
      seeBrandTemplate: t("See {brand}"),
    },
    related: {
      title: t("Related products"),
    },
    reviews: {
      kicker: t("Review highlights"),
      title: t("Verified buying signals, not noisy filler."),
      verifiedPurchase: t("Ordered on Henry Onyx"),
      reviewLabel: t("Review"),
    },
    rail: {
      kicker: t("Customers also bought"),
      headline: t("Continue browsing"),
      ctaLabel: t("Open search"),
    },
  },
};
}

function buildFR(locale: AppLocale): DeepPartial<MarketplacePublicCopy> {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  home: {
    heroKicker: t("Marché premium raffiné"),
    heroTitle: t("Achetez auprès de boutiques vérifiées, sans bruit ni doute sur la confiance."),
    heroBody:
      t("Henry Onyx Marketplace transforme le commerce multi-vendeurs en une expérience plus calme : découverte plus claire, ajout rapide depuis chaque carte, vision nette des commandes fractionnées, meilleurs passeports vendeurs et un seul compte Henry Onyx pour commandes, paiements, avis et support."),
    primaryCta: t("Explorer le catalogue"),
    secondaryCta: t("Vendre sur Henry Onyx"),
    quickCards: [
      { title: t("Ajout rapide partout"), body: t("Contrôles panier discrets, mini-panier mis à jour instantanément, sans rafraîchissements maladroits.") },
      { title: t("Rails de confiance vérifiés"), body: t("Passeports vendeurs, promesses de livraison, qualité des avis et propriété du stock restent faciles à lire.") },
      { title: t("Un seul compte, moins de friction"), body: t("Commandes, paiements, liste de souhaits, abonnements et notifications restent dans un seul compte Henry Onyx") },
    ],
    whyKicker: t("Pourquoi c’est différent"),
    whyTitle: t("La confiance est visible avant le paiement."),
    whyCards: [
      { title: t("La confiance est visible avant le paiement"), body: t("Niveau de vérification, taux de litiges, réactivité du support et fiabilité de l’exécution restent proches de la décision d’achat.") },
      { title: t("La clarté des commandes fractionnées reste lisible"), body: t("Quand le stock vient de différents vendeurs ou de Henry Onyx, la segmentation de livraison reste évidente au lieu de devenir confuse.") },
      { title: t("Des vendeurs sélectionnés, pas empilés dans une grille"), body: t("Le marché privilégie des boutiques plus solides, des fiches plus propres et une meilleure responsabilité après commande.") },
    ],
    emptyTitle: t("Le catalogue est en préparation."),
    emptyBody: t("Les produits, collections et campagnes validés apparaîtront ici dès leur mise en ligne."),
    emptyCta: t("Contacter le support marketplace"),
    categoryKicker: t("Découverte par catégorie"),
    categoryTitle: t("Découvrez par ambiance, espace et niveau de confiance."),
    categoryLink: t("Ouvrir la recherche"),
    freshKicker: t("Nouvelles validations"),
    freshTitle: t("Nouveautés du marketplace en ce moment."),
    featuredKicker: t("Produits vedettes"),
    featuredTitle: t("Cartes premium, ajout instantané et signaux d’achat plus clairs."),
    browseAll: t("Tout parcourir"),
    collectionsKicker: t("Collections éditoriales"),
    collectionsTitle: t("Des parcours guidés qui orientent sans crier."),
    vendorsKicker: t("Boutiques de confiance"),
    vendorsTitle: t("Vendeurs vérifiés avec une responsabilité plus claire."),
    standardsKicker: t("Normes marketplace"),
    standardsTitle: t("Conçu pour la confiance, la clarté et une expérience d’achat plus calme."),
    standardsBullets: [
      t("Les candidatures vendeurs, la modération et les validations passent par des files de revue Henry Onyx dédiées."),
      t("Les mises à jour de commande, les avis, le support et les paiements restent liés au même compte acheteur."),
      t("Le support, l’examen des paiements et les opérations de livraison restent organisés pour des réponses cohérentes."),
    ],
    sellerKicker: t("Qualité vendeur"),
    sellerTitle: t("Les vendeurs sérieux commencent dans leur compte Henry Onyx"),
    sellerBody:
      t("Les visiteurs publics peuvent découvrir la vente sur /sell, tandis que la candidature, l’avancement du brouillon, les mises à jour de revue et le statut d’approbation restent dans l’expérience vendeur."),
    sellerBullets: [
      t("Enregistrement des brouillons et visibilité de l’avancement"),
      t("Gestion privée des documents au bon endroit"),
      t("Mises à jour claires d’approbation pour chaque vendeur"),
    ],
  },
  kpiLabels: {
    activeListings: t("Annonces actives"),
    trustRating: t("Indice de confiance"),
  },
  kpiHints: {
    verifiedStores: t("Vendeurs sélectionnés et stock appartenant à Henry Onyx avec une responsabilité plus claire."),
    activeListings: t("Annonces approuvées affichées avec des informations claires sur la livraison, la confiance et la propriété."),
    trustRating: t("La qualité des avis marketplace et la fiabilité des vendeurs apparaissent avant le paiement."),
  },
  footer: {
    brandSubtitle: t("Commerce raffiné avec un seul compte Henry Onyx connecté"),
    brandBody:
      t("Henry Onyx Marketplace est pensé pour des achats à forte confiance, des vendeurs vérifiés et une expérience plus propre du paiement à la livraison."),
    shopTitle: t("Acheter"),
    sellTitle: t("Vendre"),
    supportTitle: t("Support"),
    supportBody:
      t("Commandes, échanges vendeurs, mises à jour du support et paiements restent liés dans un seul compte Henry Onyx"),
    shopLinks: [
      { href: "/search", label: t("Rechercher dans le marketplace") },
      { href: "/deals", label: t("Offres et éditions limitées") },
      { href: "/trust", label: t("Passeport de confiance") },
      { href: "/policies/buyer-protection", label: t("Politique de protection de l’acheteur") },
      { href: "/help", label: t("Support et résolution") },
    ],
    sellLinks: [
      { href: "/sell", label: t("Pourquoi vendre sur Henry Onyx") },
      { href: "/sell/pricing", label: t("Tarifs et frais vendeur") },
      { href: "/policies/seller-policy", label: t("Politique vendeur") },
      { href: "/account/seller-application", label: t("Candidature vendeur") },
      { href: "/vendor", label: t("Espace vendeur") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("Stock Henry Onyx"),
    verifiedSeller: t("Vendeur vérifié"),
    onlyLeft: t("Plus que {count}"),
    saveToWishlist: t("Ajouter à la liste"),
    removeFromWishlist: t("Retirer de la liste"),
    updatingWishlist: t("Mise à jour de la liste"),
    codReady: t("Paiement à la livraison"),
    addToCart: t("Ajouter au panier"),
    addingToCart: t("Ajout au panier"),
    view: t("Voir"),
  },
  trustPassport: {
    title: t("Passeport de confiance"),
    verification: t("Vérification"),
    fulfillment: t("Exécution"),
    disputeRate: t("Taux de litiges"),
    responseSla: t("SLA de réponse"),
    visitStore: t("Voir la boutique"),
  },
  workspace: {
    kicker: t("Espace de travail"),
    operatorKicker: t("Surface opérateur"),
  },
  cart: {
    pageIntro: {
      kicker: t("Panier"),
    },
    emptyState: {
      title: t("Votre panier est encore vide."),
      ctaLabel: t("Parcourir les produits"),
    },
  },
  track: {
    metadata: {
      title: t("Suivi de commande — Marketplace Henry Onyx"),
    },
    hero: {
      kicker: t("Suivi de commande"),
      titlePrefix: t("Suivi"),
      orderValueLabel: t("Valeur de la commande"),
      paymentLabel: t("Paiement"),
      payoutControlLabel: t("Contrôle du versement"),
      payoutFrozen: t("Gelé"),
      payoutEscrowActive: t("Entiercement actif"),
    },
    paymentRecord: {
      kicker: t("Trace de paiement"),
      walletBody: t("Le solde du portefeuille a été débité et la commande est mise sous entiercement jusqu'à l'expédition."),
      proofBody: t("Votre justificatif de virement est joint et en cours d'examen."),
      awaitingBody: t("Ce paiement attend la confirmation de votre virement ou la finalisation de la livraison."),
      methodLabel: t("Méthode"),
      statusLabel: t("Statut"),
      proofLabel: t("Justificatif"),
      viewProof: t("Voir le justificatif"),
      walletDebit: t("Débit portefeuille"),
      pending: t("En attente"),
    },
    segments: {
      fulfillmentLabel: t("Expédition"),
      trackingLabel: t("Suivi"),
      payoutLabel: t("Versement"),
      trackingPending: t("En attente"),
    },
    completion: {
      kicker: t("Confirmation de réception"),
      body: t("Confirmez la réception une fois la commande satisfaisante. Henry Onyx ne libère le versement vendeur qu'après confirmation de livraison ou éligibilité à une libération automatique."),
      confirmCta: t("Confirmer la réception"),
    },
    help: {
      kicker: t("Besoin d'aide ?"),
      openSupportCta: t("Ouvrir un fil de support"),
      viewAllOrdersCta: t("Voir toutes les commandes"),
    },
  },
  deals: {
    discountBadgePrefix: "−",
  },
  category: {
    hero: {
      kicker: t("Édition catégorie"),
      searchCta: t("Rechercher dans cette catégorie"),
      trustCta: t("Voir les standards de confiance"),
      quickFiltersLabel: t("Filtres rapides"),
    },
    stats: {
      activeListingsLabel: t("Annonces actives"),
    },
    catalog: {
      openSearch: t("Ouvrir la recherche complète"),
    },
    metadata: {
      titleTemplate: t("{category} — Marketplace Henry Onyx"),
    },
  },
  brand: {
    eyebrow: t("Marque"),
    searchCta: t("Rechercher dans cette marque"),
    trustCta: t("Standards de confiance"),
    stats: {
      activeProducts: t("Produits actifs"),
      buyerProtection: t("Protection acheteur"),
    },
    liveKicker: t("En direct de {brand}"),
    openFullSearch: t("Ouvrir la recherche complète"),
    metadataTitle: t("{brand} — Marketplace Henry Onyx"),
  },
  store: {
    metadataTitle: t("{store} — Marketplace Henry Onyx"),
    stats: {
      trustScore: t("Score de confiance"),
      followers: t("Abonnés"),
    },
    standards: {
      eyebrow: t("Standards de la boutique"),
    },
    support: {
      eyebrow: t("Support"),
      ctaLabel: t("Contacter cette boutique"),
      subjectTemplate: t("Question pour {store}"),
    },
    reviews: {
      eyebrow: t("Avis récents"),
      review: t("Avis"),
    },
    catalog: {
      exploreLink: t("Explorer plus d’annonces vérifiées"),
      emptyTitle: t("Pas encore d’annonces en ligne"),
      emptyBody: t("Les produits approuvés de cette boutique apparaîtront ici dès leur mise en ligne."),
    },
  },
  help: {
    metadata: {
      title: t("Centre d’aide — Marketplace Henry Onyx"),
      description:
        t("Parcourez les questions les plus posées par les acheteurs et vendeurs. Si vous ne trouvez pas ce qu’il vous faut, ouvrez un ticket et un membre de l’équipe le lira."),
    },
    hero: {
      kicker: t("Centre d’aide"),
      title: t("Trouvez une réponse en quelques secondes — ou parlez à une personne."),
    },
    stillNeedHelp: {
      kicker: t("Encore besoin d’aide"),
      title: t("Ouvrez un ticket et une personne le lira."),
      ctaLabel: t("Ouvrir un ticket de support"),
    },
  },
  sell: {
    hero: {
      kicker: t("Vendre sur Henry Onyx"),
      title: t("Sélective par essence. Conçue pour les vendeurs qui misent sur la confiance."),
      primaryCta: t("Ouvrir la candidature vendeur"),
      secondaryCta: t("Voir les tarifs vendeur"),
      signInCta: t("Se connecter avec un compte Henry Onyx"),
      highlights: [
        { label: t("Sélection"), value: t("Revue manuelle, pas de mise en ligne payante") },
        { label: t("Vitrine"), value: t("Passeport de confiance visible par les acheteurs") },
        { label: t("Espace"), value: t("Commandes, paiements et support unifiés") },
      ],
    },
    onboarding: {
      kicker: t("Comment se passe l’onboarding"),
      stepLabel: t("Étape"),
    },
    plans: {
      kicker: t("Économie des plans"),
      title: t("Des paliers annoncés en amont, pas après la mise en ligne."),
      feeLabel: t("Commission"),
      payoutLabel: t("Versement"),
      includedLabel: t("Inclus"),
      includedSuffix: t("annonces"),
      featuredLabel: t("Mise en avant"),
      featuredCurrencyPrefix: "NGN",
    },
    closing: {
      kicker: t("Avancer"),
      primaryCta: t("Démarrer la candidature"),
      secondaryCta: t("Voir l’espace vendeur"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Tarifs vendeur — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Tarifs vendeur"),
      primaryCta: t("Postuler comme vendeur"),
      secondaryCta: t("Retour à l’aperçu vendeur"),
      statsLabels: {
        planTiers: t("Paliers de plan"),
        trustTiers: t("Paliers de confiance"),
        featuredSlots: t("Mises en avant"),
      },
      featuredSlotsValue: t("Examinées au cas par cas"),
    },
    plans: {
      kicker: t("Aperçu des plans"),
      feeLabel: t("Commission"),
      payoutLabel: t("Versement"),
      includedLabel: t("Inclus"),
      includedSuffix: t("annonces"),
      extraListingLabel: t("Annonce supplémentaire"),
      featuredSlotLabel: t("Mise en avant"),
      currencyPrefix: "NGN",
      ctaPartner: t("Nous contacter pour des conditions partenaires"),
      ctaTemplate: t("Commencer avec {plan}"),
    },
    closing: {
      kicker: t("Prêt à candidater ?"),
      title: t("La candidature s’ouvre dans votre compte Henry Onyx"),
      primaryCta: t("Postuler comme vendeur"),
      secondaryCta: t("Standards de confiance"),
    },
  },
  trust: {
    metadata: {
      title: t("Confiance & sécurité — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Confiance & sécurité"),
      title: t("Visible avant le paiement. Appliquée après."),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Marketplace Henry Onyx"),
    },
    hero: {
      primaryCta: t("Ouvrir la recherche complète"),
      secondaryCta: t("Standards de confiance"),
    },
    sidebar: {
      itemsLabel: t("Articles de la collection"),
      buyerProtectionLabel: t("Protection acheteur"),
    },
    rail: {
      itemsSuffix: t("articles"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Marketplace Henry Onyx"),
      descriptionTemplate:
        t("{policy} sur Henry Onyx Marketplace — application journalisée côté serveur, contrôles d’entiercement et posture de confiance affichés avant le paiement."),
      fallbackTitle: t("Politique du marché — Marketplace Henry Onyx"),
      fallbackDescription:
        t("Une politique de Henry Onyx Marketplace — application journalisée côté serveur, contrôles d’entiercement et posture de confiance affichés avant le paiement."),
    },
    hero: {
      backToTrust: t("Retour aux standards de confiance"),
      openSupport: t("Ouvrir un fil d’assistance"),
    },
    details: {
      coverageLabel: t("Couverture"),
      updatedLabel: t("Mise à jour"),
    },
    coverageBySlug: {
      buyerProtection: t("Acheteurs"),
      sellerPolicy: t("Vendeurs"),
      fallback: t("Participants du marché"),
    },
    updatedBySlug: {
      buyerProtection: t("Lors de révisions des paiements et des litiges"),
      sellerPolicy: t("Lors de révisions des standards vendeurs"),
      fallback: t("Lors des révisions de politique"),
    },
    provisions: {
      kicker: t("Dispositions de la politique"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
    },
    fulfillment: {
      availabilityLabel: t("Disponibilité"),
      availabilityValueSingular: t("{count} unité actuellement en stock"),
      availabilityValuePlural: t("{count} unités actuellement en stock"),
      paymentLabel: t("Paiement"),
    },
    price: {
      label: t("Prix"),
      leadTimeLabel: t("Délai"),
    },
    detail: {
      deliverySummaryTitle: t("Livraison, support et suivi après commande"),
      deliveryTail:
        t("Les commandes restent traçables du paiement à l’expédition, et les litiges ou fils d’assistance restent rattachés au même dossier de commande."),
      visitVendorTemplate: t("Visiter {vendor}"),
      exploreCategoryTemplate: t("Explorer {category}"),
      seeBrandTemplate: t("Voir {brand}"),
    },
    reviews: {
      kicker: t("Faits marquants des avis"),
      title: t("Des signaux d’achat vérifiés, sans bruit superflu."),
      reviewLabel: t("Avis"),
    },
    rail: {
      kicker: t("Les acheteurs ont aussi pris"),
      ctaLabel: t("Ouvrir la recherche"),
    },
  },
};
}

function buildES(locale: AppLocale): DeepPartial<MarketplacePublicCopy> {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  home: {
    heroKicker: t("Marketplace premium refinado"),
    heroTitle: t("Compra en tiendas verificadas, sin ruido, desorden ni dudas sobre la confianza."),
    heroBody:
      t("Henry Onyx Marketplace convierte el comercio multi-vendedor en una experiencia más serena: descubrimiento más claro, añadido rápido desde cada ficha, claridad en pedidos divididos, mejores pasaportes de vendedor y una única cuenta Henry Onyx para pedidos, pagos, reseñas y soporte."),
    primaryCta: t("Explorar el catálogo"),
    secondaryCta: t("Vende en Henry Onyx"),
    quickCards: [
      { title: t("Añadido rápido en todas partes"), body: t("Controles de carrito discretos a nivel de ficha, actualizaciones instantáneas del mini-carrito y sin recargas torpes.") },
      { title: t("Vías de confianza verificadas"), body: t("Pasaportes de vendedor, promesas de entrega, calidad de reseñas y propiedad del stock siguen siendo fáciles de leer.") },
      { title: t("Una cuenta, menos fricción"), body: t("Pedidos, pagos, lista de deseos, seguimientos y notificaciones permanecen juntos en una sola cuenta Henry Onyx") },
    ],
    whyKicker: t("Por qué se siente diferente"),
    whyTitle: t("La confianza es visible antes del pago."),
    whyCards: [
      { title: t("La confianza es visible antes del pago"), body: t("El nivel de verificación, la tasa de disputas, la capacidad de respuesta del soporte y la fiabilidad del cumplimiento se mantienen cerca de la decisión de compra.") },
      { title: t("La claridad de los pedidos divididos sigue siendo legible"), body: t("Cuando el inventario proviene de varios vendedores o del stock de Henry Onyx, la segmentación de entrega sigue siendo evidente en vez de generar confusión al pagar.") },
      { title: t("Los vendedores son seleccionados, no amontonados en una cuadrícula"), body: t("El marketplace prioriza tiendas más sólidas, fichas más limpias y una mejor responsabilidad post-compra antes que la sobrecarga del catálogo.") },
    ],
    emptyTitle: t("El catálogo se está preparando."),
    emptyBody: t("Los productos, colecciones y campañas aprobados aparecerán aquí a medida que se publiquen."),
    emptyCta: t("Contactar al soporte del marketplace"),
    categoryKicker: t("Descubrimiento por categoría"),
    categoryTitle: t("Descubre por ambiente, espacio y nivel de confianza."),
    categoryLink: t("Abrir búsqueda"),
    freshKicker: t("Nuevas aprobaciones"),
    freshTitle: t("Novedades del marketplace ahora mismo."),
    featuredKicker: t("Productos destacados"),
    featuredTitle: t("Fichas premium, añadido instantáneo y señales de compra más claras."),
    browseAll: t("Ver todo"),
    collectionsKicker: t("Colecciones editoriales"),
    collectionsTitle: t("Vías curadas que guían las decisiones sin levantar la voz."),
    vendorsKicker: t("Tiendas de confianza"),
    vendorsTitle: t("Vendedores verificados con responsabilidad más clara."),
    standardsKicker: t("Estándares del marketplace"),
    standardsTitle: t("Diseñado para la confianza, la claridad y una experiencia de compra más serena."),
    standardsBullets: [
      t("Las candidaturas de vendedores, la moderación y las aprobaciones se revisan a través de canales dedicados de Henry Onyx"),
      t("Las actualizaciones de pedido, las reseñas, el soporte y los pagos permanecen conectados a la misma cuenta de comprador."),
      t("El soporte, la revisión de pagos y las operaciones de entrega se mantienen organizados para que las respuestas sigan siendo coherentes."),
    ],
    sellerKicker: t("Calidad del vendedor"),
    sellerTitle: t("Los vendedores serios empiezan dentro de su cuenta Henry Onyx"),
    sellerBody:
      t("Los visitantes públicos pueden conocer la venta en /sell, mientras que la candidatura, el progreso del borrador, las actualizaciones de revisión y el estado de aprobación permanecen dentro de la experiencia del vendedor."),
    sellerBullets: [
      t("Guardado de borradores y visibilidad del progreso"),
      t("Gestión privada de documentos en el lugar adecuado"),
      t("Actualizaciones claras de aprobación para cada vendedor"),
    ],
  },
  kpiLabels: {
    activeListings: t("Listados activos"),
    trustRating: t("Calificación de confianza"),
  },
  kpiHints: {
    verifiedStores: t("Vendedores curados e inventario propiedad de Henry Onyx con responsabilidad más clara."),
    activeListings: t("Listados aprobados mostrados con claridad de entrega, confianza y propiedad."),
    trustRating: t("La calidad de las reseñas del marketplace y la fiabilidad del vendedor aparecen antes del pago."),
  },
  footer: {
    brandSubtitle: t("Comercio refinado con una cuenta Henry Onyx conectada"),
    brandBody:
      t("Henry Onyx Marketplace está diseñado para compras de alta confianza, vendedores verificados y una experiencia más limpia del pago a la entrega."),
    shopTitle: t("Comprar"),
    sellTitle: t("Vender"),
    supportTitle: t("Soporte"),
    supportBody:
      t("Pedidos, conversaciones con vendedores, actualizaciones de soporte y registros de pago permanecen conectados en una sola cuenta Henry Onyx"),
    shopLinks: [
      { href: "/search", label: t("Buscar en el marketplace") },
      { href: "/deals", label: t("Ofertas y ediciones limitadas") },
      { href: "/trust", label: t("Pasaporte de confianza") },
      { href: "/policies/buyer-protection", label: t("Política de protección del comprador") },
      { href: "/help", label: t("Soporte y resolución") },
    ],
    sellLinks: [
      { href: "/sell", label: t("Por qué vender en Henry Onyx") },
      { href: "/sell/pricing", label: t("Precios y tarifas del vendedor") },
      { href: "/policies/seller-policy", label: t("Política del vendedor") },
      { href: "/account/seller-application", label: t("Candidatura de vendedor") },
      { href: "/vendor", label: t("Espacio del vendedor") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("Stock Henry Onyx"),
    verifiedSeller: t("Vendedor verificado"),
    onlyLeft: t("Solo quedan {count}"),
    saveToWishlist: t("Guardar en deseos"),
    removeFromWishlist: t("Quitar de deseos"),
    updatingWishlist: t("Actualizando lista"),
    codReady: t("Pago contra entrega disponible"),
    addToCart: t("Añadir al carrito"),
    addingToCart: t("Añadiendo al carrito"),
    view: t("Ver"),
  },
  trustPassport: {
    title: t("Pasaporte de confianza"),
    verification: t("Verificación"),
    fulfillment: t("Cumplimiento"),
    disputeRate: t("Tasa de disputas"),
    responseSla: t("SLA de respuesta"),
    visitStore: t("Visitar tienda"),
  },
  workspace: {
    kicker: t("Espacio de trabajo"),
    operatorKicker: t("Superficie de operador"),
  },
  cart: {
    pageIntro: {
      kicker: t("Carrito"),
    },
    emptyState: {
      title: t("Tu carrito sigue vacío."),
      ctaLabel: t("Explorar productos"),
    },
  },
  track: {
    metadata: {
      title: t("Seguimiento de pedido — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Seguimiento de pedido"),
      titlePrefix: t("Seguimiento"),
      orderValueLabel: t("Valor del pedido"),
      paymentLabel: t("Pago"),
      payoutControlLabel: t("Control de liquidación"),
      payoutFrozen: t("Congelado"),
      payoutEscrowActive: t("Depósito activo"),
    },
    paymentRecord: {
      kicker: t("Registro de pago"),
      walletBody: t("Se cargó el saldo de la cartera y el pedido queda en depósito hasta el envío."),
      proofBody: t("Tu comprobante de transferencia está adjunto y en revisión."),
      awaitingBody: t("Este pago está a la espera de que se confirme tu transferencia o de que se complete la entrega."),
      methodLabel: t("Método"),
      statusLabel: t("Estado"),
      proofLabel: t("Comprobante"),
      viewProof: t("Ver comprobante"),
      walletDebit: t("Débito de cartera"),
      pending: t("Pendiente"),
    },
    segments: {
      fulfillmentLabel: t("Envío"),
      trackingLabel: t("Seguimiento"),
      payoutLabel: t("Liquidación"),
      trackingPending: t("Pendiente"),
    },
    completion: {
      kicker: t("Confirmación de recepción"),
      body: t("Confirma la recepción cuando el pedido sea satisfactorio. Henry Onyx solo libera la liquidación al vendedor tras confirmar la entrega o si el pedido cumple la liberación automática."),
      confirmCta: t("Confirmar recepción"),
    },
    help: {
      kicker: t("¿Necesitas ayuda?"),
      openSupportCta: t("Abrir hilo de soporte"),
      viewAllOrdersCta: t("Ver todos los pedidos"),
    },
  },
  deals: {
    discountBadgePrefix: "−",
  },
  brand: {
    eyebrow: t("Marca"),
    searchCta: t("Buscar en esta marca"),
    trustCta: t("Estándares de confianza"),
    stats: {
      activeProducts: t("Productos activos"),
      buyerProtection: t("Protección al comprador"),
    },
    liveKicker: t("En directo desde {brand}"),
    openFullSearch: t("Abrir búsqueda completa"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    stats: {
      trustScore: t("Puntuación de confianza"),
      followers: t("Seguidores"),
    },
    standards: {
      eyebrow: t("Estándares de la tienda"),
    },
    support: {
      eyebrow: t("Soporte"),
      ctaLabel: t("Contactar con esta tienda"),
      subjectTemplate: t("Pregunta para {store}"),
    },
    reviews: {
      eyebrow: t("Reseñas recientes"),
      review: t("Reseña"),
    },
    catalog: {
      exploreLink: t("Explorar más anuncios verificados"),
      emptyTitle: t("Aún no hay anuncios en directo"),
      emptyBody: t("Los productos aprobados de esta tienda aparecerán aquí en cuanto se publiquen."),
    },
  },
  help: {
    metadata: {
      title: t("Centro de ayuda — Henry Onyx Marketplace"),
      description:
        t("Consulta las dudas más frecuentes de compradores y vendedores. Si no encuentras lo que buscas, abre un ticket y una persona del equipo lo leerá."),
    },
    hero: {
      kicker: t("Centro de ayuda"),
      title: t("Encuentra una respuesta en segundos — o habla con una persona."),
    },
    stillNeedHelp: {
      kicker: t("Aún necesitas ayuda"),
      title: t("Abre un ticket y una persona lo leerá."),
      ctaLabel: t("Abrir un ticket de soporte"),
    },
  },
  sell: {
    hero: {
      kicker: t("Vender en Henry Onyx"),
      title: t("Selectivo por diseño. Pensado para vendedores que priorizan la confianza."),
      primaryCta: t("Abrir solicitud de vendedor"),
      secondaryCta: t("Ver tarifas de vendedor"),
      signInCta: t("Iniciar sesión con cuenta Henry Onyx"),
      highlights: [
        { label: t("Selección"), value: t("Revisión manual, no pago por listar") },
        { label: t("Escaparate"), value: t("Pasaporte de confianza visible para compradores") },
        { label: t("Espacio"), value: t("Pedidos, pagos y soporte unificados") },
      ],
    },
    onboarding: {
      kicker: t("Cómo funciona el onboarding"),
      stepLabel: t("Paso"),
    },
    plans: {
      kicker: t("Economía de los planes"),
      title: t("Tarifas claras desde el inicio, no después de publicar."),
      feeLabel: t("Comisión"),
      payoutLabel: t("Cobro"),
      includedLabel: t("Incluido"),
      includedSuffix: t("anuncios"),
      featuredLabel: t("Destacado"),
      featuredCurrencyPrefix: "NGN",
    },
    closing: {
      kicker: t("Avanzar"),
      primaryCta: t("Iniciar solicitud"),
      secondaryCta: t("Ir al espacio de vendedor"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Tarifas para vendedores — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Tarifas para vendedores"),
      primaryCta: t("Postularme como vendedor"),
      secondaryCta: t("Volver al resumen de vendedor"),
      statsLabels: {
        planTiers: t("Niveles de plan"),
        trustTiers: t("Niveles de confianza"),
        featuredSlots: t("Slots destacados"),
      },
      featuredSlotsValue: t("Revisados caso por caso"),
    },
    plans: {
      kicker: t("Planes de un vistazo"),
      feeLabel: t("Comisión"),
      payoutLabel: t("Cobro"),
      includedLabel: t("Incluidos"),
      includedSuffix: t("anuncios"),
      extraListingLabel: t("Anuncio extra"),
      featuredSlotLabel: t("Slot destacado"),
      currencyPrefix: "NGN",
      ctaPartner: t("Contactar para condiciones de partner"),
      ctaTemplate: t("Empezar con {plan}"),
    },
    closing: {
      kicker: t("¿Listo para postularte?"),
      title: t("La solicitud se abre en tu cuenta de Henry Onyx"),
      primaryCta: t("Postularme como vendedor"),
      secondaryCta: t("Estándares de confianza"),
    },
  },
  trust: {
    metadata: {
      title: t("Confianza y seguridad — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Confianza y seguridad"),
      title: t("Visible antes del pago. Aplicada después."),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Henry Onyx Marketplace"),
    },
    hero: {
      primaryCta: t("Abrir búsqueda completa"),
      secondaryCta: t("Estándares de confianza"),
    },
    sidebar: {
      itemsLabel: t("Artículos de la colección"),
      buyerProtectionLabel: t("Protección al comprador"),
    },
    rail: {
      itemsSuffix: t("artículos"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{policy} en Henry Onyx Marketplace — control de cumplimiento registrado en servidor, custodia de pagos y postura de confianza visibles antes del pago."),
      fallbackTitle: t("Política del marketplace — Henry Onyx Marketplace"),
      fallbackDescription:
        t("Una política de Henry Onyx Marketplace — control de cumplimiento registrado en servidor, custodia de pagos y postura de confianza visibles antes del pago."),
    },
    hero: {
      backToTrust: t("Volver a los estándares de confianza"),
      openSupport: t("Abrir hilo de soporte"),
    },
    details: {
      coverageLabel: t("Cobertura"),
      updatedLabel: t("Actualizado"),
    },
    coverageBySlug: {
      buyerProtection: t("Compradores"),
      sellerPolicy: t("Vendedores"),
      fallback: t("Participantes del marketplace"),
    },
    updatedBySlug: {
      buyerProtection: t("Al revisar pagos y disputas"),
      sellerPolicy: t("Al revisar los estándares del vendedor"),
      fallback: t("Al revisar la política"),
    },
    provisions: {
      kicker: t("Disposiciones de la política"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
    },
    fulfillment: {
      availabilityLabel: t("Disponibilidad"),
      availabilityValueSingular: t("{count} unidad en stock actual"),
      availabilityValuePlural: t("{count} unidades en stock actual"),
      paymentLabel: t("Pago"),
    },
    price: {
      label: t("Precio"),
      leadTimeLabel: t("Plazo de entrega"),
    },
    detail: {
      deliverySummaryTitle: t("Entrega, soporte y atención posventa"),
      deliveryTail:
        t("Los pedidos se mantienen trazables desde el pago hasta la entrega, y las disputas o hilos de soporte se vinculan al mismo registro de pedido."),
      visitVendorTemplate: t("Visitar {vendor}"),
      exploreCategoryTemplate: t("Explorar {category}"),
      seeBrandTemplate: t("Ver {brand}"),
    },
    reviews: {
      kicker: t("Lo más destacado de las reseñas"),
      title: t("Señales de compra verificadas, sin ruido innecesario."),
      reviewLabel: t("Reseña"),
    },
    rail: {
      kicker: t("Quienes vieron esto también compraron"),
      ctaLabel: t("Abrir búsqueda"),
    },
  },
};
}

function buildPT(locale: AppLocale): DeepPartial<MarketplacePublicCopy> {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  home: {
    heroKicker: t("Marketplace premium refinado"),
    heroTitle: t("Compre em lojas verificadas, sem ruído, desorganização nem dúvidas sobre confiança."),
    heroBody:
      t("O Henry Onyx Marketplace transforma o comércio multifornecedor numa experiência mais serena: descoberta mais clara, adição rápida a partir de cada cartão, clareza nos pedidos divididos, melhores passaportes de vendedor e uma única conta Henry Onyx para encomendas, pagamentos, avaliações e suporte."),
    primaryCta: t("Explorar o catálogo"),
    secondaryCta: t("Vender na Henry Onyx"),
    quickCards: [
      { title: t("Adição rápida em todo o lado"), body: t("Controlos discretos de carrinho ao nível do cartão, atualizações instantâneas do mini-carrinho e sem recarregamentos atrapalhados.") },
      { title: t("Trilhos de confiança verificados"), body: t("Passaportes de vendedor, promessas de entrega, qualidade das avaliações e propriedade do stock permanecem fáceis de ler.") },
      { title: t("Uma conta, menos fricção"), body: t("Encomendas, pagamentos, lista de desejos, seguimentos e notificações ficam juntos numa única conta Henry Onyx") },
    ],
    whyKicker: t("Porque é diferente"),
    whyTitle: t("A confiança é visível antes do pagamento."),
    whyCards: [
      { title: t("A confiança é visível antes do pagamento"), body: t("O nível de verificação, a taxa de disputas, a capacidade de resposta do suporte e a fiabilidade do cumprimento ficam perto da decisão de compra.") },
      { title: t("A clareza dos pedidos divididos continua legível"), body: t("Quando o stock vem de vários vendedores ou da Henry Onyx, a segmentação de entrega permanece evidente em vez de se tornar uma confusão no checkout.") },
      { title: t("Os vendedores são selecionados, não despejados numa grelha"), body: t("O marketplace favorece lojas mais sólidas, fichas mais limpas e melhor responsabilidade pós-encomenda em vez de sobrecarga de catálogo.") },
    ],
    emptyTitle: t("O catálogo está a ser preparado."),
    emptyBody: t("Os produtos, coleções e campanhas aprovados aparecerão aqui assim que forem publicados."),
    emptyCta: t("Contactar o suporte do marketplace"),
    categoryKicker: t("Descoberta por categoria"),
    categoryTitle: t("Descubra por ambiente, espaço e nível de confiança."),
    categoryLink: t("Abrir pesquisa"),
    freshKicker: t("Novas aprovações"),
    freshTitle: t("Novidades do marketplace agora mesmo."),
    featuredKicker: t("Produtos em destaque"),
    featuredTitle: t("Cartões premium, adição instantânea e sinais de compra mais nítidos."),
    browseAll: t("Ver tudo"),
    collectionsKicker: t("Coleções editoriais"),
    collectionsTitle: t("Trilhos curados que orientam as decisões sem gritar."),
    vendorsKicker: t("Lojas de confiança"),
    vendorsTitle: t("Vendedores verificados com responsabilidade mais clara."),
    standardsKicker: t("Padrões do marketplace"),
    standardsTitle: t("Concebido para confiança, clareza e uma experiência de compra mais serena."),
    standardsBullets: [
      t("As candidaturas de vendedores, a moderação e as aprovações são revistas em canais dedicados da Henry Onyx"),
      t("As atualizações de encomenda, avaliações, suporte e pagamentos permanecem ligados à mesma conta de comprador."),
      t("Suporte, revisão de pagamentos e operações de entrega mantêm-se organizados para que as respostas continuem coerentes."),
    ],
    sellerKicker: t("Qualidade do vendedor"),
    sellerTitle: t("Os vendedores sérios começam dentro da sua conta Henry Onyx"),
    sellerBody:
      t("Os visitantes públicos podem conhecer a venda em /sell, enquanto a candidatura, o progresso do rascunho, as atualizações de revisão e o estado de aprovação permanecem dentro da experiência do vendedor."),
    sellerBullets: [
      t("Guarda de rascunhos e visibilidade do progresso"),
      t("Tratamento privado de documentos no lugar certo"),
      t("Atualizações claras de aprovação para cada vendedor"),
    ],
  },
  kpiLabels: {
    activeListings: t("Anúncios ativos"),
    trustRating: t("Pontuação de confiança"),
  },
  kpiHints: {
    verifiedStores: t("Vendedores curados e inventário da Henry Onyx com responsabilidade mais clara."),
    activeListings: t("Anúncios aprovados apresentados com clareza de entrega, confiança e propriedade."),
    trustRating: t("A qualidade das avaliações do marketplace e a fiabilidade do vendedor aparecem antes do pagamento."),
  },
  footer: {
    brandSubtitle: t("Comércio refinado com uma conta Henry Onyx ligada"),
    brandBody:
      t("O Henry Onyx Marketplace foi concebido para compras de alta confiança, vendedores verificados e uma experiência mais limpa do pagamento à entrega."),
    shopTitle: t("Comprar"),
    sellTitle: t("Vender"),
    supportTitle: t("Suporte"),
    supportBody:
      t("Encomendas, conversas com vendedores, atualizações de suporte e registos de pagamento permanecem ligados numa única conta Henry Onyx"),
    shopLinks: [
      { href: "/search", label: t("Pesquisar no marketplace") },
      { href: "/deals", label: t("Ofertas e edições limitadas") },
      { href: "/trust", label: t("Passaporte de confiança") },
      { href: "/policies/buyer-protection", label: t("Política de proteção do comprador") },
      { href: "/help", label: t("Suporte e resolução") },
    ],
    sellLinks: [
      { href: "/sell", label: t("Porquê vender na Henry Onyx") },
      { href: "/sell/pricing", label: t("Preços e taxas do vendedor") },
      { href: "/policies/seller-policy", label: t("Política do vendedor") },
      { href: "/account/seller-application", label: t("Candidatura de vendedor") },
      { href: "/vendor", label: t("Espaço do vendedor") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("Stock Henry Onyx"),
    verifiedSeller: t("Vendedor verificado"),
    onlyLeft: t("Só restam {count}"),
    saveToWishlist: t("Guardar nos desejos"),
    removeFromWishlist: t("Remover dos desejos"),
    updatingWishlist: t("A atualizar lista"),
    codReady: t("Pagamento na entrega disponível"),
    addToCart: t("Adicionar ao carrinho"),
    addingToCart: t("A adicionar ao carrinho"),
    view: t("Ver"),
  },
  trustPassport: {
    title: t("Passaporte de confiança"),
    verification: t("Verificação"),
    fulfillment: t("Cumprimento"),
    disputeRate: t("Taxa de disputas"),
    responseSla: t("SLA de resposta"),
    visitStore: t("Visitar loja"),
  },
  workspace: {
    kicker: t("Espaço de trabalho"),
    operatorKicker: t("Superfície do operador"),
  },
  cart: {
    pageIntro: {
      kicker: t("Carrinho"),
    },
    emptyState: {
      title: t("O teu carrinho ainda está vazio."),
      ctaLabel: t("Explorar produtos"),
    },
  },
  track: {
    metadata: {
      title: t("Acompanhamento do pedido — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Acompanhamento do pedido"),
      titlePrefix: t("Acompanhamento"),
      orderValueLabel: t("Valor do pedido"),
      paymentLabel: t("Pagamento"),
      payoutControlLabel: t("Controlo do pagamento ao vendedor"),
      payoutFrozen: t("Congelado"),
      payoutEscrowActive: t("Depósito ativo"),
    },
    paymentRecord: {
      kicker: t("Registo de pagamento"),
      walletBody: t("O saldo da carteira foi debitado e o pedido fica em depósito até à entrega."),
      proofBody: t("O seu comprovativo de transferência foi anexado e está em análise."),
      awaitingBody: t("Este pagamento aguarda a confirmação da sua transferência ou a conclusão da entrega."),
      methodLabel: t("Método"),
      statusLabel: t("Estado"),
      proofLabel: t("Comprovativo"),
      viewProof: t("Ver comprovativo"),
      walletDebit: t("Débito de carteira"),
      pending: t("Pendente"),
    },
    segments: {
      fulfillmentLabel: t("Expedição"),
      trackingLabel: t("Acompanhamento"),
      payoutLabel: t("Pagamento"),
      trackingPending: t("Pendente"),
    },
    completion: {
      kicker: t("Confirmação de receção"),
      body: t("Confirma a receção quando o pedido estiver satisfatório. A Henry Onyx só liberta o pagamento ao vendedor após confirmação da entrega ou quando o pedido cumpre a libertação automática."),
      confirmCta: t("Confirmar receção"),
    },
    help: {
      kicker: t("Precisas de ajuda?"),
      openSupportCta: t("Abrir fio de suporte"),
      viewAllOrdersCta: t("Ver todos os pedidos"),
    },
  },
  deals: {
    discountBadgePrefix: "−",
  },
  brand: {
    eyebrow: t("Marca"),
    searchCta: t("Pesquisar nesta marca"),
    trustCta: t("Padrões de confiança"),
    stats: {
      activeProducts: t("Produtos ativos"),
      buyerProtection: t("Proteção ao comprador"),
    },
    liveKicker: t("Em direto de {brand}"),
    openFullSearch: t("Abrir pesquisa completa"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    stats: {
      trustScore: t("Pontuação de confiança"),
      followers: t("Seguidores"),
    },
    standards: {
      eyebrow: t("Padrões da loja"),
    },
    support: {
      eyebrow: t("Suporte"),
      ctaLabel: t("Contactar esta loja"),
      subjectTemplate: t("Pergunta para {store}"),
    },
    reviews: {
      eyebrow: t("Avaliações recentes"),
      review: t("Avaliação"),
    },
    catalog: {
      exploreLink: t("Explorar mais anúncios verificados"),
      emptyTitle: t("Ainda sem anúncios em direto"),
      emptyBody: t("Os produtos aprovados desta loja aparecerão aqui assim que entrarem em direto."),
    },
  },
  category: {
    hero: {
      kicker: t("Edição por categoria"),
      searchCta: t("Procurar nesta categoria"),
      trustCta: t("Rever padrões de confiança"),
      quickFiltersLabel: t("Filtros rápidos"),
    },
    stats: {
      activeListingsLabel: t("Anúncios ativos"),
    },
    catalog: {
      openSearch: t("Abrir pesquisa completa"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
    },
  },
  help: {
    metadata: {
      title: t("Centro de ajuda — Henry Onyx Marketplace"),
      description:
        t("Consulta as dúvidas mais comuns de compradores e vendedores. Se não encontrares o que precisas, abre um pedido de apoio e alguém da equipa lê-o."),
    },
    hero: {
      kicker: t("Centro de ajuda"),
      title: t("Encontra uma resposta em segundos — ou fala com uma pessoa."),
    },
    stillNeedHelp: {
      kicker: t("Continuas a precisar de ajuda"),
      title: t("Abre um pedido de apoio e uma pessoa lê-o."),
      ctaLabel: t("Abrir um pedido de apoio"),
    },
  },
  sell: {
    hero: {
      kicker: t("Vender na Henry Onyx"),
      title: t("Seletiva por natureza. Pensada para vendedores que apostam na confiança."),
      primaryCta: t("Abrir candidatura de vendedor"),
      secondaryCta: t("Ver preços de vendedor"),
      signInCta: t("Iniciar sessão com a conta Henry Onyx"),
      highlights: [
        { label: t("Seleção"), value: t("Análise manual, sem listagem paga") },
        { label: t("Montra"), value: t("Passaporte de confiança visível para compradores") },
        { label: t("Espaço"), value: t("Encomendas, pagamentos e apoio unificados") },
      ],
    },
    onboarding: {
      kicker: t("Como funciona o onboarding"),
      stepLabel: t("Passo"),
    },
    plans: {
      kicker: t("Economia dos planos"),
      title: t("Patamares anunciados à partida, não depois de publicar."),
      feeLabel: t("Comissão"),
      payoutLabel: t("Pagamento"),
      includedLabel: t("Incluído"),
      includedSuffix: t("anúncios"),
      featuredLabel: t("Em destaque"),
      featuredCurrencyPrefix: "NGN",
    },
    closing: {
      kicker: t("Avançar"),
      primaryCta: t("Iniciar candidatura"),
      secondaryCta: t("Ir ao espaço de vendedor"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Preços para vendedores — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Preços para vendedores"),
      primaryCta: t("Candidatar como vendedor"),
      secondaryCta: t("Voltar à visão geral de vendedor"),
      statsLabels: {
        planTiers: t("Níveis de plano"),
        trustTiers: t("Níveis de confiança"),
        featuredSlots: t("Slots de destaque"),
      },
      featuredSlotsValue: t("Avaliados caso a caso"),
    },
    plans: {
      kicker: t("Planos em síntese"),
      feeLabel: t("Comissão"),
      payoutLabel: t("Pagamento"),
      includedLabel: t("Incluídos"),
      includedSuffix: t("anúncios"),
      extraListingLabel: t("Anúncio extra"),
      featuredSlotLabel: t("Slot de destaque"),
      currencyPrefix: "NGN",
      ctaPartner: t("Contactar para condições de parceiro"),
      ctaTemplate: t("Começar com {plan}"),
    },
    closing: {
      kicker: t("Pronto para te candidatares?"),
      title: t("A candidatura abre na tua conta Henry Onyx"),
      primaryCta: t("Candidatar como vendedor"),
      secondaryCta: t("Padrões de confiança"),
    },
  },
  trust: {
    metadata: {
      title: t("Confiança e segurança — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Confiança e segurança"),
      title: t("Visível antes do pagamento. Aplicada depois."),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Henry Onyx Marketplace"),
    },
    hero: {
      primaryCta: t("Abrir busca completa"),
      secondaryCta: t("Padrões de confiança"),
    },
    sidebar: {
      itemsLabel: t("Itens da coleção"),
      buyerProtectionLabel: t("Proteção ao comprador"),
    },
    rail: {
      itemsSuffix: t("itens"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{policy} no Henry Onyx Marketplace — fiscalização registada no servidor, custódia de pagamentos e postura de confiança visíveis antes do checkout."),
      fallbackTitle: t("Política do marketplace — Henry Onyx Marketplace"),
      fallbackDescription:
        t("Uma política do Henry Onyx Marketplace — fiscalização registada no servidor, custódia de pagamentos e postura de confiança visíveis antes do checkout."),
    },
    hero: {
      backToTrust: t("Voltar aos padrões de confiança"),
      openSupport: t("Abrir conversa de suporte"),
    },
    details: {
      coverageLabel: t("Cobertura"),
      updatedLabel: t("Atualizado"),
    },
    coverageBySlug: {
      buyerProtection: t("Compradores"),
      sellerPolicy: t("Vendedores"),
      fallback: t("Participantes do marketplace"),
    },
    updatedBySlug: {
      buyerProtection: t("Em revisões de pagamento e disputa"),
      sellerPolicy: t("Em revisões dos padrões do vendedor"),
      fallback: t("Em revisões de política"),
    },
    provisions: {
      kicker: t("Disposições da política"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
    },
    fulfillment: {
      availabilityLabel: t("Disponibilidade"),
      availabilityValueSingular: t("{count} unidade em stock atual"),
      availabilityValuePlural: t("{count} unidades em stock atual"),
      paymentLabel: t("Pagamento"),
    },
    price: {
      label: t("Preço"),
      leadTimeLabel: t("Prazo de entrega"),
    },
    detail: {
      deliverySummaryTitle: t("Entrega, suporte e cuidado pós-encomenda"),
      deliveryTail:
        t("As encomendas mantêm-se rastreáveis do pagamento até à entrega, e disputas ou tópicos de suporte permanecem ligados ao mesmo registo de encomenda."),
      visitVendorTemplate: t("Visitar {vendor}"),
      exploreCategoryTemplate: t("Explorar {category}"),
      seeBrandTemplate: t("Ver {brand}"),
    },
    reviews: {
      kicker: t("Destaques das avaliações"),
      title: t("Sinais de compra verificados, sem ruído desnecessário."),
      reviewLabel: t("Avaliação"),
    },
    rail: {
      kicker: t("Clientes também compraram"),
      ctaLabel: t("Abrir pesquisa"),
    },
  },
};
}

function buildDE(locale: AppLocale): DeepPartial<MarketplacePublicCopy> {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  home: {
    heroKicker: t("Veredelter Premium-Marktplatz"),
    heroTitle: t("Kaufe bei verifizierten Shops ein – ohne Lärm, Unordnung oder Zweifel an der Vertrauenswürdigkeit."),
    heroBody:
      t("Henry Onyx Marketplace macht aus Multi-Anbieter-Handel ein ruhigeres Erlebnis: klarere Entdeckung, schnelles Hinzufügen direkt von jeder Karte, transparente geteilte Bestellungen, stärkere Verkäuferpässe und ein einziges Henry Onyx-Konto für Bestellungen, Zahlungen, Bewertungen und Support."),
    primaryCta: t("Katalog entdecken"),
    secondaryCta: t("Auf Henry Onyx verkaufen"),
    quickCards: [
      { title: t("Schnelles Hinzufügen überall"), body: t("Dezente Warenkorbsteuerung auf Kartenebene, sofortige Mini-Warenkorb-Updates und keine umständlichen Reloads.") },
      { title: t("Verifizierte Vertrauensschienen"), body: t("Verkäuferpässe, Lieferversprechen, Bewertungsqualität und Bestandsbesitz bleiben einfach lesbar.") },
      { title: t("Ein Konto, weniger Reibung"), body: t("Bestellungen, Zahlungen, Wunschliste, Follows und Benachrichtigungen bleiben in einem Henry Onyx-Konto vereint.") },
    ],
    whyKicker: t("Warum sich das anders anfühlt"),
    whyTitle: t("Vertrauen ist vor der Zahlung sichtbar."),
    whyCards: [
      { title: t("Vertrauen ist vor der Zahlung sichtbar"), body: t("Verifizierungsgrad, Streitfallquote, Reaktionsfähigkeit des Supports und Zuverlässigkeit der Erfüllung bleiben nahe an der Kaufentscheidung.") },
      { title: t("Klarheit bei geteilten Bestellungen bleibt lesbar"), body: t("Wenn der Bestand von verschiedenen Verkäufern oder aus Henry Onyx-Lager kommt, bleibt die Liefersegmentierung offensichtlich, statt zu Checkout-Verwirrung zu führen.") },
      { title: t("Verkäufer werden kuratiert, nicht in ein Raster gekippt"), body: t("Der Marktplatz bevorzugt stärkere Shops, sauberere Angebote und bessere Nachkauf-Verantwortung gegenüber Katalog-Wildwuchs.") },
    ],
    emptyTitle: t("Der Katalog wird vorbereitet."),
    emptyBody: t("Genehmigte Produkte, Kollektionen und Kampagnen erscheinen hier, sobald sie live gehen."),
    emptyCta: t("Marketplace-Support kontaktieren"),
    categoryKicker: t("Entdeckung nach Kategorie"),
    categoryTitle: t("Entdecke nach Stimmung, Raum und Vertrauensniveau."),
    categoryLink: t("Suche öffnen"),
    freshKicker: t("Neue Freigaben"),
    freshTitle: t("Neu im Marketplace, gerade eben."),
    featuredKicker: t("Hervorgehobene Produkte"),
    featuredTitle: t("Premium-Karten, sofortiges Hinzufügen und klarere Kaufsignale."),
    browseAll: t("Alle anzeigen"),
    collectionsKicker: t("Redaktionelle Kollektionen"),
    collectionsTitle: t("Kuratierte Schienen, die Entscheidungen leise lenken."),
    vendorsKicker: t("Vertrauenswürdige Shops"),
    vendorsTitle: t("Verifizierte Verkäufer mit klarerer Verantwortlichkeit."),
    standardsKicker: t("Marketplace-Standards"),
    standardsTitle: t("Gebaut für Vertrauen, Klarheit und ein ruhigeres Kauferlebnis."),
    standardsBullets: [
      t("Verkäuferbewerbungen, Moderation und Freigaben laufen durch dedizierte Henry Onyx-Prüfschienen."),
      t("Bestellaktualisierungen, Bewertungen, Support und Zahlungen bleiben mit demselben Käuferkonto verbunden."),
      t("Support, Zahlungsprüfung und Lieferoperationen bleiben organisiert, damit die Antworten konsistent bleiben."),
    ],
    sellerKicker: t("Verkäuferqualität"),
    sellerTitle: t("Ernsthafte Verkäufer starten in ihrem Henry Onyx-Konto."),
    sellerBody:
      t("Öffentliche Besucher können auf /sell mehr über den Verkauf erfahren, während Bewerbung, Entwurfsfortschritt, Prüfungs­updates und Freigabestatus innerhalb des Verkäufer-Erlebnisses bleiben."),
    sellerBullets: [
      t("Speicherung von Entwürfen und Sichtbarkeit des Fortschritts"),
      t("Vertrauliche Dokumentenverwaltung am richtigen Ort"),
      t("Klare Freigabeupdates für jeden Verkäufer"),
    ],
  },
  kpiLabels: {
    activeListings: t("Aktive Angebote"),
    trustRating: t("Vertrauensbewertung"),
  },
  kpiHints: {
    verifiedStores: t("Kuratierte Verkäufer und Henry Onyx-eigener Bestand mit klarerer Verantwortlichkeit."),
    activeListings: t("Genehmigte Angebote mit Liefer-, Vertrauens- und Eigentumsklarheit angezeigt."),
    trustRating: t("Marketplace-Bewertungsqualität und Verkäuferzuverlässigkeit erscheinen vor der Zahlung."),
  },
  footer: {
    brandSubtitle: t("Veredelter Handel mit einem verbundenen Henry Onyx-Konto"),
    brandBody:
      t("Henry Onyx Marketplace ist für Einkäufe mit hohem Vertrauen, verifizierte Verkäufer und ein saubereres Erlebnis vom Checkout bis zur Lieferung gebaut."),
    shopTitle: t("Einkaufen"),
    sellTitle: t("Verkaufen"),
    supportTitle: t("Support"),
    supportBody:
      t("Bestellungen, Verkäufergespräche, Support-Updates und Zahlungseinträge bleiben in einem Henry Onyx-Konto verbunden."),
    shopLinks: [
      { href: "/search", label: t("Im Marketplace suchen") },
      { href: "/deals", label: t("Angebote und zeitlich begrenzte Editionen") },
      { href: "/trust", label: t("Vertrauenspass") },
      { href: "/policies/buyer-protection", label: t("Käuferschutzrichtlinie") },
      { href: "/help", label: t("Support und Lösung") },
    ],
    sellLinks: [
      { href: "/sell", label: t("Warum auf Henry Onyx verkaufen") },
      { href: "/sell/pricing", label: t("Preise und Gebühren für Verkäufer") },
      { href: "/policies/seller-policy", label: t("Verkäuferrichtlinie") },
      { href: "/account/seller-application", label: t("Verkäuferbewerbung") },
      { href: "/vendor", label: t("Verkäufer-Arbeitsbereich") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("Von Henry Onyx geführt"),
    verifiedSeller: t("Verifizierter Verkäufer"),
    onlyLeft: t("Nur noch {count}"),
    saveToWishlist: t("Auf Wunschliste setzen"),
    removeFromWishlist: t("Von Wunschliste entfernen"),
    updatingWishlist: t("Wunschliste wird aktualisiert"),
    codReady: t("Zahlung bei Lieferung möglich"),
    addToCart: t("In den Warenkorb"),
    addingToCart: t("Wird in den Warenkorb gelegt"),
    view: t("Ansehen"),
  },
  trustPassport: {
    title: t("Vertrauenspass"),
    verification: t("Verifizierung"),
    fulfillment: t("Erfüllung"),
    disputeRate: t("Streitfallquote"),
    responseSla: t("Antwort-SLA"),
    visitStore: t("Shop besuchen"),
  },
  workspace: {
    kicker: t("Arbeitsbereich"),
    operatorKicker: t("Operator-Oberfläche"),
  },
  cart: {
    pageIntro: {
      kicker: t("Warenkorb"),
    },
    emptyState: {
      title: t("Dein Warenkorb ist noch leer."),
      ctaLabel: t("Produkte entdecken"),
    },
  },
  track: {
    metadata: {
      title: t("Bestellverfolgung — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Bestellverfolgung"),
      titlePrefix: t("Verfolgung"),
      orderValueLabel: t("Bestellwert"),
      paymentLabel: t("Zahlung"),
      payoutControlLabel: t("Auszahlungskontrolle"),
      payoutFrozen: t("Eingefroren"),
      payoutEscrowActive: t("Treuhand aktiv"),
    },
    paymentRecord: {
      kicker: t("Zahlungsnachweis"),
      walletBody: t("Das Wallet-Guthaben wurde belastet und die Bestellung liegt bis zur Erfüllung in der Treuhand."),
      proofBody: t("Ihr Überweisungsbeleg ist angehängt und wird geprüft."),
      awaitingBody: t("Diese Zahlung wartet auf die Bestätigung Ihrer Überweisung oder auf den Abschluss der Lieferung."),
      methodLabel: t("Methode"),
      statusLabel: t("Status"),
      proofLabel: t("Nachweis"),
      viewProof: t("Beleg ansehen"),
      walletDebit: t("Wallet-Abbuchung"),
      pending: t("Ausstehend"),
    },
    segments: {
      fulfillmentLabel: t("Versand"),
      trackingLabel: t("Sendungsverfolgung"),
      payoutLabel: t("Auszahlung"),
      trackingPending: t("Ausstehend"),
    },
    completion: {
      kicker: t("Abschlussbestätigung"),
      body: t("Bestätige den Abschluss, sobald die Bestellung in Ordnung ist. Henry Onyx gibt die Händlerauszahlung erst nach bestätigter Lieferung oder bei Eignung für die automatische Freigabe frei."),
      confirmCta: t("Abschluss bestätigen"),
    },
    help: {
      kicker: t("Brauchst du Hilfe?"),
      openSupportCta: t("Support-Thread öffnen"),
      viewAllOrdersCta: t("Alle Bestellungen anzeigen"),
    },
  },
  deals: {
    discountBadgePrefix: "−",
  },
  brand: {
    eyebrow: t("Marke"),
    searchCta: t("In dieser Marke suchen"),
    trustCta: t("Vertrauensstandards"),
    stats: {
      activeProducts: t("Aktive Produkte"),
      buyerProtection: t("Käuferschutz"),
    },
    liveKicker: t("Live von {brand}"),
    openFullSearch: t("Volle Suche öffnen"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    stats: {
      trustScore: t("Vertrauensscore"),
      followers: t("Follower:innen"),
    },
    standards: {
      eyebrow: t("Shop-Standards"),
    },
    support: {
      eyebrow: t("Support"),
      ctaLabel: t("Diesen Shop kontaktieren"),
      subjectTemplate: t("Frage an {store}"),
    },
    reviews: {
      eyebrow: t("Neueste Bewertungen"),
      review: t("Bewertung"),
    },
    catalog: {
      exploreLink: t("Mehr verifizierte Angebote entdecken"),
      emptyTitle: t("Noch keine Live-Angebote"),
      emptyBody: t("Genehmigte Produkte dieses Shops erscheinen hier, sobald sie live geschaltet werden."),
    },
  },
  category: {
    hero: {
      kicker: t("Kategorie-Edition"),
      searchCta: t("In dieser Kategorie suchen"),
      trustCta: t("Vertrauensstandards ansehen"),
      quickFiltersLabel: t("Schnellfilter"),
    },
    stats: {
      activeListingsLabel: t("Aktive Angebote"),
    },
    catalog: {
      openSearch: t("Volle Suche öffnen"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
    },
  },
  help: {
    metadata: {
      title: t("Hilfe-Center — Henry Onyx Marketplace"),
      description:
        t("Sieh dir die häufigsten Fragen von Käufer:innen und Verkäufer:innen an. Wenn du nicht fündig wirst, öffne ein Support-Ticket – ein Mensch aus dem Team liest es."),
    },
    hero: {
      kicker: t("Hilfe-Center"),
      title: t("Finde in Sekunden eine Antwort – oder sprich mit einer Person."),
    },
    stillNeedHelp: {
      kicker: t("Brauchst du weiter Hilfe"),
      title: t("Öffne ein Support-Ticket – ein Mensch liest es."),
      ctaLabel: t("Support-Ticket öffnen"),
    },
  },
  sell: {
    hero: {
      kicker: t("Auf Henry Onyx verkaufen"),
      title: t("Selektiv von Grund auf. Gemacht für Händler:innen, die Vertrauen führen."),
      primaryCta: t("Händler-Bewerbung öffnen"),
      secondaryCta: t("Händler-Preise ansehen"),
      signInCta: t("Mit Henry Onyx-Konto anmelden"),
      highlights: [
        { label: t("Auswahl"), value: t("Manuelle Prüfung statt Bezahllisting") },
        { label: t("Storefront"), value: t("Trust-Passport für Käufer:innen sichtbar") },
        { label: t("Workspace"), value: t("Bestellungen, Auszahlungen, Support vereint") },
      ],
    },
    onboarding: {
      kicker: t("So läuft das Onboarding"),
      stepLabel: t("Schritt"),
    },
    plans: {
      kicker: t("Plan-Ökonomie"),
      title: t("Stufen vorab benannt, nicht erst nach der Veröffentlichung."),
      feeLabel: t("Gebühr"),
      payoutLabel: t("Auszahlung"),
      includedLabel: t("Inklusive"),
      includedSuffix: t("Inserate"),
      featuredLabel: t("Hervorgehoben"),
      featuredCurrencyPrefix: "NGN",
    },
    closing: {
      kicker: t("Weitergehen"),
      primaryCta: t("Bewerbung starten"),
      secondaryCta: t("Zum Vendor-Workspace"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Verkäuferpreise — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Verkäuferpreise"),
      primaryCta: t("Als Verkäufer bewerben"),
      secondaryCta: t("Zurück zur Verkäuferübersicht"),
      statsLabels: {
        planTiers: t("Plan-Stufen"),
        trustTiers: t("Vertrauensstufen"),
        featuredSlots: t("Featured-Slots"),
      },
      featuredSlotsValue: t("Einzelfallprüfung"),
    },
    plans: {
      kicker: t("Pläne im Überblick"),
      feeLabel: t("Provision"),
      payoutLabel: t("Auszahlung"),
      includedLabel: t("Inklusive"),
      includedSuffix: t("Inserate"),
      extraListingLabel: t("Zusätzliches Inserat"),
      featuredSlotLabel: t("Featured-Slot"),
      currencyPrefix: "NGN",
      ctaPartner: t("Für Partnerkonditionen Kontakt aufnehmen"),
      ctaTemplate: t("Mit {plan} starten"),
    },
    closing: {
      kicker: t("Bereit für die Bewerbung?"),
      title: t("Die Bewerbung öffnet sich in deinem Henry Onyx-Konto."),
      primaryCta: t("Als Verkäufer bewerben"),
      secondaryCta: t("Vertrauensstandards"),
    },
  },
  trust: {
    metadata: {
      title: t("Vertrauen & Sicherheit — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Vertrauen & Sicherheit"),
      title: t("Sichtbar vor dem Checkout. Durchgesetzt danach."),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Henry Onyx Marketplace"),
    },
    hero: {
      primaryCta: t("Vollständige Suche öffnen"),
      secondaryCta: t("Vertrauensstandards"),
    },
    sidebar: {
      itemsLabel: t("Artikel in der Kollektion"),
      buyerProtectionLabel: t("Käuferschutz"),
    },
    rail: {
      itemsSuffix: t("Artikel"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{policy} im Henry Onyx Marketplace — serverseitig protokollierte Durchsetzung, Treuhandkontrollen und Vertrauenslage vor dem Checkout sichtbar."),
      fallbackTitle: t("Marketplace-Richtlinie — Henry Onyx Marketplace"),
      fallbackDescription:
        t("Eine Richtlinie des Henry Onyx Marketplace — serverseitig protokollierte Durchsetzung, Treuhandkontrollen und Vertrauenslage vor dem Checkout sichtbar."),
    },
    hero: {
      backToTrust: t("Zurück zu den Vertrauensstandards"),
      openSupport: t("Support-Thread öffnen"),
    },
    details: {
      coverageLabel: t("Geltungsbereich"),
      updatedLabel: t("Aktualisiert"),
    },
    coverageBySlug: {
      buyerProtection: t("Käufer"),
      sellerPolicy: t("Verkäufer"),
      fallback: t("Marketplace-Teilnehmer"),
    },
    updatedBySlug: {
      buyerProtection: t("Bei Änderungen zu Zahlung und Streitfällen"),
      sellerPolicy: t("Bei Änderungen der Verkäuferstandards"),
      fallback: t("Bei Richtlinienänderungen"),
    },
    provisions: {
      kicker: t("Bestimmungen der Richtlinie"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
    },
    fulfillment: {
      availabilityLabel: t("Verfügbarkeit"),
      availabilityValueSingular: t("{count} Einheit aktuell im Lager"),
      availabilityValuePlural: t("{count} Einheiten aktuell im Lager"),
      paymentLabel: t("Zahlung"),
    },
    price: {
      label: t("Preis"),
      leadTimeLabel: t("Lieferzeit"),
    },
    detail: {
      deliverySummaryTitle: t("Lieferung, Support und Nachbetreuung"),
      deliveryTail:
        t("Bestellungen bleiben von der Zahlung bis zur Auslieferung nachverfolgbar, und Beschwerden oder Support-Threads bleiben mit demselben Bestellsatz verknüpft."),
      visitVendorTemplate: t("{vendor} besuchen"),
      exploreCategoryTemplate: t("{category} erkunden"),
      seeBrandTemplate: t("{brand} ansehen"),
    },
    reviews: {
      kicker: t("Bewertungs-Highlights"),
      title: t("Geprüfte Kaufsignale, kein Geräuschpegel."),
      reviewLabel: t("Bewertung"),
    },
    rail: {
      kicker: t("Andere Kund:innen kauften auch"),
      ctaLabel: t("Suche öffnen"),
    },
  },
};
}

function buildIT(locale: AppLocale): DeepPartial<MarketplacePublicCopy> {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  home: {
    heroKicker: t("Marketplace premium raffinato"),
    heroTitle: t("Acquista da negozi verificati, senza rumore, disordine o dubbi sulla fiducia."),
    heroBody:
      t("Henry Onyx Marketplace trasforma il commercio multi-venditore in un'esperienza più serena: scoperta più chiara, aggiunta rapida da ogni scheda, chiarezza sugli ordini frazionati, passaporti venditore più solidi e un unico account Henry Onyx per ordini, pagamenti, recensioni e supporto."),
    primaryCta: t("Esplora il catalogo"),
    secondaryCta: t("Vendi su Henry Onyx"),
    quickCards: [
      { title: t("Aggiunta rapida ovunque"), body: t("Controlli carrello discreti a livello di scheda, aggiornamenti istantanei del mini-carrello e nessun ricaricamento maldestro.") },
      { title: t("Binari di fiducia verificati"), body: t("Passaporti venditore, promesse di consegna, qualità delle recensioni e proprietà dello stock restano facili da leggere.") },
      { title: t("Un account, meno attriti"), body: t("Ordini, pagamenti, lista dei desideri, follow e notifiche restano insieme in un unico account Henry Onyx") },
    ],
    whyKicker: t("Perché si percepisce diverso"),
    whyTitle: t("La fiducia è visibile prima del pagamento."),
    whyCards: [
      { title: t("La fiducia è visibile prima del pagamento"), body: t("Livello di verifica, tasso di contestazioni, reattività del supporto e affidabilità dell'evasione restano vicini alla decisione d'acquisto.") },
      { title: t("La chiarezza degli ordini frazionati resta leggibile"), body: t("Quando lo stock arriva da venditori diversi o dallo stock Henry Onyx, la segmentazione della consegna resta evidente invece di diventare confusione al checkout.") },
      { title: t("I venditori sono selezionati, non ammassati in una griglia"), body: t("Il marketplace favorisce negozi più solidi, schede più pulite e una migliore responsabilità post-ordine invece dell'eccesso di catalogo.") },
    ],
    emptyTitle: t("Il catalogo è in preparazione."),
    emptyBody: t("Prodotti, collezioni e campagne approvati appariranno qui non appena saranno pubblicati."),
    emptyCta: t("Contatta il supporto del marketplace"),
    categoryKicker: t("Scoperta per categoria"),
    categoryTitle: t("Scopri per atmosfera, spazio e livello di fiducia."),
    categoryLink: t("Apri la ricerca"),
    freshKicker: t("Nuove approvazioni"),
    freshTitle: t("Novità del marketplace proprio ora."),
    featuredKicker: t("Prodotti in evidenza"),
    featuredTitle: t("Schede premium, aggiunta istantanea e segnali d'acquisto più nitidi."),
    browseAll: t("Vedi tutto"),
    collectionsKicker: t("Collezioni editoriali"),
    collectionsTitle: t("Binari curati che guidano le decisioni senza urlare."),
    vendorsKicker: t("Negozi di fiducia"),
    vendorsTitle: t("Venditori verificati con responsabilità più chiara."),
    standardsKicker: t("Standard del marketplace"),
    standardsTitle: t("Pensato per fiducia, chiarezza e un'esperienza d'acquisto più serena."),
    standardsBullets: [
      t("Candidature dei venditori, moderazione e approvazioni passano attraverso canali di revisione Henry Onyx dedicati."),
      t("Aggiornamenti ordine, recensioni, supporto e pagamenti restano collegati allo stesso account acquirente."),
      t("Supporto, revisione dei pagamenti e operazioni di consegna restano organizzati perché le risposte rimangano coerenti."),
    ],
    sellerKicker: t("Qualità del venditore"),
    sellerTitle: t("I venditori seri partono dal proprio account Henry Onyx"),
    sellerBody:
      t("I visitatori pubblici possono scoprire la vendita su /sell, mentre la candidatura, l'avanzamento della bozza, gli aggiornamenti della revisione e lo stato di approvazione restano nell'esperienza del venditore."),
    sellerBullets: [
      t("Salvataggio delle bozze e visibilità dell'avanzamento"),
      t("Gestione privata dei documenti nel posto giusto"),
      t("Aggiornamenti chiari di approvazione per ogni venditore"),
    ],
  },
  kpiLabels: {
    activeListings: t("Annunci attivi"),
    trustRating: t("Valutazione di fiducia"),
  },
  kpiHints: {
    verifiedStores: t("Venditori curati e inventario di proprietà di Henry Onyx con responsabilità più chiara."),
    activeListings: t("Annunci approvati mostrati con chiarezza di consegna, fiducia e proprietà."),
    trustRating: t("La qualità delle recensioni del marketplace e l'affidabilità del venditore appaiono prima del pagamento."),
  },
  footer: {
    brandSubtitle: t("Commercio raffinato con un account Henry Onyx connesso"),
    brandBody:
      t("Henry Onyx Marketplace è pensato per acquisti ad alta fiducia, venditori verificati e un'esperienza più pulita dal checkout alla consegna."),
    shopTitle: t("Acquista"),
    sellTitle: t("Vendi"),
    supportTitle: t("Supporto"),
    supportBody:
      t("Ordini, conversazioni con i venditori, aggiornamenti del supporto e registrazioni dei pagamenti restano collegati in un unico account Henry Onyx"),
    shopLinks: [
      { href: "/search", label: t("Cerca nel marketplace") },
      { href: "/deals", label: t("Offerte ed edizioni a tempo") },
      { href: "/trust", label: t("Passaporto di fiducia") },
      { href: "/policies/buyer-protection", label: t("Politica di protezione dell'acquirente") },
      { href: "/help", label: t("Supporto e risoluzione") },
    ],
    sellLinks: [
      { href: "/sell", label: t("Perché vendere su Henry Onyx") },
      { href: "/sell/pricing", label: t("Prezzi e tariffe per i venditori") },
      { href: "/policies/seller-policy", label: t("Politica del venditore") },
      { href: "/account/seller-application", label: t("Candidatura venditore") },
      { href: "/vendor", label: t("Spazio venditore") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("Stock Henry Onyx"),
    verifiedSeller: t("Venditore verificato"),
    onlyLeft: t("Solo {count} rimasti"),
    saveToWishlist: t("Salva nella lista"),
    removeFromWishlist: t("Rimuovi dalla lista"),
    updatingWishlist: t("Aggiornamento lista"),
    codReady: t("Pagamento alla consegna disponibile"),
    addToCart: t("Aggiungi al carrello"),
    addingToCart: t("Aggiunta al carrello"),
    view: t("Vedi"),
  },
  trustPassport: {
    title: t("Passaporto di fiducia"),
    verification: t("Verifica"),
    fulfillment: t("Evasione"),
    disputeRate: t("Tasso di contestazione"),
    responseSla: t("SLA di risposta"),
    visitStore: t("Visita il negozio"),
  },
  workspace: {
    kicker: t("Spazio di lavoro"),
    operatorKicker: t("Superficie operatore"),
  },
  cart: {
    pageIntro: {
      kicker: t("Carrello"),
    },
    emptyState: {
      title: t("Il tuo carrello è ancora vuoto."),
      ctaLabel: t("Esplora i prodotti"),
    },
  },
  track: {
    metadata: {
      title: t("Tracciamento ordine — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Tracciamento ordine"),
      titlePrefix: t("Tracciamento"),
      orderValueLabel: t("Valore dell'ordine"),
      paymentLabel: t("Pagamento"),
      payoutControlLabel: t("Controllo del pagamento al venditore"),
      payoutFrozen: t("Bloccato"),
      payoutEscrowActive: t("Escrow attivo"),
    },
    paymentRecord: {
      kicker: t("Traccia di pagamento"),
      walletBody: t("Il saldo del portafoglio è stato addebitato e l'ordine resta in escrow fino all'evasione."),
      proofBody: t("La tua ricevuta di bonifico è allegata ed è in fase di verifica."),
      awaitingBody: t("Questo pagamento è in attesa della conferma del tuo bonifico o del completamento della consegna."),
      methodLabel: t("Metodo"),
      statusLabel: t("Stato"),
      proofLabel: t("Ricevuta"),
      viewProof: t("Vedi ricevuta"),
      walletDebit: t("Addebito portafoglio"),
      pending: t("In attesa"),
    },
    segments: {
      fulfillmentLabel: t("Evasione"),
      trackingLabel: t("Tracciamento"),
      payoutLabel: t("Pagamento"),
      trackingPending: t("In attesa"),
    },
    completion: {
      kicker: t("Conferma di completamento"),
      body: t("Conferma il completamento quando l'ordine è soddisfacente. Henry Onyx rilascia il pagamento al venditore solo dopo la conferma della consegna o se l'ordine rientra nel rilascio automatico."),
      confirmCta: t("Conferma completamento"),
    },
    help: {
      kicker: t("Serve aiuto?"),
      openSupportCta: t("Apri thread di supporto"),
      viewAllOrdersCta: t("Vedi tutti gli ordini"),
    },
  },
  deals: {
    discountBadgePrefix: "−",
  },
  brand: {
    eyebrow: t("Marchio"),
    searchCta: t("Cerca in questo marchio"),
    trustCta: t("Standard di fiducia"),
    stats: {
      activeProducts: t("Prodotti attivi"),
      buyerProtection: t("Protezione acquirente"),
    },
    liveKicker: t("In diretta da {brand}"),
    openFullSearch: t("Apri la ricerca completa"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    stats: {
      trustScore: t("Punteggio di fiducia"),
      followers: t("Follower"),
    },
    standards: {
      eyebrow: t("Standard del negozio"),
    },
    support: {
      eyebrow: t("Supporto"),
      ctaLabel: t("Contatta questo negozio"),
      subjectTemplate: t("Domanda per {store}"),
    },
    reviews: {
      eyebrow: t("Recensioni recenti"),
      review: t("Recensione"),
    },
    catalog: {
      exploreLink: t("Esplora altri annunci verificati"),
      emptyTitle: t("Ancora nessun annuncio online"),
      emptyBody: t("I prodotti approvati di questo negozio appariranno qui non appena saranno online."),
    },
  },
  category: {
    hero: {
      kicker: t("Edizione di categoria"),
      searchCta: t("Cerca in questa categoria"),
      trustCta: t("Rivedi gli standard di fiducia"),
      quickFiltersLabel: t("Filtri rapidi"),
    },
    stats: {
      activeListingsLabel: t("Annunci attivi"),
    },
    catalog: {
      openSearch: t("Apri ricerca completa"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
    },
  },
  help: {
    metadata: {
      title: t("Centro assistenza — Henry Onyx Marketplace"),
      description:
        t("Sfoglia le domande più frequenti di chi compra e di chi vende. Se non trovi quello che cerchi, apri un ticket di assistenza e una persona del team lo leggerà."),
    },
    hero: {
      kicker: t("Centro assistenza"),
      title: t("Trova una risposta in pochi secondi — o parla con una persona."),
    },
    stillNeedHelp: {
      kicker: t("Serve ancora aiuto"),
      title: t("Apri un ticket di assistenza e una persona lo leggerà."),
      ctaLabel: t("Apri un ticket di assistenza"),
    },
  },
  sell: {
    hero: {
      kicker: t("Vendere su Henry Onyx"),
      title: t("Selettivo per scelta. Pensato per venditori che mettono la fiducia al primo posto."),
      primaryCta: t("Apri candidatura venditore"),
      secondaryCta: t("Vedi i prezzi venditore"),
      signInCta: t("Accedi con account Henry Onyx"),
      highlights: [
        { label: t("Selezione"), value: t("Revisione manuale, non listing a pagamento") },
        { label: t("Vetrina"), value: t("Passaporto di fiducia visibile agli acquirenti") },
        { label: t("Spazio"), value: t("Ordini, pagamenti e supporto in un solo posto") },
      ],
    },
    onboarding: {
      kicker: t("Come funziona l’onboarding"),
      stepLabel: t("Passo"),
    },
    plans: {
      kicker: t("Economia dei piani"),
      title: t("Livelli dichiarati in anticipo, non dopo la pubblicazione."),
      feeLabel: t("Commissione"),
      payoutLabel: t("Pagamento"),
      includedLabel: t("Inclusi"),
      includedSuffix: t("annunci"),
      featuredLabel: t("In evidenza"),
      featuredCurrencyPrefix: "NGN",
    },
    closing: {
      kicker: t("Andare avanti"),
      primaryCta: t("Avvia candidatura"),
      secondaryCta: t("Vai allo spazio venditore"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Prezzi per venditori — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Prezzi per venditori"),
      primaryCta: t("Candidati come venditore"),
      secondaryCta: t("Torna alla panoramica venditore"),
      statsLabels: {
        planTiers: t("Livelli di piano"),
        trustTiers: t("Livelli di fiducia"),
        featuredSlots: t("Posti in evidenza"),
      },
      featuredSlotsValue: t("Valutati caso per caso"),
    },
    plans: {
      kicker: t("Piani in sintesi"),
      feeLabel: t("Commissione"),
      payoutLabel: t("Pagamento"),
      includedLabel: t("Inclusi"),
      includedSuffix: t("annunci"),
      extraListingLabel: t("Annuncio aggiuntivo"),
      featuredSlotLabel: t("Posto in evidenza"),
      currencyPrefix: "NGN",
      ctaPartner: t("Contattaci per condizioni partner"),
      ctaTemplate: t("Inizia con {plan}"),
    },
    closing: {
      kicker: t("Pronto a candidarti?"),
      title: t("La candidatura si apre nel tuo account Henry Onyx"),
      primaryCta: t("Candidati come venditore"),
      secondaryCta: t("Standard di fiducia"),
    },
  },
  trust: {
    metadata: {
      title: t("Affidabilità e sicurezza — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Affidabilità e sicurezza"),
      title: t("Visibile prima del checkout. Applicata dopo."),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Henry Onyx Marketplace"),
    },
    hero: {
      primaryCta: t("Apri ricerca completa"),
      secondaryCta: t("Standard di fiducia"),
    },
    sidebar: {
      itemsLabel: t("Articoli nella collezione"),
      buyerProtectionLabel: t("Protezione acquirente"),
    },
    rail: {
      itemsSuffix: t("articoli"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{policy} su Henry Onyx Marketplace — applicazione registrata lato server, controlli di deposito a garanzia e postura di fiducia visibili prima del checkout."),
      fallbackTitle: t("Politica del marketplace — Henry Onyx Marketplace"),
      fallbackDescription:
        t("Una politica di Henry Onyx Marketplace — applicazione registrata lato server, controlli di deposito a garanzia e postura di fiducia visibili prima del checkout."),
    },
    hero: {
      backToTrust: t("Torna agli standard di fiducia"),
      openSupport: t("Apri un thread di assistenza"),
    },
    details: {
      coverageLabel: t("Copertura"),
      updatedLabel: t("Aggiornato"),
    },
    coverageBySlug: {
      buyerProtection: t("Acquirenti"),
      sellerPolicy: t("Venditori"),
      fallback: t("Partecipanti al marketplace"),
    },
    updatedBySlug: {
      buyerProtection: t("A ogni revisione su pagamenti e controversie"),
      sellerPolicy: t("A ogni revisione degli standard venditore"),
      fallback: t("A ogni revisione della politica"),
    },
    provisions: {
      kicker: t("Disposizioni della politica"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
    },
    fulfillment: {
      availabilityLabel: t("Disponibilità"),
      availabilityValueSingular: t("{count} unità nello stock attuale"),
      availabilityValuePlural: t("{count} unità nello stock attuale"),
      paymentLabel: t("Pagamento"),
    },
    price: {
      label: t("Prezzo"),
      leadTimeLabel: t("Tempi di consegna"),
    },
    detail: {
      deliverySummaryTitle: t("Consegna, supporto e cura post-ordine"),
      deliveryTail:
        t("Gli ordini restano tracciabili dal pagamento alla spedizione, e le contestazioni o i thread di supporto restano associati allo stesso record d’ordine."),
      visitVendorTemplate: t("Visita {vendor}"),
      exploreCategoryTemplate: t("Esplora {category}"),
      seeBrandTemplate: t("Vedi {brand}"),
    },
    reviews: {
      kicker: t("Spunti delle recensioni"),
      title: t("Segnali d’acquisto verificati, senza rumore inutile."),
      reviewLabel: t("Recensione"),
    },
    rail: {
      kicker: t("Chi ha visto ha comprato anche"),
      ctaLabel: t("Apri ricerca"),
    },
  },
};
}

function buildAR(locale: AppLocale): DeepPartial<MarketplacePublicCopy> {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  home: {
    heroKicker: t("سوق مميّز ومُتقن"),
    heroTitle: t("اشترِ من متاجر موثّقة، دون ضجيج أو فوضى أو شكوك في الثقة."),
    heroBody:
      t("يحوّل Henry Onyx Marketplace تجارة البائعين المتعدّدين إلى تجربة أكثر هدوءًا: اكتشاف أوضح، إضافة سريعة من كل بطاقة، وضوح للطلبات المقسّمة، جوازات بائع أقوى، وحساب Henry Onyx واحد للطلبات والمدفوعات والمراجعات والدعم."),
    primaryCta: t("استكشف الكتالوج"),
    secondaryCta: t("بِع على Henry Onyx"),
    quickCards: [
      { title: t("إضافة سريعة في كل مكان"), body: t("عناصر تحكّم سلة هادئة على مستوى البطاقة، وتحديثات فورية للسلة المصغّرة، دون عمليات إعادة تحميل مرتبكة.") },
      { title: t("مسارات ثقة موثّقة"), body: t("تظل جوازات البائع، ووعود التسليم، وجودة المراجعات، وملكية المخزون سهلة القراءة.") },
      { title: t("حساب واحد، احتكاك أقل"), body: t("تبقى الطلبات والمدفوعات وقائمة الرغبات والمتابعات والإشعارات معًا في حساب Henry Onyx واحد.") },
    ],
    whyKicker: t("لماذا يبدو مختلفًا"),
    whyTitle: t("الثقة مرئية قبل الدفع."),
    whyCards: [
      { title: t("الثقة مرئية قبل الدفع"), body: t("يظل مستوى التوثيق، ونسبة النزاعات، وسرعة استجابة الدعم، وموثوقية التنفيذ قريبًا من قرار الشراء.") },
      { title: t("وضوح الطلبات المقسّمة يبقى مقروءًا"), body: t("عندما يأتي المخزون من بائعين مختلفين أو من مخزون Henry Onyx، يظل تقسيم التسليم واضحًا بدل أن يتحوّل إلى ارتباك عند الدفع.") },
      { title: t("البائعون يتم تنسيقهم لا حشدهم في شبكة"), body: t("يفضّل السوق المتاجر الأقوى، والقوائم الأنظف، والمساءلة الأفضل بعد الطلب على تضخّم الكتالوج.") },
    ],
    emptyTitle: t("يجري إعداد الكتالوج."),
    emptyBody: t("ستظهر هنا المنتجات والمجموعات والحملات المعتمدة بمجرد نشرها."),
    emptyCta: t("تواصل مع دعم السوق"),
    categoryKicker: t("الاكتشاف حسب الفئة"),
    categoryTitle: t("اكتشف حسب الأجواء والمساحة ومستوى الثقة."),
    categoryLink: t("افتح البحث"),
    freshKicker: t("اعتمادات جديدة"),
    freshTitle: t("جديد في السوق الآن."),
    featuredKicker: t("منتجات مميّزة"),
    featuredTitle: t("بطاقات مميّزة، وإضافة فورية، وإشارات شراء أوضح."),
    browseAll: t("عرض الكل"),
    collectionsKicker: t("مجموعات تحريرية"),
    collectionsTitle: t("مسارات منسّقة توجّه القرارات بهدوء."),
    vendorsKicker: t("متاجر موثوقة"),
    vendorsTitle: t("بائعون موثّقون بمساءلة أوضح."),
    standardsKicker: t("معايير السوق"),
    standardsTitle: t("مصمّم للثقة والوضوح وتجربة شراء أكثر هدوءًا."),
    standardsBullets: [
      t("تمرّ طلبات البائعين والإشراف والاعتمادات عبر قنوات مراجعة مخصّصة في Henry Onyx"),
      t("تظل تحديثات الطلبات والمراجعات والدعم والمدفوعات مرتبطة بنفس حساب المشتري."),
      t("يبقى الدعم ومراجعة المدفوعات وعمليات التسليم منظّمًا لتظل الردود متناسقة."),
    ],
    sellerKicker: t("جودة البائع"),
    sellerTitle: t("البائعون الجادّون يبدؤون من داخل حساب Henry Onyx الخاص بهم."),
    sellerBody:
      t("يمكن للزوّار العموميين التعرّف على البيع عبر /sell، بينما يبقى التقديم وتقدّم المسودّة وتحديثات المراجعة وحالة الاعتماد داخل تجربة البائع."),
    sellerBullets: [
      t("حفظ المسودّات ووضوح التقدّم"),
      t("تعامل خاص مع المستندات في المكان المناسب"),
      t("تحديثات اعتماد واضحة لكل بائع"),
    ],
  },
  kpiLabels: {
    activeListings: t("قوائم نشطة"),
    trustRating: t("تقييم الثقة"),
  },
  kpiHints: {
    verifiedStores: t("بائعون منسّقون ومخزون مملوك من Henry Onyx بمساءلة أوضح."),
    activeListings: t("قوائم معتمدة تُعرض مع وضوح في التسليم والثقة والملكية."),
    trustRating: t("تظهر جودة مراجعات السوق وموثوقية البائع قبل الدفع."),
  },
  footer: {
    brandSubtitle: t("تجارة مُتقنة مع حساب Henry Onyx متّصل"),
    brandBody:
      t("صُمّم Henry Onyx Marketplace من أجل مشتريات عالية الثقة، وبائعين موثّقين، وتجربة أنظف من الدفع إلى التسليم."),
    shopTitle: t("تسوّق"),
    sellTitle: t("بِع"),
    supportTitle: t("الدعم"),
    supportBody:
      t("تبقى الطلبات ومحادثات البائعين وتحديثات الدعم وسجلات الدفع متّصلة في حساب Henry Onyx واحد."),
    shopLinks: [
      { href: "/search", label: t("ابحث في السوق") },
      { href: "/deals", label: t("عروض وإصدارات محدودة") },
      { href: "/trust", label: t("جواز الثقة") },
      { href: "/policies/buyer-protection", label: t("سياسة حماية المشتري") },
      { href: "/help", label: t("الدعم وحلّ المشكلات") },
    ],
    sellLinks: [
      { href: "/sell", label: t("لماذا تبيع على Henry Onyx") },
      { href: "/sell/pricing", label: t("الأسعار ورسوم البائع") },
      { href: "/policies/seller-policy", label: t("سياسة البائع") },
      { href: "/account/seller-application", label: t("تقديم البائع") },
      { href: "/vendor", label: t("مساحة البائع") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("مخزون Henry Onyx"),
    verifiedSeller: t("بائع موثّق"),
    onlyLeft: t("متبقّي {count} فقط"),
    saveToWishlist: t("حفظ في قائمة الرغبات"),
    removeFromWishlist: t("إزالة من قائمة الرغبات"),
    updatingWishlist: t("تحديث القائمة"),
    codReady: t("الدفع عند الاستلام متاح"),
    addToCart: t("أضف إلى السلة"),
    addingToCart: t("جارٍ الإضافة إلى السلة"),
    view: t("عرض"),
  },
  trustPassport: {
    title: t("جواز الثقة"),
    verification: t("التوثيق"),
    fulfillment: t("التنفيذ"),
    disputeRate: t("نسبة النزاعات"),
    responseSla: t("اتفاقية مستوى الرد"),
    visitStore: t("زيارة المتجر"),
  },
  workspace: {
    kicker: t("مساحة العمل"),
    operatorKicker: t("واجهة المشغّل"),
  },
  cart: {
    pageIntro: {
      kicker: t("السلة"),
    },
    emptyState: {
      title: t("سلتك ما زالت فارغة."),
      ctaLabel: t("تصفّح المنتجات"),
    },
  },
  track: {
    metadata: {
      title: t("تتبّع الطلب — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("تتبّع الطلب"),
      titlePrefix: t("تتبّع"),
      orderValueLabel: t("قيمة الطلب"),
      paymentLabel: t("الدفع"),
      payoutControlLabel: t("ضبط تحويل الأموال"),
      payoutFrozen: t("مُجمَّد"),
      payoutEscrowActive: t("الضمان نشط"),
    },
    paymentRecord: {
      kicker: t("سجلّ الدفع"),
      walletBody: t("تم خصم رصيد المحفظة، والطلب محتجَز في الضمان حتى يكتمل الشحن."),
      proofBody: t("تم إرفاق إثبات التحويل الخاص بك وهو قيد المراجعة."),
      awaitingBody: t("هذه الدفعة بانتظار تأكيد تحويلك أو اكتمال التسليم."),
      methodLabel: t("الطريقة"),
      statusLabel: t("الحالة"),
      proofLabel: t("الإثبات"),
      viewProof: t("عرض الإثبات"),
      walletDebit: t("خصم من المحفظة"),
      pending: t("قيد الانتظار"),
    },
    segments: {
      fulfillmentLabel: t("الشحن"),
      trackingLabel: t("التتبّع"),
      payoutLabel: t("تحويل الأموال"),
      trackingPending: t("قيد الانتظار"),
    },
    completion: {
      kicker: t("تأكيد الاستلام"),
      body: t("أكِّد الاستلام عندما يكون الطلب مرضيًا. لا تُفرج Henry Onyx عن مستحقّات البائع إلا بعد تأكيد التسليم أو عند استيفاء شروط الإفراج التلقائي."),
      confirmCta: t("تأكيد الاستلام"),
    },
    help: {
      kicker: t("تحتاج إلى مساعدة؟"),
      openSupportCta: t("فتح خيط دعم"),
      viewAllOrdersCta: t("عرض كل الطلبات"),
    },
  },
  deals: {
    discountBadgePrefix: "−",
  },
  brand: {
    eyebrow: t("العلامة التجارية"),
    searchCta: t("ابحث داخل هذه العلامة"),
    trustCta: t("معايير الثقة"),
    stats: {
      activeProducts: t("منتجات نشطة"),
      buyerProtection: t("حماية المشتري"),
    },
    liveKicker: t("مباشر من {brand}"),
    openFullSearch: t("فتح البحث الكامل"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    stats: {
      trustScore: t("درجة الثقة"),
      followers: t("المتابعون"),
    },
    standards: {
      eyebrow: t("معايير المتجر"),
    },
    support: {
      eyebrow: t("الدعم"),
      ctaLabel: t("تواصل مع هذا المتجر"),
      subjectTemplate: t("سؤال إلى {store}"),
    },
    reviews: {
      eyebrow: t("أحدث التقييمات"),
      review: t("تقييم"),
    },
    catalog: {
      exploreLink: t("استكشف المزيد من الإعلانات الموثّقة"),
      emptyTitle: t("لا توجد إعلانات مباشرة بعد"),
      emptyBody: t("ستظهر هنا المنتجات المعتمدة من هذا المتجر فور إتاحتها مباشرةً."),
    },
  },
  category: {
    hero: {
      kicker: t("تشكيلة الفئة"),
      searchCta: t("ابحث ضمن هذه الفئة"),
      trustCta: t("اطّلع على معايير الثقة"),
      quickFiltersLabel: t("فلاتر سريعة"),
    },
    stats: {
      activeListingsLabel: t("إعلانات نشطة"),
    },
    catalog: {
      openSearch: t("افتح البحث الكامل"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
    },
  },
  help: {
    metadata: {
      title: t("مركز المساعدة — Henry Onyx Marketplace"),
      description:
        t("تصفّح الأسئلة الأكثر تكرارًا بين المشترين والبائعين. إن لم تجد ما تبحث عنه، افتح تذكرة دعم وسيقرؤها شخص من الفريق."),
    },
    hero: {
      kicker: t("مركز المساعدة"),
      title: t("اعثر على إجابة في ثوانٍ — أو تحدّث مع شخص حقيقي."),
    },
    stillNeedHelp: {
      kicker: t("ما زلت تحتاج إلى المساعدة"),
      title: t("افتح تذكرة دعم وسيقرؤها شخص حقيقي."),
      ctaLabel: t("افتح تذكرة دعم"),
    },
  },
  sell: {
    hero: {
      kicker: t("بِع على Henry Onyx"),
      title: t("انتقائيٌّ بطبيعته. مصمَّم للبائعين الذين يقودون بالثقة."),
      primaryCta: t("فتح طلب البيع"),
      secondaryCta: t("الاطّلاع على أسعار البائعين"),
      signInCta: t("تسجيل الدخول بحساب Henry Onyx"),
      highlights: [
        { label: t("الانتقاء"), value: t("مراجعة يدوية، لا إدراج مدفوع") },
        { label: t("الواجهة"), value: t("جواز ثقة ظاهر للمشترين") },
        { label: t("المساحة"), value: t("طلبات ومدفوعات ودعم في مكان واحد") },
      ],
    },
    onboarding: {
      kicker: t("كيف يسير الانضمام"),
      stepLabel: t("خطوة"),
    },
    plans: {
      kicker: t("اقتصاديات الخطط"),
      title: t("المستويات معروفة مسبقًا، لا بعد النشر."),
      feeLabel: t("العمولة"),
      payoutLabel: t("التحويل"),
      includedLabel: t("المتضمَّن"),
      includedSuffix: t("إعلانًا"),
      featuredLabel: t("إبراز"),
      featuredCurrencyPrefix: "NGN",
    },
    closing: {
      kicker: t("للمضيّ قدمًا"),
      primaryCta: t("ابدأ الطلب"),
      secondaryCta: t("زيارة مساحة البائع"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("تسعير البائعين — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("تسعير البائعين"),
      primaryCta: t("قدّم بصفتك بائعًا"),
      secondaryCta: t("العودة إلى نظرة البائع"),
      statsLabels: {
        planTiers: t("مستويات الخطة"),
        trustTiers: t("مستويات الثقة"),
        featuredSlots: t("خانات الإبراز"),
      },
      featuredSlotsValue: t("تُراجع حالةً بحالة"),
    },
    plans: {
      kicker: t("الخطط بنظرة سريعة"),
      feeLabel: t("العمولة"),
      payoutLabel: t("التحويل"),
      includedLabel: t("مُضمّن"),
      includedSuffix: t("إعلانًا"),
      extraListingLabel: t("إعلان إضافي"),
      featuredSlotLabel: t("خانة إبراز"),
      currencyPrefix: "NGN",
      ctaPartner: t("تواصل معنا لشروط الشراكة"),
      ctaTemplate: t("ابدأ بـ {plan}"),
    },
    closing: {
      kicker: t("هل أنت جاهز للتقديم؟"),
      title: t("يفتح الطلب داخل حساب Henry Onyx الخاص بك."),
      primaryCta: t("قدّم بصفتك بائعًا"),
      secondaryCta: t("معايير الثقة"),
    },
  },
  trust: {
    metadata: {
      title: t("الثقة والسلامة — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("الثقة والسلامة"),
      title: t("ظاهرة قبل الدفع، ومُطبَّقة بعده."),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — متجر Henry Onyx"),
    },
    hero: {
      primaryCta: t("افتح البحث الكامل"),
      secondaryCta: t("معايير الثقة"),
    },
    sidebar: {
      itemsLabel: t("العناصر في المجموعة"),
      buyerProtectionLabel: t("حماية المشتري"),
    },
    rail: {
      itemsSuffix: t("عنصرًا"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — متجر Henry Onyx"),
      descriptionTemplate:
        t("{policy} على متجر Henry Onyx — تطبيق مُسجَّل على الخادم، وضوابط ضمان للمدفوعات، وموقف ثقة ظاهر قبل الدفع."),
      fallbackTitle: t("سياسة المتجر — متجر Henry Onyx"),
      fallbackDescription:
        t("سياسة من متجر Henry Onyx — تطبيق مُسجَّل على الخادم، وضوابط ضمان للمدفوعات، وموقف ثقة ظاهر قبل الدفع."),
    },
    hero: {
      backToTrust: t("عودة إلى معايير الثقة"),
      openSupport: t("افتح محادثة الدعم"),
    },
    details: {
      coverageLabel: t("نطاق التغطية"),
      updatedLabel: t("آخر تحديث"),
    },
    coverageBySlug: {
      buyerProtection: t("المشترون"),
      sellerPolicy: t("البائعون"),
      fallback: t("المشاركون في المتجر"),
    },
    updatedBySlug: {
      buyerProtection: t("عند مراجعات المدفوعات والنزاعات"),
      sellerPolicy: t("عند مراجعات معايير البائع"),
      fallback: t("عند مراجعات السياسة"),
    },
    provisions: {
      kicker: t("أحكام السياسة"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
    },
    fulfillment: {
      availabilityLabel: t("التوفر"),
      availabilityValueSingular: t("{count} وحدة في المخزون الحالي"),
      availabilityValuePlural: t("{count} وحدات في المخزون الحالي"),
      paymentLabel: t("الدفع"),
    },
    price: {
      label: t("السعر"),
      leadTimeLabel: t("زمن التسليم"),
    },
    detail: {
      deliverySummaryTitle: t("التوصيل والدعم والرعاية بعد الطلب"),
      deliveryTail:
        t("تبقى الطلبات قابلة للتتبّع من الدفع وحتى التسليم، وتظل النزاعات وخيوط الدعم مرتبطة بنفس سجل الطلب."),
      visitVendorTemplate: t("زيارة {vendor}"),
      exploreCategoryTemplate: t("استكشاف {category}"),
      seeBrandTemplate: t("عرض {brand}"),
    },
    reviews: {
      kicker: t("أبرز المراجعات"),
      title: t("إشارات شراء موثّقة، دون حشو مزعج."),
      reviewLabel: t("مراجعة"),
    },
    rail: {
      kicker: t("اشترى الزبائن أيضًا"),
      ctaLabel: t("فتح البحث"),
    },
  },
};
}

function buildZH(locale: AppLocale): DeepPartial<MarketplacePublicCopy> {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  home: {
    heroKicker: t("精致的高端市集"),
    heroTitle: t("在通过认证的店铺安心选购,没有杂音、混乱或对信任的疑虑。"),
    heroBody:
      t("Henry Onyx Marketplace 把多商家交易转化为更安静的体验:更清晰的发现、卡片上即可快速加入、更明确的拆单展示、更稳健的卖家通行证,以及一个统一的 Henry Onyx 账户来管理订单、付款、评价和支持。"),
    primaryCta: t("浏览商品目录"),
    secondaryCta: t("入驻 Henry Onyx"),
    quickCards: [
      { title: t("到处都能快速加入"), body: t("卡片层级的低干扰购物车控件,迷你购物车即时更新,无需笨拙的页面刷新。") },
      { title: t("通过认证的信任通道"), body: t("卖家通行证、配送承诺、评价质量与库存归属始终一目了然。") },
      { title: t("一个账户,更少摩擦"), body: t("订单、付款、心愿单、关注与通知集中在同一个 Henry Onyx 账户中。") },
    ],
    whyKicker: t("为什么感觉不一样"),
    whyTitle: t("信任在付款之前就已经可见。"),
    whyCards: [
      { title: t("信任在付款之前就已经可见"), body: t("认证等级、争议率、客服响应与履约可靠性始终贴近购买决策。") },
      { title: t("拆单展示依然清晰可读"), body: t("当库存来自不同卖家或 Henry Onyx 自营库存时,配送分段依旧清晰,而不会变成结算时的混乱。") },
      { title: t("卖家是经过精选,而非堆进网格"), body: t("市集偏好更扎实的店铺、更整洁的商品页和更好的售后责任,而不是目录的堆积。") },
    ],
    emptyTitle: t("商品目录正在准备中。"),
    emptyBody: t("已审核的商品、合集与活动一旦上线,就会出现在这里。"),
    emptyCta: t("联系市集支持"),
    categoryKicker: t("按品类发现"),
    categoryTitle: t("按氛围、空间和信任等级进行发现。"),
    categoryLink: t("打开搜索"),
    freshKicker: t("新近审核通过"),
    freshTitle: t("现在的市集新品。"),
    featuredKicker: t("精选商品"),
    featuredTitle: t("精致的商品卡、即时加入与更清晰的购买信号。"),
    browseAll: t("查看全部"),
    collectionsKicker: t("编辑合集"),
    collectionsTitle: t("由编辑精选的通道,安静地引导决策。"),
    vendorsKicker: t("受信任的店铺"),
    vendorsTitle: t("责任更清晰的认证卖家。"),
    standardsKicker: t("市集标准"),
    standardsTitle: t("为信任、清晰与更安静的购物体验而设计。"),
    standardsBullets: [
      t("卖家入驻、内容审核与上架审批都经过 Henry Onyx 专属的审核通道。"),
      t("订单更新、评价、客服与付款始终与同一个买家账户保持关联。"),
      t("客服、付款审核与配送运营保持有序,以便回复一致。"),
    ],
    sellerKicker: t("卖家质量"),
    sellerTitle: t("认真的卖家从他们的 Henry Onyx 账户内开始。"),
    sellerBody:
      t("公开访客可以在 /sell 了解入驻,而申请、草稿进度、审核更新与上线状态都保留在卖家体验内部。"),
    sellerBullets: [
      t("草稿保存与进度可见"),
      t("敏感文件在合适的地方私密处理"),
      t("每位卖家都获得清晰的上线更新"),
    ],
  },
  kpiLabels: {
    activeListings: t("在售商品"),
    trustRating: t("信任评分"),
  },
  kpiHints: {
    verifiedStores: t("精选卖家与 Henry Onyx 自营库存,带来更清晰的责任划分。"),
    activeListings: t("已审核的商品,以清晰的配送、信任与归属信息呈现。"),
    trustRating: t("市集评价质量与卖家可靠性会在付款之前显示。"),
  },
  footer: {
    brandSubtitle: t("精致交易,搭配互联的 Henry Onyx 账户"),
    brandBody:
      t("Henry Onyx Marketplace 为高信任度的购物、认证卖家以及从结算到配送都更清爽的体验而打造。"),
    shopTitle: t("购物"),
    sellTitle: t("出售"),
    supportTitle: t("支持"),
    supportBody:
      t("订单、与卖家的对话、客服更新与付款记录在同一个 Henry Onyx 账户内保持互联。"),
    shopLinks: [
      { href: "/search", label: t("搜索市集") },
      { href: "/deals", label: t("优惠与限定版") },
      { href: "/trust", label: t("信任通行证") },
      { href: "/policies/buyer-protection", label: t("买家保护政策") },
      { href: "/help", label: t("支持与解决") },
    ],
    sellLinks: [
      { href: "/sell", label: t("为什么在 Henry Onyx 出售") },
      { href: "/sell/pricing", label: t("卖家定价与费率") },
      { href: "/policies/seller-policy", label: t("卖家政策") },
      { href: "/account/seller-application", label: t("卖家申请") },
      { href: "/vendor", label: t("卖家工作区") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("Henry Onyx 自营"),
    verifiedSeller: t("认证卖家"),
    onlyLeft: t("仅剩 {count} 件"),
    saveToWishlist: t("加入心愿单"),
    removeFromWishlist: t("移出心愿单"),
    updatingWishlist: t("正在更新心愿单"),
    codReady: t("支持货到付款"),
    addToCart: t("加入购物车"),
    addingToCart: t("正在加入购物车"),
    view: t("查看"),
  },
  trustPassport: {
    title: t("信任通行证"),
    verification: t("认证"),
    fulfillment: t("履约"),
    disputeRate: t("争议率"),
    responseSla: t("响应时效"),
    visitStore: t("访问店铺"),
  },
  workspace: {
    kicker: t("工作区"),
    operatorKicker: t("运营界面"),
  },
  cart: {
    pageIntro: {
      kicker: t("购物车"),
    },
    emptyState: {
      title: t("你的购物车还是空的。"),
      ctaLabel: t("浏览商品"),
    },
  },
  track: {
    metadata: {
      title: t("订单跟踪 — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("订单跟踪"),
      titlePrefix: t("跟踪"),
      orderValueLabel: t("订单金额"),
      paymentLabel: t("付款"),
      payoutControlLabel: t("结算控制"),
      payoutFrozen: t("已冻结"),
      payoutEscrowActive: t("代管中"),
    },
    paymentRecord: {
      kicker: t("付款记录"),
      walletBody: t("钱包余额已扣款,订单进入代管,等待履约。"),
      proofBody: t("您的转账凭证已附上,正在审核中。"),
      awaitingBody: t("此付款正在等待您的转账确认,或等待交付完成。"),
      methodLabel: t("方式"),
      statusLabel: t("状态"),
      proofLabel: t("凭证"),
      viewProof: t("查看凭证"),
      walletDebit: t("钱包扣款"),
      pending: t("待处理"),
    },
    segments: {
      fulfillmentLabel: t("履约"),
      trackingLabel: t("物流跟踪"),
      payoutLabel: t("结算"),
      trackingPending: t("待处理"),
    },
    completion: {
      kicker: t("完成确认"),
      body: t("当订单令你满意时请确认完成。Henry Onyx 只在确认送达或订单符合自动放款条件后,才会向卖家释放结算款项。"),
      confirmCta: t("确认完成"),
    },
    help: {
      kicker: t("需要帮助?"),
      openSupportCta: t("开启支持对话"),
      viewAllOrdersCta: t("查看全部订单"),
    },
  },
  deals: {
    discountBadgePrefix: "−",
  },
  brand: {
    eyebrow: t("品牌"),
    searchCta: t("在该品牌内搜索"),
    trustCta: t("信任标准"),
    stats: {
      activeProducts: t("在售商品"),
      buyerProtection: t("买家保障"),
    },
    liveKicker: t("来自 {brand} 的实时上架"),
    openFullSearch: t("打开完整搜索"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    stats: {
      trustScore: t("信任评分"),
      followers: t("关注者"),
    },
    standards: {
      eyebrow: t("店铺标准"),
    },
    support: {
      eyebrow: t("客户支持"),
      ctaLabel: t("联系该店铺"),
      subjectTemplate: t("向 {store} 咨询"),
    },
    reviews: {
      eyebrow: t("最新评价"),
      review: t("评价"),
    },
    catalog: {
      exploreLink: t("查看更多认证商品"),
      emptyTitle: t("暂无在售商品"),
      emptyBody: t("经审核的商品上线后将在此显示。"),
    },
  },
  category: {
    hero: {
      kicker: t("品类精选"),
      searchCta: t("在该品类中搜索"),
      trustCta: t("查看信任标准"),
      quickFiltersLabel: t("快速筛选"),
    },
    stats: {
      activeListingsLabel: t("在售商品"),
    },
    catalog: {
      openSearch: t("打开完整搜索"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
    },
  },
  help: {
    metadata: {
      title: t("帮助中心 — Henry Onyx Marketplace"),
      description:
        t("浏览买家和卖家最常问的问题。如果没找到所需答案,提交一张工单,团队会有专人查看。"),
    },
    hero: {
      kicker: t("帮助中心"),
      title: t("几秒内找到答案 — 或与真人沟通。"),
    },
    stillNeedHelp: {
      kicker: t("仍需要帮助"),
      title: t("提交工单,会有专人查看。"),
      ctaLabel: t("提交支持工单"),
    },
  },
  trust: {
    metadata: {
      title: t("信任与安全 — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("信任与安全"),
      title: t("结算前可见,结算后强制执行。"),
    },
  },
  sell: {
    hero: {
      kicker: t("在 Henry Onyx 开店"),
      title: t("天生精选。专为以信任领跑的卖家而生。"),
      primaryCta: t("开始卖家申请"),
      secondaryCta: t("查看卖家定价"),
      signInCta: t("用 Henry Onyx 账户登录"),
      highlights: [
        { label: t("选择"), value: t("人工审核,而非付费上架") },
        { label: t("店铺"), value: t("买家可见的信任护照") },
        { label: t("工作台"), value: t("订单、结算、支持统一管理") },
      ],
    },
    onboarding: {
      kicker: t("入驻流程"),
      stepLabel: t("步骤"),
    },
    plans: {
      kicker: t("套餐经济"),
      title: t("层级在发布前就已声明,而非事后。"),
      feeLabel: t("费用"),
      payoutLabel: t("结算"),
      includedLabel: t("包含"),
      includedSuffix: t("条上架"),
      featuredLabel: t("推荐位"),
      featuredCurrencyPrefix: "NGN",
    },
    closing: {
      kicker: t("继续前进"),
      primaryCta: t("开始申请"),
      secondaryCta: t("前往卖家工作台"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("卖家定价 — Henry Onyx 商城"),
    },
    hero: {
      kicker: t("卖家定价"),
      primaryCta: t("申请成为卖家"),
      secondaryCta: t("返回卖家概览"),
      statsLabels: {
        planTiers: t("套餐档位"),
        trustTiers: t("信任档位"),
        featuredSlots: t("推荐位"),
      },
      featuredSlotsValue: t("按个案审核"),
    },
    plans: {
      kicker: t("套餐一览"),
      feeLabel: t("佣金"),
      payoutLabel: t("结算"),
      includedLabel: t("包含"),
      includedSuffix: t("条上架"),
      extraListingLabel: t("额外上架"),
      featuredSlotLabel: t("推荐位"),
      currencyPrefix: "NGN",
      ctaPartner: t("联系我们了解合作条款"),
      ctaTemplate: t("选择 {plan} 开始"),
    },
    closing: {
      kicker: t("准备好申请了吗?"),
      title: t("申请将在你的 Henry Onyx 账户中打开。"),
      primaryCta: t("申请成为卖家"),
      secondaryCta: t("信任标准"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Henry Onyx 商城"),
    },
    hero: {
      primaryCta: t("打开完整搜索"),
      secondaryCta: t("信任标准"),
    },
    sidebar: {
      itemsLabel: t("合集中的商品"),
      buyerProtectionLabel: t("买家保护"),
    },
    rail: {
      itemsSuffix: t("件商品"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Henry Onyx 商城"),
      descriptionTemplate:
        t("Henry Onyx 商城的 {policy} — 服务器侧记录的执行轨迹、托管支付控制以及在结账前可见的信任态势。"),
      fallbackTitle: t("商城政策 — Henry Onyx 商城"),
      fallbackDescription:
        t("Henry Onyx 商城的一项政策 — 服务器侧记录的执行轨迹、托管支付控制以及在结账前可见的信任态势。"),
    },
    hero: {
      backToTrust: t("返回信任标准"),
      openSupport: t("打开支持工单"),
    },
    details: {
      coverageLabel: t("适用范围"),
      updatedLabel: t("更新时机"),
    },
    coverageBySlug: {
      buyerProtection: t("买家"),
      sellerPolicy: t("卖家"),
      fallback: t("商城参与者"),
    },
    updatedBySlug: {
      buyerProtection: t("在支付与争议规则更新时"),
      sellerPolicy: t("在卖家标准更新时"),
      fallback: t("在政策更新时"),
    },
    provisions: {
      kicker: t("政策条款"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx 商城"),
    },
    fulfillment: {
      availabilityLabel: t("现货"),
      availabilityValueSingular: t("当前库存 {count} 件"),
      availabilityValuePlural: t("当前库存 {count} 件"),
      paymentLabel: t("支付"),
    },
    price: {
      label: t("价格"),
      leadTimeLabel: t("交付周期"),
    },
    detail: {
      deliverySummaryTitle: t("配送、支持与售后照看"),
      deliveryTail:
        t("订单从付款到发货全程可追踪,任何争议或客服记录都与同一订单档案绑定。"),
      visitVendorTemplate: t("进入 {vendor}"),
      exploreCategoryTemplate: t("浏览 {category}"),
      seeBrandTemplate: t("查看 {brand}"),
    },
    reviews: {
      kicker: t("评价亮点"),
      title: t("已核验的购买信号,不掺杂噪音。"),
      reviewLabel: t("评价"),
    },
    rail: {
      kicker: t("买家也常一起买"),
      ctaLabel: t("打开搜索"),
    },
  },
};
}

function buildHI(locale: AppLocale): DeepPartial<MarketplacePublicCopy> {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  cart: {
    pageIntro: {
      kicker: t("कार्ट"),
    },
    emptyState: {
      title: t("आपका कार्ट अभी ख़ाली है।"),
      ctaLabel: t("प्रोडक्ट देखें"),
    },
  },
  track: {
    metadata: {
      title: t("ऑर्डर ट्रैकिंग — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("ऑर्डर ट्रैकिंग"),
      titlePrefix: t("ट्रैकिंग"),
      orderValueLabel: t("ऑर्डर मूल्य"),
      paymentLabel: t("पेमेंट"),
      payoutControlLabel: t("पेआउट नियंत्रण"),
      payoutFrozen: t("रोका हुआ"),
      payoutEscrowActive: t("एस्क्रो सक्रिय"),
    },
    paymentRecord: {
      kicker: t("पेमेंट रिकॉर्ड"),
      walletBody: t("वॉलेट बैलेंस से कटौती हो गई है और ऑर्डर डिलीवरी तक एस्क्रो में सुरक्षित है।"),
      proofBody: t("Your transfer proof is attached and under review."),
      awaitingBody: t("This payment is waiting for your transfer to be confirmed, or for delivery to be completed."),
      methodLabel: t("तरीक़ा"),
      statusLabel: t("स्थिति"),
      proofLabel: t("प्रमाण"),
      viewProof: t("प्रमाण देखें"),
      walletDebit: t("वॉलेट से कटौती"),
      pending: t("लंबित"),
    },
    segments: {
      fulfillmentLabel: t("फ़ुलफ़िलमेंट"),
      trackingLabel: t("ट्रैकिंग"),
      payoutLabel: t("पेआउट"),
      trackingPending: t("लंबित"),
    },
    completion: {
      kicker: t("पूरा होने की पुष्टि"),
      body: t("ऑर्डर ठीक हो तो पूरा होने की पुष्टि करें। Henry Onyx विक्रेता का पेआउट तभी जारी करता है जब डिलीवरी पुष्ट हो जाए या ऑर्डर ऑटो-रिलीज़ की शर्तें पूरी कर ले।"),
      confirmCta: t("पूरा होने की पुष्टि करें"),
    },
    help: {
      kicker: t("मदद चाहिए?"),
      openSupportCta: t("सपोर्ट थ्रेड खोलें"),
      viewAllOrdersCta: t("सभी ऑर्डर देखें"),
    },
  },
  deals: {
    discountBadgePrefix: "−",
  },
  brand: {
    eyebrow: t("ब्रांड"),
    searchCta: t("इस ब्रांड में खोजें"),
    trustCta: t("ट्रस्ट मानक"),
    stats: {
      activeProducts: t("सक्रिय उत्पाद"),
      buyerProtection: t("ख़रीदार सुरक्षा"),
    },
    liveKicker: t("{brand} से लाइव"),
    openFullSearch: t("पूरी खोज खोलें"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    stats: {
      trustScore: t("ट्रस्ट स्कोर"),
      followers: t("फ़ॉलोअर"),
    },
    standards: {
      eyebrow: t("स्टोर मानक"),
    },
    support: {
      eyebrow: t("सहायता"),
      ctaLabel: t("इस स्टोर से संपर्क करें"),
      subjectTemplate: t("{store} के लिए सवाल"),
    },
    reviews: {
      eyebrow: t("हाल की समीक्षाएँ"),
      review: t("समीक्षा"),
    },
    catalog: {
      exploreLink: t("और सत्यापित लिस्टिंग देखें"),
      emptyTitle: t("अभी कोई लाइव लिस्टिंग नहीं है"),
      emptyBody: t("इस स्टोर के अनुमोदित उत्पाद लाइव होते ही यहाँ दिखाई देंगे।"),
    },
  },
  category: {
    hero: {
      kicker: t("कैटेगरी एडिट"),
      searchCta: t("इस कैटेगरी में खोजें"),
      trustCta: t("ट्रस्ट स्टैंडर्ड देखें"),
      quickFiltersLabel: t("क्विक फ़िल्टर"),
    },
    stats: {
      activeListingsLabel: t("सक्रिय लिस्टिंग"),
    },
    catalog: {
      openSearch: t("पूरी सर्च खोलें"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
    },
  },
  help: {
    metadata: {
      title: t("मदद केंद्र — Henry Onyx Marketplace"),
      description:
        t("ख़रीदार और विक्रेता जो सवाल सबसे ज़्यादा पूछते हैं, उन्हें देखें। ज़रूरत की जानकारी न मिले, तो सपोर्ट टिकट खोलें — टीम का कोई व्यक्ति उसे पढ़ेगा।"),
    },
    hero: {
      kicker: t("मदद केंद्र"),
      title: t("सेकंडों में जवाब पाएँ — या किसी व्यक्ति से बात करें।"),
    },
    stillNeedHelp: {
      kicker: t("अब भी मदद चाहिए"),
      title: t("टिकट खोलें — कोई व्यक्ति उसे पढ़ेगा।"),
      ctaLabel: t("सपोर्ट टिकट खोलें"),
    },
  },
  trust: {
    metadata: {
      title: t("ट्रस्ट और सुरक्षा — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("ट्रस्ट और सुरक्षा"),
      title: t("चेकआउट से पहले दिखती है। उसके बाद लागू होती है।"),
    },
  },
  sell: {
    hero: {
      kicker: t("Henry Onyx पर बेचें"),
      title: t("मूल रूप से चयनात्मक। उन विक्रेताओं के लिए जो भरोसे की अगुवाई करते हैं।"),
      primaryCta: t("विक्रेता आवेदन खोलें"),
      secondaryCta: t("विक्रेता मूल्य देखें"),
      signInCta: t("Henry Onyx अकाउंट से साइन इन करें"),
      highlights: [
        { label: t("चयन"), value: t("मैनुअल समीक्षा, पेड-लिस्टिंग नहीं") },
        { label: t("स्टोरफ्रंट"), value: t("ख़रीदारों को दिखता ट्रस्ट पासपोर्ट") },
        { label: t("वर्कस्पेस"), value: t("ऑर्डर, पेआउट, सपोर्ट एक साथ") },
      ],
    },
    onboarding: {
      kicker: t("ऑनबोर्डिंग कैसे होती है"),
      stepLabel: t("चरण"),
    },
    plans: {
      kicker: t("प्लान का अर्थशास्त्र"),
      title: t("स्तर पहले ही बताए जाते हैं, पब्लिश के बाद नहीं।"),
      feeLabel: t("शुल्क"),
      payoutLabel: t("पेआउट"),
      includedLabel: t("शामिल"),
      includedSuffix: t("लिस्टिंग"),
      featuredLabel: t("फ़ीचर्ड"),
      featuredCurrencyPrefix: "NGN",
    },
    closing: {
      kicker: t("आगे बढ़ें"),
      primaryCta: t("आवेदन शुरू करें"),
      secondaryCta: t("वेंडर वर्कस्पेस देखें"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("विक्रेता कीमत — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("विक्रेता कीमत"),
      primaryCta: t("विक्रेता के रूप में आवेदन"),
      secondaryCta: t("विक्रेता ओवरव्यू पर वापस"),
      statsLabels: {
        planTiers: t("प्लान टियर"),
        trustTiers: t("ट्रस्ट टियर"),
        featuredSlots: t("फ़ीचर्ड स्लॉट"),
      },
      featuredSlotsValue: t("अलग-अलग समीक्षा"),
    },
    plans: {
      kicker: t("प्लान एक नज़र में"),
      feeLabel: t("शुल्क"),
      payoutLabel: t("पेआउट"),
      includedLabel: t("शामिल"),
      includedSuffix: t("लिस्टिंग"),
      extraListingLabel: t("अतिरिक्त लिस्टिंग"),
      featuredSlotLabel: t("फ़ीचर्ड स्लॉट"),
      currencyPrefix: "NGN",
      ctaPartner: t("पार्टनर शर्तों के लिए संपर्क करें"),
      ctaTemplate: t("{plan} से शुरू करें"),
    },
    closing: {
      kicker: t("आवेदन के लिए तैयार?"),
      title: t("आवेदन आपके Henry Onyx अकाउंट में खुलेगा।"),
      primaryCta: t("विक्रेता के रूप में आवेदन"),
      secondaryCta: t("ट्रस्ट मानक"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Henry Onyx मार्केटप्लेस"),
    },
    hero: {
      primaryCta: t("पूरी सर्च खोलें"),
      secondaryCta: t("ट्रस्ट मानक"),
    },
    sidebar: {
      itemsLabel: t("कलेक्शन में आइटम"),
      buyerProtectionLabel: t("बायर सुरक्षा"),
    },
    rail: {
      itemsSuffix: t("आइटम"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Henry Onyx मार्केटप्लेस"),
      descriptionTemplate:
        t("Henry Onyx मार्केटप्लेस पर {policy} — सर्वर पर लॉग की गई एनफोर्समेंट, एस्क्रो पेमेंट कंट्रोल और चेकआउट से पहले दिखता ट्रस्ट रुख।"),
      fallbackTitle: t("मार्केटप्लेस नीति — Henry Onyx मार्केटप्लेस"),
      fallbackDescription:
        t("Henry Onyx मार्केटप्लेस की एक नीति — सर्वर पर लॉग की गई एनफोर्समेंट, एस्क्रो पेमेंट कंट्रोल और चेकआउट से पहले दिखता ट्रस्ट रुख।"),
    },
    hero: {
      backToTrust: t("ट्रस्ट मानकों पर लौटें"),
      openSupport: t("सपोर्ट थ्रेड खोलें"),
    },
    details: {
      coverageLabel: t("कवरेज"),
      updatedLabel: t("अपडेट"),
    },
    coverageBySlug: {
      buyerProtection: t("बायर्स"),
      sellerPolicy: t("सेलर्स"),
      fallback: t("मार्केटप्लेस के प्रतिभागी"),
    },
    updatedBySlug: {
      buyerProtection: t("पेमेंट और विवाद रिविज़न पर"),
      sellerPolicy: t("सेलर मानकों के रिविज़न पर"),
      fallback: t("नीति रिविज़न पर"),
    },
    provisions: {
      kicker: t("नीति प्रावधान"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
    },
    fulfillment: {
      availabilityLabel: t("उपलब्धता"),
      availabilityValueSingular: t("वर्तमान स्टॉक में {count} यूनिट"),
      availabilityValuePlural: t("वर्तमान स्टॉक में {count} यूनिट"),
      paymentLabel: t("भुगतान"),
    },
    price: {
      label: t("क़ीमत"),
      leadTimeLabel: t("लीड टाइम"),
    },
    detail: {
      deliverySummaryTitle: t("डिलीवरी, सपोर्ट और ऑर्डर के बाद की देखभाल"),
      deliveryTail:
        t("ऑर्डर पेमेंट से लेकर डिलीवरी तक ट्रेसेबल रहते हैं, और कोई भी विवाद या सपोर्ट थ्रेड उसी ऑर्डर रिकॉर्ड से जुड़ा रहता है।"),
      visitVendorTemplate: t("{vendor} पर जाएँ"),
      exploreCategoryTemplate: t("{category} एक्सप्लोर करें"),
      seeBrandTemplate: t("{brand} देखें"),
    },
    reviews: {
      kicker: t("रिव्यू हाइलाइट्स"),
      title: t("सत्यापित ख़रीद-सिग्नल, बेमतलब का शोर नहीं।"),
      reviewLabel: t("रिव्यू"),
    },
    rail: {
      kicker: t("ग्राहकों ने यह भी ख़रीदा"),
      ctaLabel: t("सर्च खोलें"),
    },
  },
};
}

function buildIG(locale: AppLocale): DeepPartial<MarketplacePublicCopy> {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  cart: {
    pageIntro: {
      kicker: t("Nkata"),
    },
    emptyState: {
      title: t("Nkata gị ka tọgbọrọ chakoo."),
      ctaLabel: t("Lelee ngwa ahịa"),
    },
  },
  track: {
    metadata: {
      title: t("Nsochi iwu — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Nsochi iwu"),
      titlePrefix: t("Nsochi"),
      orderValueLabel: t("Uru iwu"),
      paymentLabel: t("Ịkwụ ụgwọ"),
      payoutControlLabel: t("Njikwa nkwụghachi ụgwọ"),
      payoutFrozen: t("E kwụsịrị"),
      payoutEscrowActive: t("Escrow na-arụ ọrụ"),
    },
    paymentRecord: {
      kicker: t("Ndekọ ịkwụ ụgwọ"),
      walletBody: t("E sitere n'akpa ego wepụ ego, iwu nọkwa n'escrow ruo mgbe nnyefe gachara."),
      proofBody: t("Your transfer proof is attached and under review."),
      awaitingBody: t("This payment is waiting for your transfer to be confirmed, or for delivery to be completed."),
      methodLabel: t("Ụzọ"),
      statusLabel: t("Ọnọdụ"),
      proofLabel: t("Akaebe"),
      viewProof: t("Lelee akaebe"),
      walletDebit: t("Mwepụ akpa ego"),
      pending: t("Na-echere"),
    },
    segments: {
      fulfillmentLabel: t("Mbufe"),
      trackingLabel: t("Nsochi"),
      payoutLabel: t("Nkwụghachi ụgwọ"),
      trackingPending: t("Na-echere"),
    },
    completion: {
      kicker: t("Nkwado nke ngwụcha"),
      body: t("Kwado mgwụcha mgbe iwu ahụ dị mma. Henry Onyx na-ahapụ nkwụghachi ụgwọ onye na-ere ahịa naanị mgbe a kwadoro nnyefe ma ọ bụ mgbe iwu ahụ ruru ihe ọkpụkpụ na-ahapụ onwe ya."),
      confirmCta: t("Kwado ngwụcha"),
    },
    help: {
      kicker: t("Ịchọrọ enyemaka?"),
      openSupportCta: t("Mepee eriri nkwado"),
      viewAllOrdersCta: t("Lelee iwu niile"),
    },
  },
  deals: {
    discountBadgePrefix: "−",
  },
  brand: {
    eyebrow: t("Akaraaka ahịa"),
    searchCta: t("Chọọ n'ime akaraaka ahịa a"),
    trustCta: t("Ọkwa ntụkwasị obi"),
    stats: {
      activeProducts: t("Ngwa ahịa na-arụ ọrụ"),
      buyerProtection: t("Nchekwa onye na-azụ ahịa"),
    },
    liveKicker: t("Ọkụ ọkụ site na {brand}"),
    openFullSearch: t("Mepee nchọta zuru oke"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    stats: {
      trustScore: t("Akara ntụkwasị obi"),
      followers: t("Ndị na-eso"),
    },
    standards: {
      eyebrow: t("Ọkwa ụlọ ahịa"),
    },
    support: {
      eyebrow: t("Nkwado"),
      ctaLabel: t("Kpọtụrụ ụlọ ahịa a"),
      subjectTemplate: t("Ajụjụ maka {store}"),
    },
    reviews: {
      eyebrow: t("Nyocha ọhụrụ"),
      review: t("Nyocha"),
    },
    catalog: {
      exploreLink: t("Chọpụta ọzọ edemede enyochara"),
      emptyTitle: t("Enwebeghị edemede dị ndụ"),
      emptyBody: t("Ngwa ahịa akwadoro nke ụlọ ahịa a ga-apụta ebe a ozugbo ha bidoro ịrụ ọrụ."),
    },
  },
  category: {
    hero: {
      kicker: t("Nhọrọ ụdị"),
      searchCta: t("Chọọ n'ime ụdị a"),
      trustCta: t("Lelee ụkpụrụ ntụkwasị obi"),
      quickFiltersLabel: t("Nzacha ngwa ngwa"),
    },
    stats: {
      activeListingsLabel: t("Ndepụta na-arụ ọrụ"),
    },
    catalog: {
      openSearch: t("Mepee ọchụchọ zuru ezu"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
    },
  },
  trust: {
    metadata: {
      title: t("Ntụkwasị obi & nchekwa — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Ntụkwasị obi & nchekwa"),
      title: t("Pụta ìhè tupu ịkwụ ụgwọ. Manye ya mgbe ọ gachara."),
    },
  },
  help: {
    metadata: {
      title: t("Ebe enyemaka — Henry Onyx Marketplace"),
      description:
        t("Lelee ajụjụ ndị ndị na-azụ ahịa na ndị na-ere ahịa na-ajụkarị. Ọ bụrụ na ị chọtaghị ihe ị chọrọ, mepee tiketi nkwado — mmadụ n'ime otu ga-agụ ya."),
    },
    hero: {
      kicker: t("Ebe enyemaka"),
      title: t("Chọta azịza n'ime sekọnd ole na ole — ma ọ bụ kparịta okwu na mmadụ."),
    },
    stillNeedHelp: {
      kicker: t("Ka chọrọ enyemaka"),
      title: t("Mepee tiketi nkwado — mmadụ ga-agụ ya."),
      ctaLabel: t("Mepee tiketi nkwado"),
    },
  },
  sell: {
    hero: {
      kicker: t("Ree ahịa na Henry Onyx"),
      title: t("Nhọrọ site na atụmatụ. E meere ya maka ndị na-ere ahịa nke na-eduga na ntụkwasị obi."),
      primaryCta: t("Mepee akwụkwọ ire ahịa"),
      secondaryCta: t("Lee ego ndị na-ere ahịa"),
      signInCta: t("Banye site na akaụntụ Henry Onyx"),
      highlights: [
        { label: t("Nhọrọ"), value: t("Nyocha aka, ọ bụghị ịkwụ ụgwọ idepụta") },
        { label: t("Ụlọ ahịa"), value: t("Paspọtụ ntụkwasị obi ka ndị na-azụ ahịa hụ") },
        { label: t("Ebe ọrụ"), value: t("Iwu ahịa, ịkwụ ụgwọ na nkwado n'otu ebe") },
      ],
    },
    onboarding: {
      kicker: t("Otu mmalite si arụ ọrụ"),
      stepLabel: t("Nzọụkwụ"),
    },
    plans: {
      kicker: t("Akụnụba atụmatụ"),
      title: t("Ọkwa na-egosi tupu, ọ bụghị mgbe ibipụta gachara."),
      feeLabel: t("Ụgwọ"),
      payoutLabel: t("Nkwụnye ego"),
      includedLabel: t("Etinyere"),
      includedSuffix: t("ndepụta"),
      featuredLabel: t("Edobere"),
      featuredCurrencyPrefix: "NGN",
    },
    closing: {
      kicker: t("Gaa n'ihu"),
      primaryCta: t("Bido akwụkwọ"),
      secondaryCta: t("Gaa n'ebe ọrụ ndị na-ere ahịa"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Ọnụahịa onye na-ere ahịa — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Ọnụahịa onye na-ere ahịa"),
      primaryCta: t("Tinye akwụkwọ dị ka onye na-ere"),
      secondaryCta: t("Laghachi na nlele onye na-ere"),
      statsLabels: {
        planTiers: t("Ọkwa atụmatụ"),
        trustTiers: t("Ọkwa ntụkwasị obi"),
        featuredSlots: t("Oghere edobere"),
      },
      featuredSlotsValue: t("A na-elele otu otu"),
    },
    plans: {
      kicker: t("Atụmatụ na nlele ngwa ngwa"),
      feeLabel: t("Ụgwọ"),
      payoutLabel: t("Nkwụ ụgwọ"),
      includedLabel: t("Tinyere"),
      includedSuffix: t("ihe edepụtara"),
      extraListingLabel: t("Idepụta agbakwunyere"),
      featuredSlotLabel: t("Oghere edobere"),
      currencyPrefix: "NGN",
      ctaPartner: t("Kpọtụrụ maka usoro mmekọ"),
      ctaTemplate: t("Jiri {plan} bido"),
    },
    closing: {
      kicker: t("Ị dị njikere ịtinye akwụkwọ?"),
      title: t("Akwụkwọ a na-emepe n'akaụntụ Henry Onyx gị."),
      primaryCta: t("Tinye akwụkwọ dị ka onye na-ere"),
      secondaryCta: t("Ụkpụrụ ntụkwasị obi"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Ahịa Henry Onyx"),
    },
    hero: {
      primaryCta: t("Mepee nchọcha zuru oke"),
      secondaryCta: t("Ụkpụrụ ntụkwasị obi"),
    },
    sidebar: {
      itemsLabel: t("Ihe dị na nchịkọta"),
      buyerProtectionLabel: t("Nchekwa onye azụ ahịa"),
    },
    rail: {
      itemsSuffix: t("ihe"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Ahịa Henry Onyx"),
      descriptionTemplate:
        t("{policy} n'elu Ahịa Henry Onyx — nzụlite e dekọtara na sava, njikwa ego nke akwụ́ ụgwọ, na ọnọdụ ntụkwasị obi pụta ìhè tupu ịkwụ ụgwọ."),
      fallbackTitle: t("Iwu ahịa — Ahịa Henry Onyx"),
      fallbackDescription:
        t("Otu iwu Ahịa Henry Onyx — nzụlite e dekọtara na sava, njikwa ego nke akwụ́ ụgwọ, na ọnọdụ ntụkwasị obi pụta ìhè tupu ịkwụ ụgwọ."),
    },
    hero: {
      backToTrust: t("Laghachi n'ụkpụrụ ntụkwasị obi"),
      openSupport: t("Mepee mkparịta ụka nkwado"),
    },
    details: {
      coverageLabel: t("Nchekwa"),
      updatedLabel: t("Emelitere"),
    },
    coverageBySlug: {
      buyerProtection: t("Ndị na-azụ ahịa"),
      sellerPolicy: t("Ndị na-ere ahịa"),
      fallback: t("Ndị sonye na ahịa"),
    },
    updatedBySlug: {
      buyerProtection: t("Mgbe mgbanwe a na-eme n'ụgwọ na esemokwu"),
      sellerPolicy: t("Mgbe mgbanwe a na-eme n'ụkpụrụ ndị na-ere"),
      fallback: t("Mgbe mgbanwe a na-eme n'iwu"),
    },
    provisions: {
      kicker: t("Akwụkwọ iwu"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
    },
    fulfillment: {
      availabilityLabel: t("Ọnụnọ"),
      availabilityValueSingular: t("{count} otu n'ụlọ ahịa ugbu a"),
      availabilityValuePlural: t("{count} ihe n'ụlọ ahịa ugbu a"),
      paymentLabel: t("Ịkwụ ụgwọ"),
    },
    price: {
      label: t("Ọnụ ahịa"),
      leadTimeLabel: t("Oge nnyefe"),
    },
    detail: {
      deliverySummaryTitle: t("Nbufe, nkwado na nlekọta nke ọrụ gachara"),
      deliveryTail:
        t("Iwu ahịa na-anọgide na-eso ụzọ site n'ịkwụ ụgwọ ruo nnyefe, ndọrọ ndọrọ ma ọ bụ akwara nkwado nile na-ejide ndekọ otu iwu ahịa ahụ."),
      visitVendorTemplate: t("Gaa {vendor}"),
      exploreCategoryTemplate: t("Nyochaa {category}"),
      seeBrandTemplate: t("Hụ {brand}"),
    },
    reviews: {
      kicker: t("Ihe pụtara ìhè na nyocha"),
      title: t("Akara ịzụ ahịa anwapụtara, ọ bụghị mkpọtụ efu."),
      reviewLabel: t("Nyocha"),
    },
    rail: {
      kicker: t("Ndị ahịa zụtakwara"),
      ctaLabel: t("Mepee nchọta"),
    },
  },
};
}

function buildYO(locale: AppLocale): DeepPartial<MarketplacePublicCopy> {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  cart: {
    pageIntro: {
      kicker: t("Apo Ìrajà"),
    },
    emptyState: {
      title: t("Apo ìrajà rẹ ṣì ṣófo."),
      ctaLabel: t("Ṣàwárí àwọn ọjà"),
    },
  },
  track: {
    metadata: {
      title: t("Ìtọpinpin àṣẹ — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Ìtọpinpin àṣẹ"),
      titlePrefix: t("Ìtọpinpin"),
      orderValueLabel: t("Iye àṣẹ"),
      paymentLabel: t("Ìsanwó"),
      payoutControlLabel: t("Ìṣàkóso ìsanpadà"),
      payoutFrozen: t("Ó dúró"),
      payoutEscrowActive: t("Escrow ń ṣiṣẹ́"),
    },
    paymentRecord: {
      kicker: t("Àkọsílẹ̀ ìsanwó"),
      walletBody: t("A ti yọ owó kúrò nínú àpamọ́wọ́, àṣẹ náà sì wà nínú escrow títí ìfijiṣẹ́ yóò fi parí."),
      proofBody: t("Your transfer proof is attached and under review."),
      awaitingBody: t("This payment is waiting for your transfer to be confirmed, or for delivery to be completed."),
      methodLabel: t("Ọ̀nà"),
      statusLabel: t("Ipò"),
      proofLabel: t("Ẹ̀rí"),
      viewProof: t("Wo ẹ̀rí"),
      walletDebit: t("Yíyọ owó nínú àpamọ́wọ́"),
      pending: t("Ó ń dúró"),
    },
    segments: {
      fulfillmentLabel: t("Ìfijiṣẹ́"),
      trackingLabel: t("Ìtọpinpin"),
      payoutLabel: t("Ìsanpadà"),
      trackingPending: t("Ó ń dúró"),
    },
    completion: {
      kicker: t("Ìfìdí ìparí múlẹ̀"),
      body: t("Fìdí ìparí múlẹ̀ nígbà tí àṣẹ náà bá tẹ́ ọ lọ́rùn. Henry Onyx kì í tu ìsanpadà fún olùtà sílẹ̀ àfi lẹ́yìn tí a bá ti fìdí ìfijiṣẹ́ múlẹ̀ tàbí tí àṣẹ náà bá yẹ fún ìtusílẹ̀ alátọwọ́dá-fúnra-rẹ̀."),
      confirmCta: t("Fìdí ìparí múlẹ̀"),
    },
    help: {
      kicker: t("Ṣé o nílò ìrànlọ́wọ́?"),
      openSupportCta: t("Ṣí eriri àtìlẹyìn"),
      viewAllOrdersCta: t("Wo gbogbo àṣẹ"),
    },
  },
  deals: {
    discountBadgePrefix: "−",
  },
  brand: {
    eyebrow: t("Àmì-ọjà"),
    searchCta: t("Ṣe ìwákiri nínú àmì-ọjà yìí"),
    trustCta: t("Ìlànà ìgbẹ́kẹ̀lé"),
    stats: {
      activeProducts: t("Àwọn ọjà tó ń ṣiṣẹ́"),
      buyerProtection: t("Ààbò Olùra"),
    },
    liveKicker: t("Tààrà láti {brand}"),
    openFullSearch: t("Ṣí ìwákiri kíkún"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    stats: {
      trustScore: t("Ìkà ìgbẹ́kẹ̀lé"),
      followers: t("Àwọn olùtẹ̀lé"),
    },
    standards: {
      eyebrow: t("Ìlànà ilé-ìtajà"),
    },
    support: {
      eyebrow: t("Ìrànlọ́wọ́"),
      ctaLabel: t("Bá ilé-ìtajà yìí sọ̀rọ̀"),
      subjectTemplate: t("Ìbéèrè fún {store}"),
    },
    reviews: {
      eyebrow: t("Àwọn àbẹ̀wò tuntun"),
      review: t("Àbẹ̀wò"),
    },
    catalog: {
      exploreLink: t("Ṣàwárí àwọn ìpolówó tí a ti fọwọ́sí sí i"),
      emptyTitle: t("Kò sí ìpolówó tó wà lórí ètò ní àkókò yìí"),
      emptyBody: t("Àwọn ọjà tí a ti fọwọ́sí láti ilé-ìtajà yìí yóò fara hàn níbí níwájú bí wọ́n bá ti wà lórí ètò."),
    },
  },
  category: {
    hero: {
      kicker: t("Àyẹsí ẹka"),
      searchCta: t("Ṣàwárí nínú ẹka yìí"),
      trustCta: t("Wo àwọn ọgbọ́n ìgbẹ́kẹ̀lé"),
      quickFiltersLabel: t("Àyọkà yára"),
    },
    stats: {
      activeListingsLabel: t("Àkójọ tó wà lẹ́yìn iṣẹ́"),
    },
    catalog: {
      openSearch: t("Ṣí àwárí kíkún"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
    },
  },
  trust: {
    metadata: {
      title: t("Ìgbẹ́kẹ̀lé àti ààbò — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Ìgbẹ́kẹ̀lé àti ààbò"),
      title: t("Ó hàn ṣáájú ìsanwó. A ó sì gbé e ṣiṣẹ́ lẹ́yìn náà."),
    },
  },
  help: {
    metadata: {
      title: t("Ibùdó ìrànlọ́wọ́ — Henry Onyx Marketplace"),
      description:
        t("Ṣàwárí àwọn ìbéèrè tí àwọn olùra àti àwọn olùtà sábà máa ń bi. Tí o kò bá rí ohun tí o nílò, ṣí ìwé ìbéèrè ìrànlọ́wọ́, ẹnìkan láti inú ẹgbẹ́ yóò kà á."),
    },
    hero: {
      kicker: t("Ibùdó ìrànlọ́wọ́"),
      title: t("Ríbi ìdáhùn ní ìsẹ̀jú àáyá díẹ̀ — tàbí sọ̀rọ̀ pẹ̀lú ènìyàn."),
    },
    stillNeedHelp: {
      kicker: t("Ṣì nílò ìrànlọ́wọ́"),
      title: t("Ṣí ìwé ìbéèrè ìrànlọ́wọ́, ènìyàn yóò kà á."),
      ctaLabel: t("Ṣí ìwé ìbéèrè ìrànlọ́wọ́"),
    },
  },
  sell: {
    hero: {
      kicker: t("Tàjà lórí Henry Onyx"),
      title: t("Ó yàn nínú ìṣètò. A ṣe é fún àwọn olùtà tí ó ń darí ìgbẹ́kẹ̀lé."),
      primaryCta: t("Ṣí ìwé ìfiránṣẹ́ olùtà"),
      secondaryCta: t("Wo iye olùtà"),
      signInCta: t("Forúkọsílẹ̀ pẹ̀lú àkántì Henry Onyx"),
      highlights: [
        { label: t("Ìyàn"), value: t("Àyẹ̀wò ọwọ́, kì í ṣe ìsanwó láti darapọ̀") },
        { label: t("Ilé-ìtajà"), value: t("Ìwé-ìrìnnà ìgbẹ́kẹ̀lé tí ó hàn fún olùra") },
        { label: t("Àyè iṣẹ́"), value: t("Àṣẹ, ìsanwó, ìrànlọ́wọ́ nínú ibìkan") },
      ],
    },
    onboarding: {
      kicker: t("Bí ìbẹ̀rẹ̀ ṣe ń lọ"),
      stepLabel: t("Ìgbésẹ̀"),
    },
    plans: {
      kicker: t("Èrò ọrọ̀-ajé àwọn ètò"),
      title: t("A sọ ìpele ní àkọ́kọ́, kì í ṣe lẹ́yìn ìpolówó."),
      feeLabel: t("Owó"),
      payoutLabel: t("Ìsanwó"),
      includedLabel: t("Tí ó wà nínú"),
      includedSuffix: t("ìpolówó"),
      featuredLabel: t("Ìfihàn"),
      featuredCurrencyPrefix: "NGN",
    },
    closing: {
      kicker: t("Tẹ̀síwájú"),
      primaryCta: t("Bẹ̀rẹ̀ ìfiránṣẹ́"),
      secondaryCta: t("Bẹ̀ àyè olùtà wò"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Iye olùtà — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Iye olùtà"),
      primaryCta: t("Forúkọsílẹ̀ gẹ́gẹ́ bí olùtà"),
      secondaryCta: t("Pa dà sí àkójọ olùtà"),
      statsLabels: {
        planTiers: t("Ipele ètò"),
        trustTiers: t("Ipele ìgbẹ́kẹ̀lé"),
        featuredSlots: t("Àyè àkànṣe"),
      },
      featuredSlotsValue: t("A ṣàyẹ̀wò ní ọ̀kọ̀ọ̀kan"),
    },
    plans: {
      kicker: t("Ètò ní ojú ẹyọ kan"),
      feeLabel: t("Owó"),
      payoutLabel: t("Ìsanwó"),
      includedLabel: t("Tó wà"),
      includedSuffix: t("ìpolówó"),
      extraListingLabel: t("Ìpolówó àfikún"),
      featuredSlotLabel: t("Àyè àkànṣe"),
      currencyPrefix: "NGN",
      ctaPartner: t("Bá wa sọ̀rọ̀ fún àdéhùn alábàápín"),
      ctaTemplate: t("Bẹ̀rẹ̀ pẹ̀lú {plan}"),
    },
    closing: {
      kicker: t("Ṣé o ti ṣetán láti fọ̀wọ́sí?"),
      title: t("Ìfiránṣẹ́ máa ṣí nínú àkántì Henry Onyx rẹ."),
      primaryCta: t("Forúkọsílẹ̀ gẹ́gẹ́ bí olùtà"),
      secondaryCta: t("Ìlànà ìgbẹ́kẹ̀lé"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Ọjà Henry Onyx"),
    },
    hero: {
      primaryCta: t("Ṣí ìwákírí kíkún"),
      secondaryCta: t("Àwọn ìlànà ìgbẹ́kẹ̀lé"),
    },
    sidebar: {
      itemsLabel: t("Àwọn nǹkan nínú àkójọpọ̀"),
      buyerProtectionLabel: t("Ààbò olùrà"),
    },
    rail: {
      itemsSuffix: t("nǹkan"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Ọjà Henry Onyx"),
      descriptionTemplate:
        t("{policy} lórí Ọjà Henry Onyx — ìmúse tí a kọ sílẹ̀ lórí olùsìn, ìṣàkóso owó nínú àbò, àti ìdúró ìgbẹ́kẹ̀lé tí ó hàn ṣáájú ìsanwó."),
      fallbackTitle: t("Ìlànà ọjà — Ọjà Henry Onyx"),
      fallbackDescription:
        t("Ìlànà kan ti Ọjà Henry Onyx — ìmúse tí a kọ sílẹ̀ lórí olùsìn, ìṣàkóso owó nínú àbò, àti ìdúró ìgbẹ́kẹ̀lé tí ó hàn ṣáájú ìsanwó."),
    },
    hero: {
      backToTrust: t("Padà sí àwọn ìlànà ìgbẹ́kẹ̀lé"),
      openSupport: t("Ṣí ìbáraẹnisọ̀rọ̀ ìrànlọ́wọ́"),
    },
    details: {
      coverageLabel: t("Àgbègbè ààbò"),
      updatedLabel: t("Ìmúdójúìwọ̀n"),
    },
    coverageBySlug: {
      buyerProtection: t("Àwọn olùrà"),
      sellerPolicy: t("Àwọn olùtà"),
      fallback: t("Àwọn alábàápín ọjà"),
    },
    updatedBySlug: {
      buyerProtection: t("Lójú ìṣàtúnṣe ìsanwó àti àríyànjiyàn"),
      sellerPolicy: t("Lójú ìṣàtúnṣe àwọn ìlànà olùtà"),
      fallback: t("Lójú ìṣàtúnṣe ìlànà"),
    },
    provisions: {
      kicker: t("Àwọn àbáwí ìlànà"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
    },
    fulfillment: {
      availabilityLabel: t("Ìwà-ńlàá"),
      availabilityValueSingular: t("{count} pisi nínú ọjà tó wà báyìí"),
      availabilityValuePlural: t("{count} pisi nínú ọjà tó wà báyìí"),
      paymentLabel: t("Ìsanwó"),
    },
    price: {
      label: t("Iye owó"),
      leadTimeLabel: t("Àkókò ìjíṣẹ́"),
    },
    detail: {
      deliverySummaryTitle: t("Ìfijíṣẹ́, àtìlẹ́yìn, àti ìtọ́jú lẹ́yìn àṣẹ rírà"),
      deliveryTail:
        t("Àwọn àṣẹ rírà máa ń wà ní orí ọwọ́ láti ìsanwó dé ìjíṣẹ́, àti àwọn àríyànjiyàn tàbí ọ̀rọ̀ àtìlẹ́yìn ń so mọ́ àkọsílẹ̀ àṣẹ rírà kan náà."),
      visitVendorTemplate: t("Lọ sí {vendor}"),
      exploreCategoryTemplate: t("Ṣàwárí {category}"),
      seeBrandTemplate: t("Wo {brand}"),
    },
    reviews: {
      kicker: t("Àwọn àfojúsùn àyẹ̀wò"),
      title: t("Àmì rírà tó wúlò, kì í ṣe ariwo lásán."),
      reviewLabel: t("Àyẹ̀wò"),
    },
    rail: {
      kicker: t("Àwọn alábaramẹ́nu náà rà"),
      ctaLabel: t("Ṣí ìṣàwárí"),
    },
  },
};
}

function buildHA(locale: AppLocale): DeepPartial<MarketplacePublicCopy> {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  store: {
    metadataTitle: t("{store} — Kasuwar Henry Onyx"),
    stats: {
      trustScore: t("Maki na amincewa"),
      followers: t("Masu bibiya"),
    },
    standards: {
      eyebrow: t("Ƙa'idodin kanti"),
    },
    support: {
      eyebrow: t("Tallafi"),
      ctaLabel: t("Tuntuɓi wannan kanti"),
      subjectTemplate: t("Tambaya ga {store}"),
    },
    reviews: {
      eyebrow: t("Sabbin sharhi"),
      review: t("Sharhi"),
    },
    catalog: {
      exploreLink: t("Bincika ƙarin jeren da aka tantance"),
      emptyTitle: t("Babu jeren da yake aiki yanzu"),
      emptyBody: t("Kayan da aka amince da su daga wannan kanti za su fito a nan da zaran sun shiga aiki."),
    },
  },
  cart: {
    pageIntro: {
      kicker: t("Kanti"),
    },
    emptyState: {
      title: t("Kanti ɗinka har yanzu fanko ne."),
      ctaLabel: t("Bincika kayayyaki"),
    },
  },
  track: {
    metadata: {
      title: t("Bin diddigin oda — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Bin diddigin oda"),
      titlePrefix: t("Bin diddigi"),
      orderValueLabel: t("Darajar oda"),
      paymentLabel: t("Biyan kuɗi"),
      payoutControlLabel: t("Sarrafa biyan mai sayarwa"),
      payoutFrozen: t("An daskare"),
      payoutEscrowActive: t("Escrow yana aiki"),
    },
    paymentRecord: {
      kicker: t("Bayanin biyan kuɗi"),
      walletBody: t("An cire kuɗi daga walat, kuma odar tana cikin escrow har sai an isar da kayan."),
      proofBody: t("Your transfer proof is attached and under review."),
      awaitingBody: t("This payment is waiting for your transfer to be confirmed, or for delivery to be completed."),
      methodLabel: t("Hanya"),
      statusLabel: t("Matsayi"),
      proofLabel: t("Hujja"),
      viewProof: t("Duba hujja"),
      walletDebit: t("Cirewa daga walat"),
      pending: t("Yana jira"),
    },
    segments: {
      fulfillmentLabel: t("Isarwa"),
      trackingLabel: t("Bin diddigi"),
      payoutLabel: t("Biyan mai sayarwa"),
      trackingPending: t("Yana jira"),
    },
    completion: {
      kicker: t("Tabbatar da kammala"),
      body: t("Tabbatar da kammalawa lokacin da oda ta ƙayatar. Henry Onyx na sakin biyan mai sayarwa ne kawai bayan an tabbatar da isarwa ko lokacin da odar ta cika ƙa'idodin sakin atomatik."),
      confirmCta: t("Tabbatar da kammala"),
    },
    help: {
      kicker: t("Kana buƙatar taimako?"),
      openSupportCta: t("Buɗe zaren tallafi"),
      viewAllOrdersCta: t("Duba dukkan odoji"),
    },
  },
  deals: {
    discountBadgePrefix: "−",
  },
  category: {
    hero: {
      kicker: t("Zaɓin nau'i"),
      searchCta: t("Nemo a cikin wannan nau'in"),
      trustCta: t("Duba ƙa'idodin amintacce"),
      quickFiltersLabel: t("Tace cikin sauri"),
    },
    stats: {
      activeListingsLabel: t("Tallace-tallace masu aiki"),
    },
    catalog: {
      openSearch: t("Buɗe cikakken bincike"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
    },
  },
  trust: {
    metadata: {
      title: t("Aminci da tsaro — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Aminci da tsaro"),
      title: t("A bayyane kafin biya. A tabbatar bayan biya."),
    },
  },
  help: {
    metadata: {
      title: t("Cibiyar taimako — Henry Onyx Marketplace"),
      description:
        t("Karanta tambayoyin da masu siye da masu sayarwa suka fi yawan yi. Idan ba ka samu abin da kake nema ba, buɗe tikitin tallafi, wani daga ƙungiyar zai karanta shi."),
    },
    hero: {
      kicker: t("Cibiyar taimako"),
      title: t("Samu amsa cikin daƙiƙa kaɗan — ko yi magana da mutum."),
    },
    stillNeedHelp: {
      kicker: t("Har yanzu kana bukatar taimako"),
      title: t("Buɗe tikitin tallafi — mutum zai karanta shi."),
      ctaLabel: t("Buɗe tikitin tallafi"),
    },
  },
  sell: {
    hero: {
      kicker: t("Sayar a Henry Onyx"),
      title: t("Zaɓaɓɓa daga tushe. An gina ta don masu sayarwa da ke jagorancin amincewa."),
      primaryCta: t("Buɗe aikace-aikacen mai sayarwa"),
      secondaryCta: t("Duba farashin mai sayarwa"),
      signInCta: t("Shiga da asusun Henry Onyx"),
      highlights: [
        { label: t("Zaɓi"), value: t("Bita ta hannu, ba listing mai biyan kuɗi ba") },
        { label: t("Shago"), value: t("Fasfo ɗin amincewa wanda masu siye ke iya gani") },
        { label: t("Wurin aiki"), value: t("Odoji, biyan kuɗi da tallafi a wuri ɗaya") },
      ],
    },
    onboarding: {
      kicker: t("Yadda fara aiki ke gudana"),
      stepLabel: t("Mataki"),
    },
    plans: {
      kicker: t("Tattalin arzikin tsare-tsare"),
      title: t("An faɗi matakai a gaba, ba bayan an buga ba."),
      feeLabel: t("Kuɗi"),
      payoutLabel: t("Biya"),
      includedLabel: t("An haɗa"),
      includedSuffix: t("tallace-tallace"),
      featuredLabel: t("Mai ƙayatarwa"),
      featuredCurrencyPrefix: "NGN",
    },
    closing: {
      kicker: t("Ci gaba"),
      primaryCta: t("Fara aikace-aikacen"),
      secondaryCta: t("Ziyarci wurin aiki na mai sayarwa"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Farashin mai sayarwa — Henry Onyx Marketplace"),
    },
    hero: {
      kicker: t("Farashin mai sayarwa"),
      primaryCta: t("Nemi a matsayin mai sayarwa"),
      secondaryCta: t("Koma ga taƙaitaccen mai sayarwa"),
      statsLabels: {
        planTiers: t("Matakan tsari"),
        trustTiers: t("Matakan amana"),
        featuredSlots: t("Wuraren musamman"),
      },
      featuredSlotsValue: t("Ana bita ɗaya-ɗaya"),
    },
    plans: {
      kicker: t("Tsare-tsare a kallon daya"),
      feeLabel: t("Kuɗi"),
      payoutLabel: t("Biya"),
      includedLabel: t("An haɗa"),
      includedSuffix: t("shigarwa"),
      extraListingLabel: t("Ƙarin shigarwa"),
      featuredSlotLabel: t("Wurin musamman"),
      currencyPrefix: "NGN",
      ctaPartner: t("Tuntube mu don sharuɗɗan abokin tarayya"),
      ctaTemplate: t("Fara da {plan}"),
    },
    closing: {
      kicker: t("Shirye don nema?"),
      title: t("Aikace-aikacen yana buɗewa a cikin asusun Henry Onyx naka."),
      primaryCta: t("Nemi a matsayin mai sayarwa"),
      secondaryCta: t("Matsayin amana"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Kasuwar Henry Onyx"),
    },
    hero: {
      primaryCta: t("Buɗe cikakken bincike"),
      secondaryCta: t("Matakan amincewa"),
    },
    sidebar: {
      itemsLabel: t("Abubuwa cikin tarin"),
      buyerProtectionLabel: t("Kariyar mai siye"),
    },
    rail: {
      itemsSuffix: t("abubuwa"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Kasuwar Henry Onyx"),
      descriptionTemplate:
        t("{policy} a Kasuwar Henry Onyx — aikatawa da aka rubuta a sabar, kula da kuɗi ta hannun amintacce, da matsayin amincewa da ake gani kafin biyan kuɗi."),
      fallbackTitle: t("Manufar kasuwa — Kasuwar Henry Onyx"),
      fallbackDescription:
        t("Wata manufa ta Kasuwar Henry Onyx — aikatawa da aka rubuta a sabar, kula da kuɗi ta hannun amintacce, da matsayin amincewa da ake gani kafin biyan kuɗi."),
    },
    hero: {
      backToTrust: t("Komawa zuwa matakan amincewa"),
      openSupport: t("Buɗe zauren tallafi"),
    },
    details: {
      coverageLabel: t("Yankin ɗauka"),
      updatedLabel: t("An sabunta"),
    },
    coverageBySlug: {
      buyerProtection: t("Masu siye"),
      sellerPolicy: t("Masu sayarwa"),
      fallback: t("Mahalarta kasuwa"),
    },
    updatedBySlug: {
      buyerProtection: t("Lokacin sabunta tsarin biya da gardama"),
      sellerPolicy: t("Lokacin sabunta matakan mai sayarwa"),
      fallback: t("Lokacin sabunta manufa"),
    },
    provisions: {
      kicker: t("Sharuɗɗan manufa"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
    },
    fulfillment: {
      availabilityLabel: t("Samuwa"),
      availabilityValueSingular: t("{count} naúrar a cikin tarin yanzu"),
      availabilityValuePlural: t("{count} naúrori a cikin tarin yanzu"),
      paymentLabel: t("Biyan kuɗi"),
    },
    price: {
      label: t("Farashi"),
      leadTimeLabel: t("Lokacin isarwa"),
    },
    detail: {
      deliverySummaryTitle: t("Isar, tallafi, da kulawa bayan oda"),
      deliveryTail:
        t("Odoji suna ci gaba da bibiya daga biya har zuwa isar da kaya, kuma jayayya ko zaren tallafi suna nan a haɗe da wannan tarihin odan."),
      visitVendorTemplate: t("Ziyarci {vendor}"),
      exploreCategoryTemplate: t("Bincika {category}"),
      seeBrandTemplate: t("Duba {brand}"),
    },
    reviews: {
      kicker: t("Manyan sharhi"),
      title: t("Alamun sayan da aka tabbatar, ba ƙarin surutu ba."),
      reviewLabel: t("Sharhi"),
    },
    rail: {
      kicker: t("Abokan ciniki sun kuma saya"),
      ctaLabel: t("Buɗe bincike"),
    },
  },
};
}

const LOCALE_BUILDERS: Partial<Record<AppLocale, (locale: AppLocale) => DeepPartial<MarketplacePublicCopy>>> = {
  fr: buildFR,
  es: buildES,
  pt: buildPT,
  de: buildDE,
  it: buildIT,
  ar: buildAR,
  zh: buildZH,
  hi: buildHI,
  ig: buildIG,
  yo: buildYO,
  ha: buildHA,
};

export function getMarketplacePublicCopy(locale: AppLocale): MarketplacePublicCopy {
  const base = buildEN(locale);
  if (locale === "en") return base;
  const builder = LOCALE_BUILDERS[locale];
  if (!builder) return base;
  return deepMergeMessages(base, builder(locale) as Partial<MarketplacePublicCopy>);
}

export function translateMarketplacePublicLabel(locale: AppLocale, label: string) {
  return translateSurfaceLabel(locale, label);
}
