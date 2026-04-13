export type MarketplaceRole =
  | "buyer"
  | "vendor_applicant"
  | "vendor"
  | "marketplace_owner"
  | "marketplace_admin"
  | "moderation"
  | "support"
  | "finance"
  | "operations";

export type MarketplaceStaffRole = Extract<
  MarketplaceRole,
  "marketplace_owner" | "marketplace_admin" | "moderation" | "support" | "finance" | "operations"
>;

export type VendorStatus = "pending" | "approved" | "changes_requested" | "rejected" | "suspended";
export type VendorApplicationStatus = VendorStatus | "draft" | "submitted" | "under_review";
export type ProductApprovalStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "changes_requested"
  | "rejected";
export type OrderStatus =
  | "cart"
  | "placed"
  | "awaiting_payment"
  | "paid_held"
  | "payment_verified"
  | "fulfillment_in_progress"
  | "processing"
  | "partially_shipped"
  | "shipped"
  | "delivered"
  | "delivered_pending_confirmation"
  | "awaiting_auto_release"
  | "payout_releasable"
  | "payout_released"
  | "payout_frozen"
  | "disputed"
  | "refunded"
  | "partially_refunded"
  | "cancelled";
export type PaymentStatus = "pending" | "receipt_submitted" | "verified" | "failed" | "refunded";
export type FulfillmentStatus =
  | "awaiting_acceptance"
  | "confirmed"
  | "fulfillment_in_progress"
  | "packed"
  | "shipped"
  | "delivered"
  | "delivered_pending_confirmation"
  | "delayed"
  | "returned";
export type PayoutStatus =
  | "eligible"
  | "awaiting_payment"
  | "paid_held"
  | "awaiting_auto_release"
  | "payout_releasable"
  | "requested"
  | "approved"
  | "payout_released"
  | "payout_frozen"
  | "disputed"
  | "refunded"
  | "partially_refunded"
  | "rejected"
  | "paid";
export type ReviewStatus = "pending" | "published" | "hidden";
export type DisputeStatus = "open" | "investigating" | "resolved" | "rejected";
export type CampaignSurface = "hero" | "editorial" | "deals" | "category" | "checkout";
export type TrustSignalTone = "positive" | "neutral" | "warning" | "critical";
export type TrustRiskBand = "low" | "guarded" | "elevated" | "high";

export type TrustSignal = {
  id: string;
  label: string;
  value: string;
  tone: TrustSignalTone;
  detail: string;
};

export type TrustPassport = {
  score: number;
  label: string;
  riskBand: TrustRiskBand;
  summary: string;
  strengths: string[];
  warnings: string[];
  nextSteps: string[];
  suspiciousFlags: string[];
  signals: TrustSignal[];
};

export type MarketplaceKpi = {
  label: string;
  value: string;
  hint: string;
};

export type MarketplaceCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  hero: string;
  featured: boolean;
  productCount: number;
  filterPresets: string[];
  trustNotes: string[];
};

export type MarketplaceBrand = {
  id: string;
  slug: string;
  name: string;
  description: string;
  accent: string;
  logoUrl: string | null;
};

export type MarketplaceVendor = {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: VendorStatus;
  verificationLevel: "bronze" | "silver" | "gold" | "henryco";
  trustScore: number;
  responseSlaHours: number;
  fulfillmentRate: number;
  disputeRate: number;
  reviewScore: number;
  followersCount: number;
  accent: string;
  heroImage: string;
  badges: string[];
  ownerType: "company" | "vendor";
  supportEmail: string;
  supportPhone: string;
  trustPassport?: TrustPassport;
};

export type MarketplaceProduct = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  categorySlug: string;
  brandSlug: string | null;
  vendorSlug: string | null;
  inventoryOwnerType: "company" | "vendor";
  basePrice: number;
  compareAtPrice: number | null;
  currency: string;
  stock: number;
  sku: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  approvalStatus: ProductApprovalStatus;
  trustBadges: string[];
  gallery: string[];
  specifications: Record<string, string>;
  filterData: Record<string, string | string[] | boolean>;
  deliveryNote: string;
  leadTime: string;
  codEligible: boolean;
  trustPassport?: TrustPassport;
};

export type MarketplaceCollection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kicker: string;
  productSlugs: string[];
  highlight: string;
};

export type MarketplaceCampaign = {
  id: string;
  slug: string;
  title: string;
  description: string;
  surface: CampaignSurface;
  accent: string;
  ctaLabel: string;
  ctaHref: string;
  countdown: string | null;
};

export type MarketplaceReview = {
  id: string;
  productSlug: string;
  vendorSlug: string;
  buyerName: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  status: ReviewStatus;
  createdAt: string;
};

export type MarketplaceSellerDocumentRecord = {
  kind: "businessRegistration" | "founderIdentity" | "payoutProof" | "other";
  name: string;
  fileUrl: string;
  mimeType: string | null;
  size: number | null;
  publicId: string | null;
  uploadedAt: string;
  status: "uploaded" | "under_review" | "approved" | "rejected";
};

export type MarketplaceCartItem = {
  id: string;
  productSlug: string;
  quantity: number;
  price: number;
  compareAtPrice: number | null;
  vendorSlug: string | null;
  currency: string;
};

export type MarketplaceOrderItem = {
  id: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  vendorSlug: string | null;
};

