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

const ES: Partial<MarketplaceCopy> = {
  nav: {
    browse: "Explorar",
    sell: "Vender",
    orders: "Pedidos",
    account: "Cuenta",
  },
  hero: {
    title: "Marketplace premium refinado",
    subtitle: "Compra en tiendas verificadas, vende a un público exigente.",
    searchPlaceholder: "Buscar productos, tiendas, categorías…",
    ctaBrowse: "Explorar productos",
    ctaSell: "Empezar a vender",
  },
  product: {
    addToCart: "Agregar al carrito",
    buyNow: "Comprar ahora",
    outOfStock: "Sin existencias",
    inStock: "En existencias",
    reviews: "Reseñas",
    seller: "Vendedor",
    ships: "Envío",
    returnPolicy: "Política de devolución",
    viewDetails: "Ver detalles",
    condition: "Condición",
    conditionNew: "Nuevo",
    conditionUsed: "Usado",
  },
  checkout: {
    title: "Pago",
    orderSummary: "Resumen del pedido",
    subtotal: "Subtotal",
    shipping: "Envío",
    total: "Total",
    placeOrder: "Realizar pedido",
    continueToPayment: "Continuar al pago",
    address: "Dirección de entrega",
    paymentMethod: "Método de pago",
  },
  seller: {
    storefront: "Tienda",
    applyToSell: "Solicitar vender",
    applicationPending: "Solicitud en revisión",
    applicationApproved: "Vendedor aprobado",
    manageListings: "Gestionar listados",
    createListing: "Crear listado",
  },
  status: {
    pending: "Pendiente",
    confirmed: "Confirmado",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  },
  empty: {
    noProducts: "No se encontraron productos. Prueba otra búsqueda o categoría.",
    noOrders: "Aún sin pedidos.",
    noListings: "Aún sin listados. Crea tu primer listado.",
  },
};

const PT: Partial<MarketplaceCopy> = {
  nav: {
    browse: "Explorar",
    sell: "Vender",
    orders: "Pedidos",
    account: "Conta",
  },
  hero: {
    title: "Marketplace premium refinado",
    subtitle: "Compre em lojas verificadas, venda para um público exigente.",
    searchPlaceholder: "Pesquisar produtos, lojas, categorias…",
    ctaBrowse: "Explorar produtos",
    ctaSell: "Começar a vender",
  },
  product: {
    addToCart: "Adicionar ao carrinho",
    buyNow: "Comprar agora",
    outOfStock: "Esgotado",
    inStock: "Em estoque",
    reviews: "Avaliações",
    seller: "Vendedor",
    ships: "Envio",
    returnPolicy: "Política de devolução",
    viewDetails: "Ver detalhes",
    condition: "Condição",
    conditionNew: "Novo",
    conditionUsed: "Usado",
  },
  checkout: {
    title: "Finalizar compra",
    orderSummary: "Resumo do pedido",
    subtotal: "Subtotal",
    shipping: "Frete",
    total: "Total",
    placeOrder: "Fazer pedido",
    continueToPayment: "Continuar para pagamento",
    address: "Endereço de entrega",
    paymentMethod: "Forma de pagamento",
  },
  seller: {
    storefront: "Vitrine",
    applyToSell: "Solicitar para vender",
    applicationPending: "Solicitação em análise",
    applicationApproved: "Vendedor aprovado",
    manageListings: "Gerenciar anúncios",
    createListing: "Criar anúncio",
  },
  status: {
    pending: "Pendente",
    confirmed: "Confirmado",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  },
  empty: {
    noProducts: "Nenhum produto encontrado. Tente outra pesquisa ou categoria.",
    noOrders: "Sem pedidos ainda.",
    noListings: "Sem anúncios ainda. Crie seu primeiro anúncio.",
  },
};

