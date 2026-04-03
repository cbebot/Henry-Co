export const WORKSPACE_DIVISIONS = [
  "care",
  "marketplace",
  "studio",
  "jobs",
  "property",
  "learn",
  "logistics",
] as const;

export type WorkspaceDivision = (typeof WORKSPACE_DIVISIONS)[number];

export const PLATFORM_ROLE_FAMILIES = [
  "division_manager",
  "operations_staff",
  "support_staff",
  "finance_staff",
  "moderation_staff",
  "content_staff",
  "analyst",
  "coordinator",
  "specialist",
  "supervisor",
  "executive_viewer",
  "system_admin",
] as const;

export type PlatformRoleFamily = (typeof PLATFORM_ROLE_FAMILIES)[number];

export const DIVISION_ROLE_CATALOG = {
  care: [
    "care_manager",
    "care_support",
    "care_rider",
    "service_staff",
    "care_finance",
    "care_ops",
  ],
  marketplace: [
    "marketplace_admin",
    "marketplace_support",
    "marketplace_moderator",
    "marketplace_ops",
    "marketplace_finance",
    "seller_success",
    "catalog_manager",
    "campaign_manager",
  ],
  studio: [
    "sales_consultant",
    "project_manager",
    "developer",
    "designer",
    "client_success",
    "studio_finance",
    "delivery_coordinator",
  ],
  jobs: [
    "recruiter",
    "employer_success",
    "jobs_support",
    "jobs_moderator",
    "internal_recruitment_coordinator",
    "talent_success",
  ],
  property: [
    "listings_manager",
    "viewing_coordinator",
    "property_support",
    "property_moderator",
    "managed_property_ops",
    "agent_relationship_manager",
  ],
  learn: [
    "academy_admin",
    "instructor",
    "content_manager",
    "learner_support",
    "certification_manager",
    "academy_ops",
  ],
  logistics: [
    "dispatcher",
    "driver",
    "logistics_support",
    "fleet_ops",
    "logistics_finance",
    "shipment_coordinator",
  ],
} as const;

export type DivisionRole =
  (typeof DIVISION_ROLE_CATALOG)[keyof typeof DIVISION_ROLE_CATALOG][number];

export const WORKSPACE_PERMISSIONS = [
  "workspace.view",
  "workspace.manage",
  "overview.view",
  "tasks.view",
  "inbox.view",
  "approvals.view",
  "queues.view",
  "archive.view",
  "reports.view",
  "settings.view",
  "staff.directory.view",
  "division.read",
  "division.write",
  "division.approve",
  "division.finance",
  "division.moderate",
] as const;

export type WorkspacePermission = (typeof WORKSPACE_PERMISSIONS)[number];

export type WorkspaceUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  normalizedEmail: string | null;
  profileRole: string | null;
};

export type WorkspaceDivisionMembership = {
  division: WorkspaceDivision;
  roles: DivisionRole[];
  families: PlatformRoleFamily[];
  source: "explicit" | "fallback" | "activity";
  scopeType: string;
  scopeId: string | null;
  readiness: "live" | "partial" | "planned";
};

export type WorkspaceViewer = {
  user: WorkspaceUser | null;
  families: PlatformRoleFamily[];
  permissions: WorkspacePermission[];
  divisions: WorkspaceDivisionMembership[];
  defaultDivision: WorkspaceDivision | null;
};

export type WorkspaceMetric = {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "info" | "warning" | "critical" | "success";
};

export type WorkspaceTask = {
  id: string;
  division: WorkspaceDivision;
  title: string;
  summary: string;
  queue: string;
  href: string;
  status: "new" | "active" | "stale" | "at_risk" | "blocked" | "resolved";
  priority: number;
  ownerLabel?: string | null;
  dueLabel?: string | null;
  suggestedAction: string;
  evidence: string[];
  createdAt: string;
};

export type WorkspaceInboxItem = {
  id: string;
  division: WorkspaceDivision;
  kind: "notification" | "thread";
  title: string;
  summary: string;
  href: string;
  priority: "low" | "normal" | "high" | "critical";
  unread: boolean;
  createdAt: string;
};

export type WorkspaceQueueLane = {
  id: string;
  title: string;
  description: string;
  tone: "info" | "warning" | "critical" | "success";
  items: WorkspaceTask[];
};

export type WorkspaceInsight = {
  id: string;
  title: string;
  summary: string;
  tone: "info" | "warning" | "critical" | "success";
  evidence: string[];
  href?: string | null;
};

export type WorkspaceTrend = {
  label: string;
  current: number;
  previous: number;
  delta: number;
};

export type DivisionWorkspaceModule = {
  division: WorkspaceDivision;
  label: string;
  tagline: string;
  description: string;
  readiness: "live" | "partial" | "planned";
  sourceMode: "structured" | "shared-signals" | "planned";
  sourceSummary: string;
  roles: DivisionRole[];
  metrics: WorkspaceMetric[];
  tasks: WorkspaceTask[];
  approvals: WorkspaceTask[];
  queueLanes: WorkspaceQueueLane[];
  insights: WorkspaceInsight[];
  externalUrl: string;
};

export type WorkspaceSnapshot = {
  generatedAt: string;
  summaryMetrics: WorkspaceMetric[];
  modules: DivisionWorkspaceModule[];
  tasks: WorkspaceTask[];
  approvals: WorkspaceTask[];
  inbox: WorkspaceInboxItem[];
  insights: WorkspaceInsight[];
  trends: WorkspaceTrend[];
  history: WorkspaceTask[];
};

export type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: number;
};

export type WorkspaceNavSection = {
  label: string;
  items: WorkspaceNavItem[];
};
