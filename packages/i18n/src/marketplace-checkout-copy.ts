import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * MarketplaceCheckoutCopy — i18n surface for the marketplace checkout +
 * cart + product-detail action work-unit ("mkt-checkout").
 *
 * Covers: the /checkout page (empty-cart + sign-in gates, value props,
 * the placement-error banner copy keyed by error code), the mini cart
 * drawer, the full cart experience page, the post-placement
 * acknowledgement (per payment method), the product-detail buy box
 * actions, the store follow actions, and the variant matrix selector.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a DeepPartial that deep-merges over EN so missing keys fall through to
 * EN silently. The brand word "HenryCo" stays verbatim in every locale.
 *
 * Locale policy: EN + fr/es/pt/ar/de/it/zh are authored; ig/yo/ha/hi are
 * intentionally omitted and fall back to EN (human-translation only).
 */
export type MarketplaceCheckoutCopy = {
  checkoutPage: {
    errors: {
      orderNotPlaced: string;
      walletUnavailable: { title: string; body: string };
      insufficientBalance: { title: string; body: string };
      missingBankReference: { title: string; body: string };
      missingPaymentProof: { title: string; body: string };
      proofUploadFailed: { title: string; body: string };
      walletChanged: { title: string; body: string };
    };
    emptyCart: {
      title: string;
      body: string;
      ctaLabel: string;
      viewSaved: string;
    };
    signIn: {
      kicker: string;
      title: string;
      description: string;
      emptyTitle: string;
      emptyBody: string;
      emptyCta: string;
      whyTitle: string;
      accountProtected: { title: string; body: string };
      receipts: { title: string; body: string };
      oneBasket: { title: string; body: string };
    };
  };
  cartDrawer: {
    miniCart: string;
    itemsReadyOne: string;
    itemsReadyOther: string;
    basketEmpty: string;
    henryCoStocked: string;
    verifiedStore: string;
    updatingCart: string;
    saveForLater: string;
    saving: string;
    remove: string;
    updating: string;
    emptyTitle: string;
    emptyBody: string;
    exploreProducts: string;
    viewSaved: string;
    subtotal: string;
    checkoutNote: string;
    finalizing: string;
    viewCart: string;
    checkout: string;
  };
  cartExperience: {
    splitOrderClarity: string;
    henryCoStocked: string;
    verifiedVendor: string;
    trustedSeller: string;
    updatingCart: string;
    saveForLater: string;
    saving: string;
    remove: string;
    removeAria: string;
    wishlisted: string;
    addToWishlist: string;
    openProduct: string;
    checkoutReadiness: string;
    items: string;
    subtotal: string;
    estimatedShipping: string;
    free: string;
    vendorSegmentNote: string;
    continueToCheckout: string;
    keepBrowsing: string;
  };
  placement: {
    wallet: {
      kicker: string;
      headline: string;
      lead: string;
      escrowProtection: { title: string; body: string };
      vendorSegments: { title: string; body: string };
      receipts: { title: string; body: string };
    };
    bankTransfer: {
      kicker: string;
      headline: string;
      lead: string;
      verificationHours: { title: string; body: string };
      escrowLifts: { title: string; body: string };
      reachOut: { title: string; body: string };
    };
    cod: {
      kicker: string;
      headline: string;
      lead: string;
      vendorAccepts: { title: string; body: string };
      payOnArrival: { title: string; body: string };
      updates: { title: string; body: string };
    };
    fallback: {
      kicker: string;
      headline: string;
      lead: string;
      escrowStaysOn: { title: string; body: string };
      vendorsDispatch: { title: string; body: string };
      notifications: { title: string; body: string };
    };
    orderNumber: string;
    total: string;
    confirmationTo: string;
    confirmationFallback: string;
    viewAllOrders: string;
    continueBrowsing: string;
    needHelp: string;
    whatHappensNext: string;
  };
  productActions: {
    addingToCart: string;
    adding: string;
    addToCart: string;
    updatingWishlist: string;
    saving: string;
    savedToWishlist: string;
    save: string;
    updatingFollow: string;
    updating: string;
    followingStore: string;
    followStore: string;
    compareMore: string;
    note: string;
    removeFromWishlist: string;
    saveToWishlist: string;
  };
  storeActions: {
    updatingFollow: string;
    updating: string;
    followingStore: string;
    followThisStore: string;
    savedStores: string;
    browseRelated: string;
  };
  variantMatrix: {
    sectionLabel: string;
    chooseVariant: string;
    skuLabel: string;
    placeholder: string;
    out: string;
    price: string;
    availability: string;
    inStock: string;
    unavailable: string;
    match: string;
    variantResolved: string;
    pickValue: string;
  };
};

const EN: MarketplaceCheckoutCopy = {
  checkoutPage: {
    errors: {
      orderNotPlaced: "Order not placed",
      walletUnavailable: {
        title: "Wallet isn't ready for marketplace debits yet",
        body: "Your HenryCo wallet isn't activated for direct payments. Switch to bank transfer with proof, or top up your wallet first.",
      },
      insufficientBalance: {
        title: "Wallet balance didn't cover the order",
        body: "Top up the shortfall, switch to bank transfer with proof, or use cash on delivery if the order is eligible.",
      },
      missingBankReference: {
        title: "Bank reference missing",
        body: "Add the bank receipt or reference number from your transfer so finance can match it cleanly.",
      },
      missingPaymentProof: {
        title: "Payment proof missing",
        body: "Attach a screenshot or PDF of your transfer receipt — finance can't verify a transfer without evidence.",
      },
      proofUploadFailed: {
        title: "Proof didn't upload",
        body: "Try a smaller file (under 10 MB) or a different image format. PNG, JPG, WebP, and PDF are accepted.",
      },
      walletChanged: {
        title: "Wallet balance shifted mid-checkout",
        body: "Your wallet was updated while we were placing the order. Reload the page to confirm the latest balance, then submit again.",
      },
    },
    emptyCart: {
      title: "There is nothing to check out yet.",
      body: "Add products to your cart, or restore something you saved earlier — your saved items keep the price you locked in.",
      ctaLabel: "Browse products",
      viewSaved: "View saved items →",
    },
    signIn: {
      kicker: "Checkout",
      title: "Sign in with your HenryCo account to continue.",
      description: "Browsing stays open, but checkout uses your HenryCo account so orders, payments, addresses, notifications, and support history stay together — across every device, every session.",
      emptyTitle: "Sign in required",
      emptyBody: "Your cart is intact and waiting. Sign in once and we'll bring you back to this exact step.",
      emptyCta: "Sign in to continue",
      whyTitle: "Why HenryCo checkout",
      accountProtected: {
        title: "Account-protected",
        body: "Your card, address, and order history live in one HenryCo account — never re-keyed across surfaces.",
      },
      receipts: {
        title: "Receipts and disputes in one place",
        body: "Payment proofs, delivery proof, returns, and seller messages stay tied to the same order record.",
      },
      oneBasket: {
        title: "One basket, every session",
        body: "Walk away mid-checkout — the cart waits for you. Across phone, tablet, and laptop.",
      },
    },
  },
  cartDrawer: {
    miniCart: "Mini cart",
    itemsReadyOne: "{count} item ready",
    itemsReadyOther: "{count} items ready",
    basketEmpty: "Your basket is empty",
    henryCoStocked: "HenryCo stocked",
    verifiedStore: "Verified store",
    updatingCart: "Updating cart",
    saveForLater: "Save for later",
    saving: "Saving...",
    remove: "Remove",
    updating: "Updating...",
    emptyTitle: "Start building the basket.",
    emptyBody: "Quick-add from any card and the basket will stay updated here without a hard refresh.",
    exploreProducts: "Explore products",
    viewSaved: "View saved items",
    subtotal: "Subtotal",
    checkoutNote: "Split-order clarity, delivery windows, and payment states stay visible again at checkout.",
    finalizing: "Finalizing basket before navigation...",
    viewCart: "View cart",
    checkout: "Checkout",
  },
  cartExperience: {
    splitOrderClarity: "Split-order clarity",
    henryCoStocked: "HenryCo stocked",
    verifiedVendor: "Verified vendor",
    trustedSeller: "Trusted seller",
    updatingCart: "Updating cart",
    saveForLater: "Save for later",
    saving: "Saving...",
    remove: "Remove",
    removeAria: "Remove {title} from cart",
    wishlisted: "Wishlisted",
    addToWishlist: "Add to wishlist",
    openProduct: "Open product",
    checkoutReadiness: "Checkout readiness",
    items: "Items",
    subtotal: "Subtotal",
    estimatedShipping: "Estimated shipping",
    free: "Free",
    vendorSegmentNote: "Each vendor segment stays visible during checkout so buyers understand delivery timing, payment state, and post-order support before confirming.",
    continueToCheckout: "Continue to checkout",
    keepBrowsing: "Keep browsing",
  },
  placement: {
    wallet: {
      kicker: "Order placed · paid",
      headline: "Paid from your HenryCo balance. Held in escrow.",
      lead: "Your wallet was debited and the order moved into escrow control. Funds release to the seller after delivery confirms — neither side carries the risk in between.",
      escrowProtection: {
        title: "Escrow protection on by default",
        body: "Seller payout is gated on fulfillment plus the cooling-off window. Open a dispute any time before then and the funds stay held.",
      },
      vendorSegments: {
        title: "Vendor segments dispatch separately",
        body: "Each vendor in the order ships on its own timeline. Tracking codes appear in the segments below as carriers issue them.",
      },
      receipts: {
        title: "Receipts and updates land in your inbox",
        body: "Email and in-app notifications fire on every status change. The full audit trail also lives under Account → Orders.",
      },
    },
    bankTransfer: {
      kicker: "Order placed · awaiting verification",
      headline: "Proof submitted. Finance is reviewing.",
      lead: "Your transfer evidence is now with HenryCo finance. Verification typically lands within working hours; the timeline below updates the moment it does. We'll email and notify the second the order moves into fulfillment.",
      verificationHours: {
        title: "Verification in working hours",
        body: "If you transferred outside banking hours, expect the status to flip on the next business window. The reference on your receipt is the match key.",
      },
      escrowLifts: {
        title: "Escrow lifts after fulfillment",
        body: "Seller payout only releases after delivery confirms. Disputes opened before then keep the funds frozen by default.",
      },
      reachOut: {
        title: "We'll reach out if anything's off",
        body: "If the amount or reference doesn't match, the payment team contacts you on file before any status change.",
      },
    },
    cod: {
      kicker: "Order placed · pay on delivery",
      headline: "Awaiting vendor acceptance. Pay the rider on delivery.",
      lead: "The seller is reviewing the order. Once accepted, the rider collects payment when the package arrives — no upfront transfer needed. Cash and POS are both supported by the dispatcher.",
      vendorAccepts: {
        title: "Vendor accepts before dispatch",
        body: "If the seller can't fulfill, the order cancels cleanly with no charge. You'll see the acceptance event on the timeline below.",
      },
      payOnArrival: {
        title: "Pay only when the parcel arrives",
        body: "The rider settles the payment with you on delivery. Keep your phone available — the carrier will call before the drop-off window.",
      },
      updates: {
        title: "Updates by email and push",
        body: "Acceptance, dispatch, and delivery each send a notification. Full history stays under Account → Orders.",
      },
    },
    fallback: {
      kicker: "Order placed",
      headline: "We've recorded your order.",
      lead: "The order is in the system and the vendor segments below carry the rest of the journey. Refer back here for status changes — payment, fulfillment, and payout each post on their own row.",
      escrowStaysOn: {
        title: "Escrow stays on",
        body: "Seller payout only releases after fulfillment confirms. Disputes opened before that keep the funds frozen.",
      },
      vendorsDispatch: {
        title: "Vendors dispatch separately",
        body: "Each segment in the split order ships on its own timeline and gets its own tracking code as the carrier issues one.",
      },
      notifications: {
        title: "Notifications run on every change",
        body: "Status updates fire by email and push. The full audit trail lives under Account → Orders.",
      },
    },
    orderNumber: "Order number",
    total: "Total",
    confirmationTo: "Confirmation to",
    confirmationFallback: "Your HenryCo account",
    viewAllOrders: "View all orders",
    continueBrowsing: "Continue browsing",
    needHelp: "Need help with this order?",
    whatHappensNext: "What happens next",
  },
  productActions: {
    addingToCart: "Adding to cart",
    adding: "Adding…",
    addToCart: "Add to cart",
    updatingWishlist: "Updating wishlist",
    saving: "Saving…",
    savedToWishlist: "Saved to wishlist",
    save: "Save",
    updatingFollow: "Updating store follow",
    updating: "Updating…",
    followingStore: "Following store",
    followStore: "Follow store",
    compareMore: "Compare more",
    note: "Quick-add updates the mini-cart instantly. Saved items, follows, notifications, and future payment events stay attached to the same HenryCo account identity.",
    removeFromWishlist: "Remove from wishlist",
    saveToWishlist: "Save to wishlist",
  },
  storeActions: {
    updatingFollow: "Updating store follow",
    updating: "Updating...",
    followingStore: "Following store",
    followThisStore: "Follow this store",
    savedStores: "Saved stores",
    browseRelated: "Browse related",
  },
  variantMatrix: {
    sectionLabel: "Product variant selection",
    chooseVariant: "Choose your variant",
    skuLabel: "SKU",
    placeholder: "—",
    out: "Out",
    price: "Price",
    availability: "Availability",
    inStock: "{count} in stock",
    unavailable: "Currently unavailable",
    match: "Match",
    variantResolved: "Exact variant resolved",
    pickValue: "Pick a value for each axis",
  },
};

