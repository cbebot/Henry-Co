import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * Customer-facing copy for the marketplace buyer account surfaces
 * (overview, addresses, orders, disputes, following, notifications,
 * payments, saved, support, wishlist + the addresses/reviews clients).
 *
 * One top-level key per file/component; nested keys per string. The brand
 * names "HenryCo" and "Henry & Co." are kept VERBATIM in every locale.
 */
export type MarketplaceCustomerAccountCopy = {
  overview: {
    titleNamed: string; // {name}'s marketplace activity
    titleFallback: string;
    description: string;
    trackOrder: string;
    continueShopping: string;
    snapshotLabel: string;
    kpiActiveOrders: string;
    kpiActiveHintSingular: string; // {count} order still in motion.
    kpiActiveHintPlural: string; // {count} orders still in motion.
    kpiActiveHintEmpty: string;
    kpiInTransit: string;
    kpiInTransitHint: string;
    kpiInTransitHintEmpty: string;
    kpiSavedItems: string;
    kpiSavedHint: string;
    kpiSavedHintEmpty: string;
    kpiFollowing: string;
    kpiFollowingHintSingular: string; // {count} store you follow for drops.
    kpiFollowingHintPlural: string; // {count} stores you follow for drops.
    kpiFollowingHintEmpty: string;
    quickActionsLabel: string;
    qaTrackEyebrow: string;
    qaTrackTitle: string;
    qaTrackBody: string;
    qaSavedEyebrow: string;
    qaSavedTitle: string;
    qaSavedBody: string;
    qaProfileEyebrow: string;
    qaProfileTitle: string;
    qaProfileBody: string;
    qaApplicationEyebrow: string;
    qaApplicationTitle: string;
    qaApplicationBodyStatus: string; // Status: {status}.
    qaSellerEyebrow: string;
    qaSellerTitle: string;
    qaSellerBody: string;
    recentOrdersKicker: string;
    recentOrdersHeading: string;
    recentOrdersHeadingEmpty: string;
    viewAll: string;
    orderLabel: string; // Order {orderNo}
    placedRelative: string; // Placed {relative}
    storesSuffixSingular: string; // {count} store
    storesSuffixPlural: string; // {count} stores
    viewOrder: string;
    emptyOrdersBody: string;
    browseMarketplace: string;
    savedKicker: string;
    savedHeading: string;
    savedHeadingEmpty: string;
    openWishlist: string;
    emptySavedBody: string;
    followingKicker: string;
    followingHeading: string;
    followingHeadingEmpty: string;
    emptyFollowingBody: string;
    verifiedSuffix: string; // {level} verified
    verifiedVendor: string;
    responseSuffix: string; // {hours}h response
    activityKicker: string;
    activityHeading: string;
    activityHeadingEmpty: string;
    emptyActivityBody: string;
    newBadge: string;
    quickActionOpen: string;
    relativeJustNow: string;
    relativeMinutes: string; // {value}m ago
    relativeHours: string; // {value}h ago
    relativeDays: string; // {value}d ago
    relativeMonths: string; // {value}mo ago
    relativeYears: string; // {value}y ago
    buyerFallback: string;
  };
  addresses: {
    title: string;
    description: string;
    movedStrong: string;
    movedBefore: string;
    movedLink: string;
    movedAfter: string;
  };
  disputes: {
    title: string;
    description: string;
    orderPlaceholder: string;
    vendorPlaceholder: string;
    reasonPlaceholder: string;
    notePlaceholder: string;
    openDispute: string;
    emptyTitle: string;
    emptyBody: string;
  };
  following: {
    title: string;
    description: string;
    toastUnfollowed: string;
    toastFollowed: string;
    unfollow: string;
    emptyTitle: string;
    emptyBody: string;
    emptyCta: string;
  };
  notifications: {
    title: string;
    description: string;
    emptyTitle: string;
    emptyBody: string;
  };
  orders: {
    title: string;
    description: string;
    emptyTitle: string;
    emptyBody: string;
  };
  orderDetail: {
    description: string;
    placed: string;
    total: string;
    payment: string;
    henrycoSegment: string;
    fulfillment: string;
    tracking: string;
    trackingPending: string;
    payoutStatus: string;
    protectionKicker: string;
    protectionBody: string;
    confirmCompletion: string;
  };
  payments: {
    title: string;
    description: string;
    method: string;
    reference: string;
    proof: string;
    viewProof: string;
    walletDebitRecorded: string;
    notUploaded: string;
    awaitingReview: string;
    emptyTitle: string;
    emptyBody: string;
  };
  saved: {
    title: string;
    description: string;
    emptyTitle: string;
    emptyBody: string;
    emptyCta: string;
    savedItemFallback: string;
    savedRelative: string; // Saved {relative}
    restoreToCart: string;
    clear: string;
    removeAria: string;
  };
  support: {
    title: string;
    description: string;
    threadOpened: string;
    submittedHeading: string;
    submittedBody: string;
    openTicketKicker: string;
    storePrefix: string; // Store · {name}
    formHeading: string;
    formIntro: string;
    yourName: string;
    replyToEmail: string;
    thisIsAbout: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    whatHappened: string;
    whatHappenedPlaceholder: string;
    orderNumberOptional: string;
    orderNumberPlaceholder: string;
    openTheTicket: string;
    backToHelp: string;
    privacyNote: string;
    orEmail: string; // Or email {email}
    subjectOrder: string;
    subjectPayment: string;
    subjectVendor: string;
    subjectAccount: string;
    subjectTrust: string;
    subjectOther: string;
    openThreadsHeading: string;
    activeSuffix: string; // {count} active
    closedHeading: string;
    resolvedSuffix: string; // {count} resolved
    noOpenThreadsTitle: string;
    noOpenThreadsBody: string;
    updatedRelative: string; // Updated {relative}
    noTicketsTitle: string;
    noTicketsBody: string;
    noTicketsCta: string;
  };
  wishlist: {
    title: string;
    description: string;
    toastRemoved: string;
    toastSaved: string;
    remove: string;
    emptyTitle: string;
    emptyBody: string;
    emptyCta: string;
  };
  addressesClient: {
    headingEdit: string;
    headingAdd: string;
    introTitle: string;
    introBody: string;
    labelPlaceholder: string;
    recipientPlaceholder: string;
    phonePlaceholder: string;
    cityPlaceholder: string;
    regionPlaceholder: string;
    countryPlaceholder: string;
    line1Placeholder: string;
    line2Placeholder: string;
    setDefault: string;
    saving: string;
    savingLabel: string;
    updateAddress: string;
    saveAddress: string;
    cancelEdit: string;
    emptyTitle: string;
    emptyBody: string;
    defaultBadge: string;
    edit: string;
    setDefaultAction: string;
    deleteAction: string;
    updatingDefaultLabel: string;
    deletingLabel: string;
    saveFailed: string;
    actionFailed: string;
    toastUpdated: string;
    toastSaved: string;
    toastUpdatedDefaultBody: string;
    toastSavedBody: string;
    toastSaveFailed: string;
    toastRemoved: string;
    toastDefaultUpdated: string;
    toastActionFailed: string;
  };
  reviewsClient: {
    policyTitle: string;
    policyBody: string;
    selectProduct: string;
    starSingular: string; // {rating} star
    starPlural: string; // {rating} stars
    titlePlaceholder: string;
    bodyPlaceholder: string;
    submitting: string;
    submittingLabel: string;
    submitReview: string;
    emptyTitle: string;
    emptyBody: string;
    verifiedPurchase: string;
    awaitingModeration: string;
    submitFailed: string;
    toastPublished: string;
    toastSubmitted: string;
    toastPublishedBody: string;
    toastPendingBody: string;
    toastSubmitFailed: string;
  };
};

const EN: MarketplaceCustomerAccountCopy = {
  overview: {
    titleNamed: "{name}'s marketplace activity",
    titleFallback: "Marketplace activity",
    description:
      "Orders, saved items, store follows, and account activity in one calmer view. HenryCo unifies these signals across divisions so the trail stays attached to the same account.",
    trackOrder: "Track an order",
    continueShopping: "Continue shopping",
    snapshotLabel: "Account snapshot",
    kpiActiveOrders: "Active orders",
    kpiActiveHintSingular: "{count} order still in motion.",
    kpiActiveHintPlural: "{count} orders still in motion.",
    kpiActiveHintEmpty: "No orders in motion right now.",
    kpiInTransit: "In transit",
    kpiInTransitHint: "Tracked through dispatch and delivery.",
    kpiInTransitHintEmpty: "Once an order ships, it lands here.",
    kpiSavedItems: "Saved items",
    kpiSavedHint: "Pieces you've kept an eye on.",
    kpiSavedHintEmpty: "Heart anything to start a wishlist.",
    kpiFollowing: "Following",
    kpiFollowingHintSingular: "{count} store you follow for drops.",
    kpiFollowingHintPlural: "{count} stores you follow for drops.",
    kpiFollowingHintEmpty: "Follow stores to catch new drops first.",
    quickActionsLabel: "Quick actions",
    qaTrackEyebrow: "Track",
    qaTrackTitle: "Track an order",
    qaTrackBody: "Look up an order by its reference code.",
    qaSavedEyebrow: "Saved",
    qaSavedTitle: "Open wishlist",
    qaSavedBody: "Pieces you saved, ready to revisit.",
    qaProfileEyebrow: "Profile",
    qaProfileTitle: "Manage addresses",
    qaProfileBody: "Default delivery and saved locations.",
    qaApplicationEyebrow: "Application",
    qaApplicationTitle: "Continue your seller application",
    qaApplicationBodyStatus: "Status: {status}.",
    qaSellerEyebrow: "Become a seller",
    qaSellerTitle: "Apply to sell on HenryCo",
    qaSellerBody: "Reach buyers across the HenryCo ecosystem.",
    recentOrdersKicker: "Recent orders",
    recentOrdersHeading: "Latest activity from your purchases",
    recentOrdersHeadingEmpty: "Your orders will live here",
    viewAll: "View all",
    orderLabel: "Order {orderNo}",
    placedRelative: "Placed {relative}",
    storesSuffixSingular: "{count} store",
    storesSuffixPlural: "{count} stores",
    viewOrder: "View",
    emptyOrdersBody:
      "You haven't placed an order yet. Browse the marketplace to find verified stores and curated drops.",
    browseMarketplace: "Browse marketplace",
    savedKicker: "Saved items",
    savedHeading: "Pieces you kept an eye on",
    savedHeadingEmpty: "Your wishlist is empty",
    openWishlist: "Open wishlist",
    emptySavedBody:
      "Heart products you want to revisit. They'll wait for you in your account alongside your orders and follows.",
    followingKicker: "Following",
    followingHeading: "Stores you watch",
    followingHeadingEmpty: "Follow stores to catch drops first",
    emptyFollowingBody:
      "Tap the store name on a product page to follow. We'll surface their next drop here.",
    verifiedSuffix: "{level} verified",
    verifiedVendor: "Verified vendor",
    responseSuffix: "{hours}h response",
    activityKicker: "Recent activity",
    activityHeading: "Updates from your account",
    activityHeadingEmpty: "Activity will land here",
    emptyActivityBody:
      "Order confirmations, dispatch updates, and store messages will appear here.",
    newBadge: "New",
    quickActionOpen: "Open",
    relativeJustNow: "just now",
    relativeMinutes: "{value}m ago",
    relativeHours: "{value}h ago",
    relativeDays: "{value}d ago",
    relativeMonths: "{value}mo ago",
    relativeYears: "{value}y ago",
    buyerFallback: "Buyer",
  },
  addresses: {
    title: "Addresses",
    description:
      "Saved addresses stay tied to the shared account so future HenryCo services can reuse the same customer context.",
    movedStrong: "The address book moved.",
    movedBefore:
      "To add or edit an address with Google Places verification + KYC alignment, please use",
    movedLink: "your account settings",
    movedAfter: "Existing marketplace addresses stay readable here for legacy orders.",
  },
  disputes: {
    title: "Disputes",
    description:
      "Open an issue with context, keep the order linked, and see support-stage updates without losing the trail.",
    orderPlaceholder: "MKT-ORD-...",
    vendorPlaceholder: "Vendor slug (optional)",
    reasonPlaceholder: "Reason for dispute",
    notePlaceholder: "Explain what went wrong and what resolution you expect.",
    openDispute: "Open dispute",
    emptyTitle: "No open disputes.",
    emptyBody:
      "When you raise an issue with an order, the thread lives here with status updates from the support stage — nothing falls off the trail.",
  },
  following: {
    title: "Following",
    description:
      "Followed stores persist into the account record so merchandising and re-engagement can stay contextual instead of generic.",
    toastUnfollowed: "Unfollowed store.",
    toastFollowed: "Now following store.",
    unfollow: "Unfollow store",
    emptyTitle: "No followed stores yet.",
    emptyBody: "Follow a store to keep its trust passport and latest offers close.",
    emptyCta: "Discover stores",
  },
  notifications: {
    title: "Notifications",
    description:
      "In-app, email, and WhatsApp lifecycle updates are designed to show up here as a single readable account timeline.",
    emptyTitle: "No notifications yet.",
    emptyBody: "Marketplace lifecycle updates will appear here.",
  },
  orders: {
    title: "Orders",
    description:
      "Each order keeps payment state, split fulfillment, and dispute context visible in one buyer-friendly timeline.",
    emptyTitle: "No orders yet.",
    emptyBody:
      "The order history surface is ready. Once you check out, split-order tracking and payment verification history will show up here.",
  },
  orderDetail: {
    description:
      "Split-order clarity stays visible with vendor-level fulfillment and payment state broken out separately.",
    placed: "Placed",
    total: "Total",
    payment: "Payment",
    henrycoSegment: "HenryCo segment",
    fulfillment: "Fulfillment",
    tracking: "Tracking",
    trackingPending: "Pending",
    payoutStatus: "Payout status",
    protectionKicker: "Buyer protection control",
    protectionBody:
      "Confirm completion when the delivered order is satisfactory. HenryCo keeps seller payout in escrow until confirmation or timeout logic clears the segment.",
    confirmCompletion: "Confirm completion",
  },
  payments: {
    title: "Payments",
    description:
      "Payment verification stays visible next to the order reference so bank-transfer review never feels opaque.",
    method: "Method",
    reference: "HenryCo reference",
    proof: "Proof",
    viewProof: "View proof",
    walletDebitRecorded: "Wallet debit recorded",
    notUploaded: "Not uploaded",
    awaitingReview: "Awaiting review",
    emptyTitle: "No payment records yet.",
    emptyBody: "Payment evidence and COD state updates will appear here after checkout.",
  },
  saved: {
    title: "Saved for later",
    description:
      "Items you moved out of the cart so they don't lock up your basket — restore one when you're ready, or clear it.",
    emptyTitle: "No saved items yet.",
    emptyBody:
      "When you press 'Save for later' on a cart item it lands here, with the price you locked in. Saved items live for 90 days; we'll warn you if anything is about to expire.",
    emptyCta: "Browse the marketplace",
    savedItemFallback: "Saved item",
    savedRelative: "Saved {relative}",
    restoreToCart: "Restore to cart",
    clear: "Clear",
    removeAria: "Remove saved item",
  },
  support: {
    title: "Support",
    description:
      "Open a ticket attached to your Henry & Co. account, order history, and dispute trail. Replies stay on the same thread so you never re-type the context.",
    threadOpened: "Thread opened",
    submittedHeading:
      "A person on the support team will read your message and reply by email and on this thread.",
    submittedBody:
      "Typical response is within 1 business day. Updates appear in the thread list on the right and in your notifications.",
    openTicketKicker: "Open a ticket",
    storePrefix: "Store · {name}",
    formHeading:
      "Tell us what is going on, and we will keep the order, payment, and trust history attached.",
    formIntro:
      "Your account email and name come pre-filled. Add the order or vendor only if it is relevant — the team can search the rest.",
    yourName: "Your name",
    replyToEmail: "Reply-to email",
    thisIsAbout: "This is about",
    subjectLabel: "Subject",
    subjectPlaceholder: "One short line — like the email subject you'd write us",
    whatHappened: "What happened",
    whatHappenedPlaceholder:
      "Order numbers, dates, and what you'd like us to do help us solve it faster. Don't worry about formatting.",
    orderNumberOptional: "Order number (optional)",
    orderNumberPlaceholder: "MKT-ORD-...",
    openTheTicket: "Open the ticket",
    backToHelp: "Back to the help centre",
    privacyNote:
      "We attach your order and dispute history to the thread for the support team only. We never share contact details with vendors; they reach you through the platform.",
    orEmail: "Or email {email}",
    subjectOrder: "An order or delivery",
    subjectPayment: "A payment or refund",
    subjectVendor: "A specific store or vendor",
    subjectAccount: "My Henry & Co. account",
    subjectTrust: "Trust, safety, or moderation",
    subjectOther: "Something else",
    openThreadsHeading: "Open threads",
    activeSuffix: "{count} active",
    closedHeading: "Closed",
    resolvedSuffix: "{count} resolved",
    noOpenThreadsTitle: "No open threads",
    noOpenThreadsBody:
      "Anything you open will appear here, with replies and updates the team posts.",
    updatedRelative: "Updated {relative}",
    noTicketsTitle: "No tickets yet — that is the goal.",
    noTicketsBody:
      "If something does come up, opening a ticket here keeps the order, vendor, and any dispute notes attached so we can move on it directly.",
    noTicketsCta: "Browse help articles",
  },
  wishlist: {
    title: "Wishlist",
    description:
      "Saved products stay attached to the account so future recommendations and concierge basket flows can start from intent, not guesswork.",
    toastRemoved: "Removed from wishlist.",
    toastSaved: "Saved to wishlist.",
    remove: "Remove from wishlist",
    emptyTitle: "Wishlist is empty.",
    emptyBody: "Save products to build a quieter, more deliberate buying shortlist.",
    emptyCta: "Browse marketplace",
  },
  addressesClient: {
    headingEdit: "Update your saved address",
    headingAdd: "Add a saved address",
    introTitle: "Add a saved address",
    introBody:
      "Saved destinations are reused by checkout, support follow-up, and future account continuity. Default changes take effect immediately.",
    labelPlaceholder: "Label: Home, Office...",
    recipientPlaceholder: "Recipient name",
    phonePlaceholder: "Phone number",
    cityPlaceholder: "City",
    regionPlaceholder: "Region / State",
    countryPlaceholder: "Country",
    line1Placeholder: "Address line 1",
    line2Placeholder: "Address line 2 (optional)",
    setDefault: "Set as default address",
    saving: "Saving...",
    savingLabel: "Saving address",
    updateAddress: "Update address",
    saveAddress: "Save address",
    cancelEdit: "Cancel edit",
    emptyTitle: "No saved addresses yet.",
    emptyBody:
      "Save a destination once and HenryCo will keep it ready for future checkout, support, and order-follow-up flows.",
    defaultBadge: "Default",
    edit: "Edit",
    setDefaultAction: "Set default",
    deleteAction: "Delete",
    updatingDefaultLabel: "Updating default address",
    deletingLabel: "Deleting address",
    saveFailed: "Address save failed.",
    actionFailed: "Address action failed.",
    toastUpdated: "Address updated",
    toastSaved: "Address saved",
    toastUpdatedDefaultBody: "This address is now your default checkout destination.",
    toastSavedBody: "The address is now available across your marketplace account.",
    toastSaveFailed: "Address save failed",
    toastRemoved: "Address removed",
    toastDefaultUpdated: "Default address updated",
    toastActionFailed: "Address action failed",
  },
  reviewsClient: {
    policyTitle: "Review policy",
    policyBody:
      "Verified purchases publish immediately and feed product plus seller trust. Unverified reviews still count as evidence, but they enter moderation first instead of inflating trust instantly.",
    selectProduct: "Select product",
    starSingular: "{rating} star",
    starPlural: "{rating} stars",
    titlePlaceholder: "Review title",
    bodyPlaceholder: "Share what the product and delivery experience felt like.",
    submitting: "Submitting...",
    submittingLabel: "Submitting review",
    submitReview: "Submit review",
    emptyTitle: "No reviews submitted yet.",
    emptyBody:
      "Verified purchase reviews live here. Pick a product above, rate it, and your feedback joins the trust layer the next time someone considers it.",
    verifiedPurchase: "Verified purchase",
    awaitingModeration: "Awaiting moderation confirmation",
    submitFailed: "Review submission failed.",
    toastPublished: "Review published",
    toastSubmitted: "Review submitted",
    toastPublishedBody:
      "Your verified review is now contributing to product and seller trust.",
    toastPendingBody:
      "Your review is in moderation because we could not verify the purchase automatically.",
    toastSubmitFailed: "Review submission failed",
  },
};