export type MarketplaceOrderGroup = {
  id: string;
  vendorSlug: string | null;
  ownerType: "company" | "vendor";
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  payoutStatus: PayoutStatus;
  subtotal: number;
  commissionAmount: number;
  netVendorAmount: number;
  shipmentCode: string | null;
  shipmentCarrier: string | null;
  shipmentTrackingCode: string | null;
  deliveredAt: string | null;
};

export type MarketplacePaymentRecord = {
  id: string;
  orderNo: string;
  method: "bank_transfer" | "cod";
  provider: "manual" | "cod";
  status: PaymentStatus;
  amount: number;
  reference: string;
  verifiedAt: string | null;
};

export type MarketplaceOrder = {
  id: string;
  orderNo: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  placedAt: string;
  buyerName: string;
  buyerEmail: string;
  shippingCity: string;
  shippingRegion: string;
  timeline: string[];
  groups: MarketplaceOrderGroup[];
  items: MarketplaceOrderItem[];
};

export type MarketplaceAddress = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  country: string;
  isDefault: boolean;
};

export type MarketplaceNotification = {
  id: string;
  title: string;
  body: string;
  channel: "in_app" | "email" | "whatsapp" | "system";
  createdAt: string;
  readAt: string | null;
};

export type MarketplaceDispute = {
  id: string;
  disputeNo: string;
  orderNo: string;
  vendorSlug: string | null;
  status: DisputeStatus;
  reason: string;
  resolutionType: string | null;
  refundAmount: number | null;
  updatedAt: string;
};

export type MarketplacePayoutRequest = {
  id: string;
  reference: string;
  vendorSlug: string;
  amount: number;
  status: PayoutStatus;
  requestedAt: string;
  reviewedAt: string | null;
};

export type MarketplaceSupportThread = {
  id: string;
  subject: string;
  status: string;
  channel: string;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceVendorApplication = {
  id: string;
  storeName: string;
  slug: string;
  legalName: string;
  phone: string | null;
  categoryFocus: string;
  story: string;
  status: VendorApplicationStatus;
  progressStep: string;
  submittedAt: string;
  reviewNote: string | null;
  documents: Record<string, MarketplaceSellerDocumentRecord>;
  draftPayload: Record<string, unknown>;
  agreementAcceptedAt: string | null;
};

export type MarketplaceHomeData = {
  kpis: MarketplaceKpi[];
  categories: MarketplaceCategory[];
  brands: MarketplaceBrand[];
  vendors: MarketplaceVendor[];
  products: MarketplaceProduct[];
  collections: MarketplaceCollection[];
  campaigns: MarketplaceCampaign[];
  reviews: MarketplaceReview[];
};

export type MarketplaceShellCartItem = {
  id: string;
  productSlug: string;
  title: string;
  vendorSlug: string | null;
  vendorName: string | null;
  quantity: number;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  image: string | null;
  trustBadges: string[];
  inventoryOwnerType: MarketplaceProduct["inventoryOwnerType"];
  deliveryNote: string;
};

export type MarketplaceShellState = {
  schemaReady: boolean;
  issue: string | null;
  viewer: {
    signedIn: boolean;
    userId: string | null;
    firstName: string | null;
    fullName: string | null;
    email: string | null;
    avatarUrl: string | null;
    roles: MarketplaceRole[];
    canApplyToSell: boolean;
    canOpenVendorWorkspace: boolean;
  };
  cart: {
    count: number;
    subtotal: number;
    items: MarketplaceShellCartItem[];
  };
  wishlistSlugs: string[];
  followedVendorSlugs: string[];
  unreadNotificationCount: number;
  sellerApplicationStatus: VendorApplicationStatus | null;
};

export type MarketplaceEvent = {
  id: string;
  eventType: string;
  dedupeKey: string | null;
  userId: string | null;
  normalizedEmail: string | null;
  entityType: string | null;
  entityId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type MarketplaceNotificationAttempt = {
  id: string;
  queueId: string;
  channel: "email" | "whatsapp" | "in_app";
  status: "queued" | "sent" | "skipped" | "failed";
  provider: string | null;
  reason: string | null;
  createdAt: string;
};

export type MarketplaceCommPreference = {
  id: string;
  userId: string | null;
  normalizedEmail: string | null;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  marketingEnabled: boolean;
  updatedAt: string;
};

export type MarketplaceAutomationRun = {
  id: string;
  automationKey: string;
  status: "started" | "completed" | "failed";
  summary: Record<string, unknown>;
  createdAt: string;
};

export type MarketplaceOrderFeedItem = {
  id: string;
  orderNo: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  headline: string;
  detail: string;
  createdAt: string;
};

export type MarketplaceRealtimePayload = {
  type:
    | "cart"
    | "wishlist"
    | "follow"
    | "notification"
    | "order"
    | "inventory"
    | "vendor_application"
    | "payout";
  entityId: string;
  timestamp: string;
  payload?: Record<string, unknown>;
};

export type MarketplaceViewerContext = {
  user:
    | null
    | {
        id: string;
        email: string | null;
        fullName: string | null;
        avatarUrl: string | null;
      };
  normalizedEmail: string | null;
  roles: MarketplaceRole[];
  memberships: Array<{
    id: string;
    role: MarketplaceRole;
    scopeType: string;
    scopeId: string | null;
  }>;
};