const FR: DeepPartial<MarketplaceCheckoutCopy> = {
  checkoutPage: {
    errors: {
      orderNotPlaced: "Commande non passée",
      walletUnavailable: {
        title: "Le portefeuille n'est pas encore prêt pour les débits du marché",
        body: "Votre portefeuille HenryCo n'est pas activé pour les paiements directs. Optez pour un virement bancaire avec justificatif, ou rechargez d'abord votre portefeuille.",
      },
      insufficientBalance: {
        title: "Le solde du portefeuille ne couvrait pas la commande",
        body: "Rechargez le montant manquant, optez pour un virement bancaire avec justificatif, ou utilisez le paiement à la livraison si la commande est éligible.",
      },
      missingBankReference: {
        title: "Référence bancaire manquante",
        body: "Ajoutez le reçu bancaire ou le numéro de référence de votre virement pour que la comptabilité puisse le rapprocher proprement.",
      },
      missingPaymentProof: {
        title: "Justificatif de paiement manquant",
        body: "Joignez une capture d'écran ou un PDF de votre reçu de virement — la comptabilité ne peut pas vérifier un virement sans preuve.",
      },
      proofUploadFailed: {
        title: "Le justificatif n'a pas été téléversé",
        body: "Essayez un fichier plus léger (moins de 10 Mo) ou un autre format d'image. Les formats PNG, JPG, WebP et PDF sont acceptés.",
      },
      walletChanged: {
        title: "Le solde du portefeuille a changé en cours de paiement",
        body: "Votre portefeuille a été mis à jour pendant que nous passions la commande. Rechargez la page pour confirmer le dernier solde, puis renvoyez.",
      },
    },
    emptyCart: {
      title: "Il n'y a rien à régler pour le moment.",
      body: "Ajoutez des produits à votre panier, ou restaurez quelque chose que vous avez enregistré plus tôt — vos articles enregistrés conservent le prix que vous avez verrouillé.",
      ctaLabel: "Parcourir les produits",
      viewSaved: "Voir les articles enregistrés →",
    },
    signIn: {
      kicker: "Paiement",
      title: "Connectez-vous avec votre compte HenryCo pour continuer.",
      description: "La navigation reste ouverte, mais le paiement utilise votre compte HenryCo pour que les commandes, paiements, adresses, notifications et historique d'assistance restent regroupés — sur chaque appareil, à chaque session.",
      emptyTitle: "Connexion requise",
      emptyBody: "Votre panier est intact et vous attend. Connectez-vous une fois et nous vous ramènerons exactement à cette étape.",
      emptyCta: "Se connecter pour continuer",
      whyTitle: "Pourquoi le paiement HenryCo",
      accountProtected: {
        title: "Protégé par le compte",
        body: "Votre carte, votre adresse et votre historique de commandes vivent dans un seul compte HenryCo — jamais à ressaisir d'une surface à l'autre.",
      },
      receipts: {
        title: "Reçus et litiges au même endroit",
        body: "Justificatifs de paiement, preuve de livraison, retours et messages du vendeur restent liés au même enregistrement de commande.",
      },
      oneBasket: {
        title: "Un seul panier, à chaque session",
        body: "Partez en plein paiement — le panier vous attend. Sur téléphone, tablette et ordinateur portable.",
      },
    },
  },
  cartDrawer: {
    miniCart: "Mini-panier",
    itemsReadyOne: "{count} article prêt",
    itemsReadyOther: "{count} articles prêts",
    basketEmpty: "Votre panier est vide",
    henryCoStocked: "Stocké par HenryCo",
    verifiedStore: "Boutique vérifiée",
    updatingCart: "Mise à jour du panier",
    saveForLater: "Enregistrer pour plus tard",
    saving: "Enregistrement...",
    remove: "Retirer",
    updating: "Mise à jour...",
    emptyTitle: "Commencez à composer le panier.",
    emptyBody: "Ajoutez rapidement depuis n'importe quelle carte et le panier restera à jour ici sans rechargement complet.",
    exploreProducts: "Explorer les produits",
    viewSaved: "Voir les articles enregistrés",
    subtotal: "Sous-total",
    checkoutNote: "La clarté des commandes scindées, les créneaux de livraison et les états de paiement redeviennent visibles au moment du paiement.",
    finalizing: "Finalisation du panier avant navigation...",
    viewCart: "Voir le panier",
    checkout: "Payer",
  },
  cartExperience: {
    splitOrderClarity: "Clarté des commandes scindées",
    henryCoStocked: "Stocké par HenryCo",
    verifiedVendor: "Vendeur vérifié",
    trustedSeller: "Vendeur de confiance",
    updatingCart: "Mise à jour du panier",
    saveForLater: "Enregistrer pour plus tard",
    saving: "Enregistrement...",
    remove: "Retirer",
    removeAria: "Retirer {title} du panier",
    wishlisted: "Dans la liste de souhaits",
    addToWishlist: "Ajouter à la liste de souhaits",
    openProduct: "Ouvrir le produit",
    checkoutReadiness: "Prêt pour le paiement",
    items: "Articles",
    subtotal: "Sous-total",
    estimatedShipping: "Livraison estimée",
    free: "Gratuit",
    vendorSegmentNote: "Chaque segment de vendeur reste visible pendant le paiement afin que les acheteurs comprennent le délai de livraison, l'état du paiement et l'assistance après commande avant de confirmer.",
    continueToCheckout: "Continuer vers le paiement",
    keepBrowsing: "Continuer à parcourir",
  },
  placement: {
    wallet: {
      kicker: "Commande passée · payée",
      headline: "Payée depuis votre solde HenryCo. Conservée sous séquestre.",
      lead: "Votre portefeuille a été débité et la commande est passée sous contrôle de séquestre. Les fonds sont versés au vendeur une fois la livraison confirmée — aucune des deux parties ne porte le risque entre-temps.",
      escrowProtection: {
        title: "Protection par séquestre activée par défaut",
        body: "Le versement au vendeur est conditionné à l'exécution plus le délai de rétractation. Ouvrez un litige à tout moment avant cela et les fonds restent retenus.",
      },
      vendorSegments: {
        title: "Les segments de vendeurs sont expédiés séparément",
        body: "Chaque vendeur de la commande expédie selon son propre calendrier. Les codes de suivi apparaissent dans les segments ci-dessous à mesure que les transporteurs les émettent.",
      },
      receipts: {
        title: "Reçus et mises à jour arrivent dans votre boîte de réception",
        body: "Les notifications par e-mail et dans l'application se déclenchent à chaque changement de statut. La piste d'audit complète se trouve aussi dans Compte → Commandes.",
      },
    },
    bankTransfer: {
      kicker: "Commande passée · en attente de vérification",
      headline: "Justificatif soumis. La comptabilité l'examine.",
      lead: "Votre preuve de virement est désormais entre les mains de la comptabilité HenryCo. La vérification intervient généralement pendant les heures ouvrées ; la chronologie ci-dessous se met à jour dès que c'est fait. Nous vous écrirons et vous notifierons dès que la commande passera en exécution.",
      verificationHours: {
        title: "Vérification pendant les heures ouvrées",
        body: "Si vous avez viré en dehors des heures bancaires, attendez-vous à ce que le statut bascule lors du prochain créneau ouvré. La référence sur votre reçu est la clé de rapprochement.",
      },
      escrowLifts: {
        title: "Le séquestre se lève après l'exécution",
        body: "Le versement au vendeur n'est libéré qu'après confirmation de la livraison. Les litiges ouverts avant cela maintiennent les fonds gelés par défaut.",
      },
      reachOut: {
        title: "Nous vous contacterons si quelque chose cloche",
        body: "Si le montant ou la référence ne correspond pas, l'équipe paiement vous contacte sur vos coordonnées avant tout changement de statut.",
      },
    },
    cod: {
      kicker: "Commande passée · paiement à la livraison",
      headline: "En attente d'acceptation du vendeur. Payez le coursier à la livraison.",
      lead: "Le vendeur examine la commande. Une fois acceptée, le coursier encaisse le paiement à l'arrivée du colis — aucun virement à l'avance nécessaire. Les espèces et le TPE sont tous deux pris en charge par le livreur.",
      vendorAccepts: {
        title: "Le vendeur accepte avant l'expédition",
        body: "Si le vendeur ne peut pas honorer la commande, celle-ci est annulée proprement sans frais. Vous verrez l'événement d'acceptation sur la chronologie ci-dessous.",
      },
      payOnArrival: {
        title: "Payez uniquement à l'arrivée du colis",
        body: "Le coursier règle le paiement avec vous à la livraison. Gardez votre téléphone disponible — le transporteur appellera avant le créneau de dépôt.",
      },
      updates: {
        title: "Mises à jour par e-mail et notification",
        body: "L'acceptation, l'expédition et la livraison envoient chacune une notification. L'historique complet reste dans Compte → Commandes.",
      },
    },
    fallback: {
      kicker: "Commande passée",
      headline: "Nous avons enregistré votre commande.",
      lead: "La commande est dans le système et les segments de vendeurs ci-dessous portent le reste du parcours. Revenez ici pour les changements de statut — paiement, exécution et versement s'affichent chacun sur leur propre ligne.",
      escrowStaysOn: {
        title: "Le séquestre reste activé",
        body: "Le versement au vendeur n'est libéré qu'après confirmation de l'exécution. Les litiges ouverts avant cela maintiennent les fonds gelés.",
      },
      vendorsDispatch: {
        title: "Les vendeurs expédient séparément",
        body: "Chaque segment de la commande scindée expédie selon son propre calendrier et obtient son propre code de suivi dès que le transporteur en émet un.",
      },
      notifications: {
        title: "Les notifications se déclenchent à chaque changement",
        body: "Les mises à jour de statut partent par e-mail et notification. La piste d'audit complète se trouve dans Compte → Commandes.",
      },
    },
    orderNumber: "Numéro de commande",
    total: "Total",
    confirmationTo: "Confirmation à",
    confirmationFallback: "Votre compte HenryCo",
    viewAllOrders: "Voir toutes les commandes",
    continueBrowsing: "Continuer à parcourir",
    needHelp: "Besoin d'aide pour cette commande ?",
    whatHappensNext: "Ce qui se passe ensuite",
  },
  productActions: {
    addingToCart: "Ajout au panier",
    adding: "Ajout…",
    addToCart: "Ajouter au panier",
    updatingWishlist: "Mise à jour de la liste de souhaits",
    saving: "Enregistrement…",
    savedToWishlist: "Dans la liste de souhaits",
    save: "Enregistrer",
    updatingFollow: "Mise à jour du suivi de la boutique",
    updating: "Mise à jour…",
    followingStore: "Boutique suivie",
    followStore: "Suivre la boutique",
    compareMore: "Comparer davantage",
    note: "L'ajout rapide met à jour le mini-panier instantanément. Articles enregistrés, suivis, notifications et futurs événements de paiement restent rattachés à la même identité de compte HenryCo.",
    removeFromWishlist: "Retirer de la liste de souhaits",
    saveToWishlist: "Ajouter à la liste de souhaits",
  },
  storeActions: {
    updatingFollow: "Mise à jour du suivi de la boutique",
    updating: "Mise à jour...",
    followingStore: "Boutique suivie",
    followThisStore: "Suivre cette boutique",
    savedStores: "Boutiques enregistrées",
    browseRelated: "Parcourir les boutiques similaires",
  },
  variantMatrix: {
    sectionLabel: "Sélection de variante du produit",
    chooseVariant: "Choisissez votre variante",
    skuLabel: "RÉF",
    placeholder: "—",
    out: "Épuisé",
    price: "Prix",
    availability: "Disponibilité",
    inStock: "{count} en stock",
    unavailable: "Actuellement indisponible",
    match: "Correspondance",
    variantResolved: "Variante exacte résolue",
    pickValue: "Choisissez une valeur pour chaque axe",
  },
};

