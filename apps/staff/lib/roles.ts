import "server-only";

import { DIVISION_ROLE_CATALOG } from "@/lib/types";
import type {
  DivisionRole,
  PlatformRoleFamily,
  WorkspaceDivision,
  WorkspacePermission,
  WorkspaceViewer,
} from "@/lib/types";

export const PERMISSIONS_BY_FAMILY: Record<PlatformRoleFamily, WorkspacePermission[]> = {
  division_manager: [
    "workspace.view",
    "overview.view",
    "tasks.view",
    "inbox.view",
    "approvals.view",
    "queues.view",
    "archive.view",
    "reports.view",
    "settings.view",
    "division.read",
    "division.write",
    "division.approve",
  ],
  operations_staff: [
    "workspace.view",
    "overview.view",
    "tasks.view",
    "inbox.view",
    "queues.view",
    "archive.view",
    "settings.view",
    "division.read",
  ],
  support_staff: [
    "workspace.view",
    "overview.view",
    "tasks.view",
    "inbox.view",
    "queues.view",
    "archive.view",
    "settings.view",
    "division.read",
  ],
  finance_staff: [
    "workspace.view",
    "overview.view",
    "tasks.view",
    "inbox.view",
    "approvals.view",
    "queues.view",
    "archive.view",
    "reports.view",
    "settings.view",
    "division.read",
    "division.finance",
  ],
  moderation_staff: [
    "workspace.view",
    "overview.view",
    "tasks.view",
    "inbox.view",
    "approvals.view",
    "queues.view",
    "archive.view",
    "settings.view",
    "division.read",
    "division.moderate",
  ],
  content_staff: [
    "workspace.view",
    "overview.view",
    "tasks.view",
    "inbox.view",
    "queues.view",
    "archive.view",
    "settings.view",
    "division.read",
    "division.write",
  ],
  analyst: [
    "workspace.view",
    "overview.view",
    "reports.view",
    "archive.view",
    "division.read",
  ],
  coordinator: [
    "workspace.view",
    "overview.view",
    "tasks.view",
    "inbox.view",
    "queues.view",
    "archive.view",
    "settings.view",
    "division.read",
  ],
  specialist: [
    "workspace.view",
    "overview.view",
    "tasks.view",
    "inbox.view",
    "queues.view",
    "archive.view",
    "division.read",
  ],
  supervisor: [
    "workspace.view",
    "overview.view",
    "tasks.view",
    "inbox.view",
    "approvals.view",
    "queues.view",
    "archive.view",
    "reports.view",
    "settings.view",
    "division.read",
    "division.approve",
  ],
  executive_viewer: [
    "workspace.view",
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
  ],
  system_admin: [
    "workspace.manage",
    "workspace.view",
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
  ],
};

export const SHARED_PROFILE_FAMILIES: Record<string, PlatformRoleFamily[]> = {
  owner: ["division_manager", "executive_viewer", "system_admin"],
  manager: ["division_manager", "supervisor"],
  support: ["support_staff", "coordinator"],
  staff: ["operations_staff", "specialist"],
  rider: ["operations_staff", "specialist"],
  finance: ["finance_staff"],
};

export const DEFAULT_HOME_DIVISIONS: Record<string, WorkspaceDivision[]> = {
  owner: ["care", "marketplace", "studio", "jobs", "property", "learn", "logistics"],
  manager: ["care", "marketplace", "studio", "jobs", "property", "learn", "logistics"],
  support: ["care", "marketplace", "jobs", "property", "learn"],
  staff: ["care", "property", "learn"],
  rider: ["care", "logistics"],
  finance: ["care", "marketplace", "studio", "logistics"],
};

const DEFAULT_DIVISION_ROLES_BY_PROFILE: Record<
  string,
  Partial<Record<WorkspaceDivision, DivisionRole[]>>
