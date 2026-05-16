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
};

const EN: MarketplacePublicCopy = {
  home: {
    heroKicker: "Refined premium marketplace",
    heroTitle: "Buy from verified stores without the noise, clutter, or trust guesswork.",
    heroBody:
      "HenryCo Marketplace turns multi-vendor commerce into a calmer experience: cleaner discovery, quick-add from every card, split-order clarity, stronger seller passports, and a single HenryCo account for orders, payments, reviews, and support.",
    primaryCta: "Explore the catalog",
    secondaryCta: "Sell on HenryCo",
    quickCards: [
      {
        title: "Quick-add everywhere",
        body: "Small card-level cart controls, instant mini-cart updates, and no clumsy refresh loops.",
      },
      {
        title: "Verified trust rails",
        body: "Seller passports, delivery promises, review quality, and stock ownership stay easy to read.",
      },
      {
        title: "One account, less friction",
        body: "Orders, payments, wishlist, follows, and notifications stay together in one HenryCo account.",
      },
    ],
    whyKicker: "Why this feels different",
    whyTitle: "Trust is visible before payment.",
    whyCards: [
      {
        title: "Trust is visible before payment",
        body: "Verification level, dispute rate, support responsiveness, and fulfillment reliability stay close to the buying decision.",
      },
      {
        title: "Split-order clarity stays readable",
        body: "When inventory comes from different vendors or HenryCo stock, delivery segmentation stays obvious instead of becoming checkout confusion.",
      },
      {
        title: "Sellers are curated, not dumped into a grid",
        body: "The marketplace favors stronger stores, cleaner listings, and better post-order accountability over catalog sprawl.",
      },
    ],
    emptyTitle: "The catalog is being prepared.",
    emptyBody: "Approved products, collections, and campaigns will appear here as they go live.",
    emptyCta: "Contact marketplace support",
    categoryKicker: "Category discovery",
    categoryTitle: "Discover by mood, room, and trust level.",
    categoryLink: "Open search",
    freshKicker: "Fresh approvals",
    freshTitle: "New in the marketplace right now.",
    featuredKicker: "Featured products",
    featuredTitle: "Premium cards, instant carting, and cleaner buying signals.",
    browseAll: "Browse all",
    collectionsKicker: "Editorial collections",
    collectionsTitle: "Curated rails that guide decisions without shouting.",
    vendorsKicker: "Trusted stores",
    vendorsTitle: "Verified vendors with clearer accountability.",
    standardsKicker: "Marketplace standards",
    standardsTitle: "Built for trust, clarity, and a calmer buying experience.",
    standardsBullets: [
      "Seller applications, moderation, and approvals are reviewed through dedicated HenryCo review lanes.",
      "Order updates, reviews, support, and payments stay connected to the same buyer account.",
      "Support, payment review, and delivery operations stay organized so responses remain consistent.",
    ],
    sellerKicker: "Seller quality",
    sellerTitle: "Serious sellers start inside their HenryCo account.",
    sellerBody:
      "Public visitors can learn about selling on /sell, while the application, draft progress, review updates, and approval status stay inside the seller account experience.",
    sellerBullets: [
      "Draft saving and progress visibility",
      "Private document handling in the right place",
      "Clear approval updates for every seller",
    ],
  },
  kpiLabels: {
    verifiedStores: "Verified stores",
    activeListings: "Active listings",
    trustRating: "Trust rating",
  },
  kpiHints: {
    verifiedStores: "Curated sellers and HenryCo-owned inventory with clearer accountability.",
    activeListings: "Approved listings surfaced with delivery, trust, and ownership clarity.",
    trustRating: "Marketplace review quality and seller reliability are surfaced before checkout.",
  },
  footer: {
    brandSubtitle: "Refined commerce with one connected HenryCo account",
    brandBody: "HenryCo Marketplace is built for high-trust buying, verified sellers, and a cleaner experience from checkout to delivery.",
    shopTitle: "Shop",
    sellTitle: "Sell",
    supportTitle: "Support",
    supportBody:
      "Orders, seller conversations, support updates, and payment records stay connected in one HenryCo account.",
    shopLinks: [
      { href: "/search", label: "Search the marketplace" },
      { href: "/deals", label: "Deals and timed edits" },
      { href: "/trust", label: "Trust passport" },
      { href: "/policies/buyer-protection", label: "Buyer protection policy" },
      { href: "/help", label: "Support and resolution" },
    ],
    sellLinks: [
      { href: "/sell", label: "Why sell on HenryCo" },
      { href: "/sell/pricing", label: "Seller pricing and fees" },
      { href: "/policies/seller-policy", label: "Seller policy" },
      { href: "/account/seller-application", label: "Seller application" },
      { href: "/vendor", label: "Vendor workspace" },
    ],
  },
  productCard: {
    stockedByHenryCo: "HenryCo stocked",
    verifiedSeller: "Verified seller",
    onlyLeft: "Only {count} left",
    saveToWishlist: "Save to wishlist",
    removeFromWishlist: "Remove from wishlist",
    updatingWishlist: "Updating wishlist",
    codReady: "COD ready",
    addToCart: "Add to cart",
    addingToCart: "Adding to cart",
    view: "View",
  },
  trustPassport: {
    title: "Trust Passport",
    verification: "Verification",
    fulfillment: "Fulfillment",
    disputeRate: "Dispute Rate",
    responseSla: "Response SLA",
    visitStore: "Visit store",
  },
  workspace: {
    kicker: "Workspace",
    operatorKicker: "Operator Surface",
  },
  cart: {
    pageIntro: {
      kicker: "Cart",
      title: "A premium basket with faster edits and cleaner split-order clarity.",
      description:
        "The cart now keeps vendor grouping visible, updates quantity quickly, and stays connected to the mini-cart drawer so buyers never lose context when they are close to checkout.",
    },
    emptyState: {
      title: "Your cart is still empty.",
      body: "Quick-add from product cards, save items for later, and the basket will stay updated in the mini-cart drawer and the full cart without a hard refresh.",
      ctaLabel: "Browse products",
    },
  },
  deals: {
    metadata: {
      title: "Verified deals — HenryCo Marketplace",
      description:
        "Discounts filtered for trust, stock certainty, and seller accountability. Only verified listings with clean trust signals appear on the HenryCo deals page.",
    },
    pageIntro: {
      kicker: "Verified Deals",
      title: "Discounts filtered for trust, stock certainty, and seller accountability.",
      description:
        "Deals are only surfaced when the listing quality, seller trust passport, and stock status are clean enough to protect conversion and reduce buyer regret.",
    },
    sectionLabel: "Verified deals",
    listEyebrow: "Verified deals",
    refreshNote: "Updated regularly",
    discountBadgePrefix: "−",
    emptyState: {
      title: "No verified deals right now",
      body: "Verified discounts roll in as sellers list them. Check back soon.",
    },
  },
  category: {
    hero: {
      kicker: "Category edit",
      searchCta: "Search this category",
      trustCta: "Review trust standards",
      quickFiltersLabel: "Quick filters",
    },
    stats: {
      activeListingsLabel: "Active listings",
    },
    collectionsRail: {
      kicker: "Curated rails",
      title: "Collections that shorten decision-making.",
    },
    catalog: {
      kicker: "Category catalog",
      title: "Premium products, tighter hierarchy.",
      openSearch: "Open full search",
    },
    metadata: {
      titleTemplate: "{category} — HenryCo Marketplace",
      descriptionTemplate:
        "Explore verified products in {category} on HenryCo Marketplace, with trust signals, delivery clarity, and seller passports surfaced before checkout.",
      fallbackDescription:
        "Browse a curated category on HenryCo Marketplace with trust signals, delivery clarity, and seller passports surfaced before checkout.",
    },
  },
  brand: {
    eyebrow: "Brand",
    bodyFallback: "A verified store on HenryCo Marketplace with trust signals, delivery clarity, and seller passport details surfaced before checkout.",
    searchCta: "Search this brand",
    trustCta: "Trust standards",
    stats: {
      activeProducts: "Active products",
      listingsReviewed: "Listings reviewed",
      listingsReviewedValue: "Trust passport visible per item",
      buyerProtection: "Buyer protection",
      buyerProtectionValue: "Escrowed checkout",
    },
    liveKicker: "Live from {brand}",
    openFullSearch: "Open full search",
    metadataTitle: "{brand} — HenryCo Marketplace",
    metadataDescription:
      "Explore verified products from {brand} on HenryCo Marketplace, with trust signals, delivery clarity, and seller passports surfaced before checkout.",
  },
  sell: {
    metadata: {
      title: "Sell on HenryCo — selective marketplace for trust-led sellers",
      description:
        "Apply to sell on HenryCo Marketplace: trust-led positioning, premium storefronts, and a unified workspace for orders, payouts, and support.",
    },
    hero: {
      kicker: "Sell on HenryCo",
      title: "Selective by design. Built for sellers who lead on trust.",
      body: "HenryCo Marketplace favours sellers who care about presentation, reliable fulfillment, and honest buyer protection. The bar is explicit on this page; the seller application continues inside your HenryCo account.",
      primaryCta: "Open seller application",
      secondaryCta: "See seller pricing",
      signInCta: "Sign in with HenryCo account",
      highlights: [
        { label: "Selection", value: "Manual review, not pay-to-list" },
        { label: "Storefront", value: "Trust passport visible to buyers" },
        { label: "Workspace", value: "Orders, payouts, support unified" },
      ],
    },
    advantages: {
      kicker: "Why stronger sellers win here",
      items: [
        { title: "Trust-led positioning", body: "Your store gets a visible trust passport instead of being buried in low-quality marketplace clutter." },
        { title: "Better storefront quality", body: "Editorial rails, calmer search, and cleaner product cards help quality stores convert faster." },
        { title: "Sharper operations", body: "Payouts, orders, support, moderation, and stock alerts stay visible in one cleaner workspace." },
      ],
    },
    onboarding: {
      kicker: "How onboarding works",
      stepLabel: "Step",
      steps: [
        { step: "01", title: "Start the seller application", body: "Open the application from inside your HenryCo account — drafts save automatically while you assemble details." },
        { step: "02", title: "Add business details", body: "Business name, store profile, product focus, and any verification documents that explain how you fulfil orders." },
        { step: "03", title: "Application review", body: "The HenryCo team reviews documents, trust signals, and store readiness — not just a paid badge." },
        { step: "04", title: "Vendor onboarding", body: "Approved sellers continue into vendor onboarding where pricing, posting fees, payout windows, and policy rules stay visible before publishing opens." },
      ],
      callout: {
        eyebrow: "A cleaner seller application",
        body: "Seller registration stays inside your account so business details, review status, and approval updates remain private and easy to follow.",
      },
    },
    plans: {
      kicker: "Plan economics",
      title: "Tiers stated up front, not after publishing.",
      feeLabel: "Fee",
      payoutLabel: "Payout",
      includedLabel: "Included",
      includedSuffix: "listings",
      featuredLabel: "Featured",
      featuredCurrencyPrefix: "NGN",
    },
    trustTiers: {
      kicker: "Trust tiers change privileges",
      title: "Earn faster payouts, larger storefronts, and policy advantages.",
    },
    closing: {
      kicker: "Move forward",
      title: "Apply, then watch the application status from your account.",
      body: "Approval unlocks vendor onboarding. Pricing, posting fees, and payout windows are visible before you publish — no contract surprises later.",
      primaryCta: "Start application",
      secondaryCta: "Visit vendor workspace",
    },
  },
  sellPricing: {
    metadata: {
      title: "Seller pricing — HenryCo Marketplace",
      description:
        "Plan fees, listing fees, featured-slot fees, transaction commission, and payout processing are all stated up front — before you publish inventory, not after.",
    },
    hero: {
      kicker: "Seller pricing",
      title: "Clear economics. No hidden fees.",
      body: "Plan fees, listing fees, featured-slot fees, transaction commission, and payout processing are all stated up front — before you publish inventory, not after.",
      primaryCta: "Apply as seller",
      secondaryCta: "Back to seller overview",
      statsLabels: {
        planTiers: "Plan tiers",
        trustTiers: "Trust tiers",
        featuredSlots: "Featured slots",
      },
      featuredSlotsValue: "Reviewed individually",
    },
    plans: {
      kicker: "Plans at a glance",
      feeLabel: "Fee",
      payoutLabel: "Payout",
      includedLabel: "Included",
      includedSuffix: "listings",
      extraListingLabel: "Extra listing",
      featuredSlotLabel: "Featured slot",
      currencyPrefix: "NGN",
      ctaPartner: "Contact for partner terms",
      ctaTemplate: "Start with {plan}",
    },
    economics: {
      kicker: "How HenryCo makes money",
      title: "Stated up front, deducted in the open.",
      items: [
        "Transaction commissions are deducted from each vendor order-group settlement before payout release.",
        "Posting fees apply after the included listing allowance is exhausted for the seller's active plan.",
        "Featured placement is a separate paid request and stays subject to quality and trust review.",
        "Payout processing fees are deducted inside the seller settlement snapshot, not later by surprise.",
        "Studio, Learn, and Logistics value-added services create additional seller revenue lanes.",
        "Operator-controlled campaigns and sponsored slots remain auditable and not self-serve chaos.",
      ],
    },
    trustTiers: {
      kicker: "Trust-tier payout timing",
      title: "Better behaviour earns shorter holds.",
    },
    closing: {
      kicker: "Ready to apply?",
      title: "Application opens in your HenryCo account.",
      body: "You can save the draft and return — pricing visible here applies once vendor onboarding completes.",
      primaryCta: "Apply as seller",
      secondaryCta: "Trust standards",
    },
  },
  help: {
    metadata: {
      title: "Help centre — HenryCo Marketplace",
      description:
        "Browse the answers buyers and sellers ask most. If you do not find what you need, open a support ticket and a person on the team will read it.",
    },
    hero: {
      kicker: "Help centre",
      title: "Find an answer in seconds — or talk to a person.",
      body: "Search the topics most buyers and sellers ask about. If you do not find what you need, open a support ticket from the bottom of this page and a person on the team will read it.",
    },
    stillNeedHelp: {
      kicker: "Still need help",
      title: "Open a support ticket and a person will read it.",
      body: "Tickets keep the full context attached — the order, the vendor, the dispute history — so the team works through the issue without you re-typing it on every reply.",
      ctaLabel: "Open a support ticket",
    },
  },
  trust: {
    metadata: {
      title: "Trust & safety — HenryCo Marketplace",
      description:
        "Trust governs what a seller can do, how money moves, and how moderation responds. Seller tiers, escrow holds, disputes, and payout release all leave a server-side paper trail.",
    },
    hero: {
      kicker: "Trust & safety",
      title: "Visible before checkout. Enforced after it.",
      body: "Trust governs what a seller can do, how money moves, and how moderation responds. Seller tiers, buyer risk, listing scoring, escrow holds, disputes, and payout release all leave a server-side paper trail.",
      pillars: [
        { label: "Money movement", value: "Escrowed, released after checks" },
        { label: "Reviews", value: "Server-logged, dispute-traceable" },
        { label: "Tiers", value: "Earned, revocable" },
      ],
    },
    guardrails: {
      kicker: "Four guardrails",
      items: [
        {
          title: "Trust passports",
          body: "Every store and product surfaces verification level, SLA, dispute rate, payout readiness, and fulfillment posture.",
        },
        {
          title: "Escrow control",
          body: "Buyer funds are held by HenryCo first, then move into releasable payout only after delivery and trust checks clear.",
        },
        {
          title: "Anti-fraud review",
          body: "Off-platform payment steering, duplicate media, listing velocity spikes, and risky payout patterns route into queue visibility.",
        },
        {
          title: "Audit trails",
          body: "Approvals, rejections, payout actions, dispute decisions, and automation sweeps are logged server-side.",
        },
      ],
    },
    sellerLadder: {
      kicker: "Seller trust ladder",
      title: "Tiers earned through behaviour, not paid for.",
    },
    policySurfaces: {
      kicker: "Policy surfaces",
      title: "The standards we hold ourselves to.",
    },
    ecosystem: {
      kicker: "Ecosystem trust reinforcement",
    },
  },
  collections: {
    metadata: {
      titleTemplate: "{collection} — HenryCo Marketplace",
      descriptionTemplate:
        "Explore {collection} on HenryCo Marketplace — a curated rail of verified products with trust signals, delivery clarity, and seller passports surfaced before checkout.",
      fallbackDescription:
        "A curated collection on HenryCo Marketplace with verified products, trust signals, delivery clarity, and seller passports surfaced before checkout.",
    },
    hero: {
      primaryCta: "Open full search",
      secondaryCta: "Trust standards",
    },
    sidebar: {
      itemsLabel: "Items in collection",
      editedByLabel: "Edited by",
      editedByValue: "Marketplace operations",
      buyerProtectionLabel: "Buyer protection",
      buyerProtectionValue: "Escrowed checkout",
    },
    rail: {
      kicker: "What’s in the rail",
      itemsSuffix: "items",
    },
  },
};