const ES: DeepPartial<MarketplaceCheckoutCopy> = {
  checkoutPage: {
    errors: {
      orderNotPlaced: "Pedido no realizado",
      walletUnavailable: {
        title: "El monedero aún no está listo para cargos del mercado",
        body: "Tu monedero HenryCo no está activado para pagos directos. Cambia a transferencia bancaria con comprobante, o recarga primero tu monedero.",
      },
      insufficientBalance: {
        title: "El saldo del monedero no cubrió el pedido",
        body: "Recarga la diferencia, cambia a transferencia bancaria con comprobante, o usa pago contra entrega si el pedido es elegible.",
      },
      missingBankReference: {
        title: "Falta la referencia bancaria",
        body: "Añade el recibo bancario o el número de referencia de tu transferencia para que finanzas pueda conciliarlo limpiamente.",
      },
      missingPaymentProof: {
        title: "Falta el comprobante de pago",
        body: "Adjunta una captura o un PDF de tu recibo de transferencia — finanzas no puede verificar una transferencia sin evidencia.",
      },
      proofUploadFailed: {
        title: "El comprobante no se subió",
        body: "Prueba con un archivo más pequeño (menos de 10 MB) o con otro formato de imagen. Se aceptan PNG, JPG, WebP y PDF.",
      },
      walletChanged: {
        title: "El saldo del monedero cambió durante el pago",
        body: "Tu monedero se actualizó mientras realizábamos el pedido. Recarga la página para confirmar el último saldo y vuelve a enviar.",
      },
    },
    emptyCart: {
      title: "Todavía no hay nada que pagar.",
      body: "Añade productos a tu carrito, o restaura algo que guardaste antes — tus artículos guardados conservan el precio que bloqueaste.",
      ctaLabel: "Explorar productos",
      viewSaved: "Ver artículos guardados →",
    },
    signIn: {
      kicker: "Pago",
      title: "Inicia sesión con tu cuenta HenryCo para continuar.",
      description: "La navegación sigue abierta, pero el pago usa tu cuenta HenryCo para que pedidos, pagos, direcciones, notificaciones e historial de soporte permanezcan juntos — en cada dispositivo, en cada sesión.",
      emptyTitle: "Inicio de sesión requerido",
      emptyBody: "Tu carrito está intacto y esperándote. Inicia sesión una vez y te traeremos de vuelta a este mismo paso.",
      emptyCta: "Inicia sesión para continuar",
      whyTitle: "Por qué el pago de HenryCo",
      accountProtected: {
        title: "Protegido por la cuenta",
        body: "Tu tarjeta, dirección e historial de pedidos viven en una sola cuenta HenryCo — nunca se vuelven a teclear entre superficies.",
      },
      receipts: {
        title: "Recibos y disputas en un solo lugar",
        body: "Comprobantes de pago, prueba de entrega, devoluciones y mensajes del vendedor quedan vinculados al mismo registro de pedido.",
      },
      oneBasket: {
        title: "Un carrito, cada sesión",
        body: "Aléjate a mitad del pago — el carrito te espera. En teléfono, tableta y portátil.",
      },
    },
  },
  cartDrawer: {
    miniCart: "Mini carrito",
    itemsReadyOne: "{count} artículo listo",
    itemsReadyOther: "{count} artículos listos",
    basketEmpty: "Tu carrito está vacío",
    henryCoStocked: "Surtido por HenryCo",
    verifiedStore: "Tienda verificada",
    updatingCart: "Actualizando el carrito",
    saveForLater: "Guardar para más tarde",
    saving: "Guardando...",
    remove: "Quitar",
    updating: "Actualizando...",
    emptyTitle: "Empieza a armar el carrito.",
    emptyBody: "Añade rápido desde cualquier tarjeta y el carrito se mantendrá actualizado aquí sin recargar la página.",
    exploreProducts: "Explorar productos",
    viewSaved: "Ver artículos guardados",
    subtotal: "Subtotal",
    checkoutNote: "La claridad de pedidos divididos, las ventanas de entrega y los estados de pago vuelven a verse en el pago.",
    finalizing: "Finalizando el carrito antes de navegar...",
    viewCart: "Ver carrito",
    checkout: "Pagar",
  },
  cartExperience: {
    splitOrderClarity: "Claridad de pedidos divididos",
    henryCoStocked: "Surtido por HenryCo",
    verifiedVendor: "Vendedor verificado",
    trustedSeller: "Vendedor de confianza",
    updatingCart: "Actualizando el carrito",
    saveForLater: "Guardar para más tarde",
    saving: "Guardando...",
    remove: "Quitar",
    removeAria: "Quitar {title} del carrito",
    wishlisted: "En la lista de deseos",
    addToWishlist: "Añadir a la lista de deseos",
    openProduct: "Abrir producto",
    checkoutReadiness: "Listo para pagar",
    items: "Artículos",
    subtotal: "Subtotal",
    estimatedShipping: "Envío estimado",
    free: "Gratis",
    vendorSegmentNote: "Cada segmento de vendedor permanece visible durante el pago para que los compradores entiendan el tiempo de entrega, el estado del pago y el soporte posterior al pedido antes de confirmar.",
    continueToCheckout: "Continuar al pago",
    keepBrowsing: "Seguir explorando",
  },
  placement: {
    wallet: {
      kicker: "Pedido realizado · pagado",
      headline: "Pagado desde tu saldo HenryCo. Retenido en depósito de garantía.",
      lead: "Tu monedero fue debitado y el pedido pasó a control de depósito de garantía. Los fondos se liberan al vendedor tras confirmarse la entrega — ninguna parte asume el riesgo mientras tanto.",
      escrowProtection: {
        title: "Protección de depósito de garantía activada por defecto",
        body: "El pago al vendedor está condicionado al cumplimiento más el período de reflexión. Abre una disputa en cualquier momento antes de eso y los fondos siguen retenidos.",
      },
      vendorSegments: {
        title: "Los segmentos de vendedores se despachan por separado",
        body: "Cada vendedor del pedido envía según su propio calendario. Los códigos de seguimiento aparecen en los segmentos de abajo a medida que los transportistas los emiten.",
      },
      receipts: {
        title: "Recibos y novedades llegan a tu bandeja",
        body: "Las notificaciones por correo y en la app se disparan en cada cambio de estado. El registro de auditoría completo también está en Cuenta → Pedidos.",
      },
    },
    bankTransfer: {
      kicker: "Pedido realizado · en espera de verificación",
      headline: "Comprobante enviado. Finanzas está revisando.",
      lead: "Tu evidencia de transferencia ya está con finanzas de HenryCo. La verificación suele ocurrir dentro del horario laboral; la línea de tiempo de abajo se actualiza en cuanto sucede. Te enviaremos correo y notificación en el momento en que el pedido pase a cumplimiento.",
      verificationHours: {
        title: "Verificación en horario laboral",
        body: "Si transferiste fuera del horario bancario, espera que el estado cambie en la siguiente franja hábil. La referencia de tu recibo es la clave de conciliación.",
      },
      escrowLifts: {
        title: "El depósito de garantía se levanta tras el cumplimiento",
        body: "El pago al vendedor solo se libera tras confirmarse la entrega. Las disputas abiertas antes mantienen los fondos congelados por defecto.",
      },
      reachOut: {
        title: "Te contactaremos si algo no cuadra",
        body: "Si el importe o la referencia no coinciden, el equipo de pagos te contacta en tus datos antes de cualquier cambio de estado.",
      },
    },
    cod: {
      kicker: "Pedido realizado · paga contra entrega",
      headline: "En espera de aceptación del vendedor. Paga al repartidor en la entrega.",
      lead: "El vendedor está revisando el pedido. Una vez aceptado, el repartidor cobra el pago cuando llega el paquete — sin transferencia por adelantado. El despachador admite tanto efectivo como TPV.",
      vendorAccepts: {
        title: "El vendedor acepta antes del despacho",
        body: "Si el vendedor no puede cumplir, el pedido se cancela limpiamente sin cargo. Verás el evento de aceptación en la línea de tiempo de abajo.",
      },
      payOnArrival: {
        title: "Paga solo cuando llegue el paquete",
        body: "El repartidor liquida el pago contigo en la entrega. Mantén tu teléfono disponible — el transportista llamará antes de la franja de entrega.",
      },
      updates: {
        title: "Novedades por correo y notificación",
        body: "La aceptación, el despacho y la entrega envían cada uno una notificación. El historial completo queda en Cuenta → Pedidos.",
      },
    },
    fallback: {
      kicker: "Pedido realizado",
      headline: "Hemos registrado tu pedido.",
      lead: "El pedido está en el sistema y los segmentos de vendedores de abajo llevan el resto del recorrido. Vuelve aquí para los cambios de estado — pago, cumplimiento y desembolso se publican cada uno en su propia fila.",
      escrowStaysOn: {
        title: "El depósito de garantía sigue activo",
        body: "El pago al vendedor solo se libera tras confirmarse el cumplimiento. Las disputas abiertas antes mantienen los fondos congelados.",
      },
      vendorsDispatch: {
        title: "Los vendedores despachan por separado",
        body: "Cada segmento del pedido dividido envía según su propio calendario y obtiene su propio código de seguimiento en cuanto el transportista emite uno.",
      },
      notifications: {
        title: "Las notificaciones corren en cada cambio",
        body: "Las actualizaciones de estado salen por correo y notificación. El registro de auditoría completo está en Cuenta → Pedidos.",
      },
    },
    orderNumber: "Número de pedido",
    total: "Total",
    confirmationTo: "Confirmación a",
    confirmationFallback: "Tu cuenta HenryCo",
    viewAllOrders: "Ver todos los pedidos",
    continueBrowsing: "Seguir explorando",
    needHelp: "¿Necesitas ayuda con este pedido?",
    whatHappensNext: "Qué pasa a continuación",
  },
  productActions: {
    addingToCart: "Añadiendo al carrito",
    adding: "Añadiendo…",
    addToCart: "Añadir al carrito",
    updatingWishlist: "Actualizando la lista de deseos",
    saving: "Guardando…",
    savedToWishlist: "En la lista de deseos",
    save: "Guardar",
    updatingFollow: "Actualizando el seguimiento de la tienda",
    updating: "Actualizando…",
    followingStore: "Siguiendo la tienda",
    followStore: "Seguir la tienda",
    compareMore: "Comparar más",
    note: "El añadido rápido actualiza el mini carrito al instante. Artículos guardados, seguimientos, notificaciones y futuros eventos de pago quedan ligados a la misma identidad de cuenta HenryCo.",
    removeFromWishlist: "Quitar de la lista de deseos",
    saveToWishlist: "Añadir a la lista de deseos",
  },
  storeActions: {
    updatingFollow: "Actualizando el seguimiento de la tienda",
    updating: "Actualizando...",
    followingStore: "Siguiendo la tienda",
    followThisStore: "Seguir esta tienda",
    savedStores: "Tiendas guardadas",
    browseRelated: "Explorar relacionadas",
  },
  variantMatrix: {
    sectionLabel: "Selección de variante del producto",
    chooseVariant: "Elige tu variante",
    skuLabel: "SKU",
    placeholder: "—",
    out: "Agotado",
    price: "Precio",
    availability: "Disponibilidad",
    inStock: "{count} en stock",
    unavailable: "No disponible actualmente",
    match: "Coincidencia",
    variantResolved: "Variante exacta resuelta",
    pickValue: "Elige un valor para cada eje",
  },
};

