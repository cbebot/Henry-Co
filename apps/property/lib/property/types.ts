export type PropertyListingKind =
  | "rent"
  | "sale"
  | "land"
  | "commercial"
  | "managed"
  | "shortlet";

export type PropertyListingStatus =
  | "draft"
  | "submitted"
  | "awaiting_documents"
  | "awaiting_eligibility"
  | "inspection_requested"
  | "inspection_scheduled"
  | "under_review"
  | "requires_correction"
  | "verified"
  | "published"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "blocked"
  | "escalated"
  | "archived";

export type PropertyListingIntent =
  | "owner_listed"
  | "agent_listed"
  | "agent_assisted"
  | "inspection_request"
  | "managed_property"
  | "verified_property";

export type PropertyListingServiceType =
  | "rent"
  | "sale"
  | "shortlet"
  | "land"
  | "commercial"
  | "agent_assisted"
  | "inspection_request"
  | "managed_property"
  | "verified_property";

export type PropertyInquiryStatus =
  | "new"
  | "acknowledged"
  | "assigned"
  | "in_progress"
  | "closed";

export type PropertyViewingStatus =
  | "requested"
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "waitlisted"
  | "no_show";

export type PropertyNotificationStatus = "queued" | "sent" | "skipped" | "failed";

export type PropertyRole =
  | "browser"
  | "property_owner"
  | "listing_manager"
  | "relationship_manager"
  | "moderation"
  | "support"
  | "managed_ops"
  | "property_admin";

export type PropertyRoleMembership = {
  id: string;
  role: PropertyRole;
  scopeType: string;
  scopeId: string | null;
};

export type PropertyViewer = {
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  normalizedEmail: string | null;
  roles: PropertyRole[];
  memberships: PropertyRoleMembership[];
};

export type PropertyMetric = {
  label: string;
  value: string;
  hint: string;
};

export type PropertyArea = {
  id: string;
  slug: string;
  name: string;
  city: string;
  marketNote: string;
  hero: string;
  averageRent: number;
  averageSale: number;
  hotspots: string[];
  trustNotes: string[];
};

export type PropertyAgent = {
  id: string;
  slug: string;
  name: string;
  label: string;
  phone: string;
  whatsapp: string | null;
  email: string;
  photoUrl: string;
  territories: string[];
  badges: string[];
  bio: string;
};

export type PropertyListing = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  kind: PropertyListingKind;
  serviceType: PropertyListingServiceType;
  intent: PropertyListingIntent;
  status: PropertyListingStatus;
  visibility: "public" | "private";
  locationSlug: string;
  locationLabel: string;
  district: string;
  addressLine: string;
  price: number;
  currency: string;
  priceInterval: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  parkingSpaces: number | null;
  furnished: boolean;
  petFriendly: boolean;
  shortletReady: boolean;
  managedByHenryCo: boolean;
  featured: boolean;
  promoted: boolean;
  heroImage: string;
  gallery: string[];
  floorPlanUrl: string | null;
  amenities: string[];
  trustBadges: string[];
  headlineMetrics: string[];
  verificationNotes: string[];
  riskScore: number;
  riskFlags: string[];
  policyVersion: string;
  policySummary: string | null;
  pricingRuleBookKey: string | null;
  pricingRuleVersion: string | null;
  feeBreakdown: {
    currency: string;
    lines: Array<{
      code: string;
      label: string;
      amount: number;
    }>;
    total: number;
  } | null;
  availableFrom: string | null;
  availableNow: boolean;
  ownerUserId: string | null;
  normalizedEmail: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  agentId: string | null;
  listedAt: string;
  updatedAt: string;
};

export type PropertyListingInspectionStatus =
  | "requested"
  | "scheduled"
  | "completed"
  | "waived"
  | "failed"
  | "cancelled";