const FR: DeepPartial<MarketplaceCustomerAccountCopy> = {
  overview: {
    titleNamed: "Activité marketplace de {name}",
    titleFallback: "Activité marketplace",
    description:
      "Commandes, articles enregistrés, boutiques suivies et activité du compte dans une vue plus apaisée. HenryCo unifie ces signaux entre les divisions afin que le suivi reste rattaché au même compte.",
    trackOrder: "Suivre une commande",
    continueShopping: "Continuer mes achats",
    snapshotLabel: "Aperçu du compte",
    kpiActiveOrders: "Commandes actives",
    kpiActiveHintSingular: "{count} commande encore en cours.",
    kpiActiveHintPlural: "{count} commandes encore en cours.",
    kpiActiveHintEmpty: "Aucune commande en cours pour le moment.",
    kpiInTransit: "En transit",
    kpiInTransitHint: "Suivie de l'expédition à la livraison.",
    kpiInTransitHintEmpty: "Dès qu'une commande est expédiée, elle apparaît ici.",
    kpiSavedItems: "Articles enregistrés",
    kpiSavedHint: "Les pièces que vous avez gardées à l'œil.",
    kpiSavedHintEmpty: "Ajoutez un cœur pour démarrer une liste d'envies.",
    kpiFollowing: "Suivis",
    kpiFollowingHintSingular: "{count} boutique que vous suivez pour les nouveautés.",
    kpiFollowingHintPlural: "{count} boutiques que vous suivez pour les nouveautés.",
    kpiFollowingHintEmpty: "Suivez des boutiques pour découvrir leurs nouveautés en premier.",
    quickActionsLabel: "Actions rapides",
    qaTrackEyebrow: "Suivi",
    qaTrackTitle: "Suivre une commande",
    qaTrackBody: "Recherchez une commande grâce à son code de référence.",
    qaSavedEyebrow: "Enregistrés",
    qaSavedTitle: "Ouvrir la liste d'envies",
    qaSavedBody: "Les pièces que vous avez enregistrées, prêtes à être revues.",
    qaProfileEyebrow: "Profil",
    qaProfileTitle: "Gérer les adresses",
    qaProfileBody: "Livraison par défaut et adresses enregistrées.",
    qaApplicationEyebrow: "Candidature",
    qaApplicationTitle: "Poursuivre votre candidature vendeur",
    qaApplicationBodyStatus: "Statut : {status}.",
    qaSellerEyebrow: "Devenir vendeur",
    qaSellerTitle: "Postuler pour vendre sur HenryCo",
    qaSellerBody: "Touchez des acheteurs dans tout l'écosystème HenryCo.",
    recentOrdersKicker: "Commandes récentes",
    recentOrdersHeading: "Dernière activité de vos achats",
    recentOrdersHeadingEmpty: "Vos commandes apparaîtront ici",
    viewAll: "Tout voir",
    orderLabel: "Commande {orderNo}",
    placedRelative: "Passée {relative}",
    storesSuffixSingular: "{count} boutique",
    storesSuffixPlural: "{count} boutiques",
    viewOrder: "Voir",
    emptyOrdersBody:
      "Vous n'avez pas encore passé de commande. Parcourez la marketplace pour trouver des boutiques vérifiées et des sélections soignées.",
    browseMarketplace: "Parcourir la marketplace",
    savedKicker: "Articles enregistrés",
    savedHeading: "Les pièces que vous avez gardées à l'œil",
    savedHeadingEmpty: "Votre liste d'envies est vide",
    openWishlist: "Ouvrir la liste d'envies",
    emptySavedBody:
      "Ajoutez un cœur aux produits que vous voulez revoir. Ils vous attendront dans votre compte, aux côtés de vos commandes et de vos suivis.",
    followingKicker: "Suivis",
    followingHeading: "Boutiques que vous suivez",
    followingHeadingEmpty: "Suivez des boutiques pour découvrir les nouveautés en premier",
    emptyFollowingBody:
      "Touchez le nom de la boutique sur une page produit pour la suivre. Nous ferons apparaître leur prochaine nouveauté ici.",
    verifiedSuffix: "{level} vérifié",
    verifiedVendor: "Vendeur vérifié",
    responseSuffix: "réponse en {hours} h",
    activityKicker: "Activité récente",
    activityHeading: "Mises à jour de votre compte",
    activityHeadingEmpty: "L'activité apparaîtra ici",
    emptyActivityBody:
      "Les confirmations de commande, les mises à jour d'expédition et les messages des boutiques apparaîtront ici.",
    newBadge: "Nouveau",
    quickActionOpen: "Ouvrir",
    relativeJustNow: "à l'instant",
    relativeMinutes: "il y a {value} min",
    relativeHours: "il y a {value} h",
    relativeDays: "il y a {value} j",
    relativeMonths: "il y a {value} mois",
    relativeYears: "il y a {value} an(s)",
    buyerFallback: "Acheteur",
  },
  addresses: {
    title: "Adresses",
    description:
      "Les adresses enregistrées restent liées au compte partagé afin que les futurs services HenryCo puissent réutiliser le même contexte client.",
    movedStrong: "Le carnet d'adresses a changé d'emplacement.",
    movedBefore:
      "Pour ajouter ou modifier une adresse avec la vérification Google Places + l'alignement KYC, veuillez utiliser",
    movedLink: "les paramètres de votre compte",
    movedAfter:
      "Les adresses marketplace existantes restent consultables ici pour les anciennes commandes.",
  },
  disputes: {
    title: "Litiges",
    description:
      "Ouvrez un signalement avec son contexte, gardez la commande liée et suivez les mises à jour de l'étape support sans perdre le fil.",
    orderPlaceholder: "MKT-ORD-...",
    vendorPlaceholder: "Identifiant du vendeur (facultatif)",
    reasonPlaceholder: "Motif du litige",
    notePlaceholder: "Expliquez ce qui s'est mal passé et la résolution que vous attendez.",
    openDispute: "Ouvrir un litige",
    emptyTitle: "Aucun litige en cours.",
    emptyBody:
      "Lorsque vous signalez un problème sur une commande, le fil reste ici avec les mises à jour de l'étape support — rien ne se perd.",
  },
  following: {
    title: "Suivis",
    description:
      "Les boutiques suivies sont conservées dans le compte afin que le merchandising et la réactivation restent contextuels plutôt que génériques.",
    toastUnfollowed: "Boutique retirée des suivis.",
    toastFollowed: "Vous suivez désormais cette boutique.",
    unfollow: "Ne plus suivre",
    emptyTitle: "Aucune boutique suivie pour le moment.",
    emptyBody:
      "Suivez une boutique pour garder son passeport de confiance et ses dernières offres à portée de main.",
    emptyCta: "Découvrir des boutiques",
  },
  notifications: {
    title: "Notifications",
    description:
      "Les mises à jour de cycle de vie dans l'application, par e-mail et via WhatsApp sont conçues pour apparaître ici comme une chronologie de compte lisible.",
    emptyTitle: "Aucune notification pour le moment.",
    emptyBody: "Les mises à jour de cycle de vie de la marketplace apparaîtront ici.",
  },
  orders: {
    title: "Commandes",
    description:
      "Chaque commande garde visibles l'état du paiement, l'expédition fractionnée et le contexte des litiges dans une chronologie claire pour l'acheteur.",
    emptyTitle: "Aucune commande pour le moment.",
    emptyBody:
      "L'espace d'historique des commandes est prêt. Dès que vous passerez commande, le suivi des commandes fractionnées et l'historique de vérification des paiements apparaîtront ici.",
  },
  orderDetail: {
    description:
      "La clarté des commandes fractionnées reste visible, avec l'expédition par vendeur et l'état du paiement détaillés séparément.",
    placed: "Passée le",
    total: "Total",
    payment: "Paiement",
    henrycoSegment: "Segment HenryCo",
    fulfillment: "Préparation",
    tracking: "Suivi",
    trackingPending: "En attente",
    payoutStatus: "Statut du versement",
    protectionKicker: "Contrôle de la protection acheteur",
    protectionBody:
      "Confirmez la finalisation lorsque la commande livrée est satisfaisante. HenryCo conserve le versement au vendeur sous séquestre jusqu'à la confirmation ou jusqu'à ce que la logique de délai libère le segment.",
    confirmCompletion: "Confirmer la finalisation",
  },
  payments: {
    title: "Paiements",
    description:
      "La vérification des paiements reste visible à côté de la référence de commande afin que la revue des virements ne soit jamais opaque.",
    method: "Méthode",
    reference: "Référence HenryCo",
    proof: "Justificatif",
    viewProof: "Voir le justificatif",
    walletDebitRecorded: "Débit du portefeuille enregistré",
    notUploaded: "Non téléversé",
    awaitingReview: "En attente de revue",
    emptyTitle: "Aucun enregistrement de paiement pour le moment.",
    emptyBody:
      "Les justificatifs de paiement et les mises à jour de l'état du paiement à la livraison apparaîtront ici après le paiement.",
  },
  saved: {
    title: "Enregistrés pour plus tard",
    description:
      "Les articles que vous avez sortis du panier pour ne pas le bloquer — restaurez-en un quand vous êtes prêt, ou retirez-le.",
    emptyTitle: "Aucun article enregistré pour le moment.",
    emptyBody:
      "Lorsque vous appuyez sur « Enregistrer pour plus tard » sur un article du panier, il apparaît ici avec le prix que vous avez bloqué. Les articles enregistrés restent 90 jours ; nous vous préviendrons si l'un d'eux est sur le point d'expirer.",
    emptyCta: "Parcourir la marketplace",
    savedItemFallback: "Article enregistré",
    savedRelative: "Enregistré {relative}",
    restoreToCart: "Remettre au panier",
    clear: "Retirer",
    removeAria: "Retirer l'article enregistré",
  },
  support: {
    title: "Assistance",
    description:
      "Ouvrez un ticket rattaché à votre compte Henry & Co., à votre historique de commandes et à votre suivi des litiges. Les réponses restent sur le même fil pour ne jamais retaper le contexte.",
    threadOpened: "Fil ouvert",
    submittedHeading:
      "Une personne de l'équipe d'assistance lira votre message et répondra par e-mail et sur ce fil.",
    submittedBody:
      "La réponse intervient généralement sous 1 jour ouvré. Les mises à jour apparaissent dans la liste des fils à droite et dans vos notifications.",
    openTicketKicker: "Ouvrir un ticket",
    storePrefix: "Boutique · {name}",
    formHeading:
      "Dites-nous ce qui se passe, et nous garderons rattachés la commande, le paiement et l'historique de confiance.",
    formIntro:
      "Votre e-mail et votre nom de compte sont préremplis. Ajoutez la commande ou le vendeur uniquement si c'est pertinent — l'équipe peut rechercher le reste.",
    yourName: "Votre nom",
    replyToEmail: "E-mail de réponse",
    thisIsAbout: "Cela concerne",
    subjectLabel: "Objet",
    subjectPlaceholder: "Une courte ligne — comme l'objet de l'e-mail que vous nous écririez",
    whatHappened: "Ce qui s'est passé",
    whatHappenedPlaceholder:
      "Les numéros de commande, les dates et ce que vous souhaitez que nous fassions nous aident à résoudre plus vite. Ne vous souciez pas de la mise en forme.",
    orderNumberOptional: "Numéro de commande (facultatif)",
    orderNumberPlaceholder: "MKT-ORD-...",
    openTheTicket: "Ouvrir le ticket",
    backToHelp: "Retour au centre d'aide",
    privacyNote:
      "Nous rattachons votre historique de commandes et de litiges au fil pour la seule équipe d'assistance. Nous ne partageons jamais vos coordonnées avec les vendeurs ; ils vous contactent via la plateforme.",
    orEmail: "Ou écrivez à {email}",
    subjectOrder: "Une commande ou une livraison",
    subjectPayment: "Un paiement ou un remboursement",
    subjectVendor: "Une boutique ou un vendeur en particulier",
    subjectAccount: "Mon compte Henry & Co.",
    subjectTrust: "Confiance, sécurité ou modération",
    subjectOther: "Autre chose",
    openThreadsHeading: "Fils ouverts",
    activeSuffix: "{count} actif(s)",
    closedHeading: "Clôturés",
    resolvedSuffix: "{count} résolu(s)",
    noOpenThreadsTitle: "Aucun fil ouvert",
    noOpenThreadsBody:
      "Tout ce que vous ouvrez apparaîtra ici, avec les réponses et les mises à jour publiées par l'équipe.",
    updatedRelative: "Mis à jour {relative}",
    noTicketsTitle: "Aucun ticket pour le moment — c'est l'objectif.",
    noTicketsBody:
      "Si quelque chose survient, ouvrir un ticket ici garde la commande, le vendeur et les éventuelles notes de litige rattachés pour que nous puissions agir directement.",
    noTicketsCta: "Parcourir les articles d'aide",
  },
  wishlist: {
    title: "Liste d'envies",
    description:
      "Les produits enregistrés restent rattachés au compte afin que les futures recommandations et les paniers conciergerie puissent partir d'une intention, pas de suppositions.",
    toastRemoved: "Retiré de la liste d'envies.",
    toastSaved: "Ajouté à la liste d'envies.",
    remove: "Retirer de la liste d'envies",
    emptyTitle: "La liste d'envies est vide.",
    emptyBody:
      "Enregistrez des produits pour bâtir une présélection d'achat plus posée et plus réfléchie.",
    emptyCta: "Parcourir la marketplace",
  },
  addressesClient: {
    headingEdit: "Modifier votre adresse enregistrée",
    headingAdd: "Ajouter une adresse enregistrée",
    introTitle: "Ajouter une adresse enregistrée",
    introBody:
      "Les destinations enregistrées sont réutilisées par le paiement, le suivi de l'assistance et la continuité future du compte. Les changements de valeur par défaut prennent effet immédiatement.",
    labelPlaceholder: "Libellé : Domicile, Bureau...",
    recipientPlaceholder: "Nom du destinataire",
    phonePlaceholder: "Numéro de téléphone",
    cityPlaceholder: "Ville",
    regionPlaceholder: "Région / État",
    countryPlaceholder: "Pays",
    line1Placeholder: "Adresse ligne 1",
    line2Placeholder: "Adresse ligne 2 (facultatif)",
    setDefault: "Définir comme adresse par défaut",
    saving: "Enregistrement...",
    savingLabel: "Enregistrement de l'adresse",
    updateAddress: "Mettre à jour l'adresse",
    saveAddress: "Enregistrer l'adresse",
    cancelEdit: "Annuler la modification",
    emptyTitle: "Aucune adresse enregistrée pour le moment.",
    emptyBody:
      "Enregistrez une destination une seule fois et HenryCo la gardera prête pour vos futurs paiements, demandes d'assistance et suivis de commande.",
    defaultBadge: "Par défaut",
    edit: "Modifier",
    setDefaultAction: "Définir par défaut",
    deleteAction: "Supprimer",
    updatingDefaultLabel: "Mise à jour de l'adresse par défaut",
    deletingLabel: "Suppression de l'adresse",
    saveFailed: "Échec de l'enregistrement de l'adresse.",
    actionFailed: "Échec de l'action sur l'adresse.",
    toastUpdated: "Adresse mise à jour",
    toastSaved: "Adresse enregistrée",
    toastUpdatedDefaultBody:
      "Cette adresse est désormais votre destination de paiement par défaut.",
    toastSavedBody: "L'adresse est maintenant disponible dans tout votre compte marketplace.",
    toastSaveFailed: "Échec de l'enregistrement de l'adresse",
    toastRemoved: "Adresse supprimée",
    toastDefaultUpdated: "Adresse par défaut mise à jour",
    toastActionFailed: "Échec de l'action sur l'adresse",
  },
  reviewsClient: {
    policyTitle: "Politique des avis",
    policyBody:
      "Les achats vérifiés sont publiés immédiatement et alimentent la confiance produit et vendeur. Les avis non vérifiés comptent toujours comme preuve, mais ils passent d'abord en modération au lieu de gonfler la confiance instantanément.",
    selectProduct: "Sélectionner un produit",
    starSingular: "{rating} étoile",
    starPlural: "{rating} étoiles",
    titlePlaceholder: "Titre de l'avis",
    bodyPlaceholder: "Partagez votre ressenti sur le produit et l'expérience de livraison.",
    submitting: "Envoi...",
    submittingLabel: "Envoi de l'avis",
    submitReview: "Envoyer l'avis",
    emptyTitle: "Aucun avis envoyé pour le moment.",
    emptyBody:
      "Les avis d'achat vérifié apparaissent ici. Choisissez un produit ci-dessus, notez-le, et votre retour rejoint la couche de confiance la prochaine fois que quelqu'un l'envisage.",
    verifiedPurchase: "Achat vérifié",
    awaitingModeration: "En attente de confirmation de modération",
    submitFailed: "Échec de l'envoi de l'avis.",
    toastPublished: "Avis publié",
    toastSubmitted: "Avis envoyé",
    toastPublishedBody:
      "Votre avis vérifié contribue désormais à la confiance produit et vendeur.",
    toastPendingBody:
      "Votre avis est en modération car nous n'avons pas pu vérifier l'achat automatiquement.",
    toastSubmitFailed: "Échec de l'envoi de l'avis",
  },
};

