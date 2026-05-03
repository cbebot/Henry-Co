export type StudioServiceKind =
  | "website"
  | "mobile_app"
  | "ui_ux"
  | "branding"
  | "ecommerce"
  | "internal_system"
  | "custom_software";

export type StudioService = {
  id: string;
  slug?: string;
  kind: StudioServiceKind;
  name: string;
  headline: string;
  summary: string;
  startingPrice: number;
  deliveryWindow: string;
  stack: string[];
  isPublished?: boolean;
  outcomes: string[];
  scoreBoosts: string[];
};

export type StudioPackage = {
  id: string;
  slug?: string;
  serviceId: string;
  name: string;
  summary: string;
  price: number;
  depositRate: number;
  timelineWeeks: number;
  bestFor: string;
  includes: string[];
  isPublished?: boolean;
};

export type StudioTeamProfile = {
  id: string;
  slug?: string;
  name: string;
  label: string;
  summary: string;
  availability: "open" | "limited" | "waitlist";
  focus: string[];
  industries: string[];
  stack: string[];
  highlights: string[];
  scoreBiases: string[];
  isPublished?: boolean;
};

export type StudioCaseStudy = {
  id: string;
  name: string;
  type: string;
  challenge: string;
  impact: string;
  metrics: string[];
};

/**
 * Ready-made studio website. Distinct from packages and services — these are
 * pre-built, production-ready sites HenryCo Studio owns and ships to clients
 * with a customisation pass. Listed on /pick and detailed at /pick/[slug].
 */
export type StudioTemplate = {
  id: string;
  slug: string;
  name: string;
  category: string;
  /** Service this maps to so the request flow can prefill the right lane. */
  serviceKind: StudioServiceKind;
  /** Maps to a `projectTypes` label inside StudioRequestConfig. */
  projectTypeLabel: string;
  audience: string;
  tagline: string;
  summary: string;
  /** Real, ready-to-quote price in NGN. */
  price: number;
  /** Standard package this template anchors to (for downstream proposal). */
  packageId?: string;
  depositRate: number;
  timelineWeeks: number;
  readyInDays: number;
  pages: string[];
  features: string[];
  stack: string[];
  outcomes: string[];
  /** Two CSS color stops used to render the gradient hero preview. */
  preview: {
    from: string;
    to: string;
    accent: string;
  };
  /** Optional live-demo URL (kept null when not yet hosted). */
  demoUrl?: string | null;
};

/**
 * HenryCo Studio leadership profile. Surfaced on /teams alongside the four
 * delivery pods. Studio purposely does not publish individual operator
 * headshots for the four delivery teams (Orbit / Axis / Nova / Vector) —
 * but the leadership panel is named so prospects know who's accountable.
 */
export type StudioLeader = {
  id: string;
  name: string;
  role: string;
  bio: string;
  focus: string[];
};

export type StudioFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type StudioTestimonial = {
  id: string;
  name: string;
  quote: string;
  company?: string | null;
};

export type StudioValueComparison = {
  title: string;
  points: string[];
};

export type StudioDifferentiator = {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  difficulty: "medium" | "high" | "very_high";
  innovationScore: number;
};

export type StudioLeadStatus =
  | "new"
  | "qualified"
  | "proposal_ready"
  | "proposal_sent"
  | "won"
  | "lost";

export type StudioProposalStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

export type StudioProjectStatus =
  | "pending_deposit"
  | "onboarding"
  | "active"
  | "in_review"
  | "delivered"
  | "archived";

export type StudioPaymentStatus =
  | "requested"
  | "processing"
  | "paid"
  | "overdue"
  | "cancelled";

export type StudioMilestoneStatus =
  | "planned"
  | "in_progress"
  | "ready_for_review"
  | "approved";

export type StudioRevisionStatus = "open" | "in_progress" | "completed";

export type StudioLead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  normalizedEmail: string | null;
  customerName: string;
  companyName: string | null;
  phone: string | null;
  serviceKind: StudioServiceKind;
  status: StudioLeadStatus;
  readinessScore: number;
  businessType: string;
  budgetBand: string;
  urgency: string;
  requestedPackageId: string | null;
  preferredTeamId: string | null;
  matchedTeamId: string | null;
};

/** Captured at brief submit — advisory; final DNS / registrar handled in delivery */
export type StudioDomainIntent = {
  path: "new" | "have" | "later";
  desiredLabel: string;
  /** Optional second choice if the first choice is taken or uncertain */
  backupLabel?: string;
  checkedFqdn: string | null;
  checkStatus: string;
  suggestionsShown: string[];
  lookupMode: string;
  lastMessage: string | null;
};

export type StudioBrief = {
  id: string;
  leadId: string;
  createdAt: string;
  goals: string;
  scopeNotes: string;
  businessType: string;
  budgetBand: string;
  urgency: string;
  timeline: string;
  packageIntent: "package" | "custom";
  techPreferences: string[];
  requiredFeatures: string[];
  referenceFiles: string[];
  referenceLinks: string[];
  domainIntent: StudioDomainIntent | null;
};