> = {
  owner: {
    care: ["care_manager", "care_finance", "care_ops"],
    marketplace: [
      "marketplace_admin",
      "marketplace_ops",
      "marketplace_finance",
      "marketplace_moderator",
    ],
    studio: [
      "sales_consultant",
      "project_manager",
      "studio_finance",
      "delivery_coordinator",
    ],
    jobs: [
      "recruiter",
      "employer_success",
      "internal_recruitment_coordinator",
      "jobs_moderator",
    ],
    property: [
      "listings_manager",
      "viewing_coordinator",
      "managed_property_ops",
      "agent_relationship_manager",
    ],
    learn: ["academy_admin", "content_manager", "certification_manager", "academy_ops"],
    logistics: ["dispatcher", "fleet_ops", "logistics_finance", "shipment_coordinator"],
  },
  manager: {
    care: ["care_manager", "care_ops"],
    marketplace: ["marketplace_ops", "catalog_manager", "seller_success"],
    studio: ["project_manager", "delivery_coordinator"],
    jobs: ["recruiter", "employer_success"],
    property: ["listings_manager", "viewing_coordinator", "agent_relationship_manager"],
    learn: ["academy_admin", "academy_ops"],
    logistics: ["dispatcher", "fleet_ops", "shipment_coordinator"],
  },
  support: {
    care: ["care_support"],
    marketplace: ["marketplace_support"],
    studio: ["client_success"],
    jobs: ["jobs_support", "talent_success"],
    property: ["property_support"],
    learn: ["learner_support"],
    logistics: ["logistics_support"],
  },
  staff: {
    care: ["service_staff"],
    marketplace: ["marketplace_ops", "catalog_manager"],
    studio: ["delivery_coordinator"],
    jobs: ["internal_recruitment_coordinator"],
    property: ["viewing_coordinator"],
    learn: ["academy_ops"],
    logistics: ["shipment_coordinator"],
  },
  rider: {
    care: ["care_rider"],
    logistics: ["driver"],
  },
  finance: {
    care: ["care_finance"],
    marketplace: ["marketplace_finance"],
    studio: ["studio_finance"],
    logistics: ["logistics_finance"],
  },
};

const FAMILIES_BY_DIVISION_ROLE: Record<DivisionRole, PlatformRoleFamily[]> = {
  care_manager: ["division_manager", "supervisor"],
  care_support: ["support_staff", "coordinator"],
  care_rider: ["operations_staff", "specialist"],
  service_staff: ["operations_staff", "specialist"],
  care_finance: ["finance_staff", "analyst"],
  care_ops: ["operations_staff", "coordinator"],
  marketplace_admin: ["division_manager", "system_admin"],
  marketplace_support: ["support_staff", "coordinator"],
  marketplace_moderator: ["moderation_staff", "supervisor"],
  marketplace_ops: ["operations_staff", "coordinator"],
  marketplace_finance: ["finance_staff", "analyst"],
  seller_success: ["support_staff", "specialist"],
  catalog_manager: ["content_staff", "operations_staff"],
  campaign_manager: ["content_staff", "analyst"],
  sales_consultant: ["specialist", "coordinator"],
  project_manager: ["division_manager", "supervisor"],
  developer: ["specialist", "content_staff"],
  designer: ["specialist", "content_staff"],
  client_success: ["support_staff", "coordinator"],
  studio_finance: ["finance_staff", "analyst"],
  delivery_coordinator: ["operations_staff", "coordinator"],
  recruiter: ["specialist", "coordinator"],
  employer_success: ["support_staff", "coordinator"],
  jobs_support: ["support_staff", "coordinator"],
  jobs_moderator: ["moderation_staff", "supervisor"],
  internal_recruitment_coordinator: ["operations_staff", "coordinator"],
  talent_success: ["support_staff", "specialist"],
  listings_manager: ["division_manager", "supervisor"],
  viewing_coordinator: ["operations_staff", "coordinator"],
  property_support: ["support_staff", "coordinator"],
  property_moderator: ["moderation_staff", "supervisor"],
  managed_property_ops: ["operations_staff", "coordinator"],
  agent_relationship_manager: ["support_staff", "specialist"],
  academy_admin: ["division_manager", "content_staff"],
  instructor: ["specialist", "content_staff"],
  content_manager: ["content_staff", "coordinator"],
  learner_support: ["support_staff", "coordinator"],
  certification_manager: ["moderation_staff", "analyst"],
  academy_ops: ["operations_staff", "coordinator"],
  dispatcher: ["operations_staff", "coordinator"],
  driver: ["operations_staff", "specialist"],
  logistics_support: ["support_staff", "coordinator"],
  fleet_ops: ["operations_staff", "supervisor"],
  logistics_finance: ["finance_staff", "analyst"],
  shipment_coordinator: ["operations_staff", "coordinator"],
};