const ES: DeepPartial<MarketplaceCustomerAccountCopy> = {
  overview: {
    titleNamed: "Actividad de {name} en el marketplace",
    titleFallback: "Actividad del marketplace",
    description:
      "Pedidos, artículos guardados, tiendas que sigues y actividad de la cuenta en una vista más tranquila. HenryCo unifica estas señales entre divisiones para que el rastro siga vinculado a la misma cuenta.",
    trackOrder: "Seguir un pedido",
    continueShopping: "Seguir comprando",
    snapshotLabel: "Resumen de la cuenta",
    kpiActiveOrders: "Pedidos activos",
    kpiActiveHintSingular: "{count} pedido aún en curso.",
    kpiActiveHintPlural: "{count} pedidos aún en curso.",
    kpiActiveHintEmpty: "No hay pedidos en curso en este momento.",
    kpiInTransit: "En tránsito",
    kpiInTransitHint: "Seguido desde el envío hasta la entrega.",
    kpiInTransitHintEmpty: "Cuando un pedido se envíe, aparecerá aquí.",
    kpiSavedItems: "Artículos guardados",
    kpiSavedHint: "Las piezas que has tenido en mente.",
    kpiSavedHintEmpty: "Da me gusta a cualquier producto para empezar una lista de deseos.",
    kpiFollowing: "Siguiendo",
    kpiFollowingHintSingular: "{count} tienda que sigues para no perderte sus novedades.",
    kpiFollowingHintPlural: "{count} tiendas que sigues para no perderte sus novedades.",
    kpiFollowingHintEmpty: "Sigue tiendas para descubrir sus novedades antes que nadie.",
    quickActionsLabel: "Acciones rápidas",
    qaTrackEyebrow: "Seguimiento",
    qaTrackTitle: "Seguir un pedido",
    qaTrackBody: "Busca un pedido por su código de referencia.",
    qaSavedEyebrow: "Guardados",
    qaSavedTitle: "Abrir lista de deseos",
    qaSavedBody: "Las piezas que guardaste, listas para revisarlas.",
    qaProfileEyebrow: "Perfil",
    qaProfileTitle: "Gestionar direcciones",
    qaProfileBody: "Entrega predeterminada y ubicaciones guardadas.",
    qaApplicationEyebrow: "Solicitud",
    qaApplicationTitle: "Continuar tu solicitud de vendedor",
    qaApplicationBodyStatus: "Estado: {status}.",
    qaSellerEyebrow: "Conviértete en vendedor",
    qaSellerTitle: "Solicitar vender en HenryCo",
    qaSellerBody: "Llega a compradores de todo el ecosistema de HenryCo.",
    recentOrdersKicker: "Pedidos recientes",
    recentOrdersHeading: "Última actividad de tus compras",
    recentOrdersHeadingEmpty: "Tus pedidos aparecerán aquí",
    viewAll: "Ver todo",
    orderLabel: "Pedido {orderNo}",
    placedRelative: "Realizado {relative}",
    storesSuffixSingular: "{count} tienda",
    storesSuffixPlural: "{count} tiendas",
    viewOrder: "Ver",
    emptyOrdersBody:
      "Todavía no has hecho ningún pedido. Explora el marketplace para encontrar tiendas verificadas y selecciones cuidadas.",
    browseMarketplace: "Explorar el marketplace",
    savedKicker: "Artículos guardados",
    savedHeading: "Las piezas que tuviste en mente",
    savedHeadingEmpty: "Tu lista de deseos está vacía",
    openWishlist: "Abrir lista de deseos",
    emptySavedBody:
      "Da me gusta a los productos que quieras revisar. Te esperarán en tu cuenta junto a tus pedidos y tus seguidos.",
    followingKicker: "Siguiendo",
    followingHeading: "Tiendas que sigues",
    followingHeadingEmpty: "Sigue tiendas para descubrir novedades antes que nadie",
    emptyFollowingBody:
      "Toca el nombre de la tienda en una página de producto para seguirla. Mostraremos su próxima novedad aquí.",
    verifiedSuffix: "{level} verificado",
    verifiedVendor: "Vendedor verificado",
    responseSuffix: "respuesta en {hours} h",
    activityKicker: "Actividad reciente",
    activityHeading: "Novedades de tu cuenta",
    activityHeadingEmpty: "La actividad aparecerá aquí",
    emptyActivityBody:
      "Las confirmaciones de pedido, las actualizaciones de envío y los mensajes de las tiendas aparecerán aquí.",
    newBadge: "Nuevo",
    quickActionOpen: "Abrir",
    relativeJustNow: "justo ahora",
    relativeMinutes: "hace {value} min",
    relativeHours: "hace {value} h",
    relativeDays: "hace {value} d",
    relativeMonths: "hace {value} meses",
    relativeYears: "hace {value} años",
    buyerFallback: "Comprador",
  },
  addresses: {
    title: "Direcciones",
    description:
      "Las direcciones guardadas siguen vinculadas a la cuenta compartida para que los futuros servicios de HenryCo puedan reutilizar el mismo contexto del cliente.",
    movedStrong: "La libreta de direcciones se movió.",
    movedBefore:
      "Para añadir o editar una dirección con verificación de Google Places + alineación KYC, utiliza",
    movedLink: "los ajustes de tu cuenta",
    movedAfter:
      "Las direcciones existentes del marketplace siguen siendo legibles aquí para los pedidos antiguos.",
  },
  disputes: {
    title: "Disputas",
    description:
      "Abre una incidencia con su contexto, mantén el pedido vinculado y consulta las actualizaciones de la fase de soporte sin perder el rastro.",
    orderPlaceholder: "MKT-ORD-...",
    vendorPlaceholder: "Identificador del vendedor (opcional)",
    reasonPlaceholder: "Motivo de la disputa",
    notePlaceholder: "Explica qué salió mal y qué resolución esperas.",
    openDispute: "Abrir disputa",
    emptyTitle: "No hay disputas abiertas.",
    emptyBody:
      "Cuando planteas una incidencia con un pedido, el hilo vive aquí con actualizaciones de estado de la fase de soporte: nada se pierde del rastro.",
  },
  following: {
    title: "Siguiendo",
    description:
      "Las tiendas seguidas se conservan en el registro de la cuenta para que el merchandising y la reactivación se mantengan contextuales en lugar de genéricos.",
    toastUnfollowed: "Has dejado de seguir la tienda.",
    toastFollowed: "Ahora sigues esta tienda.",
    unfollow: "Dejar de seguir",
    emptyTitle: "Todavía no sigues ninguna tienda.",
    emptyBody:
      "Sigue una tienda para tener cerca su pasaporte de confianza y sus últimas ofertas.",
    emptyCta: "Descubrir tiendas",
  },
  notifications: {
    title: "Notificaciones",
    description:
      "Las actualizaciones del ciclo de vida en la app, por correo y por WhatsApp están diseñadas para aparecer aquí como una única cronología de cuenta legible.",
    emptyTitle: "Todavía no hay notificaciones.",
    emptyBody: "Las actualizaciones del ciclo de vida del marketplace aparecerán aquí.",
  },
  orders: {
    title: "Pedidos",
    description:
      "Cada pedido mantiene visibles el estado del pago, la preparación dividida y el contexto de las disputas en una cronología fácil para el comprador.",
    emptyTitle: "Todavía no hay pedidos.",
    emptyBody:
      "El espacio de historial de pedidos está listo. En cuanto completes una compra, aquí aparecerán el seguimiento de pedidos divididos y el historial de verificación de pagos.",
  },
  orderDetail: {
    description:
      "La claridad de los pedidos divididos se mantiene visible, con la preparación por vendedor y el estado del pago desglosados por separado.",
    placed: "Realizado",
    total: "Total",
    payment: "Pago",
    henrycoSegment: "Segmento de HenryCo",
    fulfillment: "Preparación",
    tracking: "Seguimiento",
    trackingPending: "Pendiente",
    payoutStatus: "Estado del pago al vendedor",
    protectionKicker: "Control de protección al comprador",
    protectionBody:
      "Confirma la finalización cuando el pedido entregado sea satisfactorio. HenryCo mantiene el pago al vendedor en depósito hasta la confirmación o hasta que la lógica de tiempo de espera libere el segmento.",
    confirmCompletion: "Confirmar finalización",
  },
  payments: {
    title: "Pagos",
    description:
      "La verificación del pago se mantiene visible junto a la referencia del pedido para que la revisión de las transferencias bancarias nunca resulte opaca.",
    method: "Método",
    reference: "Referencia de HenryCo",
    proof: "Comprobante",
    viewProof: "Ver comprobante",
    walletDebitRecorded: "Cargo en la billetera registrado",
    notUploaded: "No subido",
    awaitingReview: "Pendiente de revisión",
    emptyTitle: "Todavía no hay registros de pago.",
    emptyBody:
      "Los comprobantes de pago y las actualizaciones del estado de pago contra entrega aparecerán aquí después de la compra.",
  },
  saved: {
    title: "Guardados para más tarde",
    description:
      "Artículos que sacaste del carrito para no bloquear tu cesta: restaura uno cuando estés listo o quítalo.",
    emptyTitle: "Todavía no hay artículos guardados.",
    emptyBody:
      "Cuando pulsas «Guardar para más tarde» en un artículo del carrito, aparece aquí con el precio que fijaste. Los artículos guardados duran 90 días; te avisaremos si alguno está a punto de caducar.",
    emptyCta: "Explorar el marketplace",
    savedItemFallback: "Artículo guardado",
    savedRelative: "Guardado {relative}",
    restoreToCart: "Restaurar al carrito",
    clear: "Quitar",
    removeAria: "Quitar artículo guardado",
  },
  support: {
    title: "Soporte",
    description:
      "Abre un ticket vinculado a tu cuenta de Henry & Co., tu historial de pedidos y tu rastro de disputas. Las respuestas se mantienen en el mismo hilo para que nunca tengas que volver a escribir el contexto.",
    threadOpened: "Hilo abierto",
    submittedHeading:
      "Una persona del equipo de soporte leerá tu mensaje y responderá por correo y en este hilo.",
    submittedBody:
      "La respuesta suele llegar en 1 día hábil. Las actualizaciones aparecen en la lista de hilos de la derecha y en tus notificaciones.",
    openTicketKicker: "Abrir un ticket",
    storePrefix: "Tienda · {name}",
    formHeading:
      "Cuéntanos qué está pasando y mantendremos vinculados el pedido, el pago y el historial de confianza.",
    formIntro:
      "Tu correo y nombre de cuenta vienen rellenados. Añade el pedido o el vendedor solo si es relevante: el equipo puede buscar el resto.",
    yourName: "Tu nombre",
    replyToEmail: "Correo de respuesta",
    thisIsAbout: "Se trata de",
    subjectLabel: "Asunto",
    subjectPlaceholder: "Una línea breve, como el asunto del correo que nos escribirías",
    whatHappened: "Qué pasó",
    whatHappenedPlaceholder:
      "Los números de pedido, las fechas y lo que te gustaría que hiciéramos nos ayudan a resolverlo más rápido. No te preocupes por el formato.",
    orderNumberOptional: "Número de pedido (opcional)",
    orderNumberPlaceholder: "MKT-ORD-...",
    openTheTicket: "Abrir el ticket",
    backToHelp: "Volver al centro de ayuda",
    privacyNote:
      "Adjuntamos tu historial de pedidos y disputas al hilo solo para el equipo de soporte. Nunca compartimos datos de contacto con los vendedores; ellos te contactan a través de la plataforma.",
    orEmail: "O escribe a {email}",
    subjectOrder: "Un pedido o una entrega",
    subjectPayment: "Un pago o un reembolso",
    subjectVendor: "Una tienda o un vendedor concreto",
    subjectAccount: "Mi cuenta de Henry & Co.",
    subjectTrust: "Confianza, seguridad o moderación",
    subjectOther: "Otra cosa",
    openThreadsHeading: "Hilos abiertos",
    activeSuffix: "{count} activos",
    closedHeading: "Cerrados",
    resolvedSuffix: "{count} resueltos",
    noOpenThreadsTitle: "No hay hilos abiertos",
    noOpenThreadsBody:
      "Todo lo que abras aparecerá aquí, con las respuestas y actualizaciones que publique el equipo.",
    updatedRelative: "Actualizado {relative}",
    noTicketsTitle: "Todavía no hay tickets, ese es el objetivo.",
    noTicketsBody:
      "Si surge algo, abrir un ticket aquí mantiene vinculados el pedido, el vendedor y cualquier nota de disputa para que podamos actuar directamente.",
    noTicketsCta: "Explorar artículos de ayuda",
  },
  wishlist: {
    title: "Lista de deseos",
    description:
      "Los productos guardados siguen vinculados a la cuenta para que las futuras recomendaciones y los flujos de cesta de conserjería puedan partir de la intención, no de suposiciones.",
    toastRemoved: "Quitado de la lista de deseos.",
    toastSaved: "Guardado en la lista de deseos.",
    remove: "Quitar de la lista de deseos",
    emptyTitle: "La lista de deseos está vacía.",
    emptyBody:
      "Guarda productos para crear una preselección de compra más tranquila y deliberada.",
    emptyCta: "Explorar el marketplace",
  },
  addressesClient: {
    headingEdit: "Actualizar tu dirección guardada",
    headingAdd: "Añadir una dirección guardada",
    introTitle: "Añadir una dirección guardada",
    introBody:
      "Los destinos guardados se reutilizan en el pago, el seguimiento de soporte y la continuidad futura de la cuenta. Los cambios de valor predeterminado surten efecto de inmediato.",
    labelPlaceholder: "Etiqueta: Casa, Oficina...",
    recipientPlaceholder: "Nombre del destinatario",
    phonePlaceholder: "Número de teléfono",
    cityPlaceholder: "Ciudad",
    regionPlaceholder: "Región / Estado",
    countryPlaceholder: "País",
    line1Placeholder: "Dirección línea 1",
    line2Placeholder: "Dirección línea 2 (opcional)",
    setDefault: "Establecer como dirección predeterminada",
    saving: "Guardando...",
    savingLabel: "Guardando la dirección",
    updateAddress: "Actualizar dirección",
    saveAddress: "Guardar dirección",
    cancelEdit: "Cancelar edición",
    emptyTitle: "Todavía no hay direcciones guardadas.",
    emptyBody:
      "Guarda un destino una vez y HenryCo lo mantendrá listo para tus futuros pagos, solicitudes de soporte y seguimientos de pedido.",
    defaultBadge: "Predeterminada",
    edit: "Editar",
    setDefaultAction: "Establecer predeterminada",
    deleteAction: "Eliminar",
    updatingDefaultLabel: "Actualizando la dirección predeterminada",
    deletingLabel: "Eliminando la dirección",
    saveFailed: "No se pudo guardar la dirección.",
    actionFailed: "No se pudo completar la acción sobre la dirección.",
    toastUpdated: "Dirección actualizada",
    toastSaved: "Dirección guardada",
    toastUpdatedDefaultBody: "Esta dirección es ahora tu destino de pago predeterminado.",
    toastSavedBody: "La dirección ya está disponible en toda tu cuenta del marketplace.",
    toastSaveFailed: "No se pudo guardar la dirección",
    toastRemoved: "Dirección eliminada",
    toastDefaultUpdated: "Dirección predeterminada actualizada",
    toastActionFailed: "No se pudo completar la acción sobre la dirección",
  },
  reviewsClient: {
    policyTitle: "Política de reseñas",
    policyBody:
      "Las compras verificadas se publican de inmediato y alimentan la confianza del producto y del vendedor. Las reseñas no verificadas siguen contando como evidencia, pero pasan primero por moderación en lugar de inflar la confianza al instante.",
    selectProduct: "Selecciona un producto",
    starSingular: "{rating} estrella",
    starPlural: "{rating} estrellas",
    titlePlaceholder: "Título de la reseña",
    bodyPlaceholder: "Cuenta cómo fue la experiencia con el producto y la entrega.",
    submitting: "Enviando...",
    submittingLabel: "Enviando la reseña",
    submitReview: "Enviar reseña",
    emptyTitle: "Todavía no has enviado ninguna reseña.",
    emptyBody:
      "Las reseñas de compra verificada viven aquí. Elige un producto arriba, puntúalo y tu opinión se unirá a la capa de confianza la próxima vez que alguien lo considere.",
    verifiedPurchase: "Compra verificada",
    awaitingModeration: "A la espera de confirmación de moderación",
    submitFailed: "No se pudo enviar la reseña.",
    toastPublished: "Reseña publicada",
    toastSubmitted: "Reseña enviada",
    toastPublishedBody:
      "Tu reseña verificada ya contribuye a la confianza del producto y del vendedor.",
    toastPendingBody:
      "Tu reseña está en moderación porque no pudimos verificar la compra automáticamente.",
    toastSubmitFailed: "No se pudo enviar la reseña",
  },
};