const FR: DeepPartial<MarketplacePublicCopy> = {
  home: {
    heroKicker: "Marché premium raffiné",
    heroTitle: "Achetez auprès de boutiques vérifiées, sans bruit ni doute sur la confiance.",
    heroBody:
      "HenryCo Marketplace transforme le commerce multi-vendeurs en une expérience plus calme : découverte plus claire, ajout rapide depuis chaque carte, vision nette des commandes fractionnées, meilleurs passeports vendeurs et un seul compte HenryCo pour commandes, paiements, avis et support.",
    primaryCta: "Explorer le catalogue",
    secondaryCta: "Vendre sur HenryCo",
    quickCards: [
      { title: "Ajout rapide partout", body: "Contrôles panier discrets, mini-panier mis à jour instantanément, sans rafraîchissements maladroits." },
      { title: "Rails de confiance vérifiés", body: "Passeports vendeurs, promesses de livraison, qualité des avis et propriété du stock restent faciles à lire." },
      { title: "Un seul compte, moins de friction", body: "Commandes, paiements, liste de souhaits, abonnements et notifications restent dans un seul compte HenryCo." },
    ],
    whyKicker: "Pourquoi c’est différent",
    whyTitle: "La confiance est visible avant le paiement.",
    whyCards: [
      { title: "La confiance est visible avant le paiement", body: "Niveau de vérification, taux de litiges, réactivité du support et fiabilité de l’exécution restent proches de la décision d’achat." },
      { title: "La clarté des commandes fractionnées reste lisible", body: "Quand le stock vient de différents vendeurs ou de HenryCo, la segmentation de livraison reste évidente au lieu de devenir confuse." },
      { title: "Des vendeurs sélectionnés, pas empilés dans une grille", body: "Le marché privilégie des boutiques plus solides, des fiches plus propres et une meilleure responsabilité après commande." },
    ],
    emptyTitle: "Le catalogue est en préparation.",
    emptyBody: "Les produits, collections et campagnes validés apparaîtront ici dès leur mise en ligne.",
    emptyCta: "Contacter le support marketplace",
    categoryKicker: "Découverte par catégorie",
    categoryTitle: "Découvrez par ambiance, espace et niveau de confiance.",
    categoryLink: "Ouvrir la recherche",
    freshKicker: "Nouvelles validations",
    freshTitle: "Nouveautés du marketplace en ce moment.",
    featuredKicker: "Produits vedettes",
    featuredTitle: "Cartes premium, ajout instantané et signaux d’achat plus clairs.",
    browseAll: "Tout parcourir",
    collectionsKicker: "Collections éditoriales",
    collectionsTitle: "Des parcours guidés qui orientent sans crier.",
    vendorsKicker: "Boutiques de confiance",
    vendorsTitle: "Vendeurs vérifiés avec une responsabilité plus claire.",
    standardsKicker: "Normes marketplace",
    standardsTitle: "Conçu pour la confiance, la clarté et une expérience d’achat plus calme.",
    standardsBullets: [
      "Les candidatures vendeurs, la modération et les validations passent par des files de revue HenryCo dédiées.",
      "Les mises à jour de commande, les avis, le support et les paiements restent liés au même compte acheteur.",
      "Le support, l’examen des paiements et les opérations de livraison restent organisés pour des réponses cohérentes.",
    ],
    sellerKicker: "Qualité vendeur",
    sellerTitle: "Les vendeurs sérieux commencent dans leur compte HenryCo.",
    sellerBody:
      "Les visiteurs publics peuvent découvrir la vente sur /sell, tandis que la candidature, l’avancement du brouillon, les mises à jour de revue et le statut d’approbation restent dans l’expérience vendeur.",
    sellerBullets: [
      "Enregistrement des brouillons et visibilité de l’avancement",
      "Gestion privée des documents au bon endroit",
      "Mises à jour claires d’approbation pour chaque vendeur",
    ],
  },
  kpiLabels: {
    verifiedStores: "Boutiques vérifiées",
    activeListings: "Annonces actives",
    trustRating: "Indice de confiance",
  },
  kpiHints: {
    verifiedStores: "Vendeurs sélectionnés et stock appartenant à HenryCo avec une responsabilité plus claire.",
    activeListings: "Annonces approuvées affichées avec des informations claires sur la livraison, la confiance et la propriété.",
    trustRating: "La qualité des avis marketplace et la fiabilité des vendeurs apparaissent avant le paiement.",
  },
  footer: {
    brandSubtitle: "Commerce raffiné avec un seul compte HenryCo connecté",
    brandBody:
      "HenryCo Marketplace est pensé pour des achats à forte confiance, des vendeurs vérifiés et une expérience plus propre du paiement à la livraison.",
    shopTitle: "Acheter",
    sellTitle: "Vendre",
    supportTitle: "Support",
    supportBody:
      "Commandes, échanges vendeurs, mises à jour du support et paiements restent liés dans un seul compte HenryCo.",
    shopLinks: [
      { href: "/search", label: "Rechercher dans le marketplace" },
      { href: "/deals", label: "Offres et éditions limitées" },
      { href: "/trust", label: "Passeport de confiance" },
      { href: "/policies/buyer-protection", label: "Politique de protection de l’acheteur" },
      { href: "/help", label: "Support et résolution" },
    ],
    sellLinks: [
      { href: "/sell", label: "Pourquoi vendre sur HenryCo" },
      { href: "/sell/pricing", label: "Tarifs et frais vendeur" },
      { href: "/policies/seller-policy", label: "Politique vendeur" },
      { href: "/account/seller-application", label: "Candidature vendeur" },
      { href: "/vendor", label: "Espace vendeur" },
    ],
  },
  productCard: {
    stockedByHenryCo: "Stock HenryCo",
    verifiedSeller: "Vendeur vérifié",
    onlyLeft: "Plus que {count}",
    saveToWishlist: "Ajouter à la liste",
    removeFromWishlist: "Retirer de la liste",
    updatingWishlist: "Mise à jour de la liste",
    codReady: "Paiement à la livraison",
    addToCart: "Ajouter au panier",
    addingToCart: "Ajout au panier",
    view: "Voir",
  },
  trustPassport: {
    title: "Passeport de confiance",
    verification: "Vérification",
    fulfillment: "Exécution",
    disputeRate: "Taux de litiges",
    responseSla: "SLA de réponse",
    visitStore: "Voir la boutique",
  },
  workspace: {
    kicker: "Espace de travail",
    operatorKicker: "Surface opérateur",
  },
  cart: {
    pageIntro: {
      kicker: "Panier",
      title: "Un panier premium, des modifications plus rapides et des commandes fractionnées plus lisibles.",
      description:
        "Le panier garde le regroupement par vendeur visible, met à jour les quantités rapidement et reste connecté au tiroir mini-panier pour que les acheteurs ne perdent jamais le fil au moment de finaliser.",
    },
    emptyState: {
      title: "Votre panier est encore vide.",
      body: "Ajoutez rapidement depuis les fiches produits, sauvegardez des articles pour plus tard, et le panier reste à jour dans le tiroir mini-panier comme dans le panier complet, sans rechargement.",
      ctaLabel: "Parcourir les produits",
    },
  },
  deals: {
    metadata: {
      title: "Offres vérifiées — Marketplace HenryCo",
      description:
        "Des remises filtrées sur la confiance, la disponibilité réelle des stocks et la responsabilité des vendeurs. Seules les annonces vérifiées aux signaux propres apparaissent sur la page des offres HenryCo.",
    },
    pageIntro: {
      kicker: "Offres vérifiées",
      title: "Des remises filtrées sur la confiance, la disponibilité des stocks et la responsabilité des vendeurs.",
      description:
        "Les offres ne sont mises en avant que lorsque la qualité de l’annonce, le passeport de confiance du vendeur et l’état du stock sont assez propres pour protéger la conversion et éviter le regret après achat.",
    },
    sectionLabel: "Offres vérifiées",
    listEyebrow: "Offres vérifiées",
    refreshNote: "Mises à jour régulièrement",
    discountBadgePrefix: "−",
    emptyState: {
      title: "Aucune offre vérifiée pour le moment",
      body: "Les remises vérifiées apparaissent dès que les vendeurs les publient. Repassez bientôt.",
    },
  },
  category: {
    hero: {
      kicker: "Édition catégorie",
      searchCta: "Rechercher dans cette catégorie",
      trustCta: "Voir les standards de confiance",
      quickFiltersLabel: "Filtres rapides",
    },
    stats: {
      activeListingsLabel: "Annonces actives",
    },
    collectionsRail: {
      kicker: "Sélections curatées",
      title: "Des collections qui raccourcissent la décision.",
    },
    catalog: {
      kicker: "Catalogue de la catégorie",
      title: "Produits premium, hiérarchie plus nette.",
      openSearch: "Ouvrir la recherche complète",
    },
    metadata: {
      titleTemplate: "{category} — Marketplace HenryCo",
      descriptionTemplate:
        "Explorez les produits vérifiés de {category} sur HenryCo Marketplace, avec des signaux de confiance, des informations de livraison claires et des passeports vendeurs visibles avant le paiement.",
      fallbackDescription:
        "Parcourez une catégorie sélectionnée du HenryCo Marketplace avec des signaux de confiance, une livraison plus claire et des passeports vendeurs avant paiement.",
    },
  },
  brand: {
    eyebrow: "Marque",
    bodyFallback:
      "Une boutique vérifiée sur HenryCo Marketplace, avec des signaux de confiance, une livraison plus claire et un passeport vendeur visibles avant le paiement.",
    searchCta: "Rechercher dans cette marque",
    trustCta: "Standards de confiance",
    stats: {
      activeProducts: "Produits actifs",
      listingsReviewed: "Annonces vérifiées",
      listingsReviewedValue: "Passeport de confiance visible par article",
      buyerProtection: "Protection acheteur",
      buyerProtectionValue: "Paiement sous séquestre",
    },
    liveKicker: "En direct de {brand}",
    openFullSearch: "Ouvrir la recherche complète",
    metadataTitle: "{brand} — Marketplace HenryCo",
    metadataDescription:
      "Explorez les produits vérifiés de {brand} sur HenryCo Marketplace, avec des signaux de confiance, une livraison plus claire et des passeports vendeurs visibles avant le paiement.",
  },
  help: {
    metadata: {
      title: "Centre d’aide — Marketplace HenryCo",
      description:
        "Parcourez les questions les plus posées par les acheteurs et vendeurs. Si vous ne trouvez pas ce qu’il vous faut, ouvrez un ticket et un membre de l’équipe le lira.",
    },
    hero: {
      kicker: "Centre d’aide",
      title: "Trouvez une réponse en quelques secondes — ou parlez à une personne.",
      body: "Cherchez les sujets que les acheteurs et les vendeurs posent le plus. Si vous ne trouvez pas ce qu’il vous faut, ouvrez un ticket en bas de page et un membre de l’équipe le lira.",
    },
    stillNeedHelp: {
      kicker: "Encore besoin d’aide",
      title: "Ouvrez un ticket et une personne le lira.",
      body: "Les tickets gardent tout le contexte rattaché — la commande, le vendeur, l’historique du litige — pour que l’équipe traite le sujet sans que vous ayez à le réécrire à chaque réponse.",
      ctaLabel: "Ouvrir un ticket de support",
    },
  },
  sell: {
    metadata: {
      title: "Vendre sur HenryCo — marketplace sélective pour des vendeurs de confiance",
      description:
        "Postulez pour vendre sur HenryCo Marketplace : positionnement axé sur la confiance, vitrines premium et un espace unifié pour commandes, paiements et support.",
    },
    hero: {
      kicker: "Vendre sur HenryCo",
      title: "Sélective par essence. Conçue pour les vendeurs qui misent sur la confiance.",
      body: "HenryCo Marketplace privilégie les vendeurs soigneux dans leur présentation, fiables dans l’exécution et honnêtes sur la protection des acheteurs. Le niveau attendu est explicité sur cette page ; la candidature vendeur se poursuit dans votre compte HenryCo.",
      primaryCta: "Ouvrir la candidature vendeur",
      secondaryCta: "Voir les tarifs vendeur",
      signInCta: "Se connecter avec un compte HenryCo",
      highlights: [
        { label: "Sélection", value: "Revue manuelle, pas de mise en ligne payante" },
        { label: "Vitrine", value: "Passeport de confiance visible par les acheteurs" },
        { label: "Espace", value: "Commandes, paiements et support unifiés" },
      ],
    },
    advantages: {
      kicker: "Pourquoi les meilleurs vendeurs réussissent ici",
      items: [
        { title: "Positionnement basé sur la confiance", body: "Votre boutique reçoit un passeport de confiance visible, au lieu d’être noyée dans le bruit d’un marketplace bas de gamme." },
        { title: "Une meilleure qualité de vitrine", body: "Des rails éditoriaux, une recherche plus calme et des fiches produits plus nettes aident les boutiques exigeantes à mieux convertir." },
        { title: "Une exploitation plus nette", body: "Paiements, commandes, support, modération et alertes stock restent visibles dans un espace de travail plus clair." },
      ],
    },
    onboarding: {
      kicker: "Comment se passe l’onboarding",
      stepLabel: "Étape",
      steps: [
        { step: "01", title: "Lancer la candidature vendeur", body: "Ouvrez la candidature depuis votre compte HenryCo — les brouillons s’enregistrent automatiquement pendant que vous rassemblez les informations." },
        { step: "02", title: "Ajouter les détails de l’activité", body: "Nom d’entreprise, profil de boutique, axe produit et tout document de vérification expliquant comment vous honorez vos commandes." },
        { step: "03", title: "Revue de la candidature", body: "L’équipe HenryCo examine les documents, les signaux de confiance et la solidité de la boutique — pas seulement un badge payant." },
        { step: "04", title: "Onboarding vendeur", body: "Les vendeurs approuvés continuent l’onboarding où tarifs, frais de publication, fenêtres de paiement et règles restent visibles avant la mise en ligne." },
      ],
      callout: {
        eyebrow: "Une candidature vendeur plus propre",
        body: "L’inscription vendeur reste dans votre compte pour que les détails de l’activité, l’état de la revue et les mises à jour d’approbation restent privés et faciles à suivre.",
      },
    },
    plans: {
      kicker: "Économie des plans",
      title: "Des paliers annoncés en amont, pas après la mise en ligne.",
      feeLabel: "Commission",
      payoutLabel: "Versement",
      includedLabel: "Inclus",
      includedSuffix: "annonces",
      featuredLabel: "Mise en avant",
      featuredCurrencyPrefix: "NGN",
    },
    trustTiers: {
      kicker: "Les paliers de confiance changent les privilèges",
      title: "Obtenez des versements plus rapides, des vitrines plus larges et des avantages côté politique.",
    },
    closing: {
      kicker: "Avancer",
      title: "Postulez, puis suivez le statut de la candidature depuis votre compte.",
      body: "L’approbation ouvre l’onboarding vendeur. Tarifs, frais de publication et fenêtres de paiement restent visibles avant la mise en ligne — pas de mauvaises surprises contractuelles ensuite.",
      primaryCta: "Démarrer la candidature",
      secondaryCta: "Voir l’espace vendeur",
    },
  },
  sellPricing: {
    metadata: {
      title: "Tarifs vendeur — HenryCo Marketplace",
      description:
        "Frais de plan, frais de mise en ligne, frais de mise en avant, commission de transaction et traitement des paiements sont tous annoncés en amont — avant la publication, pas après.",
    },
    hero: {
      kicker: "Tarifs vendeur",
      title: "Une économie claire. Aucun frais caché.",
      body: "Frais de plan, frais de mise en ligne, frais de mise en avant, commission de transaction et traitement des paiements sont tous annoncés en amont — avant la publication de votre catalogue, pas après.",
      primaryCta: "Postuler comme vendeur",
      secondaryCta: "Retour à l’aperçu vendeur",
      statsLabels: {
        planTiers: "Paliers de plan",
        trustTiers: "Paliers de confiance",
        featuredSlots: "Mises en avant",
      },
      featuredSlotsValue: "Examinées au cas par cas",
    },
    plans: {
      kicker: "Aperçu des plans",
      feeLabel: "Commission",
      payoutLabel: "Versement",
      includedLabel: "Inclus",
      includedSuffix: "annonces",
      extraListingLabel: "Annonce supplémentaire",
      featuredSlotLabel: "Mise en avant",
      currencyPrefix: "NGN",
      ctaPartner: "Nous contacter pour des conditions partenaires",
      ctaTemplate: "Commencer avec {plan}",
    },
    economics: {
      kicker: "Comment HenryCo gagne de l’argent",
      title: "Annoncé en amont, déduit à la vue de tous.",
      items: [
        "Les commissions de transaction sont prélevées sur chaque règlement de groupe-commande vendeur avant la libération du versement.",
        "Les frais de mise en ligne s’appliquent une fois l’allocation d’annonces incluses épuisée pour le plan actif du vendeur.",
        "Une mise en avant est une demande payante distincte, soumise à un contrôle de qualité et de confiance.",
        "Les frais de traitement de versement sont déduits dans le récapitulatif de règlement vendeur, pas en surprise plus tard.",
        "Les services à valeur ajoutée Studio, Learn et Logistics ouvrent des relais de revenus supplémentaires pour les vendeurs.",
        "Les campagnes pilotées par l’opérateur et les emplacements sponsorisés restent auditables et non livrés en libre-service.",
      ],
    },
    trustTiers: {
      kicker: "Calendrier de versement par palier de confiance",
      title: "Un meilleur comportement raccourcit les retenues.",
    },
    closing: {
      kicker: "Prêt à candidater ?",
      title: "La candidature s’ouvre dans votre compte HenryCo.",
      body: "Vous pouvez enregistrer le brouillon et revenir — la tarification affichée ici s’applique une fois l’onboarding vendeur terminé.",
      primaryCta: "Postuler comme vendeur",
      secondaryCta: "Standards de confiance",
    },
  },
  trust: {
    metadata: {
      title: "Confiance & sécurité — HenryCo Marketplace",
      description:
        "La confiance définit ce qu’un vendeur peut faire, comment l’argent circule et comment la modération réagit. Niveaux vendeurs, séquestre, litiges et libération des paiements laissent une trace serveur complète.",
    },
    hero: {
      kicker: "Confiance & sécurité",
      title: "Visible avant le paiement. Appliquée après.",
      body: "La confiance gouverne ce que peut faire un vendeur, la circulation de l’argent et la réponse de la modération. Niveaux vendeurs, risque acheteur, notation des annonces, séquestre, litiges et libération des paiements laissent une trace serveur.",
      pillars: [
        { label: "Flux d’argent", value: "Sous séquestre, libéré après contrôles" },
        { label: "Avis", value: "Journalisés côté serveur, traçables en litige" },
        { label: "Niveaux", value: "Gagnés, révocables" },
      ],
    },
    guardrails: {
      kicker: "Quatre garde-fous",
      items: [
        {
          title: "Passeports de confiance",
          body: "Chaque boutique et chaque produit expose son niveau de vérification, son SLA, son taux de litige, sa disponibilité au paiement et sa posture d’exécution.",
        },
        {
          title: "Contrôle du séquestre",
          body: "Les fonds de l’acheteur sont d’abord détenus par HenryCo, puis libérés au paiement seulement après livraison et contrôles validés.",
        },
        {
          title: "Revue anti-fraude",
          body: "Détours de paiement hors plateforme, médias dupliqués, pics de mise en ligne et schémas de paiement à risque entrent dans la visibilité des files de revue.",
        },
        {
          title: "Pistes d’audit",
          body: "Approbations, refus, actions de paiement, décisions de litige et balayages automatisés sont journalisés côté serveur.",
        },
      ],
    },
    sellerLadder: {
      kicker: "Échelle de confiance vendeur",
      title: "Des niveaux gagnés par le comportement, pas achetés.",
    },
    policySurfaces: {
      kicker: "Surfaces des politiques",
      title: "Les standards que nous nous imposons.",
    },
    ecosystem: {
      kicker: "Renforcement de la confiance dans l’écosystème",
    },
  },
  collections: {
    metadata: {
      titleTemplate: "{collection} — Marketplace HenryCo",
      descriptionTemplate:
        "Découvrez {collection} sur HenryCo Marketplace — une sélection curatée de produits vérifiés, avec signaux de confiance, livraison plus claire et passeports vendeurs avant le paiement.",
      fallbackDescription:
        "Une collection curatée sur HenryCo Marketplace, avec des produits vérifiés, des signaux de confiance, une livraison plus claire et des passeports vendeurs avant le paiement.",
    },
    hero: {
      primaryCta: "Ouvrir la recherche complète",
      secondaryCta: "Standards de confiance",
    },
    sidebar: {
      itemsLabel: "Articles de la collection",
      editedByLabel: "Édité par",
      editedByValue: "Opérations Marketplace",
      buyerProtectionLabel: "Protection acheteur",
      buyerProtectionValue: "Paiement sous séquestre",
    },
    rail: {
      kicker: "Au programme de la sélection",
      itemsSuffix: "articles",
    },
  },
};

const ES: DeepPartial<MarketplacePublicCopy> = {
  cart: {
    pageIntro: {
      kicker: "Carrito",
      title: "Una cesta premium con ediciones más rápidas y mayor claridad en pedidos divididos.",
      description:
        "El carrito mantiene visible la agrupación por vendedor, actualiza las cantidades con agilidad y permanece conectado al mini-carrito para que los compradores no pierdan el contexto al acercarse al pago.",
    },
    emptyState: {
      title: "Tu carrito sigue vacío.",
      body: "Añade rápido desde las fichas de producto, guarda artículos para más tarde, y la cesta se mantiene al día tanto en el mini-carrito como en el carrito completo, sin recargar.",
      ctaLabel: "Explorar productos",
    },
  },
  deals: {
    metadata: {
      title: "Ofertas verificadas — HenryCo Marketplace",
      description:
        "Descuentos filtrados por confianza, certeza de stock y responsabilidad del vendedor. En la página de ofertas de HenryCo solo aparecen listados verificados con señales limpias.",
    },
    pageIntro: {
      kicker: "Ofertas verificadas",
      title: "Descuentos filtrados por confianza, certeza de stock y responsabilidad del vendedor.",
      description:
        "Solo destacamos ofertas cuando la calidad del anuncio, el pasaporte de confianza del vendedor y el estado del stock están lo bastante limpios para proteger la conversión y reducir el arrepentimiento del comprador.",
    },
    sectionLabel: "Ofertas verificadas",
    listEyebrow: "Ofertas verificadas",
    refreshNote: "Actualizadas con regularidad",
    discountBadgePrefix: "−",
    emptyState: {
      title: "No hay ofertas verificadas ahora mismo",
      body: "Los descuentos verificados aparecen a medida que los vendedores los publican. Vuelve pronto.",
    },
  },
  brand: {
    eyebrow: "Marca",
    bodyFallback:
      "Una tienda verificada en HenryCo Marketplace, con señales de confianza, claridad de entrega y pasaporte del vendedor visibles antes del pago.",
    searchCta: "Buscar en esta marca",
    trustCta: "Estándares de confianza",
    stats: {
      activeProducts: "Productos activos",
      listingsReviewed: "Anuncios revisados",
      listingsReviewedValue: "Pasaporte de confianza visible por artículo",
      buyerProtection: "Protección al comprador",
      buyerProtectionValue: "Pago en custodia",
    },
    liveKicker: "En directo desde {brand}",
    openFullSearch: "Abrir búsqueda completa",
    metadataTitle: "{brand} — HenryCo Marketplace",
    metadataDescription:
      "Explora productos verificados de {brand} en HenryCo Marketplace, con señales de confianza, claridad de entrega y pasaportes de vendedor visibles antes del pago.",
  },
  help: {
    metadata: {
      title: "Centro de ayuda — HenryCo Marketplace",
      description:
        "Consulta las dudas más frecuentes de compradores y vendedores. Si no encuentras lo que buscas, abre un ticket y una persona del equipo lo leerá.",
    },
    hero: {
      kicker: "Centro de ayuda",
      title: "Encuentra una respuesta en segundos — o habla con una persona.",
      body: "Busca los temas que más consultan compradores y vendedores. Si no encuentras lo que necesitas, abre un ticket al final de la página y una persona del equipo lo leerá.",
    },
    stillNeedHelp: {
      kicker: "Aún necesitas ayuda",
      title: "Abre un ticket y una persona lo leerá.",
      body: "Los tickets conservan todo el contexto adjunto — el pedido, el vendedor, el historial de la disputa — para que el equipo resuelva sin que tengas que reescribirlo en cada respuesta.",
      ctaLabel: "Abrir un ticket de soporte",
    },
  },
  sell: {
    metadata: {
      title: "Vender en HenryCo — marketplace selectivo para vendedores de confianza",
      description:
        "Solicita vender en HenryCo Marketplace: posicionamiento basado en la confianza, escaparates premium y un espacio unificado para pedidos, pagos y soporte.",
    },
    hero: {
      kicker: "Vender en HenryCo",
      title: "Selectivo por diseño. Pensado para vendedores que priorizan la confianza.",
      body: "HenryCo Marketplace favorece a vendedores cuidadosos en la presentación, fiables en el cumplimiento y honestos con la protección al comprador. El nivel exigido se explica en esta página; la solicitud de vendedor continúa dentro de tu cuenta HenryCo.",
      primaryCta: "Abrir solicitud de vendedor",
      secondaryCta: "Ver tarifas de vendedor",
      signInCta: "Iniciar sesión con cuenta HenryCo",
      highlights: [
        { label: "Selección", value: "Revisión manual, no pago por listar" },
        { label: "Escaparate", value: "Pasaporte de confianza visible para compradores" },
        { label: "Espacio", value: "Pedidos, pagos y soporte unificados" },
      ],
    },
    advantages: {
      kicker: "Por qué triunfan aquí los vendedores más sólidos",
      items: [
        { title: "Posicionamiento basado en la confianza", body: "Tu tienda recibe un pasaporte de confianza visible, en lugar de quedar sepultada en el ruido de un marketplace de baja calidad." },
        { title: "Mejor calidad de escaparate", body: "Carriles editoriales, una búsqueda más calmada y fichas de producto más limpias ayudan a convertir mejor a las tiendas exigentes." },
        { title: "Operativa más nítida", body: "Pagos, pedidos, soporte, moderación y avisos de stock se mantienen visibles en un mismo espacio más claro." },
      ],
    },
    onboarding: {
      kicker: "Cómo funciona el onboarding",
      stepLabel: "Paso",
      steps: [
        { step: "01", title: "Iniciar la solicitud de vendedor", body: "Abre la solicitud desde tu cuenta HenryCo — los borradores se guardan automáticamente mientras reúnes la información." },
        { step: "02", title: "Añadir los datos del negocio", body: "Nombre de la empresa, perfil de tienda, enfoque de producto y los documentos de verificación que explican cómo cumples los pedidos." },
        { step: "03", title: "Revisión de la solicitud", body: "El equipo de HenryCo revisa documentos, señales de confianza y la solidez de la tienda — no solo una insignia de pago." },
        { step: "04", title: "Onboarding del vendedor", body: "Los vendedores aprobados continúan con el onboarding, donde tarifas, comisiones de publicación, ventanas de cobro y políticas son visibles antes de publicar." },
      ],
      callout: {
        eyebrow: "Una solicitud de vendedor más limpia",
        body: "El registro de vendedor permanece dentro de tu cuenta para que los datos del negocio, el estado de la revisión y las actualizaciones de aprobación queden privados y fáciles de seguir.",
      },
    },
    plans: {
      kicker: "Economía de los planes",
      title: "Tarifas claras desde el inicio, no después de publicar.",
      feeLabel: "Comisión",
      payoutLabel: "Cobro",
      includedLabel: "Incluido",
      includedSuffix: "anuncios",
      featuredLabel: "Destacado",
      featuredCurrencyPrefix: "NGN",
    },
    trustTiers: {
      kicker: "Los niveles de confianza cambian los privilegios",
      title: "Consigue cobros más rápidos, escaparates más amplios y ventajas en políticas.",
    },
    closing: {
      kicker: "Avanzar",
      title: "Solicita y sigue el estado desde tu cuenta.",
      body: "La aprobación desbloquea el onboarding de vendedor. Tarifas, comisiones de publicación y ventanas de cobro se ven antes de publicar — sin sorpresas contractuales después.",
      primaryCta: "Iniciar solicitud",
      secondaryCta: "Ir al espacio de vendedor",
    },
  },
  sellPricing: {
    metadata: {
      title: "Tarifas para vendedores — HenryCo Marketplace",
      description:
        "Tarifas de plan, de publicación, de destacados, comisión por transacción y procesamiento de cobros se declaran por adelantado — antes de publicar inventario, no después.",
    },
    hero: {
      kicker: "Tarifas para vendedores",
      title: "Economía clara. Sin comisiones ocultas.",
      body: "Tarifas de plan, comisiones de publicación, slots destacados, comisión por transacción y procesamiento de cobros se declaran por adelantado — antes de publicar tu inventario, no después.",
      primaryCta: "Postularme como vendedor",
      secondaryCta: "Volver al resumen de vendedor",
      statsLabels: {
        planTiers: "Niveles de plan",
        trustTiers: "Niveles de confianza",
        featuredSlots: "Slots destacados",
      },
      featuredSlotsValue: "Revisados caso por caso",
    },
    plans: {
      kicker: "Planes de un vistazo",
      feeLabel: "Comisión",
      payoutLabel: "Cobro",
      includedLabel: "Incluidos",
      includedSuffix: "anuncios",
      extraListingLabel: "Anuncio extra",
      featuredSlotLabel: "Slot destacado",
      currencyPrefix: "NGN",
      ctaPartner: "Contactar para condiciones de partner",
      ctaTemplate: "Empezar con {plan}",
    },
    economics: {
      kicker: "Cómo gana dinero HenryCo",
      title: "Declarado por adelantado, deducido a la vista.",
      items: [
        "Las comisiones por transacción se descuentan en cada liquidación del grupo-pedido del vendedor antes de liberar el cobro.",
        "Las tarifas de publicación se aplican una vez agotado el cupo de anuncios incluidos en el plan activo del vendedor.",
        "La colocación destacada es una solicitud de pago aparte y queda sujeta a control de calidad y confianza.",
        "Las comisiones por procesamiento de cobro se deducen en el resumen de liquidación del vendedor, no después por sorpresa.",
        "Servicios de valor añadido Studio, Learn y Logistics abren vías adicionales de ingresos para los vendedores.",
        "Las campañas controladas por el operador y los espacios patrocinados se mantienen auditables y no como caos autoservicio.",
      ],
    },
    trustTiers: {
      kicker: "Cobros según nivel de confianza",
      title: "Un mejor comportamiento acorta las retenciones.",
    },
    closing: {
      kicker: "¿Listo para postularte?",
      title: "La solicitud se abre en tu cuenta de HenryCo.",
      body: "Puedes guardar el borrador y volver — la tarificación visible aquí se aplica una vez completado el onboarding de vendedor.",
      primaryCta: "Postularme como vendedor",
      secondaryCta: "Estándares de confianza",
    },
  },
  trust: {
    metadata: {
      title: "Confianza y seguridad — HenryCo Marketplace",
      description:
        "La confianza define lo que puede hacer un vendedor, cómo se mueve el dinero y cómo responde la moderación. Niveles de vendedor, custodia, disputas y liberación de pagos dejan rastro en el servidor.",
    },
    hero: {
      kicker: "Confianza y seguridad",
      title: "Visible antes del pago. Aplicada después.",
      body: "La confianza rige lo que puede hacer un vendedor, cómo circula el dinero y cómo reacciona la moderación. Niveles de vendedor, riesgo del comprador, puntuación de anuncios, custodia, disputas y liberación de pagos dejan registro en el servidor.",
      pillars: [
        { label: "Movimiento de dinero", value: "En custodia, liberado tras controles" },
        { label: "Reseñas", value: "Registradas en servidor, rastreables en disputa" },
        { label: "Niveles", value: "Ganados, revocables" },
      ],
    },
    guardrails: {
      kicker: "Cuatro salvaguardas",
      items: [
        {
          title: "Pasaportes de confianza",
          body: "Cada tienda y producto expone el nivel de verificación, el SLA, la tasa de disputas, la preparación para el pago y la postura de cumplimiento.",
        },
        {
          title: "Control de custodia",
          body: "Los fondos del comprador los retiene HenryCo primero y solo se liberan al pago cuando la entrega y los controles de confianza están validados.",
        },
        {
          title: "Revisión antifraude",
          body: "Desvíos de pago fuera de la plataforma, medios duplicados, picos de publicación y patrones de pago de riesgo entran en la visibilidad de la cola.",
        },
        {
          title: "Pistas de auditoría",
          body: "Aprobaciones, rechazos, acciones de pago, decisiones de disputa y barridos automatizados quedan registrados en el servidor.",
        },
      ],
    },
    sellerLadder: {
      kicker: "Escala de confianza del vendedor",
      title: "Niveles ganados con el comportamiento, no comprados.",
    },
    policySurfaces: {
      kicker: "Superficies de políticas",
      title: "Los estándares a los que nos comprometemos.",
    },
    ecosystem: {
      kicker: "Refuerzo de confianza en el ecosistema",
    },
  },
  collections: {
    metadata: {
      titleTemplate: "{collection} — HenryCo Marketplace",
      descriptionTemplate:
        "Descubre {collection} en HenryCo Marketplace — una selección curada de productos verificados, con señales de confianza, claridad en la entrega y pasaportes de vendedor visibles antes del pago.",
      fallbackDescription:
        "Una colección curada en HenryCo Marketplace, con productos verificados, señales de confianza, entrega clara y pasaportes de vendedor visibles antes del pago.",
    },
    hero: {
      primaryCta: "Abrir búsqueda completa",
      secondaryCta: "Estándares de confianza",
    },
    sidebar: {
      itemsLabel: "Artículos de la colección",
      editedByLabel: "Editada por",
      editedByValue: "Operaciones del Marketplace",
      buyerProtectionLabel: "Protección al comprador",
      buyerProtectionValue: "Pago en custodia",
    },
    rail: {
      kicker: "Lo que trae la selección",
      itemsSuffix: "artículos",
    },
  },
};