const PT: DeepPartial<MarketplaceCheckoutCopy> = {
  checkoutPage: {
    errors: {
      orderNotPlaced: "Pedido não efetuado",
      walletUnavailable: {
        title: "A carteira ainda não está pronta para débitos do marketplace",
        body: "A sua carteira HenryCo não está ativada para pagamentos diretos. Mude para transferência bancária com comprovativo, ou recarregue primeiro a sua carteira.",
      },
      insufficientBalance: {
        title: "O saldo da carteira não cobriu o pedido",
        body: "Recarregue a diferença, mude para transferência bancária com comprovativo, ou use pagamento na entrega se o pedido for elegível.",
      },
      missingBankReference: {
        title: "Falta a referência bancária",
        body: "Adicione o recibo bancário ou o número de referência da sua transferência para que a área financeira possa conciliá-lo de forma limpa.",
      },
      missingPaymentProof: {
        title: "Falta o comprovativo de pagamento",
        body: "Anexe uma captura de ecrã ou um PDF do seu recibo de transferência — a área financeira não pode verificar uma transferência sem evidência.",
      },
      proofUploadFailed: {
        title: "O comprovativo não foi carregado",
        body: "Tente um ficheiro mais pequeno (menos de 10 MB) ou outro formato de imagem. São aceites PNG, JPG, WebP e PDF.",
      },
      walletChanged: {
        title: "O saldo da carteira mudou a meio do pagamento",
        body: "A sua carteira foi atualizada enquanto efetuávamos o pedido. Recarregue a página para confirmar o saldo mais recente e submeta novamente.",
      },
    },
    emptyCart: {
      title: "Ainda não há nada para finalizar.",
      body: "Adicione produtos ao seu carrinho, ou restaure algo que guardou antes — os seus artigos guardados mantêm o preço que bloqueou.",
      ctaLabel: "Explorar produtos",
      viewSaved: "Ver artigos guardados →",
    },
    signIn: {
      kicker: "Finalização",
      title: "Inicie sessão com a sua conta HenryCo para continuar.",
      description: "A navegação continua aberta, mas a finalização usa a sua conta HenryCo para que pedidos, pagamentos, moradas, notificações e histórico de apoio fiquem juntos — em cada dispositivo, em cada sessão.",
      emptyTitle: "Início de sessão necessário",
      emptyBody: "O seu carrinho está intacto e à espera. Inicie sessão uma vez e trazemo-lo de volta exatamente a este passo.",
      emptyCta: "Iniciar sessão para continuar",
      whyTitle: "Porquê a finalização HenryCo",
      accountProtected: {
        title: "Protegido pela conta",
        body: "O seu cartão, morada e histórico de pedidos vivem numa única conta HenryCo — nunca reintroduzidos entre superfícies.",
      },
      receipts: {
        title: "Recibos e disputas num só lugar",
        body: "Comprovativos de pagamento, prova de entrega, devoluções e mensagens do vendedor ficam ligados ao mesmo registo de pedido.",
      },
      oneBasket: {
        title: "Um carrinho, cada sessão",
        body: "Afaste-se a meio da finalização — o carrinho espera por si. No telemóvel, no tablet e no portátil.",
      },
    },
  },
  cartDrawer: {
    miniCart: "Mini carrinho",
    itemsReadyOne: "{count} artigo pronto",
    itemsReadyOther: "{count} artigos prontos",
    basketEmpty: "O seu carrinho está vazio",
    henryCoStocked: "Em stock pela HenryCo",
    verifiedStore: "Loja verificada",
    updatingCart: "A atualizar o carrinho",
    saveForLater: "Guardar para mais tarde",
    saving: "A guardar...",
    remove: "Remover",
    updating: "A atualizar...",
    emptyTitle: "Comece a montar o carrinho.",
    emptyBody: "Adicione rapidamente a partir de qualquer cartão e o carrinho mantém-se atualizado aqui sem recarregar a página.",
    exploreProducts: "Explorar produtos",
    viewSaved: "Ver artigos guardados",
    subtotal: "Subtotal",
    checkoutNote: "A clareza de pedidos divididos, as janelas de entrega e os estados de pagamento voltam a estar visíveis na finalização.",
    finalizing: "A finalizar o carrinho antes de navegar...",
    viewCart: "Ver carrinho",
    checkout: "Finalizar",
  },
  cartExperience: {
    splitOrderClarity: "Clareza de pedidos divididos",
    henryCoStocked: "Em stock pela HenryCo",
    verifiedVendor: "Vendedor verificado",
    trustedSeller: "Vendedor de confiança",
    updatingCart: "A atualizar o carrinho",
    saveForLater: "Guardar para mais tarde",
    saving: "A guardar...",
    remove: "Remover",
    removeAria: "Remover {title} do carrinho",
    wishlisted: "Na lista de desejos",
    addToWishlist: "Adicionar à lista de desejos",
    openProduct: "Abrir produto",
    checkoutReadiness: "Pronto para finalizar",
    items: "Artigos",
    subtotal: "Subtotal",
    estimatedShipping: "Envio estimado",
    free: "Grátis",
    vendorSegmentNote: "Cada segmento de vendedor permanece visível durante a finalização para que os compradores compreendam o prazo de entrega, o estado do pagamento e o apoio pós-pedido antes de confirmar.",
    continueToCheckout: "Continuar para a finalização",
    keepBrowsing: "Continuar a explorar",
  },
  placement: {
    wallet: {
      kicker: "Pedido efetuado · pago",
      headline: "Pago a partir do seu saldo HenryCo. Mantido em garantia.",
      lead: "A sua carteira foi debitada e o pedido passou para controlo de garantia. Os fundos são libertados ao vendedor após a confirmação da entrega — nenhuma das partes carrega o risco entretanto.",
      escrowProtection: {
        title: "Proteção de garantia ativada por defeito",
        body: "O pagamento ao vendedor está condicionado ao cumprimento mais o período de reflexão. Abra uma disputa a qualquer momento antes disso e os fundos permanecem retidos.",
      },
      vendorSegments: {
        title: "Os segmentos de vendedores são despachados separadamente",
        body: "Cada vendedor do pedido envia segundo o seu próprio calendário. Os códigos de rastreio aparecem nos segmentos abaixo à medida que as transportadoras os emitem.",
      },
      receipts: {
        title: "Recibos e atualizações chegam à sua caixa de entrada",
        body: "As notificações por e-mail e na aplicação disparam a cada mudança de estado. O registo de auditoria completo está também em Conta → Pedidos.",
      },
    },
    bankTransfer: {
      kicker: "Pedido efetuado · a aguardar verificação",
      headline: "Comprovativo submetido. A área financeira está a rever.",
      lead: "A sua prova de transferência está agora com a área financeira da HenryCo. A verificação costuma ocorrer dentro do horário de expediente; a linha temporal abaixo atualiza-se no momento em que isso acontece. Enviaremos e-mail e notificação assim que o pedido passar para cumprimento.",
      verificationHours: {
        title: "Verificação em horário de expediente",
        body: "Se transferiu fora do horário bancário, espere que o estado mude na próxima janela útil. A referência no seu recibo é a chave de conciliação.",
      },
      escrowLifts: {
        title: "A garantia levanta-se após o cumprimento",
        body: "O pagamento ao vendedor só é libertado após a confirmação da entrega. As disputas abertas antes disso mantêm os fundos congelados por defeito.",
      },
      reachOut: {
        title: "Entraremos em contacto se algo não bater certo",
        body: "Se o valor ou a referência não corresponderem, a equipa de pagamentos contacta-o pelos seus dados antes de qualquer mudança de estado.",
      },
    },
    cod: {
      kicker: "Pedido efetuado · pague na entrega",
      headline: "A aguardar aceitação do vendedor. Pague ao estafeta na entrega.",
      lead: "O vendedor está a rever o pedido. Uma vez aceite, o estafeta cobra o pagamento quando a encomenda chega — sem transferência antecipada. O despachante aceita tanto numerário como TPA.",
      vendorAccepts: {
        title: "O vendedor aceita antes do despacho",
        body: "Se o vendedor não puder cumprir, o pedido é cancelado de forma limpa sem custos. Verá o evento de aceitação na linha temporal abaixo.",
      },
      payOnArrival: {
        title: "Pague apenas quando a encomenda chegar",
        body: "O estafeta liquida o pagamento consigo na entrega. Mantenha o telemóvel disponível — a transportadora ligará antes da janela de entrega.",
      },
      updates: {
        title: "Atualizações por e-mail e notificação",
        body: "A aceitação, o despacho e a entrega enviam cada um uma notificação. O histórico completo fica em Conta → Pedidos.",
      },
    },
    fallback: {
      kicker: "Pedido efetuado",
      headline: "Registámos o seu pedido.",
      lead: "O pedido está no sistema e os segmentos de vendedores abaixo carregam o resto do percurso. Volte aqui para as mudanças de estado — pagamento, cumprimento e desembolso publicam-se cada um na sua própria linha.",
      escrowStaysOn: {
        title: "A garantia mantém-se ativa",
        body: "O pagamento ao vendedor só é libertado após a confirmação do cumprimento. As disputas abertas antes disso mantêm os fundos congelados.",
      },
      vendorsDispatch: {
        title: "Os vendedores despacham separadamente",
        body: "Cada segmento do pedido dividido envia segundo o seu próprio calendário e obtém o seu próprio código de rastreio assim que a transportadora emite um.",
      },
      notifications: {
        title: "As notificações correm a cada mudança",
        body: "As atualizações de estado saem por e-mail e notificação. O registo de auditoria completo está em Conta → Pedidos.",
      },
    },
    orderNumber: "Número do pedido",
    total: "Total",
    confirmationTo: "Confirmação para",
    confirmationFallback: "A sua conta HenryCo",
    viewAllOrders: "Ver todos os pedidos",
    continueBrowsing: "Continuar a explorar",
    needHelp: "Precisa de ajuda com este pedido?",
    whatHappensNext: "O que acontece a seguir",
  },
  productActions: {
    addingToCart: "A adicionar ao carrinho",
    adding: "A adicionar…",
    addToCart: "Adicionar ao carrinho",
    updatingWishlist: "A atualizar a lista de desejos",
    saving: "A guardar…",
    savedToWishlist: "Na lista de desejos",
    save: "Guardar",
    updatingFollow: "A atualizar o seguimento da loja",
    updating: "A atualizar…",
    followingStore: "A seguir a loja",
    followStore: "Seguir a loja",
    compareMore: "Comparar mais",
    note: "A adição rápida atualiza o mini carrinho instantaneamente. Artigos guardados, seguimentos, notificações e futuros eventos de pagamento ficam ligados à mesma identidade de conta HenryCo.",
    removeFromWishlist: "Remover da lista de desejos",
    saveToWishlist: "Adicionar à lista de desejos",
  },
  storeActions: {
    updatingFollow: "A atualizar o seguimento da loja",
    updating: "A atualizar...",
    followingStore: "A seguir a loja",
    followThisStore: "Seguir esta loja",
    savedStores: "Lojas guardadas",
    browseRelated: "Explorar relacionadas",
  },
  variantMatrix: {
    sectionLabel: "Seleção de variante do produto",
    chooseVariant: "Escolha a sua variante",
    skuLabel: "SKU",
    placeholder: "—",
    out: "Esgotado",
    price: "Preço",
    availability: "Disponibilidade",
    inStock: "{count} em stock",
    unavailable: "Atualmente indisponível",
    match: "Correspondência",
    variantResolved: "Variante exata resolvida",
    pickValue: "Escolha um valor para cada eixo",
  },
};