const PT: DeepPartial<MarketplaceCustomerAccountCopy> = {
  overview: {
    titleNamed: "Atividade de {name} no marketplace",
    titleFallback: "Atividade do marketplace",
    description:
      "Pedidos, itens salvos, lojas seguidas e atividade da conta numa visão mais tranquila. A HenryCo unifica esses sinais entre as divisões para que o histórico permaneça vinculado à mesma conta.",
    trackOrder: "Rastrear um pedido",
    continueShopping: "Continuar comprando",
    snapshotLabel: "Resumo da conta",
    kpiActiveOrders: "Pedidos ativos",
    kpiActiveHintSingular: "{count} pedido ainda em andamento.",
    kpiActiveHintPlural: "{count} pedidos ainda em andamento.",
    kpiActiveHintEmpty: "Nenhum pedido em andamento no momento.",
    kpiInTransit: "Em trânsito",
    kpiInTransitHint: "Acompanhado do despacho à entrega.",
    kpiInTransitHintEmpty: "Assim que um pedido for enviado, ele aparece aqui.",
    kpiSavedItems: "Itens salvos",
    kpiSavedHint: "As peças que você vem acompanhando.",
    kpiSavedHintEmpty: "Curta qualquer produto para começar uma lista de desejos.",
    kpiFollowing: "Seguindo",
    kpiFollowingHintSingular: "{count} loja que você segue para ver as novidades.",
    kpiFollowingHintPlural: "{count} lojas que você segue para ver as novidades.",
    kpiFollowingHintEmpty: "Siga lojas para descobrir as novidades primeiro.",
    quickActionsLabel: "Ações rápidas",
    qaTrackEyebrow: "Rastrear",
    qaTrackTitle: "Rastrear um pedido",
    qaTrackBody: "Procure um pedido pelo código de referência.",
    qaSavedEyebrow: "Salvos",
    qaSavedTitle: "Abrir lista de desejos",
    qaSavedBody: "As peças que você salvou, prontas para rever.",
    qaProfileEyebrow: "Perfil",
    qaProfileTitle: "Gerenciar endereços",
    qaProfileBody: "Entrega padrão e locais salvos.",
    qaApplicationEyebrow: "Candidatura",
    qaApplicationTitle: "Continuar sua candidatura de vendedor",
    qaApplicationBodyStatus: "Status: {status}.",
    qaSellerEyebrow: "Torne-se vendedor",
    qaSellerTitle: "Candidatar-se para vender na HenryCo",
    qaSellerBody: "Alcance compradores em todo o ecossistema da HenryCo.",
    recentOrdersKicker: "Pedidos recentes",
    recentOrdersHeading: "Última atividade das suas compras",
    recentOrdersHeadingEmpty: "Seus pedidos vão aparecer aqui",
    viewAll: "Ver tudo",
    orderLabel: "Pedido {orderNo}",
    placedRelative: "Feito {relative}",
    storesSuffixSingular: "{count} loja",
    storesSuffixPlural: "{count} lojas",
    viewOrder: "Ver",
    emptyOrdersBody:
      "Você ainda não fez nenhum pedido. Explore o marketplace para encontrar lojas verificadas e seleções caprichadas.",
    browseMarketplace: "Explorar o marketplace",
    savedKicker: "Itens salvos",
    savedHeading: "As peças que você vinha acompanhando",
    savedHeadingEmpty: "Sua lista de desejos está vazia",
    openWishlist: "Abrir lista de desejos",
    emptySavedBody:
      "Curta os produtos que você quer rever. Eles vão esperar por você na sua conta, ao lado dos seus pedidos e das lojas que você segue.",
    followingKicker: "Seguindo",
    followingHeading: "Lojas que você acompanha",
    followingHeadingEmpty: "Siga lojas para ver as novidades primeiro",
    emptyFollowingBody:
      "Toque no nome da loja em uma página de produto para segui-la. Vamos mostrar a próxima novidade dela aqui.",
    verifiedSuffix: "{level} verificado",
    verifiedVendor: "Vendedor verificado",
    responseSuffix: "resposta em {hours} h",
    activityKicker: "Atividade recente",
    activityHeading: "Novidades da sua conta",
    activityHeadingEmpty: "A atividade vai aparecer aqui",
    emptyActivityBody:
      "Confirmações de pedido, atualizações de despacho e mensagens das lojas vão aparecer aqui.",
    newBadge: "Novo",
    quickActionOpen: "Abrir",
    relativeJustNow: "agora mesmo",
    relativeMinutes: "há {value} min",
    relativeHours: "há {value} h",
    relativeDays: "há {value} d",
    relativeMonths: "há {value} meses",
    relativeYears: "há {value} anos",
    buyerFallback: "Comprador",
  },
  addresses: {
    title: "Endereços",
    description:
      "Os endereços salvos permanecem vinculados à conta compartilhada para que os futuros serviços da HenryCo possam reutilizar o mesmo contexto do cliente.",
    movedStrong: "O catálogo de endereços mudou de lugar.",
    movedBefore:
      "Para adicionar ou editar um endereço com verificação do Google Places + alinhamento KYC, use",
    movedLink: "as configurações da sua conta",
    movedAfter:
      "Os endereços existentes do marketplace continuam legíveis aqui para pedidos antigos.",
  },
  disputes: {
    title: "Disputas",
    description:
      "Abra um problema com contexto, mantenha o pedido vinculado e veja as atualizações da etapa de suporte sem perder o histórico.",
    orderPlaceholder: "MKT-ORD-...",
    vendorPlaceholder: "Identificador do vendedor (opcional)",
    reasonPlaceholder: "Motivo da disputa",
    notePlaceholder: "Explique o que deu errado e qual resolução você espera.",
    openDispute: "Abrir disputa",
    emptyTitle: "Nenhuma disputa em aberto.",
    emptyBody:
      "Quando você levanta um problema com um pedido, a conversa fica aqui com atualizações de status da etapa de suporte — nada se perde do histórico.",
  },
  following: {
    title: "Seguindo",
    description:
      "As lojas seguidas ficam registradas na conta para que o merchandising e a reativação permaneçam contextuais em vez de genéricos.",
    toastUnfollowed: "Você deixou de seguir a loja.",
    toastFollowed: "Agora você segue esta loja.",
    unfollow: "Deixar de seguir",
    emptyTitle: "Você ainda não segue nenhuma loja.",
    emptyBody:
      "Siga uma loja para manter por perto o passaporte de confiança e as ofertas mais recentes dela.",
    emptyCta: "Descobrir lojas",
  },
  notifications: {
    title: "Notificações",
    description:
      "As atualizações de ciclo de vida no app, por e-mail e por WhatsApp foram pensadas para aparecer aqui como uma única linha do tempo legível da conta.",
    emptyTitle: "Nenhuma notificação ainda.",
    emptyBody: "As atualizações de ciclo de vida do marketplace vão aparecer aqui.",
  },
  orders: {
    title: "Pedidos",
    description:
      "Cada pedido mantém visíveis o estado do pagamento, a preparação dividida e o contexto das disputas em uma linha do tempo amigável para o comprador.",
    emptyTitle: "Nenhum pedido ainda.",
    emptyBody:
      "O espaço de histórico de pedidos está pronto. Assim que você finalizar uma compra, o rastreamento de pedidos divididos e o histórico de verificação de pagamentos vão aparecer aqui.",
  },
  orderDetail: {
    description:
      "A clareza dos pedidos divididos permanece visível, com a preparação por vendedor e o estado do pagamento detalhados separadamente.",
    placed: "Feito em",
    total: "Total",
    payment: "Pagamento",
    henrycoSegment: "Segmento HenryCo",
    fulfillment: "Preparação",
    tracking: "Rastreamento",
    trackingPending: "Pendente",
    payoutStatus: "Status do repasse",
    protectionKicker: "Controle de proteção ao comprador",
    protectionBody:
      "Confirme a conclusão quando o pedido entregue estiver satisfatório. A HenryCo mantém o repasse ao vendedor em custódia até a confirmação ou até que a lógica de tempo limite libere o segmento.",
    confirmCompletion: "Confirmar conclusão",
  },
  payments: {
    title: "Pagamentos",
    description:
      "A verificação do pagamento fica visível ao lado da referência do pedido para que a análise das transferências bancárias nunca pareça opaca.",
    method: "Método",
    reference: "Referência HenryCo",
    proof: "Comprovante",
    viewProof: "Ver comprovante",
    walletDebitRecorded: "Débito da carteira registrado",
    notUploaded: "Não enviado",
    awaitingReview: "Aguardando análise",
    emptyTitle: "Nenhum registro de pagamento ainda.",
    emptyBody:
      "Os comprovantes de pagamento e as atualizações de status de pagamento na entrega vão aparecer aqui após a finalização da compra.",
  },
  saved: {
    title: "Salvos para depois",
    description:
      "Itens que você tirou do carrinho para não travar a sua cesta — restaure um quando estiver pronto ou remova-o.",
    emptyTitle: "Nenhum item salvo ainda.",
    emptyBody:
      "Quando você toca em «Salvar para depois» em um item do carrinho, ele aparece aqui com o preço que você fixou. Os itens salvos duram 90 dias; avisaremos se algum estiver prestes a expirar.",
    emptyCta: "Explorar o marketplace",
    savedItemFallback: "Item salvo",
    savedRelative: "Salvo {relative}",
    restoreToCart: "Restaurar ao carrinho",
    clear: "Remover",
    removeAria: "Remover item salvo",
  },
  support: {
    title: "Suporte",
    description:
      "Abra um chamado vinculado à sua conta Henry & Co., ao seu histórico de pedidos e ao seu histórico de disputas. As respostas ficam na mesma conversa para que você nunca precise redigitar o contexto.",
    threadOpened: "Conversa aberta",
    submittedHeading:
      "Uma pessoa da equipe de suporte vai ler sua mensagem e responder por e-mail e nesta conversa.",
    submittedBody:
      "A resposta costuma chegar em 1 dia útil. As atualizações aparecem na lista de conversas à direita e nas suas notificações.",
    openTicketKicker: "Abrir um chamado",
    storePrefix: "Loja · {name}",
    formHeading:
      "Conte o que está acontecendo e manteremos vinculados o pedido, o pagamento e o histórico de confiança.",
    formIntro:
      "Seu e-mail e nome de conta já vêm preenchidos. Adicione o pedido ou o vendedor só se for relevante — a equipe pode buscar o resto.",
    yourName: "Seu nome",
    replyToEmail: "E-mail de resposta",
    thisIsAbout: "Isto é sobre",
    subjectLabel: "Assunto",
    subjectPlaceholder: "Uma linha curta — como o assunto do e-mail que você nos escreveria",
    whatHappened: "O que aconteceu",
    whatHappenedPlaceholder:
      "Números de pedido, datas e o que você gostaria que fizéssemos nos ajudam a resolver mais rápido. Não se preocupe com a formatação.",
    orderNumberOptional: "Número do pedido (opcional)",
    orderNumberPlaceholder: "MKT-ORD-...",
    openTheTicket: "Abrir o chamado",
    backToHelp: "Voltar à central de ajuda",
    privacyNote:
      "Anexamos seu histórico de pedidos e disputas à conversa apenas para a equipe de suporte. Nunca compartilhamos dados de contato com os vendedores; eles falam com você pela plataforma.",
    orEmail: "Ou escreva para {email}",
    subjectOrder: "Um pedido ou uma entrega",
    subjectPayment: "Um pagamento ou um reembolso",
    subjectVendor: "Uma loja ou um vendedor específico",
    subjectAccount: "Minha conta Henry & Co.",
    subjectTrust: "Confiança, segurança ou moderação",
    subjectOther: "Outra coisa",
    openThreadsHeading: "Conversas abertas",
    activeSuffix: "{count} ativas",
    closedHeading: "Encerradas",
    resolvedSuffix: "{count} resolvidas",
    noOpenThreadsTitle: "Nenhuma conversa aberta",
    noOpenThreadsBody:
      "Tudo o que você abrir vai aparecer aqui, com as respostas e atualizações que a equipe publicar.",
    updatedRelative: "Atualizado {relative}",
    noTicketsTitle: "Nenhum chamado ainda — esse é o objetivo.",
    noTicketsBody:
      "Se algo surgir, abrir um chamado aqui mantém o pedido, o vendedor e quaisquer notas de disputa vinculados para que possamos agir diretamente.",
    noTicketsCta: "Ver artigos de ajuda",
  },
  wishlist: {
    title: "Lista de desejos",
    description:
      "Os produtos salvos permanecem vinculados à conta para que as futuras recomendações e os fluxos de cesta concierge possam partir da intenção, não de suposições.",
    toastRemoved: "Removido da lista de desejos.",
    toastSaved: "Salvo na lista de desejos.",
    remove: "Remover da lista de desejos",
    emptyTitle: "A lista de desejos está vazia.",
    emptyBody:
      "Salve produtos para montar uma pré-seleção de compra mais tranquila e deliberada.",
    emptyCta: "Explorar o marketplace",
  },
  addressesClient: {
    headingEdit: "Atualizar seu endereço salvo",
    headingAdd: "Adicionar um endereço salvo",
    introTitle: "Adicionar um endereço salvo",
    introBody:
      "Os destinos salvos são reutilizados no checkout, no acompanhamento de suporte e na continuidade futura da conta. As mudanças de padrão entram em vigor imediatamente.",
    labelPlaceholder: "Rótulo: Casa, Escritório...",
    recipientPlaceholder: "Nome do destinatário",
    phonePlaceholder: "Número de telefone",
    cityPlaceholder: "Cidade",
    regionPlaceholder: "Região / Estado",
    countryPlaceholder: "País",
    line1Placeholder: "Endereço linha 1",
    line2Placeholder: "Endereço linha 2 (opcional)",
    setDefault: "Definir como endereço padrão",
    saving: "Salvando...",
    savingLabel: "Salvando o endereço",
    updateAddress: "Atualizar endereço",
    saveAddress: "Salvar endereço",
    cancelEdit: "Cancelar edição",
    emptyTitle: "Nenhum endereço salvo ainda.",
    emptyBody:
      "Salve um destino uma vez e a HenryCo o manterá pronto para seus futuros checkouts, solicitações de suporte e acompanhamentos de pedido.",
    defaultBadge: "Padrão",
    edit: "Editar",
    setDefaultAction: "Definir como padrão",
    deleteAction: "Excluir",
    updatingDefaultLabel: "Atualizando o endereço padrão",
    deletingLabel: "Excluindo o endereço",
    saveFailed: "Falha ao salvar o endereço.",
    actionFailed: "Falha na ação do endereço.",
    toastUpdated: "Endereço atualizado",
    toastSaved: "Endereço salvo",
    toastUpdatedDefaultBody: "Este endereço é agora seu destino de checkout padrão.",
    toastSavedBody: "O endereço já está disponível em toda a sua conta do marketplace.",
    toastSaveFailed: "Falha ao salvar o endereço",
    toastRemoved: "Endereço removido",
    toastDefaultUpdated: "Endereço padrão atualizado",
    toastActionFailed: "Falha na ação do endereço",
  },
  reviewsClient: {
    policyTitle: "Política de avaliações",
    policyBody:
      "As compras verificadas são publicadas imediatamente e alimentam a confiança no produto e no vendedor. As avaliações não verificadas ainda contam como evidência, mas passam primeiro por moderação em vez de inflar a confiança instantaneamente.",
    selectProduct: "Selecione um produto",
    starSingular: "{rating} estrela",
    starPlural: "{rating} estrelas",
    titlePlaceholder: "Título da avaliação",
    bodyPlaceholder: "Conte como foi a experiência com o produto e a entrega.",
    submitting: "Enviando...",
    submittingLabel: "Enviando a avaliação",
    submitReview: "Enviar avaliação",
    emptyTitle: "Nenhuma avaliação enviada ainda.",
    emptyBody:
      "As avaliações de compra verificada ficam aqui. Escolha um produto acima, avalie-o, e seu feedback se junta à camada de confiança da próxima vez que alguém o considerar.",
    verifiedPurchase: "Compra verificada",
    awaitingModeration: "Aguardando confirmação de moderação",
    submitFailed: "Falha ao enviar a avaliação.",
    toastPublished: "Avaliação publicada",
    toastSubmitted: "Avaliação enviada",
    toastPublishedBody:
      "Sua avaliação verificada já contribui para a confiança no produto e no vendedor.",
    toastPendingBody:
      "Sua avaliação está em moderação porque não conseguimos verificar a compra automaticamente.",
    toastSubmitFailed: "Falha ao enviar a avaliação",
  },
};