const PT: DeepPartial<MarketplacePublicCopy> = {
  cart: {
    pageIntro: {
      kicker: "Carrinho",
      title: "Um carrinho premium com edições mais ágeis e clareza nas entregas divididas.",
      description:
        "O carrinho mantém o agrupamento por vendedor visível, atualiza quantidades rapidamente e permanece ligado à gaveta do mini-carrinho para que os compradores nunca percam o contexto perto da finalização.",
    },
    emptyState: {
      title: "O teu carrinho ainda está vazio.",
      body: "Adiciona rapidamente a partir dos cartões de produto, guarda itens para depois, e o carrinho mantém-se atualizado no mini-carrinho e no carrinho completo sem precisares de recarregar.",
      ctaLabel: "Explorar produtos",
    },
  },
  deals: {
    metadata: {
      title: "Ofertas verificadas — HenryCo Marketplace",
      description:
        "Descontos filtrados por confiança, certeza de stock e responsabilidade do vendedor. Na página de ofertas da HenryCo só aparecem anúncios verificados com sinais limpos.",
    },
    pageIntro: {
      kicker: "Ofertas verificadas",
      title: "Descontos filtrados por confiança, certeza de stock e responsabilidade do vendedor.",
      description:
        "Só destacamos ofertas quando a qualidade do anúncio, o passaporte de confiança do vendedor e o estado do stock estão limpos o suficiente para proteger a conversão e reduzir o arrependimento de quem compra.",
    },
    sectionLabel: "Ofertas verificadas",
    listEyebrow: "Ofertas verificadas",
    refreshNote: "Atualizadas com regularidade",
    discountBadgePrefix: "−",
    emptyState: {
      title: "Sem ofertas verificadas neste momento",
      body: "Os descontos verificados surgem à medida que os vendedores os publicam. Volta em breve.",
    },
  },
  brand: {
    eyebrow: "Marca",
    bodyFallback:
      "Uma loja verificada na HenryCo Marketplace, com sinais de confiança, clareza de entrega e passaporte do vendedor visíveis antes do pagamento.",
    searchCta: "Pesquisar nesta marca",
    trustCta: "Padrões de confiança",
    stats: {
      activeProducts: "Produtos ativos",
      listingsReviewed: "Anúncios revistos",
      listingsReviewedValue: "Passaporte de confiança visível por item",
      buyerProtection: "Proteção ao comprador",
      buyerProtectionValue: "Pagamento em custódia",
    },
    liveKicker: "Em direto de {brand}",
    openFullSearch: "Abrir pesquisa completa",
    metadataTitle: "{brand} — HenryCo Marketplace",
    metadataDescription:
      "Explora produtos verificados de {brand} na HenryCo Marketplace, com sinais de confiança, clareza de entrega e passaportes de vendedor visíveis antes do pagamento.",
  },
  category: {
    hero: {
      kicker: "Edição por categoria",
      searchCta: "Procurar nesta categoria",
      trustCta: "Rever padrões de confiança",
      quickFiltersLabel: "Filtros rápidos",
    },
    stats: {
      activeListingsLabel: "Anúncios ativos",
    },
    collectionsRail: {
      kicker: "Seleções curadas",
      title: "Coleções que encurtam a decisão de compra.",
    },
    catalog: {
      kicker: "Catálogo da categoria",
      title: "Produtos premium, hierarquia mais nítida.",
      openSearch: "Abrir pesquisa completa",
    },
    metadata: {
      titleTemplate: "{category} — HenryCo Marketplace",
      descriptionTemplate:
        "Explora produtos verificados em {category} na HenryCo Marketplace, com sinais de confiança, clareza de entrega e passaportes de vendedor visíveis antes do pagamento.",
      fallbackDescription:
        "Percorre uma categoria curada da HenryCo Marketplace com sinais de confiança, clareza de entrega e passaportes de vendedor antes do pagamento.",
    },
  },
  help: {
    metadata: {
      title: "Centro de ajuda — HenryCo Marketplace",
      description:
        "Consulta as dúvidas mais comuns de compradores e vendedores. Se não encontrares o que precisas, abre um pedido de apoio e alguém da equipa lê-o.",
    },
    hero: {
      kicker: "Centro de ajuda",
      title: "Encontra uma resposta em segundos — ou fala com uma pessoa.",
      body: "Pesquisa os temas que compradores e vendedores mais perguntam. Se não encontrares o que precisas, abre um pedido de apoio no fim desta página e alguém da equipa lê-o.",
    },
    stillNeedHelp: {
      kicker: "Continuas a precisar de ajuda",
      title: "Abre um pedido de apoio e uma pessoa lê-o.",
      body: "Os pedidos mantêm todo o contexto ligado — a encomenda, o vendedor, o histórico do litígio — para que a equipa trate do assunto sem precisares de reescrever a cada resposta.",
      ctaLabel: "Abrir um pedido de apoio",
    },
  },
  sell: {
    metadata: {
      title: "Vender na HenryCo — marketplace seletivo para vendedores de confiança",
      description:
        "Candidata-te para vender na HenryCo Marketplace: posicionamento de confiança, montras premium e um espaço unificado para encomendas, pagamentos e apoio.",
    },
    hero: {
      kicker: "Vender na HenryCo",
      title: "Seletiva por natureza. Pensada para vendedores que apostam na confiança.",
      body: "A HenryCo Marketplace prefere vendedores cuidadosos na apresentação, fiáveis no cumprimento e honestos na proteção ao comprador. O nível exigido fica explícito nesta página; a candidatura de vendedor continua dentro da tua conta HenryCo.",
      primaryCta: "Abrir candidatura de vendedor",
      secondaryCta: "Ver preços de vendedor",
      signInCta: "Iniciar sessão com a conta HenryCo",
      highlights: [
        { label: "Seleção", value: "Análise manual, sem listagem paga" },
        { label: "Montra", value: "Passaporte de confiança visível para compradores" },
        { label: "Espaço", value: "Encomendas, pagamentos e apoio unificados" },
      ],
    },
    advantages: {
      kicker: "Porque vencem aqui os vendedores mais fortes",
      items: [
        { title: "Posicionamento de confiança", body: "A tua loja recebe um passaporte de confiança visível, em vez de se perder no ruído de um marketplace de baixa qualidade." },
        { title: "Melhor qualidade de montra", body: "Carris editoriais, uma pesquisa mais calma e cartões de produto mais limpos ajudam lojas exigentes a converter melhor." },
        { title: "Operação mais nítida", body: "Pagamentos, encomendas, apoio, moderação e alertas de stock ficam visíveis num espaço de trabalho mais claro." },
      ],
    },
    onboarding: {
      kicker: "Como funciona o onboarding",
      stepLabel: "Passo",
      steps: [
        { step: "01", title: "Iniciar a candidatura de vendedor", body: "Abre a candidatura a partir da tua conta HenryCo — os rascunhos são guardados automaticamente enquanto reúnes os detalhes." },
        { step: "02", title: "Adicionar dados do negócio", body: "Nome da empresa, perfil da loja, foco de produto e quaisquer documentos de verificação que expliquem como cumpres encomendas." },
        { step: "03", title: "Análise da candidatura", body: "A equipa HenryCo analisa documentos, sinais de confiança e a robustez da loja — não apenas um emblema pago." },
        { step: "04", title: "Onboarding de vendedor", body: "Os vendedores aprovados seguem para o onboarding onde preços, taxas de publicação, janelas de pagamento e regras ficam visíveis antes de publicares." },
      ],
      callout: {
        eyebrow: "Uma candidatura de vendedor mais limpa",
        body: "O registo de vendedor mantém-se dentro da tua conta para que os dados do negócio, o estado da análise e as atualizações de aprovação fiquem privados e fáceis de seguir.",
      },
    },
    plans: {
      kicker: "Economia dos planos",
      title: "Patamares anunciados à partida, não depois de publicar.",
      feeLabel: "Comissão",
      payoutLabel: "Pagamento",
      includedLabel: "Incluído",
      includedSuffix: "anúncios",
      featuredLabel: "Em destaque",
      featuredCurrencyPrefix: "NGN",
    },
    trustTiers: {
      kicker: "Os patamares de confiança mudam os privilégios",
      title: "Conquista pagamentos mais rápidos, montras maiores e vantagens nas políticas.",
    },
    closing: {
      kicker: "Avançar",
      title: "Candidata-te e acompanha o estado a partir da tua conta.",
      body: "A aprovação desbloqueia o onboarding de vendedor. Preços, taxas de publicação e janelas de pagamento são visíveis antes de publicares — sem surpresas contratuais depois.",
      primaryCta: "Iniciar candidatura",
      secondaryCta: "Ir ao espaço de vendedor",
    },
  },
  sellPricing: {
    metadata: {
      title: "Preços para vendedores — HenryCo Marketplace",
      description:
        "Taxas de plano, taxas de publicação, taxas de destaque, comissão por transação e processamento de pagamento são todas declaradas à partida — antes de publicares inventário, não depois.",
    },
    hero: {
      kicker: "Preços para vendedores",
      title: "Economia clara. Sem taxas escondidas.",
      body: "Taxas de plano, taxas de publicação, taxas de destaque, comissão por transação e processamento de pagamento são todas declaradas à partida — antes de publicares o teu inventário, não depois.",
      primaryCta: "Candidatar como vendedor",
      secondaryCta: "Voltar à visão geral de vendedor",
      statsLabels: {
        planTiers: "Níveis de plano",
        trustTiers: "Níveis de confiança",
        featuredSlots: "Slots de destaque",
      },
      featuredSlotsValue: "Avaliados caso a caso",
    },
    plans: {
      kicker: "Planos em síntese",
      feeLabel: "Comissão",
      payoutLabel: "Pagamento",
      includedLabel: "Incluídos",
      includedSuffix: "anúncios",
      extraListingLabel: "Anúncio extra",
      featuredSlotLabel: "Slot de destaque",
      currencyPrefix: "NGN",
      ctaPartner: "Contactar para condições de parceiro",
      ctaTemplate: "Começar com {plan}",
    },
    economics: {
      kicker: "Como a HenryCo ganha dinheiro",
      title: "Declarado à partida, deduzido à vista.",
      items: [
        "As comissões por transação são deduzidas em cada liquidação do grupo-encomenda do vendedor antes da libertação do pagamento.",
        "As taxas de publicação aplicam-se depois de esgotada a quota de anúncios incluídos no plano ativo do vendedor.",
        "A colocação em destaque é um pedido pago à parte e fica sujeita a revisão de qualidade e confiança.",
        "As taxas de processamento de pagamento são deduzidas no resumo de liquidação do vendedor, não em surpresa depois.",
        "Os serviços de valor acrescentado Studio, Learn e Logistics abrem vias adicionais de receita para vendedores.",
        "As campanhas controladas pelo operador e os espaços patrocinados mantêm-se auditáveis e nunca em autosserviço caótico.",
      ],
    },
    trustTiers: {
      kicker: "Tempos de pagamento por nível de confiança",
      title: "Melhor comportamento encurta as retenções.",
    },
    closing: {
      kicker: "Pronto para te candidatares?",
      title: "A candidatura abre na tua conta HenryCo.",
      body: "Podes guardar o rascunho e voltar — a tarificação visível aqui aplica-se assim que o onboarding de vendedor estiver concluído.",
      primaryCta: "Candidatar como vendedor",
      secondaryCta: "Padrões de confiança",
    },
  },
  trust: {
    metadata: {
      title: "Confiança e segurança — HenryCo Marketplace",
      description:
        "A confiança define o que um vendedor pode fazer, como o dinheiro se move e como a moderação responde. Níveis de vendedor, custódia, disputas e libertação de pagamentos deixam rasto no servidor.",
    },
    hero: {
      kicker: "Confiança e segurança",
      title: "Visível antes do pagamento. Aplicada depois.",
      body: "A confiança rege o que um vendedor pode fazer, como o dinheiro circula e como a moderação responde. Níveis de vendedor, risco do comprador, pontuação de anúncios, custódia, disputas e libertação de pagamentos deixam registo no servidor.",
      pillars: [
        { label: "Movimento de dinheiro", value: "Em custódia, libertado após verificações" },
        { label: "Avaliações", value: "Registadas no servidor, rastreáveis em disputa" },
        { label: "Níveis", value: "Conquistados, revogáveis" },
      ],
    },
    guardrails: {
      kicker: "Quatro salvaguardas",
      items: [
        {
          title: "Passaportes de confiança",
          body: "Cada loja e produto mostra o nível de verificação, SLA, taxa de disputas, prontidão para pagamento e postura de cumprimento.",
        },
        {
          title: "Controlo da custódia",
          body: "Os fundos do comprador ficam primeiro retidos pela HenryCo e só são libertados após confirmação da entrega e das verificações de confiança.",
        },
        {
          title: "Revisão antifraude",
          body: "Desvios de pagamento fora da plataforma, mídias duplicadas, picos de publicação e padrões de pagamento de risco entram na visibilidade da fila.",
        },
        {
          title: "Trilhas de auditoria",
          body: "Aprovações, recusas, ações de pagamento, decisões de disputa e varreduras automatizadas ficam registadas no servidor.",
        },
      ],
    },
    sellerLadder: {
      kicker: "Escala de confiança do vendedor",
      title: "Níveis conquistados pelo comportamento, não comprados.",
    },
    policySurfaces: {
      kicker: "Superfícies das políticas",
      title: "Os padrões que assumimos.",
    },
    ecosystem: {
      kicker: "Reforço de confiança no ecossistema",
    },
  },
  collections: {
    metadata: {
      titleTemplate: "{collection} — HenryCo Marketplace",
      descriptionTemplate:
        "Explore {collection} no HenryCo Marketplace — uma seleção curada de produtos verificados, com sinais de confiança, entrega clara e passaportes de vendedor visíveis antes do checkout.",
      fallbackDescription:
        "Uma coleção curada no HenryCo Marketplace, com produtos verificados, sinais de confiança, entrega clara e passaportes de vendedor visíveis antes do checkout.",
    },
    hero: {
      primaryCta: "Abrir busca completa",
      secondaryCta: "Padrões de confiança",
    },
    sidebar: {
      itemsLabel: "Itens da coleção",
      editedByLabel: "Editada por",
      editedByValue: "Operações do Marketplace",
      buyerProtectionLabel: "Proteção ao comprador",
      buyerProtectionValue: "Pagamento sob custódia",
    },
    rail: {
      kicker: "O que está nesta seleção",
      itemsSuffix: "itens",
    },
  },
};

const DE: DeepPartial<MarketplacePublicCopy> = {
  cart: {
    pageIntro: {
      kicker: "Warenkorb",
      title: "Ein Premium-Warenkorb mit schnelleren Anpassungen und klarer Übersicht bei geteilten Bestellungen.",
      description:
        "Der Warenkorb hält die Händler-Gruppierung sichtbar, aktualisiert Mengen zügig und bleibt mit der Mini-Warenkorb-Schublade verbunden, damit Käufer:innen kurz vor dem Checkout den Überblick behalten.",
    },
    emptyState: {
      title: "Dein Warenkorb ist noch leer.",
      body: "Füge schnell aus den Produktkarten hinzu, merke dir Artikel für später, und der Warenkorb bleibt sowohl in der Mini-Schublade als auch in der Vollansicht aktuell – ganz ohne Reload.",
      ctaLabel: "Produkte entdecken",
    },
  },
  deals: {
    metadata: {
      title: "Geprüfte Angebote — HenryCo Marketplace",
      description:
        "Rabatte gefiltert nach Vertrauen, verlässlicher Bestandslage und Händlerverantwortung. Auf der HenryCo-Deals-Seite erscheinen nur verifizierte Listings mit sauberen Vertrauenssignalen.",
    },
    pageIntro: {
      kicker: "Geprüfte Angebote",
      title: "Rabatte gefiltert nach Vertrauen, verlässlicher Bestandslage und Händlerverantwortung.",
      description:
        "Angebote zeigen wir erst, wenn Listing-Qualität, Vertrauens-Passport des Händlers und Bestandsstatus sauber genug sind, um die Conversion zu schützen und Kaufreue zu vermeiden.",
    },
    sectionLabel: "Geprüfte Angebote",
    listEyebrow: "Geprüfte Angebote",
    refreshNote: "Regelmäßig aktualisiert",
    discountBadgePrefix: "−",
    emptyState: {
      title: "Aktuell keine geprüften Angebote",
      body: "Geprüfte Rabatte erscheinen, sobald Händler sie einstellen. Schau bald wieder vorbei.",
    },
  },
  brand: {
    eyebrow: "Marke",
    bodyFallback:
      "Ein verifizierter Shop auf HenryCo Marketplace mit Vertrauenssignalen, klarer Lieferübersicht und einsehbarem Händler-Passport schon vor dem Checkout.",
    searchCta: "In dieser Marke suchen",
    trustCta: "Vertrauensstandards",
    stats: {
      activeProducts: "Aktive Produkte",
      listingsReviewed: "Geprüfte Angebote",
      listingsReviewedValue: "Trust-Passport pro Artikel sichtbar",
      buyerProtection: "Käuferschutz",
      buyerProtectionValue: "Treuhand-Checkout",
    },
    liveKicker: "Live von {brand}",
    openFullSearch: "Volle Suche öffnen",
    metadataTitle: "{brand} — HenryCo Marketplace",
    metadataDescription:
      "Entdecke verifizierte Produkte von {brand} auf HenryCo Marketplace – mit Vertrauenssignalen, klarer Lieferübersicht und Händler-Passports vor dem Checkout.",
  },
  category: {
    hero: {
      kicker: "Kategorie-Edition",
      searchCta: "In dieser Kategorie suchen",
      trustCta: "Vertrauensstandards ansehen",
      quickFiltersLabel: "Schnellfilter",
    },
    stats: {
      activeListingsLabel: "Aktive Angebote",
    },
    collectionsRail: {
      kicker: "Kuratierte Auswahl",
      title: "Kollektionen, die Kaufentscheidungen verkürzen.",
    },
    catalog: {
      kicker: "Kategorie-Katalog",
      title: "Premium-Produkte, klarere Hierarchie.",
      openSearch: "Volle Suche öffnen",
    },
    metadata: {
      titleTemplate: "{category} — HenryCo Marketplace",
      descriptionTemplate:
        "Entdecke verifizierte Produkte in {category} auf HenryCo Marketplace – mit Vertrauenssignalen, klarer Lieferübersicht und Händler-Passports schon vor dem Checkout.",
      fallbackDescription:
        "Stöbere durch eine kuratierte Kategorie im HenryCo Marketplace mit Vertrauenssignalen, klarer Lieferübersicht und Händler-Passports vor dem Checkout.",
    },
  },
  help: {
    metadata: {
      title: "Hilfe-Center — HenryCo Marketplace",
      description:
        "Sieh dir die häufigsten Fragen von Käufer:innen und Verkäufer:innen an. Wenn du nicht fündig wirst, öffne ein Support-Ticket – ein Mensch aus dem Team liest es.",
    },
    hero: {
      kicker: "Hilfe-Center",
      title: "Finde in Sekunden eine Antwort – oder sprich mit einer Person.",
      body: "Such die Themen, die Käufer:innen und Verkäufer:innen am häufigsten stellen. Wenn du nicht fündig wirst, öffne unten auf der Seite ein Support-Ticket – ein Mensch aus dem Team liest es.",
    },
    stillNeedHelp: {
      kicker: "Brauchst du weiter Hilfe",
      title: "Öffne ein Support-Ticket – ein Mensch liest es.",
      body: "Tickets halten den vollen Kontext beisammen — Bestellung, Händler, Verlauf des Streitfalls — damit das Team die Sache bearbeitet, ohne dass du sie bei jeder Antwort neu tippst.",
      ctaLabel: "Support-Ticket öffnen",
    },
  },
  sell: {
    metadata: {
      title: "Auf HenryCo verkaufen — selektiver Marketplace für Vertrauens-Händler:innen",
      description:
        "Bewirb dich für den Verkauf auf HenryCo Marketplace: vertrauensorientierte Positionierung, Premium-Storefronts und ein einheitlicher Workspace für Bestellungen, Auszahlungen und Support.",
    },
    hero: {
      kicker: "Auf HenryCo verkaufen",
      title: "Selektiv von Grund auf. Gemacht für Händler:innen, die Vertrauen führen.",
      body: "HenryCo Marketplace bevorzugt Händler:innen, die auf Präsentation achten, verlässlich liefern und Käuferschutz ernst nehmen. Die Anforderungen sind auf dieser Seite klar; die Händler-Bewerbung läuft in deinem HenryCo-Konto weiter.",
      primaryCta: "Händler-Bewerbung öffnen",
      secondaryCta: "Händler-Preise ansehen",
      signInCta: "Mit HenryCo-Konto anmelden",
      highlights: [
        { label: "Auswahl", value: "Manuelle Prüfung statt Bezahllisting" },
        { label: "Storefront", value: "Trust-Passport für Käufer:innen sichtbar" },
        { label: "Workspace", value: "Bestellungen, Auszahlungen, Support vereint" },
      ],
    },
    advantages: {
      kicker: "Warum stärkere Händler:innen hier gewinnen",
      items: [
        { title: "Vertrauensorientierte Positionierung", body: "Dein Shop erhält einen sichtbaren Trust-Passport, statt im Rauschen eines Massen-Marketplaces unterzugehen." },
        { title: "Bessere Storefront-Qualität", body: "Editoriale Schienen, eine ruhigere Suche und sauberere Produktkarten helfen anspruchsvollen Shops, besser zu konvertieren." },
        { title: "Klarere Operations", body: "Auszahlungen, Bestellungen, Support, Moderation und Bestandsalarme bleiben in einem klareren Workspace sichtbar." },
      ],
    },
    onboarding: {
      kicker: "So läuft das Onboarding",
      stepLabel: "Schritt",
      steps: [
        { step: "01", title: "Händler-Bewerbung starten", body: "Öffne die Bewerbung aus deinem HenryCo-Konto heraus — Entwürfe werden automatisch gespeichert, während du die Details zusammenstellst." },
        { step: "02", title: "Geschäftsdaten ergänzen", body: "Firmenname, Shop-Profil, Produkt-Fokus und alle Verifizierungsdokumente, die zeigen, wie du Bestellungen erfüllst." },
        { step: "03", title: "Prüfung der Bewerbung", body: "Das HenryCo-Team prüft Dokumente, Vertrauenssignale und Shop-Reife — nicht nur ein bezahltes Abzeichen." },
        { step: "04", title: "Vendor-Onboarding", body: "Freigegebene Händler:innen gehen ins Vendor-Onboarding, wo Preise, Listing-Gebühren, Auszahlungsfenster und Richtlinien vor der Veröffentlichung sichtbar bleiben." },
      ],
      callout: {
        eyebrow: "Eine sauberere Händler-Bewerbung",
        body: "Die Händler-Registrierung bleibt in deinem Konto, damit Geschäftsdaten, Prüfstatus und Freigabe-Updates privat und leicht nachvollziehbar bleiben.",
      },
    },
    plans: {
      kicker: "Plan-Ökonomie",
      title: "Stufen vorab benannt, nicht erst nach der Veröffentlichung.",
      feeLabel: "Gebühr",
      payoutLabel: "Auszahlung",
      includedLabel: "Inklusive",
      includedSuffix: "Inserate",
      featuredLabel: "Hervorgehoben",
      featuredCurrencyPrefix: "NGN",
    },
    trustTiers: {
      kicker: "Trust-Stufen verändern Privilegien",
      title: "Hol dir schnellere Auszahlungen, größere Storefronts und Richtlinien-Vorteile.",
    },
    closing: {
      kicker: "Weitergehen",
      title: "Bewirb dich und verfolge den Status aus deinem Konto.",
      body: "Mit der Freigabe öffnet sich das Vendor-Onboarding. Preise, Listing-Gebühren und Auszahlungsfenster sind vor der Veröffentlichung sichtbar — keine vertraglichen Überraschungen später.",
      primaryCta: "Bewerbung starten",
      secondaryCta: "Zum Vendor-Workspace",
    },
  },
  sellPricing: {
    metadata: {
      title: "Verkäuferpreise — HenryCo Marketplace",
      description:
        "Plangebühren, Listing-Gebühren, Gebühren für Featured-Slots, Transaktionsprovision und Auszahlungsabwicklung werden alle vorab ausgewiesen — vor der Veröffentlichung deines Bestands, nicht danach.",
    },
    hero: {
      kicker: "Verkäuferpreise",
      title: "Klare Ökonomie. Keine versteckten Gebühren.",
      body: "Plangebühren, Listing-Gebühren, Gebühren für Featured-Slots, Transaktionsprovision und Auszahlungsabwicklung werden alle vorab ausgewiesen — bevor du Bestand veröffentlichst, nicht danach.",
      primaryCta: "Als Verkäufer bewerben",
      secondaryCta: "Zurück zur Verkäuferübersicht",
      statsLabels: {
        planTiers: "Plan-Stufen",
        trustTiers: "Vertrauensstufen",
        featuredSlots: "Featured-Slots",
      },
      featuredSlotsValue: "Einzelfallprüfung",
    },
    plans: {
      kicker: "Pläne im Überblick",
      feeLabel: "Provision",
      payoutLabel: "Auszahlung",
      includedLabel: "Inklusive",
      includedSuffix: "Inserate",
      extraListingLabel: "Zusätzliches Inserat",
      featuredSlotLabel: "Featured-Slot",
      currencyPrefix: "NGN",
      ctaPartner: "Für Partnerkonditionen Kontakt aufnehmen",
      ctaTemplate: "Mit {plan} starten",
    },
    economics: {
      kicker: "Wie HenryCo Geld verdient",
      title: "Vorab ausgewiesen, offen abgezogen.",
      items: [
        "Transaktionsprovisionen werden bei jeder Vendor-Bestellgruppen-Abrechnung vor der Auszahlung abgezogen.",
        "Listing-Gebühren fallen an, sobald das im aktiven Plan enthaltene Inserate-Kontingent ausgeschöpft ist.",
        "Featured-Platzierung ist eine separate kostenpflichtige Anfrage und unterliegt einer Qualitäts- und Vertrauensprüfung.",
        "Bearbeitungsgebühren für Auszahlungen werden im Verkäufer-Abrechnungsbeleg abgezogen, nicht später als Überraschung.",
        "Mehrwertdienste von Studio, Learn und Logistics schaffen zusätzliche Ertragspfade für Verkäufer.",
        "Vom Operator gesteuerte Kampagnen und gesponserte Slots bleiben auditierbar und sind kein Self-Service-Chaos.",
      ],
    },
    trustTiers: {
      kicker: "Auszahlungstakt nach Vertrauensstufe",
      title: "Besseres Verhalten verkürzt die Haltefrist.",
    },
    closing: {
      kicker: "Bereit für die Bewerbung?",
      title: "Die Bewerbung öffnet sich in deinem HenryCo-Konto.",
      body: "Du kannst den Entwurf speichern und zurückkehren — die hier sichtbare Preisgestaltung gilt, sobald das Vendor-Onboarding abgeschlossen ist.",
      primaryCta: "Als Verkäufer bewerben",
      secondaryCta: "Vertrauensstandards",
    },
  },
  trust: {
    metadata: {
      title: "Vertrauen & Sicherheit — HenryCo Marketplace",
      description:
        "Vertrauen bestimmt, was ein Verkäufer darf, wie Geld fließt und wie die Moderation reagiert. Verkäuferstufen, Treuhand, Streitfälle und Auszahlungsfreigaben hinterlassen einen serverseitigen Audit-Trail.",
    },
    hero: {
      kicker: "Vertrauen & Sicherheit",
      title: "Sichtbar vor dem Checkout. Durchgesetzt danach.",
      body: "Vertrauen steuert, was ein Verkäufer tun darf, wie Geld fließt und wie die Moderation reagiert. Verkäuferstufen, Käufer-Risiko, Listing-Bewertung, Treuhand, Streitfälle und Auszahlungsfreigaben hinterlassen alle eine serverseitige Spur.",
      pillars: [
        { label: "Geldfluss", value: "Treuhand, Freigabe nach Prüfung" },
        { label: "Bewertungen", value: "Serverseitig protokolliert, in Disputen nachvollziehbar" },
        { label: "Stufen", value: "Verdient, widerrufbar" },
      ],
    },
    guardrails: {
      kicker: "Vier Leitplanken",
      items: [
        {
          title: "Vertrauens-Passports",
          body: "Jeder Shop und jedes Produkt zeigt Verifizierungsstufe, SLA, Streitquote, Auszahlungsstatus und Versandbereitschaft.",
        },
        {
          title: "Treuhand-Kontrolle",
          body: "Käufergelder werden zuerst von HenryCo gehalten und erst nach Lieferung und Vertrauensprüfung zur Auszahlung freigegeben.",
        },
        {
          title: "Anti-Betrugs-Prüfung",
          body: "Zahlungs-Umlenkungen außerhalb der Plattform, doppelte Medien, Listing-Spitzen und riskante Auszahlungsmuster werden in der Queue sichtbar gemacht.",
        },
        {
          title: "Audit-Trails",
          body: "Freigaben, Ablehnungen, Auszahlungsaktionen, Streitentscheidungen und Automations-Durchläufe werden serverseitig protokolliert.",
        },
      ],
    },
    sellerLadder: {
      kicker: "Verkäufer-Vertrauensleiter",
      title: "Stufen, die durch Verhalten verdient, nicht gekauft werden.",
    },
    policySurfaces: {
      kicker: "Richtlinien-Oberflächen",
      title: "Die Standards, an die wir uns selbst halten.",
    },
    ecosystem: {
      kicker: "Vertrauensverstärkung im Ökosystem",
    },
  },
  collections: {
    metadata: {
      titleTemplate: "{collection} — HenryCo Marketplace",
      descriptionTemplate:
        "Entdecken Sie {collection} auf dem HenryCo Marketplace — eine kuratierte Auswahl geprüfter Produkte mit Vertrauenssignalen, klaren Lieferinformationen und Verkäuferpässen vor dem Checkout.",
      fallbackDescription:
        "Eine kuratierte Kollektion auf dem HenryCo Marketplace mit geprüften Produkten, Vertrauenssignalen, klarer Lieferung und sichtbaren Verkäuferpässen vor dem Checkout.",
    },
    hero: {
      primaryCta: "Vollständige Suche öffnen",
      secondaryCta: "Vertrauensstandards",
    },
    sidebar: {
      itemsLabel: "Artikel in der Kollektion",
      editedByLabel: "Kuratiert von",
      editedByValue: "Marketplace-Operations",
      buyerProtectionLabel: "Käuferschutz",
      buyerProtectionValue: "Treuhand-Checkout",
    },
    rail: {
      kicker: "In dieser Auswahl",
      itemsSuffix: "Artikel",
    },
  },
};