const AR: DeepPartial<MarketplaceCheckoutCopy> = {
  checkoutPage: {
    errors: {
      orderNotPlaced: "لم يتم تقديم الطلب",
      walletUnavailable: {
        title: "المحفظة ليست جاهزة بعد لخصومات المتجر",
        body: "محفظتك في HenryCo غير مُفعّلة للمدفوعات المباشرة. انتقل إلى التحويل البنكي مع إثبات، أو اشحن محفظتك أولاً.",
      },
      insufficientBalance: {
        title: "رصيد المحفظة لم يُغطِّ الطلب",
        body: "اشحن النقص، أو انتقل إلى التحويل البنكي مع إثبات، أو استخدم الدفع عند الاستلام إذا كان الطلب مؤهلاً.",
      },
      missingBankReference: {
        title: "مرجع البنك مفقود",
        body: "أضف الإيصال البنكي أو رقم المرجع من تحويلك حتى يتمكن قسم المالية من مطابقته بدقة.",
      },
      missingPaymentProof: {
        title: "إثبات الدفع مفقود",
        body: "أرفق لقطة شاشة أو ملف PDF لإيصال التحويل — لا يمكن لقسم المالية التحقق من تحويل دون دليل.",
      },
      proofUploadFailed: {
        title: "لم يُرفع الإثبات",
        body: "جرّب ملفاً أصغر (أقل من 10 ميغابايت) أو صيغة صورة أخرى. الصيغ المقبولة هي PNG وJPG وWebP وPDF.",
      },
      walletChanged: {
        title: "تغيّر رصيد المحفظة أثناء الدفع",
        body: "جرى تحديث محفظتك أثناء تقديم الطلب. أعد تحميل الصفحة لتأكيد آخر رصيد ثم أرسل من جديد.",
      },
    },
    emptyCart: {
      title: "لا يوجد شيء لإتمام شرائه بعد.",
      body: "أضف منتجات إلى سلتك، أو استعد شيئاً حفظته سابقاً — تحتفظ عناصرك المحفوظة بالسعر الذي ثبّته.",
      ctaLabel: "تصفّح المنتجات",
      viewSaved: "عرض العناصر المحفوظة ←",
    },
    signIn: {
      kicker: "الدفع",
      title: "سجّل الدخول بحساب HenryCo للمتابعة.",
      description: "يبقى التصفّح مفتوحاً، لكن الدفع يستخدم حساب HenryCo حتى تبقى الطلبات والمدفوعات والعناوين والإشعارات وسجل الدعم معاً — على كل جهاز وفي كل جلسة.",
      emptyTitle: "تسجيل الدخول مطلوب",
      emptyBody: "سلتك سليمة وتنتظرك. سجّل الدخول مرة واحدة وسنعيدك إلى هذه الخطوة بالضبط.",
      emptyCta: "سجّل الدخول للمتابعة",
      whyTitle: "لماذا الدفع عبر HenryCo",
      accountProtected: {
        title: "محميّ بالحساب",
        body: "بطاقتك وعنوانك وسجل طلباتك يعيشون في حساب HenryCo واحد — دون إعادة إدخال عبر الواجهات.",
      },
      receipts: {
        title: "الإيصالات والنزاعات في مكان واحد",
        body: "إثباتات الدفع وإثبات التسليم والمرتجعات ورسائل البائع تبقى مرتبطة بسجل الطلب نفسه.",
      },
      oneBasket: {
        title: "سلة واحدة، في كل جلسة",
        body: "ابتعد في منتصف الدفع — السلة تنتظرك. عبر الهاتف والجهاز اللوحي والحاسوب المحمول.",
      },
    },
  },
  cartDrawer: {
    miniCart: "السلة المصغّرة",
    itemsReadyOne: "{count} عنصر جاهز",
    itemsReadyOther: "{count} عناصر جاهزة",
    basketEmpty: "سلتك فارغة",
    henryCoStocked: "من مخزون HenryCo",
    verifiedStore: "متجر موثّق",
    updatingCart: "جارٍ تحديث السلة",
    saveForLater: "احفظ لوقت لاحق",
    saving: "جارٍ الحفظ...",
    remove: "إزالة",
    updating: "جارٍ التحديث...",
    emptyTitle: "ابدأ ببناء السلة.",
    emptyBody: "أضف بسرعة من أي بطاقة وستبقى السلة محدّثة هنا دون إعادة تحميل كاملة.",
    exploreProducts: "استكشف المنتجات",
    viewSaved: "عرض العناصر المحفوظة",
    subtotal: "المجموع الفرعي",
    checkoutNote: "وضوح الطلبات المقسّمة ونوافذ التسليم وحالات الدفع تعود مرئية مجدداً عند الدفع.",
    finalizing: "جارٍ إنهاء السلة قبل الانتقال...",
    viewCart: "عرض السلة",
    checkout: "الدفع",
  },
  cartExperience: {
    splitOrderClarity: "وضوح الطلبات المقسّمة",
    henryCoStocked: "من مخزون HenryCo",
    verifiedVendor: "بائع موثّق",
    trustedSeller: "بائع موثوق",
    updatingCart: "جارٍ تحديث السلة",
    saveForLater: "احفظ لوقت لاحق",
    saving: "جارٍ الحفظ...",
    remove: "إزالة",
    removeAria: "إزالة {title} من السلة",
    wishlisted: "في قائمة الرغبات",
    addToWishlist: "أضف إلى قائمة الرغبات",
    openProduct: "افتح المنتج",
    checkoutReadiness: "جاهزية الدفع",
    items: "العناصر",
    subtotal: "المجموع الفرعي",
    estimatedShipping: "الشحن التقديري",
    free: "مجاني",
    vendorSegmentNote: "يبقى كل قسم بائع مرئياً أثناء الدفع حتى يفهم المشترون موعد التسليم وحالة الدفع والدعم بعد الطلب قبل التأكيد.",
    continueToCheckout: "تابع إلى الدفع",
    keepBrowsing: "تابع التصفّح",
  },
  placement: {
    wallet: {
      kicker: "تم تقديم الطلب · مدفوع",
      headline: "مدفوع من رصيدك في HenryCo. محتجز في الضمان.",
      lead: "خُصم من محفظتك وانتقل الطلب إلى رقابة الضمان. تُحرَّر الأموال للبائع بعد تأكيد التسليم — لا يتحمّل أي طرف المخاطرة في الأثناء.",
      escrowProtection: {
        title: "حماية الضمان مُفعّلة افتراضياً",
        body: "دفعة البائع مشروطة بالتنفيذ إضافةً إلى فترة التراجع. افتح نزاعاً في أي وقت قبل ذلك وتبقى الأموال محتجزة.",
      },
      vendorSegments: {
        title: "أقسام البائعين تُرسَل بشكل منفصل",
        body: "كل بائع في الطلب يشحن وفق جدوله الخاص. تظهر رموز التتبّع في الأقسام أدناه فور إصدار شركات الشحن لها.",
      },
      receipts: {
        title: "الإيصالات والتحديثات تصل إلى بريدك",
        body: "تنطلق إشعارات البريد والتطبيق عند كل تغيير حالة. كما يوجد سجل التدقيق الكامل في الحساب ← الطلبات.",
      },
    },
    bankTransfer: {
      kicker: "تم تقديم الطلب · بانتظار التحقّق",
      headline: "تم إرسال الإثبات. قسم المالية قيد المراجعة.",
      lead: "بات دليل تحويلك الآن لدى قسم المالية في HenryCo. يتمّ التحقّق عادةً خلال ساعات العمل؛ ويُحدَّث الجدول الزمني أدناه فور حدوث ذلك. سنراسلك ونُشعرك لحظة انتقال الطلب إلى التنفيذ.",
      verificationHours: {
        title: "التحقّق خلال ساعات العمل",
        body: "إذا حوّلت خارج ساعات البنوك، فتوقّع تبدّل الحالة في نافذة العمل التالية. المرجع على إيصالك هو مفتاح المطابقة.",
      },
      escrowLifts: {
        title: "يُرفع الضمان بعد التنفيذ",
        body: "دفعة البائع تُحرَّر فقط بعد تأكيد التسليم. النزاعات المفتوحة قبل ذلك تُبقي الأموال مجمّدة افتراضياً.",
      },
      reachOut: {
        title: "سنتواصل معك إن وُجد أي خلل",
        body: "إذا لم يتطابق المبلغ أو المرجع، يتواصل فريق المدفوعات معك عبر بياناتك قبل أي تغيير في الحالة.",
      },
    },
    cod: {
      kicker: "تم تقديم الطلب · ادفع عند التسليم",
      headline: "بانتظار قبول البائع. ادفع للمندوب عند التسليم.",
      lead: "يراجع البائع الطلب. بمجرد القبول، يحصّل المندوب الدفع عند وصول الطرد — دون تحويل مُسبق. يدعم الموزّع النقد ونقاط البيع كليهما.",
      vendorAccepts: {
        title: "يقبل البائع قبل الإرسال",
        body: "إذا لم يستطع البائع التنفيذ، يُلغى الطلب بنظافة دون أي رسوم. سترى حدث القبول على الجدول الزمني أدناه.",
      },
      payOnArrival: {
        title: "ادفع فقط عند وصول الطرد",
        body: "يسوّي المندوب الدفع معك عند التسليم. أبقِ هاتفك متاحاً — ستتصل شركة الشحن قبل نافذة التسليم.",
      },
      updates: {
        title: "تحديثات عبر البريد والإشعارات",
        body: "القبول والإرسال والتسليم يُرسل كلٌّ منها إشعاراً. يبقى السجل الكامل في الحساب ← الطلبات.",
      },
    },
    fallback: {
      kicker: "تم تقديم الطلب",
      headline: "سجّلنا طلبك.",
      lead: "الطلب في النظام، وأقسام البائعين أدناه تحمل بقية الرحلة. عُد إلى هنا لتغييرات الحالة — الدفع والتنفيذ والصرف يُنشر كلٌّ منها في صفّه الخاص.",
      escrowStaysOn: {
        title: "يبقى الضمان مُفعّلاً",
        body: "دفعة البائع تُحرَّر فقط بعد تأكيد التنفيذ. النزاعات المفتوحة قبل ذلك تُبقي الأموال مجمّدة.",
      },
      vendorsDispatch: {
        title: "البائعون يُرسلون بشكل منفصل",
        body: "كل قسم في الطلب المقسّم يشحن وفق جدوله الخاص ويحصل على رمز تتبّع خاص به فور إصدار شركة الشحن له.",
      },
      notifications: {
        title: "تنطلق الإشعارات عند كل تغيير",
        body: "تُرسَل تحديثات الحالة عبر البريد والإشعارات. سجل التدقيق الكامل في الحساب ← الطلبات.",
      },
    },
    orderNumber: "رقم الطلب",
    total: "الإجمالي",
    confirmationTo: "التأكيد إلى",
    confirmationFallback: "حسابك في HenryCo",
    viewAllOrders: "عرض كل الطلبات",
    continueBrowsing: "تابع التصفّح",
    needHelp: "هل تحتاج مساعدة في هذا الطلب؟",
    whatHappensNext: "ماذا يحدث بعد ذلك",
  },
  productActions: {
    addingToCart: "جارٍ الإضافة إلى السلة",
    adding: "جارٍ الإضافة…",
    addToCart: "أضف إلى السلة",
    updatingWishlist: "جارٍ تحديث قائمة الرغبات",
    saving: "جارٍ الحفظ…",
    savedToWishlist: "في قائمة الرغبات",
    save: "احفظ",
    updatingFollow: "جارٍ تحديث متابعة المتجر",
    updating: "جارٍ التحديث…",
    followingStore: "تتابع المتجر",
    followStore: "تابع المتجر",
    compareMore: "قارن المزيد",
    note: "تُحدِّث الإضافة السريعة السلة المصغّرة فوراً. العناصر المحفوظة والمتابعات والإشعارات وأحداث الدفع المستقبلية تبقى مرتبطة بهوية حساب HenryCo نفسها.",
    removeFromWishlist: "إزالة من قائمة الرغبات",
    saveToWishlist: "احفظ في قائمة الرغبات",
  },
  storeActions: {
    updatingFollow: "جارٍ تحديث متابعة المتجر",
    updating: "جارٍ التحديث...",
    followingStore: "تتابع المتجر",
    followThisStore: "تابع هذا المتجر",
    savedStores: "المتاجر المحفوظة",
    browseRelated: "تصفّح ذات الصلة",
  },
  variantMatrix: {
    sectionLabel: "اختيار خيار المنتج",
    chooseVariant: "اختر خيارك",
    skuLabel: "رمز",
    placeholder: "—",
    out: "نفد",
    price: "السعر",
    availability: "التوفّر",
    inStock: "{count} متوفّر",
    unavailable: "غير متوفّر حالياً",
    match: "تطابق",
    variantResolved: "تم تحديد الخيار بدقّة",
    pickValue: "اختر قيمة لكل محور",
  },
};

