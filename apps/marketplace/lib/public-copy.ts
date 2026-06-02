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
      body: string;
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
      kicker: string;
      title: string;
    };
    segments: {
      kicker: string;
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
      description: string;
    };
    sectionLabel: string;
    listEyebrow: string;
    refreshNote: string;
    discountBadgePrefix: string;
    emptyState: {
      title: string;
      body: string;
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
      kicker: string;
      title: string;
    };
    catalog: {
      kicker: string;
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
      listingsReviewed: string;
      listingsReviewedValue: string;
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
      responseSla: string;
      responseSlaSuffix: string;
      followers: string;
    };
    standards: {
      eyebrow: string;
    };
    support: {
      eyebrow: string;
      contactLinkLabel: string;
      contactBodySuffix: string;
      ctaLabel: string;
      subjectTemplate: string;
    };
    reviews: {
      eyebrow: string;
      verifiedPurchase: string;
      review: string;
    };
    catalog: {
      kicker: string;
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
    advantages: {
      kicker: string;
      items: Array<{ title: string; body: string }>;
    };
    onboarding: {
      kicker: string;
      stepLabel: string;
      steps: Array<{ step: string; title: string; body: string }>;
      callout: {
        eyebrow: string;
        body: string;
      };
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
    trustTiers: {
      kicker: string;
      title: string;
    };
    closing: {
      kicker: string;
      title: string;
      body: string;
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
      kicker: string;
      title: string;
      items: string[];
    };
    trustTiers: {
      kicker: string;
      title: string;
    };
    closing: {
      kicker: string;
      title: string;
      body: string;
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
      body: string;
    };
    stillNeedHelp: {
      kicker: string;
      title: string;
      body: string;
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
      body: string;
      pillars: Array<{ label: string; value: string }>;
    };
    guardrails: {
      kicker: string;
      items: Array<{ title: string; body: string }>;
    };
    sellerLadder: {
      kicker: string;
      title: string;
    };
    policySurfaces: {
      kicker: string;
      title: string;
    };
    ecosystem: {
      kicker: string;
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
      editedByLabel: string;
      editedByValue: string;
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
      enforcementLabel: string;
      updatedLabel: string;
    };
    coverageBySlug: {
      buyerProtection: string;
      sellerPolicy: string;
      fallback: string;
    };
    enforcementBySlug: {
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
    ecosystem: {
      kicker: string;
      openLabel: string;
    };
  };
  product: {
    metadata: {
      titleTemplate: string;
      descriptionTemplate: string;
      fallbackDescription: string;
    };
    fulfillment: {
      sellerTrustLabel: string;
      sellerTrustValueTemplate: string;
      sellerTrustValueFallback: string;
      availabilityLabel: string;
      availabilityValueSingular: string;
      availabilityValuePlural: string;
      fulfillmentLabel: string;
      paymentLabel: string;
      paymentValueCod: string;
      paymentValueVerified: string;
    };
    price: {
      label: string;
      leadTimeLabel: string;
    };
    safety: {
      kicker: string;
      stockTemplate: string;
      codEligible: string;
      codFallback: string;
      vendorLinkedTemplate: string;
      vendorPending: string;
      reviewsTemplateSingular: string;
      reviewsTemplatePlural: string;
    };
    detail: {
      kicker: string;
      title: string;
      deliverySummaryTitle: string;
      deliveryFallback: string;
      deliveryTail: string;
      specsTitle: string;
      passportTitle: string;
      visitVendorTemplate: string;
      exploreCategoryTemplate: string;
      seeBrandTemplate: string;
    };
    related: {
      kicker: string;
      title: string;
      body: string;
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
      caption: string;
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
      t("Henry Onyx Marketplace turns multi-vendor commerce into a calmer experience: cleaner discovery, quick-add from every card, split-order clarity, stronger seller passports, and a single HenryCo account for orders, payments, reviews, and support."),
    primaryCta: t("Explore the catalog"),
    secondaryCta: t("Sell on HenryCo"),
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
        body: t("Orders, payments, wishlist, follows, and notifications stay together in one HenryCo account."),
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
        body: t("When inventory comes from different vendors or HenryCo stock, delivery segmentation stays obvious instead of becoming checkout confusion."),
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
      t("Seller applications, moderation, and approvals are reviewed through dedicated HenryCo review lanes."),
      t("Order updates, reviews, support, and payments stay connected to the same buyer account."),
      t("Support, payment review, and delivery operations stay organized so responses remain consistent."),
    ],
    sellerKicker: t("Seller quality"),
    sellerTitle: t("Serious sellers start inside their HenryCo account."),
    sellerBody:
      t("Public visitors can learn about selling on /sell, while the application, draft progress, review updates, and approval status stay inside the seller account experience."),
    sellerBullets: [
      t("Draft saving and progress visibility"),
      t("Private document handling in the right place"),
      t("Clear approval updates for every seller"),
    ],
  },
  kpiLabels: {
    verifiedStores: t("Verified stores"),
    activeListings: t("Active listings"),
    trustRating: t("Trust rating"),
  },
  kpiHints: {
    verifiedStores: t("Curated sellers and HenryCo-owned inventory with clearer accountability."),
    activeListings: t("Approved listings surfaced with delivery, trust, and ownership clarity."),
    trustRating: t("Marketplace review quality and seller reliability are surfaced before checkout."),
  },
  footer: {
    brandSubtitle: t("Refined commerce with one connected HenryCo account"),
    brandBody: t("Henry Onyx Marketplace is built for high-trust buying, verified sellers, and a cleaner experience from checkout to delivery."),
    shopTitle: t("Shop"),
    sellTitle: t("Sell"),
    supportTitle: t("Support"),
    supportBody:
      t("Orders, seller conversations, support updates, and payment records stay connected in one HenryCo account."),
    shopLinks: [
      { href: "/search", label: t("Search the marketplace") },
      { href: "/deals", label: t("Deals and timed edits") },
      { href: "/trust", label: t("Trust passport") },
      { href: "/policies/buyer-protection", label: t("Buyer protection policy") },
      { href: "/help", label: t("Support and resolution") },
    ],
    sellLinks: [
      { href: "/sell", label: t("Why sell on HenryCo") },
      { href: "/sell/pricing", label: t("Seller pricing and fees") },
      { href: "/policies/seller-policy", label: t("Seller policy") },
      { href: "/account/seller-application", label: t("Seller application") },
      { href: "/vendor", label: t("Vendor workspace") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("HenryCo stocked"),
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
      title: t("A premium basket with faster edits and cleaner split-order clarity."),
      description:
        t("The cart now keeps vendor grouping visible, updates quantity quickly, and stays connected to the mini-cart drawer so buyers never lose context when they are close to checkout."),
    },
    emptyState: {
      title: t("Your cart is still empty."),
      body: t("Quick-add from product cards, save items for later, and the basket will stay updated in the mini-cart drawer and the full cart without a hard refresh."),
      ctaLabel: t("Browse products"),
    },
  },
  track: {
    metadata: {
      title: t("Order tracking — Henry Onyx Marketplace"),
      description:
        t("Track each vendor segment, payment update, and fulfillment milestone in one place. Escrow stays on until delivery confirms."),
    },
    hero: {
      kicker: t("Order tracking"),
      titlePrefix: t("Tracking"),
      body: t("Split-order clarity stays visible here: every vendor segment, payment update, and fulfillment milestone gets its own row so support and buyer expectations stay aligned."),
      orderValueLabel: t("Order value"),
      paymentLabel: t("Payment"),
      payoutControlLabel: t("Payout control"),
      payoutFrozen: t("Frozen"),
      payoutEscrowActive: t("Escrow active"),
    },
    paymentRecord: {
      kicker: t("Payment record"),
      walletBody: t("Wallet balance was debited and the order is held in escrow for fulfillment."),
      proofBody: t("Transfer proof is attached for HenryCo finance review."),
      awaitingBody: t("Payment is waiting for finance evidence or delivery reconciliation."),
      methodLabel: t("Method"),
      statusLabel: t("Status"),
      proofLabel: t("Proof"),
      viewProof: t("View proof"),
      walletDebit: t("Wallet debit"),
      pending: t("Pending"),
    },
    timeline: {
      kicker: t("Timeline"),
      title: t("Customer-visible milestones, in order."),
    },
    segments: {
      kicker: t("Vendor segments"),
      title: t("Each vendor stays accountable to its own dispatch."),
      henrycoSegment: t("HenryCo segment"),
      fulfillmentLabel: t("Fulfillment"),
      trackingLabel: t("Tracking"),
      payoutLabel: t("Payout"),
      trackingPending: t("Pending"),
    },
    completion: {
      kicker: t("Completion confirmation"),
      body: t("Confirm completion once the order is satisfactory. HenryCo only releases seller payout after delivery is confirmed or the order qualifies for auto-release."),
      confirmCta: t("Confirm completion"),
    },
    help: {
      kicker: t("Need help?"),
      title: t("Disputes, refunds, and delivery concerns route through one thread."),
      body: t("Open a support thread with this order number attached so the agent sees the full timeline and vendor split without you re-typing it."),
      openSupportCta: t("Open support thread"),
      viewAllOrdersCta: t("View all orders"),
    },
  },
  deals: {
    metadata: {
      title: t("Verified deals — Henry Onyx Marketplace"),
      description:
        t("Discounts filtered for trust, stock certainty, and seller accountability. Only verified listings with clean trust signals appear on the HenryCo deals page."),
    },
    pageIntro: {
      kicker: t("Verified Deals"),
      title: t("Discounts filtered for trust, stock certainty, and seller accountability."),
      description:
        t("Deals are only surfaced when the listing quality, seller trust passport, and stock status are clean enough to protect conversion and reduce buyer regret."),
    },
    sectionLabel: t("Verified deals"),
    listEyebrow: t("Verified deals"),
    refreshNote: t("Updated regularly"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("No verified deals right now"),
      body: t("Verified discounts roll in as sellers list them. Check back soon."),
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
      kicker: t("Curated rails"),
      title: t("Collections that shorten decision-making."),
    },
    catalog: {
      kicker: t("Category catalog"),
      title: t("Premium products, tighter hierarchy."),
      openSearch: t("Open full search"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Explore verified products in {category} on Henry Onyx Marketplace, with trust signals, delivery clarity, and seller passports surfaced before checkout."),
      fallbackDescription:
        t("Browse a curated category on Henry Onyx Marketplace with trust signals, delivery clarity, and seller passports surfaced before checkout."),
    },
  },
  brand: {
    eyebrow: t("Brand"),
    bodyFallback: t("A verified store on Henry Onyx Marketplace with trust signals, delivery clarity, and seller passport details surfaced before checkout."),
    searchCta: t("Search this brand"),
    trustCta: t("Trust standards"),
    stats: {
      activeProducts: t("Active products"),
      listingsReviewed: t("Listings reviewed"),
      listingsReviewedValue: t("Trust passport visible per item"),
      buyerProtection: t("Buyer protection"),
      buyerProtectionValue: t("Escrowed checkout"),
    },
    liveKicker: t("Live from {brand}"),
    openFullSearch: t("Open full search"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Explore verified products from {brand} on Henry Onyx Marketplace, with trust signals, delivery clarity, and seller passports surfaced before checkout."),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Browse verified products from {store} on Henry Onyx Marketplace, with trust signals, delivery clarity, and the seller passport surfaced before checkout."),
    metadataDescriptionFallback:
      t("A verified store on Henry Onyx Marketplace with trust signals, delivery clarity, and a seller passport surfaced before checkout."),
    hero: {
      eyebrow: t("Store passport"),
      bodyFallback:
        t("A verified seller on Henry Onyx Marketplace with trust signals, delivery clarity, and a transparent passport surfaced before every checkout."),
    },
    stats: {
      trustScore: t("Trust score"),
      responseSla: t("Response SLA"),
      responseSlaSuffix: t("h"),
      followers: t("Followers"),
    },
    standards: {
      eyebrow: t("Store standards"),
    },
    support: {
      eyebrow: t("Support"),
      contactLinkLabel: t("Use Henry Onyx Marketplace to contact this store"),
      contactBodySuffix:
        t(" — messages are logged and tied to your order reference so every update stays in one place."),
      ctaLabel: t("Contact this store"),
      subjectTemplate: t("Question for {store}"),
    },
    reviews: {
      eyebrow: t("Recent reviews"),
      verifiedPurchase: t("Verified purchase"),
      review: t("Review"),
    },
    catalog: {
      kicker: t("Store catalog"),
      title: t("Everything currently live from this store."),
      exploreLink: t("Explore more verified listings"),
      emptyTitle: t("No live listings just yet"),
      emptyBody: t("Approved products from this store will appear here as they go live."),
    },
  },
  sell: {
    metadata: {
      title: t("Sell on HenryCo — selective marketplace for trust-led sellers"),
      description:
        t("Apply to sell on Henry Onyx Marketplace: trust-led positioning, premium storefronts, and a unified workspace for orders, payouts, and support."),
    },
    hero: {
      kicker: t("Sell on HenryCo"),
      title: t("Selective by design. Built for sellers who lead on trust."),
      body: t("Henry Onyx Marketplace favours sellers who care about presentation, reliable fulfillment, and honest buyer protection. The bar is explicit on this page; the seller application continues inside your HenryCo account."),
      primaryCta: t("Open seller application"),
      secondaryCta: t("See seller pricing"),
      signInCta: t("Sign in with HenryCo account"),
      highlights: [
        { label: t("Selection"), value: t("Manual review, not pay-to-list") },
        { label: t("Storefront"), value: t("Trust passport visible to buyers") },
        { label: t("Workspace"), value: t("Orders, payouts, support unified") },
      ],
    },
    advantages: {
      kicker: t("Why stronger sellers win here"),
      items: [
        { title: t("Trust-led positioning"), body: t("Your store gets a visible trust passport instead of being buried in low-quality marketplace clutter.") },
        { title: t("Better storefront quality"), body: t("Editorial rails, calmer search, and cleaner product cards help quality stores convert faster.") },
        { title: t("Sharper operations"), body: t("Payouts, orders, support, moderation, and stock alerts stay visible in one cleaner workspace.") },
      ],
    },
    onboarding: {
      kicker: t("How onboarding works"),
      stepLabel: t("Step"),
      steps: [
        { step: "01", title: t("Start the seller application"), body: t("Open the application from inside your HenryCo account — drafts save automatically while you assemble details.") },
        { step: "02", title: t("Add business details"), body: t("Business name, store profile, product focus, and any verification documents that explain how you fulfil orders.") },
        { step: "03", title: t("Application review"), body: t("The HenryCo team reviews documents, trust signals, and store readiness — not just a paid badge.") },
        { step: "04", title: t("Vendor onboarding"), body: t("Approved sellers continue into vendor onboarding where pricing, posting fees, payout windows, and policy rules stay visible before publishing opens.") },
      ],
      callout: {
        eyebrow: t("A cleaner seller application"),
        body: t("Seller registration stays inside your account so business details, review status, and approval updates remain private and easy to follow."),
      },
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
    trustTiers: {
      kicker: t("Trust tiers change privileges"),
      title: t("Earn faster payouts, larger storefronts, and policy advantages."),
    },
    closing: {
      kicker: t("Move forward"),
      title: t("Apply, then watch the application status from your account."),
      body: t("Approval unlocks vendor onboarding. Pricing, posting fees, and payout windows are visible before you publish — no contract surprises later."),
      primaryCta: t("Start application"),
      secondaryCta: t("Visit vendor workspace"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Seller pricing — Henry Onyx Marketplace"),
      description:
        t("Plan fees, listing fees, featured-slot fees, transaction commission, and payout processing are all stated up front — before you publish inventory, not after."),
    },
    hero: {
      kicker: t("Seller pricing"),
      title: t("Clear economics. No hidden fees."),
      body: t("Plan fees, listing fees, featured-slot fees, transaction commission, and payout processing are all stated up front — before you publish inventory, not after."),
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
      kicker: t("How HenryCo makes money"),
      title: t("Stated up front, deducted in the open."),
      items: [
        t("Transaction commissions are deducted from each vendor order-group settlement before payout release."),
        t("Posting fees apply after the included listing allowance is exhausted for the seller's active plan."),
        t("Featured placement is a separate paid request and stays subject to quality and trust review."),
        t("Payout processing fees are deducted inside the seller settlement snapshot, not later by surprise."),
        t("Studio, Learn, and Logistics value-added services create additional seller revenue lanes."),
        t("Operator-controlled campaigns and sponsored slots remain auditable and not self-serve chaos."),
      ],
    },
    trustTiers: {
      kicker: t("Trust-tier payout timing"),
      title: t("Better behaviour earns shorter holds."),
    },
    closing: {
      kicker: t("Ready to apply?"),
      title: t("Application opens in your HenryCo account."),
      body: t("You can save the draft and return — pricing visible here applies once vendor onboarding completes."),
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
      body: t("Search the topics most buyers and sellers ask about. If you do not find what you need, open a support ticket from the bottom of this page and a person on the team will read it."),
    },
    stillNeedHelp: {
      kicker: t("Still need help"),
      title: t("Open a support ticket and a person will read it."),
      body: t("Tickets keep the full context attached — the order, the vendor, the dispute history — so the team works through the issue without you re-typing it on every reply."),
      ctaLabel: t("Open a support ticket"),
    },
  },
  trust: {
    metadata: {
      title: t("Trust & safety — Henry Onyx Marketplace"),
      description:
        t("Trust governs what a seller can do, how money moves, and how moderation responds. Seller tiers, escrow holds, disputes, and payout release all leave a server-side paper trail."),
    },
    hero: {
      kicker: t("Trust & safety"),
      title: t("Visible before checkout. Enforced after it."),
      body: t("Trust governs what a seller can do, how money moves, and how moderation responds. Seller tiers, buyer risk, listing scoring, escrow holds, disputes, and payout release all leave a server-side paper trail."),
      pillars: [
        { label: t("Money movement"), value: t("Escrowed, released after checks") },
        { label: t("Reviews"), value: t("Server-logged, dispute-traceable") },
        { label: t("Tiers"), value: t("Earned, revocable") },
      ],
    },
    guardrails: {
      kicker: t("Four guardrails"),
      items: [
        {
          title: t("Trust passports"),
          body: t("Every store and product surfaces verification level, SLA, dispute rate, payout readiness, and fulfillment posture."),
        },
        {
          title: t("Escrow control"),
          body: t("Buyer funds are held by HenryCo first, then move into releasable payout only after delivery and trust checks clear."),
        },
        {
          title: t("Anti-fraud review"),
          body: t("Off-platform payment steering, duplicate media, listing velocity spikes, and risky payout patterns route into queue visibility."),
        },
        {
          title: t("Audit trails"),
          body: t("Approvals, rejections, payout actions, dispute decisions, and automation sweeps are logged server-side."),
        },
      ],
    },
    sellerLadder: {
      kicker: t("Seller trust ladder"),
      title: t("Tiers earned through behaviour, not paid for."),
    },
    policySurfaces: {
      kicker: t("Policy surfaces"),
      title: t("The standards we hold ourselves to."),
    },
    ecosystem: {
      kicker: t("Ecosystem trust reinforcement"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Explore {collection} on Henry Onyx Marketplace — a curated rail of verified products with trust signals, delivery clarity, and seller passports surfaced before checkout."),
      fallbackDescription:
        t("A curated collection on Henry Onyx Marketplace with verified products, trust signals, delivery clarity, and seller passports surfaced before checkout."),
    },
    hero: {
      primaryCta: t("Open full search"),
      secondaryCta: t("Trust standards"),
    },
    sidebar: {
      itemsLabel: t("Items in collection"),
      editedByLabel: t("Edited by"),
      editedByValue: t("Marketplace operations"),
      buyerProtectionLabel: t("Buyer protection"),
      buyerProtectionValue: t("Escrowed checkout"),
    },
    rail: {
      kicker: t("What’s in the rail"),
      itemsSuffix: t("items"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{policy} on Henry Onyx Marketplace — server-logged enforcement, escrow controls, and trust posture surfaced before checkout."),
      fallbackTitle: t("Marketplace policy — Henry Onyx Marketplace"),
      fallbackDescription:
        t("A Henry Onyx Marketplace policy — server-logged enforcement, escrow controls, and trust posture surfaced before checkout."),
    },
    hero: {
      backToTrust: t("Back to trust standards"),
      openSupport: t("Open support thread"),
    },
    details: {
      coverageLabel: t("Coverage"),
      enforcementLabel: t("Enforcement"),
      updatedLabel: t("Updated"),
    },
    coverageBySlug: {
      buyerProtection: t("Buyers"),
      sellerPolicy: t("Sellers"),
      fallback: t("Marketplace participants"),
    },
    enforcementBySlug: {
      buyerProtection: t("Server-held payments + dispute freeze"),
      sellerPolicy: t("Trust-tier review + payout reserve"),
      fallback: t("Server-logged trail"),
    },
    updatedBySlug: {
      buyerProtection: t("On payment + dispute revisions"),
      sellerPolicy: t("On seller standards revisions"),
      fallback: t("On policy revisions"),
    },
    provisions: {
      kicker: t("Policy provisions"),
    },
    ecosystem: {
      kicker: t("Connected marketplace controls"),
      openLabel: t("Open"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{title} on Henry Onyx Marketplace — verified stock, trusted delivery, and seller passport visible before checkout."),
      fallbackDescription:
        t("A verified Henry Onyx Marketplace listing with trust signals, delivery clarity, and seller passport surfaced before checkout."),
    },
    fulfillment: {
      sellerTrustLabel: t("Seller trust"),
      sellerTrustValueTemplate: t("{vendor} passport visible"),
      sellerTrustValueFallback: t("Seller passport pending"),
      availabilityLabel: t("Availability"),
      availabilityValueSingular: t("{count} unit in current stock"),
      availabilityValuePlural: t("{count} units in current stock"),
      fulfillmentLabel: t("Fulfillment"),
      paymentLabel: t("Payment"),
      paymentValueCod: t("COD or verified transfer"),
      paymentValueVerified: t("Verified transfer flow"),
    },
    price: {
      label: t("Price"),
      leadTimeLabel: t("Lead time"),
    },
    safety: {
      kicker: t("Why this listing feels safer"),
      stockTemplate: t("{count} units currently visible to inventory"),
      codEligible: t("Cash on delivery eligible where supported"),
      codFallback: t("Manual verification flow available"),
      vendorLinkedTemplate: t("{vendor} seller passport is linked directly from this page"),
      vendorPending: t("Vendor trust surface is still pending linkage"),
      reviewsTemplateSingular: t("{count} review at {rating} average rating"),
      reviewsTemplatePlural: t("{count} reviews at {rating} average rating"),
    },
    detail: {
      kicker: t("Product detail"),
      title: t("Everything that matters before checkout."),
      deliverySummaryTitle: t("Delivery, support, and post-order care"),
      deliveryFallback: t("Delivery windows will be clarified at checkout."),
      deliveryTail:
        t("Orders stay traceable from payment to fulfillment, and disputes or support threads stay attached to the same order record."),
      specsTitle: t("Specifications and material clarity"),
      passportTitle: t("Store passport and related discovery"),
      visitVendorTemplate: t("Visit {vendor}"),
      exploreCategoryTemplate: t("Explore {category}"),
      seeBrandTemplate: t("See {brand}"),
    },
    related: {
      kicker: t("Complete the set"),
      title: t("More from this buying context."),
      body: t("Recommendation rails stay curated and clean instead of becoming noisy upsell clutter."),
    },
    reviews: {
      kicker: t("Review highlights"),
      title: t("Verified buying signals, not noisy filler."),
      verifiedPurchase: t("Verified purchase"),
      reviewLabel: t("Review"),
    },
    rail: {
      kicker: t("Customers also bought"),
      headline: t("Continue browsing without losing your place."),
      caption:
        t("Co-purchase + similar-category signals surface the next obvious step, never noisy upsell clutter."),
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
      t("Henry Onyx Marketplace transforme le commerce multi-vendeurs en une expérience plus calme : découverte plus claire, ajout rapide depuis chaque carte, vision nette des commandes fractionnées, meilleurs passeports vendeurs et un seul compte HenryCo pour commandes, paiements, avis et support."),
    primaryCta: t("Explorer le catalogue"),
    secondaryCta: t("Vendre sur HenryCo"),
    quickCards: [
      { title: t("Ajout rapide partout"), body: t("Contrôles panier discrets, mini-panier mis à jour instantanément, sans rafraîchissements maladroits.") },
      { title: t("Rails de confiance vérifiés"), body: t("Passeports vendeurs, promesses de livraison, qualité des avis et propriété du stock restent faciles à lire.") },
      { title: t("Un seul compte, moins de friction"), body: t("Commandes, paiements, liste de souhaits, abonnements et notifications restent dans un seul compte HenryCo.") },
    ],
    whyKicker: t("Pourquoi c’est différent"),
    whyTitle: t("La confiance est visible avant le paiement."),
    whyCards: [
      { title: t("La confiance est visible avant le paiement"), body: t("Niveau de vérification, taux de litiges, réactivité du support et fiabilité de l’exécution restent proches de la décision d’achat.") },
      { title: t("La clarté des commandes fractionnées reste lisible"), body: t("Quand le stock vient de différents vendeurs ou de HenryCo, la segmentation de livraison reste évidente au lieu de devenir confuse.") },
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
      t("Les candidatures vendeurs, la modération et les validations passent par des files de revue HenryCo dédiées."),
      t("Les mises à jour de commande, les avis, le support et les paiements restent liés au même compte acheteur."),
      t("Le support, l’examen des paiements et les opérations de livraison restent organisés pour des réponses cohérentes."),
    ],
    sellerKicker: t("Qualité vendeur"),
    sellerTitle: t("Les vendeurs sérieux commencent dans leur compte HenryCo."),
    sellerBody:
      t("Les visiteurs publics peuvent découvrir la vente sur /sell, tandis que la candidature, l’avancement du brouillon, les mises à jour de revue et le statut d’approbation restent dans l’expérience vendeur."),
    sellerBullets: [
      t("Enregistrement des brouillons et visibilité de l’avancement"),
      t("Gestion privée des documents au bon endroit"),
      t("Mises à jour claires d’approbation pour chaque vendeur"),
    ],
  },
  kpiLabels: {
    verifiedStores: t("Boutiques vérifiées"),
    activeListings: t("Annonces actives"),
    trustRating: t("Indice de confiance"),
  },
  kpiHints: {
    verifiedStores: t("Vendeurs sélectionnés et stock appartenant à HenryCo avec une responsabilité plus claire."),
    activeListings: t("Annonces approuvées affichées avec des informations claires sur la livraison, la confiance et la propriété."),
    trustRating: t("La qualité des avis marketplace et la fiabilité des vendeurs apparaissent avant le paiement."),
  },
  footer: {
    brandSubtitle: t("Commerce raffiné avec un seul compte HenryCo connecté"),
    brandBody:
      t("Henry Onyx Marketplace est pensé pour des achats à forte confiance, des vendeurs vérifiés et une expérience plus propre du paiement à la livraison."),
    shopTitle: t("Acheter"),
    sellTitle: t("Vendre"),
    supportTitle: t("Support"),
    supportBody:
      t("Commandes, échanges vendeurs, mises à jour du support et paiements restent liés dans un seul compte HenryCo."),
    shopLinks: [
      { href: "/search", label: t("Rechercher dans le marketplace") },
      { href: "/deals", label: t("Offres et éditions limitées") },
      { href: "/trust", label: t("Passeport de confiance") },
      { href: "/policies/buyer-protection", label: t("Politique de protection de l’acheteur") },
      { href: "/help", label: t("Support et résolution") },
    ],
    sellLinks: [
      { href: "/sell", label: t("Pourquoi vendre sur HenryCo") },
      { href: "/sell/pricing", label: t("Tarifs et frais vendeur") },
      { href: "/policies/seller-policy", label: t("Politique vendeur") },
      { href: "/account/seller-application", label: t("Candidature vendeur") },
      { href: "/vendor", label: t("Espace vendeur") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("Stock HenryCo"),
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
      title: t("Un panier premium, des modifications plus rapides et des commandes fractionnées plus lisibles."),
      description:
        t("Le panier garde le regroupement par vendeur visible, met à jour les quantités rapidement et reste connecté au tiroir mini-panier pour que les acheteurs ne perdent jamais le fil au moment de finaliser."),
    },
    emptyState: {
      title: t("Votre panier est encore vide."),
      body: t("Ajoutez rapidement depuis les fiches produits, sauvegardez des articles pour plus tard, et le panier reste à jour dans le tiroir mini-panier comme dans le panier complet, sans rechargement."),
      ctaLabel: t("Parcourir les produits"),
    },
  },
  track: {
    metadata: {
      title: t("Suivi de commande — Marketplace HenryCo"),
      description:
        t("Suivez chaque segment vendeur, mise à jour de paiement et jalon d'expédition au même endroit. L'entiercement reste actif jusqu'à confirmation de la livraison."),
    },
    hero: {
      kicker: t("Suivi de commande"),
      titlePrefix: t("Suivi"),
      body: t("La clarté des commandes fractionnées reste visible ici : chaque segment vendeur, mise à jour de paiement et jalon d'expédition occupe sa propre ligne, pour aligner le support et les attentes de l'acheteur."),
      orderValueLabel: t("Valeur de la commande"),
      paymentLabel: t("Paiement"),
      payoutControlLabel: t("Contrôle du versement"),
      payoutFrozen: t("Gelé"),
      payoutEscrowActive: t("Entiercement actif"),
    },
    paymentRecord: {
      kicker: t("Trace de paiement"),
      walletBody: t("Le solde du portefeuille a été débité et la commande est mise sous entiercement jusqu'à l'expédition."),
      proofBody: t("Le justificatif de virement est joint pour examen par la finance HenryCo."),
      awaitingBody: t("Le paiement attend la pièce justificative finance ou la réconciliation à la livraison."),
      methodLabel: t("Méthode"),
      statusLabel: t("Statut"),
      proofLabel: t("Justificatif"),
      viewProof: t("Voir le justificatif"),
      walletDebit: t("Débit portefeuille"),
      pending: t("En attente"),
    },
    timeline: {
      kicker: t("Chronologie"),
      title: t("Les jalons visibles côté client, dans l'ordre."),
    },
    segments: {
      kicker: t("Segments vendeurs"),
      title: t("Chaque vendeur reste responsable de sa propre expédition."),
      henrycoSegment: t("Segment HenryCo"),
      fulfillmentLabel: t("Expédition"),
      trackingLabel: t("Suivi"),
      payoutLabel: t("Versement"),
      trackingPending: t("En attente"),
    },
    completion: {
      kicker: t("Confirmation de réception"),
      body: t("Confirmez la réception une fois la commande satisfaisante. HenryCo ne libère le versement vendeur qu'après confirmation de livraison ou éligibilité à une libération automatique."),
      confirmCta: t("Confirmer la réception"),
    },
    help: {
      kicker: t("Besoin d'aide ?"),
      title: t("Litiges, remboursements et soucis de livraison passent par un seul fil."),
      body: t("Ouvrez un fil de support avec ce numéro de commande joint, pour que l'agent voie toute la chronologie et la répartition vendeur sans que vous ayez à tout retaper."),
      openSupportCta: t("Ouvrir un fil de support"),
      viewAllOrdersCta: t("Voir toutes les commandes"),
    },
  },
  deals: {
    metadata: {
      title: t("Offres vérifiées — Marketplace HenryCo"),
      description:
        t("Des remises filtrées sur la confiance, la disponibilité réelle des stocks et la responsabilité des vendeurs. Seules les annonces vérifiées aux signaux propres apparaissent sur la page des offres HenryCo."),
    },
    pageIntro: {
      kicker: t("Offres vérifiées"),
      title: t("Des remises filtrées sur la confiance, la disponibilité des stocks et la responsabilité des vendeurs."),
      description:
        t("Les offres ne sont mises en avant que lorsque la qualité de l’annonce, le passeport de confiance du vendeur et l’état du stock sont assez propres pour protéger la conversion et éviter le regret après achat."),
    },
    sectionLabel: t("Offres vérifiées"),
    listEyebrow: t("Offres vérifiées"),
    refreshNote: t("Mises à jour régulièrement"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("Aucune offre vérifiée pour le moment"),
      body: t("Les remises vérifiées apparaissent dès que les vendeurs les publient. Repassez bientôt."),
    },
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
    collectionsRail: {
      kicker: t("Sélections curatées"),
      title: t("Des collections qui raccourcissent la décision."),
    },
    catalog: {
      kicker: t("Catalogue de la catégorie"),
      title: t("Produits premium, hiérarchie plus nette."),
      openSearch: t("Ouvrir la recherche complète"),
    },
    metadata: {
      titleTemplate: t("{category} — Marketplace HenryCo"),
      descriptionTemplate:
        t("Explorez les produits vérifiés de {category} sur Henry Onyx Marketplace, avec des signaux de confiance, des informations de livraison claires et des passeports vendeurs visibles avant le paiement."),
      fallbackDescription:
        t("Parcourez une catégorie sélectionnée du Henry Onyx Marketplace avec des signaux de confiance, une livraison plus claire et des passeports vendeurs avant paiement."),
    },
  },
  brand: {
    eyebrow: t("Marque"),
    bodyFallback:
      t("Une boutique vérifiée sur Henry Onyx Marketplace, avec des signaux de confiance, une livraison plus claire et un passeport vendeur visibles avant le paiement."),
    searchCta: t("Rechercher dans cette marque"),
    trustCta: t("Standards de confiance"),
    stats: {
      activeProducts: t("Produits actifs"),
      listingsReviewed: t("Annonces vérifiées"),
      listingsReviewedValue: t("Passeport de confiance visible par article"),
      buyerProtection: t("Protection acheteur"),
      buyerProtectionValue: t("Paiement sous séquestre"),
    },
    liveKicker: t("En direct de {brand}"),
    openFullSearch: t("Ouvrir la recherche complète"),
    metadataTitle: t("{brand} — Marketplace HenryCo"),
    metadataDescription:
      t("Explorez les produits vérifiés de {brand} sur Henry Onyx Marketplace, avec des signaux de confiance, une livraison plus claire et des passeports vendeurs visibles avant le paiement."),
  },
  store: {
    metadataTitle: t("{store} — Marketplace HenryCo"),
    metadataDescription:
      t("Parcourez les produits vérifiés de {store} sur Henry Onyx Marketplace, avec des signaux de confiance, une livraison plus claire et le passeport vendeur visibles avant le paiement."),
    metadataDescriptionFallback:
      t("Une boutique vérifiée sur Henry Onyx Marketplace, avec des signaux de confiance, une livraison plus claire et un passeport vendeur visibles avant chaque paiement."),
    hero: {
      eyebrow: t("Passeport boutique"),
      bodyFallback:
        t("Un vendeur vérifié sur Henry Onyx Marketplace, avec des signaux de confiance, une livraison plus claire et un passeport transparent affiché avant chaque paiement."),
    },
    stats: {
      trustScore: t("Score de confiance"),
      responseSla: t("Délai de réponse"),
      responseSlaSuffix: t(" h"),
      followers: t("Abonnés"),
    },
    standards: {
      eyebrow: t("Standards de la boutique"),
    },
    support: {
      eyebrow: t("Support"),
      contactLinkLabel: t("Utilisez Henry Onyx Marketplace pour contacter cette boutique"),
      contactBodySuffix:
        t(" — les messages sont enregistrés et rattachés à la référence de votre commande pour que chaque mise à jour reste au même endroit."),
      ctaLabel: t("Contacter cette boutique"),
      subjectTemplate: t("Question pour {store}"),
    },
    reviews: {
      eyebrow: t("Avis récents"),
      verifiedPurchase: t("Achat vérifié"),
      review: t("Avis"),
    },
    catalog: {
      kicker: t("Catalogue de la boutique"),
      title: t("Tout ce qui est actuellement en ligne dans cette boutique."),
      exploreLink: t("Explorer plus d’annonces vérifiées"),
      emptyTitle: t("Pas encore d’annonces en ligne"),
      emptyBody: t("Les produits approuvés de cette boutique apparaîtront ici dès leur mise en ligne."),
    },
  },
  help: {
    metadata: {
      title: t("Centre d’aide — Marketplace HenryCo"),
      description:
        t("Parcourez les questions les plus posées par les acheteurs et vendeurs. Si vous ne trouvez pas ce qu’il vous faut, ouvrez un ticket et un membre de l’équipe le lira."),
    },
    hero: {
      kicker: t("Centre d’aide"),
      title: t("Trouvez une réponse en quelques secondes — ou parlez à une personne."),
      body: t("Cherchez les sujets que les acheteurs et les vendeurs posent le plus. Si vous ne trouvez pas ce qu’il vous faut, ouvrez un ticket en bas de page et un membre de l’équipe le lira."),
    },
    stillNeedHelp: {
      kicker: t("Encore besoin d’aide"),
      title: t("Ouvrez un ticket et une personne le lira."),
      body: t("Les tickets gardent tout le contexte rattaché — la commande, le vendeur, l’historique du litige — pour que l’équipe traite le sujet sans que vous ayez à le réécrire à chaque réponse."),
      ctaLabel: t("Ouvrir un ticket de support"),
    },
  },
  sell: {
    metadata: {
      title: t("Vendre sur HenryCo — marketplace sélective pour des vendeurs de confiance"),
      description:
        t("Postulez pour vendre sur Henry Onyx Marketplace : positionnement axé sur la confiance, vitrines premium et un espace unifié pour commandes, paiements et support."),
    },
    hero: {
      kicker: t("Vendre sur HenryCo"),
      title: t("Sélective par essence. Conçue pour les vendeurs qui misent sur la confiance."),
      body: t("Henry Onyx Marketplace privilégie les vendeurs soigneux dans leur présentation, fiables dans l’exécution et honnêtes sur la protection des acheteurs. Le niveau attendu est explicité sur cette page ; la candidature vendeur se poursuit dans votre compte HenryCo."),
      primaryCta: t("Ouvrir la candidature vendeur"),
      secondaryCta: t("Voir les tarifs vendeur"),
      signInCta: t("Se connecter avec un compte HenryCo"),
      highlights: [
        { label: t("Sélection"), value: t("Revue manuelle, pas de mise en ligne payante") },
        { label: t("Vitrine"), value: t("Passeport de confiance visible par les acheteurs") },
        { label: t("Espace"), value: t("Commandes, paiements et support unifiés") },
      ],
    },
    advantages: {
      kicker: t("Pourquoi les meilleurs vendeurs réussissent ici"),
      items: [
        { title: t("Positionnement basé sur la confiance"), body: t("Votre boutique reçoit un passeport de confiance visible, au lieu d’être noyée dans le bruit d’un marketplace bas de gamme.") },
        { title: t("Une meilleure qualité de vitrine"), body: t("Des rails éditoriaux, une recherche plus calme et des fiches produits plus nettes aident les boutiques exigeantes à mieux convertir.") },
        { title: t("Une exploitation plus nette"), body: t("Paiements, commandes, support, modération et alertes stock restent visibles dans un espace de travail plus clair.") },
      ],
    },
    onboarding: {
      kicker: t("Comment se passe l’onboarding"),
      stepLabel: t("Étape"),
      steps: [
        { step: "01", title: t("Lancer la candidature vendeur"), body: t("Ouvrez la candidature depuis votre compte HenryCo — les brouillons s’enregistrent automatiquement pendant que vous rassemblez les informations.") },
        { step: "02", title: t("Ajouter les détails de l’activité"), body: t("Nom d’entreprise, profil de boutique, axe produit et tout document de vérification expliquant comment vous honorez vos commandes.") },
        { step: "03", title: t("Revue de la candidature"), body: t("L’équipe HenryCo examine les documents, les signaux de confiance et la solidité de la boutique — pas seulement un badge payant.") },
        { step: "04", title: t("Onboarding vendeur"), body: t("Les vendeurs approuvés continuent l’onboarding où tarifs, frais de publication, fenêtres de paiement et règles restent visibles avant la mise en ligne.") },
      ],
      callout: {
        eyebrow: t("Une candidature vendeur plus propre"),
        body: t("L’inscription vendeur reste dans votre compte pour que les détails de l’activité, l’état de la revue et les mises à jour d’approbation restent privés et faciles à suivre."),
      },
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
    trustTiers: {
      kicker: t("Les paliers de confiance changent les privilèges"),
      title: t("Obtenez des versements plus rapides, des vitrines plus larges et des avantages côté politique."),
    },
    closing: {
      kicker: t("Avancer"),
      title: t("Postulez, puis suivez le statut de la candidature depuis votre compte."),
      body: t("L’approbation ouvre l’onboarding vendeur. Tarifs, frais de publication et fenêtres de paiement restent visibles avant la mise en ligne — pas de mauvaises surprises contractuelles ensuite."),
      primaryCta: t("Démarrer la candidature"),
      secondaryCta: t("Voir l’espace vendeur"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Tarifs vendeur — Henry Onyx Marketplace"),
      description:
        t("Frais de plan, frais de mise en ligne, frais de mise en avant, commission de transaction et traitement des paiements sont tous annoncés en amont — avant la publication, pas après."),
    },
    hero: {
      kicker: t("Tarifs vendeur"),
      title: t("Une économie claire. Aucun frais caché."),
      body: t("Frais de plan, frais de mise en ligne, frais de mise en avant, commission de transaction et traitement des paiements sont tous annoncés en amont — avant la publication de votre catalogue, pas après."),
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
    economics: {
      kicker: t("Comment HenryCo gagne de l’argent"),
      title: t("Annoncé en amont, déduit à la vue de tous."),
      items: [
        t("Les commissions de transaction sont prélevées sur chaque règlement de groupe-commande vendeur avant la libération du versement."),
        t("Les frais de mise en ligne s’appliquent une fois l’allocation d’annonces incluses épuisée pour le plan actif du vendeur."),
        t("Une mise en avant est une demande payante distincte, soumise à un contrôle de qualité et de confiance."),
        t("Les frais de traitement de versement sont déduits dans le récapitulatif de règlement vendeur, pas en surprise plus tard."),
        t("Les services à valeur ajoutée Studio, Learn et Logistics ouvrent des relais de revenus supplémentaires pour les vendeurs."),
        t("Les campagnes pilotées par l’opérateur et les emplacements sponsorisés restent auditables et non livrés en libre-service."),
      ],
    },
    trustTiers: {
      kicker: t("Calendrier de versement par palier de confiance"),
      title: t("Un meilleur comportement raccourcit les retenues."),
    },
    closing: {
      kicker: t("Prêt à candidater ?"),
      title: t("La candidature s’ouvre dans votre compte HenryCo."),
      body: t("Vous pouvez enregistrer le brouillon et revenir — la tarification affichée ici s’applique une fois l’onboarding vendeur terminé."),
      primaryCta: t("Postuler comme vendeur"),
      secondaryCta: t("Standards de confiance"),
    },
  },
  trust: {
    metadata: {
      title: t("Confiance & sécurité — Henry Onyx Marketplace"),
      description:
        t("La confiance définit ce qu’un vendeur peut faire, comment l’argent circule et comment la modération réagit. Niveaux vendeurs, séquestre, litiges et libération des paiements laissent une trace serveur complète."),
    },
    hero: {
      kicker: t("Confiance & sécurité"),
      title: t("Visible avant le paiement. Appliquée après."),
      body: t("La confiance gouverne ce que peut faire un vendeur, la circulation de l’argent et la réponse de la modération. Niveaux vendeurs, risque acheteur, notation des annonces, séquestre, litiges et libération des paiements laissent une trace serveur."),
      pillars: [
        { label: t("Flux d’argent"), value: t("Sous séquestre, libéré après contrôles") },
        { label: t("Avis"), value: t("Journalisés côté serveur, traçables en litige") },
        { label: t("Niveaux"), value: t("Gagnés, révocables") },
      ],
    },
    guardrails: {
      kicker: t("Quatre garde-fous"),
      items: [
        {
          title: t("Passeports de confiance"),
          body: t("Chaque boutique et chaque produit expose son niveau de vérification, son SLA, son taux de litige, sa disponibilité au paiement et sa posture d’exécution."),
        },
        {
          title: t("Contrôle du séquestre"),
          body: t("Les fonds de l’acheteur sont d’abord détenus par HenryCo, puis libérés au paiement seulement après livraison et contrôles validés."),
        },
        {
          title: t("Revue anti-fraude"),
          body: t("Détours de paiement hors plateforme, médias dupliqués, pics de mise en ligne et schémas de paiement à risque entrent dans la visibilité des files de revue."),
        },
        {
          title: t("Pistes d’audit"),
          body: t("Approbations, refus, actions de paiement, décisions de litige et balayages automatisés sont journalisés côté serveur."),
        },
      ],
    },
    sellerLadder: {
      kicker: t("Échelle de confiance vendeur"),
      title: t("Des niveaux gagnés par le comportement, pas achetés."),
    },
    policySurfaces: {
      kicker: t("Surfaces des politiques"),
      title: t("Les standards que nous nous imposons."),
    },
    ecosystem: {
      kicker: t("Renforcement de la confiance dans l’écosystème"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Marketplace HenryCo"),
      descriptionTemplate:
        t("Découvrez {collection} sur Henry Onyx Marketplace — une sélection curatée de produits vérifiés, avec signaux de confiance, livraison plus claire et passeports vendeurs avant le paiement."),
      fallbackDescription:
        t("Une collection curatée sur Henry Onyx Marketplace, avec des produits vérifiés, des signaux de confiance, une livraison plus claire et des passeports vendeurs avant le paiement."),
    },
    hero: {
      primaryCta: t("Ouvrir la recherche complète"),
      secondaryCta: t("Standards de confiance"),
    },
    sidebar: {
      itemsLabel: t("Articles de la collection"),
      editedByLabel: t("Édité par"),
      editedByValue: t("Opérations Marketplace"),
      buyerProtectionLabel: t("Protection acheteur"),
      buyerProtectionValue: t("Paiement sous séquestre"),
    },
    rail: {
      kicker: t("Au programme de la sélection"),
      itemsSuffix: t("articles"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Marketplace HenryCo"),
      descriptionTemplate:
        t("{policy} sur Henry Onyx Marketplace — application journalisée côté serveur, contrôles d’entiercement et posture de confiance affichés avant le paiement."),
      fallbackTitle: t("Politique du marché — Marketplace HenryCo"),
      fallbackDescription:
        t("Une politique de Henry Onyx Marketplace — application journalisée côté serveur, contrôles d’entiercement et posture de confiance affichés avant le paiement."),
    },
    hero: {
      backToTrust: t("Retour aux standards de confiance"),
      openSupport: t("Ouvrir un fil d’assistance"),
    },
    details: {
      coverageLabel: t("Couverture"),
      enforcementLabel: t("Application"),
      updatedLabel: t("Mise à jour"),
    },
    coverageBySlug: {
      buyerProtection: t("Acheteurs"),
      sellerPolicy: t("Vendeurs"),
      fallback: t("Participants du marché"),
    },
    enforcementBySlug: {
      buyerProtection: t("Paiements sous séquestre + gel des litiges"),
      sellerPolicy: t("Revue par palier de confiance + réserve de paiement"),
      fallback: t("Traçabilité serveur"),
    },
    updatedBySlug: {
      buyerProtection: t("Lors de révisions des paiements et des litiges"),
      sellerPolicy: t("Lors de révisions des standards vendeurs"),
      fallback: t("Lors des révisions de politique"),
    },
    provisions: {
      kicker: t("Dispositions de la politique"),
    },
    ecosystem: {
      kicker: t("Contrôles du marché connectés"),
      openLabel: t("Ouvrir"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{title} sur Henry Onyx Marketplace — stock vérifié, livraison fiable et passeport vendeur visibles avant le paiement."),
      fallbackDescription:
        t("Une annonce vérifiée sur Henry Onyx Marketplace, avec signaux de confiance, clarté de livraison et passeport vendeur visibles avant le paiement."),
    },
    fulfillment: {
      sellerTrustLabel: t("Confiance vendeur"),
      sellerTrustValueTemplate: t("Passeport {vendor} visible"),
      sellerTrustValueFallback: t("Passeport vendeur en attente"),
      availabilityLabel: t("Disponibilité"),
      availabilityValueSingular: t("{count} unité actuellement en stock"),
      availabilityValuePlural: t("{count} unités actuellement en stock"),
      fulfillmentLabel: t("Livraison"),
      paymentLabel: t("Paiement"),
      paymentValueCod: t("Paiement à la livraison ou virement vérifié"),
      paymentValueVerified: t("Flux par virement vérifié"),
    },
    price: {
      label: t("Prix"),
      leadTimeLabel: t("Délai"),
    },
    safety: {
      kicker: t("Pourquoi cette annonce inspire confiance"),
      stockTemplate: t("{count} unités actuellement visibles à l’inventaire"),
      codEligible: t("Paiement à la livraison possible là où il est pris en charge"),
      codFallback: t("Flux de vérification manuelle disponible"),
      vendorLinkedTemplate: t("Le passeport vendeur {vendor} est lié directement depuis cette page"),
      vendorPending: t("La page de confiance du vendeur est encore en cours de liaison"),
      reviewsTemplateSingular: t("{count} avis pour une note moyenne de {rating}"),
      reviewsTemplatePlural: t("{count} avis pour une note moyenne de {rating}"),
    },
    detail: {
      kicker: t("Détail produit"),
      title: t("Tout ce qui compte avant le paiement."),
      deliverySummaryTitle: t("Livraison, support et suivi après commande"),
      deliveryFallback: t("Les délais de livraison seront précisés au paiement."),
      deliveryTail:
        t("Les commandes restent traçables du paiement à l’expédition, et les litiges ou fils d’assistance restent rattachés au même dossier de commande."),
      specsTitle: t("Spécifications et clarté des matériaux"),
      passportTitle: t("Passeport boutique et découvertes liées"),
      visitVendorTemplate: t("Visiter {vendor}"),
      exploreCategoryTemplate: t("Explorer {category}"),
      seeBrandTemplate: t("Voir {brand}"),
    },
    related: {
      kicker: t("Compléter l’ensemble"),
      title: t("À découvrir dans le même contexte d’achat."),
      body: t("Les rails de recommandation restent ciblés et sobres, sans relances commerciales bruyantes."),
    },
    reviews: {
      kicker: t("Faits marquants des avis"),
      title: t("Des signaux d’achat vérifiés, sans bruit superflu."),
      verifiedPurchase: t("Achat vérifié"),
      reviewLabel: t("Avis"),
    },
    rail: {
      kicker: t("Les acheteurs ont aussi pris"),
      headline: t("Continuez votre navigation sans perdre le fil."),
      caption:
        t("Les signaux de co-achat et de catégorie similaire ouvrent la prochaine étape évidente, sans surcharge commerciale."),
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
      t("Henry Onyx Marketplace convierte el comercio multi-vendedor en una experiencia más serena: descubrimiento más claro, añadido rápido desde cada ficha, claridad en pedidos divididos, mejores pasaportes de vendedor y una única cuenta HenryCo para pedidos, pagos, reseñas y soporte."),
    primaryCta: t("Explorar el catálogo"),
    secondaryCta: t("Vende en HenryCo"),
    quickCards: [
      { title: t("Añadido rápido en todas partes"), body: t("Controles de carrito discretos a nivel de ficha, actualizaciones instantáneas del mini-carrito y sin recargas torpes.") },
      { title: t("Vías de confianza verificadas"), body: t("Pasaportes de vendedor, promesas de entrega, calidad de reseñas y propiedad del stock siguen siendo fáciles de leer.") },
      { title: t("Una cuenta, menos fricción"), body: t("Pedidos, pagos, lista de deseos, seguimientos y notificaciones permanecen juntos en una sola cuenta HenryCo.") },
    ],
    whyKicker: t("Por qué se siente diferente"),
    whyTitle: t("La confianza es visible antes del pago."),
    whyCards: [
      { title: t("La confianza es visible antes del pago"), body: t("El nivel de verificación, la tasa de disputas, la capacidad de respuesta del soporte y la fiabilidad del cumplimiento se mantienen cerca de la decisión de compra.") },
      { title: t("La claridad de los pedidos divididos sigue siendo legible"), body: t("Cuando el inventario proviene de varios vendedores o del stock de HenryCo, la segmentación de entrega sigue siendo evidente en vez de generar confusión al pagar.") },
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
      t("Las candidaturas de vendedores, la moderación y las aprobaciones se revisan a través de canales dedicados de HenryCo."),
      t("Las actualizaciones de pedido, las reseñas, el soporte y los pagos permanecen conectados a la misma cuenta de comprador."),
      t("El soporte, la revisión de pagos y las operaciones de entrega se mantienen organizados para que las respuestas sigan siendo coherentes."),
    ],
    sellerKicker: t("Calidad del vendedor"),
    sellerTitle: t("Los vendedores serios empiezan dentro de su cuenta HenryCo."),
    sellerBody:
      t("Los visitantes públicos pueden conocer la venta en /sell, mientras que la candidatura, el progreso del borrador, las actualizaciones de revisión y el estado de aprobación permanecen dentro de la experiencia del vendedor."),
    sellerBullets: [
      t("Guardado de borradores y visibilidad del progreso"),
      t("Gestión privada de documentos en el lugar adecuado"),
      t("Actualizaciones claras de aprobación para cada vendedor"),
    ],
  },
  kpiLabels: {
    verifiedStores: t("Tiendas verificadas"),
    activeListings: t("Listados activos"),
    trustRating: t("Calificación de confianza"),
  },
  kpiHints: {
    verifiedStores: t("Vendedores curados e inventario propiedad de HenryCo con responsabilidad más clara."),
    activeListings: t("Listados aprobados mostrados con claridad de entrega, confianza y propiedad."),
    trustRating: t("La calidad de las reseñas del marketplace y la fiabilidad del vendedor aparecen antes del pago."),
  },
  footer: {
    brandSubtitle: t("Comercio refinado con una cuenta HenryCo conectada"),
    brandBody:
      t("Henry Onyx Marketplace está diseñado para compras de alta confianza, vendedores verificados y una experiencia más limpia del pago a la entrega."),
    shopTitle: t("Comprar"),
    sellTitle: t("Vender"),
    supportTitle: t("Soporte"),
    supportBody:
      t("Pedidos, conversaciones con vendedores, actualizaciones de soporte y registros de pago permanecen conectados en una sola cuenta HenryCo."),
    shopLinks: [
      { href: "/search", label: t("Buscar en el marketplace") },
      { href: "/deals", label: t("Ofertas y ediciones limitadas") },
      { href: "/trust", label: t("Pasaporte de confianza") },
      { href: "/policies/buyer-protection", label: t("Política de protección del comprador") },
      { href: "/help", label: t("Soporte y resolución") },
    ],
    sellLinks: [
      { href: "/sell", label: t("Por qué vender en HenryCo") },
      { href: "/sell/pricing", label: t("Precios y tarifas del vendedor") },
      { href: "/policies/seller-policy", label: t("Política del vendedor") },
      { href: "/account/seller-application", label: t("Candidatura de vendedor") },
      { href: "/vendor", label: t("Espacio del vendedor") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("Stock HenryCo"),
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
      title: t("Una cesta premium con ediciones más rápidas y mayor claridad en pedidos divididos."),
      description:
        t("El carrito mantiene visible la agrupación por vendedor, actualiza las cantidades con agilidad y permanece conectado al mini-carrito para que los compradores no pierdan el contexto al acercarse al pago."),
    },
    emptyState: {
      title: t("Tu carrito sigue vacío."),
      body: t("Añade rápido desde las fichas de producto, guarda artículos para más tarde, y la cesta se mantiene al día tanto en el mini-carrito como en el carrito completo, sin recargar."),
      ctaLabel: t("Explorar productos"),
    },
  },
  track: {
    metadata: {
      title: t("Seguimiento de pedido — Henry Onyx Marketplace"),
      description:
        t("Sigue cada segmento de vendedor, novedad de pago e hito de envío en un solo sitio. El depósito en garantía se mantiene hasta que se confirme la entrega."),
    },
    hero: {
      kicker: t("Seguimiento de pedido"),
      titlePrefix: t("Seguimiento"),
      body: t("La claridad de los pedidos divididos sigue visible aquí: cada segmento de vendedor, actualización de pago y hito de envío ocupa su propia fila para alinear soporte y expectativas del comprador."),
      orderValueLabel: t("Valor del pedido"),
      paymentLabel: t("Pago"),
      payoutControlLabel: t("Control de liquidación"),
      payoutFrozen: t("Congelado"),
      payoutEscrowActive: t("Depósito activo"),
    },
    paymentRecord: {
      kicker: t("Registro de pago"),
      walletBody: t("Se cargó el saldo de la cartera y el pedido queda en depósito hasta el envío."),
      proofBody: t("Se adjuntó el comprobante de transferencia para revisión de finanzas de HenryCo."),
      awaitingBody: t("El pago espera el comprobante de finanzas o la conciliación tras la entrega."),
      methodLabel: t("Método"),
      statusLabel: t("Estado"),
      proofLabel: t("Comprobante"),
      viewProof: t("Ver comprobante"),
      walletDebit: t("Débito de cartera"),
      pending: t("Pendiente"),
    },
    timeline: {
      kicker: t("Línea de tiempo"),
      title: t("Hitos visibles para el cliente, en orden."),
    },
    segments: {
      kicker: t("Segmentos de vendedor"),
      title: t("Cada vendedor responde por su propio envío."),
      henrycoSegment: t("Segmento HenryCo"),
      fulfillmentLabel: t("Envío"),
      trackingLabel: t("Seguimiento"),
      payoutLabel: t("Liquidación"),
      trackingPending: t("Pendiente"),
    },
    completion: {
      kicker: t("Confirmación de recepción"),
      body: t("Confirma la recepción cuando el pedido sea satisfactorio. HenryCo solo libera la liquidación al vendedor tras confirmar la entrega o si el pedido cumple la liberación automática."),
      confirmCta: t("Confirmar recepción"),
    },
    help: {
      kicker: t("¿Necesitas ayuda?"),
      title: t("Disputas, reembolsos y problemas de entrega se canalizan en un solo hilo."),
      body: t("Abre un hilo de soporte con este número de pedido adjunto para que el agente vea la línea de tiempo completa y el desglose por vendedor sin que tengas que volver a escribirlo."),
      openSupportCta: t("Abrir hilo de soporte"),
      viewAllOrdersCta: t("Ver todos los pedidos"),
    },
  },
  deals: {
    metadata: {
      title: t("Ofertas verificadas — Henry Onyx Marketplace"),
      description:
        t("Descuentos filtrados por confianza, certeza de stock y responsabilidad del vendedor. En la página de ofertas de HenryCo solo aparecen listados verificados con señales limpias."),
    },
    pageIntro: {
      kicker: t("Ofertas verificadas"),
      title: t("Descuentos filtrados por confianza, certeza de stock y responsabilidad del vendedor."),
      description:
        t("Solo destacamos ofertas cuando la calidad del anuncio, el pasaporte de confianza del vendedor y el estado del stock están lo bastante limpios para proteger la conversión y reducir el arrepentimiento del comprador."),
    },
    sectionLabel: t("Ofertas verificadas"),
    listEyebrow: t("Ofertas verificadas"),
    refreshNote: t("Actualizadas con regularidad"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("No hay ofertas verificadas ahora mismo"),
      body: t("Los descuentos verificados aparecen a medida que los vendedores los publican. Vuelve pronto."),
    },
  },
  brand: {
    eyebrow: t("Marca"),
    bodyFallback:
      t("Una tienda verificada en Henry Onyx Marketplace, con señales de confianza, claridad de entrega y pasaporte del vendedor visibles antes del pago."),
    searchCta: t("Buscar en esta marca"),
    trustCta: t("Estándares de confianza"),
    stats: {
      activeProducts: t("Productos activos"),
      listingsReviewed: t("Anuncios revisados"),
      listingsReviewedValue: t("Pasaporte de confianza visible por artículo"),
      buyerProtection: t("Protección al comprador"),
      buyerProtectionValue: t("Pago en custodia"),
    },
    liveKicker: t("En directo desde {brand}"),
    openFullSearch: t("Abrir búsqueda completa"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Explora productos verificados de {brand} en Henry Onyx Marketplace, con señales de confianza, claridad de entrega y pasaportes de vendedor visibles antes del pago."),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Explora los productos verificados de {store} en Henry Onyx Marketplace, con señales de confianza, claridad de entrega y el pasaporte del vendedor visibles antes del pago."),
    metadataDescriptionFallback:
      t("Una tienda verificada en Henry Onyx Marketplace, con señales de confianza, claridad de entrega y pasaporte del vendedor visibles antes de cada pago."),
    hero: {
      eyebrow: t("Pasaporte de la tienda"),
      bodyFallback:
        t("Un vendedor verificado en Henry Onyx Marketplace, con señales de confianza, claridad de entrega y un pasaporte transparente visible antes de cada pago."),
    },
    stats: {
      trustScore: t("Puntuación de confianza"),
      responseSla: t("Plazo de respuesta"),
      responseSlaSuffix: t(" h"),
      followers: t("Seguidores"),
    },
    standards: {
      eyebrow: t("Estándares de la tienda"),
    },
    support: {
      eyebrow: t("Soporte"),
      contactLinkLabel: t("Usa Henry Onyx Marketplace para contactar con esta tienda"),
      contactBodySuffix:
        t(" — los mensajes quedan registrados y vinculados a la referencia de tu pedido para que cada actualización se mantenga en un solo lugar."),
      ctaLabel: t("Contactar con esta tienda"),
      subjectTemplate: t("Pregunta para {store}"),
    },
    reviews: {
      eyebrow: t("Reseñas recientes"),
      verifiedPurchase: t("Compra verificada"),
      review: t("Reseña"),
    },
    catalog: {
      kicker: t("Catálogo de la tienda"),
      title: t("Todo lo que esta tienda tiene en directo ahora mismo."),
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
      body: t("Busca los temas que más consultan compradores y vendedores. Si no encuentras lo que necesitas, abre un ticket al final de la página y una persona del equipo lo leerá."),
    },
    stillNeedHelp: {
      kicker: t("Aún necesitas ayuda"),
      title: t("Abre un ticket y una persona lo leerá."),
      body: t("Los tickets conservan todo el contexto adjunto — el pedido, el vendedor, el historial de la disputa — para que el equipo resuelva sin que tengas que reescribirlo en cada respuesta."),
      ctaLabel: t("Abrir un ticket de soporte"),
    },
  },
  sell: {
    metadata: {
      title: t("Vender en HenryCo — marketplace selectivo para vendedores de confianza"),
      description:
        t("Solicita vender en Henry Onyx Marketplace: posicionamiento basado en la confianza, escaparates premium y un espacio unificado para pedidos, pagos y soporte."),
    },
    hero: {
      kicker: t("Vender en HenryCo"),
      title: t("Selectivo por diseño. Pensado para vendedores que priorizan la confianza."),
      body: t("Henry Onyx Marketplace favorece a vendedores cuidadosos en la presentación, fiables en el cumplimiento y honestos con la protección al comprador. El nivel exigido se explica en esta página; la solicitud de vendedor continúa dentro de tu cuenta HenryCo."),
      primaryCta: t("Abrir solicitud de vendedor"),
      secondaryCta: t("Ver tarifas de vendedor"),
      signInCta: t("Iniciar sesión con cuenta HenryCo"),
      highlights: [
        { label: t("Selección"), value: t("Revisión manual, no pago por listar") },
        { label: t("Escaparate"), value: t("Pasaporte de confianza visible para compradores") },
        { label: t("Espacio"), value: t("Pedidos, pagos y soporte unificados") },
      ],
    },
    advantages: {
      kicker: t("Por qué triunfan aquí los vendedores más sólidos"),
      items: [
        { title: t("Posicionamiento basado en la confianza"), body: t("Tu tienda recibe un pasaporte de confianza visible, en lugar de quedar sepultada en el ruido de un marketplace de baja calidad.") },
        { title: t("Mejor calidad de escaparate"), body: t("Carriles editoriales, una búsqueda más calmada y fichas de producto más limpias ayudan a convertir mejor a las tiendas exigentes.") },
        { title: t("Operativa más nítida"), body: t("Pagos, pedidos, soporte, moderación y avisos de stock se mantienen visibles en un mismo espacio más claro.") },
      ],
    },
    onboarding: {
      kicker: t("Cómo funciona el onboarding"),
      stepLabel: t("Paso"),
      steps: [
        { step: "01", title: t("Iniciar la solicitud de vendedor"), body: t("Abre la solicitud desde tu cuenta HenryCo — los borradores se guardan automáticamente mientras reúnes la información.") },
        { step: "02", title: t("Añadir los datos del negocio"), body: t("Nombre de la empresa, perfil de tienda, enfoque de producto y los documentos de verificación que explican cómo cumples los pedidos.") },
        { step: "03", title: t("Revisión de la solicitud"), body: t("El equipo de HenryCo revisa documentos, señales de confianza y la solidez de la tienda — no solo una insignia de pago.") },
        { step: "04", title: t("Onboarding del vendedor"), body: t("Los vendedores aprobados continúan con el onboarding, donde tarifas, comisiones de publicación, ventanas de cobro y políticas son visibles antes de publicar.") },
      ],
      callout: {
        eyebrow: t("Una solicitud de vendedor más limpia"),
        body: t("El registro de vendedor permanece dentro de tu cuenta para que los datos del negocio, el estado de la revisión y las actualizaciones de aprobación queden privados y fáciles de seguir."),
      },
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
    trustTiers: {
      kicker: t("Los niveles de confianza cambian los privilegios"),
      title: t("Consigue cobros más rápidos, escaparates más amplios y ventajas en políticas."),
    },
    closing: {
      kicker: t("Avanzar"),
      title: t("Solicita y sigue el estado desde tu cuenta."),
      body: t("La aprobación desbloquea el onboarding de vendedor. Tarifas, comisiones de publicación y ventanas de cobro se ven antes de publicar — sin sorpresas contractuales después."),
      primaryCta: t("Iniciar solicitud"),
      secondaryCta: t("Ir al espacio de vendedor"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Tarifas para vendedores — Henry Onyx Marketplace"),
      description:
        t("Tarifas de plan, de publicación, de destacados, comisión por transacción y procesamiento de cobros se declaran por adelantado — antes de publicar inventario, no después."),
    },
    hero: {
      kicker: t("Tarifas para vendedores"),
      title: t("Economía clara. Sin comisiones ocultas."),
      body: t("Tarifas de plan, comisiones de publicación, slots destacados, comisión por transacción y procesamiento de cobros se declaran por adelantado — antes de publicar tu inventario, no después."),
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
    economics: {
      kicker: t("Cómo gana dinero HenryCo"),
      title: t("Declarado por adelantado, deducido a la vista."),
      items: [
        t("Las comisiones por transacción se descuentan en cada liquidación del grupo-pedido del vendedor antes de liberar el cobro."),
        t("Las tarifas de publicación se aplican una vez agotado el cupo de anuncios incluidos en el plan activo del vendedor."),
        t("La colocación destacada es una solicitud de pago aparte y queda sujeta a control de calidad y confianza."),
        t("Las comisiones por procesamiento de cobro se deducen en el resumen de liquidación del vendedor, no después por sorpresa."),
        t("Servicios de valor añadido Studio, Learn y Logistics abren vías adicionales de ingresos para los vendedores."),
        t("Las campañas controladas por el operador y los espacios patrocinados se mantienen auditables y no como caos autoservicio."),
      ],
    },
    trustTiers: {
      kicker: t("Cobros según nivel de confianza"),
      title: t("Un mejor comportamiento acorta las retenciones."),
    },
    closing: {
      kicker: t("¿Listo para postularte?"),
      title: t("La solicitud se abre en tu cuenta de HenryCo."),
      body: t("Puedes guardar el borrador y volver — la tarificación visible aquí se aplica una vez completado el onboarding de vendedor."),
      primaryCta: t("Postularme como vendedor"),
      secondaryCta: t("Estándares de confianza"),
    },
  },
  trust: {
    metadata: {
      title: t("Confianza y seguridad — Henry Onyx Marketplace"),
      description:
        t("La confianza define lo que puede hacer un vendedor, cómo se mueve el dinero y cómo responde la moderación. Niveles de vendedor, custodia, disputas y liberación de pagos dejan rastro en el servidor."),
    },
    hero: {
      kicker: t("Confianza y seguridad"),
      title: t("Visible antes del pago. Aplicada después."),
      body: t("La confianza rige lo que puede hacer un vendedor, cómo circula el dinero y cómo reacciona la moderación. Niveles de vendedor, riesgo del comprador, puntuación de anuncios, custodia, disputas y liberación de pagos dejan registro en el servidor."),
      pillars: [
        { label: t("Movimiento de dinero"), value: t("En custodia, liberado tras controles") },
        { label: t("Reseñas"), value: t("Registradas en servidor, rastreables en disputa") },
        { label: t("Niveles"), value: t("Ganados, revocables") },
      ],
    },
    guardrails: {
      kicker: t("Cuatro salvaguardas"),
      items: [
        {
          title: t("Pasaportes de confianza"),
          body: t("Cada tienda y producto expone el nivel de verificación, el SLA, la tasa de disputas, la preparación para el pago y la postura de cumplimiento."),
        },
        {
          title: t("Control de custodia"),
          body: t("Los fondos del comprador los retiene HenryCo primero y solo se liberan al pago cuando la entrega y los controles de confianza están validados."),
        },
        {
          title: t("Revisión antifraude"),
          body: t("Desvíos de pago fuera de la plataforma, medios duplicados, picos de publicación y patrones de pago de riesgo entran en la visibilidad de la cola."),
        },
        {
          title: t("Pistas de auditoría"),
          body: t("Aprobaciones, rechazos, acciones de pago, decisiones de disputa y barridos automatizados quedan registrados en el servidor."),
        },
      ],
    },
    sellerLadder: {
      kicker: t("Escala de confianza del vendedor"),
      title: t("Niveles ganados con el comportamiento, no comprados."),
    },
    policySurfaces: {
      kicker: t("Superficies de políticas"),
      title: t("Los estándares a los que nos comprometemos."),
    },
    ecosystem: {
      kicker: t("Refuerzo de confianza en el ecosistema"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Descubre {collection} en Henry Onyx Marketplace — una selección curada de productos verificados, con señales de confianza, claridad en la entrega y pasaportes de vendedor visibles antes del pago."),
      fallbackDescription:
        t("Una colección curada en Henry Onyx Marketplace, con productos verificados, señales de confianza, entrega clara y pasaportes de vendedor visibles antes del pago."),
    },
    hero: {
      primaryCta: t("Abrir búsqueda completa"),
      secondaryCta: t("Estándares de confianza"),
    },
    sidebar: {
      itemsLabel: t("Artículos de la colección"),
      editedByLabel: t("Editada por"),
      editedByValue: t("Operaciones del Marketplace"),
      buyerProtectionLabel: t("Protección al comprador"),
      buyerProtectionValue: t("Pago en custodia"),
    },
    rail: {
      kicker: t("Lo que trae la selección"),
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
      enforcementLabel: t("Aplicación"),
      updatedLabel: t("Actualizado"),
    },
    coverageBySlug: {
      buyerProtection: t("Compradores"),
      sellerPolicy: t("Vendedores"),
      fallback: t("Participantes del marketplace"),
    },
    enforcementBySlug: {
      buyerProtection: t("Pagos en custodia + congelación por disputa"),
      sellerPolicy: t("Revisión por nivel de confianza + reserva de pago"),
      fallback: t("Registro auditable en servidor"),
    },
    updatedBySlug: {
      buyerProtection: t("Al revisar pagos y disputas"),
      sellerPolicy: t("Al revisar los estándares del vendedor"),
      fallback: t("Al revisar la política"),
    },
    provisions: {
      kicker: t("Disposiciones de la política"),
    },
    ecosystem: {
      kicker: t("Controles conectados del marketplace"),
      openLabel: t("Abrir"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{title} en Henry Onyx Marketplace — stock verificado, entrega fiable y pasaporte del vendedor visibles antes del pago."),
      fallbackDescription:
        t("Un anuncio verificado en Henry Onyx Marketplace con señales de confianza, claridad de entrega y pasaporte del vendedor visibles antes del pago."),
    },
    fulfillment: {
      sellerTrustLabel: t("Confianza del vendedor"),
      sellerTrustValueTemplate: t("Pasaporte de {vendor} visible"),
      sellerTrustValueFallback: t("Pasaporte del vendedor pendiente"),
      availabilityLabel: t("Disponibilidad"),
      availabilityValueSingular: t("{count} unidad en stock actual"),
      availabilityValuePlural: t("{count} unidades en stock actual"),
      fulfillmentLabel: t("Entrega"),
      paymentLabel: t("Pago"),
      paymentValueCod: t("Pago contra entrega o transferencia verificada"),
      paymentValueVerified: t("Flujo por transferencia verificada"),
    },
    price: {
      label: t("Precio"),
      leadTimeLabel: t("Plazo de entrega"),
    },
    safety: {
      kicker: t("Por qué este anuncio inspira más confianza"),
      stockTemplate: t("{count} unidades visibles ahora mismo en el inventario"),
      codEligible: t("Pago contra entrega disponible donde se admite"),
      codFallback: t("Flujo de verificación manual disponible"),
      vendorLinkedTemplate: t("El pasaporte del vendedor {vendor} está enlazado directamente desde esta página"),
      vendorPending: t("La superficie de confianza del vendedor todavía está pendiente de enlace"),
      reviewsTemplateSingular: t("{count} reseña con valoración media de {rating}"),
      reviewsTemplatePlural: t("{count} reseñas con valoración media de {rating}"),
    },
    detail: {
      kicker: t("Detalle del producto"),
      title: t("Todo lo importante antes de pagar."),
      deliverySummaryTitle: t("Entrega, soporte y atención posventa"),
      deliveryFallback: t("Las ventanas de entrega se aclararán al finalizar la compra."),
      deliveryTail:
        t("Los pedidos se mantienen trazables desde el pago hasta la entrega, y las disputas o hilos de soporte se vinculan al mismo registro de pedido."),
      specsTitle: t("Especificaciones y claridad del material"),
      passportTitle: t("Pasaporte de la tienda y descubrimientos relacionados"),
      visitVendorTemplate: t("Visitar {vendor}"),
      exploreCategoryTemplate: t("Explorar {category}"),
      seeBrandTemplate: t("Ver {brand}"),
    },
    related: {
      kicker: t("Completa el conjunto"),
      title: t("Más en el mismo contexto de compra."),
      body: t("Las recomendaciones se mantienen curadas y limpias, sin ruido comercial."),
    },
    reviews: {
      kicker: t("Lo más destacado de las reseñas"),
      title: t("Señales de compra verificadas, sin ruido innecesario."),
      verifiedPurchase: t("Compra verificada"),
      reviewLabel: t("Reseña"),
    },
    rail: {
      kicker: t("Quienes vieron esto también compraron"),
      headline: t("Sigue navegando sin perder el hilo."),
      caption:
        t("Las señales de co-compra y de categoría afín muestran el siguiente paso obvio, sin saturar con ofertas innecesarias."),
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
      t("O Henry Onyx Marketplace transforma o comércio multifornecedor numa experiência mais serena: descoberta mais clara, adição rápida a partir de cada cartão, clareza nos pedidos divididos, melhores passaportes de vendedor e uma única conta HenryCo para encomendas, pagamentos, avaliações e suporte."),
    primaryCta: t("Explorar o catálogo"),
    secondaryCta: t("Vender na HenryCo"),
    quickCards: [
      { title: t("Adição rápida em todo o lado"), body: t("Controlos discretos de carrinho ao nível do cartão, atualizações instantâneas do mini-carrinho e sem recarregamentos atrapalhados.") },
      { title: t("Trilhos de confiança verificados"), body: t("Passaportes de vendedor, promessas de entrega, qualidade das avaliações e propriedade do stock permanecem fáceis de ler.") },
      { title: t("Uma conta, menos fricção"), body: t("Encomendas, pagamentos, lista de desejos, seguimentos e notificações ficam juntos numa única conta HenryCo.") },
    ],
    whyKicker: t("Porque é diferente"),
    whyTitle: t("A confiança é visível antes do pagamento."),
    whyCards: [
      { title: t("A confiança é visível antes do pagamento"), body: t("O nível de verificação, a taxa de disputas, a capacidade de resposta do suporte e a fiabilidade do cumprimento ficam perto da decisão de compra.") },
      { title: t("A clareza dos pedidos divididos continua legível"), body: t("Quando o stock vem de vários vendedores ou da HenryCo, a segmentação de entrega permanece evidente em vez de se tornar uma confusão no checkout.") },
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
      t("As candidaturas de vendedores, a moderação e as aprovações são revistas em canais dedicados da HenryCo."),
      t("As atualizações de encomenda, avaliações, suporte e pagamentos permanecem ligados à mesma conta de comprador."),
      t("Suporte, revisão de pagamentos e operações de entrega mantêm-se organizados para que as respostas continuem coerentes."),
    ],
    sellerKicker: t("Qualidade do vendedor"),
    sellerTitle: t("Os vendedores sérios começam dentro da sua conta HenryCo."),
    sellerBody:
      t("Os visitantes públicos podem conhecer a venda em /sell, enquanto a candidatura, o progresso do rascunho, as atualizações de revisão e o estado de aprovação permanecem dentro da experiência do vendedor."),
    sellerBullets: [
      t("Guarda de rascunhos e visibilidade do progresso"),
      t("Tratamento privado de documentos no lugar certo"),
      t("Atualizações claras de aprovação para cada vendedor"),
    ],
  },
  kpiLabels: {
    verifiedStores: t("Lojas verificadas"),
    activeListings: t("Anúncios ativos"),
    trustRating: t("Pontuação de confiança"),
  },
  kpiHints: {
    verifiedStores: t("Vendedores curados e inventário da HenryCo com responsabilidade mais clara."),
    activeListings: t("Anúncios aprovados apresentados com clareza de entrega, confiança e propriedade."),
    trustRating: t("A qualidade das avaliações do marketplace e a fiabilidade do vendedor aparecem antes do pagamento."),
  },
  footer: {
    brandSubtitle: t("Comércio refinado com uma conta HenryCo ligada"),
    brandBody:
      t("O Henry Onyx Marketplace foi concebido para compras de alta confiança, vendedores verificados e uma experiência mais limpa do pagamento à entrega."),
    shopTitle: t("Comprar"),
    sellTitle: t("Vender"),
    supportTitle: t("Suporte"),
    supportBody:
      t("Encomendas, conversas com vendedores, atualizações de suporte e registos de pagamento permanecem ligados numa única conta HenryCo."),
    shopLinks: [
      { href: "/search", label: t("Pesquisar no marketplace") },
      { href: "/deals", label: t("Ofertas e edições limitadas") },
      { href: "/trust", label: t("Passaporte de confiança") },
      { href: "/policies/buyer-protection", label: t("Política de proteção do comprador") },
      { href: "/help", label: t("Suporte e resolução") },
    ],
    sellLinks: [
      { href: "/sell", label: t("Porquê vender na HenryCo") },
      { href: "/sell/pricing", label: t("Preços e taxas do vendedor") },
      { href: "/policies/seller-policy", label: t("Política do vendedor") },
      { href: "/account/seller-application", label: t("Candidatura de vendedor") },
      { href: "/vendor", label: t("Espaço do vendedor") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("Stock HenryCo"),
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
      title: t("Um carrinho premium com edições mais ágeis e clareza nas entregas divididas."),
      description:
        t("O carrinho mantém o agrupamento por vendedor visível, atualiza quantidades rapidamente e permanece ligado à gaveta do mini-carrinho para que os compradores nunca percam o contexto perto da finalização."),
    },
    emptyState: {
      title: t("O teu carrinho ainda está vazio."),
      body: t("Adiciona rapidamente a partir dos cartões de produto, guarda itens para depois, e o carrinho mantém-se atualizado no mini-carrinho e no carrinho completo sem precisares de recarregar."),
      ctaLabel: t("Explorar produtos"),
    },
  },
  track: {
    metadata: {
      title: t("Acompanhamento do pedido — Henry Onyx Marketplace"),
      description:
        t("Acompanha cada segmento de vendedor, atualização de pagamento e marco de entrega num só lugar. O depósito em garantia mantém-se ativo até confirmar a entrega."),
    },
    hero: {
      kicker: t("Acompanhamento do pedido"),
      titlePrefix: t("Acompanhamento"),
      body: t("A clareza dos pedidos divididos permanece visível aqui: cada segmento de vendedor, atualização de pagamento e marco de entrega ocupa a sua própria linha para alinhar o suporte e as expectativas do comprador."),
      orderValueLabel: t("Valor do pedido"),
      paymentLabel: t("Pagamento"),
      payoutControlLabel: t("Controlo do pagamento ao vendedor"),
      payoutFrozen: t("Congelado"),
      payoutEscrowActive: t("Depósito ativo"),
    },
    paymentRecord: {
      kicker: t("Registo de pagamento"),
      walletBody: t("O saldo da carteira foi debitado e o pedido fica em depósito até à entrega."),
      proofBody: t("O comprovativo de transferência foi anexado para análise da equipa financeira da HenryCo."),
      awaitingBody: t("O pagamento aguarda a evidência financeira ou a reconciliação na entrega."),
      methodLabel: t("Método"),
      statusLabel: t("Estado"),
      proofLabel: t("Comprovativo"),
      viewProof: t("Ver comprovativo"),
      walletDebit: t("Débito de carteira"),
      pending: t("Pendente"),
    },
    timeline: {
      kicker: t("Cronologia"),
      title: t("Marcos visíveis para o cliente, por ordem."),
    },
    segments: {
      kicker: t("Segmentos de vendedor"),
      title: t("Cada vendedor responde pela sua própria expedição."),
      henrycoSegment: t("Segmento HenryCo"),
      fulfillmentLabel: t("Expedição"),
      trackingLabel: t("Acompanhamento"),
      payoutLabel: t("Pagamento"),
      trackingPending: t("Pendente"),
    },
    completion: {
      kicker: t("Confirmação de receção"),
      body: t("Confirma a receção quando o pedido estiver satisfatório. A HenryCo só liberta o pagamento ao vendedor após confirmação da entrega ou quando o pedido cumpre a libertação automática."),
      confirmCta: t("Confirmar receção"),
    },
    help: {
      kicker: t("Precisas de ajuda?"),
      title: t("Disputas, reembolsos e questões de entrega seguem por um único fio."),
      body: t("Abre um fio de suporte com este número de pedido anexado para que o agente veja toda a cronologia e a divisão por vendedor sem teres de escrever tudo de novo."),
      openSupportCta: t("Abrir fio de suporte"),
      viewAllOrdersCta: t("Ver todos os pedidos"),
    },
  },
  deals: {
    metadata: {
      title: t("Ofertas verificadas — Henry Onyx Marketplace"),
      description:
        t("Descontos filtrados por confiança, certeza de stock e responsabilidade do vendedor. Na página de ofertas da HenryCo só aparecem anúncios verificados com sinais limpos."),
    },
    pageIntro: {
      kicker: t("Ofertas verificadas"),
      title: t("Descontos filtrados por confiança, certeza de stock e responsabilidade do vendedor."),
      description:
        t("Só destacamos ofertas quando a qualidade do anúncio, o passaporte de confiança do vendedor e o estado do stock estão limpos o suficiente para proteger a conversão e reduzir o arrependimento de quem compra."),
    },
    sectionLabel: t("Ofertas verificadas"),
    listEyebrow: t("Ofertas verificadas"),
    refreshNote: t("Atualizadas com regularidade"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("Sem ofertas verificadas neste momento"),
      body: t("Os descontos verificados surgem à medida que os vendedores os publicam. Volta em breve."),
    },
  },
  brand: {
    eyebrow: t("Marca"),
    bodyFallback:
      t("Uma loja verificada na Henry Onyx Marketplace, com sinais de confiança, clareza de entrega e passaporte do vendedor visíveis antes do pagamento."),
    searchCta: t("Pesquisar nesta marca"),
    trustCta: t("Padrões de confiança"),
    stats: {
      activeProducts: t("Produtos ativos"),
      listingsReviewed: t("Anúncios revistos"),
      listingsReviewedValue: t("Passaporte de confiança visível por item"),
      buyerProtection: t("Proteção ao comprador"),
      buyerProtectionValue: t("Pagamento em custódia"),
    },
    liveKicker: t("Em direto de {brand}"),
    openFullSearch: t("Abrir pesquisa completa"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Explora produtos verificados de {brand} na Henry Onyx Marketplace, com sinais de confiança, clareza de entrega e passaportes de vendedor visíveis antes do pagamento."),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Explora os produtos verificados de {store} na Henry Onyx Marketplace, com sinais de confiança, clareza de entrega e o passaporte do vendedor visíveis antes do pagamento."),
    metadataDescriptionFallback:
      t("Uma loja verificada na Henry Onyx Marketplace, com sinais de confiança, clareza de entrega e passaporte do vendedor visíveis antes de cada pagamento."),
    hero: {
      eyebrow: t("Passaporte da loja"),
      bodyFallback:
        t("Um vendedor verificado na Henry Onyx Marketplace, com sinais de confiança, clareza de entrega e um passaporte transparente visível antes de cada pagamento."),
    },
    stats: {
      trustScore: t("Pontuação de confiança"),
      responseSla: t("Prazo de resposta"),
      responseSlaSuffix: t(" h"),
      followers: t("Seguidores"),
    },
    standards: {
      eyebrow: t("Padrões da loja"),
    },
    support: {
      eyebrow: t("Suporte"),
      contactLinkLabel: t("Usa a Henry Onyx Marketplace para contactar esta loja"),
      contactBodySuffix:
        t(" — as mensagens ficam registadas e ligadas à referência do teu pedido para que cada atualização permaneça num só lugar."),
      ctaLabel: t("Contactar esta loja"),
      subjectTemplate: t("Pergunta para {store}"),
    },
    reviews: {
      eyebrow: t("Avaliações recentes"),
      verifiedPurchase: t("Compra verificada"),
      review: t("Avaliação"),
    },
    catalog: {
      kicker: t("Catálogo da loja"),
      title: t("Tudo o que esta loja tem em direto neste momento."),
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
    collectionsRail: {
      kicker: t("Seleções curadas"),
      title: t("Coleções que encurtam a decisão de compra."),
    },
    catalog: {
      kicker: t("Catálogo da categoria"),
      title: t("Produtos premium, hierarquia mais nítida."),
      openSearch: t("Abrir pesquisa completa"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Explora produtos verificados em {category} na Henry Onyx Marketplace, com sinais de confiança, clareza de entrega e passaportes de vendedor visíveis antes do pagamento."),
      fallbackDescription:
        t("Percorre uma categoria curada da Henry Onyx Marketplace com sinais de confiança, clareza de entrega e passaportes de vendedor antes do pagamento."),
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
      body: t("Pesquisa os temas que compradores e vendedores mais perguntam. Se não encontrares o que precisas, abre um pedido de apoio no fim desta página e alguém da equipa lê-o."),
    },
    stillNeedHelp: {
      kicker: t("Continuas a precisar de ajuda"),
      title: t("Abre um pedido de apoio e uma pessoa lê-o."),
      body: t("Os pedidos mantêm todo o contexto ligado — a encomenda, o vendedor, o histórico do litígio — para que a equipa trate do assunto sem precisares de reescrever a cada resposta."),
      ctaLabel: t("Abrir um pedido de apoio"),
    },
  },
  sell: {
    metadata: {
      title: t("Vender na HenryCo — marketplace seletivo para vendedores de confiança"),
      description:
        t("Candidata-te para vender na Henry Onyx Marketplace: posicionamento de confiança, montras premium e um espaço unificado para encomendas, pagamentos e apoio."),
    },
    hero: {
      kicker: t("Vender na HenryCo"),
      title: t("Seletiva por natureza. Pensada para vendedores que apostam na confiança."),
      body: t("A Henry Onyx Marketplace prefere vendedores cuidadosos na apresentação, fiáveis no cumprimento e honestos na proteção ao comprador. O nível exigido fica explícito nesta página; a candidatura de vendedor continua dentro da tua conta HenryCo."),
      primaryCta: t("Abrir candidatura de vendedor"),
      secondaryCta: t("Ver preços de vendedor"),
      signInCta: t("Iniciar sessão com a conta HenryCo"),
      highlights: [
        { label: t("Seleção"), value: t("Análise manual, sem listagem paga") },
        { label: t("Montra"), value: t("Passaporte de confiança visível para compradores") },
        { label: t("Espaço"), value: t("Encomendas, pagamentos e apoio unificados") },
      ],
    },
    advantages: {
      kicker: t("Porque vencem aqui os vendedores mais fortes"),
      items: [
        { title: t("Posicionamento de confiança"), body: t("A tua loja recebe um passaporte de confiança visível, em vez de se perder no ruído de um marketplace de baixa qualidade.") },
        { title: t("Melhor qualidade de montra"), body: t("Carris editoriais, uma pesquisa mais calma e cartões de produto mais limpos ajudam lojas exigentes a converter melhor.") },
        { title: t("Operação mais nítida"), body: t("Pagamentos, encomendas, apoio, moderação e alertas de stock ficam visíveis num espaço de trabalho mais claro.") },
      ],
    },
    onboarding: {
      kicker: t("Como funciona o onboarding"),
      stepLabel: t("Passo"),
      steps: [
        { step: "01", title: t("Iniciar a candidatura de vendedor"), body: t("Abre a candidatura a partir da tua conta HenryCo — os rascunhos são guardados automaticamente enquanto reúnes os detalhes.") },
        { step: "02", title: t("Adicionar dados do negócio"), body: t("Nome da empresa, perfil da loja, foco de produto e quaisquer documentos de verificação que expliquem como cumpres encomendas.") },
        { step: "03", title: t("Análise da candidatura"), body: t("A equipa HenryCo analisa documentos, sinais de confiança e a robustez da loja — não apenas um emblema pago.") },
        { step: "04", title: t("Onboarding de vendedor"), body: t("Os vendedores aprovados seguem para o onboarding onde preços, taxas de publicação, janelas de pagamento e regras ficam visíveis antes de publicares.") },
      ],
      callout: {
        eyebrow: t("Uma candidatura de vendedor mais limpa"),
        body: t("O registo de vendedor mantém-se dentro da tua conta para que os dados do negócio, o estado da análise e as atualizações de aprovação fiquem privados e fáceis de seguir."),
      },
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
    trustTiers: {
      kicker: t("Os patamares de confiança mudam os privilégios"),
      title: t("Conquista pagamentos mais rápidos, montras maiores e vantagens nas políticas."),
    },
    closing: {
      kicker: t("Avançar"),
      title: t("Candidata-te e acompanha o estado a partir da tua conta."),
      body: t("A aprovação desbloqueia o onboarding de vendedor. Preços, taxas de publicação e janelas de pagamento são visíveis antes de publicares — sem surpresas contratuais depois."),
      primaryCta: t("Iniciar candidatura"),
      secondaryCta: t("Ir ao espaço de vendedor"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Preços para vendedores — Henry Onyx Marketplace"),
      description:
        t("Taxas de plano, taxas de publicação, taxas de destaque, comissão por transação e processamento de pagamento são todas declaradas à partida — antes de publicares inventário, não depois."),
    },
    hero: {
      kicker: t("Preços para vendedores"),
      title: t("Economia clara. Sem taxas escondidas."),
      body: t("Taxas de plano, taxas de publicação, taxas de destaque, comissão por transação e processamento de pagamento são todas declaradas à partida — antes de publicares o teu inventário, não depois."),
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
    economics: {
      kicker: t("Como a HenryCo ganha dinheiro"),
      title: t("Declarado à partida, deduzido à vista."),
      items: [
        t("As comissões por transação são deduzidas em cada liquidação do grupo-encomenda do vendedor antes da libertação do pagamento."),
        t("As taxas de publicação aplicam-se depois de esgotada a quota de anúncios incluídos no plano ativo do vendedor."),
        t("A colocação em destaque é um pedido pago à parte e fica sujeita a revisão de qualidade e confiança."),
        t("As taxas de processamento de pagamento são deduzidas no resumo de liquidação do vendedor, não em surpresa depois."),
        t("Os serviços de valor acrescentado Studio, Learn e Logistics abrem vias adicionais de receita para vendedores."),
        t("As campanhas controladas pelo operador e os espaços patrocinados mantêm-se auditáveis e nunca em autosserviço caótico."),
      ],
    },
    trustTiers: {
      kicker: t("Tempos de pagamento por nível de confiança"),
      title: t("Melhor comportamento encurta as retenções."),
    },
    closing: {
      kicker: t("Pronto para te candidatares?"),
      title: t("A candidatura abre na tua conta HenryCo."),
      body: t("Podes guardar o rascunho e voltar — a tarificação visível aqui aplica-se assim que o onboarding de vendedor estiver concluído."),
      primaryCta: t("Candidatar como vendedor"),
      secondaryCta: t("Padrões de confiança"),
    },
  },
  trust: {
    metadata: {
      title: t("Confiança e segurança — Henry Onyx Marketplace"),
      description:
        t("A confiança define o que um vendedor pode fazer, como o dinheiro se move e como a moderação responde. Níveis de vendedor, custódia, disputas e libertação de pagamentos deixam rasto no servidor."),
    },
    hero: {
      kicker: t("Confiança e segurança"),
      title: t("Visível antes do pagamento. Aplicada depois."),
      body: t("A confiança rege o que um vendedor pode fazer, como o dinheiro circula e como a moderação responde. Níveis de vendedor, risco do comprador, pontuação de anúncios, custódia, disputas e libertação de pagamentos deixam registo no servidor."),
      pillars: [
        { label: t("Movimento de dinheiro"), value: t("Em custódia, libertado após verificações") },
        { label: t("Avaliações"), value: t("Registadas no servidor, rastreáveis em disputa") },
        { label: t("Níveis"), value: t("Conquistados, revogáveis") },
      ],
    },
    guardrails: {
      kicker: t("Quatro salvaguardas"),
      items: [
        {
          title: t("Passaportes de confiança"),
          body: t("Cada loja e produto mostra o nível de verificação, SLA, taxa de disputas, prontidão para pagamento e postura de cumprimento."),
        },
        {
          title: t("Controlo da custódia"),
          body: t("Os fundos do comprador ficam primeiro retidos pela HenryCo e só são libertados após confirmação da entrega e das verificações de confiança."),
        },
        {
          title: t("Revisão antifraude"),
          body: t("Desvios de pagamento fora da plataforma, mídias duplicadas, picos de publicação e padrões de pagamento de risco entram na visibilidade da fila."),
        },
        {
          title: t("Trilhas de auditoria"),
          body: t("Aprovações, recusas, ações de pagamento, decisões de disputa e varreduras automatizadas ficam registadas no servidor."),
        },
      ],
    },
    sellerLadder: {
      kicker: t("Escala de confiança do vendedor"),
      title: t("Níveis conquistados pelo comportamento, não comprados."),
    },
    policySurfaces: {
      kicker: t("Superfícies das políticas"),
      title: t("Os padrões que assumimos."),
    },
    ecosystem: {
      kicker: t("Reforço de confiança no ecossistema"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Explore {collection} no Henry Onyx Marketplace — uma seleção curada de produtos verificados, com sinais de confiança, entrega clara e passaportes de vendedor visíveis antes do checkout."),
      fallbackDescription:
        t("Uma coleção curada no Henry Onyx Marketplace, com produtos verificados, sinais de confiança, entrega clara e passaportes de vendedor visíveis antes do checkout."),
    },
    hero: {
      primaryCta: t("Abrir busca completa"),
      secondaryCta: t("Padrões de confiança"),
    },
    sidebar: {
      itemsLabel: t("Itens da coleção"),
      editedByLabel: t("Editada por"),
      editedByValue: t("Operações do Marketplace"),
      buyerProtectionLabel: t("Proteção ao comprador"),
      buyerProtectionValue: t("Pagamento sob custódia"),
    },
    rail: {
      kicker: t("O que está nesta seleção"),
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
      enforcementLabel: t("Fiscalização"),
      updatedLabel: t("Atualizado"),
    },
    coverageBySlug: {
      buyerProtection: t("Compradores"),
      sellerPolicy: t("Vendedores"),
      fallback: t("Participantes do marketplace"),
    },
    enforcementBySlug: {
      buyerProtection: t("Pagamentos sob custódia + congelamento por disputa"),
      sellerPolicy: t("Revisão por nível de confiança + reserva de payout"),
      fallback: t("Registo auditável no servidor"),
    },
    updatedBySlug: {
      buyerProtection: t("Em revisões de pagamento e disputa"),
      sellerPolicy: t("Em revisões dos padrões do vendedor"),
      fallback: t("Em revisões de política"),
    },
    provisions: {
      kicker: t("Disposições da política"),
    },
    ecosystem: {
      kicker: t("Controlos conectados do marketplace"),
      openLabel: t("Abrir"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{title} no Henry Onyx Marketplace — stock verificado, entrega fiável e passaporte do vendedor visíveis antes do pagamento."),
      fallbackDescription:
        t("Um anúncio verificado no Henry Onyx Marketplace, com sinais de confiança, clareza de entrega e passaporte do vendedor visíveis antes do pagamento."),
    },
    fulfillment: {
      sellerTrustLabel: t("Confiança do vendedor"),
      sellerTrustValueTemplate: t("Passaporte de {vendor} visível"),
      sellerTrustValueFallback: t("Passaporte do vendedor pendente"),
      availabilityLabel: t("Disponibilidade"),
      availabilityValueSingular: t("{count} unidade em stock atual"),
      availabilityValuePlural: t("{count} unidades em stock atual"),
      fulfillmentLabel: t("Entrega"),
      paymentLabel: t("Pagamento"),
      paymentValueCod: t("Pagamento na entrega ou transferência verificada"),
      paymentValueVerified: t("Fluxo por transferência verificada"),
    },
    price: {
      label: t("Preço"),
      leadTimeLabel: t("Prazo de entrega"),
    },
    safety: {
      kicker: t("Porque este anúncio inspira mais confiança"),
      stockTemplate: t("{count} unidades atualmente visíveis no inventário"),
      codEligible: t("Pagamento na entrega disponível onde for suportado"),
      codFallback: t("Fluxo de verificação manual disponível"),
      vendorLinkedTemplate: t("O passaporte do vendedor {vendor} está ligado diretamente a partir desta página"),
      vendorPending: t("A superfície de confiança do vendedor ainda está por ligar"),
      reviewsTemplateSingular: t("{count} avaliação com média de {rating}"),
      reviewsTemplatePlural: t("{count} avaliações com média de {rating}"),
    },
    detail: {
      kicker: t("Detalhe do produto"),
      title: t("Tudo o que importa antes de pagar."),
      deliverySummaryTitle: t("Entrega, suporte e cuidado pós-encomenda"),
      deliveryFallback: t("As janelas de entrega serão esclarecidas no checkout."),
      deliveryTail:
        t("As encomendas mantêm-se rastreáveis do pagamento até à entrega, e disputas ou tópicos de suporte permanecem ligados ao mesmo registo de encomenda."),
      specsTitle: t("Especificações e clareza dos materiais"),
      passportTitle: t("Passaporte da loja e descobertas relacionadas"),
      visitVendorTemplate: t("Visitar {vendor}"),
      exploreCategoryTemplate: t("Explorar {category}"),
      seeBrandTemplate: t("Ver {brand}"),
    },
    related: {
      kicker: t("Completar o conjunto"),
      title: t("Mais dentro do mesmo contexto de compra."),
      body: t("As recomendações mantêm-se cuidadas e sóbrias, sem ruído comercial excessivo."),
    },
    reviews: {
      kicker: t("Destaques das avaliações"),
      title: t("Sinais de compra verificados, sem ruído desnecessário."),
      verifiedPurchase: t("Compra verificada"),
      reviewLabel: t("Avaliação"),
    },
    rail: {
      kicker: t("Clientes também compraram"),
      headline: t("Continue a navegar sem perder o seu lugar."),
      caption:
        t("Sinais de co-compra e de categoria semelhante mostram o próximo passo óbvio, sem encher de promoções inúteis."),
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
      t("Henry Onyx Marketplace macht aus Multi-Anbieter-Handel ein ruhigeres Erlebnis: klarere Entdeckung, schnelles Hinzufügen direkt von jeder Karte, transparente geteilte Bestellungen, stärkere Verkäuferpässe und ein einziges HenryCo-Konto für Bestellungen, Zahlungen, Bewertungen und Support."),
    primaryCta: t("Katalog entdecken"),
    secondaryCta: t("Auf HenryCo verkaufen"),
    quickCards: [
      { title: t("Schnelles Hinzufügen überall"), body: t("Dezente Warenkorbsteuerung auf Kartenebene, sofortige Mini-Warenkorb-Updates und keine umständlichen Reloads.") },
      { title: t("Verifizierte Vertrauensschienen"), body: t("Verkäuferpässe, Lieferversprechen, Bewertungsqualität und Bestandsbesitz bleiben einfach lesbar.") },
      { title: t("Ein Konto, weniger Reibung"), body: t("Bestellungen, Zahlungen, Wunschliste, Follows und Benachrichtigungen bleiben in einem HenryCo-Konto vereint.") },
    ],
    whyKicker: t("Warum sich das anders anfühlt"),
    whyTitle: t("Vertrauen ist vor der Zahlung sichtbar."),
    whyCards: [
      { title: t("Vertrauen ist vor der Zahlung sichtbar"), body: t("Verifizierungsgrad, Streitfallquote, Reaktionsfähigkeit des Supports und Zuverlässigkeit der Erfüllung bleiben nahe an der Kaufentscheidung.") },
      { title: t("Klarheit bei geteilten Bestellungen bleibt lesbar"), body: t("Wenn der Bestand von verschiedenen Verkäufern oder aus HenryCo-Lager kommt, bleibt die Liefersegmentierung offensichtlich, statt zu Checkout-Verwirrung zu führen.") },
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
      t("Verkäuferbewerbungen, Moderation und Freigaben laufen durch dedizierte HenryCo-Prüfschienen."),
      t("Bestellaktualisierungen, Bewertungen, Support und Zahlungen bleiben mit demselben Käuferkonto verbunden."),
      t("Support, Zahlungsprüfung und Lieferoperationen bleiben organisiert, damit die Antworten konsistent bleiben."),
    ],
    sellerKicker: t("Verkäuferqualität"),
    sellerTitle: t("Ernsthafte Verkäufer starten in ihrem HenryCo-Konto."),
    sellerBody:
      t("Öffentliche Besucher können auf /sell mehr über den Verkauf erfahren, während Bewerbung, Entwurfsfortschritt, Prüfungs­updates und Freigabestatus innerhalb des Verkäufer-Erlebnisses bleiben."),
    sellerBullets: [
      t("Speicherung von Entwürfen und Sichtbarkeit des Fortschritts"),
      t("Vertrauliche Dokumentenverwaltung am richtigen Ort"),
      t("Klare Freigabeupdates für jeden Verkäufer"),
    ],
  },
  kpiLabels: {
    verifiedStores: t("Verifizierte Shops"),
    activeListings: t("Aktive Angebote"),
    trustRating: t("Vertrauensbewertung"),
  },
  kpiHints: {
    verifiedStores: t("Kuratierte Verkäufer und HenryCo-eigener Bestand mit klarerer Verantwortlichkeit."),
    activeListings: t("Genehmigte Angebote mit Liefer-, Vertrauens- und Eigentumsklarheit angezeigt."),
    trustRating: t("Marketplace-Bewertungsqualität und Verkäuferzuverlässigkeit erscheinen vor der Zahlung."),
  },
  footer: {
    brandSubtitle: t("Veredelter Handel mit einem verbundenen HenryCo-Konto"),
    brandBody:
      t("Henry Onyx Marketplace ist für Einkäufe mit hohem Vertrauen, verifizierte Verkäufer und ein saubereres Erlebnis vom Checkout bis zur Lieferung gebaut."),
    shopTitle: t("Einkaufen"),
    sellTitle: t("Verkaufen"),
    supportTitle: t("Support"),
    supportBody:
      t("Bestellungen, Verkäufergespräche, Support-Updates und Zahlungseinträge bleiben in einem HenryCo-Konto verbunden."),
    shopLinks: [
      { href: "/search", label: t("Im Marketplace suchen") },
      { href: "/deals", label: t("Angebote und zeitlich begrenzte Editionen") },
      { href: "/trust", label: t("Vertrauenspass") },
      { href: "/policies/buyer-protection", label: t("Käuferschutzrichtlinie") },
      { href: "/help", label: t("Support und Lösung") },
    ],
    sellLinks: [
      { href: "/sell", label: t("Warum auf HenryCo verkaufen") },
      { href: "/sell/pricing", label: t("Preise und Gebühren für Verkäufer") },
      { href: "/policies/seller-policy", label: t("Verkäuferrichtlinie") },
      { href: "/account/seller-application", label: t("Verkäuferbewerbung") },
      { href: "/vendor", label: t("Verkäufer-Arbeitsbereich") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("Von HenryCo geführt"),
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
      title: t("Ein Premium-Warenkorb mit schnelleren Anpassungen und klarer Übersicht bei geteilten Bestellungen."),
      description:
        t("Der Warenkorb hält die Händler-Gruppierung sichtbar, aktualisiert Mengen zügig und bleibt mit der Mini-Warenkorb-Schublade verbunden, damit Käufer:innen kurz vor dem Checkout den Überblick behalten."),
    },
    emptyState: {
      title: t("Dein Warenkorb ist noch leer."),
      body: t("Füge schnell aus den Produktkarten hinzu, merke dir Artikel für später, und der Warenkorb bleibt sowohl in der Mini-Schublade als auch in der Vollansicht aktuell – ganz ohne Reload."),
      ctaLabel: t("Produkte entdecken"),
    },
  },
  track: {
    metadata: {
      title: t("Bestellverfolgung — Henry Onyx Marketplace"),
      description:
        t("Verfolge jedes Händler-Segment, jede Zahlungsaktualisierung und jeden Versandmeilenstein an einem Ort. Die Treuhand bleibt aktiv, bis die Lieferung bestätigt ist."),
    },
    hero: {
      kicker: t("Bestellverfolgung"),
      titlePrefix: t("Verfolgung"),
      body: t("Die Übersicht über geteilte Bestellungen bleibt hier sichtbar: jedes Händler-Segment, jede Zahlungsaktualisierung und jeder Versandmeilenstein steht in einer eigenen Zeile, damit Support und Käuferin auf demselben Stand bleiben."),
      orderValueLabel: t("Bestellwert"),
      paymentLabel: t("Zahlung"),
      payoutControlLabel: t("Auszahlungskontrolle"),
      payoutFrozen: t("Eingefroren"),
      payoutEscrowActive: t("Treuhand aktiv"),
    },
    paymentRecord: {
      kicker: t("Zahlungsnachweis"),
      walletBody: t("Das Wallet-Guthaben wurde belastet und die Bestellung liegt bis zur Erfüllung in der Treuhand."),
      proofBody: t("Der Überweisungsbeleg ist zur Prüfung durch das HenryCo-Finanzteam angehängt."),
      awaitingBody: t("Die Zahlung wartet auf den Finanznachweis oder den Abgleich bei Lieferung."),
      methodLabel: t("Methode"),
      statusLabel: t("Status"),
      proofLabel: t("Nachweis"),
      viewProof: t("Beleg ansehen"),
      walletDebit: t("Wallet-Abbuchung"),
      pending: t("Ausstehend"),
    },
    timeline: {
      kicker: t("Zeitachse"),
      title: t("Für Kundinnen sichtbare Meilensteine, in Reihenfolge."),
    },
    segments: {
      kicker: t("Händler-Segmente"),
      title: t("Jeder Händler steht für seinen eigenen Versand ein."),
      henrycoSegment: t("HenryCo-Segment"),
      fulfillmentLabel: t("Versand"),
      trackingLabel: t("Sendungsverfolgung"),
      payoutLabel: t("Auszahlung"),
      trackingPending: t("Ausstehend"),
    },
    completion: {
      kicker: t("Abschlussbestätigung"),
      body: t("Bestätige den Abschluss, sobald die Bestellung in Ordnung ist. HenryCo gibt die Händlerauszahlung erst nach bestätigter Lieferung oder bei Eignung für die automatische Freigabe frei."),
      confirmCta: t("Abschluss bestätigen"),
    },
    help: {
      kicker: t("Brauchst du Hilfe?"),
      title: t("Streitfälle, Rückerstattungen und Lieferprobleme laufen über einen Thread."),
      body: t("Öffne einen Support-Thread mit dieser Bestellnummer im Anhang, damit der Agent die komplette Zeitachse und die Händlerteilung sieht, ohne dass du alles erneut tippen musst."),
      openSupportCta: t("Support-Thread öffnen"),
      viewAllOrdersCta: t("Alle Bestellungen anzeigen"),
    },
  },
  deals: {
    metadata: {
      title: t("Geprüfte Angebote — Henry Onyx Marketplace"),
      description:
        t("Rabatte gefiltert nach Vertrauen, verlässlicher Bestandslage und Händlerverantwortung. Auf der HenryCo-Deals-Seite erscheinen nur verifizierte Listings mit sauberen Vertrauenssignalen."),
    },
    pageIntro: {
      kicker: t("Geprüfte Angebote"),
      title: t("Rabatte gefiltert nach Vertrauen, verlässlicher Bestandslage und Händlerverantwortung."),
      description:
        t("Angebote zeigen wir erst, wenn Listing-Qualität, Vertrauens-Passport des Händlers und Bestandsstatus sauber genug sind, um die Conversion zu schützen und Kaufreue zu vermeiden."),
    },
    sectionLabel: t("Geprüfte Angebote"),
    listEyebrow: t("Geprüfte Angebote"),
    refreshNote: t("Regelmäßig aktualisiert"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("Aktuell keine geprüften Angebote"),
      body: t("Geprüfte Rabatte erscheinen, sobald Händler sie einstellen. Schau bald wieder vorbei."),
    },
  },
  brand: {
    eyebrow: t("Marke"),
    bodyFallback:
      t("Ein verifizierter Shop auf Henry Onyx Marketplace mit Vertrauenssignalen, klarer Lieferübersicht und einsehbarem Händler-Passport schon vor dem Checkout."),
    searchCta: t("In dieser Marke suchen"),
    trustCta: t("Vertrauensstandards"),
    stats: {
      activeProducts: t("Aktive Produkte"),
      listingsReviewed: t("Geprüfte Angebote"),
      listingsReviewedValue: t("Trust-Passport pro Artikel sichtbar"),
      buyerProtection: t("Käuferschutz"),
      buyerProtectionValue: t("Treuhand-Checkout"),
    },
    liveKicker: t("Live von {brand}"),
    openFullSearch: t("Volle Suche öffnen"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Entdecke verifizierte Produkte von {brand} auf Henry Onyx Marketplace – mit Vertrauenssignalen, klarer Lieferübersicht und Händler-Passports vor dem Checkout."),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Entdecke verifizierte Produkte von {store} auf Henry Onyx Marketplace – mit Vertrauenssignalen, klarer Lieferübersicht und einsehbarem Händler-Passport schon vor dem Checkout."),
    metadataDescriptionFallback:
      t("Ein verifizierter Shop auf Henry Onyx Marketplace mit Vertrauenssignalen, klarer Lieferübersicht und einsehbarem Händler-Passport schon vor jedem Checkout."),
    hero: {
      eyebrow: t("Shop-Passport"),
      bodyFallback:
        t("Eine verifizierte Verkäufer:in auf Henry Onyx Marketplace – mit Vertrauenssignalen, klarer Lieferübersicht und einem transparenten Passport schon vor jedem Checkout."),
    },
    stats: {
      trustScore: t("Vertrauensscore"),
      responseSla: t("Reaktionszeit"),
      responseSlaSuffix: t(" Std."),
      followers: t("Follower:innen"),
    },
    standards: {
      eyebrow: t("Shop-Standards"),
    },
    support: {
      eyebrow: t("Support"),
      contactLinkLabel: t("Nutze Henry Onyx Marketplace, um diesen Shop zu kontaktieren"),
      contactBodySuffix:
        t(" — Nachrichten werden protokolliert und an deine Bestellreferenz gebunden, damit jede Aktualisierung an einem Ort bleibt."),
      ctaLabel: t("Diesen Shop kontaktieren"),
      subjectTemplate: t("Frage an {store}"),
    },
    reviews: {
      eyebrow: t("Neueste Bewertungen"),
      verifiedPurchase: t("Verifizierter Kauf"),
      review: t("Bewertung"),
    },
    catalog: {
      kicker: t("Shop-Katalog"),
      title: t("Alles, was dieser Shop gerade live hat."),
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
    collectionsRail: {
      kicker: t("Kuratierte Auswahl"),
      title: t("Kollektionen, die Kaufentscheidungen verkürzen."),
    },
    catalog: {
      kicker: t("Kategorie-Katalog"),
      title: t("Premium-Produkte, klarere Hierarchie."),
      openSearch: t("Volle Suche öffnen"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Entdecke verifizierte Produkte in {category} auf Henry Onyx Marketplace – mit Vertrauenssignalen, klarer Lieferübersicht und Händler-Passports schon vor dem Checkout."),
      fallbackDescription:
        t("Stöbere durch eine kuratierte Kategorie im Henry Onyx Marketplace mit Vertrauenssignalen, klarer Lieferübersicht und Händler-Passports vor dem Checkout."),
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
      body: t("Such die Themen, die Käufer:innen und Verkäufer:innen am häufigsten stellen. Wenn du nicht fündig wirst, öffne unten auf der Seite ein Support-Ticket – ein Mensch aus dem Team liest es."),
    },
    stillNeedHelp: {
      kicker: t("Brauchst du weiter Hilfe"),
      title: t("Öffne ein Support-Ticket – ein Mensch liest es."),
      body: t("Tickets halten den vollen Kontext beisammen — Bestellung, Händler, Verlauf des Streitfalls — damit das Team die Sache bearbeitet, ohne dass du sie bei jeder Antwort neu tippst."),
      ctaLabel: t("Support-Ticket öffnen"),
    },
  },
  sell: {
    metadata: {
      title: t("Auf HenryCo verkaufen — selektiver Marketplace für Vertrauens-Händler:innen"),
      description:
        t("Bewirb dich für den Verkauf auf Henry Onyx Marketplace: vertrauensorientierte Positionierung, Premium-Storefronts und ein einheitlicher Workspace für Bestellungen, Auszahlungen und Support."),
    },
    hero: {
      kicker: t("Auf HenryCo verkaufen"),
      title: t("Selektiv von Grund auf. Gemacht für Händler:innen, die Vertrauen führen."),
      body: t("Henry Onyx Marketplace bevorzugt Händler:innen, die auf Präsentation achten, verlässlich liefern und Käuferschutz ernst nehmen. Die Anforderungen sind auf dieser Seite klar; die Händler-Bewerbung läuft in deinem HenryCo-Konto weiter."),
      primaryCta: t("Händler-Bewerbung öffnen"),
      secondaryCta: t("Händler-Preise ansehen"),
      signInCta: t("Mit HenryCo-Konto anmelden"),
      highlights: [
        { label: t("Auswahl"), value: t("Manuelle Prüfung statt Bezahllisting") },
        { label: t("Storefront"), value: t("Trust-Passport für Käufer:innen sichtbar") },
        { label: t("Workspace"), value: t("Bestellungen, Auszahlungen, Support vereint") },
      ],
    },
    advantages: {
      kicker: t("Warum stärkere Händler:innen hier gewinnen"),
      items: [
        { title: t("Vertrauensorientierte Positionierung"), body: t("Dein Shop erhält einen sichtbaren Trust-Passport, statt im Rauschen eines Massen-Marketplaces unterzugehen.") },
        { title: t("Bessere Storefront-Qualität"), body: t("Editoriale Schienen, eine ruhigere Suche und sauberere Produktkarten helfen anspruchsvollen Shops, besser zu konvertieren.") },
        { title: t("Klarere Operations"), body: t("Auszahlungen, Bestellungen, Support, Moderation und Bestandsalarme bleiben in einem klareren Workspace sichtbar.") },
      ],
    },
    onboarding: {
      kicker: t("So läuft das Onboarding"),
      stepLabel: t("Schritt"),
      steps: [
        { step: "01", title: t("Händler-Bewerbung starten"), body: t("Öffne die Bewerbung aus deinem HenryCo-Konto heraus — Entwürfe werden automatisch gespeichert, während du die Details zusammenstellst.") },
        { step: "02", title: t("Geschäftsdaten ergänzen"), body: t("Firmenname, Shop-Profil, Produkt-Fokus und alle Verifizierungsdokumente, die zeigen, wie du Bestellungen erfüllst.") },
        { step: "03", title: t("Prüfung der Bewerbung"), body: t("Das HenryCo-Team prüft Dokumente, Vertrauenssignale und Shop-Reife — nicht nur ein bezahltes Abzeichen.") },
        { step: "04", title: t("Vendor-Onboarding"), body: t("Freigegebene Händler:innen gehen ins Vendor-Onboarding, wo Preise, Listing-Gebühren, Auszahlungsfenster und Richtlinien vor der Veröffentlichung sichtbar bleiben.") },
      ],
      callout: {
        eyebrow: t("Eine sauberere Händler-Bewerbung"),
        body: t("Die Händler-Registrierung bleibt in deinem Konto, damit Geschäftsdaten, Prüfstatus und Freigabe-Updates privat und leicht nachvollziehbar bleiben."),
      },
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
    trustTiers: {
      kicker: t("Trust-Stufen verändern Privilegien"),
      title: t("Hol dir schnellere Auszahlungen, größere Storefronts und Richtlinien-Vorteile."),
    },
    closing: {
      kicker: t("Weitergehen"),
      title: t("Bewirb dich und verfolge den Status aus deinem Konto."),
      body: t("Mit der Freigabe öffnet sich das Vendor-Onboarding. Preise, Listing-Gebühren und Auszahlungsfenster sind vor der Veröffentlichung sichtbar — keine vertraglichen Überraschungen später."),
      primaryCta: t("Bewerbung starten"),
      secondaryCta: t("Zum Vendor-Workspace"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Verkäuferpreise — Henry Onyx Marketplace"),
      description:
        t("Plangebühren, Listing-Gebühren, Gebühren für Featured-Slots, Transaktionsprovision und Auszahlungsabwicklung werden alle vorab ausgewiesen — vor der Veröffentlichung deines Bestands, nicht danach."),
    },
    hero: {
      kicker: t("Verkäuferpreise"),
      title: t("Klare Ökonomie. Keine versteckten Gebühren."),
      body: t("Plangebühren, Listing-Gebühren, Gebühren für Featured-Slots, Transaktionsprovision und Auszahlungsabwicklung werden alle vorab ausgewiesen — bevor du Bestand veröffentlichst, nicht danach."),
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
    economics: {
      kicker: t("Wie HenryCo Geld verdient"),
      title: t("Vorab ausgewiesen, offen abgezogen."),
      items: [
        t("Transaktionsprovisionen werden bei jeder Vendor-Bestellgruppen-Abrechnung vor der Auszahlung abgezogen."),
        t("Listing-Gebühren fallen an, sobald das im aktiven Plan enthaltene Inserate-Kontingent ausgeschöpft ist."),
        t("Featured-Platzierung ist eine separate kostenpflichtige Anfrage und unterliegt einer Qualitäts- und Vertrauensprüfung."),
        t("Bearbeitungsgebühren für Auszahlungen werden im Verkäufer-Abrechnungsbeleg abgezogen, nicht später als Überraschung."),
        t("Mehrwertdienste von Studio, Learn und Logistics schaffen zusätzliche Ertragspfade für Verkäufer."),
        t("Vom Operator gesteuerte Kampagnen und gesponserte Slots bleiben auditierbar und sind kein Self-Service-Chaos."),
      ],
    },
    trustTiers: {
      kicker: t("Auszahlungstakt nach Vertrauensstufe"),
      title: t("Besseres Verhalten verkürzt die Haltefrist."),
    },
    closing: {
      kicker: t("Bereit für die Bewerbung?"),
      title: t("Die Bewerbung öffnet sich in deinem HenryCo-Konto."),
      body: t("Du kannst den Entwurf speichern und zurückkehren — die hier sichtbare Preisgestaltung gilt, sobald das Vendor-Onboarding abgeschlossen ist."),
      primaryCta: t("Als Verkäufer bewerben"),
      secondaryCta: t("Vertrauensstandards"),
    },
  },
  trust: {
    metadata: {
      title: t("Vertrauen & Sicherheit — Henry Onyx Marketplace"),
      description:
        t("Vertrauen bestimmt, was ein Verkäufer darf, wie Geld fließt und wie die Moderation reagiert. Verkäuferstufen, Treuhand, Streitfälle und Auszahlungsfreigaben hinterlassen einen serverseitigen Audit-Trail."),
    },
    hero: {
      kicker: t("Vertrauen & Sicherheit"),
      title: t("Sichtbar vor dem Checkout. Durchgesetzt danach."),
      body: t("Vertrauen steuert, was ein Verkäufer tun darf, wie Geld fließt und wie die Moderation reagiert. Verkäuferstufen, Käufer-Risiko, Listing-Bewertung, Treuhand, Streitfälle und Auszahlungsfreigaben hinterlassen alle eine serverseitige Spur."),
      pillars: [
        { label: t("Geldfluss"), value: t("Treuhand, Freigabe nach Prüfung") },
        { label: t("Bewertungen"), value: t("Serverseitig protokolliert, in Disputen nachvollziehbar") },
        { label: t("Stufen"), value: t("Verdient, widerrufbar") },
      ],
    },
    guardrails: {
      kicker: t("Vier Leitplanken"),
      items: [
        {
          title: t("Vertrauens-Passports"),
          body: t("Jeder Shop und jedes Produkt zeigt Verifizierungsstufe, SLA, Streitquote, Auszahlungsstatus und Versandbereitschaft."),
        },
        {
          title: t("Treuhand-Kontrolle"),
          body: t("Käufergelder werden zuerst von HenryCo gehalten und erst nach Lieferung und Vertrauensprüfung zur Auszahlung freigegeben."),
        },
        {
          title: t("Anti-Betrugs-Prüfung"),
          body: t("Zahlungs-Umlenkungen außerhalb der Plattform, doppelte Medien, Listing-Spitzen und riskante Auszahlungsmuster werden in der Queue sichtbar gemacht."),
        },
        {
          title: t("Audit-Trails"),
          body: t("Freigaben, Ablehnungen, Auszahlungsaktionen, Streitentscheidungen und Automations-Durchläufe werden serverseitig protokolliert."),
        },
      ],
    },
    sellerLadder: {
      kicker: t("Verkäufer-Vertrauensleiter"),
      title: t("Stufen, die durch Verhalten verdient, nicht gekauft werden."),
    },
    policySurfaces: {
      kicker: t("Richtlinien-Oberflächen"),
      title: t("Die Standards, an die wir uns selbst halten."),
    },
    ecosystem: {
      kicker: t("Vertrauensverstärkung im Ökosystem"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Entdecken Sie {collection} auf dem Henry Onyx Marketplace — eine kuratierte Auswahl geprüfter Produkte mit Vertrauenssignalen, klaren Lieferinformationen und Verkäuferpässen vor dem Checkout."),
      fallbackDescription:
        t("Eine kuratierte Kollektion auf dem Henry Onyx Marketplace mit geprüften Produkten, Vertrauenssignalen, klarer Lieferung und sichtbaren Verkäuferpässen vor dem Checkout."),
    },
    hero: {
      primaryCta: t("Vollständige Suche öffnen"),
      secondaryCta: t("Vertrauensstandards"),
    },
    sidebar: {
      itemsLabel: t("Artikel in der Kollektion"),
      editedByLabel: t("Kuratiert von"),
      editedByValue: t("Marketplace-Operations"),
      buyerProtectionLabel: t("Käuferschutz"),
      buyerProtectionValue: t("Treuhand-Checkout"),
    },
    rail: {
      kicker: t("In dieser Auswahl"),
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
      enforcementLabel: t("Durchsetzung"),
      updatedLabel: t("Aktualisiert"),
    },
    coverageBySlug: {
      buyerProtection: t("Käufer"),
      sellerPolicy: t("Verkäufer"),
      fallback: t("Marketplace-Teilnehmer"),
    },
    enforcementBySlug: {
      buyerProtection: t("Treuhand-Zahlungen + Auszahlungssperre bei Streit"),
      sellerPolicy: t("Prüfung nach Vertrauensstufe + Auszahlungsreserve"),
      fallback: t("Serverseitig protokollierte Spur"),
    },
    updatedBySlug: {
      buyerProtection: t("Bei Änderungen zu Zahlung und Streitfällen"),
      sellerPolicy: t("Bei Änderungen der Verkäuferstandards"),
      fallback: t("Bei Richtlinienänderungen"),
    },
    provisions: {
      kicker: t("Bestimmungen der Richtlinie"),
    },
    ecosystem: {
      kicker: t("Verbundene Marketplace-Kontrollen"),
      openLabel: t("Öffnen"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{title} im Henry Onyx Marketplace — geprüfter Lagerbestand, verlässliche Lieferung und sichtbarer Verkäuferpass vor dem Checkout."),
      fallbackDescription:
        t("Ein geprüftes Angebot im Henry Onyx Marketplace mit Vertrauenssignalen, klarer Lieferung und sichtbarem Verkäuferpass vor dem Checkout."),
    },
    fulfillment: {
      sellerTrustLabel: t("Verkäufervertrauen"),
      sellerTrustValueTemplate: t("Pass von {vendor} sichtbar"),
      sellerTrustValueFallback: t("Verkäuferpass steht aus"),
      availabilityLabel: t("Verfügbarkeit"),
      availabilityValueSingular: t("{count} Einheit aktuell im Lager"),
      availabilityValuePlural: t("{count} Einheiten aktuell im Lager"),
      fulfillmentLabel: t("Versand"),
      paymentLabel: t("Zahlung"),
      paymentValueCod: t("Nachnahme oder verifizierte Überweisung"),
      paymentValueVerified: t("Ablauf mit verifizierter Überweisung"),
    },
    price: {
      label: t("Preis"),
      leadTimeLabel: t("Lieferzeit"),
    },
    safety: {
      kicker: t("Warum dieses Angebot vertrauenswürdiger wirkt"),
      stockTemplate: t("{count} Einheiten derzeit im Bestand sichtbar"),
      codEligible: t("Nachnahme dort möglich, wo unterstützt"),
      codFallback: t("Manueller Verifizierungsablauf verfügbar"),
      vendorLinkedTemplate: t("Der Verkäuferpass von {vendor} ist direkt von dieser Seite verlinkt"),
      vendorPending: t("Die Vertrauensfläche des Verkäufers ist noch nicht verknüpft"),
      reviewsTemplateSingular: t("{count} Bewertung bei einer Durchschnittsnote von {rating}"),
      reviewsTemplatePlural: t("{count} Bewertungen bei einer Durchschnittsnote von {rating}"),
    },
    detail: {
      kicker: t("Produktdetail"),
      title: t("Alles, was vor dem Checkout zählt."),
      deliverySummaryTitle: t("Lieferung, Support und Nachbetreuung"),
      deliveryFallback: t("Lieferzeitfenster werden im Checkout konkretisiert."),
      deliveryTail:
        t("Bestellungen bleiben von der Zahlung bis zur Auslieferung nachverfolgbar, und Beschwerden oder Support-Threads bleiben mit demselben Bestellsatz verknüpft."),
      specsTitle: t("Spezifikationen und Materialklarheit"),
      passportTitle: t("Shop-Pass und verwandte Entdeckungen"),
      visitVendorTemplate: t("{vendor} besuchen"),
      exploreCategoryTemplate: t("{category} erkunden"),
      seeBrandTemplate: t("{brand} ansehen"),
    },
    related: {
      kicker: t("Set vervollständigen"),
      title: t("Weitere passende Stücke im selben Einkaufskontext."),
      body: t("Empfehlungs-Rails bleiben kuratiert und ruhig, statt zu lauten Upsell-Floskeln zu werden."),
    },
    reviews: {
      kicker: t("Bewertungs-Highlights"),
      title: t("Geprüfte Kaufsignale, kein Geräuschpegel."),
      verifiedPurchase: t("Verifizierter Kauf"),
      reviewLabel: t("Bewertung"),
    },
    rail: {
      kicker: t("Andere Kund:innen kauften auch"),
      headline: t("Browse weiter, ohne den Faden zu verlieren."),
      caption:
        t("Co-Kauf- und Kategorie-Signale zeigen den nächsten naheliegenden Schritt, ohne mit Upsell zu überfrachten."),
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
      t("Henry Onyx Marketplace trasforma il commercio multi-venditore in un'esperienza più serena: scoperta più chiara, aggiunta rapida da ogni scheda, chiarezza sugli ordini frazionati, passaporti venditore più solidi e un unico account HenryCo per ordini, pagamenti, recensioni e supporto."),
    primaryCta: t("Esplora il catalogo"),
    secondaryCta: t("Vendi su HenryCo"),
    quickCards: [
      { title: t("Aggiunta rapida ovunque"), body: t("Controlli carrello discreti a livello di scheda, aggiornamenti istantanei del mini-carrello e nessun ricaricamento maldestro.") },
      { title: t("Binari di fiducia verificati"), body: t("Passaporti venditore, promesse di consegna, qualità delle recensioni e proprietà dello stock restano facili da leggere.") },
      { title: t("Un account, meno attriti"), body: t("Ordini, pagamenti, lista dei desideri, follow e notifiche restano insieme in un unico account HenryCo.") },
    ],
    whyKicker: t("Perché si percepisce diverso"),
    whyTitle: t("La fiducia è visibile prima del pagamento."),
    whyCards: [
      { title: t("La fiducia è visibile prima del pagamento"), body: t("Livello di verifica, tasso di contestazioni, reattività del supporto e affidabilità dell'evasione restano vicini alla decisione d'acquisto.") },
      { title: t("La chiarezza degli ordini frazionati resta leggibile"), body: t("Quando lo stock arriva da venditori diversi o dallo stock HenryCo, la segmentazione della consegna resta evidente invece di diventare confusione al checkout.") },
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
      t("Candidature dei venditori, moderazione e approvazioni passano attraverso canali di revisione HenryCo dedicati."),
      t("Aggiornamenti ordine, recensioni, supporto e pagamenti restano collegati allo stesso account acquirente."),
      t("Supporto, revisione dei pagamenti e operazioni di consegna restano organizzati perché le risposte rimangano coerenti."),
    ],
    sellerKicker: t("Qualità del venditore"),
    sellerTitle: t("I venditori seri partono dal proprio account HenryCo."),
    sellerBody:
      t("I visitatori pubblici possono scoprire la vendita su /sell, mentre la candidatura, l'avanzamento della bozza, gli aggiornamenti della revisione e lo stato di approvazione restano nell'esperienza del venditore."),
    sellerBullets: [
      t("Salvataggio delle bozze e visibilità dell'avanzamento"),
      t("Gestione privata dei documenti nel posto giusto"),
      t("Aggiornamenti chiari di approvazione per ogni venditore"),
    ],
  },
  kpiLabels: {
    verifiedStores: t("Negozi verificati"),
    activeListings: t("Annunci attivi"),
    trustRating: t("Valutazione di fiducia"),
  },
  kpiHints: {
    verifiedStores: t("Venditori curati e inventario di proprietà di HenryCo con responsabilità più chiara."),
    activeListings: t("Annunci approvati mostrati con chiarezza di consegna, fiducia e proprietà."),
    trustRating: t("La qualità delle recensioni del marketplace e l'affidabilità del venditore appaiono prima del pagamento."),
  },
  footer: {
    brandSubtitle: t("Commercio raffinato con un account HenryCo connesso"),
    brandBody:
      t("Henry Onyx Marketplace è pensato per acquisti ad alta fiducia, venditori verificati e un'esperienza più pulita dal checkout alla consegna."),
    shopTitle: t("Acquista"),
    sellTitle: t("Vendi"),
    supportTitle: t("Supporto"),
    supportBody:
      t("Ordini, conversazioni con i venditori, aggiornamenti del supporto e registrazioni dei pagamenti restano collegati in un unico account HenryCo."),
    shopLinks: [
      { href: "/search", label: t("Cerca nel marketplace") },
      { href: "/deals", label: t("Offerte ed edizioni a tempo") },
      { href: "/trust", label: t("Passaporto di fiducia") },
      { href: "/policies/buyer-protection", label: t("Politica di protezione dell'acquirente") },
      { href: "/help", label: t("Supporto e risoluzione") },
    ],
    sellLinks: [
      { href: "/sell", label: t("Perché vendere su HenryCo") },
      { href: "/sell/pricing", label: t("Prezzi e tariffe per i venditori") },
      { href: "/policies/seller-policy", label: t("Politica del venditore") },
      { href: "/account/seller-application", label: t("Candidatura venditore") },
      { href: "/vendor", label: t("Spazio venditore") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("Stock HenryCo"),
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
      title: t("Un carrello premium con modifiche più rapide e maggiore chiarezza sugli ordini divisi."),
      description:
        t("Il carrello mantiene visibile il raggruppamento per venditore, aggiorna le quantità in modo fluido e resta collegato al cassetto del mini-carrello, così chi compra non perde il contesto quando è vicino al checkout."),
    },
    emptyState: {
      title: t("Il tuo carrello è ancora vuoto."),
      body: t("Aggiungi al volo dalle schede prodotto, salva articoli per dopo, e il carrello resta aggiornato sia nel mini-carrello sia nella vista completa, senza ricaricare la pagina."),
      ctaLabel: t("Esplora i prodotti"),
    },
  },
  track: {
    metadata: {
      title: t("Tracciamento ordine — Henry Onyx Marketplace"),
      description:
        t("Segui ogni segmento venditore, aggiornamento di pagamento e tappa di consegna in un unico posto. L'escrow resta attivo finché la consegna non è confermata."),
    },
    hero: {
      kicker: t("Tracciamento ordine"),
      titlePrefix: t("Tracciamento"),
      body: t("La chiarezza sugli ordini divisi resta qui visibile: ogni segmento venditore, aggiornamento di pagamento e tappa di consegna ha la propria riga, così supporto e aspettative di chi compra restano allineate."),
      orderValueLabel: t("Valore dell'ordine"),
      paymentLabel: t("Pagamento"),
      payoutControlLabel: t("Controllo del pagamento al venditore"),
      payoutFrozen: t("Bloccato"),
      payoutEscrowActive: t("Escrow attivo"),
    },
    paymentRecord: {
      kicker: t("Traccia di pagamento"),
      walletBody: t("Il saldo del portafoglio è stato addebitato e l'ordine resta in escrow fino all'evasione."),
      proofBody: t("La ricevuta di bonifico è allegata per la verifica del team finanziario HenryCo."),
      awaitingBody: t("Il pagamento attende l'evidenza finanziaria o la riconciliazione alla consegna."),
      methodLabel: t("Metodo"),
      statusLabel: t("Stato"),
      proofLabel: t("Ricevuta"),
      viewProof: t("Vedi ricevuta"),
      walletDebit: t("Addebito portafoglio"),
      pending: t("In attesa"),
    },
    timeline: {
      kicker: t("Cronologia"),
      title: t("Tappe visibili al cliente, in ordine."),
    },
    segments: {
      kicker: t("Segmenti venditore"),
      title: t("Ogni venditore risponde della propria spedizione."),
      henrycoSegment: t("Segmento HenryCo"),
      fulfillmentLabel: t("Evasione"),
      trackingLabel: t("Tracciamento"),
      payoutLabel: t("Pagamento"),
      trackingPending: t("In attesa"),
    },
    completion: {
      kicker: t("Conferma di completamento"),
      body: t("Conferma il completamento quando l'ordine è soddisfacente. HenryCo rilascia il pagamento al venditore solo dopo la conferma della consegna o se l'ordine rientra nel rilascio automatico."),
      confirmCta: t("Conferma completamento"),
    },
    help: {
      kicker: t("Serve aiuto?"),
      title: t("Controversie, rimborsi e problemi di consegna passano tutti da un unico thread."),
      body: t("Apri un thread di supporto con questo numero d'ordine allegato, così l'agente vede l'intera cronologia e la divisione per venditore senza che tu debba riscrivere tutto."),
      openSupportCta: t("Apri thread di supporto"),
      viewAllOrdersCta: t("Vedi tutti gli ordini"),
    },
  },
  deals: {
    metadata: {
      title: t("Offerte verificate — Henry Onyx Marketplace"),
      description:
        t("Sconti filtrati per affidabilità, disponibilità reale di magazzino e responsabilità del venditore. Nella pagina offerte di HenryCo appaiono solo annunci verificati con segnali puliti."),
    },
    pageIntro: {
      kicker: t("Offerte verificate"),
      title: t("Sconti filtrati per affidabilità, disponibilità di magazzino e responsabilità del venditore."),
      description:
        t("Mettiamo in evidenza le offerte solo quando qualità dell’annuncio, passaporto di fiducia del venditore e stato delle scorte sono abbastanza puliti da proteggere la conversione e ridurre il rimpianto di chi compra."),
    },
    sectionLabel: t("Offerte verificate"),
    listEyebrow: t("Offerte verificate"),
    refreshNote: t("Aggiornate regolarmente"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("Nessuna offerta verificata in questo momento"),
      body: t("Gli sconti verificati arrivano man mano che i venditori li pubblicano. Torna a dare un’occhiata."),
    },
  },
  brand: {
    eyebrow: t("Marchio"),
    bodyFallback:
      t("Un negozio verificato su Henry Onyx Marketplace, con segnali di affidabilità, chiarezza sulla consegna e passaporto del venditore visibili prima del pagamento."),
    searchCta: t("Cerca in questo marchio"),
    trustCta: t("Standard di fiducia"),
    stats: {
      activeProducts: t("Prodotti attivi"),
      listingsReviewed: t("Annunci verificati"),
      listingsReviewedValue: t("Trust Passport visibile per ogni articolo"),
      buyerProtection: t("Protezione acquirente"),
      buyerProtectionValue: t("Pagamento in deposito"),
    },
    liveKicker: t("In diretta da {brand}"),
    openFullSearch: t("Apri la ricerca completa"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Esplora i prodotti verificati di {brand} su Henry Onyx Marketplace, con segnali di affidabilità, chiarezza sulla consegna e passaporti dei venditori visibili prima del pagamento."),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Esplora i prodotti verificati di {store} su Henry Onyx Marketplace, con segnali di affidabilità, chiarezza sulla consegna e il passaporto del venditore visibili prima del pagamento."),
    metadataDescriptionFallback:
      t("Un negozio verificato su Henry Onyx Marketplace, con segnali di affidabilità, chiarezza sulla consegna e passaporto del venditore visibili prima di ogni pagamento."),
    hero: {
      eyebrow: t("Passaporto del negozio"),
      bodyFallback:
        t("Un venditore verificato su Henry Onyx Marketplace, con segnali di affidabilità, chiarezza sulla consegna e un passaporto trasparente visibile prima di ogni pagamento."),
    },
    stats: {
      trustScore: t("Punteggio di fiducia"),
      responseSla: t("Tempo di risposta"),
      responseSlaSuffix: t(" h"),
      followers: t("Follower"),
    },
    standards: {
      eyebrow: t("Standard del negozio"),
    },
    support: {
      eyebrow: t("Supporto"),
      contactLinkLabel: t("Usa Henry Onyx Marketplace per contattare questo negozio"),
      contactBodySuffix:
        t(" — i messaggi vengono registrati e collegati al riferimento del tuo ordine, così ogni aggiornamento resta in un unico posto."),
      ctaLabel: t("Contatta questo negozio"),
      subjectTemplate: t("Domanda per {store}"),
    },
    reviews: {
      eyebrow: t("Recensioni recenti"),
      verifiedPurchase: t("Acquisto verificato"),
      review: t("Recensione"),
    },
    catalog: {
      kicker: t("Catalogo del negozio"),
      title: t("Tutto ciò che questo negozio ha attualmente online."),
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
    collectionsRail: {
      kicker: t("Selezioni curate"),
      title: t("Collezioni che accorciano la decisione d’acquisto."),
    },
    catalog: {
      kicker: t("Catalogo della categoria"),
      title: t("Prodotti premium, gerarchia più nitida."),
      openSearch: t("Apri ricerca completa"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Esplora prodotti verificati in {category} su Henry Onyx Marketplace, con segnali di fiducia, chiarezza sulla consegna e passaporti venditore visibili prima del pagamento."),
      fallbackDescription:
        t("Sfoglia una categoria curata di Henry Onyx Marketplace con segnali di fiducia, chiarezza sulla consegna e passaporti venditore prima del pagamento."),
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
      body: t("Cerca i temi che acquirenti e venditori chiedono più spesso. Se non trovi quello che ti serve, apri un ticket in fondo a questa pagina e una persona del team lo leggerà."),
    },
    stillNeedHelp: {
      kicker: t("Serve ancora aiuto"),
      title: t("Apri un ticket di assistenza e una persona lo leggerà."),
      body: t("I ticket mantengono tutto il contesto allegato — l’ordine, il venditore, lo storico della disputa — così il team lavora al caso senza che tu debba riscrivere tutto a ogni risposta."),
      ctaLabel: t("Apri un ticket di assistenza"),
    },
  },
  sell: {
    metadata: {
      title: t("Vendere su HenryCo — marketplace selettivo per venditori di fiducia"),
      description:
        t("Candidati per vendere su Henry Onyx Marketplace: posizionamento fondato sulla fiducia, vetrine premium e uno spazio unico per ordini, pagamenti e supporto."),
    },
    hero: {
      kicker: t("Vendere su HenryCo"),
      title: t("Selettivo per scelta. Pensato per venditori che mettono la fiducia al primo posto."),
      body: t("Henry Onyx Marketplace privilegia venditori attenti alla presentazione, affidabili nelle consegne e onesti sulla protezione dell’acquirente. Il livello richiesto è esplicitato qui; la candidatura venditore prosegue dentro il tuo account HenryCo."),
      primaryCta: t("Apri candidatura venditore"),
      secondaryCta: t("Vedi i prezzi venditore"),
      signInCta: t("Accedi con account HenryCo"),
      highlights: [
        { label: t("Selezione"), value: t("Revisione manuale, non listing a pagamento") },
        { label: t("Vetrina"), value: t("Passaporto di fiducia visibile agli acquirenti") },
        { label: t("Spazio"), value: t("Ordini, pagamenti e supporto in un solo posto") },
      ],
    },
    advantages: {
      kicker: t("Perché qui vincono i venditori più solidi"),
      items: [
        { title: t("Posizionamento basato sulla fiducia"), body: t("Il tuo store riceve un passaporto di fiducia visibile, invece di perdersi nel rumore di un marketplace di bassa qualità.") },
        { title: t("Vetrine di qualità migliore"), body: t("Carrelli editoriali, una ricerca più calma e schede prodotto più pulite aiutano gli store esigenti a convertire meglio.") },
        { title: t("Operatività più nitida"), body: t("Pagamenti, ordini, supporto, moderazione e avvisi di stock restano visibili in uno spazio di lavoro più chiaro.") },
      ],
    },
    onboarding: {
      kicker: t("Come funziona l’onboarding"),
      stepLabel: t("Passo"),
      steps: [
        { step: "01", title: t("Avviare la candidatura venditore"), body: t("Apri la candidatura dal tuo account HenryCo — le bozze si salvano automaticamente mentre raccogli i dettagli.") },
        { step: "02", title: t("Aggiungere i dati aziendali"), body: t("Ragione sociale, profilo store, focus prodotto e ogni documento di verifica che spiega come gestisci gli ordini.") },
        { step: "03", title: t("Revisione della candidatura"), body: t("Il team HenryCo esamina documenti, segnali di fiducia e maturità dello store — non solo un badge a pagamento.") },
        { step: "04", title: t("Onboarding venditore"), body: t("I venditori approvati proseguono con l’onboarding, dove prezzi, commissioni di pubblicazione, finestre di pagamento e regole sono visibili prima della pubblicazione.") },
      ],
      callout: {
        eyebrow: t("Una candidatura venditore più pulita"),
        body: t("La registrazione venditore resta dentro il tuo account, così dati aziendali, stato della revisione e aggiornamenti di approvazione rimangono privati e facili da seguire."),
      },
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
    trustTiers: {
      kicker: t("I livelli di fiducia cambiano i privilegi"),
      title: t("Ottieni pagamenti più rapidi, vetrine più ampie e vantaggi sulle policy."),
    },
    closing: {
      kicker: t("Andare avanti"),
      title: t("Candidati e segui lo stato dal tuo account."),
      body: t("L’approvazione sblocca l’onboarding venditore. Prezzi, commissioni di pubblicazione e finestre di pagamento sono visibili prima di pubblicare — niente sorprese contrattuali dopo."),
      primaryCta: t("Avvia candidatura"),
      secondaryCta: t("Vai allo spazio venditore"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Prezzi per venditori — Henry Onyx Marketplace"),
      description:
        t("Commissioni di piano, commissioni di pubblicazione, commissioni dei posti in evidenza, commissione di transazione e processamento dei pagamenti sono tutte dichiarate in anticipo — prima di pubblicare l’inventario, non dopo."),
    },
    hero: {
      kicker: t("Prezzi per venditori"),
      title: t("Economia chiara. Nessuna commissione nascosta."),
      body: t("Commissioni di piano, commissioni di pubblicazione, posti in evidenza, commissione di transazione e processamento dei pagamenti sono tutte dichiarate in anticipo — prima di pubblicare l’inventario, non dopo."),
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
    economics: {
      kicker: t("Come HenryCo guadagna"),
      title: t("Dichiarato in anticipo, dedotto a vista."),
      items: [
        t("Le commissioni di transazione vengono dedotte da ogni liquidazione del gruppo-ordine venditore prima del rilascio del pagamento."),
        t("Le commissioni di pubblicazione si applicano una volta esaurita la quota di annunci inclusi nel piano attivo del venditore."),
        t("L’evidenza è una richiesta a pagamento separata e resta soggetta a controllo qualità e fiducia."),
        t("Le commissioni di processamento del pagamento sono dedotte nel riepilogo di liquidazione del venditore, non in sorpresa più tardi."),
        t("I servizi a valore aggiunto Studio, Learn e Logistics creano nuove direttrici di ricavo per i venditori."),
        t("Le campagne governate dall’operatore e gli slot sponsorizzati restano tracciabili e mai in self-service caotico."),
      ],
    },
    trustTiers: {
      kicker: t("Tempistiche di pagamento per livello di fiducia"),
      title: t("Un comportamento migliore accorcia le trattenute."),
    },
    closing: {
      kicker: t("Pronto a candidarti?"),
      title: t("La candidatura si apre nel tuo account HenryCo."),
      body: t("Puoi salvare la bozza e tornare — i prezzi visibili qui si applicano una volta completato l’onboarding venditore."),
      primaryCta: t("Candidati come venditore"),
      secondaryCta: t("Standard di fiducia"),
    },
  },
  trust: {
    metadata: {
      title: t("Affidabilità e sicurezza — Henry Onyx Marketplace"),
      description:
        t("La fiducia regola cosa può fare un venditore, come si muove il denaro e come reagisce la moderazione. Livelli del venditore, deposito, dispute e rilascio dei pagamenti lasciano una traccia lato server."),
    },
    hero: {
      kicker: t("Affidabilità e sicurezza"),
      title: t("Visibile prima del checkout. Applicata dopo."),
      body: t("La fiducia governa cosa può fare un venditore, come si muove il denaro e come reagisce la moderazione. Livelli del venditore, rischio dell’acquirente, punteggio degli annunci, deposito, dispute e rilascio dei pagamenti lasciano tutti una traccia lato server."),
      pillars: [
        { label: t("Movimenti di denaro"), value: t("In deposito, rilasciati dopo i controlli") },
        { label: t("Recensioni"), value: t("Registrate lato server, tracciabili nelle dispute") },
        { label: t("Livelli"), value: t("Guadagnati, revocabili") },
      ],
    },
    guardrails: {
      kicker: t("Quattro garanzie"),
      items: [
        {
          title: t("Trust Passport"),
          body: t("Ogni negozio e prodotto mostra livello di verifica, SLA, tasso di dispute, prontezza al pagamento e postura di evasione."),
        },
        {
          title: t("Controllo del deposito"),
          body: t("I fondi dell’acquirente vengono prima trattenuti da HenryCo e poi spostati in pagamento rilasciabile solo dopo consegna e controlli di fiducia superati."),
        },
        {
          title: t("Revisione antifrode"),
          body: t("Deviazioni di pagamento fuori piattaforma, media duplicati, picchi di pubblicazione e schemi di pagamento rischiosi finiscono nella visibilità delle code di revisione."),
        },
        {
          title: t("Tracciati di audit"),
          body: t("Approvazioni, rifiuti, azioni di pagamento, decisioni sulle dispute e passaggi automatici sono registrati lato server."),
        },
      ],
    },
    sellerLadder: {
      kicker: t("Scala di fiducia del venditore"),
      title: t("Livelli guadagnati con il comportamento, non comprati."),
    },
    policySurfaces: {
      kicker: t("Superfici delle politiche"),
      title: t("Gli standard che ci imponiamo."),
    },
    ecosystem: {
      kicker: t("Rafforzamento della fiducia nell’ecosistema"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Esplora {collection} su Henry Onyx Marketplace — una selezione curata di prodotti verificati, con segnali di fiducia, chiarezza nella consegna e passaporti venditore visibili prima del checkout."),
      fallbackDescription:
        t("Una collezione curata su Henry Onyx Marketplace, con prodotti verificati, segnali di fiducia, consegna chiara e passaporti venditore visibili prima del checkout."),
    },
    hero: {
      primaryCta: t("Apri ricerca completa"),
      secondaryCta: t("Standard di fiducia"),
    },
    sidebar: {
      itemsLabel: t("Articoli nella collezione"),
      editedByLabel: t("Curata da"),
      editedByValue: t("Operations del Marketplace"),
      buyerProtectionLabel: t("Protezione acquirente"),
      buyerProtectionValue: t("Checkout in deposito a garanzia"),
    },
    rail: {
      kicker: t("Cosa contiene la selezione"),
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
      enforcementLabel: t("Applicazione"),
      updatedLabel: t("Aggiornato"),
    },
    coverageBySlug: {
      buyerProtection: t("Acquirenti"),
      sellerPolicy: t("Venditori"),
      fallback: t("Partecipanti al marketplace"),
    },
    enforcementBySlug: {
      buyerProtection: t("Pagamenti in deposito a garanzia + blocco controversia"),
      sellerPolicy: t("Revisione per livello di fiducia + riserva di payout"),
      fallback: t("Traccia registrata lato server"),
    },
    updatedBySlug: {
      buyerProtection: t("A ogni revisione su pagamenti e controversie"),
      sellerPolicy: t("A ogni revisione degli standard venditore"),
      fallback: t("A ogni revisione della politica"),
    },
    provisions: {
      kicker: t("Disposizioni della politica"),
    },
    ecosystem: {
      kicker: t("Controlli connessi del marketplace"),
      openLabel: t("Apri"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{title} su Henry Onyx Marketplace — stock verificato, consegna affidabile e passaporto venditore visibili prima del pagamento."),
      fallbackDescription:
        t("Un annuncio verificato su Henry Onyx Marketplace, con segnali di fiducia, chiarezza sulla consegna e passaporto venditore visibili prima del pagamento."),
    },
    fulfillment: {
      sellerTrustLabel: t("Affidabilità venditore"),
      sellerTrustValueTemplate: t("Passaporto di {vendor} visibile"),
      sellerTrustValueFallback: t("Passaporto venditore in attesa"),
      availabilityLabel: t("Disponibilità"),
      availabilityValueSingular: t("{count} unità nello stock attuale"),
      availabilityValuePlural: t("{count} unità nello stock attuale"),
      fulfillmentLabel: t("Consegna"),
      paymentLabel: t("Pagamento"),
      paymentValueCod: t("Contrassegno o bonifico verificato"),
      paymentValueVerified: t("Flusso con bonifico verificato"),
    },
    price: {
      label: t("Prezzo"),
      leadTimeLabel: t("Tempi di consegna"),
    },
    safety: {
      kicker: t("Perché questo annuncio risulta più affidabile"),
      stockTemplate: t("{count} unità attualmente visibili a magazzino"),
      codEligible: t("Contrassegno disponibile dove supportato"),
      codFallback: t("Flusso di verifica manuale disponibile"),
      vendorLinkedTemplate: t("Il passaporto venditore di {vendor} è collegato direttamente da questa pagina"),
      vendorPending: t("La superficie di fiducia del venditore è ancora da collegare"),
      reviewsTemplateSingular: t("{count} recensione con valutazione media di {rating}"),
      reviewsTemplatePlural: t("{count} recensioni con valutazione media di {rating}"),
    },
    detail: {
      kicker: t("Dettaglio prodotto"),
      title: t("Tutto ciò che conta prima del pagamento."),
      deliverySummaryTitle: t("Consegna, supporto e cura post-ordine"),
      deliveryFallback: t("Le finestre di consegna saranno chiarite al checkout."),
      deliveryTail:
        t("Gli ordini restano tracciabili dal pagamento alla spedizione, e le contestazioni o i thread di supporto restano associati allo stesso record d’ordine."),
      specsTitle: t("Specifiche e chiarezza dei materiali"),
      passportTitle: t("Passaporto del negozio e scoperte correlate"),
      visitVendorTemplate: t("Visita {vendor}"),
      exploreCategoryTemplate: t("Esplora {category}"),
      seeBrandTemplate: t("Vedi {brand}"),
    },
    related: {
      kicker: t("Completa il set"),
      title: t("Altro nello stesso contesto d’acquisto."),
      body: t("I rail di raccomandazione restano curati e puliti, senza rumore commerciale."),
    },
    reviews: {
      kicker: t("Spunti delle recensioni"),
      title: t("Segnali d’acquisto verificati, senza rumore inutile."),
      verifiedPurchase: t("Acquisto verificato"),
      reviewLabel: t("Recensione"),
    },
    rail: {
      kicker: t("Chi ha visto ha comprato anche"),
      headline: t("Continua a navigare senza perdere il filo."),
      caption:
        t("I segnali di co-acquisto e di categoria affine portano al prossimo passo evidente, senza saturare di upsell."),
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
      t("يحوّل Henry Onyx Marketplace تجارة البائعين المتعدّدين إلى تجربة أكثر هدوءًا: اكتشاف أوضح، إضافة سريعة من كل بطاقة، وضوح للطلبات المقسّمة، جوازات بائع أقوى، وحساب HenryCo واحد للطلبات والمدفوعات والمراجعات والدعم."),
    primaryCta: t("استكشف الكتالوج"),
    secondaryCta: t("بِع على HenryCo"),
    quickCards: [
      { title: t("إضافة سريعة في كل مكان"), body: t("عناصر تحكّم سلة هادئة على مستوى البطاقة، وتحديثات فورية للسلة المصغّرة، دون عمليات إعادة تحميل مرتبكة.") },
      { title: t("مسارات ثقة موثّقة"), body: t("تظل جوازات البائع، ووعود التسليم، وجودة المراجعات، وملكية المخزون سهلة القراءة.") },
      { title: t("حساب واحد، احتكاك أقل"), body: t("تبقى الطلبات والمدفوعات وقائمة الرغبات والمتابعات والإشعارات معًا في حساب HenryCo واحد.") },
    ],
    whyKicker: t("لماذا يبدو مختلفًا"),
    whyTitle: t("الثقة مرئية قبل الدفع."),
    whyCards: [
      { title: t("الثقة مرئية قبل الدفع"), body: t("يظل مستوى التوثيق، ونسبة النزاعات، وسرعة استجابة الدعم، وموثوقية التنفيذ قريبًا من قرار الشراء.") },
      { title: t("وضوح الطلبات المقسّمة يبقى مقروءًا"), body: t("عندما يأتي المخزون من بائعين مختلفين أو من مخزون HenryCo، يظل تقسيم التسليم واضحًا بدل أن يتحوّل إلى ارتباك عند الدفع.") },
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
      t("تمرّ طلبات البائعين والإشراف والاعتمادات عبر قنوات مراجعة مخصّصة في HenryCo."),
      t("تظل تحديثات الطلبات والمراجعات والدعم والمدفوعات مرتبطة بنفس حساب المشتري."),
      t("يبقى الدعم ومراجعة المدفوعات وعمليات التسليم منظّمًا لتظل الردود متناسقة."),
    ],
    sellerKicker: t("جودة البائع"),
    sellerTitle: t("البائعون الجادّون يبدؤون من داخل حساب HenryCo الخاص بهم."),
    sellerBody:
      t("يمكن للزوّار العموميين التعرّف على البيع عبر /sell، بينما يبقى التقديم وتقدّم المسودّة وتحديثات المراجعة وحالة الاعتماد داخل تجربة البائع."),
    sellerBullets: [
      t("حفظ المسودّات ووضوح التقدّم"),
      t("تعامل خاص مع المستندات في المكان المناسب"),
      t("تحديثات اعتماد واضحة لكل بائع"),
    ],
  },
  kpiLabels: {
    verifiedStores: t("متاجر موثّقة"),
    activeListings: t("قوائم نشطة"),
    trustRating: t("تقييم الثقة"),
  },
  kpiHints: {
    verifiedStores: t("بائعون منسّقون ومخزون مملوك من HenryCo بمساءلة أوضح."),
    activeListings: t("قوائم معتمدة تُعرض مع وضوح في التسليم والثقة والملكية."),
    trustRating: t("تظهر جودة مراجعات السوق وموثوقية البائع قبل الدفع."),
  },
  footer: {
    brandSubtitle: t("تجارة مُتقنة مع حساب HenryCo متّصل"),
    brandBody:
      t("صُمّم Henry Onyx Marketplace من أجل مشتريات عالية الثقة، وبائعين موثّقين، وتجربة أنظف من الدفع إلى التسليم."),
    shopTitle: t("تسوّق"),
    sellTitle: t("بِع"),
    supportTitle: t("الدعم"),
    supportBody:
      t("تبقى الطلبات ومحادثات البائعين وتحديثات الدعم وسجلات الدفع متّصلة في حساب HenryCo واحد."),
    shopLinks: [
      { href: "/search", label: t("ابحث في السوق") },
      { href: "/deals", label: t("عروض وإصدارات محدودة") },
      { href: "/trust", label: t("جواز الثقة") },
      { href: "/policies/buyer-protection", label: t("سياسة حماية المشتري") },
      { href: "/help", label: t("الدعم وحلّ المشكلات") },
    ],
    sellLinks: [
      { href: "/sell", label: t("لماذا تبيع على HenryCo") },
      { href: "/sell/pricing", label: t("الأسعار ورسوم البائع") },
      { href: "/policies/seller-policy", label: t("سياسة البائع") },
      { href: "/account/seller-application", label: t("تقديم البائع") },
      { href: "/vendor", label: t("مساحة البائع") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("مخزون HenryCo"),
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
      title: t("سلة بمستوى رفيع، تعديلات أسرع، ووضوح أعلى للطلبات المقسّمة بين أكثر من بائع."),
      description:
        t("تُبقي السلة تجميع البائعين ظاهرًا، وتُحدّث الكميات بسرعة، وتظل متصلة بدُرج السلة المصغّر، حتى لا يفقد المشتري السياق وهو يقترب من إتمام الطلب."),
    },
    emptyState: {
      title: t("سلتك ما زالت فارغة."),
      body: t("أضِف بسرعة من بطاقات المنتجات، واحفظ ما تودّ لاحقًا، وستبقى السلة محدّثة في الدُرج المصغّر وفي السلة الكاملة دون الحاجة إلى إعادة تحميل الصفحة."),
      ctaLabel: t("تصفّح المنتجات"),
    },
  },
  track: {
    metadata: {
      title: t("تتبّع الطلب — Henry Onyx Marketplace"),
      description:
        t("تابِع كل قِسم بائع، وكل تحديث دفع، وكل مرحلة شحن في مكان واحد. يبقى الضمان نشطًا حتى يتم تأكيد التسليم."),
    },
    hero: {
      kicker: t("تتبّع الطلب"),
      titlePrefix: t("تتبّع"),
      body: t("وضوح الطلبات المقسّمة يبقى ظاهرًا هنا: كل قِسم بائع، وكل تحديث دفع، وكل مرحلة شحن يحظى بصفّه الخاص، حتى يبقى الدعم وتوقّعات المشتري على المسار نفسه."),
      orderValueLabel: t("قيمة الطلب"),
      paymentLabel: t("الدفع"),
      payoutControlLabel: t("ضبط تحويل الأموال"),
      payoutFrozen: t("مُجمَّد"),
      payoutEscrowActive: t("الضمان نشط"),
    },
    paymentRecord: {
      kicker: t("سجلّ الدفع"),
      walletBody: t("تم خصم رصيد المحفظة، والطلب محتجَز في الضمان حتى يكتمل الشحن."),
      proofBody: t("أُرفِق إثبات التحويل لمراجعة فريق المالية في HenryCo."),
      awaitingBody: t("الدفع بانتظار إثبات من الفريق المالي أو مطابقة عند التسليم."),
      methodLabel: t("الطريقة"),
      statusLabel: t("الحالة"),
      proofLabel: t("الإثبات"),
      viewProof: t("عرض الإثبات"),
      walletDebit: t("خصم من المحفظة"),
      pending: t("قيد الانتظار"),
    },
    timeline: {
      kicker: t("المسار الزمني"),
      title: t("المراحل التي يراها العميل، بالترتيب."),
    },
    segments: {
      kicker: t("أقسام البائعين"),
      title: t("كل بائع مسؤول عن شحنته الخاصة."),
      henrycoSegment: t("قِسم HenryCo"),
      fulfillmentLabel: t("الشحن"),
      trackingLabel: t("التتبّع"),
      payoutLabel: t("تحويل الأموال"),
      trackingPending: t("قيد الانتظار"),
    },
    completion: {
      kicker: t("تأكيد الاستلام"),
      body: t("أكِّد الاستلام عندما يكون الطلب مرضيًا. لا تُفرج HenryCo عن مستحقّات البائع إلا بعد تأكيد التسليم أو عند استيفاء شروط الإفراج التلقائي."),
      confirmCta: t("تأكيد الاستلام"),
    },
    help: {
      kicker: t("تحتاج إلى مساعدة؟"),
      title: t("النزاعات، والاستردادات، ومشكلات التسليم تمرّ كلها عبر خيط واحد."),
      body: t("افتح خيط دعم مرفقًا برقم الطلب هذا، حتى يرى الموظّف المسار الزمني كاملًا وتقسيم البائعين دون أن تكتبه من جديد."),
      openSupportCta: t("فتح خيط دعم"),
      viewAllOrdersCta: t("عرض كل الطلبات"),
    },
  },
  deals: {
    metadata: {
      title: t("عروض موثّقة — Henry Onyx Marketplace"),
      description:
        t("تخفيضات مفلترة وفق الثقة، ووضوح توافر المخزون، ومسؤولية البائع. على صفحة العروض في HenryCo لا تظهر سوى المنتجات الموثّقة التي تحمل إشارات ثقة نظيفة."),
    },
    pageIntro: {
      kicker: t("عروض موثّقة"),
      title: t("تخفيضات مفلترة وفق الثقة، ووضوح توافر المخزون، ومسؤولية البائع."),
      description:
        t("لا نُبرز العرض إلا عندما تكون جودة الإعلان، وجواز ثقة البائع، وحالة المخزون نظيفة بما يكفي لحماية إتمام الشراء وتقليل الندم بعد الطلب."),
    },
    sectionLabel: t("عروض موثّقة"),
    listEyebrow: t("عروض موثّقة"),
    refreshNote: t("تُحدَّث بانتظام"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("لا توجد عروض موثّقة الآن"),
      body: t("تظهر التخفيضات الموثّقة عندما يُدرجها البائعون. تابِعنا قريبًا."),
    },
  },
  brand: {
    eyebrow: t("العلامة التجارية"),
    bodyFallback:
      t("متجر موثّق على Henry Onyx Marketplace، تظهر فيه إشارات الثقة، ووضوح التوصيل، وجواز سفر البائع قبل إتمام الدفع."),
    searchCta: t("ابحث داخل هذه العلامة"),
    trustCta: t("معايير الثقة"),
    stats: {
      activeProducts: t("منتجات نشطة"),
      listingsReviewed: t("إعلانات تمّت مراجعتها"),
      listingsReviewedValue: t("جواز ثقة ظاهر لكل منتج"),
      buyerProtection: t("حماية المشتري"),
      buyerProtectionValue: t("دفع عبر حساب وسيط"),
    },
    liveKicker: t("مباشر من {brand}"),
    openFullSearch: t("فتح البحث الكامل"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
    metadataDescription:
      t("استكشف المنتجات الموثّقة من {brand} على Henry Onyx Marketplace، مع إشارات الثقة، ووضوح التوصيل، وجوازات البائعين قبل إتمام الدفع."),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    metadataDescription:
      t("تصفّح المنتجات الموثّقة من {store} على Henry Onyx Marketplace، مع إشارات الثقة، ووضوح التوصيل، وجواز سفر البائع قبل إتمام الدفع."),
    metadataDescriptionFallback:
      t("متجر موثّق على Henry Onyx Marketplace، تظهر فيه إشارات الثقة، ووضوح التوصيل، وجواز سفر البائع قبل كل عملية دفع."),
    hero: {
      eyebrow: t("جواز المتجر"),
      bodyFallback:
        t("بائع موثّق على Henry Onyx Marketplace، مع إشارات ثقة، ووضوح في التوصيل، وجواز سفر شفّاف يظهر قبل كل عملية دفع."),
    },
    stats: {
      trustScore: t("درجة الثقة"),
      responseSla: t("مدة الردّ"),
      responseSlaSuffix: t(" س"),
      followers: t("المتابعون"),
    },
    standards: {
      eyebrow: t("معايير المتجر"),
    },
    support: {
      eyebrow: t("الدعم"),
      contactLinkLabel: t("استخدم Henry Onyx Marketplace للتواصل مع هذا المتجر"),
      contactBodySuffix:
        t(" — تُسجَّل الرسائل وتُربط بمرجع طلبك، حتى يبقى كل تحديث في مكان واحد."),
      ctaLabel: t("تواصل مع هذا المتجر"),
      subjectTemplate: t("سؤال إلى {store}"),
    },
    reviews: {
      eyebrow: t("أحدث التقييمات"),
      verifiedPurchase: t("شراء موثّق"),
      review: t("تقييم"),
    },
    catalog: {
      kicker: t("كتالوج المتجر"),
      title: t("كل ما يعرضه هذا المتجر مباشرةً الآن."),
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
    collectionsRail: {
      kicker: t("مجموعات منتقاة"),
      title: t("مجموعات تختصر قرار الشراء."),
    },
    catalog: {
      kicker: t("كتالوج الفئة"),
      title: t("منتجات فاخرة، تسلسل أكثر وضوحًا."),
      openSearch: t("افتح البحث الكامل"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("استكشف منتجات موثّقة ضمن {category} على Henry Onyx Marketplace، مع إشارات ثقة، ووضوح في التوصيل، وجوازات بائعين ظاهرة قبل الدفع."),
      fallbackDescription:
        t("تصفّح فئة منتقاة على Henry Onyx Marketplace مع إشارات ثقة، ووضوح في التوصيل، وجوازات بائعين قبل الدفع."),
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
      body: t("ابحث في المواضيع التي يطرحها المشترون والبائعون أكثر من غيرها. إن لم تجد ما تحتاج إليه، افتح تذكرة دعم من أسفل هذه الصفحة وسيقرؤها شخص من الفريق."),
    },
    stillNeedHelp: {
      kicker: t("ما زلت تحتاج إلى المساعدة"),
      title: t("افتح تذكرة دعم وسيقرؤها شخص حقيقي."),
      body: t("تحتفظ التذاكر بكامل السياق — الطلب، البائع، سجل النزاع — حتى يعمل الفريق على القضية دون أن تعيد كتابتها مع كل رد."),
      ctaLabel: t("افتح تذكرة دعم"),
    },
  },
  sell: {
    metadata: {
      title: t("بِع على HenryCo — سوق انتقائي للبائعين الذين يقودون بالثقة"),
      description:
        t("قدِّم طلبًا للبيع على Henry Onyx Marketplace: تموضع يقوده مبدأ الثقة، واجهات متاجر فاخرة، ومساحة عمل موحَّدة للطلبات والمدفوعات والدعم."),
    },
    hero: {
      kicker: t("بِع على HenryCo"),
      title: t("انتقائيٌّ بطبيعته. مصمَّم للبائعين الذين يقودون بالثقة."),
      body: t("تُفضّل Henry Onyx Marketplace البائعين الذين يهتمّون بالعرض، ويُنفّذون الطلبات بموثوقية، ويحترمون حماية المشتري بصدق. تجد المعايير صريحةً في هذه الصفحة، ثم يستمرّ طلب البيع داخل حساب HenryCo الخاص بك."),
      primaryCta: t("فتح طلب البيع"),
      secondaryCta: t("الاطّلاع على أسعار البائعين"),
      signInCta: t("تسجيل الدخول بحساب HenryCo"),
      highlights: [
        { label: t("الانتقاء"), value: t("مراجعة يدوية، لا إدراج مدفوع") },
        { label: t("الواجهة"), value: t("جواز ثقة ظاهر للمشترين") },
        { label: t("المساحة"), value: t("طلبات ومدفوعات ودعم في مكان واحد") },
      ],
    },
    advantages: {
      kicker: t("لماذا ينجح البائعون الأقوى هنا"),
      items: [
        { title: t("تموضع يقوده مبدأ الثقة"), body: t("يحصل متجرك على جواز ثقة ظاهر، بدل أن يضيع في ضوضاء سوق منخفض الجودة.") },
        { title: t("جودة أعلى لواجهة المتجر"), body: t("ممرّات تحريرية، وبحث أهدأ، وبطاقات منتج أنظف، تساعد المتاجر الجادّة على تحقيق تحويل أفضل.") },
        { title: t("تشغيل أكثر وضوحًا"), body: t("المدفوعات والطلبات والدعم والمراقبة وتنبيهات المخزون تبقى ظاهرة في مساحة عمل واحدة أوضح.") },
      ],
    },
    onboarding: {
      kicker: t("كيف يسير الانضمام"),
      stepLabel: t("خطوة"),
      steps: [
        { step: "01", title: t("بدء طلب البيع"), body: t("افتح الطلب من داخل حساب HenryCo — تُحفَظ المسوّدات تلقائيًا أثناء تجميع التفاصيل.") },
        { step: "02", title: t("إضافة بيانات النشاط"), body: t("اسم النشاط، ملف المتجر، تركيز المنتجات، وأي مستندات تحقُّق توضّح كيف تُلبّي الطلبات.") },
        { step: "03", title: t("مراجعة الطلب"), body: t("يراجع فريق HenryCo المستندات وإشارات الثقة وجاهزية المتجر — لا مجرد شارة مدفوعة.") },
        { step: "04", title: t("انضمام البائع"), body: t("يواصل البائعون الموافَق عليهم خطوات الانضمام، حيث تظهر الأسعار ورسوم النشر ونوافذ التحويل وقواعد السياسات قبل النشر.") },
      ],
      callout: {
        eyebrow: t("طلب بيع أوضح"),
        body: t("يبقى تسجيل البائع داخل حسابك، فتظلّ بيانات النشاط وحالة المراجعة وتحديثات الموافقة خاصّة وسهلة المتابعة."),
      },
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
    trustTiers: {
      kicker: t("مستويات الثقة تغيّر الامتيازات"),
      title: t("احصل على تحويلات أسرع، وواجهات أوسع، ومزايا في السياسات."),
    },
    closing: {
      kicker: t("للمضيّ قدمًا"),
      title: t("قدِّم طلبك ثم تابع حالته من حسابك."),
      body: t("تفتح الموافقة بابَ انضمام البائع. الأسعار ورسوم النشر ونوافذ التحويل ظاهرة قبل النشر — دون مفاجآت تعاقدية لاحقًا."),
      primaryCta: t("ابدأ الطلب"),
      secondaryCta: t("زيارة مساحة البائع"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("تسعير البائعين — Henry Onyx Marketplace"),
      description:
        t("رسوم الخطة، ورسوم النشر، ورسوم الإبراز، وعمولة المعاملة، ومعالجة التحويل كلّها معلنة سلفًا — قبل نشر مخزونك، لا بعده."),
    },
    hero: {
      kicker: t("تسعير البائعين"),
      title: t("اقتصاد واضح. لا رسوم خفية."),
      body: t("رسوم الخطة ورسوم النشر ورسوم الإبراز وعمولة المعاملة ومعالجة التحويل كلّها معلنة سلفًا — قبل نشر مخزونك، لا بعده."),
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
    economics: {
      kicker: t("كيف تكسب HenryCo"),
      title: t("معلَن سلفًا، يُخصم على مرأى الجميع."),
      items: [
        t("تُخصم عمولات المعاملات من كل تسوية مجموعة-طلب لدى البائع قبل تحرير التحويل."),
        t("تُطبَّق رسوم النشر بعد استنفاد حصة الإعلانات المُضمَّنة في الخطة الفعّالة للبائع."),
        t("الإبراز طلبٌ مدفوع منفصل، ويبقى خاضعًا لمراجعة الجودة والثقة."),
        t("تُخصم رسوم معالجة التحويل ضمن لقطة تسوية البائع، لا لاحقًا كمفاجأة."),
        t("خدمات القيمة المضافة في Studio و Learn و Logistics تفتح روافد دخل إضافية للبائعين."),
        t("تظل الحملات التي يديرها المشغّل والخانات المُموَّلة قابلة للتدقيق ولا تتحوّل إلى فوضى خدمة ذاتية."),
      ],
    },
    trustTiers: {
      kicker: t("توقيت التحويل حسب مستوى الثقة"),
      title: t("السلوك الأفضل يقلّص فترات الاحتجاز."),
    },
    closing: {
      kicker: t("هل أنت جاهز للتقديم؟"),
      title: t("يفتح الطلب داخل حساب HenryCo الخاص بك."),
      body: t("يمكنك حفظ المسودّة والعودة لاحقًا — التسعير الظاهر هنا يُطبَّق فور اكتمال انضمام البائع."),
      primaryCta: t("قدّم بصفتك بائعًا"),
      secondaryCta: t("معايير الثقة"),
    },
  },
  trust: {
    metadata: {
      title: t("الثقة والسلامة — Henry Onyx Marketplace"),
      description:
        t("تحكم الثقة ما يمكن للبائع فعله، وكيف يتحرّك المال، وكيف تستجيب المراجعة. مستويات البائع، الإيداع الوسيط، النزاعات وتحرير الدفعات تترك أثرًا كاملًا على الخادم."),
    },
    hero: {
      kicker: t("الثقة والسلامة"),
      title: t("ظاهرة قبل الدفع، ومُطبَّقة بعده."),
      body: t("تتحكّم الثقة في ما يستطيع البائع فعله، وفي حركة المال، وفي طريقة استجابة المراجعة. مستويات البائع ومخاطر المشتري وتقييم الإعلانات والإيداع الوسيط والنزاعات وتحرير الدفعات تترك جميعها أثرًا موثّقًا على الخادم."),
      pillars: [
        { label: t("حركة المال"), value: t("إيداع وسيط ويُفرَج عنه بعد الفحوصات") },
        { label: t("المراجعات"), value: t("مسجّلة على الخادم وقابلة للتتبّع في النزاعات") },
        { label: t("المستويات"), value: t("تُكتسب وقابلة للسحب") },
      ],
    },
    guardrails: {
      kicker: t("أربعة حواجز للحماية"),
      items: [
        {
          title: t("جوازات الثقة"),
          body: t("كل متجر ومنتج يُظهر مستوى التحقق، واتفاقية الخدمة، ونسبة النزاعات، وجاهزية التحويل، ووضع التنفيذ."),
        },
        {
          title: t("التحكّم بالإيداع الوسيط"),
          body: t("تحتجز HenryCo أموال المشتري أولًا، ولا تتحوّل إلى تحويل قابل للإفراج إلا بعد تسليم ناجح واجتياز فحوصات الثقة."),
        },
        {
          title: t("مراجعة مكافحة الاحتيال"),
          body: t("محاولات الدفع خارج المنصة، والوسائط المكرّرة، وقفزات سرعة النشر، وأنماط التحويل عالية المخاطر تظهر في صفوف المراجعة."),
        },
        {
          title: t("سجلات تدقيق"),
          body: t("الموافقات والرفض وإجراءات التحويل وقرارات النزاعات وعمليات الفحص الآلية كلّها مسجّلة على الخادم."),
        },
      ],
    },
    sellerLadder: {
      kicker: t("سلّم ثقة البائع"),
      title: t("مستويات تُكتسب بالسلوك، لا تُشترى."),
    },
    policySurfaces: {
      kicker: t("أسطح السياسات"),
      title: t("المعايير التي نُلزم بها أنفسنا."),
    },
    ecosystem: {
      kicker: t("تعزيز الثقة على مستوى المنظومة"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — متجر HenryCo"),
      descriptionTemplate:
        t("اكتشف {collection} على متجر HenryCo — مجموعة مختارة من المنتجات الموثوقة، مع إشارات الثقة، ووضوح التوصيل، وجوازات البائعين قبل الدفع."),
      fallbackDescription:
        t("مجموعة مختارة على متجر HenryCo، تضم منتجات موثوقة وإشارات ثقة وتوصيلًا واضحًا وجوازات بائعين ظاهرة قبل الدفع."),
    },
    hero: {
      primaryCta: t("افتح البحث الكامل"),
      secondaryCta: t("معايير الثقة"),
    },
    sidebar: {
      itemsLabel: t("العناصر في المجموعة"),
      editedByLabel: t("أعدّتها"),
      editedByValue: t("عمليات المتجر"),
      buyerProtectionLabel: t("حماية المشتري"),
      buyerProtectionValue: t("الدفع عبر الضمان"),
    },
    rail: {
      kicker: t("ما يضمّه هذا الاختيار"),
      itemsSuffix: t("عنصرًا"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — متجر HenryCo"),
      descriptionTemplate:
        t("{policy} على متجر HenryCo — تطبيق مُسجَّل على الخادم، وضوابط ضمان للمدفوعات، وموقف ثقة ظاهر قبل الدفع."),
      fallbackTitle: t("سياسة المتجر — متجر HenryCo"),
      fallbackDescription:
        t("سياسة من متجر HenryCo — تطبيق مُسجَّل على الخادم، وضوابط ضمان للمدفوعات، وموقف ثقة ظاهر قبل الدفع."),
    },
    hero: {
      backToTrust: t("عودة إلى معايير الثقة"),
      openSupport: t("افتح محادثة الدعم"),
    },
    details: {
      coverageLabel: t("نطاق التغطية"),
      enforcementLabel: t("التطبيق"),
      updatedLabel: t("آخر تحديث"),
    },
    coverageBySlug: {
      buyerProtection: t("المشترون"),
      sellerPolicy: t("البائعون"),
      fallback: t("المشاركون في المتجر"),
    },
    enforcementBySlug: {
      buyerProtection: t("مدفوعات مُحتجزة في الضمان + تجميد عند النزاع"),
      sellerPolicy: t("مراجعة حسب درجة الثقة + احتياطي صرف"),
      fallback: t("أثر مُسجَّل على الخادم"),
    },
    updatedBySlug: {
      buyerProtection: t("عند مراجعات المدفوعات والنزاعات"),
      sellerPolicy: t("عند مراجعات معايير البائع"),
      fallback: t("عند مراجعات السياسة"),
    },
    provisions: {
      kicker: t("أحكام السياسة"),
    },
    ecosystem: {
      kicker: t("ضوابط متصلة بالمتجر"),
      openLabel: t("فتح"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{title} على Henry Onyx Marketplace — مخزون موثّق وتوصيل موثوق وجواز البائع ظاهرة قبل الدفع."),
      fallbackDescription:
        t("إعلان موثّق على Henry Onyx Marketplace مع إشارات الثقة ووضوح التوصيل وجواز البائع المعروض قبل الدفع."),
    },
    fulfillment: {
      sellerTrustLabel: t("ثقة البائع"),
      sellerTrustValueTemplate: t("جواز {vendor} مرئي"),
      sellerTrustValueFallback: t("جواز البائع قيد المراجعة"),
      availabilityLabel: t("التوفر"),
      availabilityValueSingular: t("{count} وحدة في المخزون الحالي"),
      availabilityValuePlural: t("{count} وحدات في المخزون الحالي"),
      fulfillmentLabel: t("التوصيل"),
      paymentLabel: t("الدفع"),
      paymentValueCod: t("الدفع عند الاستلام أو تحويل موثّق"),
      paymentValueVerified: t("تدفّق بتحويل موثّق"),
    },
    price: {
      label: t("السعر"),
      leadTimeLabel: t("زمن التسليم"),
    },
    safety: {
      kicker: t("لماذا يبدو هذا الإعلان أكثر أمانًا"),
      stockTemplate: t("{count} وحدة مرئية حاليًا في الجرد"),
      codEligible: t("الدفع عند الاستلام متاح حيث يُدعم"),
      codFallback: t("تدفّق تحقّق يدوي متاح"),
      vendorLinkedTemplate: t("جواز البائع {vendor} مرتبط مباشرة من هذه الصفحة"),
      vendorPending: t("ربط واجهة ثقة البائع لا يزال قيد الإكمال"),
      reviewsTemplateSingular: t("{count} مراجعة بمعدّل تقييم {rating}"),
      reviewsTemplatePlural: t("{count} مراجعات بمعدّل تقييم {rating}"),
    },
    detail: {
      kicker: t("تفاصيل المنتج"),
      title: t("كل ما يهمّ قبل الدفع."),
      deliverySummaryTitle: t("التوصيل والدعم والرعاية بعد الطلب"),
      deliveryFallback: t("ستُوضّح نوافذ التوصيل عند الدفع."),
      deliveryTail:
        t("تبقى الطلبات قابلة للتتبّع من الدفع وحتى التسليم، وتظل النزاعات وخيوط الدعم مرتبطة بنفس سجل الطلب."),
      specsTitle: t("المواصفات ووضوح المواد"),
      passportTitle: t("جواز المتجر والاكتشافات ذات الصلة"),
      visitVendorTemplate: t("زيارة {vendor}"),
      exploreCategoryTemplate: t("استكشاف {category}"),
      seeBrandTemplate: t("عرض {brand}"),
    },
    related: {
      kicker: t("أكمل المجموعة"),
      title: t("المزيد ضمن سياق الشراء نفسه."),
      body: t("تبقى قضبان التوصية منتقاة وهادئة، دون ضوضاء بيع إضافية."),
    },
    reviews: {
      kicker: t("أبرز المراجعات"),
      title: t("إشارات شراء موثّقة، دون حشو مزعج."),
      verifiedPurchase: t("شراء موثّق"),
      reviewLabel: t("مراجعة"),
    },
    rail: {
      kicker: t("اشترى الزبائن أيضًا"),
      headline: t("تابع التصفّح دون أن تفقد مكانك."),
      caption:
        t("تكشف إشارات الشراء المشترك والفئات المتقاربة الخطوة التالية البديهية، دون ضوضاء عروض زائدة."),
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
      t("Henry Onyx Marketplace 把多商家交易转化为更安静的体验:更清晰的发现、卡片上即可快速加入、更明确的拆单展示、更稳健的卖家通行证,以及一个统一的 HenryCo 账户来管理订单、付款、评价和支持。"),
    primaryCta: t("浏览商品目录"),
    secondaryCta: t("入驻 HenryCo"),
    quickCards: [
      { title: t("到处都能快速加入"), body: t("卡片层级的低干扰购物车控件,迷你购物车即时更新,无需笨拙的页面刷新。") },
      { title: t("通过认证的信任通道"), body: t("卖家通行证、配送承诺、评价质量与库存归属始终一目了然。") },
      { title: t("一个账户,更少摩擦"), body: t("订单、付款、心愿单、关注与通知集中在同一个 HenryCo 账户中。") },
    ],
    whyKicker: t("为什么感觉不一样"),
    whyTitle: t("信任在付款之前就已经可见。"),
    whyCards: [
      { title: t("信任在付款之前就已经可见"), body: t("认证等级、争议率、客服响应与履约可靠性始终贴近购买决策。") },
      { title: t("拆单展示依然清晰可读"), body: t("当库存来自不同卖家或 HenryCo 自营库存时,配送分段依旧清晰,而不会变成结算时的混乱。") },
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
      t("卖家入驻、内容审核与上架审批都经过 HenryCo 专属的审核通道。"),
      t("订单更新、评价、客服与付款始终与同一个买家账户保持关联。"),
      t("客服、付款审核与配送运营保持有序,以便回复一致。"),
    ],
    sellerKicker: t("卖家质量"),
    sellerTitle: t("认真的卖家从他们的 HenryCo 账户内开始。"),
    sellerBody:
      t("公开访客可以在 /sell 了解入驻,而申请、草稿进度、审核更新与上线状态都保留在卖家体验内部。"),
    sellerBullets: [
      t("草稿保存与进度可见"),
      t("敏感文件在合适的地方私密处理"),
      t("每位卖家都获得清晰的上线更新"),
    ],
  },
  kpiLabels: {
    verifiedStores: t("认证店铺"),
    activeListings: t("在售商品"),
    trustRating: t("信任评分"),
  },
  kpiHints: {
    verifiedStores: t("精选卖家与 HenryCo 自营库存,带来更清晰的责任划分。"),
    activeListings: t("已审核的商品,以清晰的配送、信任与归属信息呈现。"),
    trustRating: t("市集评价质量与卖家可靠性会在付款之前显示。"),
  },
  footer: {
    brandSubtitle: t("精致交易,搭配互联的 HenryCo 账户"),
    brandBody:
      t("Henry Onyx Marketplace 为高信任度的购物、认证卖家以及从结算到配送都更清爽的体验而打造。"),
    shopTitle: t("购物"),
    sellTitle: t("出售"),
    supportTitle: t("支持"),
    supportBody:
      t("订单、与卖家的对话、客服更新与付款记录在同一个 HenryCo 账户内保持互联。"),
    shopLinks: [
      { href: "/search", label: t("搜索市集") },
      { href: "/deals", label: t("优惠与限定版") },
      { href: "/trust", label: t("信任通行证") },
      { href: "/policies/buyer-protection", label: t("买家保护政策") },
      { href: "/help", label: t("支持与解决") },
    ],
    sellLinks: [
      { href: "/sell", label: t("为什么在 HenryCo 出售") },
      { href: "/sell/pricing", label: t("卖家定价与费率") },
      { href: "/policies/seller-policy", label: t("卖家政策") },
      { href: "/account/seller-application", label: t("卖家申请") },
      { href: "/vendor", label: t("卖家工作区") },
    ],
  },
  productCard: {
    stockedByHenryCo: t("HenryCo 自营"),
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
      title: t("更精致的购物车,编辑更快,拆单展示更清晰。"),
      description:
        t("购物车持续呈现按商家分组的视图,数量调整即时生效,并与迷你购物车抽屉保持同步,让买家在接近结算时不会失去上下文。"),
    },
    emptyState: {
      title: t("你的购物车还是空的。"),
      body: t("可从产品卡片快速加入,把心仪商品收藏稍后再看,迷你购物车与完整购物车都会即时同步,无需刷新页面。"),
      ctaLabel: t("浏览商品"),
    },
  },
  track: {
    metadata: {
      title: t("订单跟踪 — Henry Onyx Marketplace"),
      description:
        t("把每一个卖家分段、每一次付款进展、每一个履约里程碑集中在同一处呈现。在确认收货之前,代管资金始终生效。"),
    },
    hero: {
      kicker: t("订单跟踪"),
      titlePrefix: t("跟踪"),
      body: t("拆分订单的清晰视图在这里持续可见:每个卖家分段、每次付款更新与每个履约里程碑各占一行,让客服与买家的预期保持同步。"),
      orderValueLabel: t("订单金额"),
      paymentLabel: t("付款"),
      payoutControlLabel: t("结算控制"),
      payoutFrozen: t("已冻结"),
      payoutEscrowActive: t("代管中"),
    },
    paymentRecord: {
      kicker: t("付款记录"),
      walletBody: t("钱包余额已扣款,订单进入代管,等待履约。"),
      proofBody: t("转账凭证已附上,等待 HenryCo 财务核验。"),
      awaitingBody: t("付款正在等待财务凭证或交付对账。"),
      methodLabel: t("方式"),
      statusLabel: t("状态"),
      proofLabel: t("凭证"),
      viewProof: t("查看凭证"),
      walletDebit: t("钱包扣款"),
      pending: t("待处理"),
    },
    timeline: {
      kicker: t("时间线"),
      title: t("面向客户的里程碑,依顺序排列。"),
    },
    segments: {
      kicker: t("卖家分段"),
      title: t("每位卖家对自己的发货负责。"),
      henrycoSegment: t("HenryCo 分段"),
      fulfillmentLabel: t("履约"),
      trackingLabel: t("物流跟踪"),
      payoutLabel: t("结算"),
      trackingPending: t("待处理"),
    },
    completion: {
      kicker: t("完成确认"),
      body: t("当订单令你满意时请确认完成。HenryCo 只在确认送达或订单符合自动放款条件后,才会向卖家释放结算款项。"),
      confirmCta: t("确认完成"),
    },
    help: {
      kicker: t("需要帮助?"),
      title: t("争议、退款与配送问题都汇总在同一个对话中处理。"),
      body: t("在工单中带上这个订单号,客服就能直接看到完整时间线与卖家拆分,不必你再重新输入。"),
      openSupportCta: t("开启支持对话"),
      viewAllOrdersCta: t("查看全部订单"),
    },
  },
  deals: {
    metadata: {
      title: t("已核验优惠 — Henry Onyx Marketplace"),
      description:
        t("依据信任、库存可靠度与卖家责任筛选的折扣。HenryCo 优惠页只显示信任信号干净、已通过核验的商品。"),
    },
    pageIntro: {
      kicker: t("已核验优惠"),
      title: t("依据信任、库存可靠度与卖家责任筛选的折扣。"),
      description:
        t("只有当商品质量、卖家信任护照与库存状态都足够干净时,我们才会把它放上优惠位,以保护转化、减少购后遗憾。"),
    },
    sectionLabel: t("已核验优惠"),
    listEyebrow: t("已核验优惠"),
    refreshNote: t("定期更新"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("暂无已核验的优惠"),
      body: t("已核验的折扣会随着卖家陆续上架出现。稍后再来看看。"),
    },
  },
  brand: {
    eyebrow: t("品牌"),
    bodyFallback:
      t("Henry Onyx Marketplace 上经过认证的店铺,信任信号、配送清晰度与卖家护照在结账前即可查看。"),
    searchCta: t("在该品牌内搜索"),
    trustCta: t("信任标准"),
    stats: {
      activeProducts: t("在售商品"),
      listingsReviewed: t("已审核商品"),
      listingsReviewedValue: t("每件商品均显示信任护照"),
      buyerProtection: t("买家保障"),
      buyerProtectionValue: t("托管结算"),
    },
    liveKicker: t("来自 {brand} 的实时上架"),
    openFullSearch: t("打开完整搜索"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
    metadataDescription:
      t("在 Henry Onyx Marketplace 浏览 {brand} 的认证商品,结账前即可看到信任信号、配送清晰度与卖家护照。"),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    metadataDescription:
      t("在 Henry Onyx Marketplace 浏览 {store} 的认证商品,结账前即可看到信任信号、配送清晰度与卖家护照。"),
    metadataDescriptionFallback:
      t("Henry Onyx Marketplace 上经过认证的店铺,每次结账前都能查看信任信号、配送清晰度与卖家护照。"),
    hero: {
      eyebrow: t("店铺护照"),
      bodyFallback:
        t("Henry Onyx Marketplace 上经过认证的卖家,信任信号、配送清晰度与透明护照在每次结账前都可清楚查看。"),
    },
    stats: {
      trustScore: t("信任评分"),
      responseSla: t("响应时效"),
      responseSlaSuffix: t(" 小时"),
      followers: t("关注者"),
    },
    standards: {
      eyebrow: t("店铺标准"),
    },
    support: {
      eyebrow: t("客户支持"),
      contactLinkLabel: t("通过 Henry Onyx Marketplace 联系该店铺"),
      contactBodySuffix:
        t(" —— 消息会被记录并与你的订单编号关联,所有更新都集中在同一处。"),
      ctaLabel: t("联系该店铺"),
      subjectTemplate: t("向 {store} 咨询"),
    },
    reviews: {
      eyebrow: t("最新评价"),
      verifiedPurchase: t("认证购买"),
      review: t("评价"),
    },
    catalog: {
      kicker: t("店铺目录"),
      title: t("该店铺目前在售的全部商品。"),
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
    collectionsRail: {
      kicker: t("精选合辑"),
      title: t("助你更快做出购买决定的合辑。"),
    },
    catalog: {
      kicker: t("品类目录"),
      title: t("高端商品,层级更清晰。"),
      openSearch: t("打开完整搜索"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("在 Henry Onyx Marketplace 探索 {category} 中已验证的商品,结算前即可看到信任信号、清晰的配送说明与商家信任护照。"),
      fallbackDescription:
        t("在 Henry Onyx Marketplace 浏览一个精选品类,结算前即可看到信任信号、清晰的配送说明与商家信任护照。"),
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
      body: t("搜索买家与卖家最常问的话题。如果未找到所需内容,可在页面底部提交工单,团队会有专人查看。"),
    },
    stillNeedHelp: {
      kicker: t("仍需要帮助"),
      title: t("提交工单,会有专人查看。"),
      body: t("工单会保留完整上下文 — 订单、商家、纠纷历史 — 这样团队能直接跟进,不需要你在每次回复时重新描述。"),
      ctaLabel: t("提交支持工单"),
    },
  },
  trust: {
    metadata: {
      title: t("信任与安全 — Henry Onyx Marketplace"),
      description:
        t("信任决定了卖家可以做什么、资金如何流动以及审核如何响应。卖家等级、托管、争议与放款释放都会在服务器留下完整记录。"),
    },
    hero: {
      kicker: t("信任与安全"),
      title: t("结算前可见,结算后强制执行。"),
      body: t("信任决定了卖家可以做什么、资金如何流动,以及审核如何响应。卖家等级、买家风险、商品评分、托管、争议与放款释放都会在服务器留下记录。"),
      pillars: [
        { label: t("资金流动"), value: t("托管中,审核通过后释放") },
        { label: t("评价"), value: t("服务器记录,争议可追溯") },
        { label: t("等级"), value: t("凭表现获得,可撤销") },
      ],
    },
    guardrails: {
      kicker: t("四道防线"),
      items: [
        {
          title: t("信任护照"),
          body: t("每家店铺与每件商品都展示其验证等级、SLA、争议率、放款状态与履约能力。"),
        },
        {
          title: t("托管控制"),
          body: t("买家资金先由 HenryCo 托管,通过交付与信任审核后才进入可释放的放款。"),
        },
        {
          title: t("反欺诈审查"),
          body: t("脱离平台的支付引导、重复素材、上架激增以及高风险的放款行为都会进入审核队列。"),
        },
        {
          title: t("审计轨迹"),
          body: t("批准、拒绝、放款操作、争议裁决与自动化巡检都会在服务器侧记录。"),
        },
      ],
    },
    sellerLadder: {
      kicker: t("卖家信任阶梯"),
      title: t("凭表现获得,而非花钱购买的等级。"),
    },
    policySurfaces: {
      kicker: t("政策呈现面"),
      title: t("我们对自己设定的标准。"),
    },
    ecosystem: {
      kicker: t("生态系统的信任强化"),
    },
  },
  sell: {
    metadata: {
      title: t("在 HenryCo 开店 — 面向以信任为本的卖家的精选商城"),
      description:
        t("申请加入 Henry Onyx Marketplace 销售:以信任为核心的定位、精致店铺,以及统一的订单、结算与支持工作台。"),
    },
    hero: {
      kicker: t("在 HenryCo 开店"),
      title: t("天生精选。专为以信任领跑的卖家而生。"),
      body: t("Henry Onyx Marketplace 优先考虑注重呈现、按时履约且诚实保障买家权益的卖家。本页清晰列出门槛;卖家申请将在你的 HenryCo 账户内继续完成。"),
      primaryCta: t("开始卖家申请"),
      secondaryCta: t("查看卖家定价"),
      signInCta: t("用 HenryCo 账户登录"),
      highlights: [
        { label: t("选择"), value: t("人工审核,而非付费上架") },
        { label: t("店铺"), value: t("买家可见的信任护照") },
        { label: t("工作台"), value: t("订单、结算、支持统一管理") },
      ],
    },
    advantages: {
      kicker: t("为什么更强的卖家在这里更出色"),
      items: [
        { title: t("以信任为核心的定位"), body: t("你的店铺拥有清晰可见的信任护照,而不是被低质杂乱的商城噪音掩盖。") },
        { title: t("更优的店铺质量"), body: t("编辑栏目、更安静的搜索与更整洁的产品卡片,帮助高质量店铺更快转化。") },
        { title: t("更清晰的运营"), body: t("结算、订单、支持、审核与库存提醒在更整洁的同一工作台中持续可见。") },
      ],
    },
    onboarding: {
      kicker: t("入驻流程"),
      stepLabel: t("步骤"),
      steps: [
        { step: "01", title: t("提交卖家申请"), body: t("从 HenryCo 账户内打开申请 — 在你整理资料时,草稿会自动保存。") },
        { step: "02", title: t("补充经营资料"), body: t("公司名称、店铺简介、品类聚焦,以及说明你如何履约的核验文件。") },
        { step: "03", title: t("申请审核"), body: t("HenryCo 团队会审核文件、信任信号与店铺准备度 — 而不仅看一个付费徽章。") },
        { step: "04", title: t("卖家入驻"), body: t("通过的卖家进入入驻流程,定价、上架费、结算周期与政策规则会在开放发布之前清晰可见。") },
      ],
      callout: {
        eyebrow: t("更整洁的卖家申请"),
        body: t("卖家注册保留在你的账户内,经营资料、审核状态与审批更新都保持私密且便于跟进。"),
      },
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
    trustTiers: {
      kicker: t("信任等级影响权益"),
      title: t("享受更快的结算、更大的店铺与更多政策优势。"),
    },
    closing: {
      kicker: t("继续前进"),
      title: t("提交申请,在账户中查看申请状态。"),
      body: t("通过审批后,即可进入卖家入驻流程。定价、上架费与结算周期在发布前都可见 — 不会有事后合同上的意外。"),
      primaryCta: t("开始申请"),
      secondaryCta: t("前往卖家工作台"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("卖家定价 — HenryCo 商城"),
      description:
        t("套餐费、上架费、推荐位费、交易佣金与结算手续费均提前公开 — 在发布商品之前,不是之后。"),
    },
    hero: {
      kicker: t("卖家定价"),
      title: t("明晰的经济。没有隐藏费用。"),
      body: t("套餐费、上架费、推荐位费、交易佣金与结算手续费均在发布商品之前提前公开 — 不是发布之后。"),
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
    economics: {
      kicker: t("HenryCo 如何盈利"),
      title: t("提前声明,公开扣除。"),
      items: [
        t("交易佣金会在卖家订单组结算释放结算款之前先行扣除。"),
        t("在卖家当前套餐附带的上架额度用尽之后,即开始计收上架费。"),
        t("推荐位为单独付费申请,仍需通过质量与信任评估。"),
        t("结算处理费在卖家结算快照内直接扣除,不会事后再额外加收。"),
        t("Studio、Learn 与 Logistics 的增值服务为卖家开辟额外收入通道。"),
        t("由平台运营把关的活动与赞助位保持可审计,绝不沦为自助式失序。"),
      ],
    },
    trustTiers: {
      kicker: t("按信任档位的结算节奏"),
      title: t("更好的行为带来更短的扣留期。"),
    },
    closing: {
      kicker: t("准备好申请了吗?"),
      title: t("申请将在你的 HenryCo 账户中打开。"),
      body: t("你可以保存草稿稍后再来 — 这里展示的定价将在卖家入驻完成后即刻生效。"),
      primaryCta: t("申请成为卖家"),
      secondaryCta: t("信任标准"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — HenryCo 商城"),
      descriptionTemplate:
        t("在 HenryCo 商城探索 {collection} — 一组精选的可信商品,提供信任信号、清晰的配送信息,并在结账前展示卖家信任护照。"),
      fallbackDescription:
        t("HenryCo 商城上的一组精选合集,涵盖可信商品、信任信号、清晰配送以及结账前可见的卖家信任护照。"),
    },
    hero: {
      primaryCta: t("打开完整搜索"),
      secondaryCta: t("信任标准"),
    },
    sidebar: {
      itemsLabel: t("合集中的商品"),
      editedByLabel: t("编选自"),
      editedByValue: t("商城运营团队"),
      buyerProtectionLabel: t("买家保护"),
      buyerProtectionValue: t("托管结账"),
    },
    rail: {
      kicker: t("本选辑包含的商品"),
      itemsSuffix: t("件商品"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — HenryCo 商城"),
      descriptionTemplate:
        t("HenryCo 商城的 {policy} — 服务器侧记录的执行轨迹、托管支付控制以及在结账前可见的信任态势。"),
      fallbackTitle: t("商城政策 — HenryCo 商城"),
      fallbackDescription:
        t("HenryCo 商城的一项政策 — 服务器侧记录的执行轨迹、托管支付控制以及在结账前可见的信任态势。"),
    },
    hero: {
      backToTrust: t("返回信任标准"),
      openSupport: t("打开支持工单"),
    },
    details: {
      coverageLabel: t("适用范围"),
      enforcementLabel: t("执行机制"),
      updatedLabel: t("更新时机"),
    },
    coverageBySlug: {
      buyerProtection: t("买家"),
      sellerPolicy: t("卖家"),
      fallback: t("商城参与者"),
    },
    enforcementBySlug: {
      buyerProtection: t("款项托管 + 争议时冻结结算"),
      sellerPolicy: t("信任等级审核 + 结算储备"),
      fallback: t("服务器侧记录的审计轨迹"),
    },
    updatedBySlug: {
      buyerProtection: t("在支付与争议规则更新时"),
      sellerPolicy: t("在卖家标准更新时"),
      fallback: t("在政策更新时"),
    },
    provisions: {
      kicker: t("政策条款"),
    },
    ecosystem: {
      kicker: t("联通的商城控制项"),
      openLabel: t("打开"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — HenryCo 商城"),
      descriptionTemplate:
        t("{title} 在 HenryCo 商城 — 已核验库存、可靠配送与卖家护照在结账前一目了然。"),
      fallbackDescription:
        t("HenryCo 商城上的已核验商品,信任信号、配送说明与卖家护照都在结账前清晰呈现。"),
    },
    fulfillment: {
      sellerTrustLabel: t("卖家信任"),
      sellerTrustValueTemplate: t("{vendor} 护照已展示"),
      sellerTrustValueFallback: t("卖家护照待完善"),
      availabilityLabel: t("现货"),
      availabilityValueSingular: t("当前库存 {count} 件"),
      availabilityValuePlural: t("当前库存 {count} 件"),
      fulfillmentLabel: t("配送"),
      paymentLabel: t("支付"),
      paymentValueCod: t("货到付款或经核验转账"),
      paymentValueVerified: t("经核验转账流程"),
    },
    price: {
      label: t("价格"),
      leadTimeLabel: t("交付周期"),
    },
    safety: {
      kicker: t("为什么这个商品更让人安心"),
      stockTemplate: t("库存中可见 {count} 件"),
      codEligible: t("支持地区可货到付款"),
      codFallback: t("提供人工核验流程"),
      vendorLinkedTemplate: t("本页直接关联到 {vendor} 的卖家护照"),
      vendorPending: t("卖家信任页尚待关联"),
      reviewsTemplateSingular: t("{count} 条评价,平均评分 {rating}"),
      reviewsTemplatePlural: t("{count} 条评价,平均评分 {rating}"),
    },
    detail: {
      kicker: t("商品详情"),
      title: t("结账前需要了解的一切。"),
      deliverySummaryTitle: t("配送、支持与售后照看"),
      deliveryFallback: t("配送窗口将在结账时进一步确认。"),
      deliveryTail:
        t("订单从付款到发货全程可追踪,任何争议或客服记录都与同一订单档案绑定。"),
      specsTitle: t("规格与材质透明"),
      passportTitle: t("店铺护照与相关发现"),
      visitVendorTemplate: t("进入 {vendor}"),
      exploreCategoryTemplate: t("浏览 {category}"),
      seeBrandTemplate: t("查看 {brand}"),
    },
    related: {
      kicker: t("补齐一整组"),
      title: t("同一购买情境下的更多选择。"),
      body: t("推荐栏目保持克制与精选,不会变成噪音式推销。"),
    },
    reviews: {
      kicker: t("评价亮点"),
      title: t("已核验的购买信号,不掺杂噪音。"),
      verifiedPurchase: t("已核验购买"),
      reviewLabel: t("评价"),
    },
    rail: {
      kicker: t("买家也常一起买"),
      headline: t("继续浏览,不会丢失上下文。"),
      caption:
        t("共同购买与同类目信号会自然引出下一步,不会塞满冗余推销。"),
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
      title: t("एक प्रीमियम बास्केट — तेज़ बदलाव और बंटे ऑर्डर की साफ़ झलक।"),
      description:
        t("कार्ट विक्रेता-वार समूह को सामने रखता है, मात्रा तुरंत अपडेट करता है और मिनी-कार्ट ड्रॉअर से जुड़ा रहता है, ताकि चेकआउट के क़रीब पहुँचते समय ख़रीदार का संदर्भ कभी न टूटे।"),
    },
    emptyState: {
      title: t("आपका कार्ट अभी ख़ाली है।"),
      body: t("प्रोडक्ट कार्ड से झटपट जोड़ें, चीज़ें बाद के लिए सहेजें — मिनी-कार्ट और पूरे कार्ट दोनों में सब कुछ बिना रिफ़्रेश के अपडेट रहता है।"),
      ctaLabel: t("प्रोडक्ट देखें"),
    },
  },
  track: {
    metadata: {
      title: t("ऑर्डर ट्रैकिंग — Henry Onyx Marketplace"),
      description:
        t("हर विक्रेता सेगमेंट, पेमेंट अपडेट और डिलीवरी पड़ाव एक ही जगह पर ट्रैक करें। डिलीवरी पुष्ट होने तक एस्क्रो चालू रहता है।"),
    },
    hero: {
      kicker: t("ऑर्डर ट्रैकिंग"),
      titlePrefix: t("ट्रैकिंग"),
      body: t("स्प्लिट ऑर्डर की पूरी साफ़ तस्वीर यहीं दिखती रहती है: हर विक्रेता सेगमेंट, हर पेमेंट अपडेट और हर डिलीवरी पड़ाव की अलग पंक्ति होती है, ताकि सपोर्ट और ख़रीदार दोनों एक ही पन्ने पर रहें।"),
      orderValueLabel: t("ऑर्डर मूल्य"),
      paymentLabel: t("पेमेंट"),
      payoutControlLabel: t("पेआउट नियंत्रण"),
      payoutFrozen: t("रोका हुआ"),
      payoutEscrowActive: t("एस्क्रो सक्रिय"),
    },
    paymentRecord: {
      kicker: t("पेमेंट रिकॉर्ड"),
      walletBody: t("वॉलेट बैलेंस से कटौती हो गई है और ऑर्डर डिलीवरी तक एस्क्रो में सुरक्षित है।"),
      proofBody: t("ट्रांसफ़र का प्रमाण HenryCo फ़ाइनेंस की समीक्षा के लिए लगा दिया गया है।"),
      awaitingBody: t("पेमेंट फ़ाइनेंस के प्रमाण या डिलीवरी मिलान का इंतज़ार कर रहा है।"),
      methodLabel: t("तरीक़ा"),
      statusLabel: t("स्थिति"),
      proofLabel: t("प्रमाण"),
      viewProof: t("प्रमाण देखें"),
      walletDebit: t("वॉलेट से कटौती"),
      pending: t("लंबित"),
    },
    timeline: {
      kicker: t("टाइमलाइन"),
      title: t("ग्राहक को दिखने वाले पड़ाव, क्रम में।"),
    },
    segments: {
      kicker: t("विक्रेता सेगमेंट"),
      title: t("हर विक्रेता अपनी डिस्पैच के लिए ज़िम्मेदार रहता है।"),
      henrycoSegment: t("HenryCo सेगमेंट"),
      fulfillmentLabel: t("फ़ुलफ़िलमेंट"),
      trackingLabel: t("ट्रैकिंग"),
      payoutLabel: t("पेआउट"),
      trackingPending: t("लंबित"),
    },
    completion: {
      kicker: t("पूरा होने की पुष्टि"),
      body: t("ऑर्डर ठीक हो तो पूरा होने की पुष्टि करें। HenryCo विक्रेता का पेआउट तभी जारी करता है जब डिलीवरी पुष्ट हो जाए या ऑर्डर ऑटो-रिलीज़ की शर्तें पूरी कर ले।"),
      confirmCta: t("पूरा होने की पुष्टि करें"),
    },
    help: {
      kicker: t("मदद चाहिए?"),
      title: t("विवाद, रिफ़ंड और डिलीवरी की चिंताएँ — सब एक ही थ्रेड में चलती हैं।"),
      body: t("इस ऑर्डर नंबर के साथ सपोर्ट थ्रेड खोलें ताकि एजेंट को पूरी टाइमलाइन और विक्रेता-वार बँटवारा बिना दोबारा टाइप किए दिख जाए।"),
      openSupportCta: t("सपोर्ट थ्रेड खोलें"),
      viewAllOrdersCta: t("सभी ऑर्डर देखें"),
    },
  },
  deals: {
    metadata: {
      title: t("सत्यापित डील्स — Henry Onyx Marketplace"),
      description:
        t("भरोसे, स्टॉक की पक्की उपलब्धता और विक्रेता ज़िम्मेदारी के आधार पर छँटी हुई छूट। HenryCo डील्स पेज पर सिर्फ़ साफ़ ट्रस्ट संकेतों वाले सत्यापित प्रोडक्ट ही दिखते हैं।"),
    },
    pageIntro: {
      kicker: t("सत्यापित डील्स"),
      title: t("भरोसे, स्टॉक की पक्की उपलब्धता और विक्रेता ज़िम्मेदारी के आधार पर छँटी छूट।"),
      description:
        t("डील तभी सामने लाई जाती है जब लिस्टिंग की गुणवत्ता, विक्रेता का ट्रस्ट पासपोर्ट और स्टॉक की स्थिति इतनी साफ़ हो कि कन्वर्ज़न सुरक्षित रहे और ख़रीदार को बाद में पछतावा न हो।"),
    },
    sectionLabel: t("सत्यापित डील्स"),
    listEyebrow: t("सत्यापित डील्स"),
    refreshNote: t("नियमित रूप से अपडेट होती हैं"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("अभी कोई सत्यापित डील नहीं है"),
      body: t("जैसे-जैसे विक्रेता लिस्ट करते जाएँगे, सत्यापित छूट भी आती जाएँगी। थोड़ी देर बाद फिर देखें।"),
    },
  },
  brand: {
    eyebrow: t("ब्रांड"),
    bodyFallback:
      t("Henry Onyx Marketplace पर एक सत्यापित स्टोर — ट्रस्ट संकेत, डिलीवरी की साफ़ झलक और सेलर पासपोर्ट चेकआउट से पहले ही दिखते हैं।"),
    searchCta: t("इस ब्रांड में खोजें"),
    trustCta: t("ट्रस्ट मानक"),
    stats: {
      activeProducts: t("सक्रिय उत्पाद"),
      listingsReviewed: t("जाँचे गए लिस्टिंग"),
      listingsReviewedValue: t("हर आइटम पर ट्रस्ट पासपोर्ट दिखाई देता है"),
      buyerProtection: t("ख़रीदार सुरक्षा"),
      buyerProtectionValue: t("एस्क्रो चेकआउट"),
    },
    liveKicker: t("{brand} से लाइव"),
    openFullSearch: t("पूरी खोज खोलें"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Henry Onyx Marketplace पर {brand} के सत्यापित उत्पाद देखें — चेकआउट से पहले ट्रस्ट संकेत, डिलीवरी की साफ़ झलक और सेलर पासपोर्ट सामने रहते हैं।"),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Henry Onyx Marketplace पर {store} के सत्यापित उत्पाद देखें — चेकआउट से पहले ट्रस्ट संकेत, डिलीवरी की साफ़ झलक और सेलर पासपोर्ट सामने रहते हैं।"),
    metadataDescriptionFallback:
      t("Henry Onyx Marketplace पर एक सत्यापित स्टोर — हर चेकआउट से पहले ट्रस्ट संकेत, डिलीवरी की साफ़ झलक और सेलर पासपोर्ट दिखाई देते हैं।"),
    hero: {
      eyebrow: t("स्टोर पासपोर्ट"),
      bodyFallback:
        t("Henry Onyx Marketplace पर एक सत्यापित विक्रेता — हर चेकआउट से पहले ट्रस्ट संकेत, डिलीवरी की साफ़ झलक और पारदर्शी पासपोर्ट सामने रहते हैं।"),
    },
    stats: {
      trustScore: t("ट्रस्ट स्कोर"),
      responseSla: t("जवाब का समय"),
      responseSlaSuffix: t(" घं."),
      followers: t("फ़ॉलोअर"),
    },
    standards: {
      eyebrow: t("स्टोर मानक"),
    },
    support: {
      eyebrow: t("सहायता"),
      contactLinkLabel: t("इस स्टोर से बात करने के लिए Henry Onyx Marketplace का उपयोग करें"),
      contactBodySuffix:
        t(" — संदेश रिकॉर्ड होते हैं और आपके ऑर्डर रेफ़रेंस से जुड़े रहते हैं, ताकि हर अपडेट एक ही जगह बना रहे।"),
      ctaLabel: t("इस स्टोर से संपर्क करें"),
      subjectTemplate: t("{store} के लिए सवाल"),
    },
    reviews: {
      eyebrow: t("हाल की समीक्षाएँ"),
      verifiedPurchase: t("सत्यापित ख़रीद"),
      review: t("समीक्षा"),
    },
    catalog: {
      kicker: t("स्टोर कैटलॉग"),
      title: t("इस स्टोर पर अभी जो भी लाइव है।"),
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
    collectionsRail: {
      kicker: t("क्यूरेटेड रेल"),
      title: t("कलेक्शन जो ख़रीदारी का फ़ैसला आसान बनाते हैं।"),
    },
    catalog: {
      kicker: t("कैटेगरी कैटलॉग"),
      title: t("प्रीमियम प्रोडक्ट, ज़्यादा साफ़ ढाँचा।"),
      openSearch: t("पूरी सर्च खोलें"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Henry Onyx Marketplace पर {category} में सत्यापित प्रोडक्ट देखें — चेकआउट से पहले ट्रस्ट संकेत, डिलीवरी की साफ़ जानकारी और सेलर पासपोर्ट सामने रहते हैं।"),
      fallbackDescription:
        t("Henry Onyx Marketplace की एक क्यूरेटेड कैटेगरी देखें — चेकआउट से पहले ट्रस्ट संकेत, डिलीवरी की साफ़ जानकारी और सेलर पासपोर्ट सामने रहते हैं।"),
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
      body: t("ख़रीदारों और विक्रेताओं के सबसे आम विषय खोजें। अगर ज़रूरत की चीज़ न मिले, तो इस पेज के नीचे से एक सपोर्ट टिकट खोलें और टीम का कोई व्यक्ति उसे पढ़ेगा।"),
    },
    stillNeedHelp: {
      kicker: t("अब भी मदद चाहिए"),
      title: t("टिकट खोलें — कोई व्यक्ति उसे पढ़ेगा।"),
      body: t("टिकट पूरा संदर्भ जोड़े रखते हैं — ऑर्डर, विक्रेता, विवाद का इतिहास — ताकि टीम बिना आपको हर जवाब में दोहराए मुद्दे पर काम कर सके।"),
      ctaLabel: t("सपोर्ट टिकट खोलें"),
    },
  },
  trust: {
    metadata: {
      title: t("ट्रस्ट और सुरक्षा — Henry Onyx Marketplace"),
      description:
        t("ट्रस्ट यह तय करता है कि सेलर क्या कर सकता है, पैसा कैसे चलता है और मॉडरेशन कैसे जवाब देती है। सेलर टियर, एस्क्रो, विवाद और पेआउट रिलीज़ — सबका सर्वर-साइड रिकॉर्ड बनता है।"),
    },
    hero: {
      kicker: t("ट्रस्ट और सुरक्षा"),
      title: t("चेकआउट से पहले दिखती है। उसके बाद लागू होती है।"),
      body: t("ट्रस्ट तय करता है कि सेलर क्या कर सकता है, पैसा कैसे चलता है और मॉडरेशन कैसे प्रतिक्रिया देती है। सेलर टियर, बायर रिस्क, लिस्टिंग स्कोरिंग, एस्क्रो, विवाद और पेआउट रिलीज़ — सबका सर्वर-साइड रिकॉर्ड बनता है।"),
      pillars: [
        { label: t("पैसा कैसे चलता है"), value: t("एस्क्रो में, जाँच के बाद रिलीज़") },
        { label: t("रिव्यू"), value: t("सर्वर-लॉग, विवाद में ट्रेस होने योग्य") },
        { label: t("टियर"), value: t("अर्जित, और वापस लिए जा सकने वाले") },
      ],
    },
    guardrails: {
      kicker: t("चार सुरक्षा रेखाएँ"),
      items: [
        {
          title: t("ट्रस्ट पासपोर्ट"),
          body: t("हर स्टोर और प्रोडक्ट पर वेरिफ़िकेशन स्तर, SLA, विवाद दर, पेआउट तत्परता और फ़ुलफ़िलमेंट स्थिति सामने रहती है।"),
        },
        {
          title: t("एस्क्रो कंट्रोल"),
          body: t("बायर का पैसा पहले HenryCo के पास रहता है — डिलीवरी और ट्रस्ट चेक पास होने पर ही पेआउट में जाता है।"),
        },
        {
          title: t("एंटी-फ्रॉड समीक्षा"),
          body: t("प्लेटफ़ॉर्म से बाहर भुगतान की कोशिश, डुप्लिकेट मीडिया, अचानक लिस्टिंग का उछाल और जोखिम भरे पेआउट पैटर्न रिव्यू क्यू में आते हैं।"),
        },
        {
          title: t("ऑडिट ट्रेल"),
          body: t("मंज़ूरी, अस्वीकृति, पेआउट क्रियाएँ, विवाद निर्णय और ऑटोमेशन स्वीप सब सर्वर-साइड लॉग होते हैं।"),
        },
      ],
    },
    sellerLadder: {
      kicker: t("सेलर ट्रस्ट लैडर"),
      title: t("टियर बर्ताव से अर्जित होते हैं, ख़रीदे नहीं जाते।"),
    },
    policySurfaces: {
      kicker: t("पॉलिसी सरफ़ेस"),
      title: t("जिन मानकों पर हम ख़ुद को परखते हैं।"),
    },
    ecosystem: {
      kicker: t("इकोसिस्टम-व्यापी ट्रस्ट सुदृढ़ीकरण"),
    },
  },
  sell: {
    metadata: {
      title: t("HenryCo पर बेचें — भरोसे की अगुवाई करने वाले विक्रेताओं के लिए चुनिंदा मार्केटप्लेस"),
      description:
        t("Henry Onyx Marketplace पर बेचने के लिए आवेदन करें: भरोसे पर टिकी पोज़िशनिंग, प्रीमियम स्टोरफ्रंट और ऑर्डर, भुगतान व सपोर्ट के लिए एक ही जगह काम करने की सुविधा।"),
    },
    hero: {
      kicker: t("HenryCo पर बेचें"),
      title: t("मूल रूप से चयनात्मक। उन विक्रेताओं के लिए जो भरोसे की अगुवाई करते हैं।"),
      body: t("Henry Onyx Marketplace उन विक्रेताओं को तरजीह देता है जो प्रस्तुति का ख़याल रखते हैं, भरोसेमंद डिलीवरी करते हैं और ख़रीदार सुरक्षा को सच्चे मन से निभाते हैं। मानक इस पेज पर खुलकर बताए गए हैं; विक्रेता आवेदन आपके HenryCo अकाउंट के अंदर जारी रहता है।"),
      primaryCta: t("विक्रेता आवेदन खोलें"),
      secondaryCta: t("विक्रेता मूल्य देखें"),
      signInCta: t("HenryCo अकाउंट से साइन इन करें"),
      highlights: [
        { label: t("चयन"), value: t("मैनुअल समीक्षा, पेड-लिस्टिंग नहीं") },
        { label: t("स्टोरफ्रंट"), value: t("ख़रीदारों को दिखता ट्रस्ट पासपोर्ट") },
        { label: t("वर्कस्पेस"), value: t("ऑर्डर, पेआउट, सपोर्ट एक साथ") },
      ],
    },
    advantages: {
      kicker: t("मज़बूत विक्रेता यहाँ क्यों आगे बढ़ते हैं"),
      items: [
        { title: t("भरोसे पर टिकी पोज़िशनिंग"), body: t("आपके स्टोर को साफ़ दिखने वाला ट्रस्ट पासपोर्ट मिलता है, न कि कम-गुणवत्ता वाले मार्केटप्लेस के शोर में दब जाना।") },
        { title: t("बेहतर स्टोरफ्रंट क्वालिटी"), body: t("एडिटोरियल रेल, शांत सर्च और साफ़ प्रोडक्ट कार्ड क्वालिटी स्टोर को तेज़ी से कन्वर्ज़न तक पहुँचाते हैं।") },
        { title: t("तेज़ संचालन"), body: t("पेआउट, ऑर्डर, सपोर्ट, मॉडरेशन और स्टॉक अलर्ट सब कुछ एक साफ़ वर्कस्पेस में दिखता रहता है।") },
      ],
    },
    onboarding: {
      kicker: t("ऑनबोर्डिंग कैसे होती है"),
      stepLabel: t("चरण"),
      steps: [
        { step: "01", title: t("विक्रेता आवेदन शुरू करें"), body: t("आवेदन अपने HenryCo अकाउंट से खोलें — जैसे-जैसे विवरण जोड़ते जाएँ, ड्राफ़्ट अपने आप सेव होते जाते हैं।") },
        { step: "02", title: t("व्यवसाय विवरण जोड़ें"), body: t("व्यवसाय का नाम, स्टोर प्रोफ़ाइल, प्रोडक्ट फ़ोकस और वे वेरिफ़िकेशन डॉक्युमेंट जो बताते हैं कि आप ऑर्डर कैसे पूरे करते हैं।") },
        { step: "03", title: t("आवेदन की समीक्षा"), body: t("HenryCo टीम दस्तावेज़, ट्रस्ट संकेत और स्टोर की तैयारी देखती है — सिर्फ़ कोई पेड बैज नहीं।") },
        { step: "04", title: t("वेंडर ऑनबोर्डिंग"), body: t("स्वीकृत विक्रेता वेंडर ऑनबोर्डिंग में जाते हैं, जहाँ कीमतें, लिस्टिंग शुल्क, पेआउट विंडो और नीतियाँ पब्लिश से पहले ही दिखती हैं।") },
      ],
      callout: {
        eyebrow: t("साफ़-सुथरा विक्रेता आवेदन"),
        body: t("विक्रेता रजिस्ट्रेशन आपके अकाउंट के अंदर रहता है, इसलिए व्यवसाय विवरण, समीक्षा की स्थिति और स्वीकृति अपडेट निजी रहते हैं और फ़ॉलो करना आसान होता है।"),
      },
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
    trustTiers: {
      kicker: t("ट्रस्ट टियर विशेषाधिकार बदलते हैं"),
      title: t("तेज़ पेआउट, बड़े स्टोरफ्रंट और नीति-स्तर के लाभ कमाएँ।"),
    },
    closing: {
      kicker: t("आगे बढ़ें"),
      title: t("आवेदन करें, फिर अपने अकाउंट से आवेदन की स्थिति देखें।"),
      body: t("अनुमोदन से वेंडर ऑनबोर्डिंग खुलती है। पब्लिश करने से पहले ही कीमत, लिस्टिंग शुल्क और पेआउट विंडो दिख जाती है — बाद में कोई कॉन्ट्रैक्ट-सरप्राइज़ नहीं।"),
      primaryCta: t("आवेदन शुरू करें"),
      secondaryCta: t("वेंडर वर्कस्पेस देखें"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("विक्रेता कीमत — Henry Onyx Marketplace"),
      description:
        t("प्लान शुल्क, लिस्टिंग शुल्क, फ़ीचर्ड स्लॉट शुल्क, ट्रांज़ैक्शन कमीशन और पेआउट प्रोसेसिंग — सब पहले से बताए जाते हैं, इन्वेंट्री पब्लिश करने से पहले, बाद में नहीं।"),
    },
    hero: {
      kicker: t("विक्रेता कीमत"),
      title: t("साफ़ इकोनॉमिक्स। कोई छिपा शुल्क नहीं।"),
      body: t("प्लान शुल्क, लिस्टिंग शुल्क, फ़ीचर्ड स्लॉट शुल्क, ट्रांज़ैक्शन कमीशन और पेआउट प्रोसेसिंग — सब इन्वेंट्री पब्लिश करने से पहले ही बताए जाते हैं, बाद में नहीं।"),
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
    economics: {
      kicker: t("HenryCo कैसे कमाता है"),
      title: t("पहले से बताया, खुले में काटा।"),
      items: [
        t("हर वेंडर ऑर्डर-ग्रुप सेटलमेंट से पेआउट रिलीज़ से पहले ट्रांज़ैक्शन कमीशन काटा जाता है।"),
        t("विक्रेता के सक्रिय प्लान में शामिल लिस्टिंग कोटा खत्म होने के बाद ही पोस्टिंग शुल्क लागू होता है।"),
        t("फ़ीचर्ड प्लेसमेंट अलग सशुल्क अनुरोध है और गुणवत्ता व ट्रस्ट समीक्षा के अधीन रहता है।"),
        t("पेआउट प्रोसेसिंग शुल्क विक्रेता सेटलमेंट स्नैपशॉट में ही कट जाते हैं, बाद में अचानक नहीं।"),
        t("Studio, Learn और Logistics की वैल्यू-ऐडेड सेवाएँ विक्रेताओं के लिए अतिरिक्त राजस्व-लेन खोलती हैं।"),
        t("ऑपरेटर द्वारा नियंत्रित कैम्पेन और स्पॉन्सर्ड स्लॉट ऑडिटेबल रहते हैं — सेल्फ-सर्व अव्यवस्था में नहीं बदलते।"),
      ],
    },
    trustTiers: {
      kicker: t("ट्रस्ट-टियर पेआउट टाइमिंग"),
      title: t("बेहतर व्यवहार से होल्ड छोटा होता है।"),
    },
    closing: {
      kicker: t("आवेदन के लिए तैयार?"),
      title: t("आवेदन आपके HenryCo अकाउंट में खुलेगा।"),
      body: t("आप ड्राफ्ट सेव कर वापस आ सकते हैं — यहाँ दिख रही कीमत वेंडर ऑनबोर्डिंग पूरा होते ही लागू हो जाती है।"),
      primaryCta: t("विक्रेता के रूप में आवेदन"),
      secondaryCta: t("ट्रस्ट मानक"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — HenryCo मार्केटप्लेस"),
      descriptionTemplate:
        t("HenryCo मार्केटप्लेस पर {collection} देखें — सत्यापित प्रोडक्ट्स की क्यूरेटेड लाइन-अप, ट्रस्ट सिग्नल, स्पष्ट डिलीवरी और चेकआउट से पहले दिखता सेलर ट्रस्ट पासपोर्ट।"),
      fallbackDescription:
        t("HenryCo मार्केटप्लेस का एक क्यूरेटेड कलेक्शन — सत्यापित प्रोडक्ट्स, ट्रस्ट सिग्नल, साफ डिलीवरी और चेकआउट से पहले दिखता सेलर ट्रस्ट पासपोर्ट।"),
    },
    hero: {
      primaryCta: t("पूरी सर्च खोलें"),
      secondaryCta: t("ट्रस्ट मानक"),
    },
    sidebar: {
      itemsLabel: t("कलेक्शन में आइटम"),
      editedByLabel: t("क्यूरेट किया"),
      editedByValue: t("मार्केटप्लेस ऑपरेशंस"),
      buyerProtectionLabel: t("बायर सुरक्षा"),
      buyerProtectionValue: t("एस्क्रो चेकआउट"),
    },
    rail: {
      kicker: t("इस लाइन-अप में क्या है"),
      itemsSuffix: t("आइटम"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — HenryCo मार्केटप्लेस"),
      descriptionTemplate:
        t("HenryCo मार्केटप्लेस पर {policy} — सर्वर पर लॉग की गई एनफोर्समेंट, एस्क्रो पेमेंट कंट्रोल और चेकआउट से पहले दिखता ट्रस्ट रुख।"),
      fallbackTitle: t("मार्केटप्लेस नीति — HenryCo मार्केटप्लेस"),
      fallbackDescription:
        t("HenryCo मार्केटप्लेस की एक नीति — सर्वर पर लॉग की गई एनफोर्समेंट, एस्क्रो पेमेंट कंट्रोल और चेकआउट से पहले दिखता ट्रस्ट रुख।"),
    },
    hero: {
      backToTrust: t("ट्रस्ट मानकों पर लौटें"),
      openSupport: t("सपोर्ट थ्रेड खोलें"),
    },
    details: {
      coverageLabel: t("कवरेज"),
      enforcementLabel: t("एनफोर्समेंट"),
      updatedLabel: t("अपडेट"),
    },
    coverageBySlug: {
      buyerProtection: t("बायर्स"),
      sellerPolicy: t("सेलर्स"),
      fallback: t("मार्केटप्लेस के प्रतिभागी"),
    },
    enforcementBySlug: {
      buyerProtection: t("एस्क्रो में रोके गए पेमेंट + विवाद पर पेआउट फ्रीज़"),
      sellerPolicy: t("ट्रस्ट-टियर समीक्षा + पेआउट रिज़र्व"),
      fallback: t("सर्वर पर लॉग किया गया ट्रेल"),
    },
    updatedBySlug: {
      buyerProtection: t("पेमेंट और विवाद रिविज़न पर"),
      sellerPolicy: t("सेलर मानकों के रिविज़न पर"),
      fallback: t("नीति रिविज़न पर"),
    },
    provisions: {
      kicker: t("नीति प्रावधान"),
    },
    ecosystem: {
      kicker: t("जुड़े हुए मार्केटप्लेस कंट्रोल"),
      openLabel: t("खोलें"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{title} Henry Onyx Marketplace पर — चेकआउट से पहले सत्यापित स्टॉक, भरोसेमंद डिलीवरी और सेलर पासपोर्ट सबकुछ साफ़।"),
      fallbackDescription:
        t("Henry Onyx Marketplace पर एक सत्यापित लिस्टिंग — चेकआउट से पहले ट्रस्ट सिग्नल, डिलीवरी की स्पष्टता और सेलर पासपोर्ट साफ़ दिखते हैं।"),
    },
    fulfillment: {
      sellerTrustLabel: t("सेलर ट्रस्ट"),
      sellerTrustValueTemplate: t("{vendor} पासपोर्ट दिख रहा है"),
      sellerTrustValueFallback: t("सेलर पासपोर्ट अभी पेंडिंग"),
      availabilityLabel: t("उपलब्धता"),
      availabilityValueSingular: t("वर्तमान स्टॉक में {count} यूनिट"),
      availabilityValuePlural: t("वर्तमान स्टॉक में {count} यूनिट"),
      fulfillmentLabel: t("डिलीवरी"),
      paymentLabel: t("भुगतान"),
      paymentValueCod: t("COD या सत्यापित ट्रांसफ़र"),
      paymentValueVerified: t("सत्यापित ट्रांसफ़र फ़्लो"),
    },
    price: {
      label: t("क़ीमत"),
      leadTimeLabel: t("लीड टाइम"),
    },
    safety: {
      kicker: t("यह लिस्टिंग ज़्यादा सुरक्षित क्यों लगती है"),
      stockTemplate: t("इन्वेंटरी में अभी {count} यूनिट दिख रही हैं"),
      codEligible: t("जहाँ सपोर्ट है वहाँ कैश ऑन डिलीवरी उपलब्ध"),
      codFallback: t("मैनुअल वेरिफ़िकेशन फ़्लो उपलब्ध"),
      vendorLinkedTemplate: t("{vendor} का सेलर पासपोर्ट सीधे इसी पेज से लिंक है"),
      vendorPending: t("वेंडर ट्रस्ट सरफ़ेस अभी लिंक नहीं हुआ"),
      reviewsTemplateSingular: t("{count} रिव्यू, औसत रेटिंग {rating}"),
      reviewsTemplatePlural: t("{count} रिव्यू, औसत रेटिंग {rating}"),
    },
    detail: {
      kicker: t("प्रोडक्ट डिटेल"),
      title: t("चेकआउट से पहले जो भी ज़रूरी है।"),
      deliverySummaryTitle: t("डिलीवरी, सपोर्ट और ऑर्डर के बाद की देखभाल"),
      deliveryFallback: t("डिलीवरी विंडो चेकआउट पर स्पष्ट कर दी जाएंगी।"),
      deliveryTail:
        t("ऑर्डर पेमेंट से लेकर डिलीवरी तक ट्रेसेबल रहते हैं, और कोई भी विवाद या सपोर्ट थ्रेड उसी ऑर्डर रिकॉर्ड से जुड़ा रहता है।"),
      specsTitle: t("स्पेसिफ़िकेशन और मटीरियल की स्पष्टता"),
      passportTitle: t("स्टोर पासपोर्ट और जुड़ी खोज"),
      visitVendorTemplate: t("{vendor} पर जाएँ"),
      exploreCategoryTemplate: t("{category} एक्सप्लोर करें"),
      seeBrandTemplate: t("{brand} देखें"),
    },
    related: {
      kicker: t("सेट पूरा करें"),
      title: t("इसी ख़रीद-संदर्भ में और भी विकल्प।"),
      body: t("रिकमेंडेशन रेल्स क्यूरेटेड और साफ़ रहती हैं, अनचाही पुश-सेल नहीं।"),
    },
    reviews: {
      kicker: t("रिव्यू हाइलाइट्स"),
      title: t("सत्यापित ख़रीद-सिग्नल, बेमतलब का शोर नहीं।"),
      verifiedPurchase: t("सत्यापित ख़रीद"),
      reviewLabel: t("रिव्यू"),
    },
    rail: {
      kicker: t("ग्राहकों ने यह भी ख़रीदा"),
      headline: t("अपनी जगह खोए बिना ब्राउज़ करते रहें।"),
      caption:
        t("को-पर्चेज़ और मिलते-जुलते कैटेगरी सिग्नल अगला तार्किक क़दम दिखाते हैं, ज़बरदस्ती की अपसेल नहीं।"),
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
      title: t("Nkata mara mma — mgbanwe ngwa ngwa na nghọta doro anya maka iwepụ ibu n'otu otu."),
      description:
        t("Nkata na-edobe nchịkọta ndị na-ere ahịa ka ọ pụta ìhè, na-emelite ọnụ ọgụgụ ngwa ngwa, ma na-eme ka njikọ na obere drawer nkata gụzosie ike, ka ndị na-azụ ahịa ghara ịtụfu echiche ha mgbe ha na-eru ebe ịkwụ ụgwọ."),
    },
    emptyState: {
      title: t("Nkata gị ka tọgbọrọ chakoo."),
      body: t("Tinye ihe ọsọ ọsọ site na kaadị ngwa ahịa, debe ihe maka mgbe ọzọ — nkata ga-anọgide na-emelite n'ime drawer mini na nkata zuru oke n'enweghị nlọghachi azụ."),
      ctaLabel: t("Lelee ngwa ahịa"),
    },
  },
  track: {
    metadata: {
      title: t("Nsochi iwu — Henry Onyx Marketplace"),
      description:
        t("Soro akụkụ onye nke ọ bụla na-ere ahịa, mmelite ịkwụ ụgwọ, na ihe ndọrọ nsonye dị mkpa n'otu ebe. Escrow nọgide na-arụ ọrụ ruo mgbe a kwadoro nnyefe."),
    },
    hero: {
      kicker: t("Nsochi iwu"),
      titlePrefix: t("Nsochi"),
      body: t("Ìhè iwu kewara n'akụkụ na-anọgide na-apụta n'ebe a: akụkụ onye nke ọ bụla na-ere ahịa, mmelite ịkwụ ụgwọ na ihe ndọrọ nsonye nke ọ bụla nwere ahịrị nke ya, ka nkwado na atụmatụ onye na-azụ ahịa wee dabaa."),
      orderValueLabel: t("Uru iwu"),
      paymentLabel: t("Ịkwụ ụgwọ"),
      payoutControlLabel: t("Njikwa nkwụghachi ụgwọ"),
      payoutFrozen: t("E kwụsịrị"),
      payoutEscrowActive: t("Escrow na-arụ ọrụ"),
    },
    paymentRecord: {
      kicker: t("Ndekọ ịkwụ ụgwọ"),
      walletBody: t("E sitere n'akpa ego wepụ ego, iwu nọkwa n'escrow ruo mgbe nnyefe gachara."),
      proofBody: t("E tinyere ihe akaebe nke nkwụnye ego ka ndị na-elekọta ego HenryCo nyochaa ya."),
      awaitingBody: t("Ịkwụ ụgwọ na-eche ihe akaebe sitere n'aka ndị na-elekọta ego ma ọ bụ idokọ mgbe nnyefe ruru."),
      methodLabel: t("Ụzọ"),
      statusLabel: t("Ọnọdụ"),
      proofLabel: t("Akaebe"),
      viewProof: t("Lelee akaebe"),
      walletDebit: t("Mwepụ akpa ego"),
      pending: t("Na-echere"),
    },
    timeline: {
      kicker: t("Usoro oge"),
      title: t("Ihe ndọrọ nsonye nke ndị ahịa na-ahụ, n'usoro."),
    },
    segments: {
      kicker: t("Akụkụ ndị na-ere ahịa"),
      title: t("Onye nke ọ bụla na-ere ahịa na-aza maka mbufe nke ya."),
      henrycoSegment: t("Akụkụ HenryCo"),
      fulfillmentLabel: t("Mbufe"),
      trackingLabel: t("Nsochi"),
      payoutLabel: t("Nkwụghachi ụgwọ"),
      trackingPending: t("Na-echere"),
    },
    completion: {
      kicker: t("Nkwado nke ngwụcha"),
      body: t("Kwado mgwụcha mgbe iwu ahụ dị mma. HenryCo na-ahapụ nkwụghachi ụgwọ onye na-ere ahịa naanị mgbe a kwadoro nnyefe ma ọ bụ mgbe iwu ahụ ruru ihe ọkpụkpụ na-ahapụ onwe ya."),
      confirmCta: t("Kwado ngwụcha"),
    },
    help: {
      kicker: t("Ịchọrọ enyemaka?"),
      title: t("Esemokwu, nkwụghachi ego, na nchegbu nnyefe niile na-aga site n'otu eriri."),
      body: t("Mepee eriri nkwado nke nwere nọmba iwu a etinyere, ka onye nyere aka wee hụ usoro oge zuru oke na nkewa onye na-ere ahịa n'enweghị ka i depụta ya ọzọ."),
      openSupportCta: t("Mepee eriri nkwado"),
      viewAllOrdersCta: t("Lelee iwu niile"),
    },
  },
  deals: {
    metadata: {
      title: t("Mbelata ọnụahịa enyochara — Henry Onyx Marketplace"),
      description:
        t("Mbelata ọnụahịa esiwo nzọcha ntụkwasị obi, nkwado ngwongwo dị n'ụlọ ahịa, na ọrụ onye na-ere ahịa. Naanị ndepụta enyochara nke nwere akara ntụkwasị obi dị ọcha na-apụta na peeji deals nke HenryCo."),
    },
    pageIntro: {
      kicker: t("Mbelata ọnụahịa enyochara"),
      title: t("Mbelata ọnụahịa esiwo nzọcha ntụkwasị obi, nkwado ngwongwo dị, na ọrụ onye na-ere ahịa."),
      description:
        t("Anyị na-egosi naanị mbelata ọnụahịa mgbe ịdị mma ndepụta, paspọtụ ntụkwasị obi nke onye na-ere ahịa, na ọnọdụ ngwongwo dị ọcha nke ọma iji chebe ịgbanwe ahịa ma belata mwute mgbe e zụsịrị."),
    },
    sectionLabel: t("Mbelata ọnụahịa enyochara"),
    listEyebrow: t("Mbelata ọnụahịa enyochara"),
    refreshNote: t("Na-emelite oge niile"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("O nweghị mbelata ọnụahịa enyochara ugbu a"),
      body: t("Mbelata enyochara na-abata ka ndị na-ere ahịa na-edepụta ha. Lọghachi ọzọ obere oge."),
    },
  },
  brand: {
    eyebrow: t("Akaraaka ahịa"),
    bodyFallback:
      t("Ụlọ ahịa enyochara n'elu Henry Onyx Marketplace, ebe akara ntụkwasị obi, nghọta nnyefe, na paspọtụ onye na-ere ahịa na-egosi tupu ịkwụ ụgwọ."),
    searchCta: t("Chọọ n'ime akaraaka ahịa a"),
    trustCta: t("Ọkwa ntụkwasị obi"),
    stats: {
      activeProducts: t("Ngwa ahịa na-arụ ọrụ"),
      listingsReviewed: t("Edemede enyochara"),
      listingsReviewedValue: t("Paspọtụ ntụkwasị obi pụtara ìhè kwa ihe"),
      buyerProtection: t("Nchekwa onye na-azụ ahịa"),
      buyerProtectionValue: t("Ịkwụ ụgwọ site n'aka onye nnọchi anya"),
    },
    liveKicker: t("Ọkụ ọkụ site na {brand}"),
    openFullSearch: t("Mepee nchọta zuru oke"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Lelee ngwa ahịa enyochara nke {brand} na Henry Onyx Marketplace — akara ntụkwasị obi, nghọta nnyefe, na paspọtụ ndị na-ere ahịa na-egosi tupu ịkwụ ụgwọ."),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Lelee ngwa ahịa enyochara nke {store} na Henry Onyx Marketplace — akara ntụkwasị obi, nghọta nnyefe, na paspọtụ onye na-ere ahịa na-egosi tupu ịkwụ ụgwọ."),
    metadataDescriptionFallback:
      t("Ụlọ ahịa enyochara n'elu Henry Onyx Marketplace — akara ntụkwasị obi, nghọta nnyefe, na paspọtụ onye na-ere ahịa na-egosi tupu ịkwụ ụgwọ ọ bụla."),
    hero: {
      eyebrow: t("Paspọtụ ụlọ ahịa"),
      bodyFallback:
        t("Onye na-ere ahịa enyochara n'elu Henry Onyx Marketplace — akara ntụkwasị obi, nghọta nnyefe, na paspọtụ doro anya na-egosi tupu ịkwụ ụgwọ ọ bụla."),
    },
    stats: {
      trustScore: t("Akara ntụkwasị obi"),
      responseSla: t("Oge nzaghachi"),
      responseSlaSuffix: t(" awa"),
      followers: t("Ndị na-eso"),
    },
    standards: {
      eyebrow: t("Ọkwa ụlọ ahịa"),
    },
    support: {
      eyebrow: t("Nkwado"),
      contactLinkLabel: t("Jiri Henry Onyx Marketplace kpọtụrụ ụlọ ahịa a"),
      contactBodySuffix:
        t(" — a na-edekọ ozi ma jikọta ya na nrụtụaka iwu gị ka mmelite ọ bụla na-anọgide n'otu ebe."),
      ctaLabel: t("Kpọtụrụ ụlọ ahịa a"),
      subjectTemplate: t("Ajụjụ maka {store}"),
    },
    reviews: {
      eyebrow: t("Nyocha ọhụrụ"),
      verifiedPurchase: t("Ịzụta enyochara"),
      review: t("Nyocha"),
    },
    catalog: {
      kicker: t("Katalọgụ ụlọ ahịa"),
      title: t("Ihe niile ụlọ ahịa a nwere ugbu a na-arụ ọrụ."),
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
    collectionsRail: {
      kicker: t("Ngwakọta a họpụtara"),
      title: t("Mkpokọta na-eme ka mkpebi ịzụrụ dị mfe."),
    },
    catalog: {
      kicker: t("Katalọgụ ụdị"),
      title: t("Ngwa ahịa nke kachasị mma, usoro doro anya."),
      openSearch: t("Mepee ọchụchọ zuru ezu"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Chọpụta ngwa ahịa enyochara n'ime {category} na Henry Onyx Marketplace, na akara ntụkwasị obi, nghọta nnyefe doro anya, na paspọtụ ndị na-ere ahịa nke pụtara tupu ịkwụ ụgwọ."),
      fallbackDescription:
        t("Tụgharịa n'ime ụdị a họpụtara na Henry Onyx Marketplace, na akara ntụkwasị obi, nghọta nnyefe doro anya, na paspọtụ ndị na-ere ahịa tupu ịkwụ ụgwọ."),
    },
  },
  trust: {
    metadata: {
      title: t("Ntụkwasị obi & nchekwa — Henry Onyx Marketplace"),
      description:
        t("Ntụkwasị obi na-achịkwa ihe onye na-ere ahịa nwere ike ime, otú ego si agagharị, na otú nlekota si aza. Ọkwa ndị na-ere ahịa, nchekwa ego site n'aka onye nnọchi anya, esemokwu, na ntọhapụ ego niile na-ahapụ ndekọ na sava."),
    },
    hero: {
      kicker: t("Ntụkwasị obi & nchekwa"),
      title: t("Pụta ìhè tupu ịkwụ ụgwọ. Manye ya mgbe ọ gachara."),
      body: t("Ntụkwasị obi na-achịkwa ihe onye na-ere ahịa nwere ike ime, otú ego si agagharị, na otú nlekota si meghachi. Ọkwa ndị na-ere ahịa, ihe egwu nke onye na-azụ ahịa, akara nke edemede, nchekwa ego, esemokwu, na ntọhapụ ego niile na-ahapụ ndekọ na sava."),
      pillars: [
        { label: t("Ngagharị ego"), value: t("Nọ n'aka onye nnọchi, ahapụ mgbe nyochaa") },
        { label: t("Ntule"), value: t("Edebere na sava, enwere ike ịchọta n'esemokwu") },
        { label: t("Ọkwa"), value: t("A na-enweta ya, enwere ike iwepụ ya") },
      ],
    },
    guardrails: {
      kicker: t("Ihe nchebe anọ"),
      items: [
        {
          title: t("Paspọtụ ntụkwasị obi"),
          body: t("Ụlọ ahịa na ngwa ahịa ọ bụla na-egosi ọkwa nyocha, SLA, ọnụego esemokwu, njikere ịnata ego, na ọnọdụ mmezu."),
        },
        {
          title: t("Njikwa nchekwa ego"),
          body: t("Ego onye na-azụ ahịa na-anọ buru ụzọ n'aka HenryCo, ma na-aga naanị na ntọhapụ mgbe nyefere agachara nyochaa."),
        },
        {
          title: t("Nyocha mgbochi aghụghọ"),
          body: t("Ịkpalite ịkwụ ụgwọ na mpụga elu ikuku, mídia eberebe, mwube ngwa ahịa na-eri eri, na ụzọ ntọhapụ ego dị egwu na-abata na ahịrị nyocha."),
        },
        {
          title: t("Ụzọ nlebanya"),
          body: t("Nkwado, ajụ, mmemme ntọhapụ ego, mkpebi esemokwu, na nyocha akpaaka niile bụ ndị edebere na sava."),
        },
      ],
    },
    sellerLadder: {
      kicker: t("Mgbago ntụkwasị obi ndị na-ere ahịa"),
      title: t("Ọkwa enwetara site n'omume, ọ bụghị nke a zụrụ ego."),
    },
    policySurfaces: {
      kicker: t("Ebe iwu na-egosi"),
      title: t("Ụkpụrụ anyị na-eji eche onwe anyị."),
    },
    ecosystem: {
      kicker: t("Mmemme ntụkwasị obi nke gbasaa n'ụlọ niile"),
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
      body: t("Chọọ isiokwu ndị ndị na-azụ ahịa na ndị na-ere ahịa na-ajụkarị. Ọ bụrụ na ị chọtaghị ihe ị chọrọ, mepee tiketi nkwado n'okpuru ibe a, mmadụ n'otu ga-agụ ya."),
    },
    stillNeedHelp: {
      kicker: t("Ka chọrọ enyemaka"),
      title: t("Mepee tiketi nkwado — mmadụ ga-agụ ya."),
      body: t("Tiketi na-edobe ihe niile gbasara ya — iwu ahịa, onye na-ere, akụkọ esemokwu — ka otu na-arụ ọrụ na ya n'agbanyeghị ka ị deghachi ya na nzaghachi ọ bụla."),
      ctaLabel: t("Mepee tiketi nkwado"),
    },
  },
  sell: {
    metadata: {
      title: t("Ree ahịa na HenryCo — ahịa a họpụtara maka ndị na-ere ahịa na-eduga na ntụkwasị obi"),
      description:
        t("Tinye akwụkwọ maka ire ahịa na Henry Onyx Marketplace: njikere nke dabere na ntụkwasị obi, ụlọ ahịa mara mma na otu ebe maka iwu ahịa, ịkwụ ụgwọ na nkwado."),
    },
    hero: {
      kicker: t("Ree ahịa na HenryCo"),
      title: t("Nhọrọ site na atụmatụ. E meere ya maka ndị na-ere ahịa nke na-eduga na ntụkwasị obi."),
      body: t("Henry Onyx Marketplace na-eburu ụzọ họrọ ndị na-ere ahịa na-eche maka ngosi, ndị nwere ntụkwasị obi na nnyefe, na ndị ji obi eziokwu na-echekwa ndị na-azụ ahịa. Ihe a chọrọ doro anya na ibe a; akwụkwọ ire ahịa na-aga n'ihu n'akaụntụ HenryCo gị."),
      primaryCta: t("Mepee akwụkwọ ire ahịa"),
      secondaryCta: t("Lee ego ndị na-ere ahịa"),
      signInCta: t("Banye site na akaụntụ HenryCo"),
      highlights: [
        { label: t("Nhọrọ"), value: t("Nyocha aka, ọ bụghị ịkwụ ụgwọ idepụta") },
        { label: t("Ụlọ ahịa"), value: t("Paspọtụ ntụkwasị obi ka ndị na-azụ ahịa hụ") },
        { label: t("Ebe ọrụ"), value: t("Iwu ahịa, ịkwụ ụgwọ na nkwado n'otu ebe") },
      ],
    },
    advantages: {
      kicker: t("Maka gịnị mere ndị na-ere ahịa siri ike ji emeri ebe a"),
      items: [
        { title: t("Njikere dabere na ntụkwasị obi"), body: t("Ụlọ ahịa gị na-enweta paspọtụ ntụkwasị obi pụtara ìhè, kama ka ọ ghara ifuru n'ime mkpọtụ ahịa na-adịghị elu.") },
        { title: t("Ụlọ ahịa nke ọma karịa"), body: t("Ụzọ nkọwa, ọchụchọ dị jụụ, na kaadị ngwa ahịa dị ọcha na-enyere ụlọ ahịa dị mma aka ịgbanwe ngwa ngwa.") },
        { title: t("Mmemme doro anya"), body: t("Ịkwụ ụgwọ, iwu ahịa, nkwado, nlekọta na ọkwa ngwa na-anọgide na-egosi n'otu ebe ọrụ kachasị ọcha.") },
      ],
    },
    onboarding: {
      kicker: t("Otu mmalite si arụ ọrụ"),
      stepLabel: t("Nzọụkwụ"),
      steps: [
        { step: "01", title: t("Bido akwụkwọ ire ahịa"), body: t("Mepee akwụkwọ ahụ site n'akaụntụ HenryCo gị — ndepụta na-echekwa onwe ya ka ị na-achịkọta ihe niile.") },
        { step: "02", title: t("Tinye nkọwa azụmaahịa"), body: t("Aha azụmaahịa, profaịlụ ụlọ ahịa, ihe nzukọ ngwa ahịa, na akwụkwọ nyocha ọ bụla na-akọwa ka i si emezu iwu ahịa.") },
        { step: "03", title: t("Nyochaa akwụkwọ"), body: t("Otu HenryCo na-enyocha akwụkwọ, ihe ịrịba ama ntụkwasị obi na njikere ụlọ ahịa — ọ bụghị naanị baajị akwụ ụgwọ.") },
        { step: "04", title: t("Mmebata onye na-ere ahịa"), body: t("Ndị enyere ohere na-aga n'ihu na mmebata, ebe ego, ụgwọ idepụta, oge nkwụ ụgwọ na iwu pụtara tupu ibido ibipụta.") },
      ],
      callout: {
        eyebrow: t("Akwụkwọ ire ahịa dị ọcha"),
        body: t("Ndebanye aha onye na-ere ahịa na-anọgide n'akaụntụ gị ka nkọwa azụmaahịa, ọnọdụ nyocha, na mmelite nkwado bụrụ nzuzo ma dị mfe iso."),
      },
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
    trustTiers: {
      kicker: t("Ọkwa ntụkwasị obi na-agbanwe ihe nrite"),
      title: t("Nweta nkwụ ụgwọ ngwa ngwa, ụlọ ahịa buru ibu, na uru iwu."),
    },
    closing: {
      kicker: t("Gaa n'ihu"),
      title: t("Tinye akwụkwọ, mgbe ahụ lelee ọnọdụ akwụkwọ gị site n'akaụntụ gị."),
      body: t("Nnabata na-emepe mmebata onye na-ere ahịa. Ego, ụgwọ idepụta, na oge nkwụ ụgwọ na-egosi tupu ibipụta — enweghị ihe ijuanya nkwekọrịta nke ga-abịa ma emechaa."),
      primaryCta: t("Bido akwụkwọ"),
      secondaryCta: t("Gaa n'ebe ọrụ ndị na-ere ahịa"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Ọnụahịa onye na-ere ahịa — Henry Onyx Marketplace"),
      description:
        t("Ụgwọ atụmatụ, ụgwọ idepụta, ụgwọ oghere edobere, ego nrụaka azụmaahịa na nhazi nkwụ ụgwọ — niile na-egosi mbụ, tupu ibipụta ngwaahịa, ọ bụghị emesia."),
    },
    hero: {
      kicker: t("Ọnụahịa onye na-ere ahịa"),
      title: t("Akụnụba doro anya. Enweghị ụgwọ nzuzo."),
      body: t("Ụgwọ atụmatụ, ụgwọ idepụta, ụgwọ oghere edobere, ego nrụaka na nhazi nkwụ ụgwọ — niile na-egosi mbụ, tupu ibipụta ngwaahịa gị, ọ bụghị emesia."),
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
    economics: {
      kicker: t("Otú HenryCo si akpata ego"),
      title: t("E kwupụtara mbụ, a wepụrụ n'ihu mmadụ."),
      items: [
        t("A na-ewepụ ego nrụaka azụmaahịa n'otu otu nkwụghachi nke ìgwè iwu onye na-ere ahịa tupu ahapụ nkwụ ụgwọ."),
        t("Ụgwọ idepụta na-amalite mgbe ọnụọgụ ihe edepụtara tinyere n'atụmatụ ọrụ nke onye na-ere ahịa kwụsịrị."),
        t("Edobere ngwaahịa bụ arịrịọ akwụ ụgwọ dị iche ma na-anọgide n'okpuru nyocha ogo na ntụkwasị obi."),
        t("A na-ewepụ ụgwọ nhazi nkwụ ụgwọ n'ime ndekọ nkwụghachi onye na-ere ahịa, ọ bụghị emesia ka ihe ijuanya."),
        t("Ọrụ uru agbakwunyere nke Studio, Learn na Logistics na-emepe ụzọ ego ọzọ maka ndị na-ere ahịa."),
        t("Mkpọsa nke onye njikwa na-elekọta na oghere a kwadoro na-anọgide ka enyochaa, ọ naghị aghọ ọgbaaghara onwe-ọrụ."),
      ],
    },
    trustTiers: {
      kicker: t("Oge nkwụ ụgwọ dabere n'ọkwa ntụkwasị obi"),
      title: t("Omume ọma na-eme ka oge nkwụsị dị mkpụmkpụ."),
    },
    closing: {
      kicker: t("Ị dị njikere ịtinye akwụkwọ?"),
      title: t("Akwụkwọ a na-emepe n'akaụntụ HenryCo gị."),
      body: t("Ị nwere ike ichekwa edemede ma laghachi — ọnụahịa a na-egosi ebe a na-arụ ọrụ ozugbo mmebata onye na-ere zuru oke."),
      primaryCta: t("Tinye akwụkwọ dị ka onye na-ere"),
      secondaryCta: t("Ụkpụrụ ntụkwasị obi"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Ahịa HenryCo"),
      descriptionTemplate:
        t("Lelee {collection} n'elu Ahịa HenryCo — usoro ngwaahịa enyochara, jiri akara ntụkwasị obi, nkọwa nbuga doro anya, na paspọtụ ndị na-ere ahịa pụta ìhè tupu ịkwụ ụgwọ."),
      fallbackDescription:
        t("Otu nchịkọta ahọpụtara n'Ahịa HenryCo, jikọtara ngwaahịa enyochara, akara ntụkwasị obi, nbuga doro anya, na paspọtụ ndị na-ere ahịa tupu ịkwụ ụgwọ."),
    },
    hero: {
      primaryCta: t("Mepee nchọcha zuru oke"),
      secondaryCta: t("Ụkpụrụ ntụkwasị obi"),
    },
    sidebar: {
      itemsLabel: t("Ihe dị na nchịkọta"),
      editedByLabel: t("Onye haziri"),
      editedByValue: t("Ọrụ Ahịa HenryCo"),
      buyerProtectionLabel: t("Nchekwa onye azụ ahịa"),
      buyerProtectionValue: t("Ịkwụ ụgwọ esinyere n'isi"),
    },
    rail: {
      kicker: t("Ihe dị n'usoro ahụ"),
      itemsSuffix: t("ihe"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Ahịa HenryCo"),
      descriptionTemplate:
        t("{policy} n'elu Ahịa HenryCo — nzụlite e dekọtara na sava, njikwa ego nke akwụ́ ụgwọ, na ọnọdụ ntụkwasị obi pụta ìhè tupu ịkwụ ụgwọ."),
      fallbackTitle: t("Iwu ahịa — Ahịa HenryCo"),
      fallbackDescription:
        t("Otu iwu Ahịa HenryCo — nzụlite e dekọtara na sava, njikwa ego nke akwụ́ ụgwọ, na ọnọdụ ntụkwasị obi pụta ìhè tupu ịkwụ ụgwọ."),
    },
    hero: {
      backToTrust: t("Laghachi n'ụkpụrụ ntụkwasị obi"),
      openSupport: t("Mepee mkparịta ụka nkwado"),
    },
    details: {
      coverageLabel: t("Nchekwa"),
      enforcementLabel: t("Nzụlite"),
      updatedLabel: t("Emelitere"),
    },
    coverageBySlug: {
      buyerProtection: t("Ndị na-azụ ahịa"),
      sellerPolicy: t("Ndị na-ere ahịa"),
      fallback: t("Ndị sonye na ahịa"),
    },
    enforcementBySlug: {
      buyerProtection: t("Ego e ji n'aka HenryCo + mgbochi ụgwọ na esemokwu"),
      sellerPolicy: t("Nyochaa site n'ọkwa ntụkwasị obi + ego e debere"),
      fallback: t("Aka e dekọtara na sava"),
    },
    updatedBySlug: {
      buyerProtection: t("Mgbe mgbanwe a na-eme n'ụgwọ na esemokwu"),
      sellerPolicy: t("Mgbe mgbanwe a na-eme n'ụkpụrụ ndị na-ere"),
      fallback: t("Mgbe mgbanwe a na-eme n'iwu"),
    },
    provisions: {
      kicker: t("Akwụkwọ iwu"),
    },
    ecosystem: {
      kicker: t("Njikwa ahịa ejikọtara"),
      openLabel: t("Mepee"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{title} na Henry Onyx Marketplace — ngwaahịa anwapụtara, nbufe a tụkwasịrị obi na akwụkwọ ngafe onye na-ere ihe pụta ìhè tupu ịkwụ ụgwọ."),
      fallbackDescription:
        t("Edemede anwapụtara na Henry Onyx Marketplace — akara ntụkwasị obi, doro anya nbufe na akwụkwọ ngafe onye na-ere ihe pụta ìhè tupu ịkwụ ụgwọ."),
    },
    fulfillment: {
      sellerTrustLabel: t("Ntụkwasị obi onye na-ere"),
      sellerTrustValueTemplate: t("Akwụkwọ ngafe {vendor} pụta"),
      sellerTrustValueFallback: t("Akwụkwọ ngafe onye na-ere ka na-eche"),
      availabilityLabel: t("Ọnụnọ"),
      availabilityValueSingular: t("{count} otu n'ụlọ ahịa ugbu a"),
      availabilityValuePlural: t("{count} ihe n'ụlọ ahịa ugbu a"),
      fulfillmentLabel: t("Nbufe"),
      paymentLabel: t("Ịkwụ ụgwọ"),
      paymentValueCod: t("Kwụọ ego mgbe e wepụtara ma ọ bụ mbufe anwapụtara"),
      paymentValueVerified: t("Ụzọ mbufe anwapụtara"),
    },
    price: {
      label: t("Ọnụ ahịa"),
      leadTimeLabel: t("Oge nnyefe"),
    },
    safety: {
      kicker: t("Ihe mere edemede a ji yie nke kwụsiri ike"),
      stockTemplate: t("{count} ihe na-apụta na nchekwa ugbu a"),
      codEligible: t("Ịkwụ ego mgbe e wepụtara dị mgbe ọ kwadoro"),
      codFallback: t("Usoro nkwado n'aka dị"),
      vendorLinkedTemplate: t("Ejikọrọ akwụkwọ ngafe {vendor} ozugbo site na peeji a"),
      vendorPending: t("Akụkụ ntụkwasị obi onye na-ere ka chọrọ njikọ"),
      reviewsTemplateSingular: t("{count} nyocha na ọkwa nkezi nke {rating}"),
      reviewsTemplatePlural: t("{count} nyocha na ọkwa nkezi nke {rating}"),
    },
    detail: {
      kicker: t("Nkọwa ngwaahịa"),
      title: t("Ihe niile dị mkpa tupu ịkwụ ụgwọ."),
      deliverySummaryTitle: t("Nbufe, nkwado na nlekọta nke ọrụ gachara"),
      deliveryFallback: t("A ga-akọwapụta oge nbufe na nkwụ ụgwọ."),
      deliveryTail:
        t("Iwu ahịa na-anọgide na-eso ụzọ site n'ịkwụ ụgwọ ruo nnyefe, ndọrọ ndọrọ ma ọ bụ akwara nkwado nile na-ejide ndekọ otu iwu ahịa ahụ."),
      specsTitle: t("Nkọwa na mma nke ihe ejiri mee"),
      passportTitle: t("Akwụkwọ ngafe ụlọ ahịa na mkpughe metụtara"),
      visitVendorTemplate: t("Gaa {vendor}"),
      exploreCategoryTemplate: t("Nyochaa {category}"),
      seeBrandTemplate: t("Hụ {brand}"),
    },
    related: {
      kicker: t("Mejupụta usoro ahụ"),
      title: t("Ihe ndị ọzọ n'otu ọnọdụ ịzụ ahịa."),
      body: t("A na-elekọta usoro nkwanye ka ọ dị ọcha, ọ bụghị mkpọtụ mbukota."),
    },
    reviews: {
      kicker: t("Ihe pụtara ìhè na nyocha"),
      title: t("Akara ịzụ ahịa anwapụtara, ọ bụghị mkpọtụ efu."),
      verifiedPurchase: t("Ịzụ ahịa anwapụtara"),
      reviewLabel: t("Nyocha"),
    },
    rail: {
      kicker: t("Ndị ahịa zụtakwara"),
      headline: t("Gaa n'ihu ịchọ ihe na-atụfughị ebe i nọ."),
      caption:
        t("Akara mmekọ ịzụ na otu ụdị na-eweta nzọụkwụ na-esote n'ụzọ doro anya, ọ bụghị mkpọtụ mbukota."),
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
      title: t("Apo ìrajà tó tóótun — àtúnṣe yára yára àti àlàyé tó mọ́ fún àwọn àṣẹ tí ó pín sí ọ̀pọ̀."),
      description:
        t("Apo ìrajà náà ń jẹ́ kí àkójọpọ̀ àwọn olùtà ṣàfihàn dáadáa, ó ń ṣàtúnṣe ìye lójú-ẹsẹ̀, ó sì ń bá àpótí kéékèèkè (mini-cart) sọ̀rọ̀ pọ̀, kí àwọn olùra má baà sọnù ọ̀rọ̀ wọn nígbà tí wọ́n bá súnmọ́ ìparí ìrajà."),
    },
    emptyState: {
      title: t("Apo ìrajà rẹ ṣì ṣófo."),
      body: t("Fi nǹkan kún kíá láti orí káàdì ọjà, fi àwọn ohun pamọ́ fún ìgbà tó ń bọ̀ — apo ìrajà yóò máa wà ní ìmúdójúìwọ̀n nínú àpótí kéékèèkè àti nínú apo kíkún láìní àtúngbà ojú-ìwé."),
      ctaLabel: t("Ṣàwárí àwọn ọjà"),
    },
  },
  track: {
    metadata: {
      title: t("Ìtọpinpin àṣẹ — Henry Onyx Marketplace"),
      description:
        t("Tọpinpin gbogbo apá olùtà, ìmúdójúìwọ̀n ìsanwó, àti àmì ìfijiṣẹ́ ní ibì kan náà. Escrow yóò máa wà títí di ìgbà tí a ó fi fìdí ìfijiṣẹ́ múlẹ̀."),
    },
    hero: {
      kicker: t("Ìtọpinpin àṣẹ"),
      titlePrefix: t("Ìtọpinpin"),
      body: t("Àlàyé tó mọ́ fún àwọn àṣẹ tí ó pín sí ọ̀pọ̀ yóò máa farahàn níbí: apá olùtà kọ̀ọ̀kan, ìmúdójúìwọ̀n ìsanwó kọ̀ọ̀kan, àti àmì ìfijiṣẹ́ kọ̀ọ̀kan ní ìlà tirẹ̀ kan, kí àtìlẹyìn àti ìfojúsọ́nà olùra wà ní ìlà kan náà."),
      orderValueLabel: t("Iye àṣẹ"),
      paymentLabel: t("Ìsanwó"),
      payoutControlLabel: t("Ìṣàkóso ìsanpadà"),
      payoutFrozen: t("Ó dúró"),
      payoutEscrowActive: t("Escrow ń ṣiṣẹ́"),
    },
    paymentRecord: {
      kicker: t("Àkọsílẹ̀ ìsanwó"),
      walletBody: t("A ti yọ owó kúrò nínú àpamọ́wọ́, àṣẹ náà sì wà nínú escrow títí ìfijiṣẹ́ yóò fi parí."),
      proofBody: t("A ti fi ẹ̀rí ìfìránṣẹ́ owó hàn fún àyẹ̀wò ẹgbẹ́ ìṣúná HenryCo."),
      awaitingBody: t("Ìsanwó ń dúró de ẹ̀rí ìṣúná tàbí ìbámu ní àkókò ìfijiṣẹ́."),
      methodLabel: t("Ọ̀nà"),
      statusLabel: t("Ipò"),
      proofLabel: t("Ẹ̀rí"),
      viewProof: t("Wo ẹ̀rí"),
      walletDebit: t("Yíyọ owó nínú àpamọ́wọ́"),
      pending: t("Ó ń dúró"),
    },
    timeline: {
      kicker: t("Ìṣẹ̀lẹ̀rí àkókò"),
      title: t("Àwọn àmì tí olùra rí, nínú ètò."),
    },
    segments: {
      kicker: t("Apá olùtà"),
      title: t("Olùtà kọ̀ọ̀kan ń jíhìn fún ìfìránṣẹ́ tirẹ̀."),
      henrycoSegment: t("Apá HenryCo"),
      fulfillmentLabel: t("Ìfijiṣẹ́"),
      trackingLabel: t("Ìtọpinpin"),
      payoutLabel: t("Ìsanpadà"),
      trackingPending: t("Ó ń dúró"),
    },
    completion: {
      kicker: t("Ìfìdí ìparí múlẹ̀"),
      body: t("Fìdí ìparí múlẹ̀ nígbà tí àṣẹ náà bá tẹ́ ọ lọ́rùn. HenryCo kì í tu ìsanpadà fún olùtà sílẹ̀ àfi lẹ́yìn tí a bá ti fìdí ìfijiṣẹ́ múlẹ̀ tàbí tí àṣẹ náà bá yẹ fún ìtusílẹ̀ alátọwọ́dá-fúnra-rẹ̀."),
      confirmCta: t("Fìdí ìparí múlẹ̀"),
    },
    help: {
      kicker: t("Ṣé o nílò ìrànlọ́wọ́?"),
      title: t("Awuyewuye, ìsanpadà àti ìṣòro ìfijiṣẹ́ máa ń gba ọ̀nà eriri kan náà."),
      body: t("Ṣí eriri àtìlẹyìn pẹ̀lú nọ́mbà àṣẹ yìí tí o so mọ́, kí àṣojú náà rí ìṣẹ̀lẹ̀rí àkókò gbogbo àti ìpín olùtà láìjẹ́ pé ó dà á kọ ọ̀rọ̀ rẹ ní ẹ̀ẹ̀kejì."),
      openSupportCta: t("Ṣí eriri àtìlẹyìn"),
      viewAllOrdersCta: t("Wo gbogbo àṣẹ"),
    },
  },
  deals: {
    metadata: {
      title: t("Àwọn àdínkù tí a fọwọ́sí — Henry Onyx Marketplace"),
      description:
        t("Àdínkù tí a yan nípasẹ̀ ìgbẹ́kẹ̀lé, dájúdájú ohun-ọjà tó wà ní ìpamọ́, àti ojúṣe olùtà. Lórí ojú-ìwé deals HenryCo, kìkì àwọn àkọsílẹ̀ tó a ti fọwọ́sí pẹ̀lú àmì ìgbẹ́kẹ̀lé mímọ́ ló máa farahàn."),
    },
    pageIntro: {
      kicker: t("Àwọn àdínkù tí a fọwọ́sí"),
      title: t("Àdínkù tí a yan nípasẹ̀ ìgbẹ́kẹ̀lé, dájúdájú ohun-ọjà tó wà ní ìpamọ́, àti ojúṣe olùtà."),
      description:
        t("A ò ní gbé àdínkù síwájú àfi tí ìbígbónijú àkọsílẹ̀, ìwé-ìrìnnà ìgbẹ́kẹ̀lé olùtà, àti ipò ohun-ọjà bá mọ́ tó láti dáàbò bo àṣeyọrí ìrajà àti láti dín ìbàjẹ́-ọkàn olùra kù."),
    },
    sectionLabel: t("Àwọn àdínkù tí a fọwọ́sí"),
    listEyebrow: t("Àwọn àdínkù tí a fọwọ́sí"),
    refreshNote: t("A ń ṣàtúnṣe rẹ̀ déédéé"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("Kò sí àdínkù tí a ti fọwọ́sí nísinsìnyí"),
      body: t("Àwọn àdínkù tí a fọwọ́sí máa farahàn bí àwọn olùtà ṣe ń kọ wọ́n sílẹ̀. Padà wo wọ́n láìpẹ́."),
    },
  },
  brand: {
    eyebrow: t("Àmì-ọjà"),
    bodyFallback:
      t("Ilé-ìtajà tí a ti fọwọ́sí lórí Henry Onyx Marketplace, pẹ̀lú àwọn àmì ìgbẹ́kẹ̀lé, àlàyé pípé fún ìfijíṣẹ́, àti ìwé-ìrìnnà olùtà tí ó hàn ṣáájú ìsanwó."),
    searchCta: t("Ṣe ìwákiri nínú àmì-ọjà yìí"),
    trustCta: t("Ìlànà ìgbẹ́kẹ̀lé"),
    stats: {
      activeProducts: t("Àwọn ọjà tó ń ṣiṣẹ́"),
      listingsReviewed: t("Àwọn ìpolówó tí a yẹ̀ wò"),
      listingsReviewedValue: t("Ìwé-ìrìnnà ìgbẹ́kẹ̀lé hàn lórí ọjà kọ̀ọ̀kan"),
      buyerProtection: t("Ààbò Olùra"),
      buyerProtectionValue: t("Ìsanwó láti ọwọ́ alábojútó"),
    },
    liveKicker: t("Tààrà láti {brand}"),
    openFullSearch: t("Ṣí ìwákiri kíkún"),
    metadataTitle: t("{brand} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Ṣàwárí àwọn ọjà tí a ti fọwọ́sí láti ọ̀dọ̀ {brand} lórí Henry Onyx Marketplace, pẹ̀lú àwọn àmì ìgbẹ́kẹ̀lé, àlàyé ìfijíṣẹ́, àti ìwé-ìrìnnà olùtà ṣáájú ìsanwó."),
  },
  store: {
    metadataTitle: t("{store} — Henry Onyx Marketplace"),
    metadataDescription:
      t("Ṣàwárí àwọn ọjà tí a ti fọwọ́sí láti ọ̀dọ̀ {store} lórí Henry Onyx Marketplace, pẹ̀lú àwọn àmì ìgbẹ́kẹ̀lé, àlàyé ìfijíṣẹ́, àti ìwé-ìrìnnà olùtà tó hàn ṣáájú ìsanwó."),
    metadataDescriptionFallback:
      t("Ilé-ìtajà tí a ti fọwọ́sí lórí Henry Onyx Marketplace — àwọn àmì ìgbẹ́kẹ̀lé, àlàyé ìfijíṣẹ́, àti ìwé-ìrìnnà olùtà tí ó hàn ṣáájú gbogbo ìsanwó."),
    hero: {
      eyebrow: t("Ìwé-ìrìnnà ilé-ìtajà"),
      bodyFallback:
        t("Olùtà tí a ti fọwọ́sí lórí Henry Onyx Marketplace, pẹ̀lú àwọn àmì ìgbẹ́kẹ̀lé, àlàyé ìfijíṣẹ́, àti ìwé-ìrìnnà tí ó hàn kedere ṣáájú gbogbo ìsanwó."),
    },
    stats: {
      trustScore: t("Ìkà ìgbẹ́kẹ̀lé"),
      responseSla: t("Àkókò ìdáhùn"),
      responseSlaSuffix: t(" wákàtí"),
      followers: t("Àwọn olùtẹ̀lé"),
    },
    standards: {
      eyebrow: t("Ìlànà ilé-ìtajà"),
    },
    support: {
      eyebrow: t("Ìrànlọ́wọ́"),
      contactLinkLabel: t("Lo Henry Onyx Marketplace láti bá ilé-ìtajà yìí sọ̀rọ̀"),
      contactBodySuffix:
        t(" — a ń kọ àwọn ìfọ̀rọ̀wérọ̀ sílẹ̀, a sì ń so wọ́n mọ́ ìtọ́kasí àṣẹ rẹ kí gbogbo àfikún ìmúdójúìwọ̀n máa wà ní ibìkan ṣoṣo."),
      ctaLabel: t("Bá ilé-ìtajà yìí sọ̀rọ̀"),
      subjectTemplate: t("Ìbéèrè fún {store}"),
    },
    reviews: {
      eyebrow: t("Àwọn àbẹ̀wò tuntun"),
      verifiedPurchase: t("Rírà tí a fọwọ́sí"),
      review: t("Àbẹ̀wò"),
    },
    catalog: {
      kicker: t("Àkójọ-ọjà ilé-ìtajà"),
      title: t("Gbogbo ohun tí ilé-ìtajà yìí ní lórí ètò báyìí."),
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
    collectionsRail: {
      kicker: t("Àkójọpọ̀ tí a yàn"),
      title: t("Àkójọpọ̀ tí ó ń mú kí ìpinnu ìrajà rọrùn."),
    },
    catalog: {
      kicker: t("Ìtàn ẹka"),
      title: t("Ọjà tó tóótun, ètò tó ṣe kedere síi."),
      openSearch: t("Ṣí àwárí kíkún"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Ṣàwárí àwọn ọjà tó jẹ́ ìmúdájú nínú {category} lórí Henry Onyx Marketplace, pẹ̀lú àmì ìgbẹ́kẹ̀lé, àlàyé ìfijiṣẹ́, àti ìwé-ìrìnnà olùtà tó wà ní ṣíṣí kí o tó san owó."),
      fallbackDescription:
        t("Ṣàwárí ẹka tí a yàn pẹ̀lú àmọ̀ lórí Henry Onyx Marketplace, pẹ̀lú àmì ìgbẹ́kẹ̀lé, àlàyé ìfijiṣẹ́, àti ìwé-ìrìnnà olùtà kí o tó san owó."),
    },
  },
  trust: {
    metadata: {
      title: t("Ìgbẹ́kẹ̀lé àti ààbò — Henry Onyx Marketplace"),
      description:
        t("Ìgbẹ́kẹ̀lé ló ń pinnu ohun tí olùtà lè ṣe, bí owó ṣe ń gbé, àti bí ìtọ́jú ṣe ń dáhùn. Ìpele olùtà, owó tí a fi pamọ́, àríyànjiyàn, àti ìtúsílẹ̀ owó gbogbo ń fi àkọsílẹ̀ silẹ̀ lórí sáfà."),
    },
    hero: {
      kicker: t("Ìgbẹ́kẹ̀lé àti ààbò"),
      title: t("Ó hàn ṣáájú ìsanwó. A ó sì gbé e ṣiṣẹ́ lẹ́yìn náà."),
      body: t("Ìgbẹ́kẹ̀lé ń darí ohun tí olùtà lè ṣe, bí owó ṣe ń gbé, àti bí ìtọ́jú ṣe ń dáhùn. Ìpele olùtà, ewu olùra, ìdíwọ̀n àkójọ ìpolówó, owó tí a fi pamọ́, àríyànjiyàn àti ìtúsílẹ̀ owó gbogbo ń fi àpapọ̀ àkọsílẹ̀ silẹ̀ lórí sáfà."),
      pillars: [
        { label: t("Ìgbé owó"), value: t("Pamọ́, a ó tú u silẹ̀ lẹ́yìn àyẹ̀wò") },
        { label: t("Àwọn ìṣọ́ra"), value: t("Tí a tì silẹ̀ lórí sáfà, a sì lè tọ́ wọn nínú àríyànjiyàn") },
        { label: t("Ìpele"), value: t("Tí a jẹ́ pé bí a ti pa á, a sì lè gba á padà") },
      ],
    },
    guardrails: {
      kicker: t("Awọn ààbò mẹ́rin"),
      items: [
        {
          title: t("Ìwé-ìrìnnà ìgbẹ́kẹ̀lé"),
          body: t("Gbogbo ilé-ìtajà àti gbogbo ọjà ń fihàn ìpele ìmúdájú, SLA, ìpín àríyànjiyàn, ìmúrasílẹ̀ ìsanwó, àti ìṣe ìfijíṣẹ́."),
        },
        {
          title: t("Ìṣàkóso owó tí a fi pamọ́"),
          body: t("HenryCo ló ń kọ́kọ́ di owó olùra mu, lẹ́yìn náà ni a ó tú u silẹ̀ fún ìsanwó lẹ́yìn ìfijíṣẹ́ àti àyẹ̀wò ìgbẹ́kẹ̀lé."),
        },
        {
          title: t("Ìwádìí ìpaniyàn àyíká"),
          body: t("Ìjì ìsanwó lójú òde, àwòran tí a tún ṣe, àfilọ́lẹ̀ ìpolówó tí ó pọ̀ jù àti àwòṣe ìsanwó tó léwu wọ̀ inú ìrí ipele ìwádìí."),
        },
        {
          title: t("Ìtàn àwọn ohun tí a ṣe"),
          body: t("Ìfọwọ́sí, ìkọsílẹ̀, ìṣe ìtúsílẹ̀ owó, ìpinnu àríyànjiyàn àti àyẹ̀wò aládàá gbogbo ni a ó kọ́ silẹ̀ lórí sáfà."),
        },
      ],
    },
    sellerLadder: {
      kicker: t("Àkàbà ìgbẹ́kẹ̀lé olùtà"),
      title: t("Ìpele tí a jẹ́ pé pẹ̀lú ìṣe, kì í ṣe pẹ̀lú owó."),
    },
    policySurfaces: {
      kicker: t("Àwọn ojú-ìlànà"),
      title: t("Àwọn ìlànà tí àwa náà ń mú àra wa mọ́."),
    },
    ecosystem: {
      kicker: t("Ìmúgbóòrò ìgbẹ́kẹ̀lé jákèjádò àwọn ìpèsè"),
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
      body: t("Wá àwọn kókó tí àwọn olùra àti olùtà ń bi jù. Tí o kò bá rí ohun tí o nílò, ṣí ìwé ìbéèrè ìrànlọ́wọ́ ní ìsàlẹ̀ ojú-ìwé yìí, ẹnìkan láti inú ẹgbẹ́ yóò kà á."),
    },
    stillNeedHelp: {
      kicker: t("Ṣì nílò ìrànlọ́wọ́"),
      title: t("Ṣí ìwé ìbéèrè ìrànlọ́wọ́, ènìyàn yóò kà á."),
      body: t("Ìwé ìbéèrè máa ń di gbogbo àlàyé pọ̀ — ìpàṣẹ, olùtà, ìtàn àríyànjiyàn — kí ẹgbẹ́ lè ṣiṣẹ́ lórí ọ̀ràn náà láìjẹ́ kí o tún kọ ọ́ ní gbogbo ìdáhùn."),
      ctaLabel: t("Ṣí ìwé ìbéèrè ìrànlọ́wọ́"),
    },
  },
  sell: {
    metadata: {
      title: t("Tàjà lórí HenryCo — ọjà tí a yàn fún àwọn olùtà tí ó ń darí ìgbẹ́kẹ̀lé"),
      description:
        t("Forúkọsílẹ̀ láti tà lórí Henry Onyx Marketplace: àfihàn tí ó dá lórí ìgbẹ́kẹ̀lé, àwọn ilé-ìtajà tó tóótun, àti àyè iṣẹ́ kan ṣoṣo fún àwọn àṣẹ, ìsanwó, àti ìrànlọ́wọ́."),
    },
    hero: {
      kicker: t("Tàjà lórí HenryCo"),
      title: t("Ó yàn nínú ìṣètò. A ṣe é fún àwọn olùtà tí ó ń darí ìgbẹ́kẹ̀lé."),
      body: t("Henry Onyx Marketplace fẹ́ràn àwọn olùtà tí ó ń bìkítà nípa ìfihàn, ìfijíṣẹ́ tí ó gbẹ́kẹ̀lé, àti ìdáàbòbò olùra ní òtítọ́. Ìwọ̀n náà hàn lójú ojú-ìwé yìí; ìwé ìfiránṣẹ́ olùtà yóò máa bá a lọ nínú àkántì HenryCo rẹ."),
      primaryCta: t("Ṣí ìwé ìfiránṣẹ́ olùtà"),
      secondaryCta: t("Wo iye olùtà"),
      signInCta: t("Forúkọsílẹ̀ pẹ̀lú àkántì HenryCo"),
      highlights: [
        { label: t("Ìyàn"), value: t("Àyẹ̀wò ọwọ́, kì í ṣe ìsanwó láti darapọ̀") },
        { label: t("Ilé-ìtajà"), value: t("Ìwé-ìrìnnà ìgbẹ́kẹ̀lé tí ó hàn fún olùra") },
        { label: t("Àyè iṣẹ́"), value: t("Àṣẹ, ìsanwó, ìrànlọ́wọ́ nínú ibìkan") },
      ],
    },
    advantages: {
      kicker: t("Èèṣe ti àwọn olùtà tí ó lágbára fi máa borí síbí"),
      items: [
        { title: t("Àfihàn tí ó dá lórí ìgbẹ́kẹ̀lé"), body: t("Ilé-ìtajà rẹ máa gba ìwé-ìrìnnà ìgbẹ́kẹ̀lé tí ó hàn, kì í ṣe pé yóò sọnù nínú ariwo ọjà tí kò dára.") },
        { title: t("Ilé-ìtajà tó dára ju lọ"), body: t("Àwọn ọ̀nà ìtejade, ìwákiri tí ó dákẹ́ jẹ́jẹ́, àti káàdì ọjà tí ó mọ́ máa ń ran ilé-ìtajà tí ó dára lọ́wọ́ láti yí padà yára.") },
        { title: t("Iṣẹ́ tí ó hàn kedere"), body: t("Ìsanwó, àṣẹ, ìrànlọ́wọ́, ìṣàkóso àti ìkìlọ̀ ọjà-ìpamọ́ wà ní àfihàn nínú àyè iṣẹ́ kan tó mọ́.") },
      ],
    },
    onboarding: {
      kicker: t("Bí ìbẹ̀rẹ̀ ṣe ń lọ"),
      stepLabel: t("Ìgbésẹ̀"),
      steps: [
        { step: "01", title: t("Bẹ̀rẹ̀ ìwé ìfiránṣẹ́ olùtà"), body: t("Ṣí ìwé náà láti inú àkántì HenryCo rẹ — àwọn àkọsílẹ̀ máa wà ní fífipamọ́ aládàáṣe nígbà tí o ń kó àwọn ìwífún jọ.") },
        { step: "02", title: t("Fi àwọn ẹ̀ka iṣẹ́ kún"), body: t("Orúkọ iṣẹ́, profàìlì ilé-ìtajà, ìdojúkọ ọjà, àti àwọn ìwé ìjẹ́rìí tí ó ṣàlàyé bí o ṣe ń mú àwọn àṣẹ ṣẹ.") },
        { step: "03", title: t("Àyẹ̀wò ìwé ìfiránṣẹ́"), body: t("Ẹgbẹ́ HenryCo ń ṣàyẹ̀wò àwọn ìwé, àwọn àmì ìgbẹ́kẹ̀lé, àti ìmúrasílẹ̀ ilé-ìtajà — kì í ṣe àmì tí ó san owó nìkan.") },
        { step: "04", title: t("Ìbẹ̀rẹ̀ olùtà"), body: t("Àwọn olùtà tí a fọwọ́sí máa tẹ̀síwájú sí ìbẹ̀rẹ̀, níbi tí àwọn iye, owó fíkún, àkókò ìsanwó, àti ìlànà ti hàn ṣáájú ìpolówó.") },
      ],
      callout: {
        eyebrow: t("Ìwé ìfiránṣẹ́ olùtà tí ó mọ́"),
        body: t("Ìforúkọsílẹ̀ olùtà wà nínú àkántì rẹ kí àwọn ìwífún iṣẹ́, ipò àyẹ̀wò, àti ìmúdójúìwọ̀n ìfọwọ́sí lè wà ní ìkọ̀kọ̀ kí o sì rọrùn láti tẹ̀lé."),
      },
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
    trustTiers: {
      kicker: t("Ìpele ìgbẹ́kẹ̀lé yí àwọn àǹfààní padà"),
      title: t("Gba ìsanwó kíákíá, ilé-ìtajà tó tóbi, àti àwọn àǹfààní ìlànà."),
    },
    closing: {
      kicker: t("Tẹ̀síwájú"),
      title: t("Forúkọsílẹ̀, lẹ́yìn náà wo ipò ìfiránṣẹ́ rẹ láti inú àkántì rẹ."),
      body: t("Ìfọwọ́sí máa ṣí ìbẹ̀rẹ̀ olùtà. Iye, owó fíkún, àti àkókò ìsanwó hàn ṣáájú ìpolówó — kò sí àrùn àdéhùn tí ó máa wáyé lẹ́yìn náà."),
      primaryCta: t("Bẹ̀rẹ̀ ìfiránṣẹ́"),
      secondaryCta: t("Bẹ̀ àyè olùtà wò"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Iye olùtà — Henry Onyx Marketplace"),
      description:
        t("Owó ètò, owó ìpolówó, owó àyè àkànṣe, ìpín ọjà, àti ìṣiṣẹ́ ìsanwó — gbogbo wọn ni a sọ ṣáájú, ṣáájú kí o tó tẹ ọjà jáde, kì í ṣe lẹ́yìn rẹ̀."),
    },
    hero: {
      kicker: t("Iye olùtà"),
      title: t("Ọrọ̀-ajé ṣíṣe-kedere. Kò sí owó tó pamọ́."),
      body: t("Owó ètò, owó ìpolówó, owó àyè àkànṣe, ìpín ọjà, àti ìṣiṣẹ́ ìsanwó — gbogbo wọn hàn ṣáájú kí o tó tẹ ọjà jáde, kì í ṣe lẹ́yìn rẹ̀."),
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
    economics: {
      kicker: t("Bí HenryCo ṣe ń jèrè owó"),
      title: t("À ti sọ ṣáájú, à ń yọ kúrò ní ojú gbangba."),
      items: [
        t("A ó yọ ìpín ọjà kúrò nínú ìpòkànpò ẹgbẹ́-àṣẹ olùtà kọ̀ọ̀kan kí a tó tú ìsanwó sílẹ̀."),
        t("Owó ìpolówó máa wọ̀nà lẹ́yìn tí èdá ìpolówó tó wà nínú ètò tó ń ṣiṣẹ́ kúrò."),
        t("Àkànṣe àyè jẹ́ ìbéèrè owó dá yà, ó sì wà lábẹ́ àyẹ̀wò ìmọ̀dájú àti ìgbẹ́kẹ̀lé."),
        t("Owó ìṣiṣẹ́ ìsanwó ni a yọ kúrò nínú àpòpọ̀ ìpòkànpò olùtà, kò sí àrùn lẹ́yìn nà."),
        t("Iṣẹ́ àfikún iye Studio, Learn àti Logistics ń ṣí ọ̀nà àfikún ti owó-wíwọlé fún olùtà."),
        t("Ìpolówó tí oníṣẹ́ ń darí àti àyè tó ní onígbọ́wọ́ ń wà ní àyẹ̀wò, kì í ṣe rúdurùdu olùtìkára."),
      ],
    },
    trustTiers: {
      kicker: t("Àkókò ìsanwó gẹ́gẹ́ bí ipele ìgbẹ́kẹ̀lé"),
      title: t("Ìwà tó dáadáa máa ń mú kí àkókò ìdádúró rẹlẹ̀."),
    },
    closing: {
      kicker: t("Ṣé o ti ṣetán láti fọ̀wọ́sí?"),
      title: t("Ìfiránṣẹ́ máa ṣí nínú àkántì HenryCo rẹ."),
      body: t("O lè tọ́jú ọ̀rọ̀ ìkọ̀wé, kí o sì pa dà — iye tí ó hàn níbí ní yóò ṣiṣẹ́ ní kété tí mmebata olùtà bá parí."),
      primaryCta: t("Forúkọsílẹ̀ gẹ́gẹ́ bí olùtà"),
      secondaryCta: t("Ìlànà ìgbẹ́kẹ̀lé"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Ọjà HenryCo"),
      descriptionTemplate:
        t("Ṣàwárí {collection} lórí Ọjà HenryCo — ètò àtìmọ̀le ti àwọn ọjà tí a ti fọwọ́sí, pẹ̀lú àwọn àmì ìgbẹ́kẹ̀lé, kíkọ̀ngbé ìfijíṣẹ́, àti pásípọ̀tì olùtà tí ó hàn ṣáájú ìsanwó."),
      fallbackDescription:
        t("Àkójọpọ̀ tí a ṣe àtìmọ̀le lórí Ọjà HenryCo, pẹ̀lú àwọn ọjà tí a ti fọwọ́sí, àmì ìgbẹ́kẹ̀lé, ìfijíṣẹ́ tó kọ̀ngbé, àti pásípọ̀tì olùtà tí ó hàn ṣáájú ìsanwó."),
    },
    hero: {
      primaryCta: t("Ṣí ìwákírí kíkún"),
      secondaryCta: t("Àwọn ìlànà ìgbẹ́kẹ̀lé"),
    },
    sidebar: {
      itemsLabel: t("Àwọn nǹkan nínú àkójọpọ̀"),
      editedByLabel: t("Ẹni tí ó ṣàtìmọ̀le"),
      editedByValue: t("Ìmọ̀ Ọjà HenryCo"),
      buyerProtectionLabel: t("Ààbò olùrà"),
      buyerProtectionValue: t("Ìsanwó nínú àbò"),
    },
    rail: {
      kicker: t("Ohun tí ó wà nínú ètò yìí"),
      itemsSuffix: t("nǹkan"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Ọjà HenryCo"),
      descriptionTemplate:
        t("{policy} lórí Ọjà HenryCo — ìmúse tí a kọ sílẹ̀ lórí olùsìn, ìṣàkóso owó nínú àbò, àti ìdúró ìgbẹ́kẹ̀lé tí ó hàn ṣáájú ìsanwó."),
      fallbackTitle: t("Ìlànà ọjà — Ọjà HenryCo"),
      fallbackDescription:
        t("Ìlànà kan ti Ọjà HenryCo — ìmúse tí a kọ sílẹ̀ lórí olùsìn, ìṣàkóso owó nínú àbò, àti ìdúró ìgbẹ́kẹ̀lé tí ó hàn ṣáájú ìsanwó."),
    },
    hero: {
      backToTrust: t("Padà sí àwọn ìlànà ìgbẹ́kẹ̀lé"),
      openSupport: t("Ṣí ìbáraẹnisọ̀rọ̀ ìrànlọ́wọ́"),
    },
    details: {
      coverageLabel: t("Àgbègbè ààbò"),
      enforcementLabel: t("Ìmúse"),
      updatedLabel: t("Ìmúdójúìwọ̀n"),
    },
    coverageBySlug: {
      buyerProtection: t("Àwọn olùrà"),
      sellerPolicy: t("Àwọn olùtà"),
      fallback: t("Àwọn alábàápín ọjà"),
    },
    enforcementBySlug: {
      buyerProtection: t("Owó nínú àbò + dídìnà ìsanwó nígbà àríyànjiyàn"),
      sellerPolicy: t("Àyẹ̀wò gẹ́gẹ́ bí ipele ìgbẹ́kẹ̀lé + ìfowó-padà"),
      fallback: t("Ipa-ọ̀nà tí a kọ sílẹ̀ lórí olùsìn"),
    },
    updatedBySlug: {
      buyerProtection: t("Lójú ìṣàtúnṣe ìsanwó àti àríyànjiyàn"),
      sellerPolicy: t("Lójú ìṣàtúnṣe àwọn ìlànà olùtà"),
      fallback: t("Lójú ìṣàtúnṣe ìlànà"),
    },
    provisions: {
      kicker: t("Àwọn àbáwí ìlànà"),
    },
    ecosystem: {
      kicker: t("Àwọn ìṣàkóso ọjà tí ó sopọ̀"),
      openLabel: t("Ṣí"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{title} lórí Henry Onyx Marketplace — ọjà ti a fọwọ́ sí, ìfijíṣẹ́ tó gbára lé, àti àwòrán olùtàjà tó hàn kí o tó san owó."),
      fallbackDescription:
        t("Àkọsílẹ̀ tí a fọwọ́ sí lórí Henry Onyx Marketplace — pẹ̀lú àwọn àmì ìgbẹ́kẹ̀lé, kíkún ìfijíṣẹ́, àti àwòrán olùtàjà tó hàn kí o tó san owó."),
    },
    fulfillment: {
      sellerTrustLabel: t("Ìgbẹ́kẹ̀lé olùtàjà"),
      sellerTrustValueTemplate: t("Àwòrán {vendor} hàn"),
      sellerTrustValueFallback: t("Àwòrán olùtàjà ṣì ń dúró"),
      availabilityLabel: t("Ìwà-ńlàá"),
      availabilityValueSingular: t("{count} pisi nínú ọjà tó wà báyìí"),
      availabilityValuePlural: t("{count} pisi nínú ọjà tó wà báyìí"),
      fulfillmentLabel: t("Ìfijíṣẹ́"),
      paymentLabel: t("Ìsanwó"),
      paymentValueCod: t("Ìsanwó nígbà ìjíṣẹ́ tàbí ìfiránṣẹ́ owó tó wúlò"),
      paymentValueVerified: t("Ìtẹ̀lé ìfiránṣẹ́ owó tó wúlò"),
    },
    price: {
      label: t("Iye owó"),
      leadTimeLabel: t("Àkókò ìjíṣẹ́"),
    },
    safety: {
      kicker: t("Ìdí tí àkọsílẹ̀ yìí fi rí bí ó ṣe ní ààbò jù"),
      stockTemplate: t("{count} pisi ń hàn nínú àkójọ ọjà báyìí"),
      codEligible: t("Ìsanwó nígbà ìjíṣẹ́ wà níbi tí ó ti ṣeé ṣe"),
      codFallback: t("Ọ̀nà ìmúdájú ọwọ́ ń wà fún ò"),
      vendorLinkedTemplate: t("Àwòrán olùtàjà {vendor} ti so mọ́ ojú-ìwé yìí tààrà"),
      vendorPending: t("Ìjápọ̀ àwòrán ìgbẹ́kẹ̀lé olùtàjà ṣì ń dúró"),
      reviewsTemplateSingular: t("{count} àyẹ̀wò ní ìpíndọ́gba ìdíwọ̀n {rating}"),
      reviewsTemplatePlural: t("{count} àyẹ̀wò ní ìpíndọ́gba ìdíwọ̀n {rating}"),
    },
    detail: {
      kicker: t("Àlàyé ọjà"),
      title: t("Gbogbo ohun tó ṣe pàtàkì kí o tó san owó."),
      deliverySummaryTitle: t("Ìfijíṣẹ́, àtìlẹ́yìn, àti ìtọ́jú lẹ́yìn àṣẹ rírà"),
      deliveryFallback: t("A ó ṣe àlàyé àkókò ìjíṣẹ́ ní ìpín ìsanwó."),
      deliveryTail:
        t("Àwọn àṣẹ rírà máa ń wà ní orí ọwọ́ láti ìsanwó dé ìjíṣẹ́, àti àwọn àríyànjiyàn tàbí ọ̀rọ̀ àtìlẹ́yìn ń so mọ́ àkọsílẹ̀ àṣẹ rírà kan náà."),
      specsTitle: t("Àwọn àlàyé àti ìmọ́lẹ̀ ohun èlò"),
      passportTitle: t("Àwòrán ilé ìtajà àti àwọn àwárí tó jọmọ́"),
      visitVendorTemplate: t("Lọ sí {vendor}"),
      exploreCategoryTemplate: t("Ṣàwárí {category}"),
      seeBrandTemplate: t("Wo {brand}"),
    },
    related: {
      kicker: t("Mú àkójọ pé"),
      title: t("Ohun mìíràn nínú ipò ọjà kan náà."),
      body: t("Àwọn ìtọ́sọ́nà máa ń jẹ́ tó dára àti tó mọ́, kì í ṣe ariwo títaja."),
    },
    reviews: {
      kicker: t("Àwọn àfojúsùn àyẹ̀wò"),
      title: t("Àmì rírà tó wúlò, kì í ṣe ariwo lásán."),
      verifiedPurchase: t("Rírà tó wúlò"),
      reviewLabel: t("Àyẹ̀wò"),
    },
    rail: {
      kicker: t("Àwọn alábaramẹ́nu náà rà"),
      headline: t("Tẹ̀síwájú ìwòye láìpẹ̀."),
      caption:
        t("Àwọn àmì rírà àjọṣe àti àwọn ẹ̀ka tó sún mọ́lé ń mú igbésẹ̀ tó tẹ̀lé jáde, kò ní ariwo títaja àfikún."),
      ctaLabel: t("Ṣí ìṣàwárí"),
    },
  },
};
}

function buildHA(locale: AppLocale): DeepPartial<MarketplacePublicCopy> {
  const t = (s: string) => translateSurfaceLabel(locale, s);
  return {
  store: {
    metadataTitle: t("{store} — Kasuwar HenryCo"),
    metadataDescription:
      t("Bincika kayayyaki da aka tantance na {store} a Kasuwar HenryCo, da alamomin amincewa, isarwa mai sarari, da fasfo na mai sayarwa kafin biyan kuɗi."),
    metadataDescriptionFallback:
      t("Kantin da aka tantance a Kasuwar HenryCo, da alamomin amincewa, isarwa mai sarari, da fasfo na mai sayarwa kafin kowane biyan kuɗi."),
    hero: {
      eyebrow: t("Fasfo na kanti"),
      bodyFallback:
        t("Mai sayarwa da aka tantance a Kasuwar HenryCo, da alamomin amincewa, isarwa mai sarari, da fasfo bayyananne da ake gani kafin kowane biyan kuɗi."),
    },
    stats: {
      trustScore: t("Maki na amincewa"),
      responseSla: t("Lokacin amsa"),
      responseSlaSuffix: t(" awa"),
      followers: t("Masu bibiya"),
    },
    standards: {
      eyebrow: t("Ƙa'idodin kanti"),
    },
    support: {
      eyebrow: t("Tallafi"),
      contactLinkLabel: t("Yi amfani da Kasuwar HenryCo don tuntuɓar wannan kanti"),
      contactBodySuffix:
        t(" — ana adana saƙonni kuma a haɗa su da lambar odar ka don kowane sabuntawa ya kasance a wuri ɗaya."),
      ctaLabel: t("Tuntuɓi wannan kanti"),
      subjectTemplate: t("Tambaya ga {store}"),
    },
    reviews: {
      eyebrow: t("Sabbin sharhi"),
      verifiedPurchase: t("Saye da aka tantance"),
      review: t("Sharhi"),
    },
    catalog: {
      kicker: t("Kataloji na kanti"),
      title: t("Duk abin da wannan kanti ke da shi a kan layi a yanzu."),
      exploreLink: t("Bincika ƙarin jeren da aka tantance"),
      emptyTitle: t("Babu jeren da yake aiki yanzu"),
      emptyBody: t("Kayan da aka amince da su daga wannan kanti za su fito a nan da zaran sun shiga aiki."),
    },
  },
  cart: {
    pageIntro: {
      kicker: t("Kanti"),
      title: t("Kanti mai inganci — gyare-gyare cikin sauri da bayyananniyar rabe-raben odar daga masu sayarwa daban-daban."),
      description:
        t("Kanti yana nuna rukunin masu sayarwa a fili, yana sabunta yawan kayan da sauri, kuma yana ci gaba da haɗawa da ƙaramin kanti, don kada masu siye su rasa mahallin yayin kusan kammala biyan kuɗi."),
    },
    emptyState: {
      title: t("Kanti ɗinka har yanzu fanko ne."),
      body: t("Ƙara cikin sauri daga katunan kaya, ajiye abubuwa don baya, kuma kanti zai ci gaba da sabuntawa a cikin ƙaramin kanti da kanti cikakke ba tare da sake loda shafi ba."),
      ctaLabel: t("Bincika kayayyaki"),
    },
  },
  track: {
    metadata: {
      title: t("Bin diddigin oda — Henry Onyx Marketplace"),
      description:
        t("Bibi kowane sashe na mai sayarwa, sabuntawar biyan kuɗi, da matakin isarwa a wuri ɗaya. Escrow ya kasance a aiki har sai an tabbatar da isarwa."),
    },
    hero: {
      kicker: t("Bin diddigin oda"),
      titlePrefix: t("Bin diddigi"),
      body: t("Bayyana odar da aka raba a tsakanin masu sayarwa daban-daban tana ci gaba a nan: kowane sashe na mai sayarwa, sabuntawar biyan kuɗi, da matakin isarwa yana da nasa layi, don tallafi da fata na mai siye su zauna a layi ɗaya."),
      orderValueLabel: t("Darajar oda"),
      paymentLabel: t("Biyan kuɗi"),
      payoutControlLabel: t("Sarrafa biyan mai sayarwa"),
      payoutFrozen: t("An daskare"),
      payoutEscrowActive: t("Escrow yana aiki"),
    },
    paymentRecord: {
      kicker: t("Bayanin biyan kuɗi"),
      walletBody: t("An cire kuɗi daga walat, kuma odar tana cikin escrow har sai an isar da kayan."),
      proofBody: t("An haɗa hujjar canja wurin kuɗi don bita daga ƙungiyar kuɗi ta HenryCo."),
      awaitingBody: t("Biyan kuɗi yana jiran hujja daga ƙungiyar kuɗi ko daidaita lokacin isarwa."),
      methodLabel: t("Hanya"),
      statusLabel: t("Matsayi"),
      proofLabel: t("Hujja"),
      viewProof: t("Duba hujja"),
      walletDebit: t("Cirewa daga walat"),
      pending: t("Yana jira"),
    },
    timeline: {
      kicker: t("Jadawalin lokaci"),
      title: t("Matakai da abokin ciniki zai gani, bisa tsari."),
    },
    segments: {
      kicker: t("Sassan masu sayarwa"),
      title: t("Kowane mai sayarwa yana da alhakin nasa isarwar."),
      henrycoSegment: t("Sashen HenryCo"),
      fulfillmentLabel: t("Isarwa"),
      trackingLabel: t("Bin diddigi"),
      payoutLabel: t("Biyan mai sayarwa"),
      trackingPending: t("Yana jira"),
    },
    completion: {
      kicker: t("Tabbatar da kammala"),
      body: t("Tabbatar da kammalawa lokacin da oda ta ƙayatar. HenryCo na sakin biyan mai sayarwa ne kawai bayan an tabbatar da isarwa ko lokacin da odar ta cika ƙa'idodin sakin atomatik."),
      confirmCta: t("Tabbatar da kammala"),
    },
    help: {
      kicker: t("Kana buƙatar taimako?"),
      title: t("Jayayya, mayar da kuɗi, da damuwa kan isarwa, duka suna bi ta zare ɗaya."),
      body: t("Buɗe zaren tallafi tare da haɗa lambar wannan odar, don wakili ya ga cikakken jadawalin lokaci da rabewar masu sayarwa ba tare da ka sake rubuta su ba."),
      openSupportCta: t("Buɗe zaren tallafi"),
      viewAllOrdersCta: t("Duba dukkan odoji"),
    },
  },
  deals: {
    metadata: {
      title: t("Tayin da aka tabbatar — Henry Onyx Marketplace"),
      description:
        t("Ragi da aka tace bisa amincewa, tabbacin kayan a cikin ɗakin ajiya, da ɗawainiyar mai sayarwa. A shafin tayin HenryCo, sai jeren da aka tabbatar wanda yake da alamomin amincewa masu tsabta ne kawai suke fitowa."),
    },
    pageIntro: {
      kicker: t("Tayin da aka tabbatar"),
      title: t("Ragi da aka tace bisa amincewa, tabbacin kayan a cikin ɗakin ajiya, da ɗawainiyar mai sayarwa."),
      description:
        t("Muna nuna tayi ne kawai lokacin da ingancin jeren, fasfo na amincewar mai sayarwa, da yanayin kayan suke da tsabta isa don kāre cikakken siye da rage damuwar mai siye daga baya."),
    },
    sectionLabel: t("Tayin da aka tabbatar"),
    listEyebrow: t("Tayin da aka tabbatar"),
    refreshNote: t("Ana sabuntawa akai-akai"),
    discountBadgePrefix: "−",
    emptyState: {
      title: t("Babu tayin da aka tabbatar a yanzu"),
      body: t("Ragi da aka tabbatar suna shigowa yayin da masu sayarwa suke jera su. Dawo nan ba da daɗewa ba."),
    },
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
    collectionsRail: {
      kicker: t("Tarin da aka zaɓa"),
      title: t("Tari da ke sauƙaƙe shawarar siyayya."),
    },
    catalog: {
      kicker: t("Katalogin nau'i"),
      title: t("Kayayyaki masu inganci, tsari mafi sauƙin karantawa."),
      openSearch: t("Buɗe cikakken bincike"),
    },
    metadata: {
      titleTemplate: t("{category} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("Bincika tabbatattun kayayyaki a cikin {category} a Henry Onyx Marketplace, tare da alamomin amintacce, bayyananniyar bayanin isarwa, da fasfo ɗin mai sayarwa kafin biya."),
      fallbackDescription:
        t("Bincika zaɓaɓɓen nau'i a Henry Onyx Marketplace tare da alamomin amintacce, bayyananniyar bayanin isarwa, da fasfo ɗin mai sayarwa kafin biya."),
    },
  },
  trust: {
    metadata: {
      title: t("Aminci da tsaro — Henry Onyx Marketplace"),
      description:
        t("Amincin shi ke tantance abin da mai sayarwa zai iya yi, yadda kuɗi suke gudana, da kuma yadda kulawa take amsawa. Matakan mai sayarwa, ajiyar amana, jayayya da sakin kuɗaɗen biya duk suna barin tarihi a sabar."),
    },
    hero: {
      kicker: t("Aminci da tsaro"),
      title: t("A bayyane kafin biya. A tabbatar bayan biya."),
      body: t("Amincin yana sarrafa abin da mai sayarwa zai iya yi, yadda kuɗi suke gudana, da kuma yadda kulawa take amsawa. Matakan mai sayarwa, haɗarin mai siye, kimar tallace-tallace, ajiyar amana, jayayya da sakin kuɗaɗen biya duk suna barin tarihin sabar."),
      pillars: [
        { label: t("Hannukan kuɗi"), value: t("Ajiye a amana, a saki bayan binciken aminci") },
        { label: t("Ra'ayoyi"), value: t("An ajiye su a sabar, kuma za a iya bin diddiginsu a jayayya") },
        { label: t("Matakai"), value: t("An samu su ne saboda hali, ana iya soke su") },
      ],
    },
    guardrails: {
      kicker: t("Garkuwoyi huɗu"),
      items: [
        {
          title: t("Fasfo na aminci"),
          body: t("Kowane kanti da kowane kayan suna nuna matakin tabbatarwa, SLA, adadin jayayya, shirin biya, da matsayin isarwa."),
        },
        {
          title: t("Sarrafa ajiyar amana"),
          body: t("Kuɗin mai siye yana farkon zama a hannun HenryCo, sannan kawai ya zama mai saki bayan an tabbatar da isarwa da bincike na aminci."),
        },
        {
          title: t("Bincike kan zamba"),
          body: t("Sake biyan kuɗi a wajen dandalin, kafofin watsa labarai masu maimaitawa, hauhawar tallace-tallace, da samfuran biya masu haɗari duk suna shiga layin bincike."),
        },
        {
          title: t("Hanyoyin gwajin tarihi"),
          body: t("Yardar, ƙin yarda, ayyukan biya, hukunce-hukuncen jayayya da binciken ta atomatik duk an rubuta su a sabar."),
        },
      ],
    },
    sellerLadder: {
      kicker: t("Tsani na amincin mai sayarwa"),
      title: t("Matakai da aka samu ta hanyar hali, ba ta hanyar kuɗi ba."),
    },
    policySurfaces: {
      kicker: t("Mahallin manufofin"),
      title: t("Ƙa'idodin da muka ɗora wa kanmu."),
    },
    ecosystem: {
      kicker: t("Ƙarfafa aminci a duk muhalli"),
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
      body: t("Nemo batutuwan da masu siye da masu sayarwa suka fi yawan tambaya. Idan ba ka samu abin da kake bukata ba, buɗe tikitin tallafi a ƙarshen wannan shafin, wani daga ƙungiyar zai karanta shi."),
    },
    stillNeedHelp: {
      kicker: t("Har yanzu kana bukatar taimako"),
      title: t("Buɗe tikitin tallafi — mutum zai karanta shi."),
      body: t("Tikiti yana ajiye dukkan mahallin tare — odar, mai sayarwa, tarihin sabani — domin ƙungiyar ta yi aiki a kan al'amarin ba tare da ka sake rubuta shi a kowane amsa ba."),
      ctaLabel: t("Buɗe tikitin tallafi"),
    },
  },
  sell: {
    metadata: {
      title: t("Sayar a HenryCo — kasuwa zaɓaɓɓa ga masu sayar da ke jagorancin amincewa"),
      description:
        t("Nemi izinin sayarwa a Henry Onyx Marketplace: matsayi da aka kafa kan amincewa, shagunan inganci, da wuri ɗaya don odoji, biyan kuɗi da tallafi."),
    },
    hero: {
      kicker: t("Sayar a HenryCo"),
      title: t("Zaɓaɓɓa daga tushe. An gina ta don masu sayarwa da ke jagorancin amincewa."),
      body: t("Henry Onyx Marketplace yana fifita masu sayarwa da ke kula da gabatarwa, masu kuɗi a isarwa da masu gaskiya wajen kare mai siye. Sharuɗɗan a fili suke a wannan shafin; aikace-aikacen mai sayarwa zai ci gaba a cikin asusunka na HenryCo."),
      primaryCta: t("Buɗe aikace-aikacen mai sayarwa"),
      secondaryCta: t("Duba farashin mai sayarwa"),
      signInCta: t("Shiga da asusun HenryCo"),
      highlights: [
        { label: t("Zaɓi"), value: t("Bita ta hannu, ba listing mai biyan kuɗi ba") },
        { label: t("Shago"), value: t("Fasfo ɗin amincewa wanda masu siye ke iya gani") },
        { label: t("Wurin aiki"), value: t("Odoji, biyan kuɗi da tallafi a wuri ɗaya") },
      ],
    },
    advantages: {
      kicker: t("Me ya sa masu sayarwa masu ƙarfi ke nasara a nan"),
      items: [
        { title: t("Matsayi da aka kafa kan amincewa"), body: t("Shagonka yana samun fasfon amincewa a fili, maimakon ya ɓace cikin hayaniyar kasuwa marar inganci.") },
        { title: t("Mafi kyawun ingancin shago"), body: t("Layukan edita, bincike mai natsuwa, da katunan kayayyaki masu tsabta suna taimaka wa shaguna masu inganci su juyar da abokan ciniki cikin sauri.") },
        { title: t("Aiki mai tsabta"), body: t("Biyan kuɗi, odoji, tallafi, sa ido, da gargaɗin kayan ajiya su kasance a sarari a cikin wuri ɗaya na aiki.") },
      ],
    },
    onboarding: {
      kicker: t("Yadda fara aiki ke gudana"),
      stepLabel: t("Mataki"),
      steps: [
        { step: "01", title: t("Fara aikace-aikacen mai sayarwa"), body: t("Buɗe aikace-aikacen daga asusunka na HenryCo — daftarin yana ajiyewa kai tsaye yayin da kake tara cikakkun bayanai.") },
        { step: "02", title: t("Ƙara cikakkun bayanan kasuwanci"), body: t("Sunan kasuwanci, bayanin shago, mai da hankali kan samfuri, da duk wani takardun tabbatarwa da ke bayyana yadda kake cika odoji.") },
        { step: "03", title: t("Bita na aikace-aikacen"), body: t("Ƙungiyar HenryCo tana bitar takardu, alamomin amincewa, da shirin shago — ba kawai alamar biyan kuɗi ba.") },
        { step: "04", title: t("Fara aikin mai siyarwa"), body: t("Masu sayarwa da aka amince da su za su ci gaba zuwa fara aiki inda farashi, kudin shigarwa, lokutan biyan kuɗi da ƙa'idoji ke a sarari kafin a fara bugawa.") },
      ],
      callout: {
        eyebrow: t("Aikace-aikacen mai sayarwa mai tsabta"),
        body: t("Rajistar mai sayarwa tana zama a cikin asusunka, don haka cikakkun bayanan kasuwanci, matsayin bita, da sabuntawar amincewa su kasance masu zaman kansu kuma masu sauƙin bibiya."),
      },
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
    trustTiers: {
      kicker: t("Matakan amincewa suna canza gata"),
      title: t("Sami biyan kuɗi cikin sauri, shaguna masu girma, da fa'idodin manufa."),
    },
    closing: {
      kicker: t("Ci gaba"),
      title: t("Yi aikace-aikacen, sannan ka bi matsayin daga asusunka."),
      body: t("Amincewa yana buɗe shirin mai sayarwa. Farashi, kudin shigarwa, da lokutan biyan kuɗi suna nan a sarari kafin ka buga — babu mamaki na kwangila daga baya."),
      primaryCta: t("Fara aikace-aikacen"),
      secondaryCta: t("Ziyarci wurin aiki na mai sayarwa"),
    },
  },
  sellPricing: {
    metadata: {
      title: t("Farashin mai sayarwa — Henry Onyx Marketplace"),
      description:
        t("Kudin tsari, kudin shigarwa, kudin matsayi na musamman, kwamishan kasuwanci da sarrafa biyan kuɗi — duk ana ambata su a gaba, kafin a buga kayan, ba bayan ba."),
    },
    hero: {
      kicker: t("Farashin mai sayarwa"),
      title: t("Tattalin arziki a sarari. Babu kuɗin ɓoye."),
      body: t("Kudin tsari, kudin shigarwa, kudin matsayi na musamman, kwamishan kasuwanci da sarrafa biyan kuɗi — duk ana ambata su a gaba kafin ka buga kayanka, ba bayan ba."),
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
    economics: {
      kicker: t("Yadda HenryCo ke samun kuɗi"),
      title: t("An ambato a gaba, an cire a sarari."),
      items: [
        t("Ana cire kwamishan kasuwanci daga kowane biyan ƙungiya-oda ta mai sayarwa kafin a saki biyan."),
        t("Kudin shigarwa na fara aiki bayan an gama ƙididdigar shigarwa da ke ciki na tsarin mai sayarwa."),
        t("Matsayi na musamman shi ne buƙatar biya daban, kuma yana ƙarƙashin bita na inganci da amana."),
        t("Ana cire kudin sarrafa biyan a ciki na taƙaitaccen biyan mai sayarwa, ba daga baya da mamaki ba."),
        t("Hidimomin ƙarin daraja na Studio, Learn da Logistics suna buɗe ƙarin hanyoyin kuɗi ga masu sayarwa."),
        t("Yaƙin neman wanda ma'aikaci ke gudanarwa da wuraren tallafi suna nan a buɗe don binciken, ba mai rikici na yi-da-kanka ba."),
      ],
    },
    trustTiers: {
      kicker: t("Lokacin biyan bisa matakin amana"),
      title: t("Halayya mafi kyau na rage tsawon riƙewa."),
    },
    closing: {
      kicker: t("Shirye don nema?"),
      title: t("Aikace-aikacen yana buɗewa a cikin asusun HenryCo naka."),
      body: t("Za ka iya adana zane ka dawo — farashin da yake bayyana anan zai fara aiki da zaran an gama shigar mai sayarwa."),
      primaryCta: t("Nemi a matsayin mai sayarwa"),
      secondaryCta: t("Matsayin amana"),
    },
  },
  collections: {
    metadata: {
      titleTemplate: t("{collection} — Kasuwar HenryCo"),
      descriptionTemplate:
        t("Bincika {collection} a Kasuwar HenryCo — zaɓaɓɓun kayayyaki masu tantancewa, tare da alamomin amincewa, kyakkyawan bayanin isarwa, da fasfo na masu sayarwa kafin biyan kuɗi."),
      fallbackDescription:
        t("Tarin zaɓaɓɓu a Kasuwar HenryCo, da kayayyaki masu tantancewa, alamomin amincewa, isarwa mai sarari, da fasfo na masu sayarwa da ake gani kafin biyan kuɗi."),
    },
    hero: {
      primaryCta: t("Buɗe cikakken bincike"),
      secondaryCta: t("Matakan amincewa"),
    },
    sidebar: {
      itemsLabel: t("Abubuwa cikin tarin"),
      editedByLabel: t("Wanda ya tsara"),
      editedByValue: t("Sashen aiki na Kasuwa"),
      buyerProtectionLabel: t("Kariyar mai siye"),
      buyerProtectionValue: t("Biyan kuɗi ta hannun amintacce"),
    },
    rail: {
      kicker: t("Abin da ke cikin wannan zaɓi"),
      itemsSuffix: t("abubuwa"),
    },
  },
  policies: {
    metadata: {
      titleTemplate: t("{policy} — Kasuwar HenryCo"),
      descriptionTemplate:
        t("{policy} a Kasuwar HenryCo — aikatawa da aka rubuta a sabar, kula da kuɗi ta hannun amintacce, da matsayin amincewa da ake gani kafin biyan kuɗi."),
      fallbackTitle: t("Manufar kasuwa — Kasuwar HenryCo"),
      fallbackDescription:
        t("Wata manufa ta Kasuwar HenryCo — aikatawa da aka rubuta a sabar, kula da kuɗi ta hannun amintacce, da matsayin amincewa da ake gani kafin biyan kuɗi."),
    },
    hero: {
      backToTrust: t("Komawa zuwa matakan amincewa"),
      openSupport: t("Buɗe zauren tallafi"),
    },
    details: {
      coverageLabel: t("Yankin ɗauka"),
      enforcementLabel: t("Aikatawa"),
      updatedLabel: t("An sabunta"),
    },
    coverageBySlug: {
      buyerProtection: t("Masu siye"),
      sellerPolicy: t("Masu sayarwa"),
      fallback: t("Mahalarta kasuwa"),
    },
    enforcementBySlug: {
      buyerProtection: t("Kuɗaɗen biyan ta hannun amintacce + daskarewa lokacin gardama"),
      sellerPolicy: t("Bita bisa matakin amana + riƙewar biya"),
      fallback: t("Tarihi a sabar"),
    },
    updatedBySlug: {
      buyerProtection: t("Lokacin sabunta tsarin biya da gardama"),
      sellerPolicy: t("Lokacin sabunta matakan mai sayarwa"),
      fallback: t("Lokacin sabunta manufa"),
    },
    provisions: {
      kicker: t("Sharuɗɗan manufa"),
    },
    ecosystem: {
      kicker: t("Sarrafa kasuwa masu haɗuwa"),
      openLabel: t("Buɗe"),
    },
  },
  product: {
    metadata: {
      titleTemplate: t("{title} — Henry Onyx Marketplace"),
      descriptionTemplate:
        t("{title} a Henry Onyx Marketplace — ɗakin kaya da aka tabbatar, isar da kaya mai aminci, da fasfo na mai sayarwa duka a fili kafin biya."),
      fallbackDescription:
        t("Tallar da aka tabbatar a Henry Onyx Marketplace — alamomin amana, ƙayyadaddun lokutan isarwa, da fasfo na mai sayarwa duk a fili kafin biya."),
    },
    fulfillment: {
      sellerTrustLabel: t("Amincin mai sayarwa"),
      sellerTrustValueTemplate: t("Fasfon {vendor} a fili"),
      sellerTrustValueFallback: t("Fasfon mai sayarwa na jiran kammalawa"),
      availabilityLabel: t("Samuwa"),
      availabilityValueSingular: t("{count} naúrar a cikin tarin yanzu"),
      availabilityValuePlural: t("{count} naúrori a cikin tarin yanzu"),
      fulfillmentLabel: t("Isar da kaya"),
      paymentLabel: t("Biyan kuɗi"),
      paymentValueCod: t("Biya yayin isarwa ko wuce gona da iri da aka tabbatar"),
      paymentValueVerified: t("Tafarki na wucewa wanda aka tabbatar"),
    },
    price: {
      label: t("Farashi"),
      leadTimeLabel: t("Lokacin isarwa"),
    },
    safety: {
      kicker: t("Me ya sa wannan tallar take ji aminci"),
      stockTemplate: t("Naúrori {count} suna a fili a yanzu cikin sito"),
      codEligible: t("Biya yayin isarwa yana samuwa inda aka tallafa"),
      codFallback: t("Hanyar tabbatarwa ta hannu tana samuwa"),
      vendorLinkedTemplate: t("Fasfon mai sayarwa na {vendor} yana da alaƙa kai tsaye daga shafin nan"),
      vendorPending: t("Fuskar amincin mai sayarwa har yanzu tana jiran haɗawa"),
      reviewsTemplateSingular: t("{count} sharhi a kan matsakaicin ƙimar {rating}"),
      reviewsTemplatePlural: t("{count} sharhi a kan matsakaicin ƙimar {rating}"),
    },
    detail: {
      kicker: t("Bayanin samfur"),
      title: t("Duk abin da yake da muhimmanci kafin biya."),
      deliverySummaryTitle: t("Isar, tallafi, da kulawa bayan oda"),
      deliveryFallback: t("Za a fayyace tagulla na isar a lokacin biya."),
      deliveryTail:
        t("Odoji suna ci gaba da bibiya daga biya har zuwa isar da kaya, kuma jayayya ko zaren tallafi suna nan a haɗe da wannan tarihin odan."),
      specsTitle: t("Ƙayyadewa da bayyananniyar kayan ɗanyu"),
      passportTitle: t("Fasfon kanti da gano alaƙa"),
      visitVendorTemplate: t("Ziyarci {vendor}"),
      exploreCategoryTemplate: t("Bincika {category}"),
      seeBrandTemplate: t("Duba {brand}"),
    },
    related: {
      kicker: t("Cika saiti"),
      title: t("Ƙarin daga wannan yanayin sayan."),
      body: t("Layukan shawarwari suna tsabta da kulawa, ba surutun ƙarin sayarwa ba."),
    },
    reviews: {
      kicker: t("Manyan sharhi"),
      title: t("Alamun sayan da aka tabbatar, ba ƙarin surutu ba."),
      verifiedPurchase: t("Sayan da aka tabbatar"),
      reviewLabel: t("Sharhi"),
    },
    rail: {
      kicker: t("Abokan ciniki sun kuma saya"),
      headline: t("Ci gaba da bincike ba tare da rasa wurin ka ba."),
      caption:
        t("Alamomin haɗin gwiwa da kuma kusan rukuni iri ɗaya suna fitar da matakin gaba a fili, ba ƙarin tallace-tallace ba."),
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