const AR: Partial<MarketplaceCopy> = {
  nav: {
    browse: "تصفح",
    sell: "بيع",
    orders: "الطلبات",
    account: "الحساب",
  },
  hero: {
    title: "سوق متميز راقٍ",
    subtitle: "اشترِ من متاجر موثقة، بِع لجمهور ذواق.",
    searchPlaceholder: "ابحث عن منتجات، متاجر، فئات…",
    ctaBrowse: "تصفح المنتجات",
    ctaSell: "ابدأ البيع",
  },
  product: {
    addToCart: "أضف إلى السلة",
    buyNow: "اشترِ الآن",
    outOfStock: "غير متوفر",
    inStock: "متوفر",
    reviews: "التقييمات",
    seller: "البائع",
    ships: "الشحن",
    returnPolicy: "سياسة الإرجاع",
    viewDetails: "عرض التفاصيل",
    condition: "الحالة",
    conditionNew: "جديد",
    conditionUsed: "مستعمل",
  },
  checkout: {
    title: "الدفع",
    orderSummary: "ملخص الطلب",
    subtotal: "المجموع الفرعي",
    shipping: "الشحن",
    total: "الإجمالي",
    placeOrder: "تأكيد الطلب",
    continueToPayment: "المتابعة للدفع",
    address: "عنوان التوصيل",
    paymentMethod: "طريقة الدفع",
  },
  seller: {
    storefront: "واجهة المتجر",
    applyToSell: "التقدم للبيع",
    applicationPending: "الطلب قيد المراجعة",
    applicationApproved: "بائع معتمد",
    manageListings: "إدارة القوائم",
    createListing: "إنشاء قائمة",
  },
  status: {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
    refunded: "مسترجع",
  },
  empty: {
    noProducts: "لم يتم العثور على منتجات. جرب بحثاً أو فئة مختلفة.",
    noOrders: "لا توجد طلبات بعد.",
    noListings: "لا توجد قوائم بعد. أنشئ قائمتك الأولى.",
  },
};

const IG: Partial<MarketplaceCopy> = {
  nav: {
    browse: "Lelee",
    sell: "Ree",
    orders: "Iwu",
    account: "Akaụntụ",
  },
  hero: {
    title: "Ebe ahịa dị mma",
    subtitle: "Zụọ site n'ụlọ ahịa amara, ree nye ndị ọ masịrị.",
    searchPlaceholder: "Chọọ ngwaahịa, ụlọ ahịa, ụdị…",
    ctaBrowse: "Lelee ngwaahịa",
    ctaSell: "Malite ire ere",
  },
  product: {
    addToCart: "Tinye n'igbe",
    buyNow: "Zụọ ugbu a",
    outOfStock: "Afụọla",
    inStock: "Dị",
    reviews: "Nyocha",
    seller: "Onye ire ere",
    ships: "Ezipụta",
    returnPolicy: "Iwu nlaghachi",
    viewDetails: "Hụ nkọwa",
    condition: "Ọnọdụ",
    conditionNew: "Ọhụrụ",
    conditionUsed: "Ejiela",
  },
  checkout: {
    title: "Kwụọ ụgwọ",
    orderSummary: "Nchịkọta iwu",
    subtotal: "Subtotal",
    shipping: "Ezipụta",
    total: "Ngụkọta",
    placeOrder: "Dee iwu",
    continueToPayment: "Gaa n'ịkwụ ụgwọ",
    address: "Adreesị nnyefe",
    paymentMethod: "Ụzọ ịkwụ ụgwọ",
  },
  seller: {
    storefront: "Ihe ngosi ụlọ ahịa",
    applyToSell: "Rịọ ire ere",
    applicationPending: "Arịrịọ na-atụleghị",
    applicationApproved: "Onye ire ere kwenyere",
    manageListings: "Jikwaa ndepụta",
    createListing: "Mepụta ndepụta",
  },
  status: {
    pending: "Na-atọ",
    confirmed: "Kwenyere",
    shipped: "Ezipụtara",
    delivered: "Enyela",
    cancelled: "Kagbuo",
    refunded: "Eweghachitara",
  },
  empty: {
    noProducts: "Enweghị ngwaahịa. Nwaa ọchịchọ ọzọ.",
    noOrders: "Enweghị iwu ọ bụla.",
    noListings: "Enweghị ndepụta. Mepụta nke mbụ.",
  },
};