const DE: DeepPartial<MarketplaceCheckoutCopy> = {
  checkoutPage: {
    errors: {
      orderNotPlaced: "Bestellung nicht aufgegeben",
      walletUnavailable: {
        title: "Das Wallet ist noch nicht für Marktplatz-Abbuchungen bereit",
        body: "Ihr HenryCo-Wallet ist nicht für Direktzahlungen aktiviert. Wechseln Sie zur Banküberweisung mit Nachweis oder laden Sie zuerst Ihr Wallet auf.",
      },
      insufficientBalance: {
        title: "Das Wallet-Guthaben deckte die Bestellung nicht",
        body: "Laden Sie den Fehlbetrag auf, wechseln Sie zur Banküberweisung mit Nachweis oder nutzen Sie Nachnahme, falls die Bestellung berechtigt ist.",
      },
      missingBankReference: {
        title: "Bankreferenz fehlt",
        body: "Fügen Sie den Bankbeleg oder die Referenznummer Ihrer Überweisung hinzu, damit die Finanzabteilung sie sauber zuordnen kann.",
      },
      missingPaymentProof: {
        title: "Zahlungsnachweis fehlt",
        body: "Hängen Sie einen Screenshot oder ein PDF Ihres Überweisungsbelegs an — die Finanzabteilung kann eine Überweisung ohne Nachweis nicht prüfen.",
      },
      proofUploadFailed: {
        title: "Der Nachweis wurde nicht hochgeladen",
        body: "Versuchen Sie eine kleinere Datei (unter 10 MB) oder ein anderes Bildformat. PNG, JPG, WebP und PDF werden akzeptiert.",
      },
      walletChanged: {
        title: "Das Wallet-Guthaben hat sich mitten im Bezahlvorgang verändert",
        body: "Ihr Wallet wurde aktualisiert, während wir die Bestellung aufgaben. Laden Sie die Seite neu, um das aktuelle Guthaben zu bestätigen, und senden Sie erneut.",
      },
    },
    emptyCart: {
      title: "Es gibt noch nichts zu bezahlen.",
      body: "Legen Sie Produkte in den Warenkorb oder stellen Sie etwas wieder her, das Sie zuvor gespeichert haben — Ihre gespeicherten Artikel behalten den Preis, den Sie festgehalten haben.",
      ctaLabel: "Produkte durchsuchen",
      viewSaved: "Gespeicherte Artikel ansehen →",
    },
    signIn: {
      kicker: "Bezahlung",
      title: "Melden Sie sich mit Ihrem HenryCo-Konto an, um fortzufahren.",
      description: "Das Stöbern bleibt offen, aber die Bezahlung nutzt Ihr HenryCo-Konto, damit Bestellungen, Zahlungen, Adressen, Benachrichtigungen und Support-Verlauf zusammenbleiben — auf jedem Gerät, in jeder Sitzung.",
      emptyTitle: "Anmeldung erforderlich",
      emptyBody: "Ihr Warenkorb ist intakt und wartet. Melden Sie sich einmal an, und wir bringen Sie genau zu diesem Schritt zurück.",
      emptyCta: "Zum Fortfahren anmelden",
      whyTitle: "Warum die HenryCo-Bezahlung",
      accountProtected: {
        title: "Kontogeschützt",
        body: "Ihre Karte, Adresse und Bestellhistorie leben in einem einzigen HenryCo-Konto — nie über Oberflächen hinweg neu eingegeben.",
      },
      receipts: {
        title: "Belege und Reklamationen an einem Ort",
        body: "Zahlungsnachweise, Liefernachweis, Rücksendungen und Verkäufernachrichten bleiben an denselben Bestelldatensatz gebunden.",
      },
      oneBasket: {
        title: "Ein Warenkorb, jede Sitzung",
        body: "Gehen Sie mitten im Bezahlvorgang weg — der Warenkorb wartet auf Sie. Über Telefon, Tablet und Laptop hinweg.",
      },
    },
  },
  cartDrawer: {
    miniCart: "Mini-Warenkorb",
    itemsReadyOne: "{count} Artikel bereit",
    itemsReadyOther: "{count} Artikel bereit",
    basketEmpty: "Ihr Warenkorb ist leer",
    henryCoStocked: "Von HenryCo bevorratet",
    verifiedStore: "Verifizierter Shop",
    updatingCart: "Warenkorb wird aktualisiert",
    saveForLater: "Für später speichern",
    saving: "Wird gespeichert...",
    remove: "Entfernen",
    updating: "Wird aktualisiert...",
    emptyTitle: "Beginnen Sie, den Warenkorb zu füllen.",
    emptyBody: "Schnell von jeder Karte hinzufügen, und der Warenkorb bleibt hier ohne harte Aktualisierung aktuell.",
    exploreProducts: "Produkte entdecken",
    viewSaved: "Gespeicherte Artikel ansehen",
    subtotal: "Zwischensumme",
    checkoutNote: "Klarheit bei geteilten Bestellungen, Lieferfenster und Zahlungsstatus werden bei der Bezahlung wieder sichtbar.",
    finalizing: "Warenkorb wird vor der Navigation abgeschlossen...",
    viewCart: "Warenkorb ansehen",
    checkout: "Zur Kasse",
  },
  cartExperience: {
    splitOrderClarity: "Klarheit bei geteilten Bestellungen",
    henryCoStocked: "Von HenryCo bevorratet",
    verifiedVendor: "Verifizierter Verkäufer",
    trustedSeller: "Vertrauenswürdiger Verkäufer",
    updatingCart: "Warenkorb wird aktualisiert",
    saveForLater: "Für später speichern",
    saving: "Wird gespeichert...",
    remove: "Entfernen",
    removeAria: "{title} aus dem Warenkorb entfernen",
    wishlisted: "Auf der Wunschliste",
    addToWishlist: "Zur Wunschliste hinzufügen",
    openProduct: "Produkt öffnen",
    checkoutReadiness: "Bereit zur Kasse",
    items: "Artikel",
    subtotal: "Zwischensumme",
    estimatedShipping: "Voraussichtlicher Versand",
    free: "Kostenlos",
    vendorSegmentNote: "Jedes Verkäufersegment bleibt während der Bezahlung sichtbar, damit Käufer Lieferzeit, Zahlungsstatus und Support nach der Bestellung vor der Bestätigung verstehen.",
    continueToCheckout: "Weiter zur Kasse",
    keepBrowsing: "Weiter stöbern",
  },
  placement: {
    wallet: {
      kicker: "Bestellung aufgegeben · bezahlt",
      headline: "Aus Ihrem HenryCo-Guthaben bezahlt. Treuhänderisch gehalten.",
      lead: "Ihr Wallet wurde belastet und die Bestellung ging in die Treuhandkontrolle über. Die Gelder werden nach Bestätigung der Lieferung an den Verkäufer freigegeben — keine Seite trägt das Risiko dazwischen.",
      escrowProtection: {
        title: "Treuhandschutz standardmäßig aktiviert",
        body: "Die Auszahlung an den Verkäufer ist an die Erfüllung plus die Widerrufsfrist gekoppelt. Eröffnen Sie jederzeit davor einen Streitfall, und die Gelder bleiben einbehalten.",
      },
      vendorSegments: {
        title: "Verkäufersegmente werden separat versandt",
        body: "Jeder Verkäufer in der Bestellung versendet nach seinem eigenen Zeitplan. Tracking-Codes erscheinen in den Segmenten unten, sobald die Frachtführer sie ausstellen.",
      },
      receipts: {
        title: "Belege und Updates landen in Ihrem Posteingang",
        body: "E-Mail- und In-App-Benachrichtigungen werden bei jeder Statusänderung ausgelöst. Der vollständige Prüfpfad liegt auch unter Konto → Bestellungen.",
      },
    },
    bankTransfer: {
      kicker: "Bestellung aufgegeben · Prüfung ausstehend",
      headline: "Nachweis eingereicht. Die Finanzabteilung prüft.",
      lead: "Ihr Überweisungsnachweis liegt nun bei der HenryCo-Finanzabteilung. Die Prüfung erfolgt in der Regel innerhalb der Geschäftszeiten; die Zeitleiste unten aktualisiert sich, sobald es so weit ist. Wir mailen und benachrichtigen Sie in dem Moment, in dem die Bestellung in die Erfüllung übergeht.",
      verificationHours: {
        title: "Prüfung in den Geschäftszeiten",
        body: "Wenn Sie außerhalb der Bankzeiten überwiesen haben, rechnen Sie damit, dass der Status im nächsten Geschäftsfenster umschlägt. Die Referenz auf Ihrem Beleg ist der Abgleichschlüssel.",
      },
      escrowLifts: {
        title: "Die Treuhand wird nach der Erfüllung aufgehoben",
        body: "Die Auszahlung an den Verkäufer wird erst nach Bestätigung der Lieferung freigegeben. Davor eröffnete Streitfälle halten die Gelder standardmäßig eingefroren.",
      },
      reachOut: {
        title: "Wir melden uns, falls etwas nicht stimmt",
        body: "Wenn Betrag oder Referenz nicht übereinstimmen, kontaktiert Sie das Zahlungsteam über Ihre hinterlegten Daten vor jeder Statusänderung.",
      },
    },
    cod: {
      kicker: "Bestellung aufgegeben · Zahlung bei Lieferung",
      headline: "Annahme durch den Verkäufer ausstehend. Zahlen Sie den Fahrer bei der Lieferung.",
      lead: "Der Verkäufer prüft die Bestellung. Nach der Annahme kassiert der Fahrer die Zahlung, wenn das Paket ankommt — keine Vorabüberweisung nötig. Der Disponent unterstützt sowohl Bargeld als auch Kartenzahlung.",
      vendorAccepts: {
        title: "Der Verkäufer nimmt vor dem Versand an",
        body: "Wenn der Verkäufer nicht erfüllen kann, wird die Bestellung sauber und ohne Gebühr storniert. Sie sehen das Annahmeereignis in der Zeitleiste unten.",
      },
      payOnArrival: {
        title: "Zahlen Sie erst, wenn das Paket ankommt",
        body: "Der Fahrer wickelt die Zahlung bei der Lieferung mit Ihnen ab. Halten Sie Ihr Telefon bereit — der Zusteller ruft vor dem Lieferfenster an.",
      },
      updates: {
        title: "Updates per E-Mail und Push",
        body: "Annahme, Versand und Lieferung senden jeweils eine Benachrichtigung. Der vollständige Verlauf bleibt unter Konto → Bestellungen.",
      },
    },
    fallback: {
      kicker: "Bestellung aufgegeben",
      headline: "Wir haben Ihre Bestellung erfasst.",
      lead: "Die Bestellung ist im System, und die Verkäufersegmente unten tragen den Rest des Wegs. Kommen Sie für Statusänderungen hierher zurück — Zahlung, Erfüllung und Auszahlung erscheinen jeweils in ihrer eigenen Zeile.",
      escrowStaysOn: {
        title: "Die Treuhand bleibt aktiv",
        body: "Die Auszahlung an den Verkäufer wird erst nach Bestätigung der Erfüllung freigegeben. Davor eröffnete Streitfälle halten die Gelder eingefroren.",
      },
      vendorsDispatch: {
        title: "Verkäufer versenden separat",
        body: "Jedes Segment der geteilten Bestellung versendet nach seinem eigenen Zeitplan und erhält seinen eigenen Tracking-Code, sobald der Frachtführer einen ausstellt.",
      },
      notifications: {
        title: "Benachrichtigungen laufen bei jeder Änderung",
        body: "Statusupdates werden per E-Mail und Push ausgelöst. Der vollständige Prüfpfad liegt unter Konto → Bestellungen.",
      },
    },
    orderNumber: "Bestellnummer",
    total: "Gesamt",
    confirmationTo: "Bestätigung an",
    confirmationFallback: "Ihr HenryCo-Konto",
    viewAllOrders: "Alle Bestellungen ansehen",
    continueBrowsing: "Weiter stöbern",
    needHelp: "Brauchen Sie Hilfe mit dieser Bestellung?",
    whatHappensNext: "Was als Nächstes passiert",
  },
  productActions: {
    addingToCart: "Wird zum Warenkorb hinzugefügt",
    adding: "Wird hinzugefügt…",
    addToCart: "In den Warenkorb",
    updatingWishlist: "Wunschliste wird aktualisiert",
    saving: "Wird gespeichert…",
    savedToWishlist: "Auf der Wunschliste gespeichert",
    save: "Speichern",
    updatingFollow: "Shop-Folgen wird aktualisiert",
    updating: "Wird aktualisiert…",
    followingStore: "Shop wird gefolgt",
    followStore: "Shop folgen",
    compareMore: "Mehr vergleichen",
    note: "Schnelles Hinzufügen aktualisiert den Mini-Warenkorb sofort. Gespeicherte Artikel, Folgen, Benachrichtigungen und künftige Zahlungsereignisse bleiben an dieselbe HenryCo-Kontoidentität gebunden.",
    removeFromWishlist: "Von der Wunschliste entfernen",
    saveToWishlist: "Auf der Wunschliste speichern",
  },
  storeActions: {
    updatingFollow: "Shop-Folgen wird aktualisiert",
    updating: "Wird aktualisiert...",
    followingStore: "Shop wird gefolgt",
    followThisStore: "Diesem Shop folgen",
    savedStores: "Gespeicherte Shops",
    browseRelated: "Verwandte durchsuchen",
  },
  variantMatrix: {
    sectionLabel: "Auswahl der Produktvariante",
    chooseVariant: "Wählen Sie Ihre Variante",
    skuLabel: "Art.-Nr.",
    placeholder: "—",
    out: "Aus",
    price: "Preis",
    availability: "Verfügbarkeit",
    inStock: "{count} auf Lager",
    unavailable: "Derzeit nicht verfügbar",
    match: "Übereinstimmung",
    variantResolved: "Exakte Variante aufgelöst",
    pickValue: "Wählen Sie für jede Achse einen Wert",
  },
};

