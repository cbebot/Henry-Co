/** Client-safe workforce catalog — do not import `owner-data` from client components. */

export type WorkforcePermissionOption = {
  key: string;
  label: string;
  description: string;
  group: string;
};

export const OWNER_DIVISION_SLUGS = [
  "care",
  "marketplace",
  "studio",
  "jobs",
  "property",
  "learn",
  "logistics",
] as const;

export type WorkforceRoleOption = {
  value: string;
  label: string;
  description: string;
  /** division: must pick a division; company: group-wide operational */
  scope: "division" | "company";
};

/** Controlled role keys for workforce — pair with division when scope is division */
export const WORKFORCE_ROLE_OPTIONS: WorkforceRoleOption[] = [
  {
    value: "staff",
    label: "Staff",
    description: "Day-to-day operational access for a single division.",
    scope: "division",
  },
  {
    value: "senior_staff",
    label: "Senior staff",
    description: "Experienced operators with broader access inside one division.",
    scope: "division",
  },
  {
    value: "manager",
    label: "Division manager",
    description: "Leads workflows and people for the selected division only.",
    scope: "division",
  },
  {
    value: "operations_lead",
    label: "Operations lead",
    description: "Cross-queue operations and recovery for the selected division.",
    scope: "division",
  },
  {
    value: "support",
    label: "Customer support",
    description: "Customer-facing support and case handling.",
    scope: "division",
  },
  {
    value: "recruiter",
    label: "Recruiter",
    description: "Hiring and candidate pipelines (typically Jobs).",
    scope: "division",
  },
  {
    value: "finance_lead",
    label: "Finance lead",
    description: "Payment verification and finance approvals.",
    scope: "company",
  },
  {
    value: "owner_delegate",
    label: "Owner delegate",
    description: "Company-wide authority delegated by ownership (use sparingly).",
    scope: "company",
  },
];

export const WORKFORCE_PERMISSION_OPTIONS: WorkforcePermissionOption[] = [
  {
    key: "owner.overview.read",
    label: "Executive Overview",
    description: "View company-wide KPIs, alerts, and executive digests.",
    group: "Command",
  },
  {
    key: "operations.manage",
    label: "Operations",
    description: "Work approval queues, stale workflows, and SLA recovery tasks.",
    group: "Operations",
  },
  {
    key: "finance.approve",
    label: "Finance Approvals",
    description: "Review payouts, payment verification, invoices, and expense pressure.",
    group: "Finance",
  },
  {
    key: "staff.manage",
    label: "Workforce Admin",
    description: "Create staff, update roles, reassign divisions, and manage access.",
    group: "Workforce",
  },
  {
    key: "messaging.monitor",
    label: "Messaging Health",
    description: "Inspect delivery failures, retry queues, and owner alert posture.",
    group: "Messaging",
  },
  {
    key: "brand.manage",
    label: "Brand Control",
    description: "Update company identity, subdomains, logos, and content blocks.",
    group: "Brand",
  },
  {
    key: "security.audit",
    label: "Security Audit",
    description: "View audit history, privilege changes, and sensitive system activity.",
    group: "Security",
  },
];

export type WorkforceMember = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  division: string | null;
  permissions: string[];
  status: "active" | "pending" | "suspended";
  onboarding: "live" | "confirmed" | "invited";
  createdAt: string | null;
  lastSeen: string | null;
  isOwner: boolean;
  isManager: boolean;
};