const AR: DeepPartial<MarketplaceCustomerAccountCopy> = {
  overview: {
    titleNamed: "نشاط {name} في المتجر",
    titleFallback: "نشاط المتجر",
    description:
      "الطلبات والعناصر المحفوظة والمتاجر المتابَعة ونشاط الحساب في عرض أكثر هدوءًا. توحّد HenryCo هذه الإشارات عبر الأقسام ليبقى السجل مرتبطًا بالحساب نفسه.",
    trackOrder: "تتبّع طلبًا",
    continueShopping: "متابعة التسوّق",
    snapshotLabel: "لمحة عن الحساب",
    kpiActiveOrders: "الطلبات النشطة",
    kpiActiveHintSingular: "{count} طلب لا يزال قيد التنفيذ.",
    kpiActiveHintPlural: "{count} طلبات لا تزال قيد التنفيذ.",
    kpiActiveHintEmpty: "لا توجد طلبات قيد التنفيذ حاليًا.",
    kpiInTransit: "قيد الشحن",
    kpiInTransitHint: "متتبَّع من الإرسال حتى التسليم.",
    kpiInTransitHintEmpty: "بمجرد شحن الطلب سيظهر هنا.",
    kpiSavedItems: "العناصر المحفوظة",
    kpiSavedHint: "القطع التي كنت تتابعها.",
    kpiSavedHintEmpty: "أضِف إعجابًا بأي منتج لبدء قائمة أمنيات.",
    kpiFollowing: "المتابَعة",
    kpiFollowingHintSingular: "{count} متجر تتابعه لتصلك أحدث المنتجات.",
    kpiFollowingHintPlural: "{count} متاجر تتابعها لتصلك أحدث المنتجات.",
    kpiFollowingHintEmpty: "تابِع المتاجر لتكتشف أحدث منتجاتها أولًا.",
    quickActionsLabel: "إجراءات سريعة",
    qaTrackEyebrow: "تتبّع",
    qaTrackTitle: "تتبّع طلبًا",
    qaTrackBody: "ابحث عن طلب باستخدام رمزه المرجعي.",
    qaSavedEyebrow: "المحفوظات",
    qaSavedTitle: "فتح قائمة الأمنيات",
    qaSavedBody: "القطع التي حفظتها، جاهزة للمراجعة.",
    qaProfileEyebrow: "الملف الشخصي",
    qaProfileTitle: "إدارة العناوين",
    qaProfileBody: "التسليم الافتراضي والمواقع المحفوظة.",
    qaApplicationEyebrow: "الطلب",
    qaApplicationTitle: "متابعة طلب البائع الخاص بك",
    qaApplicationBodyStatus: "الحالة: {status}.",
    qaSellerEyebrow: "كن بائعًا",
    qaSellerTitle: "التقديم للبيع على HenryCo",
    qaSellerBody: "تواصل مع المشترين في كامل منظومة HenryCo.",
    recentOrdersKicker: "الطلبات الأخيرة",
    recentOrdersHeading: "أحدث نشاط من مشترياتك",
    recentOrdersHeadingEmpty: "ستظهر طلباتك هنا",
    viewAll: "عرض الكل",
    orderLabel: "الطلب {orderNo}",
    placedRelative: "تم الطلب {relative}",
    storesSuffixSingular: "{count} متجر",
    storesSuffixPlural: "{count} متاجر",
    viewOrder: "عرض",
    emptyOrdersBody:
      "لم تقم بأي طلب بعد. تصفّح المتجر للعثور على متاجر موثّقة وتشكيلات منتقاة.",
    browseMarketplace: "تصفّح المتجر",
    savedKicker: "العناصر المحفوظة",
    savedHeading: "القطع التي كنت تتابعها",
    savedHeadingEmpty: "قائمة أمنياتك فارغة",
    openWishlist: "فتح قائمة الأمنيات",
    emptySavedBody:
      "أضِف إعجابًا بالمنتجات التي تريد العودة إليها. ستنتظرك في حسابك إلى جانب طلباتك ومتابعاتك.",
    followingKicker: "المتابَعة",
    followingHeading: "المتاجر التي تتابعها",
    followingHeadingEmpty: "تابِع المتاجر لتكتشف أحدث منتجاتها أولًا",
    emptyFollowingBody:
      "اضغط على اسم المتجر في صفحة المنتج لمتابعته. وسنعرض لك أحدث منتجاته هنا.",
    verifiedSuffix: "موثّق {level}",
    verifiedVendor: "بائع موثّق",
    responseSuffix: "الرد خلال {hours} ساعة",
    activityKicker: "النشاط الأخير",
    activityHeading: "تحديثات من حسابك",
    activityHeadingEmpty: "سيظهر النشاط هنا",
    emptyActivityBody:
      "ستظهر هنا تأكيدات الطلبات وتحديثات الإرسال ورسائل المتاجر.",
    newBadge: "جديد",
    quickActionOpen: "فتح",
    relativeJustNow: "الآن",
    relativeMinutes: "قبل {value} دقيقة",
    relativeHours: "قبل {value} ساعة",
    relativeDays: "قبل {value} يوم",
    relativeMonths: "قبل {value} شهر",
    relativeYears: "قبل {value} سنة",
    buyerFallback: "المشتري",
  },
  addresses: {
    title: "العناوين",
    description:
      "تبقى العناوين المحفوظة مرتبطة بالحساب المشترك حتى تتمكن خدمات HenryCo المستقبلية من إعادة استخدام سياق العميل نفسه.",
    movedStrong: "تم نقل دفتر العناوين.",
    movedBefore:
      "لإضافة عنوان أو تعديله مع التحقق عبر Google Places ومطابقة اعرف عميلك (KYC)، يُرجى استخدام",
    movedLink: "إعدادات حسابك",
    movedAfter: "تبقى عناوين المتجر الحالية قابلة للقراءة هنا للطلبات القديمة.",
  },
  disputes: {
    title: "النزاعات",
    description:
      "افتح مشكلة مع سياقها، وأبقِ الطلب مرتبطًا، وتابع تحديثات مرحلة الدعم دون فقدان السجل.",
    orderPlaceholder: "MKT-ORD-...",
    vendorPlaceholder: "معرّف البائع (اختياري)",
    reasonPlaceholder: "سبب النزاع",
    notePlaceholder: "اشرح ما الذي حدث من خطأ والحل الذي تتوقعه.",
    openDispute: "فتح نزاع",
    emptyTitle: "لا توجد نزاعات مفتوحة.",
    emptyBody:
      "عندما تطرح مشكلة بشأن طلب، يبقى الموضوع هنا مع تحديثات الحالة من مرحلة الدعم — ولا يسقط شيء من السجل.",
  },
  following: {
    title: "المتابَعة",
    description:
      "تظل المتاجر المتابَعة مسجّلة في الحساب حتى يبقى العرض الترويجي وإعادة التفاعل مرتبطين بالسياق بدلًا من أن يكونا عامّين.",
    toastUnfollowed: "تم إلغاء متابعة المتجر.",
    toastFollowed: "أنت الآن تتابع هذا المتجر.",
    unfollow: "إلغاء متابعة المتجر",
    emptyTitle: "لا توجد متاجر متابَعة بعد.",
    emptyBody: "تابِع متجرًا لتُبقي جواز الثقة الخاص به وأحدث عروضه في متناولك.",
    emptyCta: "اكتشف المتاجر",
  },
  notifications: {
    title: "الإشعارات",
    description:
      "تحديثات دورة الحياة داخل التطبيق وعبر البريد الإلكتروني وواتساب مصمّمة لتظهر هنا كخط زمني واحد مقروء للحساب.",
    emptyTitle: "لا توجد إشعارات بعد.",
    emptyBody: "ستظهر هنا تحديثات دورة حياة المتجر.",
  },
  orders: {
    title: "الطلبات",
    description:
      "يُبقي كل طلب حالة الدفع والتجهيز المُقسَّم وسياق النزاعات مرئيًا في خط زمني سهل للمشتري.",
    emptyTitle: "لا توجد طلبات بعد.",
    emptyBody:
      "واجهة سجل الطلبات جاهزة. بمجرد إتمامك للشراء، سيظهر هنا تتبّع الطلبات المُقسَّمة وسجل التحقق من المدفوعات.",
  },
  orderDetail: {
    description:
      "يبقى وضوح الطلبات المُقسَّمة مرئيًا مع تفصيل التجهيز على مستوى البائع وحالة الدفع كلٍّ على حدة.",
    placed: "تم الطلب",
    total: "الإجمالي",
    payment: "الدفع",
    henrycoSegment: "قطاع HenryCo",
    fulfillment: "التجهيز",
    tracking: "التتبّع",
    trackingPending: "قيد الانتظار",
    payoutStatus: "حالة التحويل",
    protectionKicker: "ضبط حماية المشتري",
    protectionBody:
      "أكِّد الإتمام عندما يكون الطلب المُسلَّم مُرضيًا. تحتفظ HenryCo بتحويل البائع في الضمان حتى التأكيد أو حتى يُحرِّر منطق المهلة هذا القطاع.",
    confirmCompletion: "تأكيد الإتمام",
  },
  payments: {
    title: "المدفوعات",
    description:
      "يبقى التحقق من الدفع مرئيًا بجوار مرجع الطلب حتى لا تبدو مراجعة التحويل البنكي غامضة أبدًا.",
    method: "الطريقة",
    reference: "مرجع HenryCo",
    proof: "الإثبات",
    viewProof: "عرض الإثبات",
    walletDebitRecorded: "تم تسجيل خصم المحفظة",
    notUploaded: "لم يُرفَع",
    awaitingReview: "في انتظار المراجعة",
    emptyTitle: "لا توجد سجلات دفع بعد.",
    emptyBody:
      "ستظهر هنا إثباتات الدفع وتحديثات حالة الدفع عند الاستلام بعد إتمام الشراء.",
  },
  saved: {
    title: "محفوظ لوقت لاحق",
    description:
      "عناصر أخرجتها من السلة كي لا تشغلها — استعِد أحدها عندما تكون مستعدًا، أو احذفه.",
    emptyTitle: "لا توجد عناصر محفوظة بعد.",
    emptyBody:
      "عندما تضغط على «حفظ لوقت لاحق» على عنصر في السلة، يظهر هنا بالسعر الذي ثبّته. تبقى العناصر المحفوظة 90 يومًا؛ وسننبّهك إذا كان أيٌّ منها على وشك الانتهاء.",
    emptyCta: "تصفّح المتجر",
    savedItemFallback: "عنصر محفوظ",
    savedRelative: "حُفِظ {relative}",
    restoreToCart: "استعادة إلى السلة",
    clear: "حذف",
    removeAria: "حذف العنصر المحفوظ",
  },
  support: {
    title: "الدعم",
    description:
      "افتح تذكرة مرتبطة بحساب Henry & Co. الخاص بك وسجل طلباتك وسجل نزاعاتك. تبقى الردود على الموضوع نفسه حتى لا تعيد كتابة السياق أبدًا.",
    threadOpened: "تم فتح الموضوع",
    submittedHeading:
      "سيقرأ أحد أفراد فريق الدعم رسالتك ويرد عبر البريد الإلكتروني وعلى هذا الموضوع.",
    submittedBody:
      "عادةً ما يكون الرد خلال يوم عمل واحد. تظهر التحديثات في قائمة المواضيع على اليمين وفي إشعاراتك.",
    openTicketKicker: "فتح تذكرة",
    storePrefix: "المتجر · {name}",
    formHeading:
      "أخبِرنا بما يجري، وسنُبقي الطلب والدفع وسجل الثقة مرتبطًا.",
    formIntro:
      "بريدك الإلكتروني واسم حسابك مُعبّآن مسبقًا. أضِف الطلب أو البائع فقط إذا كان ذا صلة — يمكن للفريق البحث عن الباقي.",
    yourName: "اسمك",
    replyToEmail: "البريد الإلكتروني للرد",
    thisIsAbout: "هذا بخصوص",
    subjectLabel: "الموضوع",
    subjectPlaceholder: "سطر قصير واحد — مثل موضوع البريد الإلكتروني الذي ستكتبه لنا",
    whatHappened: "ماذا حدث",
    whatHappenedPlaceholder:
      "أرقام الطلبات والتواريخ وما تودّ منا فعله تساعدنا على الحل بشكل أسرع. لا تقلق بشأن التنسيق.",
    orderNumberOptional: "رقم الطلب (اختياري)",
    orderNumberPlaceholder: "MKT-ORD-...",
    openTheTicket: "فتح التذكرة",
    backToHelp: "العودة إلى مركز المساعدة",
    privacyNote:
      "نرفق سجل طلباتك ونزاعاتك بالموضوع لفريق الدعم فقط. لا نشارك بيانات الاتصال مع البائعين أبدًا؛ فهم يتواصلون معك عبر المنصة.",
    orEmail: "أو راسِل {email}",
    subjectOrder: "طلب أو تسليم",
    subjectPayment: "دفعة أو استرداد",
    subjectVendor: "متجر أو بائع محدّد",
    subjectAccount: "حساب Henry & Co. الخاص بي",
    subjectTrust: "الثقة أو الأمان أو الإشراف",
    subjectOther: "شيء آخر",
    openThreadsHeading: "المواضيع المفتوحة",
    activeSuffix: "{count} نشطة",
    closedHeading: "المغلقة",
    resolvedSuffix: "{count} محلولة",
    noOpenThreadsTitle: "لا توجد مواضيع مفتوحة",
    noOpenThreadsBody:
      "كل ما تفتحه سيظهر هنا، مع الردود والتحديثات التي ينشرها الفريق.",
    updatedRelative: "تم التحديث {relative}",
    noTicketsTitle: "لا توجد تذاكر بعد — وهذا هو الهدف.",
    noTicketsBody:
      "إذا طرأ شيء، فإن فتح تذكرة هنا يُبقي الطلب والبائع وأي ملاحظات نزاع مرتبطًا حتى نتمكن من التحرك مباشرةً.",
    noTicketsCta: "تصفّح مقالات المساعدة",
  },
  wishlist: {
    title: "قائمة الأمنيات",
    description:
      "تبقى المنتجات المحفوظة مرتبطة بالحساب حتى تنطلق التوصيات المستقبلية وتدفّقات سلة الكونسيرج من النية، لا من التخمين.",
    toastRemoved: "تمت الإزالة من قائمة الأمنيات.",
    toastSaved: "تم الحفظ في قائمة الأمنيات.",
    remove: "إزالة من قائمة الأمنيات",
    emptyTitle: "قائمة الأمنيات فارغة.",
    emptyBody: "احفظ المنتجات لبناء قائمة شراء مختصرة أكثر هدوءًا وتأنّيًا.",
    emptyCta: "تصفّح المتجر",
  },
  addressesClient: {
    headingEdit: "تحديث عنوانك المحفوظ",
    headingAdd: "إضافة عنوان محفوظ",
    introTitle: "إضافة عنوان محفوظ",
    introBody:
      "تُعاد الوجهات المحفوظة في الدفع ومتابعة الدعم واستمرارية الحساب المستقبلية. تسري تغييرات الافتراضي على الفور.",
    labelPlaceholder: "التسمية: المنزل، المكتب...",
    recipientPlaceholder: "اسم المستلم",
    phonePlaceholder: "رقم الهاتف",
    cityPlaceholder: "المدينة",
    regionPlaceholder: "المنطقة / الولاية",
    countryPlaceholder: "البلد",
    line1Placeholder: "العنوان السطر 1",
    line2Placeholder: "العنوان السطر 2 (اختياري)",
    setDefault: "التعيين كعنوان افتراضي",
    saving: "جارٍ الحفظ...",
    savingLabel: "جارٍ حفظ العنوان",
    updateAddress: "تحديث العنوان",
    saveAddress: "حفظ العنوان",
    cancelEdit: "إلغاء التعديل",
    emptyTitle: "لا توجد عناوين محفوظة بعد.",
    emptyBody:
      "احفظ وجهة مرة واحدة وستُبقيها HenryCo جاهزة لعمليات الدفع وطلبات الدعم ومتابعات الطلبات المستقبلية.",
    defaultBadge: "افتراضي",
    edit: "تعديل",
    setDefaultAction: "تعيين افتراضي",
    deleteAction: "حذف",
    updatingDefaultLabel: "جارٍ تحديث العنوان الافتراضي",
    deletingLabel: "جارٍ حذف العنوان",
    saveFailed: "فشل حفظ العنوان.",
    actionFailed: "فشل إجراء العنوان.",
    toastUpdated: "تم تحديث العنوان",
    toastSaved: "تم حفظ العنوان",
    toastUpdatedDefaultBody: "أصبح هذا العنوان الآن وجهة الدفع الافتراضية لديك.",
    toastSavedBody: "أصبح العنوان متاحًا الآن في كامل حساب المتجر الخاص بك.",
    toastSaveFailed: "فشل حفظ العنوان",
    toastRemoved: "تمت إزالة العنوان",
    toastDefaultUpdated: "تم تحديث العنوان الافتراضي",
    toastActionFailed: "فشل إجراء العنوان",
  },
  reviewsClient: {
    policyTitle: "سياسة المراجعات",
    policyBody:
      "تُنشر عمليات الشراء الموثّقة فورًا وتغذّي ثقة المنتج والبائع. لا تزال المراجعات غير الموثّقة تُحتسب كدليل، لكنها تدخل الإشراف أولًا بدلًا من رفع الثقة فورًا.",
    selectProduct: "اختر منتجًا",
    starSingular: "{rating} نجمة",
    starPlural: "{rating} نجوم",
    titlePlaceholder: "عنوان المراجعة",
    bodyPlaceholder: "شارِكنا كيف كانت تجربتك مع المنتج والتسليم.",
    submitting: "جارٍ الإرسال...",
    submittingLabel: "جارٍ إرسال المراجعة",
    submitReview: "إرسال المراجعة",
    emptyTitle: "لم تُرسَل أي مراجعات بعد.",
    emptyBody:
      "تظهر هنا مراجعات الشراء الموثّق. اختر منتجًا أعلاه وقيّمه، وسينضم رأيك إلى طبقة الثقة في المرة القادمة التي يفكّر فيها أحدهم به.",
    verifiedPurchase: "شراء موثّق",
    awaitingModeration: "في انتظار تأكيد الإشراف",
    submitFailed: "فشل إرسال المراجعة.",
    toastPublished: "تم نشر المراجعة",
    toastSubmitted: "تم إرسال المراجعة",
    toastPublishedBody: "تساهم مراجعتك الموثّقة الآن في ثقة المنتج والبائع.",
    toastPendingBody: "مراجعتك قيد الإشراف لأننا لم نتمكن من التحقق من الشراء تلقائيًا.",
    toastSubmitFailed: "فشل إرسال المراجعة",
  },
};

