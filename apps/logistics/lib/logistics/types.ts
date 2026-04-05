export type LogisticsRole =
  | "customer"
  | "logistics_owner"
  | "dispatch_manager"
  | "dispatch_admin"
  | "rider"
  | "support"
  | "finance_ops";

export type ShipmentRequestType = "quote" | "booking";

export type LogisticsServiceType =
  | "same_day"
  | "scheduled"
  | "dispatch"
  | "inter_city"
  | "business_route";

export type LogisticsUrgency = "standard" | "priority" | "rush";

export type LogisticsLifecycleStatus =
  | "quote_requested"
  | "quoted"
  | "awaiting_payment"
  | "booked"
  | "assigned"
  | "pickup_confirmed"
  | "in_transit"
  | "delayed"
  | "attempted_delivery"
  | "delivered"
  | "failed_delivery"
  | "return_initiated"
  | "returned"
  | "cancelled";

export type LogisticsPaymentStatus =
  | "not_required"
  | "pending"
  | "verifying"
  | "paid"
  | "refunded"
  | "failed";

export type LogisticsPricingStatus = "draft" | "quoted" | "approved" | "overridden";

export type LogisticsAddressKind = "pickup" | "dropoff" | "billing";

export type LogisticsIssueSeverity = "low" | "medium" | "high" | "critical";

export type LogisticsIssueStatus = "open" | "investigating" | "resolved" | "cancelled";

export type LogisticsNotificationStatus = "queued" | "sent" | "skipped" | "failed";

export type LogisticsExpenseStatus = "submitted" | "approved" | "rejected";

export type LogisticsViewer = {
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
  } | null;
  normalizedEmail: string | null;
  roles: LogisticsRole[];
  memberships: Array<{
    id: string;
    role: LogisticsRole;
    scopeType: string;
    scopeId: string | null;
  }>;
};

export type LogisticsZone = {
  id: string;
  key: string;
  name: string;
  summary: string;
  city: string;
  region: string;
  baseFee: number;
  sameDayMultiplier: number;
  interCityMultiplier: number;
  etaHoursMin: number;
  etaHoursMax: number;
  active: boolean;
  sortOrder: number;
};

export type LogisticsRateCard = {
  id: string;
  zoneId: string | null;
  serviceType: LogisticsServiceType;
  urgency: LogisticsUrgency;
  baseAmount: number;
  weightFeePerKg: number;
  fragileFee: number;
  sizeSurcharge: number;
  manualOnly: boolean;
  active: boolean;
};

export type LogisticsAddress = {
  id: string;
  shipmentId: string;
  kind: LogisticsAddressKind;
  label: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  country: string;
  landmark: string | null;
  instructions: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type LogisticsPricingBreakdown = {
  currency: string;
  zoneLabel: string;
  serviceType: LogisticsServiceType;
  urgency: LogisticsUrgency;
  baseFee: number;
  urgencyFee: number;
  weightFee: number;
  sizeFee: number;
  fragileFee: number;
  interCityFee: number;
  manualAdjustment: number;
  total: number;
  promiseWindowHours: [number, number];
  promiseConfidence: number;
};

export type LogisticsShipment = {
  id: string;
  trackingCode: string;
  requestType: ShipmentRequestType;
  serviceType: LogisticsServiceType;
  lifecycleStatus: LogisticsLifecycleStatus;
  paymentStatus: LogisticsPaymentStatus;
  pricingStatus: LogisticsPricingStatus;
  customerUserId: string | null;
  normalizedEmail: string | null;
  senderName: string;
  senderPhone: string | null;
  senderEmail: string | null;
  recipientName: string;
  recipientPhone: string | null;
  recipientEmail: string | null;
  parcelType: string;
  parcelDescription: string | null;
  fragile: boolean;
  weightKg: number;
  sizeTier: "small" | "medium" | "large" | "oversize";
  urgency: LogisticsUrgency;
  zoneId: string | null;
  zoneLabel: string | null;
  scheduledPickupAt: string | null;
  scheduledDeliveryAt: string | null;
  assignedRiderUserId: string | null;
  assignedRiderName: string | null;
  paymentReference: string | null;
  amountQuoted: number;
  amountPaid: number;
  pricingBreakdown: LogisticsPricingBreakdown;
  overrideMeta: Record<string, unknown>;
  supportSummary: string | null;
  requiresPod: boolean;
  lastEventAt: string | null;
  createdAt: string;
  updatedAt: string;
  pickupAddress?: LogisticsAddress | null;
  dropoffAddress?: LogisticsAddress | null;
};

export type LogisticsAssignment = {
  id: string;
  shipmentId: string;
  riderUserId: string | null;
  riderName: string | null;
  riderPhone: string | null;
  assignedByUserId: string | null;
  assignedByName: string | null;
  etaCommittedAt: string | null;
  status: "assigned" | "accepted" | "reassigned" | "completed";
  notes: string | null;
  createdAt: string;
};

export type LogisticsEvent = {
  id: string;
  shipmentId: string;
  eventType: string;
  lifecycleStatus: LogisticsLifecycleStatus | null;
  title: string;
  description: string;
  actorUserId: string | null;
  actorName: string | null;
  actorRole: string | null;
  meta: Record<string, unknown>;
  customerVisible: boolean;
  createdAt: string;
};

export type LogisticsProofOfDelivery = {
  id: string;
  shipmentId: string;
  recipientName: string;
  deliveredAt: string;
  proofType: "signature" | "photo" | "code" | "hybrid";
  note: string | null;
  photoPath: string | null;
  signaturePath: string | null;
  geoLat: number | null;
  geoLng: number | null;
  createdAt: string;
};

export type LogisticsIssue = {
  id: string;
  shipmentId: string;
  severity: LogisticsIssueSeverity;
  status: LogisticsIssueStatus;
  issueType: string;
  summary: string;
  details: string;
  openedByUserId: string | null;
  ownerUserId: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LogisticsExpense = {
  id: string;
  shipmentId: string | null;
  riderUserId: string | null;
  category: string;
  amount: number;
  currency: string;
  note: string | null;
  receiptPath: string | null;
  status: LogisticsExpenseStatus;
  createdAt: string;
};

export type LogisticsNotification = {
  id: string;
  shipmentId: string | null;
  channel: "email" | "whatsapp";
  templateKey: string;
  recipient: string;
  subject: string;
  status: LogisticsNotificationStatus;
  reason: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
};

export type LogisticsSettings = {
  businessName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  defaultCountry: string;
  quoteExpiryHours: number;
  staleShipmentHours: number;
  ownerAlertEmail: string | null;
  ownerAlertWhatsApp: string | null;
  pickupHours: string;
  operationsCity: string;
  operationsRegion: string;
  trackingLookupHelp: string;
  businessTrustBullets: string[];
};

export type LogisticsPublicMetric = {
  label: string;
  value: string;
  note: string;
};

export type LogisticsServiceCard = {
  slug: string;
  name: string;
  summary: string;
  promise: string;
  badge: string;
  serviceType: LogisticsServiceType;
  highlights: string[];
};

export type LogisticsDifferentiator = {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  difficulty: "medium" | "high" | "very_high";
  innovationScore: number;
};

export type LogisticsDashboardQueue = {
  id: string;
  title: string;
  description: string;
  tone: "critical" | "warning" | "info" | "success";
  shipments: LogisticsShipment[];
};

/** Real rider/dispatch GPS breadcrumbs only — empty until the rider app posts coordinates. */
export type LogisticsTrackingPoint = {
  id: string;
  shipmentId: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  source: string;
  recordedAt: string;
};
