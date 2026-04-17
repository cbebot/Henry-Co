import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type MarketplaceCopy = {
  nav: {
    browse: string;
    sell: string;
    orders: string;
    account: string;
  };
  hero: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    ctaBrowse: string;
    ctaSell: string;
  };
  product: {
    addToCart: string;
    buyNow: string;
    outOfStock: string;
    inStock: string;
    reviews: string;
    seller: string;
    ships: string;
    returnPolicy: string;
    viewDetails: string;
    condition: string;
    conditionNew: string;
    conditionUsed: string;
  };
  checkout: {
    title: string;
    orderSummary: string;
    subtotal: string;
    shipping: string;
    total: string;
    placeOrder: string;
    continueToPayment: string;
    address: string;
    paymentMethod: string;
  };
  seller: {
    storefront: string;
    applyToSell: string;
    applicationPending: string;
    applicationApproved: string;
    manageListings: string;
    createListing: string;
  };
  status: {
    pending: string;
    confirmed: string;
    shipped: string;
    delivered: string;
    cancelled: string;
    refunded: string;
  };
  empty: {
    noProducts: string;
    noOrders: string;
    noListings: string;
  };
};

const EN: MarketplaceCopy = {
  nav: {
    browse: "Browse",
    sell: "Sell",
    orders: "Orders",
    account: "Account",
  },
  hero: {
    title: "Refined premium marketplace",
    subtitle: "Buy from verified stores, sell to a discerning audience.",
    searchPlaceholder: "Search products, stores, categories…",
    ctaBrowse: "Browse products",
    ctaSell: "Start selling",
  },
  product: {
    addToCart: "Add to cart",
    buyNow: "Buy now",
    outOfStock: "Out of stock",
    inStock: "In stock",
    reviews: "Reviews",
    seller: "Seller",
    ships: "Ships",
    returnPolicy: "Return policy",
    viewDetails: "View details",
    condition: "Condition",
    conditionNew: "New",
    conditionUsed: "Used",
  },
  checkout: {
    title: "Checkout",
    orderSummary: "Order summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total",
    placeOrder: "Place order",
    continueToPayment: "Continue to payment",
    address: "Delivery address",
    paymentMethod: "Payment method",
  },
  seller: {
    storefront: "Storefront",
    applyToSell: "Apply to sell",
    applicationPending: "Application under review",
    applicationApproved: "Approved seller",
    manageListings: "Manage listings",
    createListing: "Create listing",
  },
  status: {
    pending: "Pending",
    confirmed: "Confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
  },
  empty: {
    noProducts: "No products found. Try a different search or category.",
    noOrders: "No orders yet.",
    noListings: "No listings yet. Create your first product listing.",
  },
};

const FR: Partial<MarketplaceCopy> = {
  nav: {
    browse: "Explorer",
    sell: "Vendre",
    orders: "Commandes",
    account: "Compte",
  },
  hero: {
    title: "Marketplace premium raffinée",
    subtitle: "Achetez auprès de boutiques vérifiées, vendez à un public exigeant.",
    searchPlaceholder: "Rechercher produits, boutiques, catégories…",
    ctaBrowse: "Explorer les produits",
    ctaSell: "Commencer à vendre",
  },
  product: {
    addToCart: "Ajouter au panier",
    buyNow: "Acheter maintenant",
    outOfStock: "Rupture de stock",
    inStock: "En stock",
    reviews: "Avis",
    seller: "Vendeur",
    ships: "Expédié",
    returnPolicy: "Politique de retour",
    viewDetails: "Voir les détails",
    condition: "État",
    conditionNew: "Neuf",
    conditionUsed: "Occasion",
  },
  checkout: {
    title: "Paiement",
    orderSummary: "Récapitulatif de commande",
    subtotal: "Sous-total",
    shipping: "Livraison",
    total: "Total",
    placeOrder: "Passer la commande",
    continueToPayment: "Continuer vers le paiement",
    address: "Adresse de livraison",
    paymentMethod: "Moyen de paiement",
  },
  seller: {
    storefront: "Vitrine",
    applyToSell: "Demander à vendre",
    applicationPending: "Demande en cours d'examen",
    applicationApproved: "Vendeur approuvé",
    manageListings: "Gérer les annonces",
    createListing: "Créer une annonce",
  },
  status: {
    pending: "En attente",
    confirmed: "Confirmé",
    shipped: "Expédié",
    delivered: "Livré",
    cancelled: "Annulé",
    refunded: "Remboursé",
  },
  empty: {
    noProducts: "Aucun produit trouvé. Essayez une autre recherche ou catégorie.",
    noOrders: "Pas encore de commandes.",
    noListings: "Pas encore d'annonces. Créez votre première annonce.",
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<MarketplaceCopy>>> = {
  fr: FR,
};

export function getMarketplaceCopy(locale: AppLocale): MarketplaceCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as MarketplaceCopy;
  }
  return EN;
}