const IT: DeepPartial<MarketplacePublicCopy> = {
  cart: {
    pageIntro: {
      kicker: "Carrello",
      title: "Un carrello premium con modifiche più rapide e maggiore chiarezza sugli ordini divisi.",
      description:
        "Il carrello mantiene visibile il raggruppamento per venditore, aggiorna le quantità in modo fluido e resta collegato al cassetto del mini-carrello, così chi compra non perde il contesto quando è vicino al checkout.",
    },
    emptyState: {
      title: "Il tuo carrello è ancora vuoto.",
      body: "Aggiungi al volo dalle schede prodotto, salva articoli per dopo, e il carrello resta aggiornato sia nel mini-carrello sia nella vista completa, senza ricaricare la pagina.",
      ctaLabel: "Esplora i prodotti",
    },
  },
  deals: {
    metadata: {
      title: "Offerte verificate — HenryCo Marketplace",
      description:
        "Sconti filtrati per affidabilità, disponibilità reale di magazzino e responsabilità del venditore. Nella pagina offerte di HenryCo appaiono solo annunci verificati con segnali puliti.",
    },
    pageIntro: {
      kicker: "Offerte verificate",
      title: "Sconti filtrati per affidabilità, disponibilità di magazzino e responsabilità del venditore.",
      description:
        "Mettiamo in evidenza le offerte solo quando qualità dell’annuncio, passaporto di fiducia del venditore e stato delle scorte sono abbastanza puliti da proteggere la conversione e ridurre il rimpianto di chi compra.",
    },
    sectionLabel: "Offerte verificate",
    listEyebrow: "Offerte verificate",
    refreshNote: "Aggiornate regolarmente",
    discountBadgePrefix: "−",
    emptyState: {
      title: "Nessuna offerta verificata in questo momento",
      body: "Gli sconti verificati arrivano man mano che i venditori li pubblicano. Torna a dare un’occhiata.",
    },
  },
  brand: {
    eyebrow: "Marchio",
    bodyFallback:
      "Un negozio verificato su HenryCo Marketplace, con segnali di affidabilità, chiarezza sulla consegna e passaporto del venditore visibili prima del pagamento.",
    searchCta: "Cerca in questo marchio",
    trustCta: "Standard di fiducia",
    stats: {
      activeProducts: "Prodotti attivi",
      listingsReviewed: "Annunci verificati",
      listingsReviewedValue: "Trust Passport visibile per ogni articolo",
      buyerProtection: "Protezione acquirente",
      buyerProtectionValue: "Pagamento in deposito",
    },
    liveKicker: "In diretta da {brand}",
    openFullSearch: "Apri la ricerca completa",
    metadataTitle: "{brand} — HenryCo Marketplace",
    metadataDescription:
      "Esplora i prodotti verificati di {brand} su HenryCo Marketplace, con segnali di affidabilità, chiarezza sulla consegna e passaporti dei venditori visibili prima del pagamento.",
  },
  category: {
    hero: {
      kicker: "Edizione di categoria",
      searchCta: "Cerca in questa categoria",
      trustCta: "Rivedi gli standard di fiducia",
      quickFiltersLabel: "Filtri rapidi",
    },
    stats: {
      activeListingsLabel: "Annunci attivi",
    },
    collectionsRail: {
      kicker: "Selezioni curate",
      title: "Collezioni che accorciano la decisione d’acquisto.",
    },
    catalog: {
      kicker: "Catalogo della categoria",
      title: "Prodotti premium, gerarchia più nitida.",
      openSearch: "Apri ricerca completa",
    },
    metadata: {
      titleTemplate: "{category} — HenryCo Marketplace",
      descriptionTemplate:
        "Esplora prodotti verificati in {category} su HenryCo Marketplace, con segnali di fiducia, chiarezza sulla consegna e passaporti venditore visibili prima del pagamento.",
      fallbackDescription:
        "Sfoglia una categoria curata di HenryCo Marketplace con segnali di fiducia, chiarezza sulla consegna e passaporti venditore prima del pagamento.",
    },
  },
  help: {
    metadata: {
      title: "Centro assistenza — HenryCo Marketplace",
      description:
        "Sfoglia le domande più frequenti di chi compra e di chi vende. Se non trovi quello che cerchi, apri un ticket di assistenza e una persona del team lo leggerà.",
    },
    hero: {
      kicker: "Centro assistenza",
      title: "Trova una risposta in pochi secondi — o parla con una persona.",
      body: "Cerca i temi che acquirenti e venditori chiedono più spesso. Se non trovi quello che ti serve, apri un ticket in fondo a questa pagina e una persona del team lo leggerà.",
    },
    stillNeedHelp: {
      kicker: "Serve ancora aiuto",
      title: "Apri un ticket di assistenza e una persona lo leggerà.",
      body: "I ticket mantengono tutto il contesto allegato — l’ordine, il venditore, lo storico della disputa — così il team lavora al caso senza che tu debba riscrivere tutto a ogni risposta.",
      ctaLabel: "Apri un ticket di assistenza",
    },
  },
  sell: {
    metadata: {
      title: "Vendere su HenryCo — marketplace selettivo per venditori di fiducia",
      description:
        "Candidati per vendere su HenryCo Marketplace: posizionamento fondato sulla fiducia, vetrine premium e uno spazio unico per ordini, pagamenti e supporto.",
    },
    hero: {
      kicker: "Vendere su HenryCo",
      title: "Selettivo per scelta. Pensato per venditori che mettono la fiducia al primo posto.",
      body: "HenryCo Marketplace privilegia venditori attenti alla presentazione, affidabili nelle consegne e onesti sulla protezione dell’acquirente. Il livello richiesto è esplicitato qui; la candidatura venditore prosegue dentro il tuo account HenryCo.",
      primaryCta: "Apri candidatura venditore",
      secondaryCta: "Vedi i prezzi venditore",
      signInCta: "Accedi con account HenryCo",
      highlights: [
        { label: "Selezione", value: "Revisione manuale, non listing a pagamento" },
        { label: "Vetrina", value: "Passaporto di fiducia visibile agli acquirenti" },
        { label: "Spazio", value: "Ordini, pagamenti e supporto in un solo posto" },
      ],
    },
    advantages: {
      kicker: "Perché qui vincono i venditori più solidi",
      items: [
        { title: "Posizionamento basato sulla fiducia", body: "Il tuo store riceve un passaporto di fiducia visibile, invece di perdersi nel rumore di un marketplace di bassa qualità." },
        { title: "Vetrine di qualità migliore", body: "Carrelli editoriali, una ricerca più calma e schede prodotto più pulite aiutano gli store esigenti a convertire meglio." },
        { title: "Operatività più nitida", body: "Pagamenti, ordini, supporto, moderazione e avvisi di stock restano visibili in uno spazio di lavoro più chiaro." },
      ],
    },
    onboarding: {
      kicker: "Come funziona l’onboarding",
      stepLabel: "Passo",
      steps: [
        { step: "01", title: "Avviare la candidatura venditore", body: "Apri la candidatura dal tuo account HenryCo — le bozze si salvano automaticamente mentre raccogli i dettagli." },
        { step: "02", title: "Aggiungere i dati aziendali", body: "Ragione sociale, profilo store, focus prodotto e ogni documento di verifica che spiega come gestisci gli ordini." },
        { step: "03", title: "Revisione della candidatura", body: "Il team HenryCo esamina documenti, segnali di fiducia e maturità dello store — non solo un badge a pagamento." },
        { step: "04", title: "Onboarding venditore", body: "I venditori approvati proseguono con l’onboarding, dove prezzi, commissioni di pubblicazione, finestre di pagamento e regole sono visibili prima della pubblicazione." },
      ],
      callout: {
        eyebrow: "Una candidatura venditore più pulita",
        body: "La registrazione venditore resta dentro il tuo account, così dati aziendali, stato della revisione e aggiornamenti di approvazione rimangono privati e facili da seguire.",
      },
    },
    plans: {
      kicker: "Economia dei piani",
      title: "Livelli dichiarati in anticipo, non dopo la pubblicazione.",
      feeLabel: "Commissione",
      payoutLabel: "Pagamento",
      includedLabel: "Inclusi",
      includedSuffix: "annunci",
      featuredLabel: "In evidenza",
      featuredCurrencyPrefix: "NGN",
    },
    trustTiers: {
      kicker: "I livelli di fiducia cambiano i privilegi",
      title: "Ottieni pagamenti più rapidi, vetrine più ampie e vantaggi sulle policy.",
    },
    closing: {
      kicker: "Andare avanti",
      title: "Candidati e segui lo stato dal tuo account.",
      body: "L’approvazione sblocca l’onboarding venditore. Prezzi, commissioni di pubblicazione e finestre di pagamento sono visibili prima di pubblicare — niente sorprese contrattuali dopo.",
      primaryCta: "Avvia candidatura",
      secondaryCta: "Vai allo spazio venditore",
    },
  },
  sellPricing: {
    metadata: {
      title: "Prezzi per venditori — HenryCo Marketplace",
      description:
        "Commissioni di piano, commissioni di pubblicazione, commissioni dei posti in evidenza, commissione di transazione e processamento dei pagamenti sono tutte dichiarate in anticipo — prima di pubblicare l’inventario, non dopo.",
    },
    hero: {
      kicker: "Prezzi per venditori",
      title: "Economia chiara. Nessuna commissione nascosta.",
      body: "Commissioni di piano, commissioni di pubblicazione, posti in evidenza, commissione di transazione e processamento dei pagamenti sono tutte dichiarate in anticipo — prima di pubblicare l’inventario, non dopo.",
      primaryCta: "Candidati come venditore",
      secondaryCta: "Torna alla panoramica venditore",
      statsLabels: {
        planTiers: "Livelli di piano",
        trustTiers: "Livelli di fiducia",
        featuredSlots: "Posti in evidenza",
      },
      featuredSlotsValue: "Valutati caso per caso",
    },
    plans: {
      kicker: "Piani in sintesi",
      feeLabel: "Commissione",
      payoutLabel: "Pagamento",
      includedLabel: "Inclusi",
      includedSuffix: "annunci",
      extraListingLabel: "Annuncio aggiuntivo",
      featuredSlotLabel: "Posto in evidenza",
      currencyPrefix: "NGN",
      ctaPartner: "Contattaci per condizioni partner",
      ctaTemplate: "Inizia con {plan}",
    },
    economics: {
      kicker: "Come HenryCo guadagna",
      title: "Dichiarato in anticipo, dedotto a vista.",
      items: [
        "Le commissioni di transazione vengono dedotte da ogni liquidazione del gruppo-ordine venditore prima del rilascio del pagamento.",
        "Le commissioni di pubblicazione si applicano una volta esaurita la quota di annunci inclusi nel piano attivo del venditore.",
        "L’evidenza è una richiesta a pagamento separata e resta soggetta a controllo qualità e fiducia.",
        "Le commissioni di processamento del pagamento sono dedotte nel riepilogo di liquidazione del venditore, non in sorpresa più tardi.",
        "I servizi a valore aggiunto Studio, Learn e Logistics creano nuove direttrici di ricavo per i venditori.",
        "Le campagne governate dall’operatore e gli slot sponsorizzati restano tracciabili e mai in self-service caotico.",
      ],
    },
    trustTiers: {
      kicker: "Tempistiche di pagamento per livello di fiducia",
      title: "Un comportamento migliore accorcia le trattenute.",
    },
    closing: {
      kicker: "Pronto a candidarti?",
      title: "La candidatura si apre nel tuo account HenryCo.",
      body: "Puoi salvare la bozza e tornare — i prezzi visibili qui si applicano una volta completato l’onboarding venditore.",
      primaryCta: "Candidati come venditore",
      secondaryCta: "Standard di fiducia",
    },
  },
  trust: {
    metadata: {
      title: "Affidabilità e sicurezza — HenryCo Marketplace",
      description:
        "La fiducia regola cosa può fare un venditore, come si muove il denaro e come reagisce la moderazione. Livelli del venditore, deposito, dispute e rilascio dei pagamenti lasciano una traccia lato server.",
    },
    hero: {
      kicker: "Affidabilità e sicurezza",
      title: "Visibile prima del checkout. Applicata dopo.",
      body: "La fiducia governa cosa può fare un venditore, come si muove il denaro e come reagisce la moderazione. Livelli del venditore, rischio dell’acquirente, punteggio degli annunci, deposito, dispute e rilascio dei pagamenti lasciano tutti una traccia lato server.",
      pillars: [
        { label: "Movimenti di denaro", value: "In deposito, rilasciati dopo i controlli" },
        { label: "Recensioni", value: "Registrate lato server, tracciabili nelle dispute" },
        { label: "Livelli", value: "Guadagnati, revocabili" },
      ],
    },
    guardrails: {
      kicker: "Quattro garanzie",
      items: [
        {
          title: "Trust Passport",
          body: "Ogni negozio e prodotto mostra livello di verifica, SLA, tasso di dispute, prontezza al pagamento e postura di evasione.",
        },
        {
          title: "Controllo del deposito",
          body: "I fondi dell’acquirente vengono prima trattenuti da HenryCo e poi spostati in pagamento rilasciabile solo dopo consegna e controlli di fiducia superati.",
        },
        {
          title: "Revisione antifrode",
          body: "Deviazioni di pagamento fuori piattaforma, media duplicati, picchi di pubblicazione e schemi di pagamento rischiosi finiscono nella visibilità delle code di revisione.",
        },
        {
          title: "Tracciati di audit",
          body: "Approvazioni, rifiuti, azioni di pagamento, decisioni sulle dispute e passaggi automatici sono registrati lato server.",
        },
      ],
    },
    sellerLadder: {
      kicker: "Scala di fiducia del venditore",
      title: "Livelli guadagnati con il comportamento, non comprati.",
    },
    policySurfaces: {
      kicker: "Superfici delle politiche",
      title: "Gli standard che ci imponiamo.",
    },
    ecosystem: {
      kicker: "Rafforzamento della fiducia nell’ecosistema",
    },
  },
  collections: {
    metadata: {
      titleTemplate: "{collection} — HenryCo Marketplace",
      descriptionTemplate:
        "Esplora {collection} su HenryCo Marketplace — una selezione curata di prodotti verificati, con segnali di fiducia, chiarezza nella consegna e passaporti venditore visibili prima del checkout.",
      fallbackDescription:
        "Una collezione curata su HenryCo Marketplace, con prodotti verificati, segnali di fiducia, consegna chiara e passaporti venditore visibili prima del checkout.",
    },
    hero: {
      primaryCta: "Apri ricerca completa",
      secondaryCta: "Standard di fiducia",
    },
    sidebar: {
      itemsLabel: "Articoli nella collezione",
      editedByLabel: "Curata da",
      editedByValue: "Operations del Marketplace",
      buyerProtectionLabel: "Protezione acquirente",
      buyerProtectionValue: "Checkout in deposito a garanzia",
    },
    rail: {
      kicker: "Cosa contiene la selezione",
      itemsSuffix: "articoli",
    },
  },
};