const YO: Partial<MarketplaceCopy> = {
  nav: {
    browse: "Wo",
    sell: "Ta",
    orders: "Awọn aṣẹ",
    account: "Akọọlẹ",
  },
  hero: {
    title: "Ọjà premium ti a ti ṣe dara",
    subtitle: "Ra lati awọn ile itaja ti a fọwọsi, ta si olugbo ti o ni ọgbọn.",
    searchPlaceholder: "Wa awọn ọja, ile itaja, ẹka…",
    ctaBrowse: "Wo awọn ọja",
    ctaSell: "Bẹrẹ titaaju",
  },
  product: {
    addToCart: "Fi si agbọn",
    buyNow: "Ra bayi",
    outOfStock: "Ko si ni ile itaja",
    inStock: "O wa",
    reviews: "Awọn atunwo",
    seller: "Olutaja",
    ships: "Firanṣẹ",
    returnPolicy: "Eto ipadabọ",
    viewDetails: "Wo alaye",
    condition: "Ipo",
    conditionNew: "Tuntun",
    conditionUsed: "Ti lo tẹlẹ",
  },
  checkout: {
    title: "Isanwo",
    orderSummary: "Akopọ aṣẹ",
    subtotal: "Apapọ kekere",
    shipping: "Ifiṣẹ",
    total: "Apapọ",
    placeOrder: "Gbe aṣẹ",
    continueToPayment: "Tẹsiwaju si isanwo",
    address: "Adirẹsi ifiṣẹ",
    paymentMethod: "Ọna isanwo",
  },
  seller: {
    storefront: "Iwaju ile itaja",
    applyToSell: "Beere lati ta",
    applicationPending: "Ìbéèrè wa ni atunyẹwo",
    applicationApproved: "Olutaja ti fọwọsi",
    manageListings: "Ṣakoso awọn atokọ",
    createListing: "Ṣẹda atokọ",
  },
  status: {
    pending: "Nduro",
    confirmed: "Ti jẹrisi",
    shipped: "Ti firanṣẹ",
    delivered: "Ti fi jiṣẹ",
    cancelled: "Ti fagilee",
    refunded: "Ti sanwo pada",
  },
  empty: {
    noProducts: "Ko si ọja ti a rii. Gbiyanju wiwa miiran.",
    noOrders: "Ko si aṣẹ sibẹsibẹ.",
    noListings: "Ko si atokọ sibẹsibẹ. Ṣẹda akọkọ rẹ.",
  },
};

const HA: Partial<MarketplaceCopy> = {
  nav: {
    browse: "Bincika",
    sell: "Sayar",
    orders: "Oda",
    account: "Asusun",
  },
  hero: {
    title: "Kasuwar premium mai inganci",
    subtitle: "Saya daga kantunan da aka tabbatar, sayar ga masu zabi.",
    searchPlaceholder: "Nemi kayayyaki, kantuna, nau'i…",
    ctaBrowse: "Bincika kayayyaki",
    ctaSell: "Fara sayarwa",
  },
  product: {
    addToCart: "Ƙara zuwa kwandon",
    buyNow: "Saya yanzu",
    outOfStock: "Ba a cikin kanti",
    inStock: "Yana cikin kanti",
    reviews: "Bita",
    seller: "Mai sayarwa",
    ships: "Aika",
    returnPolicy: "Manufar dawo",
    viewDetails: "Duba cikakkun bayanai",
    condition: "Yanayi",
    conditionNew: "Sabon",
    conditionUsed: "An yi amfani",
  },
  checkout: {
    title: "Biya",
    orderSummary: "Taƙaitaccen oda",
    subtotal: "Jimlar ƙarami",
    shipping: "Jigilar kaya",
    total: "Jimla",
    placeOrder: "Yi oda",
    continueToPayment: "Ci gaba zuwa biyan kuɗi",
    address: "Adireshi isa",
    paymentMethod: "Hanyar biyan kuɗi",
  },
  seller: {
    storefront: "Gaban kantin",
    applyToSell: "Nemi sayarwa",
    applicationPending: "Buƙata ana dubawa",
    applicationApproved: "Mai sayarwa da aka amince",
    manageListings: "Sarrafa jerin",
    createListing: "Ƙirƙiri jerin",
  },
  status: {
    pending: "A tsallake",
    confirmed: "An tabbatar",
    shipped: "An tura",
    delivered: "An isar da shi",
    cancelled: "An soke",
    refunded: "An dawo da kuɗi",
  },
  empty: {
    noProducts: "Ba a sami kayayyaki ba. Gwada bincike daban.",
    noOrders: "Babu oda tukuna.",
    noListings: "Babu jerin tukuna. Ƙirƙiri na farko.",
  },
};

