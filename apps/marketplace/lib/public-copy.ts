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