export type StudioCustomRequest = {
  id: string;
  leadId: string;
  createdAt: string;
  projectType: string;
  platformPreference: string;
  designDirection: string;
  pageRequirements: string[];
  addonServices: string[];
  inspirationSummary: string;
};

export type StudioProposal = {
  id: string;
  leadId: string;
  createdAt: string;
  updatedAt: string;
  accessKey: string;
  status: StudioProposalStatus;
  title: string;
  summary: string;
  investment: number;
  depositAmount: number;
  currency: string;
  validUntil: string;
  teamId: string | null;
  serviceId: string;
  packageId: string | null;
  scopeBullets: string[];
  milestones: Array<{
    id: string;
    name: string;
    amount: number;
    description: string;
    dueLabel: string;
  }>;
  comparisonNotes: string[];
};

export type StudioAssignment = {
  id: string;
  projectId: string;
  teamId: string;
  role: string;
  label: string;
};

export type StudioProjectMilestone = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueLabel: string;
  amount: number;
  status: StudioMilestoneStatus;
};

export type StudioProject = {
  id: string;
  proposalId: string;
  leadId: string;
  createdAt: string;
  updatedAt: string;
  accessKey: string;
  clientUserId: string | null;
  normalizedEmail: string | null;
  status: StudioProjectStatus;
  title: string;
  summary: string;
  nextAction: string;
  serviceId: string;
  packageId: string | null;
  teamId: string | null;
  confidence: number;
  assignments: StudioAssignment[];
  milestones: StudioProjectMilestone[];
};

export type StudioPayment = {
  id: string;
  projectId: string;
  milestoneId: string | null;
  createdAt: string;
  updatedAt: string;
  label: string;
  amount: number;
  currency: string;
  status: StudioPaymentStatus;
  dueDate: string | null;
  method: string;
  proofUrl: string | null;
  proofName: string | null;
};

export type StudioProjectFile = {
  id: string;
  projectId: string;
  leadId?: string | null;
  briefId?: string | null;
  createdAt: string;
  kind: "reference" | "proof" | "deliverable";
  label: string;
  path: string;
  bucket: string;
  size: number | null;
  mimeType?: string | null;
};

export type StudioDeliverable = {
  id: string;
  projectId: string;
  createdAt: string;
  label: string;
  summary: string;
  fileIds: string[];
  status: "shared" | "approved";
};

export type StudioRevision = {
  id: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  requestedBy: "client" | "team";
  summary: string;
  status: StudioRevisionStatus;
};

export type StudioProjectMessage = {
  id: string;
  projectId: string;
  createdAt: string;
  sender: string;
  senderRole: string;
  body: string;
  isInternal: boolean;
};

export type StudioNotification = {
  id: string;
  createdAt: string;
  entityId: string | null;
  channel: "email" | "whatsapp";
  templateKey: string;
  recipient: string;
  subject: string;
  status: "sent" | "queued" | "skipped" | "failed";
  reason: string | null;
};

export type StudioReview = {
  id: string;
  projectId: string;
  createdAt: string;
  customerName: string;
  rating: number;
  quote: string;
  company: string | null;
  published: boolean;
};

export type StudioProjectUpdate = {
  id: string;
  projectId: string;
  createdAt: string;
  kind: string;
  title: string;
  summary: string;
};

export type StudioRole =
  | "client"
  | "studio_owner"
  | "sales_consultation"
  | "project_manager"
  | "developer_designer"
  | "client_success"
  | "finance";

export type StudioRoleMembership = {
  id: string;
  role: StudioRole;
  scopeType: string;
  scopeId: string | null;
};

export type StudioViewer = {
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl?: string | null;
  } | null;
  normalizedEmail: string | null;
  roles: StudioRole[];
  memberships?: StudioRoleMembership[];
};

export type StudioSupportThread = {
  id: string;
  userId: string;
  subject: string;
  division: string | null;
  category: string;
  status: string;
  priority: string;
  referenceType: string | null;
  referenceId: string | null;
  assignedTo: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudioSupportMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderType: string;
  body: string;
  attachments: Array<Record<string, unknown>>;
  createdAt: string;
};

export type StudioSnapshot = {
  leads: StudioLead[];
  briefs: StudioBrief[];
  customRequests?: StudioCustomRequest[];
  proposals: StudioProposal[];
  projects: StudioProject[];
  projectUpdates?: StudioProjectUpdate[];
  payments: StudioPayment[];
  files: StudioProjectFile[];
  deliverables: StudioDeliverable[];
  revisions: StudioRevision[];
  messages: StudioProjectMessage[];
  notifications: StudioNotification[];
  reviews: StudioReview[];
  supportThreads?: StudioSupportThread[];
  supportMessages?: StudioSupportMessage[];
};