const DE: Partial<MarketplaceCopy> = {
  nav: {
    browse: "Durchsuchen",
    sell: "Verkaufen",
    orders: "Bestellungen",
    account: "Konto",
  },
  hero: {
    title: "Verfeineter Premium-Marktplatz",
    subtitle: "Kaufen Sie bei verifizierten Geschäften, verkaufen Sie an ein anspruchsvolles Publikum.",
    searchPlaceholder: "Produkte, Geschäfte, Kategorien suchen…",
    ctaBrowse: "Produkte durchsuchen",
    ctaSell: "Mit Verkaufen beginnen",
  },
  product: {
    addToCart: "In den Warenkorb",
    buyNow: "Jetzt kaufen",
    outOfStock: "Nicht vorrätig",
    inStock: "Vorrätig",
    reviews: "Bewertungen",
    seller: "Verkäufer",
    ships: "Versand",
    returnPolicy: "Rückgabebedingungen",
    viewDetails: "Details anzeigen",
    condition: "Zustand",
    conditionNew: "Neu",
    conditionUsed: "Gebraucht",
  },
  checkout: {
    title: "Kasse",
    orderSummary: "Bestellübersicht",
    subtotal: "Zwischensumme",
    shipping: "Versand",
    total: "Gesamt",
    placeOrder: "Bestellung aufgeben",
    continueToPayment: "Weiter zur Zahlung",
    address: "Lieferadresse",
    paymentMethod: "Zahlungsmethode",
  },
  seller: {
    storefront: "Schaufenster",
    applyToSell: "Als Verkäufer bewerben",
    applicationPending: "Bewerbung in Prüfung",
    applicationApproved: "Genehmigter Verkäufer",
    manageListings: "Angebote verwalten",
    createListing: "Angebot erstellen",
  },
  status: {
    pending: "Ausstehend",
    confirmed: "Bestätigt",
    shipped: "Versendet",
    delivered: "Geliefert",
    cancelled: "Storniert",
    refunded: "Erstattet",
  },
  empty: {
    noProducts: "Keine Produkte gefunden. Versuchen Sie eine andere Suche.",
    noOrders: "Noch keine Bestellungen.",
    noListings: "Noch keine Angebote. Erstellen Sie Ihr erstes Angebot.",
  },
};

const ZH: Partial<MarketplaceCopy> = {
  nav: {
    browse: "浏览",
    sell: "出售",
    orders: "订单",
    account: "账户",
  },
  hero: {
    title: "精致优质的市场",
    subtitle: "从经过验证的店铺购买，向挑剔的买家销售。",
    searchPlaceholder: "搜索产品、商店、类别…",
    ctaBrowse: "浏览产品",
    ctaSell: "开始销售",
  },
  product: {
    addToCart: "加入购物车",
    buyNow: "立即购买",
    outOfStock: "缺货",
    inStock: "有货",
    reviews: "评价",
    seller: "卖家",
    ships: "发货",
    returnPolicy: "退货政策",
    viewDetails: "查看详情",
    condition: "状态",
    conditionNew: "全新",
    conditionUsed: "二手",
  },
  checkout: {
    title: "结账",
    orderSummary: "订单摘要",
    subtotal: "小计",
    shipping: "运费",
    total: "总计",
    placeOrder: "下订单",
    continueToPayment: "继续付款",
    address: "收货地址",
    paymentMethod: "支付方式",
  },
  seller: {
    storefront: "店面",
    applyToSell: "申请销售",
    applicationPending: "申请审核中",
    applicationApproved: "已批准卖家",
    manageListings: "管理商品",
    createListing: "创建商品",
  },
  status: {
    pending: "待处理",
    confirmed: "已确认",
    shipped: "已发货",
    delivered: "已送达",
    cancelled: "已取消",
    refunded: "已退款",
  },
  empty: {
    noProducts: "未找到产品。请尝试不同的搜索或类别。",
    noOrders: "还没有订单。",
    noListings: "还没有商品。创建您的第一个商品。",
  },
};

