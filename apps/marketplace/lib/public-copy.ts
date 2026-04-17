import type { AppLocale } from "@henryco/i18n/server";
import { translateSurfaceLabel } from "@henryco/i18n";

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
};

const FR: MarketplacePublicCopy = {
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
};

const LOCALE_COPY: Partial<Record<AppLocale, MarketplacePublicCopy>> = {
  fr: FR,
};

export function getMarketplacePublicCopy(locale: AppLocale): MarketplacePublicCopy {
  return LOCALE_COPY[locale] ?? EN;
}

export function translateMarketplacePublicLabel(locale: AppLocale, label: string) {
  return translateSurfaceLabel(locale, label);
}