const AR: DeepPartial<MarketplacePublicCopy> = {
  cart: {
    pageIntro: {
      kicker: "السلة",
      title: "سلة بمستوى رفيع، تعديلات أسرع، ووضوح أعلى للطلبات المقسّمة بين أكثر من بائع.",
      description:
        "تُبقي السلة تجميع البائعين ظاهرًا، وتُحدّث الكميات بسرعة، وتظل متصلة بدُرج السلة المصغّر، حتى لا يفقد المشتري السياق وهو يقترب من إتمام الطلب.",
    },
    emptyState: {
      title: "سلتك ما زالت فارغة.",
      body: "أضِف بسرعة من بطاقات المنتجات، واحفظ ما تودّ لاحقًا، وستبقى السلة محدّثة في الدُرج المصغّر وفي السلة الكاملة دون الحاجة إلى إعادة تحميل الصفحة.",
      ctaLabel: "تصفّح المنتجات",
    },
  },
  deals: {
    metadata: {
      title: "عروض موثّقة — HenryCo Marketplace",
      description:
        "تخفيضات مفلترة وفق الثقة، ووضوح توافر المخزون، ومسؤولية البائع. على صفحة العروض في HenryCo لا تظهر سوى المنتجات الموثّقة التي تحمل إشارات ثقة نظيفة.",
    },
    pageIntro: {
      kicker: "عروض موثّقة",
      title: "تخفيضات مفلترة وفق الثقة، ووضوح توافر المخزون، ومسؤولية البائع.",
      description:
        "لا نُبرز العرض إلا عندما تكون جودة الإعلان، وجواز ثقة البائع، وحالة المخزون نظيفة بما يكفي لحماية إتمام الشراء وتقليل الندم بعد الطلب.",
    },
    sectionLabel: "عروض موثّقة",
    listEyebrow: "عروض موثّقة",
    refreshNote: "تُحدَّث بانتظام",
    discountBadgePrefix: "−",
    emptyState: {
      title: "لا توجد عروض موثّقة الآن",
      body: "تظهر التخفيضات الموثّقة عندما يُدرجها البائعون. تابِعنا قريبًا.",
    },
  },
  brand: {
    eyebrow: "العلامة التجارية",
    bodyFallback:
      "متجر موثّق على HenryCo Marketplace، تظهر فيه إشارات الثقة، ووضوح التوصيل، وجواز سفر البائع قبل إتمام الدفع.",
    searchCta: "ابحث داخل هذه العلامة",
    trustCta: "معايير الثقة",
    stats: {
      activeProducts: "منتجات نشطة",
      listingsReviewed: "إعلانات تمّت مراجعتها",
      listingsReviewedValue: "جواز ثقة ظاهر لكل منتج",
      buyerProtection: "حماية المشتري",
      buyerProtectionValue: "دفع عبر حساب وسيط",
    },
    liveKicker: "مباشر من {brand}",
    openFullSearch: "فتح البحث الكامل",
    metadataTitle: "{brand} — HenryCo Marketplace",
    metadataDescription:
      "استكشف المنتجات الموثّقة من {brand} على HenryCo Marketplace، مع إشارات الثقة، ووضوح التوصيل، وجوازات البائعين قبل إتمام الدفع.",
  },
  category: {
    hero: {
      kicker: "تشكيلة الفئة",
      searchCta: "ابحث ضمن هذه الفئة",
      trustCta: "اطّلع على معايير الثقة",
      quickFiltersLabel: "فلاتر سريعة",
    },
    stats: {
      activeListingsLabel: "إعلانات نشطة",
    },
    collectionsRail: {
      kicker: "مجموعات منتقاة",
      title: "مجموعات تختصر قرار الشراء.",
    },
    catalog: {
      kicker: "كتالوج الفئة",
      title: "منتجات فاخرة، تسلسل أكثر وضوحًا.",
      openSearch: "افتح البحث الكامل",
    },
    metadata: {
      titleTemplate: "{category} — HenryCo Marketplace",
      descriptionTemplate:
        "استكشف منتجات موثّقة ضمن {category} على HenryCo Marketplace، مع إشارات ثقة، ووضوح في التوصيل، وجوازات بائعين ظاهرة قبل الدفع.",
      fallbackDescription:
        "تصفّح فئة منتقاة على HenryCo Marketplace مع إشارات ثقة، ووضوح في التوصيل، وجوازات بائعين قبل الدفع.",
    },
  },
  help: {
    metadata: {
      title: "مركز المساعدة — HenryCo Marketplace",
      description:
        "تصفّح الأسئلة الأكثر تكرارًا بين المشترين والبائعين. إن لم تجد ما تبحث عنه، افتح تذكرة دعم وسيقرؤها شخص من الفريق.",
    },
    hero: {
      kicker: "مركز المساعدة",
      title: "اعثر على إجابة في ثوانٍ — أو تحدّث مع شخص حقيقي.",
      body: "ابحث في المواضيع التي يطرحها المشترون والبائعون أكثر من غيرها. إن لم تجد ما تحتاج إليه، افتح تذكرة دعم من أسفل هذه الصفحة وسيقرؤها شخص من الفريق.",
    },
    stillNeedHelp: {
      kicker: "ما زلت تحتاج إلى المساعدة",
      title: "افتح تذكرة دعم وسيقرؤها شخص حقيقي.",
      body: "تحتفظ التذاكر بكامل السياق — الطلب، البائع، سجل النزاع — حتى يعمل الفريق على القضية دون أن تعيد كتابتها مع كل رد.",
      ctaLabel: "افتح تذكرة دعم",
    },
  },
  sell: {
    metadata: {
      title: "بِع على HenryCo — سوق انتقائي للبائعين الذين يقودون بالثقة",
      description:
        "قدِّم طلبًا للبيع على HenryCo Marketplace: تموضع يقوده مبدأ الثقة، واجهات متاجر فاخرة، ومساحة عمل موحَّدة للطلبات والمدفوعات والدعم.",
    },
    hero: {
      kicker: "بِع على HenryCo",
      title: "انتقائيٌّ بطبيعته. مصمَّم للبائعين الذين يقودون بالثقة.",
      body: "تُفضّل HenryCo Marketplace البائعين الذين يهتمّون بالعرض، ويُنفّذون الطلبات بموثوقية، ويحترمون حماية المشتري بصدق. تجد المعايير صريحةً في هذه الصفحة، ثم يستمرّ طلب البيع داخل حساب HenryCo الخاص بك.",
      primaryCta: "فتح طلب البيع",
      secondaryCta: "الاطّلاع على أسعار البائعين",
      signInCta: "تسجيل الدخول بحساب HenryCo",
      highlights: [
        { label: "الانتقاء", value: "مراجعة يدوية، لا إدراج مدفوع" },
        { label: "الواجهة", value: "جواز ثقة ظاهر للمشترين" },
        { label: "المساحة", value: "طلبات ومدفوعات ودعم في مكان واحد" },
      ],
    },
    advantages: {
      kicker: "لماذا ينجح البائعون الأقوى هنا",
      items: [
        { title: "تموضع يقوده مبدأ الثقة", body: "يحصل متجرك على جواز ثقة ظاهر، بدل أن يضيع في ضوضاء سوق منخفض الجودة." },
        { title: "جودة أعلى لواجهة المتجر", body: "ممرّات تحريرية، وبحث أهدأ، وبطاقات منتج أنظف، تساعد المتاجر الجادّة على تحقيق تحويل أفضل." },
        { title: "تشغيل أكثر وضوحًا", body: "المدفوعات والطلبات والدعم والمراقبة وتنبيهات المخزون تبقى ظاهرة في مساحة عمل واحدة أوضح." },
      ],
    },
    onboarding: {
      kicker: "كيف يسير الانضمام",
      stepLabel: "خطوة",
      steps: [
        { step: "01", title: "بدء طلب البيع", body: "افتح الطلب من داخل حساب HenryCo — تُحفَظ المسوّدات تلقائيًا أثناء تجميع التفاصيل." },
        { step: "02", title: "إضافة بيانات النشاط", body: "اسم النشاط، ملف المتجر، تركيز المنتجات، وأي مستندات تحقُّق توضّح كيف تُلبّي الطلبات." },
        { step: "03", title: "مراجعة الطلب", body: "يراجع فريق HenryCo المستندات وإشارات الثقة وجاهزية المتجر — لا مجرد شارة مدفوعة." },
        { step: "04", title: "انضمام البائع", body: "يواصل البائعون الموافَق عليهم خطوات الانضمام، حيث تظهر الأسعار ورسوم النشر ونوافذ التحويل وقواعد السياسات قبل النشر." },
      ],
      callout: {
        eyebrow: "طلب بيع أوضح",
        body: "يبقى تسجيل البائع داخل حسابك، فتظلّ بيانات النشاط وحالة المراجعة وتحديثات الموافقة خاصّة وسهلة المتابعة.",
      },
    },
    plans: {
      kicker: "اقتصاديات الخطط",
      title: "المستويات معروفة مسبقًا، لا بعد النشر.",
      feeLabel: "العمولة",
      payoutLabel: "التحويل",
      includedLabel: "المتضمَّن",
      includedSuffix: "إعلانًا",
      featuredLabel: "إبراز",
      featuredCurrencyPrefix: "NGN",
    },
    trustTiers: {
      kicker: "مستويات الثقة تغيّر الامتيازات",
      title: "احصل على تحويلات أسرع، وواجهات أوسع، ومزايا في السياسات.",
    },
    closing: {
      kicker: "للمضيّ قدمًا",
      title: "قدِّم طلبك ثم تابع حالته من حسابك.",
      body: "تفتح الموافقة بابَ انضمام البائع. الأسعار ورسوم النشر ونوافذ التحويل ظاهرة قبل النشر — دون مفاجآت تعاقدية لاحقًا.",
      primaryCta: "ابدأ الطلب",
      secondaryCta: "زيارة مساحة البائع",
    },
  },
  sellPricing: {
    metadata: {
      title: "تسعير البائعين — HenryCo Marketplace",
      description:
        "رسوم الخطة، ورسوم النشر، ورسوم الإبراز، وعمولة المعاملة، ومعالجة التحويل كلّها معلنة سلفًا — قبل نشر مخزونك، لا بعده.",
    },
    hero: {
      kicker: "تسعير البائعين",
      title: "اقتصاد واضح. لا رسوم خفية.",
      body: "رسوم الخطة ورسوم النشر ورسوم الإبراز وعمولة المعاملة ومعالجة التحويل كلّها معلنة سلفًا — قبل نشر مخزونك، لا بعده.",
      primaryCta: "قدّم بصفتك بائعًا",
      secondaryCta: "العودة إلى نظرة البائع",
      statsLabels: {
        planTiers: "مستويات الخطة",
        trustTiers: "مستويات الثقة",
        featuredSlots: "خانات الإبراز",
      },
      featuredSlotsValue: "تُراجع حالةً بحالة",
    },
    plans: {
      kicker: "الخطط بنظرة سريعة",
      feeLabel: "العمولة",
      payoutLabel: "التحويل",
      includedLabel: "مُضمّن",
      includedSuffix: "إعلانًا",
      extraListingLabel: "إعلان إضافي",
      featuredSlotLabel: "خانة إبراز",
      currencyPrefix: "NGN",
      ctaPartner: "تواصل معنا لشروط الشراكة",
      ctaTemplate: "ابدأ بـ {plan}",
    },
    economics: {
      kicker: "كيف تكسب HenryCo",
      title: "معلَن سلفًا، يُخصم على مرأى الجميع.",
      items: [
        "تُخصم عمولات المعاملات من كل تسوية مجموعة-طلب لدى البائع قبل تحرير التحويل.",
        "تُطبَّق رسوم النشر بعد استنفاد حصة الإعلانات المُضمَّنة في الخطة الفعّالة للبائع.",
        "الإبراز طلبٌ مدفوع منفصل، ويبقى خاضعًا لمراجعة الجودة والثقة.",
        "تُخصم رسوم معالجة التحويل ضمن لقطة تسوية البائع، لا لاحقًا كمفاجأة.",
        "خدمات القيمة المضافة في Studio و Learn و Logistics تفتح روافد دخل إضافية للبائعين.",
        "تظل الحملات التي يديرها المشغّل والخانات المُموَّلة قابلة للتدقيق ولا تتحوّل إلى فوضى خدمة ذاتية.",
      ],
    },
    trustTiers: {
      kicker: "توقيت التحويل حسب مستوى الثقة",
      title: "السلوك الأفضل يقلّص فترات الاحتجاز.",
    },
    closing: {
      kicker: "هل أنت جاهز للتقديم؟",
      title: "يفتح الطلب داخل حساب HenryCo الخاص بك.",
      body: "يمكنك حفظ المسودّة والعودة لاحقًا — التسعير الظاهر هنا يُطبَّق فور اكتمال انضمام البائع.",
      primaryCta: "قدّم بصفتك بائعًا",
      secondaryCta: "معايير الثقة",
    },
  },
  trust: {
    metadata: {
      title: "الثقة والسلامة — HenryCo Marketplace",
      description:
        "تحكم الثقة ما يمكن للبائع فعله، وكيف يتحرّك المال، وكيف تستجيب المراجعة. مستويات البائع، الإيداع الوسيط، النزاعات وتحرير الدفعات تترك أثرًا كاملًا على الخادم.",
    },
    hero: {
      kicker: "الثقة والسلامة",
      title: "ظاهرة قبل الدفع، ومُطبَّقة بعده.",
      body: "تتحكّم الثقة في ما يستطيع البائع فعله، وفي حركة المال، وفي طريقة استجابة المراجعة. مستويات البائع ومخاطر المشتري وتقييم الإعلانات والإيداع الوسيط والنزاعات وتحرير الدفعات تترك جميعها أثرًا موثّقًا على الخادم.",
      pillars: [
        { label: "حركة المال", value: "إيداع وسيط ويُفرَج عنه بعد الفحوصات" },
        { label: "المراجعات", value: "مسجّلة على الخادم وقابلة للتتبّع في النزاعات" },
        { label: "المستويات", value: "تُكتسب وقابلة للسحب" },
      ],
    },
    guardrails: {
      kicker: "أربعة حواجز للحماية",
      items: [
        {
          title: "جوازات الثقة",
          body: "كل متجر ومنتج يُظهر مستوى التحقق، واتفاقية الخدمة، ونسبة النزاعات، وجاهزية التحويل، ووضع التنفيذ.",
        },
        {
          title: "التحكّم بالإيداع الوسيط",
          body: "تحتجز HenryCo أموال المشتري أولًا، ولا تتحوّل إلى تحويل قابل للإفراج إلا بعد تسليم ناجح واجتياز فحوصات الثقة.",
        },
        {
          title: "مراجعة مكافحة الاحتيال",
          body: "محاولات الدفع خارج المنصة، والوسائط المكرّرة، وقفزات سرعة النشر، وأنماط التحويل عالية المخاطر تظهر في صفوف المراجعة.",
        },
        {
          title: "سجلات تدقيق",
          body: "الموافقات والرفض وإجراءات التحويل وقرارات النزاعات وعمليات الفحص الآلية كلّها مسجّلة على الخادم.",
        },
      ],
    },
    sellerLadder: {
      kicker: "سلّم ثقة البائع",
      title: "مستويات تُكتسب بالسلوك، لا تُشترى.",
    },
    policySurfaces: {
      kicker: "أسطح السياسات",
      title: "المعايير التي نُلزم بها أنفسنا.",
    },
    ecosystem: {
      kicker: "تعزيز الثقة على مستوى المنظومة",
    },
  },
  collections: {
    metadata: {
      titleTemplate: "{collection} — متجر HenryCo",
      descriptionTemplate:
        "اكتشف {collection} على متجر HenryCo — مجموعة مختارة من المنتجات الموثوقة، مع إشارات الثقة، ووضوح التوصيل، وجوازات البائعين قبل الدفع.",
      fallbackDescription:
        "مجموعة مختارة على متجر HenryCo، تضم منتجات موثوقة وإشارات ثقة وتوصيلًا واضحًا وجوازات بائعين ظاهرة قبل الدفع.",
    },
    hero: {
      primaryCta: "افتح البحث الكامل",
      secondaryCta: "معايير الثقة",
    },
    sidebar: {
      itemsLabel: "العناصر في المجموعة",
      editedByLabel: "أعدّتها",
      editedByValue: "عمليات المتجر",
      buyerProtectionLabel: "حماية المشتري",
      buyerProtectionValue: "الدفع عبر الضمان",
    },
    rail: {
      kicker: "ما يضمّه هذا الاختيار",
      itemsSuffix: "عنصرًا",
    },
  },
};

const ZH: DeepPartial<MarketplacePublicCopy> = {
  cart: {
    pageIntro: {
      kicker: "购物车",
      title: "更精致的购物车,编辑更快,拆单展示更清晰。",
      description:
        "购物车持续呈现按商家分组的视图,数量调整即时生效,并与迷你购物车抽屉保持同步,让买家在接近结算时不会失去上下文。",
    },
    emptyState: {
      title: "你的购物车还是空的。",
      body: "可从产品卡片快速加入,把心仪商品收藏稍后再看,迷你购物车与完整购物车都会即时同步,无需刷新页面。",
      ctaLabel: "浏览商品",
    },
  },
  deals: {
    metadata: {
      title: "已核验优惠 — HenryCo Marketplace",
      description:
        "依据信任、库存可靠度与卖家责任筛选的折扣。HenryCo 优惠页只显示信任信号干净、已通过核验的商品。",
    },
    pageIntro: {
      kicker: "已核验优惠",
      title: "依据信任、库存可靠度与卖家责任筛选的折扣。",
      description:
        "只有当商品质量、卖家信任护照与库存状态都足够干净时,我们才会把它放上优惠位,以保护转化、减少购后遗憾。",
    },
    sectionLabel: "已核验优惠",
    listEyebrow: "已核验优惠",
    refreshNote: "定期更新",
    discountBadgePrefix: "−",
    emptyState: {
      title: "暂无已核验的优惠",
      body: "已核验的折扣会随着卖家陆续上架出现。稍后再来看看。",
    },
  },
  brand: {
    eyebrow: "品牌",
    bodyFallback:
      "HenryCo Marketplace 上经过认证的店铺,信任信号、配送清晰度与卖家护照在结账前即可查看。",
    searchCta: "在该品牌内搜索",
    trustCta: "信任标准",
    stats: {
      activeProducts: "在售商品",
      listingsReviewed: "已审核商品",
      listingsReviewedValue: "每件商品均显示信任护照",
      buyerProtection: "买家保障",
      buyerProtectionValue: "托管结算",
    },
    liveKicker: "来自 {brand} 的实时上架",
    openFullSearch: "打开完整搜索",
    metadataTitle: "{brand} — HenryCo Marketplace",
    metadataDescription:
      "在 HenryCo Marketplace 浏览 {brand} 的认证商品,结账前即可看到信任信号、配送清晰度与卖家护照。",
  },
  category: {
    hero: {
      kicker: "品类精选",
      searchCta: "在该品类中搜索",
      trustCta: "查看信任标准",
      quickFiltersLabel: "快速筛选",
    },
    stats: {
      activeListingsLabel: "在售商品",
    },
    collectionsRail: {
      kicker: "精选合辑",
      title: "助你更快做出购买决定的合辑。",
    },
    catalog: {
      kicker: "品类目录",
      title: "高端商品,层级更清晰。",
      openSearch: "打开完整搜索",
    },
    metadata: {
      titleTemplate: "{category} — HenryCo Marketplace",
      descriptionTemplate:
        "在 HenryCo Marketplace 探索 {category} 中已验证的商品,结算前即可看到信任信号、清晰的配送说明与商家信任护照。",
      fallbackDescription:
        "在 HenryCo Marketplace 浏览一个精选品类,结算前即可看到信任信号、清晰的配送说明与商家信任护照。",
    },
  },
  help: {
    metadata: {
      title: "帮助中心 — HenryCo Marketplace",
      description:
        "浏览买家和卖家最常问的问题。如果没找到所需答案,提交一张工单,团队会有专人查看。",
    },
    hero: {
      kicker: "帮助中心",
      title: "几秒内找到答案 — 或与真人沟通。",
      body: "搜索买家与卖家最常问的话题。如果未找到所需内容,可在页面底部提交工单,团队会有专人查看。",
    },
    stillNeedHelp: {
      kicker: "仍需要帮助",
      title: "提交工单,会有专人查看。",
      body: "工单会保留完整上下文 — 订单、商家、纠纷历史 — 这样团队能直接跟进,不需要你在每次回复时重新描述。",
      ctaLabel: "提交支持工单",
    },
  },
  trust: {
    metadata: {
      title: "信任与安全 — HenryCo Marketplace",
      description:
        "信任决定了卖家可以做什么、资金如何流动以及审核如何响应。卖家等级、托管、争议与放款释放都会在服务器留下完整记录。",
    },
    hero: {
      kicker: "信任与安全",
      title: "结算前可见,结算后强制执行。",
      body: "信任决定了卖家可以做什么、资金如何流动,以及审核如何响应。卖家等级、买家风险、商品评分、托管、争议与放款释放都会在服务器留下记录。",
      pillars: [
        { label: "资金流动", value: "托管中,审核通过后释放" },
        { label: "评价", value: "服务器记录,争议可追溯" },
        { label: "等级", value: "凭表现获得,可撤销" },
      ],
    },
    guardrails: {
      kicker: "四道防线",
      items: [
        {
          title: "信任护照",
          body: "每家店铺与每件商品都展示其验证等级、SLA、争议率、放款状态与履约能力。",
        },
        {
          title: "托管控制",
          body: "买家资金先由 HenryCo 托管,通过交付与信任审核后才进入可释放的放款。",
        },
        {
          title: "反欺诈审查",
          body: "脱离平台的支付引导、重复素材、上架激增以及高风险的放款行为都会进入审核队列。",
        },
        {
          title: "审计轨迹",
          body: "批准、拒绝、放款操作、争议裁决与自动化巡检都会在服务器侧记录。",
        },
      ],
    },
    sellerLadder: {
      kicker: "卖家信任阶梯",
      title: "凭表现获得,而非花钱购买的等级。",
    },
    policySurfaces: {
      kicker: "政策呈现面",
      title: "我们对自己设定的标准。",
    },
    ecosystem: {
      kicker: "生态系统的信任强化",
    },
  },
  sell: {
    metadata: {
      title: "在 HenryCo 开店 — 面向以信任为本的卖家的精选商城",
      description:
        "申请加入 HenryCo Marketplace 销售:以信任为核心的定位、精致店铺,以及统一的订单、结算与支持工作台。",
    },
    hero: {
      kicker: "在 HenryCo 开店",
      title: "天生精选。专为以信任领跑的卖家而生。",
      body: "HenryCo Marketplace 优先考虑注重呈现、按时履约且诚实保障买家权益的卖家。本页清晰列出门槛;卖家申请将在你的 HenryCo 账户内继续完成。",
      primaryCta: "开始卖家申请",
      secondaryCta: "查看卖家定价",
      signInCta: "用 HenryCo 账户登录",
      highlights: [
        { label: "选择", value: "人工审核,而非付费上架" },
        { label: "店铺", value: "买家可见的信任护照" },
        { label: "工作台", value: "订单、结算、支持统一管理" },
      ],
    },
    advantages: {
      kicker: "为什么更强的卖家在这里更出色",
      items: [
        { title: "以信任为核心的定位", body: "你的店铺拥有清晰可见的信任护照,而不是被低质杂乱的商城噪音掩盖。" },
        { title: "更优的店铺质量", body: "编辑栏目、更安静的搜索与更整洁的产品卡片,帮助高质量店铺更快转化。" },
        { title: "更清晰的运营", body: "结算、订单、支持、审核与库存提醒在更整洁的同一工作台中持续可见。" },
      ],
    },
    onboarding: {
      kicker: "入驻流程",
      stepLabel: "步骤",
      steps: [
        { step: "01", title: "提交卖家申请", body: "从 HenryCo 账户内打开申请 — 在你整理资料时,草稿会自动保存。" },
        { step: "02", title: "补充经营资料", body: "公司名称、店铺简介、品类聚焦,以及说明你如何履约的核验文件。" },
        { step: "03", title: "申请审核", body: "HenryCo 团队会审核文件、信任信号与店铺准备度 — 而不仅看一个付费徽章。" },
        { step: "04", title: "卖家入驻", body: "通过的卖家进入入驻流程,定价、上架费、结算周期与政策规则会在开放发布之前清晰可见。" },
      ],
      callout: {
        eyebrow: "更整洁的卖家申请",
        body: "卖家注册保留在你的账户内,经营资料、审核状态与审批更新都保持私密且便于跟进。",
      },
    },
    plans: {
      kicker: "套餐经济",
      title: "层级在发布前就已声明,而非事后。",
      feeLabel: "费用",
      payoutLabel: "结算",
      includedLabel: "包含",
      includedSuffix: "条上架",
      featuredLabel: "推荐位",
      featuredCurrencyPrefix: "NGN",
    },
    trustTiers: {
      kicker: "信任等级影响权益",
      title: "享受更快的结算、更大的店铺与更多政策优势。",
    },
    closing: {
      kicker: "继续前进",
      title: "提交申请,在账户中查看申请状态。",
      body: "通过审批后,即可进入卖家入驻流程。定价、上架费与结算周期在发布前都可见 — 不会有事后合同上的意外。",
      primaryCta: "开始申请",
      secondaryCta: "前往卖家工作台",
    },
  },
  sellPricing: {
    metadata: {
      title: "卖家定价 — HenryCo 商城",
      description:
        "套餐费、上架费、推荐位费、交易佣金与结算手续费均提前公开 — 在发布商品之前,不是之后。",
    },
    hero: {
      kicker: "卖家定价",
      title: "明晰的经济。没有隐藏费用。",
      body: "套餐费、上架费、推荐位费、交易佣金与结算手续费均在发布商品之前提前公开 — 不是发布之后。",
      primaryCta: "申请成为卖家",
      secondaryCta: "返回卖家概览",
      statsLabels: {
        planTiers: "套餐档位",
        trustTiers: "信任档位",
        featuredSlots: "推荐位",
      },
      featuredSlotsValue: "按个案审核",
    },
    plans: {
      kicker: "套餐一览",
      feeLabel: "佣金",
      payoutLabel: "结算",
      includedLabel: "包含",
      includedSuffix: "条上架",
      extraListingLabel: "额外上架",
      featuredSlotLabel: "推荐位",
      currencyPrefix: "NGN",
      ctaPartner: "联系我们了解合作条款",
      ctaTemplate: "选择 {plan} 开始",
    },
    economics: {
      kicker: "HenryCo 如何盈利",
      title: "提前声明,公开扣除。",
      items: [
        "交易佣金会在卖家订单组结算释放结算款之前先行扣除。",
        "在卖家当前套餐附带的上架额度用尽之后,即开始计收上架费。",
        "推荐位为单独付费申请,仍需通过质量与信任评估。",
        "结算处理费在卖家结算快照内直接扣除,不会事后再额外加收。",
        "Studio、Learn 与 Logistics 的增值服务为卖家开辟额外收入通道。",
        "由平台运营把关的活动与赞助位保持可审计,绝不沦为自助式失序。",
      ],
    },
    trustTiers: {
      kicker: "按信任档位的结算节奏",
      title: "更好的行为带来更短的扣留期。",
    },
    closing: {
      kicker: "准备好申请了吗?",
      title: "申请将在你的 HenryCo 账户中打开。",
      body: "你可以保存草稿稍后再来 — 这里展示的定价将在卖家入驻完成后即刻生效。",
      primaryCta: "申请成为卖家",
      secondaryCta: "信任标准",
    },
  },
  collections: {
    metadata: {
      titleTemplate: "{collection} — HenryCo 商城",
      descriptionTemplate:
        "在 HenryCo 商城探索 {collection} — 一组精选的可信商品,提供信任信号、清晰的配送信息,并在结账前展示卖家信任护照。",
      fallbackDescription:
        "HenryCo 商城上的一组精选合集,涵盖可信商品、信任信号、清晰配送以及结账前可见的卖家信任护照。",
    },
    hero: {
      primaryCta: "打开完整搜索",
      secondaryCta: "信任标准",
    },
    sidebar: {
      itemsLabel: "合集中的商品",
      editedByLabel: "编选自",
      editedByValue: "商城运营团队",
      buyerProtectionLabel: "买家保护",
      buyerProtectionValue: "托管结账",
    },
    rail: {
      kicker: "本选辑包含的商品",
      itemsSuffix: "件商品",
    },
  },
};