export type PropertyListingInspection = {
  id: string;
  listingId: string;
  requestedByUserId: string | null;
  status: PropertyListingInspectionStatus;
  reason: string;
  scheduledFor: string | null;
  assignedAgentId: string | null;
  locationNotes: string | null;
  outcomeNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PropertyPolicyEvent = {
  id: string;
  listingId: string;
  actorUserId: string | null;
  actorRole: "system" | "owner" | "staff";
  eventType:
    | "policy_evaluated"
    | "status_transition"
    | "inspection_created"
    | "inspection_updated"
    | "override_applied"
    | "risk_flag_added"
    | "risk_flag_removed";
  fromStatus: PropertyListingStatus | null;
  toStatus: PropertyListingStatus | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type PropertyInquiry = {
  id: string;
  listingId: string;
  userId: string | null;
  normalizedEmail: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: PropertyInquiryStatus;
  assignedAgentId: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type PropertyViewingRequest = {
  id: string;
  listingId: string;
  inquiryId: string | null;
  userId: string | null;
  normalizedEmail: string | null;
  attendeeName: string;
  attendeePhone: string | null;
  attendeeEmail: string;
  preferredDate: string;
  backupDate: string | null;
  scheduledFor: string | null;
  reminderAt: string | null;
  /** V3 PASS 21 — reminder cycle (24h + 1h before scheduledFor). */
  reminder24hAt: string | null;
  reminder24hSentAt: string | null;
  reminder1hAt: string | null;
  reminder1hSentAt: string | null;
  /** V3 PASS 21 — confirmation event. */
  confirmedAt: string | null;
  /** V3 PASS 21 — waitlist position. `null` for scheduled/confirmed
   *  viewings; integer rank ≥1 for waitlisted viewings (rank 1 is
   *  next-in-line). */
  waitlistPosition: number | null;
  cancellationReason: string | null;
  notes: string;
  status: PropertyViewingStatus;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PropertyListingApplication = {
  id: string;
  listingId: string;
  userId: string | null;
  normalizedEmail: string | null;
  applicantName: string;
  companyName: string | null;
  phone: string | null;
  email: string;
  verificationDocs: Array<{
    name: string;
    url: string;
    kind: string;
  }>;
  submissionContext: Record<string, string> | null;
  status: "submitted" | "under_review" | "approved" | "rejected";
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PropertyManagedRecord = {
  id: string;
  title: string;
  serviceType: string;
  status: "active" | "pipeline" | "archived";
  ownerName: string;
  locationLabel: string;
  portfolioValue: number;
  serviceLines: string[];
  narrative: string;
  assignedManagerId: string | null;
  updatedAt: string;
};

export type PropertyFeaturedCampaign = {
  id: string;
  slug: string;
  surface: "hero" | "featured" | "managed" | "trust";
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  accent: string;
  listingIds: string[];
};

export type PropertyNotificationRecord = {
  id: string;
  entityType: string;
  entityId: string | null;
  channel: "email" | "whatsapp" | "in_app";
  templateKey: string;
  recipient: string;
  subject: string;
  status: PropertyNotificationStatus;
  reason: string | null;
  createdAt: string;
};

export type PropertyService = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
};

export type PropertyFaq = {
  id: string;
  question: string;
  answer: string;
};

export type PropertyDifferentiator = {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  difficulty: "medium" | "high" | "very_high";
  innovationScore: number;
};

export type PropertySavedListing = {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
};

export type PropertySavedSearchCadence = "instant" | "daily" | "weekly" | "off";

export type PropertySavedSearchCriteria = {
  q?: string | null;
  kind?: string | null;
  area?: string | null;
  managed?: "1" | null;
  furnished?: "1" | null;
  minBeds?: number | null;
  maxBeds?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  verifiedOnly?: boolean | null;
};

export type PropertySavedSearch = {
  id: string;
  userId: string;
  normalizedEmail: string | null;
  name: string;
  criteria: PropertySavedSearchCriteria;
  alertCadence: PropertySavedSearchCadence;
  lastAlertAt: string | null;
  lastAlertCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PropertyRentPaymentStatus =
  | "scheduled"
  | "invoiced"
  | "collected"
  | "overdue"
  | "waived"
  | "refunded";

export type PropertyRentPayment = {
  id: string;
  listingId: string;
  managedRecordId: string | null;
  ownerUserId: string | null;
  normalizedEmail: string | null;
  periodLabel: string;
  periodStartsAt: string;
  periodEndsAt: string;
  amountKobo: number;
  currency: string;
  status: PropertyRentPaymentStatus;
  collectedAt: string | null;
  notes: string;
  externalReference: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PropertyMaintenanceTicketStatus =
  | "open"
  | "triaged"
  | "in_progress"
  | "scheduled"
  | "completed"
  | "closed"
  | "cancelled";

export type PropertyMaintenanceTicketCategory =
  | "plumbing"
  | "electrical"
  | "hvac"
  | "pest"
  | "structural"
  | "security"
  | "appliance"
  | "general";

export type PropertyMaintenanceTicketSeverity = "low" | "medium" | "high" | "critical";

export type PropertyMaintenanceTicket = {
  id: string;
  listingId: string;
  managedRecordId: string | null;
  reportedByUserId: string | null;
  normalizedEmail: string | null;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string | null;
  category: PropertyMaintenanceTicketCategory;
  severity: PropertyMaintenanceTicketSeverity;
  summary: string;
  body: string;
  status: PropertyMaintenanceTicketStatus;
  attachments: Array<{ name: string; url: string; kind?: string }>;
  scheduledFor: string | null;
  resolvedAt: string | null;
  assignedAgentId: string | null;
  resolutionNotes: string;
  slaDueAt: string | null;
  slaBreach: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PropertySnapshot = {
  metrics: PropertyMetric[];
  areas: PropertyArea[];
  agents: PropertyAgent[];
  listings: PropertyListing[];
  inquiries: PropertyInquiry[];
  viewingRequests: PropertyViewingRequest[];
  applications: PropertyListingApplication[];
  inspections: PropertyListingInspection[];
  policyEvents: PropertyPolicyEvent[];
  managedRecords: PropertyManagedRecord[];
  campaigns: PropertyFeaturedCampaign[];
  notifications: PropertyNotificationRecord[];
  savedListings: PropertySavedListing[];
  savedSearches: PropertySavedSearch[];
  rentPayments: PropertyRentPayment[];
  maintenanceTickets: PropertyMaintenanceTicket[];
  services: PropertyService[];
  faqs: PropertyFaq[];
  differentiators: PropertyDifferentiator[];
};