const IT: DeepPartial<MarketplaceCheckoutCopy> = {
  checkoutPage: {
    errors: {
      orderNotPlaced: "Ordine non effettuato",
      walletUnavailable: {
        title: "Il portafoglio non è ancora pronto per gli addebiti del marketplace",
        body: "Il tuo portafoglio HenryCo non è attivato per i pagamenti diretti. Passa al bonifico bancario con prova, o ricarica prima il portafoglio.",
      },
      insufficientBalance: {
        title: "Il saldo del portafoglio non copriva l'ordine",
        body: "Ricarica la differenza, passa al bonifico bancario con prova, oppure usa il pagamento alla consegna se l'ordine è idoneo.",
      },
      missingBankReference: {
        title: "Riferimento bancario mancante",
        body: "Aggiungi la ricevuta bancaria o il numero di riferimento del tuo bonifico così l'amministrazione può abbinarlo in modo pulito.",
      },
      missingPaymentProof: {
        title: "Prova di pagamento mancante",
        body: "Allega uno screenshot o un PDF della ricevuta del bonifico — l'amministrazione non può verificare un bonifico senza prova.",
      },
      proofUploadFailed: {
        title: "La prova non è stata caricata",
        body: "Prova un file più piccolo (sotto 10 MB) o un altro formato immagine. Sono accettati PNG, JPG, WebP e PDF.",
      },
      walletChanged: {
        title: "Il saldo del portafoglio è cambiato durante il checkout",
        body: "Il tuo portafoglio è stato aggiornato mentre effettuavamo l'ordine. Ricarica la pagina per confermare l'ultimo saldo, poi invia di nuovo.",
      },
    },
    emptyCart: {
      title: "Non c'è ancora nulla da pagare.",
      body: "Aggiungi prodotti al carrello, o ripristina qualcosa che hai salvato prima — i tuoi articoli salvati mantengono il prezzo che hai bloccato.",
      ctaLabel: "Sfoglia i prodotti",
      viewSaved: "Vedi gli articoli salvati →",
    },
    signIn: {
      kicker: "Checkout",
      title: "Accedi con il tuo account HenryCo per continuare.",
      description: "La navigazione resta aperta, ma il checkout usa il tuo account HenryCo così ordini, pagamenti, indirizzi, notifiche e cronologia dell'assistenza restano insieme — su ogni dispositivo, a ogni sessione.",
      emptyTitle: "Accesso richiesto",
      emptyBody: "Il tuo carrello è intatto e ti aspetta. Accedi una volta e ti riporteremo esattamente a questo passaggio.",
      emptyCta: "Accedi per continuare",
      whyTitle: "Perché il checkout HenryCo",
      accountProtected: {
        title: "Protetto dall'account",
        body: "La tua carta, l'indirizzo e la cronologia degli ordini vivono in un unico account HenryCo — mai reinseriti tra le superfici.",
      },
      receipts: {
        title: "Ricevute e contestazioni in un solo posto",
        body: "Prove di pagamento, prova di consegna, resi e messaggi del venditore restano legati allo stesso record dell'ordine.",
      },
      oneBasket: {
        title: "Un carrello, a ogni sessione",
        body: "Allontanati a metà del checkout — il carrello ti aspetta. Tra telefono, tablet e laptop.",
      },
    },
  },
  cartDrawer: {
    miniCart: "Mini carrello",
    itemsReadyOne: "{count} articolo pronto",
    itemsReadyOther: "{count} articoli pronti",
    basketEmpty: "Il tuo carrello è vuoto",
    henryCoStocked: "In stock da HenryCo",
    verifiedStore: "Negozio verificato",
    updatingCart: "Aggiornamento del carrello",
    saveForLater: "Salva per dopo",
    saving: "Salvataggio...",
    remove: "Rimuovi",
    updating: "Aggiornamento...",
    emptyTitle: "Inizia a comporre il carrello.",
    emptyBody: "Aggiungi rapidamente da qualsiasi scheda e il carrello resterà aggiornato qui senza un ricaricamento completo.",
    exploreProducts: "Esplora i prodotti",
    viewSaved: "Vedi gli articoli salvati",
    subtotal: "Subtotale",
    checkoutNote: "La chiarezza degli ordini suddivisi, le finestre di consegna e gli stati di pagamento tornano visibili al checkout.",
    finalizing: "Finalizzazione del carrello prima della navigazione...",
    viewCart: "Vedi il carrello",
    checkout: "Checkout",
  },
  cartExperience: {
    splitOrderClarity: "Chiarezza degli ordini suddivisi",
    henryCoStocked: "In stock da HenryCo",
    verifiedVendor: "Venditore verificato",
    trustedSeller: "Venditore affidabile",
    updatingCart: "Aggiornamento del carrello",
    saveForLater: "Salva per dopo",
    saving: "Salvataggio...",
    remove: "Rimuovi",
    removeAria: "Rimuovi {title} dal carrello",
    wishlisted: "Nella lista dei desideri",
    addToWishlist: "Aggiungi alla lista dei desideri",
    openProduct: "Apri prodotto",
    checkoutReadiness: "Pronto per il checkout",
    items: "Articoli",
    subtotal: "Subtotale",
    estimatedShipping: "Spedizione stimata",
    free: "Gratis",
    vendorSegmentNote: "Ogni segmento di venditore resta visibile durante il checkout così gli acquirenti comprendono i tempi di consegna, lo stato del pagamento e l'assistenza post-ordine prima di confermare.",
    continueToCheckout: "Continua al checkout",
    keepBrowsing: "Continua a sfogliare",
  },
  placement: {
    wallet: {
      kicker: "Ordine effettuato · pagato",
      headline: "Pagato dal tuo saldo HenryCo. Trattenuto in deposito di garanzia.",
      lead: "Il tuo portafoglio è stato addebitato e l'ordine è passato sotto il controllo del deposito di garanzia. I fondi vengono rilasciati al venditore dopo la conferma della consegna — nessuna delle parti porta il rischio nel frattempo.",
      escrowProtection: {
        title: "Protezione del deposito di garanzia attiva per impostazione predefinita",
        body: "Il pagamento al venditore è vincolato all'adempimento più il periodo di recesso. Apri una contestazione in qualsiasi momento prima di allora e i fondi restano trattenuti.",
      },
      vendorSegments: {
        title: "I segmenti dei venditori vengono spediti separatamente",
        body: "Ogni venditore dell'ordine spedisce secondo i propri tempi. I codici di tracciamento appaiono nei segmenti qui sotto man mano che i corrieri li emettono.",
      },
      receipts: {
        title: "Ricevute e aggiornamenti arrivano nella tua casella",
        body: "Le notifiche via e-mail e in-app scattano a ogni cambio di stato. Il registro di controllo completo si trova anche in Account → Ordini.",
      },
    },
    bankTransfer: {
      kicker: "Ordine effettuato · in attesa di verifica",
      headline: "Prova inviata. L'amministrazione sta verificando.",
      lead: "La prova del tuo bonifico è ora presso l'amministrazione HenryCo. La verifica avviene di solito entro l'orario lavorativo; la cronologia qui sotto si aggiorna nel momento in cui accade. Ti scriveremo e notificheremo nell'istante in cui l'ordine passa all'adempimento.",
      verificationHours: {
        title: "Verifica in orario lavorativo",
        body: "Se hai effettuato il bonifico fuori dall'orario bancario, aspettati che lo stato cambi nella prossima finestra lavorativa. Il riferimento sulla tua ricevuta è la chiave di abbinamento.",
      },
      escrowLifts: {
        title: "Il deposito di garanzia si solleva dopo l'adempimento",
        body: "Il pagamento al venditore viene rilasciato solo dopo la conferma della consegna. Le contestazioni aperte prima mantengono i fondi congelati per impostazione predefinita.",
      },
      reachOut: {
        title: "Ti contatteremo se qualcosa non torna",
        body: "Se l'importo o il riferimento non corrispondono, il team pagamenti ti contatta ai recapiti registrati prima di qualsiasi cambio di stato.",
      },
    },
    cod: {
      kicker: "Ordine effettuato · paga alla consegna",
      headline: "In attesa dell'accettazione del venditore. Paga il corriere alla consegna.",
      lead: "Il venditore sta esaminando l'ordine. Una volta accettato, il corriere incassa il pagamento all'arrivo del pacco — nessun bonifico anticipato necessario. Lo spedizioniere supporta sia il contante sia il POS.",
      vendorAccepts: {
        title: "Il venditore accetta prima della spedizione",
        body: "Se il venditore non può evadere, l'ordine viene annullato in modo pulito senza alcun addebito. Vedrai l'evento di accettazione nella cronologia qui sotto.",
      },
      payOnArrival: {
        title: "Paga solo quando arriva il pacco",
        body: "Il corriere salda il pagamento con te alla consegna. Tieni il telefono disponibile — il corriere chiamerà prima della finestra di consegna.",
      },
      updates: {
        title: "Aggiornamenti via e-mail e push",
        body: "Accettazione, spedizione e consegna inviano ciascuna una notifica. La cronologia completa resta in Account → Ordini.",
      },
    },
    fallback: {
      kicker: "Ordine effettuato",
      headline: "Abbiamo registrato il tuo ordine.",
      lead: "L'ordine è nel sistema e i segmenti dei venditori qui sotto portano avanti il resto del percorso. Torna qui per i cambi di stato — pagamento, adempimento ed erogazione compaiono ciascuno sulla propria riga.",
      escrowStaysOn: {
        title: "Il deposito di garanzia resta attivo",
        body: "Il pagamento al venditore viene rilasciato solo dopo la conferma dell'adempimento. Le contestazioni aperte prima mantengono i fondi congelati.",
      },
      vendorsDispatch: {
        title: "I venditori spediscono separatamente",
        body: "Ogni segmento dell'ordine suddiviso spedisce secondo i propri tempi e ottiene il proprio codice di tracciamento non appena il corriere ne emette uno.",
      },
      notifications: {
        title: "Le notifiche scattano a ogni cambiamento",
        body: "Gli aggiornamenti di stato partono via e-mail e push. Il registro di controllo completo si trova in Account → Ordini.",
      },
    },
    orderNumber: "Numero d'ordine",
    total: "Totale",
    confirmationTo: "Conferma a",
    confirmationFallback: "Il tuo account HenryCo",
    viewAllOrders: "Vedi tutti gli ordini",
    continueBrowsing: "Continua a sfogliare",
    needHelp: "Hai bisogno di aiuto con questo ordine?",
    whatHappensNext: "Cosa succede dopo",
  },
  productActions: {
    addingToCart: "Aggiunta al carrello",
    adding: "Aggiunta…",
    addToCart: "Aggiungi al carrello",
    updatingWishlist: "Aggiornamento della lista dei desideri",
    saving: "Salvataggio…",
    savedToWishlist: "Nella lista dei desideri",
    save: "Salva",
    updatingFollow: "Aggiornamento del seguito del negozio",
    updating: "Aggiornamento…",
    followingStore: "Segui il negozio",
    followStore: "Segui il negozio",
    compareMore: "Confronta altri",
    note: "L'aggiunta rapida aggiorna il mini carrello all'istante. Articoli salvati, follow, notifiche e futuri eventi di pagamento restano collegati alla stessa identità di account HenryCo.",
    removeFromWishlist: "Rimuovi dalla lista dei desideri",
    saveToWishlist: "Salva nella lista dei desideri",
  },
  storeActions: {
    updatingFollow: "Aggiornamento del seguito del negozio",
    updating: "Aggiornamento...",
    followingStore: "Segui il negozio",
    followThisStore: "Segui questo negozio",
    savedStores: "Negozi salvati",
    browseRelated: "Sfoglia i correlati",
  },
  variantMatrix: {
    sectionLabel: "Selezione della variante del prodotto",
    chooseVariant: "Scegli la tua variante",
    skuLabel: "SKU",
    placeholder: "—",
    out: "Esaurito",
    price: "Prezzo",
    availability: "Disponibilità",
    inStock: "{count} in stock",
    unavailable: "Attualmente non disponibile",
    match: "Corrispondenza",
    variantResolved: "Variante esatta risolta",
    pickValue: "Scegli un valore per ogni asse",
  },
};