const HI: Partial<MarketplaceCopy> = {
  nav: {
    browse: "ब्राउज़ करें",
    sell: "बेचें",
    orders: "ऑर्डर",
    account: "खाता",
  },
  hero: {
    title: "परिष्कृत प्रीमियम मार्केटप्लेस",
    subtitle: "सत्यापित दुकानों से खरीदें, विवेकशील दर्शकों को बेचें।",
    searchPlaceholder: "उत्पाद, दुकानें, श्रेणियां खोजें…",
    ctaBrowse: "उत्पाद ब्राउज़ करें",
    ctaSell: "बेचना शुरू करें",
  },
  product: {
    addToCart: "कार्ट में जोड़ें",
    buyNow: "अभी खरीदें",
    outOfStock: "स्टॉक में नहीं",
    inStock: "स्टॉक में है",
    reviews: "समीक्षाएं",
    seller: "विक्रेता",
    ships: "शिपिंग",
    returnPolicy: "वापसी नीति",
    viewDetails: "विवरण देखें",
    condition: "स्थिति",
    conditionNew: "नया",
    conditionUsed: "इस्तेमाल किया",
  },
  checkout: {
    title: "चेकआउट",
    orderSummary: "ऑर्डर सारांश",
    subtotal: "उप-योग",
    shipping: "शिपिंग",
    total: "कुल",
    placeOrder: "ऑर्डर दें",
    continueToPayment: "भुगतान जारी रखें",
    address: "डिलीवरी पता",
    paymentMethod: "भुगतान विधि",
  },
  seller: {
    storefront: "स्टोरफ्रंट",
    applyToSell: "बेचने के लिए आवेदन करें",
    applicationPending: "आवेदन समीक्षाधीन",
    applicationApproved: "स्वीकृत विक्रेता",
    manageListings: "लिस्टिंग प्रबंधित करें",
    createListing: "लिस्टिंग बनाएं",
  },
  status: {
    pending: "लंबित",
    confirmed: "पुष्टि की गई",
    shipped: "भेजा गया",
    delivered: "डिलीवर किया गया",
    cancelled: "रद्द",
    refunded: "वापस किया गया",
  },
  empty: {
    noProducts: "कोई उत्पाद नहीं मिला। कोई अन्य खोज या श्रेणी आज़माएं।",
    noOrders: "अभी तक कोई ऑर्डर नहीं।",
    noListings: "अभी तक कोई लिस्टिंग नहीं। अपनी पहली लिस्टिंग बनाएं।",
  },
};

const IT: Partial<MarketplaceCopy> = {
  "nav": {
    "browse": "Sfoglia",
    "sell": "Vendere",
    "orders": "Ordini",
    "account": "Conto"
  },
  "hero": {
    "title": "Mercato premium raffinato",
    "subtitle": "Acquista da negozi verificati, vendi a un pubblico esigente.",
    "searchPlaceholder": "Cerca prodotti, negozi, categorie...",
    "ctaBrowse": "Sfoglia i prodotti",
    "ctaSell": "Inizia a vendere"
  },
  "product": {
    "addToCart": "Aggiungi al carrello",
    "buyNow": "Acquista ora",
    "outOfStock": "Esaurito",
    "inStock": "Disponibile",
    "reviews": "Recensioni",
    "seller": "Venditore",
    "ships": "Spedizione",
    "returnPolicy": "Politica di reso",
    "viewDetails": "Visualizza i dettagli",
    "condition": "Condizione",
    "conditionNew": "Nuovo",
    "conditionUsed": "Usato"
  },
  "checkout": {
    "title": "Check-out",
    "orderSummary": "Riepilogo dell'ordine",
    "subtotal": "Totale parziale",
    "shipping": "Spedizione",
    "total": "Totale",
    "placeOrder": "Effettua l'ordine",
    "continueToPayment": "Procedi al pagamento",
    "address": "Indirizzo di consegna",
    "paymentMethod": "Metodo di pagamento"
  },
  "seller": {
    "storefront": "Vetrina",
    "applyToSell": "Fai domanda per vendere",
    "applicationPending": "Domanda in fase di revisione",
    "applicationApproved": "Venditore approvato",
    "manageListings": "Gestisci le inserzioni",
    "createListing": "Crea inserzione"
  },
  "status": {
    "pending": "In sospeso",
    "confirmed": "Confermato",
    "shipped": "Spedito",
    "delivered": "Consegnato",
    "cancelled": "Annullato",
    "refunded": "Rimborsato"
  },
  "empty": {
    "noProducts": "Nessun prodotto trovato. Prova una ricerca o una categoria diversa.",
    "noOrders": "Nessun ordine ancora",
    "noListings": "Nessuna inserzione ancora. Crea la tua prima inserzione di prodotto."
  }
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<MarketplaceCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  ig: IG,
  yo: YO,
  ha: HA,
  de: DE,
  it: IT,
  zh: ZH,
  hi: HI,
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