const HI: DeepPartial<MarketplacePublicCopy> = {
  cart: {
    pageIntro: {
      kicker: "कार्ट",
      title: "एक प्रीमियम बास्केट — तेज़ बदलाव और बंटे ऑर्डर की साफ़ झलक।",
      description:
        "कार्ट विक्रेता-वार समूह को सामने रखता है, मात्रा तुरंत अपडेट करता है और मिनी-कार्ट ड्रॉअर से जुड़ा रहता है, ताकि चेकआउट के क़रीब पहुँचते समय ख़रीदार का संदर्भ कभी न टूटे।",
    },
    emptyState: {
      title: "आपका कार्ट अभी ख़ाली है।",
      body: "प्रोडक्ट कार्ड से झटपट जोड़ें, चीज़ें बाद के लिए सहेजें — मिनी-कार्ट और पूरे कार्ट दोनों में सब कुछ बिना रिफ़्रेश के अपडेट रहता है।",
      ctaLabel: "प्रोडक्ट देखें",
    },
  },
  deals: {
    metadata: {
      title: "सत्यापित डील्स — HenryCo Marketplace",
      description:
        "भरोसे, स्टॉक की पक्की उपलब्धता और विक्रेता ज़िम्मेदारी के आधार पर छँटी हुई छूट। HenryCo डील्स पेज पर सिर्फ़ साफ़ ट्रस्ट संकेतों वाले सत्यापित प्रोडक्ट ही दिखते हैं।",
    },
    pageIntro: {
      kicker: "सत्यापित डील्स",
      title: "भरोसे, स्टॉक की पक्की उपलब्धता और विक्रेता ज़िम्मेदारी के आधार पर छँटी छूट।",
      description:
        "डील तभी सामने लाई जाती है जब लिस्टिंग की गुणवत्ता, विक्रेता का ट्रस्ट पासपोर्ट और स्टॉक की स्थिति इतनी साफ़ हो कि कन्वर्ज़न सुरक्षित रहे और ख़रीदार को बाद में पछतावा न हो।",
    },
    sectionLabel: "सत्यापित डील्स",
    listEyebrow: "सत्यापित डील्स",
    refreshNote: "नियमित रूप से अपडेट होती हैं",
    discountBadgePrefix: "−",
    emptyState: {
      title: "अभी कोई सत्यापित डील नहीं है",
      body: "जैसे-जैसे विक्रेता लिस्ट करते जाएँगे, सत्यापित छूट भी आती जाएँगी। थोड़ी देर बाद फिर देखें।",
    },
  },
  brand: {
    eyebrow: "ब्रांड",
    bodyFallback:
      "HenryCo Marketplace पर एक सत्यापित स्टोर — ट्रस्ट संकेत, डिलीवरी की साफ़ झलक और सेलर पासपोर्ट चेकआउट से पहले ही दिखते हैं।",
    searchCta: "इस ब्रांड में खोजें",
    trustCta: "ट्रस्ट मानक",
    stats: {
      activeProducts: "सक्रिय उत्पाद",
      listingsReviewed: "जाँचे गए लिस्टिंग",
      listingsReviewedValue: "हर आइटम पर ट्रस्ट पासपोर्ट दिखाई देता है",
      buyerProtection: "ख़रीदार सुरक्षा",
      buyerProtectionValue: "एस्क्रो चेकआउट",
    },
    liveKicker: "{brand} से लाइव",
    openFullSearch: "पूरी खोज खोलें",
    metadataTitle: "{brand} — HenryCo Marketplace",
    metadataDescription:
      "HenryCo Marketplace पर {brand} के सत्यापित उत्पाद देखें — चेकआउट से पहले ट्रस्ट संकेत, डिलीवरी की साफ़ झलक और सेलर पासपोर्ट सामने रहते हैं।",
  },
  category: {
    hero: {
      kicker: "कैटेगरी एडिट",
      searchCta: "इस कैटेगरी में खोजें",
      trustCta: "ट्रस्ट स्टैंडर्ड देखें",
      quickFiltersLabel: "क्विक फ़िल्टर",
    },
    stats: {
      activeListingsLabel: "सक्रिय लिस्टिंग",
    },
    collectionsRail: {
      kicker: "क्यूरेटेड रेल",
      title: "कलेक्शन जो ख़रीदारी का फ़ैसला आसान बनाते हैं।",
    },
    catalog: {
      kicker: "कैटेगरी कैटलॉग",
      title: "प्रीमियम प्रोडक्ट, ज़्यादा साफ़ ढाँचा।",
      openSearch: "पूरी सर्च खोलें",
    },
    metadata: {
      titleTemplate: "{category} — HenryCo Marketplace",
      descriptionTemplate:
        "HenryCo Marketplace पर {category} में सत्यापित प्रोडक्ट देखें — चेकआउट से पहले ट्रस्ट संकेत, डिलीवरी की साफ़ जानकारी और सेलर पासपोर्ट सामने रहते हैं।",
      fallbackDescription:
        "HenryCo Marketplace की एक क्यूरेटेड कैटेगरी देखें — चेकआउट से पहले ट्रस्ट संकेत, डिलीवरी की साफ़ जानकारी और सेलर पासपोर्ट सामने रहते हैं।",
    },
  },
  help: {
    metadata: {
      title: "मदद केंद्र — HenryCo Marketplace",
      description:
        "ख़रीदार और विक्रेता जो सवाल सबसे ज़्यादा पूछते हैं, उन्हें देखें। ज़रूरत की जानकारी न मिले, तो सपोर्ट टिकट खोलें — टीम का कोई व्यक्ति उसे पढ़ेगा।",
    },
    hero: {
      kicker: "मदद केंद्र",
      title: "सेकंडों में जवाब पाएँ — या किसी व्यक्ति से बात करें।",
      body: "ख़रीदारों और विक्रेताओं के सबसे आम विषय खोजें। अगर ज़रूरत की चीज़ न मिले, तो इस पेज के नीचे से एक सपोर्ट टिकट खोलें और टीम का कोई व्यक्ति उसे पढ़ेगा।",
    },
    stillNeedHelp: {
      kicker: "अब भी मदद चाहिए",
      title: "टिकट खोलें — कोई व्यक्ति उसे पढ़ेगा।",
      body: "टिकट पूरा संदर्भ जोड़े रखते हैं — ऑर्डर, विक्रेता, विवाद का इतिहास — ताकि टीम बिना आपको हर जवाब में दोहराए मुद्दे पर काम कर सके।",
      ctaLabel: "सपोर्ट टिकट खोलें",
    },
  },
  trust: {
    metadata: {
      title: "ट्रस्ट और सुरक्षा — HenryCo Marketplace",
      description:
        "ट्रस्ट यह तय करता है कि सेलर क्या कर सकता है, पैसा कैसे चलता है और मॉडरेशन कैसे जवाब देती है। सेलर टियर, एस्क्रो, विवाद और पेआउट रिलीज़ — सबका सर्वर-साइड रिकॉर्ड बनता है।",
    },
    hero: {
      kicker: "ट्रस्ट और सुरक्षा",
      title: "चेकआउट से पहले दिखती है। उसके बाद लागू होती है।",
      body: "ट्रस्ट तय करता है कि सेलर क्या कर सकता है, पैसा कैसे चलता है और मॉडरेशन कैसे प्रतिक्रिया देती है। सेलर टियर, बायर रिस्क, लिस्टिंग स्कोरिंग, एस्क्रो, विवाद और पेआउट रिलीज़ — सबका सर्वर-साइड रिकॉर्ड बनता है।",
      pillars: [
        { label: "पैसा कैसे चलता है", value: "एस्क्रो में, जाँच के बाद रिलीज़" },
        { label: "रिव्यू", value: "सर्वर-लॉग, विवाद में ट्रेस होने योग्य" },
        { label: "टियर", value: "अर्जित, और वापस लिए जा सकने वाले" },
      ],
    },
    guardrails: {
      kicker: "चार सुरक्षा रेखाएँ",
      items: [
        {
          title: "ट्रस्ट पासपोर्ट",
          body: "हर स्टोर और प्रोडक्ट पर वेरिफ़िकेशन स्तर, SLA, विवाद दर, पेआउट तत्परता और फ़ुलफ़िलमेंट स्थिति सामने रहती है।",
        },
        {
          title: "एस्क्रो कंट्रोल",
          body: "बायर का पैसा पहले HenryCo के पास रहता है — डिलीवरी और ट्रस्ट चेक पास होने पर ही पेआउट में जाता है।",
        },
        {
          title: "एंटी-फ्रॉड समीक्षा",
          body: "प्लेटफ़ॉर्म से बाहर भुगतान की कोशिश, डुप्लिकेट मीडिया, अचानक लिस्टिंग का उछाल और जोखिम भरे पेआउट पैटर्न रिव्यू क्यू में आते हैं।",
        },
        {
          title: "ऑडिट ट्रेल",
          body: "मंज़ूरी, अस्वीकृति, पेआउट क्रियाएँ, विवाद निर्णय और ऑटोमेशन स्वीप सब सर्वर-साइड लॉग होते हैं।",
        },
      ],
    },
    sellerLadder: {
      kicker: "सेलर ट्रस्ट लैडर",
      title: "टियर बर्ताव से अर्जित होते हैं, ख़रीदे नहीं जाते।",
    },
    policySurfaces: {
      kicker: "पॉलिसी सरफ़ेस",
      title: "जिन मानकों पर हम ख़ुद को परखते हैं।",
    },
    ecosystem: {
      kicker: "इकोसिस्टम-व्यापी ट्रस्ट सुदृढ़ीकरण",
    },
  },
  sell: {
    metadata: {
      title: "HenryCo पर बेचें — भरोसे की अगुवाई करने वाले विक्रेताओं के लिए चुनिंदा मार्केटप्लेस",
      description:
        "HenryCo Marketplace पर बेचने के लिए आवेदन करें: भरोसे पर टिकी पोज़िशनिंग, प्रीमियम स्टोरफ्रंट और ऑर्डर, भुगतान व सपोर्ट के लिए एक ही जगह काम करने की सुविधा।",
    },
    hero: {
      kicker: "HenryCo पर बेचें",
      title: "मूल रूप से चयनात्मक। उन विक्रेताओं के लिए जो भरोसे की अगुवाई करते हैं।",
      body: "HenryCo Marketplace उन विक्रेताओं को तरजीह देता है जो प्रस्तुति का ख़याल रखते हैं, भरोसेमंद डिलीवरी करते हैं और ख़रीदार सुरक्षा को सच्चे मन से निभाते हैं। मानक इस पेज पर खुलकर बताए गए हैं; विक्रेता आवेदन आपके HenryCo अकाउंट के अंदर जारी रहता है।",
      primaryCta: "विक्रेता आवेदन खोलें",
      secondaryCta: "विक्रेता मूल्य देखें",
      signInCta: "HenryCo अकाउंट से साइन इन करें",
      highlights: [
        { label: "चयन", value: "मैनुअल समीक्षा, पेड-लिस्टिंग नहीं" },
        { label: "स्टोरफ्रंट", value: "ख़रीदारों को दिखता ट्रस्ट पासपोर्ट" },
        { label: "वर्कस्पेस", value: "ऑर्डर, पेआउट, सपोर्ट एक साथ" },
      ],
    },
    advantages: {
      kicker: "मज़बूत विक्रेता यहाँ क्यों आगे बढ़ते हैं",
      items: [
        { title: "भरोसे पर टिकी पोज़िशनिंग", body: "आपके स्टोर को साफ़ दिखने वाला ट्रस्ट पासपोर्ट मिलता है, न कि कम-गुणवत्ता वाले मार्केटप्लेस के शोर में दब जाना।" },
        { title: "बेहतर स्टोरफ्रंट क्वालिटी", body: "एडिटोरियल रेल, शांत सर्च और साफ़ प्रोडक्ट कार्ड क्वालिटी स्टोर को तेज़ी से कन्वर्ज़न तक पहुँचाते हैं।" },
        { title: "तेज़ संचालन", body: "पेआउट, ऑर्डर, सपोर्ट, मॉडरेशन और स्टॉक अलर्ट सब कुछ एक साफ़ वर्कस्पेस में दिखता रहता है।" },
      ],
    },
    onboarding: {
      kicker: "ऑनबोर्डिंग कैसे होती है",
      stepLabel: "चरण",
      steps: [
        { step: "01", title: "विक्रेता आवेदन शुरू करें", body: "आवेदन अपने HenryCo अकाउंट से खोलें — जैसे-जैसे विवरण जोड़ते जाएँ, ड्राफ़्ट अपने आप सेव होते जाते हैं।" },
        { step: "02", title: "व्यवसाय विवरण जोड़ें", body: "व्यवसाय का नाम, स्टोर प्रोफ़ाइल, प्रोडक्ट फ़ोकस और वे वेरिफ़िकेशन डॉक्युमेंट जो बताते हैं कि आप ऑर्डर कैसे पूरे करते हैं।" },
        { step: "03", title: "आवेदन की समीक्षा", body: "HenryCo टीम दस्तावेज़, ट्रस्ट संकेत और स्टोर की तैयारी देखती है — सिर्फ़ कोई पेड बैज नहीं।" },
        { step: "04", title: "वेंडर ऑनबोर्डिंग", body: "स्वीकृत विक्रेता वेंडर ऑनबोर्डिंग में जाते हैं, जहाँ कीमतें, लिस्टिंग शुल्क, पेआउट विंडो और नीतियाँ पब्लिश से पहले ही दिखती हैं।" },
      ],
      callout: {
        eyebrow: "साफ़-सुथरा विक्रेता आवेदन",
        body: "विक्रेता रजिस्ट्रेशन आपके अकाउंट के अंदर रहता है, इसलिए व्यवसाय विवरण, समीक्षा की स्थिति और स्वीकृति अपडेट निजी रहते हैं और फ़ॉलो करना आसान होता है।",
      },
    },
    plans: {
      kicker: "प्लान का अर्थशास्त्र",
      title: "स्तर पहले ही बताए जाते हैं, पब्लिश के बाद नहीं।",
      feeLabel: "शुल्क",
      payoutLabel: "पेआउट",
      includedLabel: "शामिल",
      includedSuffix: "लिस्टिंग",
      featuredLabel: "फ़ीचर्ड",
      featuredCurrencyPrefix: "NGN",
    },
    trustTiers: {
      kicker: "ट्रस्ट टियर विशेषाधिकार बदलते हैं",
      title: "तेज़ पेआउट, बड़े स्टोरफ्रंट और नीति-स्तर के लाभ कमाएँ।",
    },
    closing: {
      kicker: "आगे बढ़ें",
      title: "आवेदन करें, फिर अपने अकाउंट से आवेदन की स्थिति देखें।",
      body: "अनुमोदन से वेंडर ऑनबोर्डिंग खुलती है। पब्लिश करने से पहले ही कीमत, लिस्टिंग शुल्क और पेआउट विंडो दिख जाती है — बाद में कोई कॉन्ट्रैक्ट-सरप्राइज़ नहीं।",
      primaryCta: "आवेदन शुरू करें",
      secondaryCta: "वेंडर वर्कस्पेस देखें",
    },
  },
  sellPricing: {
    metadata: {
      title: "विक्रेता कीमत — HenryCo Marketplace",
      description:
        "प्लान शुल्क, लिस्टिंग शुल्क, फ़ीचर्ड स्लॉट शुल्क, ट्रांज़ैक्शन कमीशन और पेआउट प्रोसेसिंग — सब पहले से बताए जाते हैं, इन्वेंट्री पब्लिश करने से पहले, बाद में नहीं।",
    },
    hero: {
      kicker: "विक्रेता कीमत",
      title: "साफ़ इकोनॉमिक्स। कोई छिपा शुल्क नहीं।",
      body: "प्लान शुल्क, लिस्टिंग शुल्क, फ़ीचर्ड स्लॉट शुल्क, ट्रांज़ैक्शन कमीशन और पेआउट प्रोसेसिंग — सब इन्वेंट्री पब्लिश करने से पहले ही बताए जाते हैं, बाद में नहीं।",
      primaryCta: "विक्रेता के रूप में आवेदन",
      secondaryCta: "विक्रेता ओवरव्यू पर वापस",
      statsLabels: {
        planTiers: "प्लान टियर",
        trustTiers: "ट्रस्ट टियर",
        featuredSlots: "फ़ीचर्ड स्लॉट",
      },
      featuredSlotsValue: "अलग-अलग समीक्षा",
    },
    plans: {
      kicker: "प्लान एक नज़र में",
      feeLabel: "शुल्क",
      payoutLabel: "पेआउट",
      includedLabel: "शामिल",
      includedSuffix: "लिस्टिंग",
      extraListingLabel: "अतिरिक्त लिस्टिंग",
      featuredSlotLabel: "फ़ीचर्ड स्लॉट",
      currencyPrefix: "NGN",
      ctaPartner: "पार्टनर शर्तों के लिए संपर्क करें",
      ctaTemplate: "{plan} से शुरू करें",
    },
    economics: {
      kicker: "HenryCo कैसे कमाता है",
      title: "पहले से बताया, खुले में काटा।",
      items: [
        "हर वेंडर ऑर्डर-ग्रुप सेटलमेंट से पेआउट रिलीज़ से पहले ट्रांज़ैक्शन कमीशन काटा जाता है।",
        "विक्रेता के सक्रिय प्लान में शामिल लिस्टिंग कोटा खत्म होने के बाद ही पोस्टिंग शुल्क लागू होता है।",
        "फ़ीचर्ड प्लेसमेंट अलग सशुल्क अनुरोध है और गुणवत्ता व ट्रस्ट समीक्षा के अधीन रहता है।",
        "पेआउट प्रोसेसिंग शुल्क विक्रेता सेटलमेंट स्नैपशॉट में ही कट जाते हैं, बाद में अचानक नहीं।",
        "Studio, Learn और Logistics की वैल्यू-ऐडेड सेवाएँ विक्रेताओं के लिए अतिरिक्त राजस्व-लेन खोलती हैं।",
        "ऑपरेटर द्वारा नियंत्रित कैम्पेन और स्पॉन्सर्ड स्लॉट ऑडिटेबल रहते हैं — सेल्फ-सर्व अव्यवस्था में नहीं बदलते।",
      ],
    },
    trustTiers: {
      kicker: "ट्रस्ट-टियर पेआउट टाइमिंग",
      title: "बेहतर व्यवहार से होल्ड छोटा होता है।",
    },
    closing: {
      kicker: "आवेदन के लिए तैयार?",
      title: "आवेदन आपके HenryCo अकाउंट में खुलेगा।",
      body: "आप ड्राफ्ट सेव कर वापस आ सकते हैं — यहाँ दिख रही कीमत वेंडर ऑनबोर्डिंग पूरा होते ही लागू हो जाती है।",
      primaryCta: "विक्रेता के रूप में आवेदन",
      secondaryCta: "ट्रस्ट मानक",
    },
  },
  collections: {
    metadata: {
      titleTemplate: "{collection} — HenryCo मार्केटप्लेस",
      descriptionTemplate:
        "HenryCo मार्केटप्लेस पर {collection} देखें — सत्यापित प्रोडक्ट्स की क्यूरेटेड लाइन-अप, ट्रस्ट सिग्नल, स्पष्ट डिलीवरी और चेकआउट से पहले दिखता सेलर ट्रस्ट पासपोर्ट।",
      fallbackDescription:
        "HenryCo मार्केटप्लेस का एक क्यूरेटेड कलेक्शन — सत्यापित प्रोडक्ट्स, ट्रस्ट सिग्नल, साफ डिलीवरी और चेकआउट से पहले दिखता सेलर ट्रस्ट पासपोर्ट।",
    },
    hero: {
      primaryCta: "पूरी सर्च खोलें",
      secondaryCta: "ट्रस्ट मानक",
    },
    sidebar: {
      itemsLabel: "कलेक्शन में आइटम",
      editedByLabel: "क्यूरेट किया",
      editedByValue: "मार्केटप्लेस ऑपरेशंस",
      buyerProtectionLabel: "बायर सुरक्षा",
      buyerProtectionValue: "एस्क्रो चेकआउट",
    },
    rail: {
      kicker: "इस लाइन-अप में क्या है",
      itemsSuffix: "आइटम",
    },
  },
};