const DE: DeepPartial<MarketplaceCustomerAccountCopy> = {
  overview: {
    titleNamed: "Marktplatz-Aktivität von {name}",
    titleFallback: "Marktplatz-Aktivität",
    description:
      "Bestellungen, gespeicherte Artikel, gefolgte Shops und Kontoaktivität in einer ruhigeren Ansicht. HenryCo bündelt diese Signale über die Geschäftsbereiche hinweg, damit der Verlauf mit demselben Konto verbunden bleibt.",
    trackOrder: "Bestellung verfolgen",
    continueShopping: "Weiter einkaufen",
    snapshotLabel: "Kontoübersicht",
    kpiActiveOrders: "Aktive Bestellungen",
    kpiActiveHintSingular: "{count} Bestellung noch unterwegs.",
    kpiActiveHintPlural: "{count} Bestellungen noch unterwegs.",
    kpiActiveHintEmpty: "Derzeit keine Bestellungen unterwegs.",
    kpiInTransit: "Unterwegs",
    kpiInTransitHint: "Vom Versand bis zur Lieferung verfolgt.",
    kpiInTransitHintEmpty: "Sobald eine Bestellung versandt wird, erscheint sie hier.",
    kpiSavedItems: "Gespeicherte Artikel",
    kpiSavedHint: "Stücke, die du im Auge behalten hast.",
    kpiSavedHintEmpty: "Markiere etwas mit dem Herz, um eine Wunschliste zu starten.",
    kpiFollowing: "Gefolgt",
    kpiFollowingHintSingular: "{count} Shop, dem du für Neuheiten folgst.",
    kpiFollowingHintPlural: "{count} Shops, denen du für Neuheiten folgst.",
    kpiFollowingHintEmpty: "Folge Shops, um neue Drops zuerst zu sehen.",
    quickActionsLabel: "Schnellaktionen",
    qaTrackEyebrow: "Verfolgen",
    qaTrackTitle: "Bestellung verfolgen",
    qaTrackBody: "Suche eine Bestellung über ihren Referenzcode.",
    qaSavedEyebrow: "Gespeichert",
    qaSavedTitle: "Wunschliste öffnen",
    qaSavedBody: "Stücke, die du gespeichert hast, bereit zum Wiederansehen.",
    qaProfileEyebrow: "Profil",
    qaProfileTitle: "Adressen verwalten",
    qaProfileBody: "Standardlieferung und gespeicherte Orte.",
    qaApplicationEyebrow: "Bewerbung",
    qaApplicationTitle: "Verkäuferbewerbung fortsetzen",
    qaApplicationBodyStatus: "Status: {status}.",
    qaSellerEyebrow: "Verkäufer werden",
    qaSellerTitle: "Bewerben, um auf HenryCo zu verkaufen",
    qaSellerBody: "Erreiche Käufer im gesamten HenryCo-Ökosystem.",
    recentOrdersKicker: "Letzte Bestellungen",
    recentOrdersHeading: "Neueste Aktivität deiner Einkäufe",
    recentOrdersHeadingEmpty: "Deine Bestellungen erscheinen hier",
    viewAll: "Alle ansehen",
    orderLabel: "Bestellung {orderNo}",
    placedRelative: "Aufgegeben {relative}",
    storesSuffixSingular: "{count} Shop",
    storesSuffixPlural: "{count} Shops",
    viewOrder: "Ansehen",
    emptyOrdersBody:
      "Du hast noch keine Bestellung aufgegeben. Durchstöbere den Marktplatz, um verifizierte Shops und kuratierte Drops zu finden.",
    browseMarketplace: "Marktplatz durchstöbern",
    savedKicker: "Gespeicherte Artikel",
    savedHeading: "Stücke, die du im Auge behalten hast",
    savedHeadingEmpty: "Deine Wunschliste ist leer",
    openWishlist: "Wunschliste öffnen",
    emptySavedBody:
      "Markiere Produkte mit dem Herz, die du dir noch einmal ansehen möchtest. Sie warten in deinem Konto neben deinen Bestellungen und gefolgten Shops auf dich.",
    followingKicker: "Gefolgt",
    followingHeading: "Shops, die du verfolgst",
    followingHeadingEmpty: "Folge Shops, um Drops zuerst zu sehen",
    emptyFollowingBody:
      "Tippe auf einer Produktseite auf den Shop-Namen, um zu folgen. Wir zeigen ihren nächsten Drop hier an.",
    verifiedSuffix: "{level} verifiziert",
    verifiedVendor: "Verifizierter Verkäufer",
    responseSuffix: "{hours} Std. Reaktionszeit",
    activityKicker: "Letzte Aktivität",
    activityHeading: "Updates von deinem Konto",
    activityHeadingEmpty: "Aktivität erscheint hier",
    emptyActivityBody:
      "Bestellbestätigungen, Versand-Updates und Shop-Nachrichten erscheinen hier.",
    newBadge: "Neu",
    quickActionOpen: "Öffnen",
    relativeJustNow: "gerade eben",
    relativeMinutes: "vor {value} Min.",
    relativeHours: "vor {value} Std.",
    relativeDays: "vor {value} T.",
    relativeMonths: "vor {value} Mon.",
    relativeYears: "vor {value} J.",
    buyerFallback: "Käufer",
  },
  addresses: {
    title: "Adressen",
    description:
      "Gespeicherte Adressen bleiben mit dem gemeinsamen Konto verbunden, damit künftige HenryCo-Dienste denselben Kundenkontext wiederverwenden können.",
    movedStrong: "Das Adressbuch ist umgezogen.",
    movedBefore:
      "Um eine Adresse mit Google-Places-Verifizierung + KYC-Abgleich hinzuzufügen oder zu bearbeiten, nutze bitte",
    movedLink: "deine Kontoeinstellungen",
    movedAfter:
      "Bestehende Marktplatz-Adressen bleiben hier für ältere Bestellungen lesbar.",
  },
  disputes: {
    title: "Streitfälle",
    description:
      "Eröffne ein Anliegen mit Kontext, halte die Bestellung verknüpft und sieh Updates aus der Support-Phase, ohne den Verlauf zu verlieren.",
    orderPlaceholder: "MKT-ORD-...",
    vendorPlaceholder: "Verkäufer-Kennung (optional)",
    reasonPlaceholder: "Grund für den Streitfall",
    notePlaceholder: "Erkläre, was schiefgelaufen ist und welche Lösung du erwartest.",
    openDispute: "Streitfall eröffnen",
    emptyTitle: "Keine offenen Streitfälle.",
    emptyBody:
      "Wenn du ein Problem mit einer Bestellung meldest, lebt der Verlauf hier mit Status-Updates aus der Support-Phase — nichts fällt aus dem Verlauf heraus.",
  },
  following: {
    title: "Gefolgt",
    description:
      "Gefolgte Shops bleiben im Kontodatensatz erhalten, damit Merchandising und Reaktivierung kontextbezogen statt generisch bleiben.",
    toastUnfollowed: "Shop nicht mehr gefolgt.",
    toastFollowed: "Du folgst diesem Shop jetzt.",
    unfollow: "Nicht mehr folgen",
    emptyTitle: "Noch keine gefolgten Shops.",
    emptyBody:
      "Folge einem Shop, um seinen Vertrauenspass und seine neuesten Angebote griffbereit zu halten.",
    emptyCta: "Shops entdecken",
  },
  notifications: {
    title: "Benachrichtigungen",
    description:
      "In-App-, E-Mail- und WhatsApp-Lebenszyklus-Updates sind so gestaltet, dass sie hier als eine einzige, lesbare Konto-Zeitleiste erscheinen.",
    emptyTitle: "Noch keine Benachrichtigungen.",
    emptyBody: "Marktplatz-Lebenszyklus-Updates erscheinen hier.",
  },
  orders: {
    title: "Bestellungen",
    description:
      "Jede Bestellung hält Zahlungsstatus, geteilte Abwicklung und Streitfall-Kontext in einer käuferfreundlichen Zeitleiste sichtbar.",
    emptyTitle: "Noch keine Bestellungen.",
    emptyBody:
      "Die Bestellverlaufs-Oberfläche ist bereit. Sobald du eine Bestellung abschließt, erscheinen hier die Verfolgung geteilter Bestellungen und der Verlauf der Zahlungsprüfung.",
  },
  orderDetail: {
    description:
      "Die Klarheit geteilter Bestellungen bleibt sichtbar, wobei Abwicklung auf Verkäuferebene und Zahlungsstatus getrennt aufgeschlüsselt sind.",
    placed: "Aufgegeben",
    total: "Gesamt",
    payment: "Zahlung",
    henrycoSegment: "HenryCo-Segment",
    fulfillment: "Abwicklung",
    tracking: "Verfolgung",
    trackingPending: "Ausstehend",
    payoutStatus: "Auszahlungsstatus",
    protectionKicker: "Käuferschutz-Steuerung",
    protectionBody:
      "Bestätige den Abschluss, wenn die gelieferte Bestellung zufriedenstellend ist. HenryCo hält die Verkäuferauszahlung treuhänderisch, bis die Bestätigung oder die Timeout-Logik das Segment freigibt.",
    confirmCompletion: "Abschluss bestätigen",
  },
  payments: {
    title: "Zahlungen",
    description:
      "Die Zahlungsprüfung bleibt neben der Bestellreferenz sichtbar, damit die Prüfung von Banküberweisungen nie undurchsichtig wirkt.",
    method: "Methode",
    reference: "HenryCo-Referenz",
    proof: "Nachweis",
    viewProof: "Nachweis ansehen",
    walletDebitRecorded: "Wallet-Abbuchung erfasst",
    notUploaded: "Nicht hochgeladen",
    awaitingReview: "Warten auf Prüfung",
    emptyTitle: "Noch keine Zahlungseinträge.",
    emptyBody:
      "Zahlungsnachweise und Updates zum Nachnahme-Status erscheinen hier nach dem Checkout.",
  },
  saved: {
    title: "Für später gespeichert",
    description:
      "Artikel, die du aus dem Warenkorb genommen hast, damit dein Korb nicht blockiert wird — stelle einen wieder her, wenn du bereit bist, oder entferne ihn.",
    emptyTitle: "Noch keine gespeicherten Artikel.",
    emptyBody:
      "Wenn du bei einem Warenkorbartikel auf „Für später speichern“ tippst, erscheint er hier mit dem Preis, den du festgehalten hast. Gespeicherte Artikel bleiben 90 Tage; wir warnen dich, wenn einer bald abläuft.",
    emptyCta: "Marktplatz durchstöbern",
    savedItemFallback: "Gespeicherter Artikel",
    savedRelative: "Gespeichert {relative}",
    restoreToCart: "In den Warenkorb zurücklegen",
    clear: "Entfernen",
    removeAria: "Gespeicherten Artikel entfernen",
  },
  support: {
    title: "Support",
    description:
      "Eröffne ein Ticket, das mit deinem Henry & Co.-Konto, deinem Bestellverlauf und deinem Streitfall-Verlauf verknüpft ist. Antworten bleiben im selben Verlauf, sodass du den Kontext nie neu eingeben musst.",
    threadOpened: "Verlauf eröffnet",
    submittedHeading:
      "Eine Person aus dem Support-Team liest deine Nachricht und antwortet per E-Mail und in diesem Verlauf.",
    submittedBody:
      "Die Antwort erfolgt in der Regel innerhalb von 1 Werktag. Updates erscheinen in der Verlaufsliste rechts und in deinen Benachrichtigungen.",
    openTicketKicker: "Ticket eröffnen",
    storePrefix: "Shop · {name}",
    formHeading:
      "Sag uns, was los ist, und wir halten Bestellung, Zahlung und Vertrauensverlauf verknüpft.",
    formIntro:
      "Deine Konto-E-Mail und dein Name sind vorausgefüllt. Füge Bestellung oder Verkäufer nur hinzu, wenn es relevant ist — den Rest kann das Team suchen.",
    yourName: "Dein Name",
    replyToEmail: "Antwort-E-Mail",
    thisIsAbout: "Hierbei geht es um",
    subjectLabel: "Betreff",
    subjectPlaceholder: "Eine kurze Zeile — wie der Betreff der E-Mail, die du uns schreiben würdest",
    whatHappened: "Was passiert ist",
    whatHappenedPlaceholder:
      "Bestellnummern, Daten und was wir tun sollen, helfen uns, es schneller zu lösen. Mach dir keine Sorgen um die Formatierung.",
    orderNumberOptional: "Bestellnummer (optional)",
    orderNumberPlaceholder: "MKT-ORD-...",
    openTheTicket: "Ticket eröffnen",
    backToHelp: "Zurück zum Hilfecenter",
    privacyNote:
      "Wir hängen deinen Bestell- und Streitfall-Verlauf nur für das Support-Team an den Verlauf an. Wir geben Kontaktdaten niemals an Verkäufer weiter; sie erreichen dich über die Plattform.",
    orEmail: "Oder schreibe an {email}",
    subjectOrder: "Eine Bestellung oder Lieferung",
    subjectPayment: "Eine Zahlung oder Rückerstattung",
    subjectVendor: "Ein bestimmter Shop oder Verkäufer",
    subjectAccount: "Mein Henry & Co.-Konto",
    subjectTrust: "Vertrauen, Sicherheit oder Moderation",
    subjectOther: "Etwas anderes",
    openThreadsHeading: "Offene Verläufe",
    activeSuffix: "{count} aktiv",
    closedHeading: "Geschlossen",
    resolvedSuffix: "{count} gelöst",
    noOpenThreadsTitle: "Keine offenen Verläufe",
    noOpenThreadsBody:
      "Alles, was du eröffnest, erscheint hier, mit den Antworten und Updates, die das Team postet.",
    updatedRelative: "Aktualisiert {relative}",
    noTicketsTitle: "Noch keine Tickets — genau das ist das Ziel.",
    noTicketsBody:
      "Falls doch etwas aufkommt, hält das Eröffnen eines Tickets hier Bestellung, Verkäufer und etwaige Streitfall-Notizen verknüpft, damit wir direkt handeln können.",
    noTicketsCta: "Hilfeartikel durchsuchen",
  },
  wishlist: {
    title: "Wunschliste",
    description:
      "Gespeicherte Produkte bleiben mit dem Konto verknüpft, damit künftige Empfehlungen und Concierge-Korb-Abläufe von der Absicht ausgehen können, nicht vom Raten.",
    toastRemoved: "Von der Wunschliste entfernt.",
    toastSaved: "Zur Wunschliste hinzugefügt.",
    remove: "Von der Wunschliste entfernen",
    emptyTitle: "Die Wunschliste ist leer.",
    emptyBody:
      "Speichere Produkte, um eine ruhigere, bewusstere Einkaufs-Vorauswahl aufzubauen.",
    emptyCta: "Marktplatz durchstöbern",
  },
  addressesClient: {
    headingEdit: "Gespeicherte Adresse aktualisieren",
    headingAdd: "Gespeicherte Adresse hinzufügen",
    introTitle: "Gespeicherte Adresse hinzufügen",
    introBody:
      "Gespeicherte Ziele werden beim Checkout, beim Support-Follow-up und für die künftige Kontokontinuität wiederverwendet. Änderungen des Standards werden sofort wirksam.",
    labelPlaceholder: "Bezeichnung: Zuhause, Büro...",
    recipientPlaceholder: "Name des Empfängers",
    phonePlaceholder: "Telefonnummer",
    cityPlaceholder: "Stadt",
    regionPlaceholder: "Region / Bundesland",
    countryPlaceholder: "Land",
    line1Placeholder: "Adresszeile 1",
    line2Placeholder: "Adresszeile 2 (optional)",
    setDefault: "Als Standardadresse festlegen",
    saving: "Speichern...",
    savingLabel: "Adresse wird gespeichert",
    updateAddress: "Adresse aktualisieren",
    saveAddress: "Adresse speichern",
    cancelEdit: "Bearbeitung abbrechen",
    emptyTitle: "Noch keine gespeicherten Adressen.",
    emptyBody:
      "Speichere ein Ziel einmal und HenryCo hält es für künftige Checkouts, Support-Anfragen und Bestell-Follow-ups bereit.",
    defaultBadge: "Standard",
    edit: "Bearbeiten",
    setDefaultAction: "Als Standard festlegen",
    deleteAction: "Löschen",
    updatingDefaultLabel: "Standardadresse wird aktualisiert",
    deletingLabel: "Adresse wird gelöscht",
    saveFailed: "Speichern der Adresse fehlgeschlagen.",
    actionFailed: "Adressaktion fehlgeschlagen.",
    toastUpdated: "Adresse aktualisiert",
    toastSaved: "Adresse gespeichert",
    toastUpdatedDefaultBody: "Diese Adresse ist jetzt dein Standard-Checkout-Ziel.",
    toastSavedBody: "Die Adresse ist jetzt in deinem gesamten Marktplatz-Konto verfügbar.",
    toastSaveFailed: "Speichern der Adresse fehlgeschlagen",
    toastRemoved: "Adresse entfernt",
    toastDefaultUpdated: "Standardadresse aktualisiert",
    toastActionFailed: "Adressaktion fehlgeschlagen",
  },
  reviewsClient: {
    policyTitle: "Bewertungsrichtlinie",
    policyBody:
      "Verifizierte Käufe werden sofort veröffentlicht und speisen das Produkt- und Verkäufervertrauen. Unverifizierte Bewertungen zählen weiterhin als Nachweis, durchlaufen aber zuerst die Moderation, statt das Vertrauen sofort aufzublähen.",
    selectProduct: "Produkt auswählen",
    starSingular: "{rating} Stern",
    starPlural: "{rating} Sterne",
    titlePlaceholder: "Titel der Bewertung",
    bodyPlaceholder: "Teile, wie sich das Produkt- und Liefererlebnis angefühlt hat.",
    submitting: "Wird gesendet...",
    submittingLabel: "Bewertung wird gesendet",
    submitReview: "Bewertung senden",
    emptyTitle: "Noch keine Bewertungen abgegeben.",
    emptyBody:
      "Bewertungen verifizierter Käufe leben hier. Wähle oben ein Produkt, bewerte es, und dein Feedback wird Teil der Vertrauensebene, wenn jemand es das nächste Mal in Betracht zieht.",
    verifiedPurchase: "Verifizierter Kauf",
    awaitingModeration: "Warten auf Moderationsbestätigung",
    submitFailed: "Senden der Bewertung fehlgeschlagen.",
    toastPublished: "Bewertung veröffentlicht",
    toastSubmitted: "Bewertung gesendet",
    toastPublishedBody:
      "Deine verifizierte Bewertung trägt jetzt zum Produkt- und Verkäufervertrauen bei.",
    toastPendingBody:
      "Deine Bewertung ist in Moderation, weil wir den Kauf nicht automatisch verifizieren konnten.",
    toastSubmitFailed: "Senden der Bewertung fehlgeschlagen",
  },
};