const ZH: DeepPartial<MarketplaceCheckoutCopy> = {
  checkoutPage: {
    errors: {
      orderNotPlaced: "订单未提交",
      walletUnavailable: {
        title: "钱包尚未准备好用于商城扣款",
        body: "您的 HenryCo 钱包未启用直接付款。请改用带凭证的银行转账,或先为钱包充值。",
      },
      insufficientBalance: {
        title: "钱包余额不足以支付该订单",
        body: "请补足差额,改用带凭证的银行转账,或在订单符合条件时选择货到付款。",
      },
      missingBankReference: {
        title: "缺少银行参考号",
        body: "请添加转账的银行回执或参考号,以便财务能够准确对账。",
      },
      missingPaymentProof: {
        title: "缺少付款凭证",
        body: "请附上转账回执的截图或 PDF — 没有凭证,财务无法核实转账。",
      },
      proofUploadFailed: {
        title: "凭证未能上传",
        body: "请尝试更小的文件(小于 10 MB)或其他图片格式。支持 PNG、JPG、WebP 和 PDF。",
      },
      walletChanged: {
        title: "结账过程中钱包余额发生变化",
        body: "在我们提交订单时,您的钱包已更新。请刷新页面以确认最新余额,然后重新提交。",
      },
    },
    emptyCart: {
      title: "目前还没有可结账的商品。",
      body: "把商品加入购物车,或恢复您之前保存的内容 — 您保存的商品会保留您锁定的价格。",
      ctaLabel: "浏览商品",
      viewSaved: "查看已保存的商品 →",
    },
    signIn: {
      kicker: "结账",
      title: "登录您的 HenryCo 账户以继续。",
      description: "浏览仍然开放,但结账会使用您的 HenryCo 账户,让订单、付款、地址、通知和支持记录保持在一起 — 跨越每台设备、每次会话。",
      emptyTitle: "需要登录",
      emptyBody: "您的购物车完好无损,正在等待。登录一次,我们会把您带回这一步。",
      emptyCta: "登录以继续",
      whyTitle: "为什么选择 HenryCo 结账",
      accountProtected: {
        title: "账户保护",
        body: "您的银行卡、地址和订单历史都存放在一个 HenryCo 账户中 — 不会在各界面间重复输入。",
      },
      receipts: {
        title: "收据与纠纷集中一处",
        body: "付款凭证、送达凭证、退货和卖家消息都与同一订单记录绑定。",
      },
      oneBasket: {
        title: "一个购物车,每次会话",
        body: "结账途中离开 — 购物车会等您。跨手机、平板和笔记本电脑。",
      },
    },
  },
  cartDrawer: {
    miniCart: "迷你购物车",
    itemsReadyOne: "{count} 件商品已就绪",
    itemsReadyOther: "{count} 件商品已就绪",
    basketEmpty: "您的购物车是空的",
    henryCoStocked: "HenryCo 备货",
    verifiedStore: "已验证商店",
    updatingCart: "正在更新购物车",
    saveForLater: "稍后保存",
    saving: "保存中...",
    remove: "移除",
    updating: "更新中...",
    emptyTitle: "开始组建购物车吧。",
    emptyBody: "从任意卡片快速加入,购物车将在此保持更新,无需硬刷新。",
    exploreProducts: "探索商品",
    viewSaved: "查看已保存的商品",
    subtotal: "小计",
    checkoutNote: "拆单清晰度、配送时段和付款状态会在结账时再次可见。",
    finalizing: "导航前正在完成购物车...",
    viewCart: "查看购物车",
    checkout: "结账",
  },
  cartExperience: {
    splitOrderClarity: "拆单清晰度",
    henryCoStocked: "HenryCo 备货",
    verifiedVendor: "已验证卖家",
    trustedSeller: "可信卖家",
    updatingCart: "正在更新购物车",
    saveForLater: "稍后保存",
    saving: "保存中...",
    remove: "移除",
    removeAria: "将 {title} 从购物车移除",
    wishlisted: "已加入心愿单",
    addToWishlist: "加入心愿单",
    openProduct: "打开商品",
    checkoutReadiness: "结账就绪",
    items: "商品",
    subtotal: "小计",
    estimatedShipping: "预计运费",
    free: "免费",
    vendorSegmentNote: "结账期间每个卖家分段都保持可见,以便买家在确认前了解配送时间、付款状态和下单后支持。",
    continueToCheckout: "继续结账",
    keepBrowsing: "继续浏览",
  },
  placement: {
    wallet: {
      kicker: "订单已提交 · 已付款",
      headline: "已从您的 HenryCo 余额付款。资金托管中。",
      lead: "已从您的钱包扣款,订单进入托管控制。确认送达后资金才会释放给卖家 — 在此期间双方都不承担风险。",
      escrowProtection: {
        title: "默认启用托管保护",
        body: "卖家放款以履约加冷静期为前提。在此之前可随时发起争议,资金将继续被托管。",
      },
      vendorSegments: {
        title: "卖家分段分别发货",
        body: "订单中的每个卖家按各自的时间表发货。承运商出单后,追踪码会出现在下方分段中。",
      },
      receipts: {
        title: "收据与更新送达您的收件箱",
        body: "每次状态变化都会触发邮件和应用内通知。完整的审计记录也在 账户 → 订单 下。",
      },
    },
    bankTransfer: {
      kicker: "订单已提交 · 等待核实",
      headline: "凭证已提交。财务正在审核。",
      lead: "您的转账凭证现已交至 HenryCo 财务。核实通常在工作时间内完成;一旦完成,下方时间线会随即更新。订单进入履约的那一刻,我们会通过邮件和通知告知您。",
      verificationHours: {
        title: "工作时间内核实",
        body: "若您在银行营业时间外转账,请预期状态会在下一个工作时段切换。回执上的参考号即为对账依据。",
      },
      escrowLifts: {
        title: "履约后解除托管",
        body: "卖家放款仅在确认送达后才释放。在此之前发起的争议默认会冻结资金。",
      },
      reachOut: {
        title: "如有异常我们会联系您",
        body: "若金额或参考号不匹配,付款团队会在任何状态变更前通过您的预留信息联系您。",
      },
    },
    cod: {
      kicker: "订单已提交 · 货到付款",
      headline: "等待卖家接单。送达时支付给骑手。",
      lead: "卖家正在审核订单。一经接受,骑手会在包裹送达时收款 — 无需预先转账。配送员同时支持现金和 POS。",
      vendorAccepts: {
        title: "卖家发货前先接单",
        body: "若卖家无法履约,订单会干净地取消且不收费。您会在下方时间线看到接单事件。",
      },
      payOnArrival: {
        title: "仅在包裹送达时付款",
        body: "骑手会在送达时与您结清付款。请保持电话畅通 — 承运商会在送达时段前致电。",
      },
      updates: {
        title: "通过邮件和推送更新",
        body: "接单、发货和送达各自发送一条通知。完整历史保留在 账户 → 订单 下。",
      },
    },
    fallback: {
      kicker: "订单已提交",
      headline: "我们已记录您的订单。",
      lead: "订单已在系统中,下方卖家分段承载其余旅程。如有状态变化,请回到这里查看 — 付款、履约和放款各自显示在自己的行中。",
      escrowStaysOn: {
        title: "托管保持开启",
        body: "卖家放款仅在确认履约后才释放。在此之前发起的争议会冻结资金。",
      },
      vendorsDispatch: {
        title: "卖家分别发货",
        body: "拆单中的每个分段按各自的时间表发货,并在承运商出单时获得各自的追踪码。",
      },
      notifications: {
        title: "每次变化都会触发通知",
        body: "状态更新通过邮件和推送触发。完整的审计记录在 账户 → 订单 下。",
      },
    },
    orderNumber: "订单编号",
    total: "总计",
    confirmationTo: "确认发送至",
    confirmationFallback: "您的 HenryCo 账户",
    viewAllOrders: "查看所有订单",
    continueBrowsing: "继续浏览",
    needHelp: "需要此订单的帮助吗?",
    whatHappensNext: "接下来会发生什么",
  },
  productActions: {
    addingToCart: "正在加入购物车",
    adding: "加入中…",
    addToCart: "加入购物车",
    updatingWishlist: "正在更新心愿单",
    saving: "保存中…",
    savedToWishlist: "已保存到心愿单",
    save: "保存",
    updatingFollow: "正在更新商店关注",
    updating: "更新中…",
    followingStore: "已关注商店",
    followStore: "关注商店",
    compareMore: "比较更多",
    note: "快速加入会即时更新迷你购物车。已保存的商品、关注、通知以及未来的付款事件都绑定到同一个 HenryCo 账户身份。",
    removeFromWishlist: "从心愿单移除",
    saveToWishlist: "保存到心愿单",
  },
  storeActions: {
    updatingFollow: "正在更新商店关注",
    updating: "更新中...",
    followingStore: "已关注商店",
    followThisStore: "关注此商店",
    savedStores: "已保存的商店",
    browseRelated: "浏览相关",
  },
  variantMatrix: {
    sectionLabel: "产品规格选择",
    chooseVariant: "选择您的规格",
    skuLabel: "货号",
    placeholder: "—",
    out: "缺货",
    price: "价格",
    availability: "可用情况",
    inStock: "库存 {count} 件",
    unavailable: "目前不可用",
    match: "匹配",
    variantResolved: "已确定精确规格",
    pickValue: "为每个维度选择一个值",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<MarketplaceCheckoutCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getMarketplaceCheckoutCopy(locale: AppLocale): MarketplaceCheckoutCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as MarketplaceCheckoutCopy;
  return EN;
}