const LEGACY_DIVISION_ROLE_MAP: Record<
  WorkspaceDivision,
  Record<string, DivisionRole[]>
> = {
  care: {
    owner: ["care_manager", "care_finance", "care_ops"],
    manager: ["care_manager", "care_ops"],
    support: ["care_support"],
    staff: ["service_staff"],
    rider: ["care_rider"],
    finance: ["care_finance"],
  },
  marketplace: {
    marketplace_owner: ["marketplace_admin", "marketplace_ops"],
    marketplace_admin: ["marketplace_admin"],
    support: ["marketplace_support"],
    moderation: ["marketplace_moderator"],
    finance: ["marketplace_finance"],
    operations: ["marketplace_ops"],
    seller_success: ["seller_success"],
  },
  studio: {
    studio_owner: ["project_manager", "studio_finance", "delivery_coordinator"],
    sales_consultation: ["sales_consultant"],
    project_manager: ["project_manager"],
    developer_designer: ["developer", "designer"],
    client_success: ["client_success"],
    finance: ["studio_finance"],
  },
  jobs: {
    owner: ["recruiter", "jobs_moderator", "internal_recruitment_coordinator"],
    admin: ["recruiter", "employer_success"],
    recruiter: ["recruiter"],
    moderator: ["jobs_moderator"],
    support: ["jobs_support"],
  },
  property: {
    property_owner: ["listings_manager"],
    listing_manager: ["listings_manager"],
    relationship_manager: ["agent_relationship_manager", "viewing_coordinator"],
    moderation: ["property_moderator"],
    support: ["property_support"],
    managed_ops: ["managed_property_ops"],
    property_admin: ["listings_manager", "managed_property_ops"],
  },
  learn: {
    academy_owner: ["academy_admin", "certification_manager", "academy_ops"],
    academy_admin: ["academy_admin", "academy_ops"],
    instructor: ["instructor"],
    content_manager: ["content_manager"],
    support: ["learner_support"],
    finance: ["certification_manager"],
    internal_manager: ["academy_ops"],
  },
  logistics: {
    logistics_owner: ["dispatcher", "fleet_ops", "logistics_finance"],
    dispatch_manager: ["dispatcher", "fleet_ops"],
    dispatch_admin: ["shipment_coordinator"],
    rider: ["driver"],
    support: ["logistics_support"],
    finance_ops: ["logistics_finance"],
  },
};

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

export function isInternalProfileRole(profileRole: string | null | undefined) {
  return Object.prototype.hasOwnProperty.call(
    SHARED_PROFILE_FAMILIES,
    String(profileRole || "").trim().toLowerCase()
  );
}

export function getProfileFamilies(profileRole: string | null | undefined) {
  return unique(
    SHARED_PROFILE_FAMILIES[String(profileRole || "").trim().toLowerCase()] ?? []
  );
}

export function getDefaultVisibleDivisions(profileRole: string | null | undefined) {
  return unique(
    DEFAULT_HOME_DIVISIONS[String(profileRole || "").trim().toLowerCase()] ?? []
  );
}

export function getFallbackDivisionRoles(
  profileRole: string | null | undefined,
  division: WorkspaceDivision
) {
  return unique(
    DEFAULT_DIVISION_ROLES_BY_PROFILE[String(profileRole || "").trim().toLowerCase()]?.[division] ?? []
  );
}

export function normalizeLegacyDivisionRoles(
  division: WorkspaceDivision,
  rawRole: string | null | undefined
) {
  const normalized = String(rawRole || "").trim().toLowerCase();
  const directRoles = DIVISION_ROLE_CATALOG[division] as readonly string[];

  if (directRoles.includes(normalized)) {
    return [normalized as DivisionRole];
  }

  return unique(
    LEGACY_DIVISION_ROLE_MAP[division][normalized] ?? []
  );
}

export function getFamiliesForDivisionRoles(roles: DivisionRole[]) {
  return unique(roles.flatMap((role) => FAMILIES_BY_DIVISION_ROLE[role] ?? []));
}

export function getPermissionsForFamilies(families: PlatformRoleFamily[]) {
  return unique(families.flatMap((family) => PERMISSIONS_BY_FAMILY[family] ?? []));
}

export function viewerHasPermission(
  viewer: Pick<WorkspaceViewer, "permissions">,
  permission: WorkspacePermission
) {
  return viewer.permissions.includes(permission);
}