const IT: DeepPartial<MarketplaceCustomerAccountCopy> = {
  overview: {
    titleNamed: "Attività marketplace di {name}",
    titleFallback: "Attività marketplace",
    description:
      "Ordini, articoli salvati, negozi seguiti e attività dell'account in una vista più tranquilla. HenryCo unifica questi segnali tra le divisioni così che la cronologia resti collegata allo stesso account.",
    trackOrder: "Traccia un ordine",
    continueShopping: "Continua lo shopping",
    snapshotLabel: "Riepilogo dell'account",
    kpiActiveOrders: "Ordini attivi",
    kpiActiveHintSingular: "{count} ordine ancora in corso.",
    kpiActiveHintPlural: "{count} ordini ancora in corso.",
    kpiActiveHintEmpty: "Nessun ordine in corso al momento.",
    kpiInTransit: "In transito",
    kpiInTransitHint: "Tracciato dalla spedizione alla consegna.",
    kpiInTransitHintEmpty: "Quando un ordine viene spedito, compare qui.",
    kpiSavedItems: "Articoli salvati",
    kpiSavedHint: "I pezzi che hai tenuto d'occhio.",
    kpiSavedHintEmpty: "Metti un cuore su qualcosa per iniziare una lista dei desideri.",
    kpiFollowing: "Seguiti",
    kpiFollowingHintSingular: "{count} negozio che segui per le novità.",
    kpiFollowingHintPlural: "{count} negozi che segui per le novità.",
    kpiFollowingHintEmpty: "Segui i negozi per scoprire le novità per primo.",
    quickActionsLabel: "Azioni rapide",
    qaTrackEyebrow: "Traccia",
    qaTrackTitle: "Traccia un ordine",
    qaTrackBody: "Cerca un ordine tramite il suo codice di riferimento.",
    qaSavedEyebrow: "Salvati",
    qaSavedTitle: "Apri la lista dei desideri",
    qaSavedBody: "I pezzi che hai salvato, pronti da rivedere.",
    qaProfileEyebrow: "Profilo",
    qaProfileTitle: "Gestisci gli indirizzi",
    qaProfileBody: "Consegna predefinita e indirizzi salvati.",
    qaApplicationEyebrow: "Candidatura",
    qaApplicationTitle: "Continua la tua candidatura come venditore",
    qaApplicationBodyStatus: "Stato: {status}.",
    qaSellerEyebrow: "Diventa venditore",
    qaSellerTitle: "Candidati per vendere su HenryCo",
    qaSellerBody: "Raggiungi gli acquirenti in tutto l'ecosistema HenryCo.",
    recentOrdersKicker: "Ordini recenti",
    recentOrdersHeading: "Ultima attività dai tuoi acquisti",
    recentOrdersHeadingEmpty: "I tuoi ordini compariranno qui",
    viewAll: "Vedi tutto",
    orderLabel: "Ordine {orderNo}",
    placedRelative: "Effettuato {relative}",
    storesSuffixSingular: "{count} negozio",
    storesSuffixPlural: "{count} negozi",
    viewOrder: "Vedi",
    emptyOrdersBody:
      "Non hai ancora effettuato alcun ordine. Sfoglia il marketplace per trovare negozi verificati e selezioni curate.",
    browseMarketplace: "Sfoglia il marketplace",
    savedKicker: "Articoli salvati",
    savedHeading: "I pezzi che hai tenuto d'occhio",
    savedHeadingEmpty: "La tua lista dei desideri è vuota",
    openWishlist: "Apri la lista dei desideri",
    emptySavedBody:
      "Metti un cuore sui prodotti che vuoi rivedere. Ti aspetteranno nel tuo account accanto ai tuoi ordini e ai negozi seguiti.",
    followingKicker: "Seguiti",
    followingHeading: "Negozi che segui",
    followingHeadingEmpty: "Segui i negozi per scoprire le novità per primo",
    emptyFollowingBody:
      "Tocca il nome del negozio in una pagina prodotto per seguirlo. Mostreremo qui la sua prossima novità.",
    verifiedSuffix: "{level} verificato",
    verifiedVendor: "Venditore verificato",
    responseSuffix: "risposta in {hours} h",
    activityKicker: "Attività recente",
    activityHeading: "Aggiornamenti dal tuo account",
    activityHeadingEmpty: "L'attività comparirà qui",
    emptyActivityBody:
      "Conferme d'ordine, aggiornamenti di spedizione e messaggi dei negozi compariranno qui.",
    newBadge: "Nuovo",
    quickActionOpen: "Apri",
    relativeJustNow: "proprio ora",
    relativeMinutes: "{value} min fa",
    relativeHours: "{value} h fa",
    relativeDays: "{value} g fa",
    relativeMonths: "{value} mesi fa",
    relativeYears: "{value} anni fa",
    buyerFallback: "Acquirente",
  },
  addresses: {
    title: "Indirizzi",
    description:
      "Gli indirizzi salvati restano legati all'account condiviso così che i futuri servizi HenryCo possano riutilizzare lo stesso contesto cliente.",
    movedStrong: "La rubrica degli indirizzi è stata spostata.",
    movedBefore:
      "Per aggiungere o modificare un indirizzo con la verifica Google Places + l'allineamento KYC, usa",
    movedLink: "le impostazioni del tuo account",
    movedAfter:
      "Gli indirizzi marketplace esistenti restano leggibili qui per gli ordini precedenti.",
  },
  disputes: {
    title: "Contestazioni",
    description:
      "Apri una segnalazione con il suo contesto, mantieni l'ordine collegato e vedi gli aggiornamenti della fase di supporto senza perdere la cronologia.",
    orderPlaceholder: "MKT-ORD-...",
    vendorPlaceholder: "Identificativo del venditore (facoltativo)",
    reasonPlaceholder: "Motivo della contestazione",
    notePlaceholder: "Spiega cosa è andato storto e quale risoluzione ti aspetti.",
    openDispute: "Apri contestazione",
    emptyTitle: "Nessuna contestazione aperta.",
    emptyBody:
      "Quando sollevi un problema su un ordine, la conversazione vive qui con gli aggiornamenti di stato della fase di supporto — nulla esce dalla cronologia.",
  },
  following: {
    title: "Seguiti",
    description:
      "I negozi seguiti restano registrati nell'account così che il merchandising e il re-engagement rimangano contestuali invece che generici.",
    toastUnfollowed: "Hai smesso di seguire il negozio.",
    toastFollowed: "Ora segui questo negozio.",
    unfollow: "Smetti di seguire",
    emptyTitle: "Nessun negozio seguito per ora.",
    emptyBody:
      "Segui un negozio per tenere a portata di mano il suo passaporto di fiducia e le ultime offerte.",
    emptyCta: "Scopri i negozi",
  },
  notifications: {
    title: "Notifiche",
    description:
      "Gli aggiornamenti del ciclo di vita in-app, via e-mail e via WhatsApp sono pensati per comparire qui come un'unica cronologia dell'account leggibile.",
    emptyTitle: "Nessuna notifica per ora.",
    emptyBody: "Gli aggiornamenti del ciclo di vita del marketplace compariranno qui.",
  },
  orders: {
    title: "Ordini",
    description:
      "Ogni ordine mantiene visibili lo stato del pagamento, l'evasione divisa e il contesto delle contestazioni in una cronologia facile per l'acquirente.",
    emptyTitle: "Nessun ordine per ora.",
    emptyBody:
      "L'area cronologia ordini è pronta. Una volta completato il pagamento, qui compariranno il tracciamento degli ordini divisi e la cronologia di verifica dei pagamenti.",
  },
  orderDetail: {
    description:
      "La chiarezza degli ordini divisi resta visibile, con l'evasione a livello di venditore e lo stato del pagamento dettagliati separatamente.",
    placed: "Effettuato",
    total: "Totale",
    payment: "Pagamento",
    henrycoSegment: "Segmento HenryCo",
    fulfillment: "Evasione",
    tracking: "Tracciamento",
    trackingPending: "In attesa",
    payoutStatus: "Stato del pagamento al venditore",
    protectionKicker: "Controllo della protezione acquirente",
    protectionBody:
      "Conferma il completamento quando l'ordine consegnato è soddisfacente. HenryCo mantiene il pagamento al venditore in deposito a garanzia fino alla conferma o finché la logica di timeout non libera il segmento.",
    confirmCompletion: "Conferma completamento",
  },
  payments: {
    title: "Pagamenti",
    description:
      "La verifica del pagamento resta visibile accanto al riferimento dell'ordine così che la revisione dei bonifici bancari non risulti mai opaca.",
    method: "Metodo",
    reference: "Riferimento HenryCo",
    proof: "Prova",
    viewProof: "Vedi la prova",
    walletDebitRecorded: "Addebito sul portafoglio registrato",
    notUploaded: "Non caricato",
    awaitingReview: "In attesa di revisione",
    emptyTitle: "Nessun registro di pagamento per ora.",
    emptyBody:
      "Le prove di pagamento e gli aggiornamenti dello stato del pagamento alla consegna compariranno qui dopo il checkout.",
  },
  saved: {
    title: "Salvati per dopo",
    description:
      "Articoli che hai tolto dal carrello per non bloccare il cesto — ripristinane uno quando sei pronto, oppure rimuovilo.",
    emptyTitle: "Nessun articolo salvato per ora.",
    emptyBody:
      "Quando premi «Salva per dopo» su un articolo del carrello, compare qui con il prezzo che hai bloccato. Gli articoli salvati durano 90 giorni; ti avviseremo se uno sta per scadere.",
    emptyCta: "Sfoglia il marketplace",
    savedItemFallback: "Articolo salvato",
    savedRelative: "Salvato {relative}",
    restoreToCart: "Ripristina nel carrello",
    clear: "Rimuovi",
    removeAria: "Rimuovi l'articolo salvato",
  },
  support: {
    title: "Assistenza",
    description:
      "Apri un ticket collegato al tuo account Henry & Co., alla cronologia ordini e alla cronologia delle contestazioni. Le risposte restano nella stessa conversazione così non riscrivi mai il contesto.",
    threadOpened: "Conversazione aperta",
    submittedHeading:
      "Una persona del team di assistenza leggerà il tuo messaggio e risponderà via e-mail e in questa conversazione.",
    submittedBody:
      "La risposta arriva di solito entro 1 giorno lavorativo. Gli aggiornamenti compaiono nell'elenco delle conversazioni a destra e nelle tue notifiche.",
    openTicketKicker: "Apri un ticket",
    storePrefix: "Negozio · {name}",
    formHeading:
      "Dicci cosa sta succedendo e manterremo collegati ordine, pagamento e cronologia di fiducia.",
    formIntro:
      "La tua e-mail e il tuo nome dell'account sono precompilati. Aggiungi l'ordine o il venditore solo se è pertinente — il team può cercare il resto.",
    yourName: "Il tuo nome",
    replyToEmail: "E-mail di risposta",
    thisIsAbout: "Si tratta di",
    subjectLabel: "Oggetto",
    subjectPlaceholder: "Una riga breve — come l'oggetto dell'e-mail che ci scriveresti",
    whatHappened: "Cosa è successo",
    whatHappenedPlaceholder:
      "Numeri d'ordine, date e cosa vorresti che facessimo ci aiutano a risolvere più in fretta. Non preoccuparti della formattazione.",
    orderNumberOptional: "Numero d'ordine (facoltativo)",
    orderNumberPlaceholder: "MKT-ORD-...",
    openTheTicket: "Apri il ticket",
    backToHelp: "Torna al centro assistenza",
    privacyNote:
      "Alleghiamo la tua cronologia di ordini e contestazioni alla conversazione solo per il team di assistenza. Non condividiamo mai i dati di contatto con i venditori; ti raggiungono tramite la piattaforma.",
    orEmail: "Oppure scrivi a {email}",
    subjectOrder: "Un ordine o una consegna",
    subjectPayment: "Un pagamento o un rimborso",
    subjectVendor: "Un negozio o un venditore specifico",
    subjectAccount: "Il mio account Henry & Co.",
    subjectTrust: "Fiducia, sicurezza o moderazione",
    subjectOther: "Qualcos'altro",
    openThreadsHeading: "Conversazioni aperte",
    activeSuffix: "{count} attive",
    closedHeading: "Chiuse",
    resolvedSuffix: "{count} risolte",
    noOpenThreadsTitle: "Nessuna conversazione aperta",
    noOpenThreadsBody:
      "Tutto ciò che apri comparirà qui, con le risposte e gli aggiornamenti che il team pubblica.",
    updatedRelative: "Aggiornato {relative}",
    noTicketsTitle: "Nessun ticket per ora — è proprio questo l'obiettivo.",
    noTicketsBody:
      "Se dovesse emergere qualcosa, aprire un ticket qui mantiene collegati ordine, venditore ed eventuali note di contestazione così possiamo agire direttamente.",
    noTicketsCta: "Sfoglia gli articoli di aiuto",
  },
  wishlist: {
    title: "Lista dei desideri",
    description:
      "I prodotti salvati restano collegati all'account così che le future raccomandazioni e i flussi di cesto concierge possano partire dall'intenzione, non da supposizioni.",
    toastRemoved: "Rimosso dalla lista dei desideri.",
    toastSaved: "Salvato nella lista dei desideri.",
    remove: "Rimuovi dalla lista dei desideri",
    emptyTitle: "La lista dei desideri è vuota.",
    emptyBody:
      "Salva prodotti per costruire una rosa d'acquisto più tranquilla e ponderata.",
    emptyCta: "Sfoglia il marketplace",
  },
  addressesClient: {
    headingEdit: "Aggiorna il tuo indirizzo salvato",
    headingAdd: "Aggiungi un indirizzo salvato",
    introTitle: "Aggiungi un indirizzo salvato",
    introBody:
      "Le destinazioni salvate vengono riutilizzate dal checkout, dal follow-up dell'assistenza e dalla continuità futura dell'account. Le modifiche al valore predefinito hanno effetto immediato.",
    labelPlaceholder: "Etichetta: Casa, Ufficio...",
    recipientPlaceholder: "Nome del destinatario",
    phonePlaceholder: "Numero di telefono",
    cityPlaceholder: "Città",
    regionPlaceholder: "Regione / Stato",
    countryPlaceholder: "Paese",
    line1Placeholder: "Indirizzo riga 1",
    line2Placeholder: "Indirizzo riga 2 (facoltativo)",
    setDefault: "Imposta come indirizzo predefinito",
    saving: "Salvataggio...",
    savingLabel: "Salvataggio dell'indirizzo",
    updateAddress: "Aggiorna indirizzo",
    saveAddress: "Salva indirizzo",
    cancelEdit: "Annulla modifica",
    emptyTitle: "Nessun indirizzo salvato per ora.",
    emptyBody:
      "Salva una destinazione una volta e HenryCo la terrà pronta per i tuoi futuri checkout, richieste di assistenza e follow-up degli ordini.",
    defaultBadge: "Predefinito",
    edit: "Modifica",
    setDefaultAction: "Imposta come predefinito",
    deleteAction: "Elimina",
    updatingDefaultLabel: "Aggiornamento dell'indirizzo predefinito",
    deletingLabel: "Eliminazione dell'indirizzo",
    saveFailed: "Salvataggio dell'indirizzo non riuscito.",
    actionFailed: "Azione sull'indirizzo non riuscita.",
    toastUpdated: "Indirizzo aggiornato",
    toastSaved: "Indirizzo salvato",
    toastUpdatedDefaultBody: "Questo indirizzo è ora la tua destinazione di checkout predefinita.",
    toastSavedBody: "L'indirizzo è ora disponibile in tutto il tuo account marketplace.",
    toastSaveFailed: "Salvataggio dell'indirizzo non riuscito",
    toastRemoved: "Indirizzo rimosso",
    toastDefaultUpdated: "Indirizzo predefinito aggiornato",
    toastActionFailed: "Azione sull'indirizzo non riuscita",
  },
  reviewsClient: {
    policyTitle: "Politica delle recensioni",
    policyBody:
      "Gli acquisti verificati vengono pubblicati subito e alimentano la fiducia nel prodotto e nel venditore. Le recensioni non verificate contano comunque come prova, ma passano prima dalla moderazione invece di gonfiare la fiducia all'istante.",
    selectProduct: "Seleziona un prodotto",
    starSingular: "{rating} stella",
    starPlural: "{rating} stelle",
    titlePlaceholder: "Titolo della recensione",
    bodyPlaceholder: "Racconta com'è stata l'esperienza con il prodotto e la consegna.",
    submitting: "Invio...",
    submittingLabel: "Invio della recensione",
    submitReview: "Invia recensione",
    emptyTitle: "Nessuna recensione inviata per ora.",
    emptyBody:
      "Le recensioni degli acquisti verificati vivono qui. Scegli un prodotto sopra, valutalo, e il tuo feedback si unisce allo strato di fiducia la prossima volta che qualcuno lo considera.",
    verifiedPurchase: "Acquisto verificato",
    awaitingModeration: "In attesa di conferma della moderazione",
    submitFailed: "Invio della recensione non riuscito.",
    toastPublished: "Recensione pubblicata",
    toastSubmitted: "Recensione inviata",
    toastPublishedBody:
      "La tua recensione verificata contribuisce ora alla fiducia nel prodotto e nel venditore.",
    toastPendingBody:
      "La tua recensione è in moderazione perché non siamo riusciti a verificare l'acquisto automaticamente.",
    toastSubmitFailed: "Invio della recensione non riuscito",
  },
};