const IG: DeepPartial<MarketplacePublicCopy> = {
  cart: {
    pageIntro: {
      kicker: "Nkata",
      title: "Nkata mara mma — mgbanwe ngwa ngwa na nghọta doro anya maka iwepụ ibu n'otu otu.",
      description:
        "Nkata na-edobe nchịkọta ndị na-ere ahịa ka ọ pụta ìhè, na-emelite ọnụ ọgụgụ ngwa ngwa, ma na-eme ka njikọ na obere drawer nkata gụzosie ike, ka ndị na-azụ ahịa ghara ịtụfu echiche ha mgbe ha na-eru ebe ịkwụ ụgwọ.",
    },
    emptyState: {
      title: "Nkata gị ka tọgbọrọ chakoo.",
      body: "Tinye ihe ọsọ ọsọ site na kaadị ngwa ahịa, debe ihe maka mgbe ọzọ — nkata ga-anọgide na-emelite n'ime drawer mini na nkata zuru oke n'enweghị nlọghachi azụ.",
      ctaLabel: "Lelee ngwa ahịa",
    },
  },
  deals: {
    metadata: {
      title: "Mbelata ọnụahịa enyochara — HenryCo Marketplace",
      description:
        "Mbelata ọnụahịa esiwo nzọcha ntụkwasị obi, nkwado ngwongwo dị n'ụlọ ahịa, na ọrụ onye na-ere ahịa. Naanị ndepụta enyochara nke nwere akara ntụkwasị obi dị ọcha na-apụta na peeji deals nke HenryCo.",
    },
    pageIntro: {
      kicker: "Mbelata ọnụahịa enyochara",
      title: "Mbelata ọnụahịa esiwo nzọcha ntụkwasị obi, nkwado ngwongwo dị, na ọrụ onye na-ere ahịa.",
      description:
        "Anyị na-egosi naanị mbelata ọnụahịa mgbe ịdị mma ndepụta, paspọtụ ntụkwasị obi nke onye na-ere ahịa, na ọnọdụ ngwongwo dị ọcha nke ọma iji chebe ịgbanwe ahịa ma belata mwute mgbe e zụsịrị.",
    },
    sectionLabel: "Mbelata ọnụahịa enyochara",
    listEyebrow: "Mbelata ọnụahịa enyochara",
    refreshNote: "Na-emelite oge niile",
    discountBadgePrefix: "−",
    emptyState: {
      title: "O nweghị mbelata ọnụahịa enyochara ugbu a",
      body: "Mbelata enyochara na-abata ka ndị na-ere ahịa na-edepụta ha. Lọghachi ọzọ obere oge.",
    },
  },
  brand: {
    eyebrow: "Akaraaka ahịa",
    bodyFallback:
      "Ụlọ ahịa enyochara n'elu HenryCo Marketplace, ebe akara ntụkwasị obi, nghọta nnyefe, na paspọtụ onye na-ere ahịa na-egosi tupu ịkwụ ụgwọ.",
    searchCta: "Chọọ n'ime akaraaka ahịa a",
    trustCta: "Ọkwa ntụkwasị obi",
    stats: {
      activeProducts: "Ngwa ahịa na-arụ ọrụ",
      listingsReviewed: "Edemede enyochara",
      listingsReviewedValue: "Paspọtụ ntụkwasị obi pụtara ìhè kwa ihe",
      buyerProtection: "Nchekwa onye na-azụ ahịa",
      buyerProtectionValue: "Ịkwụ ụgwọ site n'aka onye nnọchi anya",
    },
    liveKicker: "Ọkụ ọkụ site na {brand}",
    openFullSearch: "Mepee nchọta zuru oke",
    metadataTitle: "{brand} — HenryCo Marketplace",
    metadataDescription:
      "Lelee ngwa ahịa enyochara nke {brand} na HenryCo Marketplace — akara ntụkwasị obi, nghọta nnyefe, na paspọtụ ndị na-ere ahịa na-egosi tupu ịkwụ ụgwọ.",
  },
  category: {
    hero: {
      kicker: "Nhọrọ ụdị",
      searchCta: "Chọọ n'ime ụdị a",
      trustCta: "Lelee ụkpụrụ ntụkwasị obi",
      quickFiltersLabel: "Nzacha ngwa ngwa",
    },
    stats: {
      activeListingsLabel: "Ndepụta na-arụ ọrụ",
    },
    collectionsRail: {
      kicker: "Ngwakọta a họpụtara",
      title: "Mkpokọta na-eme ka mkpebi ịzụrụ dị mfe.",
    },
    catalog: {
      kicker: "Katalọgụ ụdị",
      title: "Ngwa ahịa nke kachasị mma, usoro doro anya.",
      openSearch: "Mepee ọchụchọ zuru ezu",
    },
    metadata: {
      titleTemplate: "{category} — HenryCo Marketplace",
      descriptionTemplate:
        "Chọpụta ngwa ahịa enyochara n'ime {category} na HenryCo Marketplace, na akara ntụkwasị obi, nghọta nnyefe doro anya, na paspọtụ ndị na-ere ahịa nke pụtara tupu ịkwụ ụgwọ.",
      fallbackDescription:
        "Tụgharịa n'ime ụdị a họpụtara na HenryCo Marketplace, na akara ntụkwasị obi, nghọta nnyefe doro anya, na paspọtụ ndị na-ere ahịa tupu ịkwụ ụgwọ.",
    },
  },
  trust: {
    metadata: {
      title: "Ntụkwasị obi & nchekwa — HenryCo Marketplace",
      description:
        "Ntụkwasị obi na-achịkwa ihe onye na-ere ahịa nwere ike ime, otú ego si agagharị, na otú nlekota si aza. Ọkwa ndị na-ere ahịa, nchekwa ego site n'aka onye nnọchi anya, esemokwu, na ntọhapụ ego niile na-ahapụ ndekọ na sava.",
    },
    hero: {
      kicker: "Ntụkwasị obi & nchekwa",
      title: "Pụta ìhè tupu ịkwụ ụgwọ. Manye ya mgbe ọ gachara.",
      body: "Ntụkwasị obi na-achịkwa ihe onye na-ere ahịa nwere ike ime, otú ego si agagharị, na otú nlekota si meghachi. Ọkwa ndị na-ere ahịa, ihe egwu nke onye na-azụ ahịa, akara nke edemede, nchekwa ego, esemokwu, na ntọhapụ ego niile na-ahapụ ndekọ na sava.",
      pillars: [
        { label: "Ngagharị ego", value: "Nọ n'aka onye nnọchi, ahapụ mgbe nyochaa" },
        { label: "Ntule", value: "Edebere na sava, enwere ike ịchọta n'esemokwu" },
        { label: "Ọkwa", value: "A na-enweta ya, enwere ike iwepụ ya" },
      ],
    },
    guardrails: {
      kicker: "Ihe nchebe anọ",
      items: [
        {
          title: "Paspọtụ ntụkwasị obi",
          body: "Ụlọ ahịa na ngwa ahịa ọ bụla na-egosi ọkwa nyocha, SLA, ọnụego esemokwu, njikere ịnata ego, na ọnọdụ mmezu.",
        },
        {
          title: "Njikwa nchekwa ego",
          body: "Ego onye na-azụ ahịa na-anọ buru ụzọ n'aka HenryCo, ma na-aga naanị na ntọhapụ mgbe nyefere agachara nyochaa.",
        },
        {
          title: "Nyocha mgbochi aghụghọ",
          body: "Ịkpalite ịkwụ ụgwọ na mpụga elu ikuku, mídia eberebe, mwube ngwa ahịa na-eri eri, na ụzọ ntọhapụ ego dị egwu na-abata na ahịrị nyocha.",
        },
        {
          title: "Ụzọ nlebanya",
          body: "Nkwado, ajụ, mmemme ntọhapụ ego, mkpebi esemokwu, na nyocha akpaaka niile bụ ndị edebere na sava.",
        },
      ],
    },
    sellerLadder: {
      kicker: "Mgbago ntụkwasị obi ndị na-ere ahịa",
      title: "Ọkwa enwetara site n'omume, ọ bụghị nke a zụrụ ego.",
    },
    policySurfaces: {
      kicker: "Ebe iwu na-egosi",
      title: "Ụkpụrụ anyị na-eji eche onwe anyị.",
    },
    ecosystem: {
      kicker: "Mmemme ntụkwasị obi nke gbasaa n'ụlọ niile",
    },
  },
  help: {
    metadata: {
      title: "Ebe enyemaka — HenryCo Marketplace",
      description:
        "Lelee ajụjụ ndị ndị na-azụ ahịa na ndị na-ere ahịa na-ajụkarị. Ọ bụrụ na ị chọtaghị ihe ị chọrọ, mepee tiketi nkwado — mmadụ n'ime otu ga-agụ ya.",
    },
    hero: {
      kicker: "Ebe enyemaka",
      title: "Chọta azịza n'ime sekọnd ole na ole — ma ọ bụ kparịta okwu na mmadụ.",
      body: "Chọọ isiokwu ndị ndị na-azụ ahịa na ndị na-ere ahịa na-ajụkarị. Ọ bụrụ na ị chọtaghị ihe ị chọrọ, mepee tiketi nkwado n'okpuru ibe a, mmadụ n'otu ga-agụ ya.",
    },
    stillNeedHelp: {
      kicker: "Ka chọrọ enyemaka",
      title: "Mepee tiketi nkwado — mmadụ ga-agụ ya.",
      body: "Tiketi na-edobe ihe niile gbasara ya — iwu ahịa, onye na-ere, akụkọ esemokwu — ka otu na-arụ ọrụ na ya n'agbanyeghị ka ị deghachi ya na nzaghachi ọ bụla.",
      ctaLabel: "Mepee tiketi nkwado",
    },
  },
  sell: {
    metadata: {
      title: "Ree ahịa na HenryCo — ahịa a họpụtara maka ndị na-ere ahịa na-eduga na ntụkwasị obi",
      description:
        "Tinye akwụkwọ maka ire ahịa na HenryCo Marketplace: njikere nke dabere na ntụkwasị obi, ụlọ ahịa mara mma na otu ebe maka iwu ahịa, ịkwụ ụgwọ na nkwado.",
    },
    hero: {
      kicker: "Ree ahịa na HenryCo",
      title: "Nhọrọ site na atụmatụ. E meere ya maka ndị na-ere ahịa nke na-eduga na ntụkwasị obi.",
      body: "HenryCo Marketplace na-eburu ụzọ họrọ ndị na-ere ahịa na-eche maka ngosi, ndị nwere ntụkwasị obi na nnyefe, na ndị ji obi eziokwu na-echekwa ndị na-azụ ahịa. Ihe a chọrọ doro anya na ibe a; akwụkwọ ire ahịa na-aga n'ihu n'akaụntụ HenryCo gị.",
      primaryCta: "Mepee akwụkwọ ire ahịa",
      secondaryCta: "Lee ego ndị na-ere ahịa",
      signInCta: "Banye site na akaụntụ HenryCo",
      highlights: [
        { label: "Nhọrọ", value: "Nyocha aka, ọ bụghị ịkwụ ụgwọ idepụta" },
        { label: "Ụlọ ahịa", value: "Paspọtụ ntụkwasị obi ka ndị na-azụ ahịa hụ" },
        { label: "Ebe ọrụ", value: "Iwu ahịa, ịkwụ ụgwọ na nkwado n'otu ebe" },
      ],
    },
    advantages: {
      kicker: "Maka gịnị mere ndị na-ere ahịa siri ike ji emeri ebe a",
      items: [
        { title: "Njikere dabere na ntụkwasị obi", body: "Ụlọ ahịa gị na-enweta paspọtụ ntụkwasị obi pụtara ìhè, kama ka ọ ghara ifuru n'ime mkpọtụ ahịa na-adịghị elu." },
        { title: "Ụlọ ahịa nke ọma karịa", body: "Ụzọ nkọwa, ọchụchọ dị jụụ, na kaadị ngwa ahịa dị ọcha na-enyere ụlọ ahịa dị mma aka ịgbanwe ngwa ngwa." },
        { title: "Mmemme doro anya", body: "Ịkwụ ụgwọ, iwu ahịa, nkwado, nlekọta na ọkwa ngwa na-anọgide na-egosi n'otu ebe ọrụ kachasị ọcha." },
      ],
    },
    onboarding: {
      kicker: "Otu mmalite si arụ ọrụ",
      stepLabel: "Nzọụkwụ",
      steps: [
        { step: "01", title: "Bido akwụkwọ ire ahịa", body: "Mepee akwụkwọ ahụ site n'akaụntụ HenryCo gị — ndepụta na-echekwa onwe ya ka ị na-achịkọta ihe niile." },
        { step: "02", title: "Tinye nkọwa azụmaahịa", body: "Aha azụmaahịa, profaịlụ ụlọ ahịa, ihe nzukọ ngwa ahịa, na akwụkwọ nyocha ọ bụla na-akọwa ka i si emezu iwu ahịa." },
        { step: "03", title: "Nyochaa akwụkwọ", body: "Otu HenryCo na-enyocha akwụkwọ, ihe ịrịba ama ntụkwasị obi na njikere ụlọ ahịa — ọ bụghị naanị baajị akwụ ụgwọ." },
        { step: "04", title: "Mmebata onye na-ere ahịa", body: "Ndị enyere ohere na-aga n'ihu na mmebata, ebe ego, ụgwọ idepụta, oge nkwụ ụgwọ na iwu pụtara tupu ibido ibipụta." },
      ],
      callout: {
        eyebrow: "Akwụkwọ ire ahịa dị ọcha",
        body: "Ndebanye aha onye na-ere ahịa na-anọgide n'akaụntụ gị ka nkọwa azụmaahịa, ọnọdụ nyocha, na mmelite nkwado bụrụ nzuzo ma dị mfe iso.",
      },
    },
    plans: {
      kicker: "Akụnụba atụmatụ",
      title: "Ọkwa na-egosi tupu, ọ bụghị mgbe ibipụta gachara.",
      feeLabel: "Ụgwọ",
      payoutLabel: "Nkwụnye ego",
      includedLabel: "Etinyere",
      includedSuffix: "ndepụta",
      featuredLabel: "Edobere",
      featuredCurrencyPrefix: "NGN",
    },
    trustTiers: {
      kicker: "Ọkwa ntụkwasị obi na-agbanwe ihe nrite",
      title: "Nweta nkwụ ụgwọ ngwa ngwa, ụlọ ahịa buru ibu, na uru iwu.",
    },
    closing: {
      kicker: "Gaa n'ihu",
      title: "Tinye akwụkwọ, mgbe ahụ lelee ọnọdụ akwụkwọ gị site n'akaụntụ gị.",
      body: "Nnabata na-emepe mmebata onye na-ere ahịa. Ego, ụgwọ idepụta, na oge nkwụ ụgwọ na-egosi tupu ibipụta — enweghị ihe ijuanya nkwekọrịta nke ga-abịa ma emechaa.",
      primaryCta: "Bido akwụkwọ",
      secondaryCta: "Gaa n'ebe ọrụ ndị na-ere ahịa",
    },
  },
  sellPricing: {
    metadata: {
      title: "Ọnụahịa onye na-ere ahịa — HenryCo Marketplace",
      description:
        "Ụgwọ atụmatụ, ụgwọ idepụta, ụgwọ oghere edobere, ego nrụaka azụmaahịa na nhazi nkwụ ụgwọ — niile na-egosi mbụ, tupu ibipụta ngwaahịa, ọ bụghị emesia.",
    },
    hero: {
      kicker: "Ọnụahịa onye na-ere ahịa",
      title: "Akụnụba doro anya. Enweghị ụgwọ nzuzo.",
      body: "Ụgwọ atụmatụ, ụgwọ idepụta, ụgwọ oghere edobere, ego nrụaka na nhazi nkwụ ụgwọ — niile na-egosi mbụ, tupu ibipụta ngwaahịa gị, ọ bụghị emesia.",
      primaryCta: "Tinye akwụkwọ dị ka onye na-ere",
      secondaryCta: "Laghachi na nlele onye na-ere",
      statsLabels: {
        planTiers: "Ọkwa atụmatụ",
        trustTiers: "Ọkwa ntụkwasị obi",
        featuredSlots: "Oghere edobere",
      },
      featuredSlotsValue: "A na-elele otu otu",
    },
    plans: {
      kicker: "Atụmatụ na nlele ngwa ngwa",
      feeLabel: "Ụgwọ",
      payoutLabel: "Nkwụ ụgwọ",
      includedLabel: "Tinyere",
      includedSuffix: "ihe edepụtara",
      extraListingLabel: "Idepụta agbakwunyere",
      featuredSlotLabel: "Oghere edobere",
      currencyPrefix: "NGN",
      ctaPartner: "Kpọtụrụ maka usoro mmekọ",
      ctaTemplate: "Jiri {plan} bido",
    },
    economics: {
      kicker: "Otú HenryCo si akpata ego",
      title: "E kwupụtara mbụ, a wepụrụ n'ihu mmadụ.",
      items: [
        "A na-ewepụ ego nrụaka azụmaahịa n'otu otu nkwụghachi nke ìgwè iwu onye na-ere ahịa tupu ahapụ nkwụ ụgwọ.",
        "Ụgwọ idepụta na-amalite mgbe ọnụọgụ ihe edepụtara tinyere n'atụmatụ ọrụ nke onye na-ere ahịa kwụsịrị.",
        "Edobere ngwaahịa bụ arịrịọ akwụ ụgwọ dị iche ma na-anọgide n'okpuru nyocha ogo na ntụkwasị obi.",
        "A na-ewepụ ụgwọ nhazi nkwụ ụgwọ n'ime ndekọ nkwụghachi onye na-ere ahịa, ọ bụghị emesia ka ihe ijuanya.",
        "Ọrụ uru agbakwunyere nke Studio, Learn na Logistics na-emepe ụzọ ego ọzọ maka ndị na-ere ahịa.",
        "Mkpọsa nke onye njikwa na-elekọta na oghere a kwadoro na-anọgide ka enyochaa, ọ naghị aghọ ọgbaaghara onwe-ọrụ.",
      ],
    },
    trustTiers: {
      kicker: "Oge nkwụ ụgwọ dabere n'ọkwa ntụkwasị obi",
      title: "Omume ọma na-eme ka oge nkwụsị dị mkpụmkpụ.",
    },
    closing: {
      kicker: "Ị dị njikere ịtinye akwụkwọ?",
      title: "Akwụkwọ a na-emepe n'akaụntụ HenryCo gị.",
      body: "Ị nwere ike ichekwa edemede ma laghachi — ọnụahịa a na-egosi ebe a na-arụ ọrụ ozugbo mmebata onye na-ere zuru oke.",
      primaryCta: "Tinye akwụkwọ dị ka onye na-ere",
      secondaryCta: "Ụkpụrụ ntụkwasị obi",
    },
  },
  collections: {
    metadata: {
      titleTemplate: "{collection} — Ahịa HenryCo",
      descriptionTemplate:
        "Lelee {collection} n'elu Ahịa HenryCo — usoro ngwaahịa enyochara, jiri akara ntụkwasị obi, nkọwa nbuga doro anya, na paspọtụ ndị na-ere ahịa pụta ìhè tupu ịkwụ ụgwọ.",
      fallbackDescription:
        "Otu nchịkọta ahọpụtara n'Ahịa HenryCo, jikọtara ngwaahịa enyochara, akara ntụkwasị obi, nbuga doro anya, na paspọtụ ndị na-ere ahịa tupu ịkwụ ụgwọ.",
    },
    hero: {
      primaryCta: "Mepee nchọcha zuru oke",
      secondaryCta: "Ụkpụrụ ntụkwasị obi",
    },
    sidebar: {
      itemsLabel: "Ihe dị na nchịkọta",
      editedByLabel: "Onye haziri",
      editedByValue: "Ọrụ Ahịa HenryCo",
      buyerProtectionLabel: "Nchekwa onye azụ ahịa",
      buyerProtectionValue: "Ịkwụ ụgwọ esinyere n'isi",
    },
    rail: {
      kicker: "Ihe dị n'usoro ahụ",
      itemsSuffix: "ihe",
    },
  },
};

const YO: DeepPartial<MarketplacePublicCopy> = {
  cart: {
    pageIntro: {
      kicker: "Apo Ìrajà",
      title: "Apo ìrajà tó tóótun — àtúnṣe yára yára àti àlàyé tó mọ́ fún àwọn àṣẹ tí ó pín sí ọ̀pọ̀.",
      description:
        "Apo ìrajà náà ń jẹ́ kí àkójọpọ̀ àwọn olùtà ṣàfihàn dáadáa, ó ń ṣàtúnṣe ìye lójú-ẹsẹ̀, ó sì ń bá àpótí kéékèèkè (mini-cart) sọ̀rọ̀ pọ̀, kí àwọn olùra má baà sọnù ọ̀rọ̀ wọn nígbà tí wọ́n bá súnmọ́ ìparí ìrajà.",
    },
    emptyState: {
      title: "Apo ìrajà rẹ ṣì ṣófo.",
      body: "Fi nǹkan kún kíá láti orí káàdì ọjà, fi àwọn ohun pamọ́ fún ìgbà tó ń bọ̀ — apo ìrajà yóò máa wà ní ìmúdójúìwọ̀n nínú àpótí kéékèèkè àti nínú apo kíkún láìní àtúngbà ojú-ìwé.",
      ctaLabel: "Ṣàwárí àwọn ọjà",
    },
  },
  deals: {
    metadata: {
      title: "Àwọn àdínkù tí a fọwọ́sí — HenryCo Marketplace",
      description:
        "Àdínkù tí a yan nípasẹ̀ ìgbẹ́kẹ̀lé, dájúdájú ohun-ọjà tó wà ní ìpamọ́, àti ojúṣe olùtà. Lórí ojú-ìwé deals HenryCo, kìkì àwọn àkọsílẹ̀ tó a ti fọwọ́sí pẹ̀lú àmì ìgbẹ́kẹ̀lé mímọ́ ló máa farahàn.",
    },
    pageIntro: {
      kicker: "Àwọn àdínkù tí a fọwọ́sí",
      title: "Àdínkù tí a yan nípasẹ̀ ìgbẹ́kẹ̀lé, dájúdájú ohun-ọjà tó wà ní ìpamọ́, àti ojúṣe olùtà.",
      description:
        "A ò ní gbé àdínkù síwájú àfi tí ìbígbónijú àkọsílẹ̀, ìwé-ìrìnnà ìgbẹ́kẹ̀lé olùtà, àti ipò ohun-ọjà bá mọ́ tó láti dáàbò bo àṣeyọrí ìrajà àti láti dín ìbàjẹ́-ọkàn olùra kù.",
    },
    sectionLabel: "Àwọn àdínkù tí a fọwọ́sí",
    listEyebrow: "Àwọn àdínkù tí a fọwọ́sí",
    refreshNote: "A ń ṣàtúnṣe rẹ̀ déédéé",
    discountBadgePrefix: "−",
    emptyState: {
      title: "Kò sí àdínkù tí a ti fọwọ́sí nísinsìnyí",
      body: "Àwọn àdínkù tí a fọwọ́sí máa farahàn bí àwọn olùtà ṣe ń kọ wọ́n sílẹ̀. Padà wo wọ́n láìpẹ́.",
    },
  },
  brand: {
    eyebrow: "Àmì-ọjà",
    bodyFallback:
      "Ilé-ìtajà tí a ti fọwọ́sí lórí HenryCo Marketplace, pẹ̀lú àwọn àmì ìgbẹ́kẹ̀lé, àlàyé pípé fún ìfijíṣẹ́, àti ìwé-ìrìnnà olùtà tí ó hàn ṣáájú ìsanwó.",
    searchCta: "Ṣe ìwákiri nínú àmì-ọjà yìí",
    trustCta: "Ìlànà ìgbẹ́kẹ̀lé",
    stats: {
      activeProducts: "Àwọn ọjà tó ń ṣiṣẹ́",
      listingsReviewed: "Àwọn ìpolówó tí a yẹ̀ wò",
      listingsReviewedValue: "Ìwé-ìrìnnà ìgbẹ́kẹ̀lé hàn lórí ọjà kọ̀ọ̀kan",
      buyerProtection: "Ààbò Olùra",
      buyerProtectionValue: "Ìsanwó láti ọwọ́ alábojútó",
    },
    liveKicker: "Tààrà láti {brand}",
    openFullSearch: "Ṣí ìwákiri kíkún",
    metadataTitle: "{brand} — HenryCo Marketplace",
    metadataDescription:
      "Ṣàwárí àwọn ọjà tí a ti fọwọ́sí láti ọ̀dọ̀ {brand} lórí HenryCo Marketplace, pẹ̀lú àwọn àmì ìgbẹ́kẹ̀lé, àlàyé ìfijíṣẹ́, àti ìwé-ìrìnnà olùtà ṣáájú ìsanwó.",
  },
  category: {
    hero: {
      kicker: "Àyẹsí ẹka",
      searchCta: "Ṣàwárí nínú ẹka yìí",
      trustCta: "Wo àwọn ọgbọ́n ìgbẹ́kẹ̀lé",
      quickFiltersLabel: "Àyọkà yára",
    },
    stats: {
      activeListingsLabel: "Àkójọ tó wà lẹ́yìn iṣẹ́",
    },
    collectionsRail: {
      kicker: "Àkójọpọ̀ tí a yàn",
      title: "Àkójọpọ̀ tí ó ń mú kí ìpinnu ìrajà rọrùn.",
    },
    catalog: {
      kicker: "Ìtàn ẹka",
      title: "Ọjà tó tóótun, ètò tó ṣe kedere síi.",
      openSearch: "Ṣí àwárí kíkún",
    },
    metadata: {
      titleTemplate: "{category} — HenryCo Marketplace",
      descriptionTemplate:
        "Ṣàwárí àwọn ọjà tó jẹ́ ìmúdájú nínú {category} lórí HenryCo Marketplace, pẹ̀lú àmì ìgbẹ́kẹ̀lé, àlàyé ìfijiṣẹ́, àti ìwé-ìrìnnà olùtà tó wà ní ṣíṣí kí o tó san owó.",
      fallbackDescription:
        "Ṣàwárí ẹka tí a yàn pẹ̀lú àmọ̀ lórí HenryCo Marketplace, pẹ̀lú àmì ìgbẹ́kẹ̀lé, àlàyé ìfijiṣẹ́, àti ìwé-ìrìnnà olùtà kí o tó san owó.",
    },
  },
  trust: {
    metadata: {
      title: "Ìgbẹ́kẹ̀lé àti ààbò — HenryCo Marketplace",
      description:
        "Ìgbẹ́kẹ̀lé ló ń pinnu ohun tí olùtà lè ṣe, bí owó ṣe ń gbé, àti bí ìtọ́jú ṣe ń dáhùn. Ìpele olùtà, owó tí a fi pamọ́, àríyànjiyàn, àti ìtúsílẹ̀ owó gbogbo ń fi àkọsílẹ̀ silẹ̀ lórí sáfà.",
    },
    hero: {
      kicker: "Ìgbẹ́kẹ̀lé àti ààbò",
      title: "Ó hàn ṣáájú ìsanwó. A ó sì gbé e ṣiṣẹ́ lẹ́yìn náà.",
      body: "Ìgbẹ́kẹ̀lé ń darí ohun tí olùtà lè ṣe, bí owó ṣe ń gbé, àti bí ìtọ́jú ṣe ń dáhùn. Ìpele olùtà, ewu olùra, ìdíwọ̀n àkójọ ìpolówó, owó tí a fi pamọ́, àríyànjiyàn àti ìtúsílẹ̀ owó gbogbo ń fi àpapọ̀ àkọsílẹ̀ silẹ̀ lórí sáfà.",
      pillars: [
        { label: "Ìgbé owó", value: "Pamọ́, a ó tú u silẹ̀ lẹ́yìn àyẹ̀wò" },
        { label: "Àwọn ìṣọ́ra", value: "Tí a tì silẹ̀ lórí sáfà, a sì lè tọ́ wọn nínú àríyànjiyàn" },
        { label: "Ìpele", value: "Tí a jẹ́ pé bí a ti pa á, a sì lè gba á padà" },
      ],
    },
    guardrails: {
      kicker: "Awọn ààbò mẹ́rin",
      items: [
        {
          title: "Ìwé-ìrìnnà ìgbẹ́kẹ̀lé",
          body: "Gbogbo ilé-ìtajà àti gbogbo ọjà ń fihàn ìpele ìmúdájú, SLA, ìpín àríyànjiyàn, ìmúrasílẹ̀ ìsanwó, àti ìṣe ìfijíṣẹ́.",
        },
        {
          title: "Ìṣàkóso owó tí a fi pamọ́",
          body: "HenryCo ló ń kọ́kọ́ di owó olùra mu, lẹ́yìn náà ni a ó tú u silẹ̀ fún ìsanwó lẹ́yìn ìfijíṣẹ́ àti àyẹ̀wò ìgbẹ́kẹ̀lé.",
        },
        {
          title: "Ìwádìí ìpaniyàn àyíká",
          body: "Ìjì ìsanwó lójú òde, àwòran tí a tún ṣe, àfilọ́lẹ̀ ìpolówó tí ó pọ̀ jù àti àwòṣe ìsanwó tó léwu wọ̀ inú ìrí ipele ìwádìí.",
        },
        {
          title: "Ìtàn àwọn ohun tí a ṣe",
          body: "Ìfọwọ́sí, ìkọsílẹ̀, ìṣe ìtúsílẹ̀ owó, ìpinnu àríyànjiyàn àti àyẹ̀wò aládàá gbogbo ni a ó kọ́ silẹ̀ lórí sáfà.",
        },
      ],
    },
    sellerLadder: {
      kicker: "Àkàbà ìgbẹ́kẹ̀lé olùtà",
      title: "Ìpele tí a jẹ́ pé pẹ̀lú ìṣe, kì í ṣe pẹ̀lú owó.",
    },
    policySurfaces: {
      kicker: "Àwọn ojú-ìlànà",
      title: "Àwọn ìlànà tí àwa náà ń mú àra wa mọ́.",
    },
    ecosystem: {
      kicker: "Ìmúgbóòrò ìgbẹ́kẹ̀lé jákèjádò àwọn ìpèsè",
    },
  },
  help: {
    metadata: {
      title: "Ibùdó ìrànlọ́wọ́ — HenryCo Marketplace",
      description:
        "Ṣàwárí àwọn ìbéèrè tí àwọn olùra àti àwọn olùtà sábà máa ń bi. Tí o kò bá rí ohun tí o nílò, ṣí ìwé ìbéèrè ìrànlọ́wọ́, ẹnìkan láti inú ẹgbẹ́ yóò kà á.",
    },
    hero: {
      kicker: "Ibùdó ìrànlọ́wọ́",
      title: "Ríbi ìdáhùn ní ìsẹ̀jú àáyá díẹ̀ — tàbí sọ̀rọ̀ pẹ̀lú ènìyàn.",
      body: "Wá àwọn kókó tí àwọn olùra àti olùtà ń bi jù. Tí o kò bá rí ohun tí o nílò, ṣí ìwé ìbéèrè ìrànlọ́wọ́ ní ìsàlẹ̀ ojú-ìwé yìí, ẹnìkan láti inú ẹgbẹ́ yóò kà á.",
    },
    stillNeedHelp: {
      kicker: "Ṣì nílò ìrànlọ́wọ́",
      title: "Ṣí ìwé ìbéèrè ìrànlọ́wọ́, ènìyàn yóò kà á.",
      body: "Ìwé ìbéèrè máa ń di gbogbo àlàyé pọ̀ — ìpàṣẹ, olùtà, ìtàn àríyànjiyàn — kí ẹgbẹ́ lè ṣiṣẹ́ lórí ọ̀ràn náà láìjẹ́ kí o tún kọ ọ́ ní gbogbo ìdáhùn.",
      ctaLabel: "Ṣí ìwé ìbéèrè ìrànlọ́wọ́",
    },
  },
  sell: {
    metadata: {
      title: "Tàjà lórí HenryCo — ọjà tí a yàn fún àwọn olùtà tí ó ń darí ìgbẹ́kẹ̀lé",
      description:
        "Forúkọsílẹ̀ láti tà lórí HenryCo Marketplace: àfihàn tí ó dá lórí ìgbẹ́kẹ̀lé, àwọn ilé-ìtajà tó tóótun, àti àyè iṣẹ́ kan ṣoṣo fún àwọn àṣẹ, ìsanwó, àti ìrànlọ́wọ́.",
    },
    hero: {
      kicker: "Tàjà lórí HenryCo",
      title: "Ó yàn nínú ìṣètò. A ṣe é fún àwọn olùtà tí ó ń darí ìgbẹ́kẹ̀lé.",
      body: "HenryCo Marketplace fẹ́ràn àwọn olùtà tí ó ń bìkítà nípa ìfihàn, ìfijíṣẹ́ tí ó gbẹ́kẹ̀lé, àti ìdáàbòbò olùra ní òtítọ́. Ìwọ̀n náà hàn lójú ojú-ìwé yìí; ìwé ìfiránṣẹ́ olùtà yóò máa bá a lọ nínú àkántì HenryCo rẹ.",
      primaryCta: "Ṣí ìwé ìfiránṣẹ́ olùtà",
      secondaryCta: "Wo iye olùtà",
      signInCta: "Forúkọsílẹ̀ pẹ̀lú àkántì HenryCo",
      highlights: [
        { label: "Ìyàn", value: "Àyẹ̀wò ọwọ́, kì í ṣe ìsanwó láti darapọ̀" },
        { label: "Ilé-ìtajà", value: "Ìwé-ìrìnnà ìgbẹ́kẹ̀lé tí ó hàn fún olùra" },
        { label: "Àyè iṣẹ́", value: "Àṣẹ, ìsanwó, ìrànlọ́wọ́ nínú ibìkan" },
      ],
    },
    advantages: {
      kicker: "Èèṣe ti àwọn olùtà tí ó lágbára fi máa borí síbí",
      items: [
        { title: "Àfihàn tí ó dá lórí ìgbẹ́kẹ̀lé", body: "Ilé-ìtajà rẹ máa gba ìwé-ìrìnnà ìgbẹ́kẹ̀lé tí ó hàn, kì í ṣe pé yóò sọnù nínú ariwo ọjà tí kò dára." },
        { title: "Ilé-ìtajà tó dára ju lọ", body: "Àwọn ọ̀nà ìtejade, ìwákiri tí ó dákẹ́ jẹ́jẹ́, àti káàdì ọjà tí ó mọ́ máa ń ran ilé-ìtajà tí ó dára lọ́wọ́ láti yí padà yára." },
        { title: "Iṣẹ́ tí ó hàn kedere", body: "Ìsanwó, àṣẹ, ìrànlọ́wọ́, ìṣàkóso àti ìkìlọ̀ ọjà-ìpamọ́ wà ní àfihàn nínú àyè iṣẹ́ kan tó mọ́." },
      ],
    },
    onboarding: {
      kicker: "Bí ìbẹ̀rẹ̀ ṣe ń lọ",
      stepLabel: "Ìgbésẹ̀",
      steps: [
        { step: "01", title: "Bẹ̀rẹ̀ ìwé ìfiránṣẹ́ olùtà", body: "Ṣí ìwé náà láti inú àkántì HenryCo rẹ — àwọn àkọsílẹ̀ máa wà ní fífipamọ́ aládàáṣe nígbà tí o ń kó àwọn ìwífún jọ." },
        { step: "02", title: "Fi àwọn ẹ̀ka iṣẹ́ kún", body: "Orúkọ iṣẹ́, profàìlì ilé-ìtajà, ìdojúkọ ọjà, àti àwọn ìwé ìjẹ́rìí tí ó ṣàlàyé bí o ṣe ń mú àwọn àṣẹ ṣẹ." },
        { step: "03", title: "Àyẹ̀wò ìwé ìfiránṣẹ́", body: "Ẹgbẹ́ HenryCo ń ṣàyẹ̀wò àwọn ìwé, àwọn àmì ìgbẹ́kẹ̀lé, àti ìmúrasílẹ̀ ilé-ìtajà — kì í ṣe àmì tí ó san owó nìkan." },
        { step: "04", title: "Ìbẹ̀rẹ̀ olùtà", body: "Àwọn olùtà tí a fọwọ́sí máa tẹ̀síwájú sí ìbẹ̀rẹ̀, níbi tí àwọn iye, owó fíkún, àkókò ìsanwó, àti ìlànà ti hàn ṣáájú ìpolówó." },
      ],
      callout: {
        eyebrow: "Ìwé ìfiránṣẹ́ olùtà tí ó mọ́",
        body: "Ìforúkọsílẹ̀ olùtà wà nínú àkántì rẹ kí àwọn ìwífún iṣẹ́, ipò àyẹ̀wò, àti ìmúdójúìwọ̀n ìfọwọ́sí lè wà ní ìkọ̀kọ̀ kí o sì rọrùn láti tẹ̀lé.",
      },
    },
    plans: {
      kicker: "Èrò ọrọ̀-ajé àwọn ètò",
      title: "A sọ ìpele ní àkọ́kọ́, kì í ṣe lẹ́yìn ìpolówó.",
      feeLabel: "Owó",
      payoutLabel: "Ìsanwó",
      includedLabel: "Tí ó wà nínú",
      includedSuffix: "ìpolówó",
      featuredLabel: "Ìfihàn",
      featuredCurrencyPrefix: "NGN",
    },
    trustTiers: {
      kicker: "Ìpele ìgbẹ́kẹ̀lé yí àwọn àǹfààní padà",
      title: "Gba ìsanwó kíákíá, ilé-ìtajà tó tóbi, àti àwọn àǹfààní ìlànà.",
    },
    closing: {
      kicker: "Tẹ̀síwájú",
      title: "Forúkọsílẹ̀, lẹ́yìn náà wo ipò ìfiránṣẹ́ rẹ láti inú àkántì rẹ.",
      body: "Ìfọwọ́sí máa ṣí ìbẹ̀rẹ̀ olùtà. Iye, owó fíkún, àti àkókò ìsanwó hàn ṣáájú ìpolówó — kò sí àrùn àdéhùn tí ó máa wáyé lẹ́yìn náà.",
      primaryCta: "Bẹ̀rẹ̀ ìfiránṣẹ́",
      secondaryCta: "Bẹ̀ àyè olùtà wò",
    },
  },
  sellPricing: {
    metadata: {
      title: "Iye olùtà — HenryCo Marketplace",
      description:
        "Owó ètò, owó ìpolówó, owó àyè àkànṣe, ìpín ọjà, àti ìṣiṣẹ́ ìsanwó — gbogbo wọn ni a sọ ṣáájú, ṣáájú kí o tó tẹ ọjà jáde, kì í ṣe lẹ́yìn rẹ̀.",
    },
    hero: {
      kicker: "Iye olùtà",
      title: "Ọrọ̀-ajé ṣíṣe-kedere. Kò sí owó tó pamọ́.",
      body: "Owó ètò, owó ìpolówó, owó àyè àkànṣe, ìpín ọjà, àti ìṣiṣẹ́ ìsanwó — gbogbo wọn hàn ṣáájú kí o tó tẹ ọjà jáde, kì í ṣe lẹ́yìn rẹ̀.",
      primaryCta: "Forúkọsílẹ̀ gẹ́gẹ́ bí olùtà",
      secondaryCta: "Pa dà sí àkójọ olùtà",
      statsLabels: {
        planTiers: "Ipele ètò",
        trustTiers: "Ipele ìgbẹ́kẹ̀lé",
        featuredSlots: "Àyè àkànṣe",
      },
      featuredSlotsValue: "A ṣàyẹ̀wò ní ọ̀kọ̀ọ̀kan",
    },
    plans: {
      kicker: "Ètò ní ojú ẹyọ kan",
      feeLabel: "Owó",
      payoutLabel: "Ìsanwó",
      includedLabel: "Tó wà",
      includedSuffix: "ìpolówó",
      extraListingLabel: "Ìpolówó àfikún",
      featuredSlotLabel: "Àyè àkànṣe",
      currencyPrefix: "NGN",
      ctaPartner: "Bá wa sọ̀rọ̀ fún àdéhùn alábàápín",
      ctaTemplate: "Bẹ̀rẹ̀ pẹ̀lú {plan}",
    },
    economics: {
      kicker: "Bí HenryCo ṣe ń jèrè owó",
      title: "À ti sọ ṣáájú, à ń yọ kúrò ní ojú gbangba.",
      items: [
        "A ó yọ ìpín ọjà kúrò nínú ìpòkànpò ẹgbẹ́-àṣẹ olùtà kọ̀ọ̀kan kí a tó tú ìsanwó sílẹ̀.",
        "Owó ìpolówó máa wọ̀nà lẹ́yìn tí èdá ìpolówó tó wà nínú ètò tó ń ṣiṣẹ́ kúrò.",
        "Àkànṣe àyè jẹ́ ìbéèrè owó dá yà, ó sì wà lábẹ́ àyẹ̀wò ìmọ̀dájú àti ìgbẹ́kẹ̀lé.",
        "Owó ìṣiṣẹ́ ìsanwó ni a yọ kúrò nínú àpòpọ̀ ìpòkànpò olùtà, kò sí àrùn lẹ́yìn nà.",
        "Iṣẹ́ àfikún iye Studio, Learn àti Logistics ń ṣí ọ̀nà àfikún ti owó-wíwọlé fún olùtà.",
        "Ìpolówó tí oníṣẹ́ ń darí àti àyè tó ní onígbọ́wọ́ ń wà ní àyẹ̀wò, kì í ṣe rúdurùdu olùtìkára.",
      ],
    },
    trustTiers: {
      kicker: "Àkókò ìsanwó gẹ́gẹ́ bí ipele ìgbẹ́kẹ̀lé",
      title: "Ìwà tó dáadáa máa ń mú kí àkókò ìdádúró rẹlẹ̀.",
    },
    closing: {
      kicker: "Ṣé o ti ṣetán láti fọ̀wọ́sí?",
      title: "Ìfiránṣẹ́ máa ṣí nínú àkántì HenryCo rẹ.",
      body: "O lè tọ́jú ọ̀rọ̀ ìkọ̀wé, kí o sì pa dà — iye tí ó hàn níbí ní yóò ṣiṣẹ́ ní kété tí mmebata olùtà bá parí.",
      primaryCta: "Forúkọsílẹ̀ gẹ́gẹ́ bí olùtà",
      secondaryCta: "Ìlànà ìgbẹ́kẹ̀lé",
    },
  },
  collections: {
    metadata: {
      titleTemplate: "{collection} — Ọjà HenryCo",
      descriptionTemplate:
        "Ṣàwárí {collection} lórí Ọjà HenryCo — ètò àtìmọ̀le ti àwọn ọjà tí a ti fọwọ́sí, pẹ̀lú àwọn àmì ìgbẹ́kẹ̀lé, kíkọ̀ngbé ìfijíṣẹ́, àti pásípọ̀tì olùtà tí ó hàn ṣáájú ìsanwó.",
      fallbackDescription:
        "Àkójọpọ̀ tí a ṣe àtìmọ̀le lórí Ọjà HenryCo, pẹ̀lú àwọn ọjà tí a ti fọwọ́sí, àmì ìgbẹ́kẹ̀lé, ìfijíṣẹ́ tó kọ̀ngbé, àti pásípọ̀tì olùtà tí ó hàn ṣáájú ìsanwó.",
    },
    hero: {
      primaryCta: "Ṣí ìwákírí kíkún",
      secondaryCta: "Àwọn ìlànà ìgbẹ́kẹ̀lé",
    },
    sidebar: {
      itemsLabel: "Àwọn nǹkan nínú àkójọpọ̀",
      editedByLabel: "Ẹni tí ó ṣàtìmọ̀le",
      editedByValue: "Ìmọ̀ Ọjà HenryCo",
      buyerProtectionLabel: "Ààbò olùrà",
      buyerProtectionValue: "Ìsanwó nínú àbò",
    },
    rail: {
      kicker: "Ohun tí ó wà nínú ètò yìí",
      itemsSuffix: "nǹkan",
    },
  },
};