const ZH: DeepPartial<MarketplaceCustomerAccountCopy> = {
  overview: {
    titleNamed: "{name} 的商城动态",
    titleFallback: "商城动态",
    description:
      "订单、已保存的商品、关注的店铺和账户动态汇聚在一个更从容的视图中。HenryCo 在各业务板块之间统一这些信号，让记录始终与同一个账户关联。",
    trackOrder: "追踪订单",
    continueShopping: "继续购物",
    snapshotLabel: "账户概览",
    kpiActiveOrders: "进行中的订单",
    kpiActiveHintSingular: "{count} 个订单仍在进行中。",
    kpiActiveHintPlural: "{count} 个订单仍在进行中。",
    kpiActiveHintEmpty: "目前没有进行中的订单。",
    kpiInTransit: "运送中",
    kpiInTransitHint: "从发货到送达全程追踪。",
    kpiInTransitHintEmpty: "订单一旦发货，就会出现在这里。",
    kpiSavedItems: "已保存的商品",
    kpiSavedHint: "你一直关注的单品。",
    kpiSavedHintEmpty: "为任意商品点个心，开始一份心愿单。",
    kpiFollowing: "关注中",
    kpiFollowingHintSingular: "你关注 {count} 家店铺以获取上新。",
    kpiFollowingHintPlural: "你关注 {count} 家店铺以获取上新。",
    kpiFollowingHintEmpty: "关注店铺，抢先看到新品上架。",
    quickActionsLabel: "快捷操作",
    qaTrackEyebrow: "追踪",
    qaTrackTitle: "追踪订单",
    qaTrackBody: "用参考编码查找订单。",
    qaSavedEyebrow: "已保存",
    qaSavedTitle: "打开心愿单",
    qaSavedBody: "你保存的单品，随时可以再看。",
    qaProfileEyebrow: "个人资料",
    qaProfileTitle: "管理地址",
    qaProfileBody: "默认配送和已保存的地点。",
    qaApplicationEyebrow: "申请",
    qaApplicationTitle: "继续你的卖家申请",
    qaApplicationBodyStatus: "状态：{status}。",
    qaSellerEyebrow: "成为卖家",
    qaSellerTitle: "申请在 HenryCo 上销售",
    qaSellerBody: "触达整个 HenryCo 生态中的买家。",
    recentOrdersKicker: "最近订单",
    recentOrdersHeading: "你购买的最新动态",
    recentOrdersHeadingEmpty: "你的订单将显示在这里",
    viewAll: "查看全部",
    orderLabel: "订单 {orderNo}",
    placedRelative: "下单于 {relative}",
    storesSuffixSingular: "{count} 家店铺",
    storesSuffixPlural: "{count} 家店铺",
    viewOrder: "查看",
    emptyOrdersBody:
      "你还没有下过订单。浏览商城，发现经过验证的店铺和精选上新。",
    browseMarketplace: "浏览商城",
    savedKicker: "已保存的商品",
    savedHeading: "你一直关注的单品",
    savedHeadingEmpty: "你的心愿单是空的",
    openWishlist: "打开心愿单",
    emptySavedBody:
      "为你想再看的商品点个心。它们会在你的账户里，连同你的订单和关注一起等着你。",
    followingKicker: "关注中",
    followingHeading: "你关注的店铺",
    followingHeadingEmpty: "关注店铺，抢先看到上新",
    emptyFollowingBody:
      "在商品页面点击店铺名称即可关注。我们会在这里展示它们的下一次上新。",
    verifiedSuffix: "{level} 已验证",
    verifiedVendor: "已验证卖家",
    responseSuffix: "{hours} 小时内回应",
    activityKicker: "最近动态",
    activityHeading: "你账户的更新",
    activityHeadingEmpty: "动态将显示在这里",
    emptyActivityBody: "订单确认、发货更新和店铺消息将显示在这里。",
    newBadge: "新",
    quickActionOpen: "打开",
    relativeJustNow: "刚刚",
    relativeMinutes: "{value} 分钟前",
    relativeHours: "{value} 小时前",
    relativeDays: "{value} 天前",
    relativeMonths: "{value} 个月前",
    relativeYears: "{value} 年前",
    buyerFallback: "买家",
  },
  addresses: {
    title: "地址",
    description:
      "已保存的地址始终与共享账户绑定，让未来的 HenryCo 服务能够复用同一份客户上下文。",
    movedStrong: "地址簿已迁移。",
    movedBefore:
      "若要添加或编辑带有 Google Places 验证 + KYC 对齐的地址，请使用",
    movedLink: "你的账户设置",
    movedAfter: "现有的商城地址在此仍可读取，用于历史订单。",
  },
  disputes: {
    title: "争议",
    description:
      "带上下文发起一个问题，保持订单关联，并查看支持阶段的更新，而不会丢失记录。",
    orderPlaceholder: "MKT-ORD-...",
    vendorPlaceholder: "卖家标识（可选）",
    reasonPlaceholder: "争议原因",
    notePlaceholder: "说明出了什么问题以及你期望的解决方案。",
    openDispute: "发起争议",
    emptyTitle: "没有进行中的争议。",
    emptyBody:
      "当你就某个订单提出问题时，对话会保留在这里，并带有来自支持阶段的状态更新——任何记录都不会丢失。",
  },
  following: {
    title: "关注中",
    description:
      "关注的店铺会保存在账户记录中，让营销和再触达保持与上下文相关，而非千篇一律。",
    toastUnfollowed: "已取消关注该店铺。",
    toastFollowed: "你现在已关注该店铺。",
    unfollow: "取消关注店铺",
    emptyTitle: "还没有关注任何店铺。",
    emptyBody: "关注一家店铺，将其信任档案和最新优惠保持在手边。",
    emptyCta: "发现店铺",
  },
  notifications: {
    title: "通知",
    description:
      "应用内、电子邮件和 WhatsApp 的生命周期更新被设计为在此以一条可读的账户时间线呈现。",
    emptyTitle: "还没有通知。",
    emptyBody: "商城生命周期更新将显示在这里。",
  },
  orders: {
    title: "订单",
    description:
      "每个订单都在一条对买家友好的时间线上保持付款状态、分拆履约和争议上下文可见。",
    emptyTitle: "还没有订单。",
    emptyBody:
      "订单历史界面已就绪。你完成结账后，分拆订单追踪和付款验证历史将显示在这里。",
  },
  orderDetail: {
    description: "分拆订单的清晰度保持可见，卖家级别的履约和付款状态分别拆解列出。",
    placed: "下单于",
    total: "总计",
    payment: "付款",
    henrycoSegment: "HenryCo 分段",
    fulfillment: "履约",
    tracking: "追踪",
    trackingPending: "待处理",
    payoutStatus: "结款状态",
    protectionKicker: "买家保护控制",
    protectionBody:
      "当送达的订单令你满意时，请确认完成。HenryCo 会将给卖家的结款托管，直到确认或超时逻辑清算该分段。",
    confirmCompletion: "确认完成",
  },
  payments: {
    title: "付款",
    description:
      "付款验证始终显示在订单参考旁边，让银行转账审核绝不显得不透明。",
    method: "方式",
    reference: "HenryCo 参考号",
    proof: "凭证",
    viewProof: "查看凭证",
    walletDebitRecorded: "已记录钱包扣款",
    notUploaded: "未上传",
    awaitingReview: "等待审核",
    emptyTitle: "还没有付款记录。",
    emptyBody: "结账后，付款凭证和货到付款状态更新将显示在这里。",
  },
  saved: {
    title: "稍后保存",
    description:
      "你从购物车中移出的商品，以免占用你的购物篮——准备好时恢复一件，或将其清除。",
    emptyTitle: "还没有已保存的商品。",
    emptyBody:
      "当你在购物车商品上点击「稍后保存」时，它会带着你锁定的价格出现在这里。已保存商品保留 90 天；如果有任何一件即将到期，我们会提醒你。",
    emptyCta: "浏览商城",
    savedItemFallback: "已保存的商品",
    savedRelative: "保存于 {relative}",
    restoreToCart: "恢复到购物车",
    clear: "清除",
    removeAria: "移除已保存的商品",
  },
  support: {
    title: "支持",
    description:
      "开一张工单，关联到你的 Henry & Co. 账户、订单历史和争议记录。回复保留在同一个对话中，让你无需再次输入上下文。",
    threadOpened: "对话已开启",
    submittedHeading: "支持团队的成员会阅读你的消息，并通过电子邮件和此对话回复。",
    submittedBody:
      "通常在 1 个工作日内回复。更新会出现在右侧的对话列表和你的通知中。",
    openTicketKicker: "开一张工单",
    storePrefix: "店铺 · {name}",
    formHeading: "告诉我们发生了什么，我们会保持订单、付款和信任记录的关联。",
    formIntro:
      "你的账户电子邮件和姓名已预填。仅在相关时才添加订单或卖家——其余的团队可以自行查找。",
    yourName: "你的姓名",
    replyToEmail: "回复电子邮件",
    thisIsAbout: "这是关于",
    subjectLabel: "主题",
    subjectPlaceholder: "一行简短的话——就像你写给我们的邮件主题",
    whatHappened: "发生了什么",
    whatHappenedPlaceholder:
      "订单号、日期以及你希望我们做什么，能帮助我们更快地解决。无需在意格式。",
    orderNumberOptional: "订单号（可选）",
    orderNumberPlaceholder: "MKT-ORD-...",
    openTheTicket: "开启工单",
    backToHelp: "返回帮助中心",
    privacyNote:
      "我们仅为支持团队将你的订单和争议记录附加到对话中。我们绝不与卖家分享联系方式；他们通过平台联系你。",
    orEmail: "或发送邮件至 {email}",
    subjectOrder: "订单或配送",
    subjectPayment: "付款或退款",
    subjectVendor: "某个特定的店铺或卖家",
    subjectAccount: "我的 Henry & Co. 账户",
    subjectTrust: "信任、安全或审核",
    subjectOther: "其他事项",
    openThreadsHeading: "进行中的对话",
    activeSuffix: "{count} 个进行中",
    closedHeading: "已关闭",
    resolvedSuffix: "{count} 个已解决",
    noOpenThreadsTitle: "没有进行中的对话",
    noOpenThreadsBody: "你开启的任何对话都会显示在这里，以及团队发布的回复和更新。",
    updatedRelative: "更新于 {relative}",
    noTicketsTitle: "还没有工单——这正是目标。",
    noTicketsBody:
      "如果确实出现什么情况，在此开一张工单会保持订单、卖家和任何争议备注的关联，让我们能直接处理。",
    noTicketsCta: "浏览帮助文章",
  },
  wishlist: {
    title: "心愿单",
    description:
      "已保存的产品始终与账户关联，让未来的推荐和管家式购物篮流程能够从意图出发，而非凭猜测。",
    toastRemoved: "已从心愿单移除。",
    toastSaved: "已保存到心愿单。",
    remove: "从心愿单移除",
    emptyTitle: "心愿单是空的。",
    emptyBody: "保存产品，建立一份更从容、更有主见的购买备选清单。",
    emptyCta: "浏览商城",
  },
  addressesClient: {
    headingEdit: "更新你已保存的地址",
    headingAdd: "添加一个已保存的地址",
    introTitle: "添加一个已保存的地址",
    introBody:
      "已保存的目的地会在结账、支持跟进以及未来的账户连续性中复用。默认设置的更改会立即生效。",
    labelPlaceholder: "标签：家、办公室……",
    recipientPlaceholder: "收件人姓名",
    phonePlaceholder: "电话号码",
    cityPlaceholder: "城市",
    regionPlaceholder: "地区 / 州",
    countryPlaceholder: "国家",
    line1Placeholder: "地址第 1 行",
    line2Placeholder: "地址第 2 行（可选）",
    setDefault: "设为默认地址",
    saving: "保存中……",
    savingLabel: "正在保存地址",
    updateAddress: "更新地址",
    saveAddress: "保存地址",
    cancelEdit: "取消编辑",
    emptyTitle: "还没有已保存的地址。",
    emptyBody:
      "保存一次目的地，HenryCo 会为你未来的结账、支持请求和订单跟进随时备好。",
    defaultBadge: "默认",
    edit: "编辑",
    setDefaultAction: "设为默认",
    deleteAction: "删除",
    updatingDefaultLabel: "正在更新默认地址",
    deletingLabel: "正在删除地址",
    saveFailed: "地址保存失败。",
    actionFailed: "地址操作失败。",
    toastUpdated: "地址已更新",
    toastSaved: "地址已保存",
    toastUpdatedDefaultBody: "此地址现在是你的默认结账目的地。",
    toastSavedBody: "该地址现已在你的整个商城账户中可用。",
    toastSaveFailed: "地址保存失败",
    toastRemoved: "地址已移除",
    toastDefaultUpdated: "默认地址已更新",
    toastActionFailed: "地址操作失败",
  },
  reviewsClient: {
    policyTitle: "评价政策",
    policyBody:
      "经验证的购买会立即发布，并增进产品和卖家的信任。未经验证的评价仍算作证据，但会先进入审核，而不会立刻抬高信任。",
    selectProduct: "选择产品",
    starSingular: "{rating} 星",
    starPlural: "{rating} 星",
    titlePlaceholder: "评价标题",
    bodyPlaceholder: "分享一下产品和配送体验给你的感受。",
    submitting: "提交中……",
    submittingLabel: "正在提交评价",
    submitReview: "提交评价",
    emptyTitle: "还没有提交任何评价。",
    emptyBody:
      "经验证购买的评价会显示在这里。在上方选择一个产品，给它评分，下次有人考虑它时，你的反馈就会加入信任层。",
    verifiedPurchase: "已验证购买",
    awaitingModeration: "等待审核确认",
    submitFailed: "评价提交失败。",
    toastPublished: "评价已发布",
    toastSubmitted: "评价已提交",
    toastPublishedBody: "你经验证的评价现在正在增进产品和卖家的信任。",
    toastPendingBody: "你的评价正在审核中，因为我们无法自动验证此次购买。",
    toastSubmitFailed: "评价提交失败",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<MarketplaceCustomerAccountCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getMarketplaceCustomerAccountCopy(
  locale: AppLocale,
): MarketplaceCustomerAccountCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as MarketplaceCustomerAccountCopy;
  return EN;
}