const HA: DeepPartial<MarketplacePublicCopy> = {
  cart: {
    pageIntro: {
      kicker: "Kanti",
      title: "Kanti mai inganci — gyare-gyare cikin sauri da bayyananniyar rabe-raben odar daga masu sayarwa daban-daban.",
      description:
        "Kanti yana nuna rukunin masu sayarwa a fili, yana sabunta yawan kayan da sauri, kuma yana ci gaba da haɗawa da ƙaramin kanti, don kada masu siye su rasa mahallin yayin kusan kammala biyan kuɗi.",
    },
    emptyState: {
      title: "Kanti ɗinka har yanzu fanko ne.",
      body: "Ƙara cikin sauri daga katunan kaya, ajiye abubuwa don baya, kuma kanti zai ci gaba da sabuntawa a cikin ƙaramin kanti da kanti cikakke ba tare da sake loda shafi ba.",
      ctaLabel: "Bincika kayayyaki",
    },
  },
  deals: {
    metadata: {
      title: "Tayin da aka tabbatar — HenryCo Marketplace",
      description:
        "Ragi da aka tace bisa amincewa, tabbacin kayan a cikin ɗakin ajiya, da ɗawainiyar mai sayarwa. A shafin tayin HenryCo, sai jeren da aka tabbatar wanda yake da alamomin amincewa masu tsabta ne kawai suke fitowa.",
    },
    pageIntro: {
      kicker: "Tayin da aka tabbatar",
      title: "Ragi da aka tace bisa amincewa, tabbacin kayan a cikin ɗakin ajiya, da ɗawainiyar mai sayarwa.",
      description:
        "Muna nuna tayi ne kawai lokacin da ingancin jeren, fasfo na amincewar mai sayarwa, da yanayin kayan suke da tsabta isa don kāre cikakken siye da rage damuwar mai siye daga baya.",
    },
    sectionLabel: "Tayin da aka tabbatar",
    listEyebrow: "Tayin da aka tabbatar",
    refreshNote: "Ana sabuntawa akai-akai",
    discountBadgePrefix: "−",
    emptyState: {
      title: "Babu tayin da aka tabbatar a yanzu",
      body: "Ragi da aka tabbatar suna shigowa yayin da masu sayarwa suke jera su. Dawo nan ba da daɗewa ba.",
    },
  },
  category: {
    hero: {
      kicker: "Zaɓin nau'i",
      searchCta: "Nemo a cikin wannan nau'in",
      trustCta: "Duba ƙa'idodin amintacce",
      quickFiltersLabel: "Tace cikin sauri",
    },
    stats: {
      activeListingsLabel: "Tallace-tallace masu aiki",
    },
    collectionsRail: {
      kicker: "Tarin da aka zaɓa",
      title: "Tari da ke sauƙaƙe shawarar siyayya.",
    },
    catalog: {
      kicker: "Katalogin nau'i",
      title: "Kayayyaki masu inganci, tsari mafi sauƙin karantawa.",
      openSearch: "Buɗe cikakken bincike",
    },
    metadata: {
      titleTemplate: "{category} — HenryCo Marketplace",
      descriptionTemplate:
        "Bincika tabbatattun kayayyaki a cikin {category} a HenryCo Marketplace, tare da alamomin amintacce, bayyananniyar bayanin isarwa, da fasfo ɗin mai sayarwa kafin biya.",
      fallbackDescription:
        "Bincika zaɓaɓɓen nau'i a HenryCo Marketplace tare da alamomin amintacce, bayyananniyar bayanin isarwa, da fasfo ɗin mai sayarwa kafin biya.",
    },
  },
  trust: {
    metadata: {
      title: "Aminci da tsaro — HenryCo Marketplace",
      description:
        "Amincin shi ke tantance abin da mai sayarwa zai iya yi, yadda kuɗi suke gudana, da kuma yadda kulawa take amsawa. Matakan mai sayarwa, ajiyar amana, jayayya da sakin kuɗaɗen biya duk suna barin tarihi a sabar.",
    },
    hero: {
      kicker: "Aminci da tsaro",
      title: "A bayyane kafin biya. A tabbatar bayan biya.",
      body: "Amincin yana sarrafa abin da mai sayarwa zai iya yi, yadda kuɗi suke gudana, da kuma yadda kulawa take amsawa. Matakan mai sayarwa, haɗarin mai siye, kimar tallace-tallace, ajiyar amana, jayayya da sakin kuɗaɗen biya duk suna barin tarihin sabar.",
      pillars: [
        { label: "Hannukan kuɗi", value: "Ajiye a amana, a saki bayan binciken aminci" },
        { label: "Ra'ayoyi", value: "An ajiye su a sabar, kuma za a iya bin diddiginsu a jayayya" },
        { label: "Matakai", value: "An samu su ne saboda hali, ana iya soke su" },
      ],
    },
    guardrails: {
      kicker: "Garkuwoyi huɗu",
      items: [
        {
          title: "Fasfo na aminci",
          body: "Kowane kanti da kowane kayan suna nuna matakin tabbatarwa, SLA, adadin jayayya, shirin biya, da matsayin isarwa.",
        },
        {
          title: "Sarrafa ajiyar amana",
          body: "Kuɗin mai siye yana farkon zama a hannun HenryCo, sannan kawai ya zama mai saki bayan an tabbatar da isarwa da bincike na aminci.",
        },
        {
          title: "Bincike kan zamba",
          body: "Sake biyan kuɗi a wajen dandalin, kafofin watsa labarai masu maimaitawa, hauhawar tallace-tallace, da samfuran biya masu haɗari duk suna shiga layin bincike.",
        },
        {
          title: "Hanyoyin gwajin tarihi",
          body: "Yardar, ƙin yarda, ayyukan biya, hukunce-hukuncen jayayya da binciken ta atomatik duk an rubuta su a sabar.",
        },
      ],
    },
    sellerLadder: {
      kicker: "Tsani na amincin mai sayarwa",
      title: "Matakai da aka samu ta hanyar hali, ba ta hanyar kuɗi ba.",
    },
    policySurfaces: {
      kicker: "Mahallin manufofin",
      title: "Ƙa'idodin da muka ɗora wa kanmu.",
    },
    ecosystem: {
      kicker: "Ƙarfafa aminci a duk muhalli",
    },
  },
  help: {
    metadata: {
      title: "Cibiyar taimako — HenryCo Marketplace",
      description:
        "Karanta tambayoyin da masu siye da masu sayarwa suka fi yawan yi. Idan ba ka samu abin da kake nema ba, buɗe tikitin tallafi, wani daga ƙungiyar zai karanta shi.",
    },
    hero: {
      kicker: "Cibiyar taimako",
      title: "Samu amsa cikin daƙiƙa kaɗan — ko yi magana da mutum.",
      body: "Nemo batutuwan da masu siye da masu sayarwa suka fi yawan tambaya. Idan ba ka samu abin da kake bukata ba, buɗe tikitin tallafi a ƙarshen wannan shafin, wani daga ƙungiyar zai karanta shi.",
    },
    stillNeedHelp: {
      kicker: "Har yanzu kana bukatar taimako",
      title: "Buɗe tikitin tallafi — mutum zai karanta shi.",
      body: "Tikiti yana ajiye dukkan mahallin tare — odar, mai sayarwa, tarihin sabani — domin ƙungiyar ta yi aiki a kan al'amarin ba tare da ka sake rubuta shi a kowane amsa ba.",
      ctaLabel: "Buɗe tikitin tallafi",
    },
  },
  sell: {
    metadata: {
      title: "Sayar a HenryCo — kasuwa zaɓaɓɓa ga masu sayar da ke jagorancin amincewa",
      description:
        "Nemi izinin sayarwa a HenryCo Marketplace: matsayi da aka kafa kan amincewa, shagunan inganci, da wuri ɗaya don odoji, biyan kuɗi da tallafi.",
    },
    hero: {
      kicker: "Sayar a HenryCo",
      title: "Zaɓaɓɓa daga tushe. An gina ta don masu sayarwa da ke jagorancin amincewa.",
      body: "HenryCo Marketplace yana fifita masu sayarwa da ke kula da gabatarwa, masu kuɗi a isarwa da masu gaskiya wajen kare mai siye. Sharuɗɗan a fili suke a wannan shafin; aikace-aikacen mai sayarwa zai ci gaba a cikin asusunka na HenryCo.",
      primaryCta: "Buɗe aikace-aikacen mai sayarwa",
      secondaryCta: "Duba farashin mai sayarwa",
      signInCta: "Shiga da asusun HenryCo",
      highlights: [
        { label: "Zaɓi", value: "Bita ta hannu, ba listing mai biyan kuɗi ba" },
        { label: "Shago", value: "Fasfo ɗin amincewa wanda masu siye ke iya gani" },
        { label: "Wurin aiki", value: "Odoji, biyan kuɗi da tallafi a wuri ɗaya" },
      ],
    },
    advantages: {
      kicker: "Me ya sa masu sayarwa masu ƙarfi ke nasara a nan",
      items: [
        { title: "Matsayi da aka kafa kan amincewa", body: "Shagonka yana samun fasfon amincewa a fili, maimakon ya ɓace cikin hayaniyar kasuwa marar inganci." },
        { title: "Mafi kyawun ingancin shago", body: "Layukan edita, bincike mai natsuwa, da katunan kayayyaki masu tsabta suna taimaka wa shaguna masu inganci su juyar da abokan ciniki cikin sauri." },
        { title: "Aiki mai tsabta", body: "Biyan kuɗi, odoji, tallafi, sa ido, da gargaɗin kayan ajiya su kasance a sarari a cikin wuri ɗaya na aiki." },
      ],
    },
    onboarding: {
      kicker: "Yadda fara aiki ke gudana",
      stepLabel: "Mataki",
      steps: [
        { step: "01", title: "Fara aikace-aikacen mai sayarwa", body: "Buɗe aikace-aikacen daga asusunka na HenryCo — daftarin yana ajiyewa kai tsaye yayin da kake tara cikakkun bayanai." },
        { step: "02", title: "Ƙara cikakkun bayanan kasuwanci", body: "Sunan kasuwanci, bayanin shago, mai da hankali kan samfuri, da duk wani takardun tabbatarwa da ke bayyana yadda kake cika odoji." },
        { step: "03", title: "Bita na aikace-aikacen", body: "Ƙungiyar HenryCo tana bitar takardu, alamomin amincewa, da shirin shago — ba kawai alamar biyan kuɗi ba." },
        { step: "04", title: "Fara aikin mai siyarwa", body: "Masu sayarwa da aka amince da su za su ci gaba zuwa fara aiki inda farashi, kudin shigarwa, lokutan biyan kuɗi da ƙa'idoji ke a sarari kafin a fara bugawa." },
      ],
      callout: {
        eyebrow: "Aikace-aikacen mai sayarwa mai tsabta",
        body: "Rajistar mai sayarwa tana zama a cikin asusunka, don haka cikakkun bayanan kasuwanci, matsayin bita, da sabuntawar amincewa su kasance masu zaman kansu kuma masu sauƙin bibiya.",
      },
    },
    plans: {
      kicker: "Tattalin arzikin tsare-tsare",
      title: "An faɗi matakai a gaba, ba bayan an buga ba.",
      feeLabel: "Kuɗi",
      payoutLabel: "Biya",
      includedLabel: "An haɗa",
      includedSuffix: "tallace-tallace",
      featuredLabel: "Mai ƙayatarwa",
      featuredCurrencyPrefix: "NGN",
    },
    trustTiers: {
      kicker: "Matakan amincewa suna canza gata",
      title: "Sami biyan kuɗi cikin sauri, shaguna masu girma, da fa'idodin manufa.",
    },
    closing: {
      kicker: "Ci gaba",
      title: "Yi aikace-aikacen, sannan ka bi matsayin daga asusunka.",
      body: "Amincewa yana buɗe shirin mai sayarwa. Farashi, kudin shigarwa, da lokutan biyan kuɗi suna nan a sarari kafin ka buga — babu mamaki na kwangila daga baya.",
      primaryCta: "Fara aikace-aikacen",
      secondaryCta: "Ziyarci wurin aiki na mai sayarwa",
    },
  },
  sellPricing: {
    metadata: {
      title: "Farashin mai sayarwa — HenryCo Marketplace",
      description:
        "Kudin tsari, kudin shigarwa, kudin matsayi na musamman, kwamishan kasuwanci da sarrafa biyan kuɗi — duk ana ambata su a gaba, kafin a buga kayan, ba bayan ba.",
    },
    hero: {
      kicker: "Farashin mai sayarwa",
      title: "Tattalin arziki a sarari. Babu kuɗin ɓoye.",
      body: "Kudin tsari, kudin shigarwa, kudin matsayi na musamman, kwamishan kasuwanci da sarrafa biyan kuɗi — duk ana ambata su a gaba kafin ka buga kayanka, ba bayan ba.",
      primaryCta: "Nemi a matsayin mai sayarwa",
      secondaryCta: "Koma ga taƙaitaccen mai sayarwa",
      statsLabels: {
        planTiers: "Matakan tsari",
        trustTiers: "Matakan amana",
        featuredSlots: "Wuraren musamman",
      },
      featuredSlotsValue: "Ana bita ɗaya-ɗaya",
    },
    plans: {
      kicker: "Tsare-tsare a kallon daya",
      feeLabel: "Kuɗi",
      payoutLabel: "Biya",
      includedLabel: "An haɗa",
      includedSuffix: "shigarwa",
      extraListingLabel: "Ƙarin shigarwa",
      featuredSlotLabel: "Wurin musamman",
      currencyPrefix: "NGN",
      ctaPartner: "Tuntube mu don sharuɗɗan abokin tarayya",
      ctaTemplate: "Fara da {plan}",
    },
    economics: {
      kicker: "Yadda HenryCo ke samun kuɗi",
      title: "An ambato a gaba, an cire a sarari.",
      items: [
        "Ana cire kwamishan kasuwanci daga kowane biyan ƙungiya-oda ta mai sayarwa kafin a saki biyan.",
        "Kudin shigarwa na fara aiki bayan an gama ƙididdigar shigarwa da ke ciki na tsarin mai sayarwa.",
        "Matsayi na musamman shi ne buƙatar biya daban, kuma yana ƙarƙashin bita na inganci da amana.",
        "Ana cire kudin sarrafa biyan a ciki na taƙaitaccen biyan mai sayarwa, ba daga baya da mamaki ba.",
        "Hidimomin ƙarin daraja na Studio, Learn da Logistics suna buɗe ƙarin hanyoyin kuɗi ga masu sayarwa.",
        "Yaƙin neman wanda ma'aikaci ke gudanarwa da wuraren tallafi suna nan a buɗe don binciken, ba mai rikici na yi-da-kanka ba.",
      ],
    },
    trustTiers: {
      kicker: "Lokacin biyan bisa matakin amana",
      title: "Halayya mafi kyau na rage tsawon riƙewa.",
    },
    closing: {
      kicker: "Shirye don nema?",
      title: "Aikace-aikacen yana buɗewa a cikin asusun HenryCo naka.",
      body: "Za ka iya adana zane ka dawo — farashin da yake bayyana anan zai fara aiki da zaran an gama shigar mai sayarwa.",
      primaryCta: "Nemi a matsayin mai sayarwa",
      secondaryCta: "Matsayin amana",
    },
  },
  collections: {
    metadata: {
      titleTemplate: "{collection} — Kasuwar HenryCo",
      descriptionTemplate:
        "Bincika {collection} a Kasuwar HenryCo — zaɓaɓɓun kayayyaki masu tantancewa, tare da alamomin amincewa, kyakkyawan bayanin isarwa, da fasfo na masu sayarwa kafin biyan kuɗi.",
      fallbackDescription:
        "Tarin zaɓaɓɓu a Kasuwar HenryCo, da kayayyaki masu tantancewa, alamomin amincewa, isarwa mai sarari, da fasfo na masu sayarwa da ake gani kafin biyan kuɗi.",
    },
    hero: {
      primaryCta: "Buɗe cikakken bincike",
      secondaryCta: "Matakan amincewa",
    },
    sidebar: {
      itemsLabel: "Abubuwa cikin tarin",
      editedByLabel: "Wanda ya tsara",
      editedByValue: "Sashen aiki na Kasuwa",
      buyerProtectionLabel: "Kariyar mai siye",
      buyerProtectionValue: "Biyan kuɗi ta hannun amintacce",
    },
    rail: {
      kicker: "Abin da ke cikin wannan zaɓi",
      itemsSuffix: "abubuwa",
    },
  },
};

const LOCALE_PARTIALS: Partial<Record<AppLocale, DeepPartial<MarketplacePublicCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  de: DE,
  it: IT,
  ar: AR,
  zh: ZH,
  hi: HI,
  ig: IG,
  yo: YO,
  ha: HA,
};

export function getMarketplacePublicCopy(locale: AppLocale): MarketplacePublicCopy {
  if (locale === "en") return EN;
  const partial = LOCALE_PARTIALS[locale];
  if (!partial) return EN;
  return deepMergeMessages(EN, partial as Partial<MarketplacePublicCopy>);
}

export function translateMarketplacePublicLabel(locale: AppLocale, label: string) {
  return translateSurfaceLabel(locale, label);
}
