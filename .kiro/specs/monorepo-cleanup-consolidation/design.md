# Design Document: Monorepo Cleanup and Consolidation

## Overview

This design document provides a comprehensive, production-safe plan for cleaning up and consolidating the HenryCo monorepo. The monorepo contains 13 applications and 4 shared packages with accumulated technical debt including duplicate auth implementations, inconsistent patterns, stale files, and weak abstractions.

The cleanup prioritizes production safety above all else, with explicit risk classifications, phased execution, and clear rollback strategies. This is NOT a random redesign—it preserves strong existing implementations while refining promising patterns and removing clearly weak, duplicated, or harmful code.

### Key Principles

1. **Production Safety First**: Every change must be validated before deployment
2. **Preserve Strong Implementations**: Keep what works well
3. **Refine Promising Patterns**: Improve what shows potential
4. **Remove Clear Problems**: Eliminate duplicates, conflicts, and dead code
5. **Explicit Risk Management**: Clear classification of every change
6. **Phased Execution**: Start with safest, highest-value changes

### Current State Summary

**Applications (13)**:
- Division apps: care, marketplace, studio, jobs, property, learn, logistics
- Platform apps: account, hub, staff
- Mobile apps: company-hub, super-app
- Legacy: apps/apps/hub (duplicate)

**Shared Packages (4)**:
- @henryco/config: Company config, identity utils, URL helpers
- @henryco/ui: Shared UI components
- @henryco/i18n: Internationalization
- @henryco/brand: Brand assets

**Key Technical Debt Areas**:
- 3 different requireRoles implementations (care, property, staff)
- Duplicate navigation patterns across 5+ apps
- Inconsistent proxy.ts implementations
- Missing authentication on some admin routes
- No centralized auth package
- Stale .env files and temporary directories
- Duplicate identity normalization logic



## Architecture

### Repository Map

```
HenryCo Monorepo
├── apps/
│   ├── Division Apps (Customer-Facing)
│   │   ├── care/          → care.henrycogroup.com
│   │   ├── marketplace/   → marketplace.henrycogroup.com
│   │   ├── studio/        → studio.henrycogroup.com
│   │   ├── jobs/          → jobs.henrycogroup.com
│   │   ├── property/      → property.henrycogroup.com
│   │   ├── learn/         → learn.henrycogroup.com
│   │   └── logistics/     → logistics.henrycogroup.com
│   │
│   ├── Platform Apps (Internal/Shared)
│   │   ├── account/       → account.henrycogroup.com (shared auth/profile)
│   │   ├── hub/           → henrycogroup.com (group directory)
│   │   └── staff/         → staffhq.henrycogroup.com (unified staff platform)
│   │
│   ├── Mobile Apps
│   │   ├── company-hub/   → React Native (Expo)
│   │   └── super-app/     → React Native (Expo)
│   │
│   └── Legacy/Duplicate
│       └── apps/hub/      → DUPLICATE of hub/ (needs investigation)
│
└── packages/
    ├── @henryco/config    → Company config, identity, URLs
    ├── @henryco/ui        → Shared UI components
    ├── @henryco/i18n      → Internationalization
    └── @henryco/brand     → Brand assets
```

### Application Boundaries

**Public Surfaces** (Customer-Facing):
- Division apps serve public customers
- Each has public routes (/, /services, /pricing, etc.)
- Each has customer account integration via account.henrycogroup.com
- Authentication via shared Supabase with cross-domain cookies

**Internal Surfaces** (Staff-Facing):
- apps/staff: Unified staff platform (staffhq.henrycogroup.com)
- apps/hub: Owner HQ dashboard (hq.henrycogroup.com/owner)
- Division apps have retired staff routes (being migrated to apps/staff)

**Shared Platform**:
- apps/account: Shared authentication and profile management
- apps/hub: Group directory and discovery

### Authentication Boundaries

**Current State** (Fragmented):
```
apps/care/lib/auth/server.ts
  └── requireRoles(allowed: AppRole[])
  └── getAuthenticatedProfile()

apps/property/app/api/property/route.ts
  └── requireRoles(viewer, allowed: PropertyRole[])
  └── viewerHasRole(viewer, allowed)

apps/staff/lib/staff-auth.ts
  └── requireStaff() → WorkspaceViewer
  └── getStaffViewer()
```

**Target State** (Consolidated):
```
packages/auth/
  ├── src/
  │   ├── types.ts           → PlatformRole, WorkspacePermission
  │   ├── server.ts          → requireRoles, requireUser, getViewer
  │   ├── permissions.ts     → Permission checking utilities
  │   └── session.ts         → Session management
  └── package.json
```

### Routing Boundaries

**Subdomain Routing**:
- `henrycogroup.com` → apps/hub
- `account.henrycogroup.com` → apps/account
- `hq.henrycogroup.com` → apps/hub (owner dashboard)
- `staffhq.henrycogroup.com` → apps/staff
- `{division}.henrycogroup.com` → apps/{division}

**Cross-App Navigation**:
- Shared cookie domain: `.henrycogroup.com`
- Cross-origin redirects via getAccountUrl, getStaffHqUrl helpers
- Return path tracking via proxy.ts headers

### Database Boundaries

**Shared Tables** (All Apps):
- `profiles` → User profiles
- `divisions` → Division registry
- `customer_activity` → Cross-division activity log
- `customer_notifications` → Cross-division notifications

**Division-Specific Tables**:
- `{division}_role_memberships` → Division staff roles
- `{division}_*` → Division-specific entities

**Workspace Tables** (Staff Platform):
- `workspace_staff_memberships` → Staff platform access
- `workspace_queue_items` → Shared task queues
- `workspace_*` → Staff platform entities



## Components and Interfaces

### 1. Cleanup Classification System

Every finding must be classified into one of these buckets:

#### KEEP
- Strong implementations that work well
- No changes needed
- Examples: @henryco/config identity utilities, apps/staff navigation system

#### KEEP WITH REFINEMENT
- Good implementations that need minor improvements
- Safe to enhance without breaking changes
- Examples: proxy.ts patterns (consolidate but keep structure)

#### REPLACE
- Weak implementations that should be replaced with better alternatives
- Requires careful migration path
- Examples: Duplicate requireRoles → consolidated @henryco/auth

#### REMOVE
- Dead code, stale files, clear duplicates
- Safe to delete after validation
- Examples: .tmp-* directories, unused .env files, StaffSurfaceRetired component

#### DEFER
- Risky changes that need more investigation
- Not safe for initial cleanup phases
- Examples: apps/apps/hub duplicate (needs investigation)

### 2. Auth Consolidation Package

**Package**: `@henryco/auth`

**Exports**:
```typescript
// Types
export type PlatformRole = 
  | "customer" 
  | "owner" 
  | "manager" 
  | "support" 
  | "staff" 
  | "rider" 
  | "finance";

export type DivisionRole = 
  | "care_manager" 
  | "care_support" 
  | "marketplace_admin" 
  | "property_admin"
  | /* ... all division roles */;

export type WorkspacePermission = 
  | "workspace.view" 
  | "division.read" 
  | "division.write"
  | /* ... all permissions */;

export type AuthProfile = {
  id: string;
  full_name: string | null;
  role: PlatformRole;
  is_frozen: boolean;
  force_reauth_after: string | null;
  deleted_at: string | null;
};

export type AuthViewer = {
  user: User;
  profile: AuthProfile;
};

// Server-side utilities
export async function getViewer(): Promise<AuthViewer | null>;
export async function requireUser(): Promise<AuthViewer>;
export async function requireRoles(allowed: PlatformRole[]): Promise<AuthViewer>;
export async function requireDivisionRoles(
  division: string, 
  allowed: DivisionRole[]
): Promise<AuthViewer>;

// Permission checking
export function hasPermission(
  viewer: AuthViewer, 
  permission: WorkspacePermission
): boolean;
export function hasDivisionRole(
  viewer: AuthViewer, 
  division: string, 
  role: DivisionRole
): boolean;
```

**Migration Strategy**:
1. Create @henryco/auth package with canonical types
2. Implement getViewer, requireUser, requireRoles
3. Add backward compatibility layer for existing role types
4. Migrate apps one at a time (care → property → staff → others)
5. Remove duplicate implementations after all apps migrated

### 3. Navigation Consolidation

**Current State**:
- apps/staff/lib/navigation.ts: WorkspaceNavItem[] with permission filtering
- apps/studio/lib/studio/navigation.ts: Custom navigation structure
- apps/marketplace/lib/marketplace/navigation.ts: Custom navigation structure
- apps/logistics/lib/logistics/navigation.ts: Custom navigation structure
- apps/hub/lib/owner-navigation.ts: Owner HQ navigation

**Target State**:
```typescript
// @henryco/ui/navigation or new @henryco/navigation package

export type NavItem = {
  href: string;
  label: string;
  icon?: string;
  section?: string;
  requiredPermissions?: WorkspacePermission[];
  requiredDivisions?: WorkspaceDivision[];
  external?: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export function filterNavItems(
  items: NavItem[], 
  viewer: AuthViewer
): NavItem[];

export function groupNavSections(
  items: NavItem[]
): NavSection[];
```

**Consolidation Approach**:
- Extract common patterns from apps/staff/lib/navigation.ts
- Create shared utilities in @henryco/ui or new package
- Keep app-specific nav configs in each app
- Share filtering and grouping logic

### 4. Proxy Middleware Consolidation

**Current Pattern** (Repeated in 10+ apps):
```typescript
// apps/{app}/proxy.ts
export async function proxy(request: NextRequest) {
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("x-{app}-return-path", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  
  const cookieDomain = getSharedCookieDomain(
    reqHeaders.get("x-forwarded-host") || reqHeaders.get("host")
  );
  
  // ... cookie handling
  
  return NextResponse.next({
    request: { headers: reqHeaders }
  });
}
```

**Consolidation Strategy**:
- Keep proxy.ts in each app (Next.js requires it)
- Extract shared logic to @henryco/config/middleware
- Standardize header names and cookie handling
- Document the pattern for new apps

### 5. Identity Utilities (Already Strong)

**Classification**: KEEP

**Current Implementation** (@henryco/config/identity.ts):
- normalizeEmail(value) → Lowercase email normalization
- normalizePhone(value, options) → Phone number normalization
- phoneSearchVariants(value) → Generate search variants
- emailsMatch(left, right) → Email comparison
- phonesMatch(left, right) → Phone comparison
- resolveUserAvatarFromSources() → Avatar resolution
- isRecoverableSupabaseAuthError() → Error classification

**Status**: Well-implemented, widely used, no changes needed

### 6. URL Helpers (Already Strong)

**Classification**: KEEP

**Current Implementation** (@henryco/config/urls.ts):
- getDivisionUrl(key) → Division URL builder
- getAccountUrl(path) → Account URL builder
- getStaffHqUrl(path) → Staff HQ URL builder
- getHqUrl(path) → Owner HQ URL builder
- normalizeTrustedRedirect(next) → Safe redirect validation
- getSharedCookieDomain(hostname) → Cookie domain resolver

**Status**: Well-implemented, security-conscious, no changes needed



## Data Models

### Cleanup Classification Model

```typescript
type CleanupFinding = {
  id: string;
  category: CleanupCategory;
  classification: CleanupClassification;
  priority: CleanupPriority;
  risk: RiskLevel;
  title: string;
  description: string;
  currentState: string;
  targetState: string;
  rationale: string;
  affectedFiles: string[];
  affectedApps: string[];
  validationSteps: string[];
  rollbackPlan: string;
  estimatedEffort: "small" | "medium" | "large";
  deploymentImpact: "low" | "medium" | "high";
};

type CleanupCategory =
  | "auth"
  | "routing"
  | "navigation"
  | "database"
  | "ui"
  | "config"
  | "dead_code"
  | "security"
  | "performance"
  | "documentation";

type CleanupClassification =
  | "KEEP"
  | "KEEP_WITH_REFINEMENT"
  | "REPLACE"
  | "REMOVE"
  | "DEFER";

type CleanupPriority =
  | "P0_CRITICAL"      // Security issues, broken auth
  | "P1_HIGH"          // Major consolidations, high-value cleanup
  | "P2_MEDIUM"        // Nice-to-have improvements
  | "P3_LOW";          // Polish, minor cleanup

type RiskLevel =
  | "SAFE"             // No production impact, easy rollback
  | "LOW"              // Minimal risk, clear validation
  | "MEDIUM"           // Some risk, requires testing
  | "HIGH"             // Significant risk, needs careful execution
  | "CRITICAL";        // Do not touch without explicit approval
```

### Auth Consolidation Model

```typescript
// Canonical role types (to be in @henryco/auth)
type PlatformRole =
  | "customer"
  | "owner"
  | "manager"
  | "support"
  | "staff"
  | "rider"
  | "finance";

type DivisionRole =
  // Care
  | "care_manager"
  | "care_support"
  | "care_rider"
  | "service_staff"
  | "care_finance"
  | "care_ops"
  // Marketplace
  | "marketplace_admin"
  | "marketplace_support"
  | "marketplace_moderator"
  | "marketplace_ops"
  | "marketplace_finance"
  | "seller_success"
  | "catalog_manager"
  // Studio
  | "sales_consultant"
  | "project_manager"
  | "developer"
  | "designer"
  | "client_success"
  | "studio_finance"
  | "delivery_coordinator"
  // Jobs
  | "recruiter"
  | "employer_success"
  | "jobs_support"
  | "jobs_moderator"
  | "internal_recruitment_coordinator"
  | "talent_success"
  // Property
  | "listings_manager"
  | "viewing_coordinator"
  | "property_support"
  | "property_moderator"
  | "managed_property_ops"
  | "agent_relationship_manager"
  // Learn
  | "academy_admin"
  | "instructor"
  | "content_manager"
  | "learner_support"
  | "certification_manager"
  | "academy_ops"
  // Logistics
  | "dispatcher"
  | "driver"
  | "logistics_support"
  | "fleet_ops"
  | "logistics_finance"
  | "shipment_coordinator";

type WorkspacePermission =
  | "workspace.view"
  | "workspace.manage"
  | "overview.view"
  | "tasks.view"
  | "inbox.view"
  | "approvals.view"
  | "queues.view"
  | "archive.view"
  | "reports.view"
  | "settings.view"
  | "staff.directory.view"
  | "division.read"
  | "division.write"
  | "division.approve"
  | "division.finance"
  | "division.moderate";

// Migration mapping (for backward compatibility)
type LegacyRoleMapping = {
  app: string;
  legacyRole: string;
  canonicalRole: PlatformRole | DivisionRole;
};

const LEGACY_ROLE_MAPPINGS: LegacyRoleMapping[] = [
  // Care legacy mappings
  { app: "care", legacyRole: "owner", canonicalRole: "owner" },
  { app: "care", legacyRole: "manager", canonicalRole: "care_manager" },
  { app: "care", legacyRole: "support", canonicalRole: "care_support" },
  { app: "care", legacyRole: "staff", canonicalRole: "service_staff" },
  { app: "care", legacyRole: "rider", canonicalRole: "care_rider" },
  
  // Property legacy mappings
  { app: "property", legacyRole: "property_admin", canonicalRole: "listings_manager" },
  { app: "property", legacyRole: "listing_manager", canonicalRole: "listings_manager" },
  { app: "property", legacyRole: "relationship_manager", canonicalRole: "agent_relationship_manager" },
  { app: "property", legacyRole: "moderation", canonicalRole: "property_moderator" },
  { app: "property", legacyRole: "support", canonicalRole: "property_support" },
  { app: "property", legacyRole: "managed_ops", canonicalRole: "managed_property_ops" },
  
  // Add more as needed during migration
];
```

### Navigation Model

```typescript
type NavItem = {
  href: string;
  label: string;
  icon?: string;
  section?: string;
  requiredPermissions?: WorkspacePermission[];
  requiredDivisions?: WorkspaceDivision[];
  requiredRoles?: (PlatformRole | DivisionRole)[];
  external?: boolean;
  badge?: string | number;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

type NavConfig = {
  sections: NavSection[];
  footer?: NavItem[];
};
```

### Cleanup Execution Model

```typescript
type CleanupPhase = {
  id: string;
  name: string;
  description: string;
  findings: CleanupFinding[];
  dependencies: string[]; // IDs of phases that must complete first
  estimatedDuration: string;
  successCriteria: string[];
  rollbackPlan: string;
  owner?: string;
};

type CleanupExecution = {
  phaseId: string;
  findingId: string;
  status: "not_started" | "in_progress" | "completed" | "failed" | "rolled_back";
  startedAt?: string;
  completedAt?: string;
  validationResults?: ValidationResult[];
  notes?: string;
};

type ValidationResult = {
  check: string;
  passed: boolean;
  details?: string;
  timestamp: string;
};
```



## Cleanup Classification Buckets

### Safe Quick Wins (REMOVE - Low Risk)

These can be deleted immediately with minimal validation:

1. **Temporary Directories**
   - Classification: REMOVE
   - Risk: SAFE
   - Files: `.tmp-*`, `.codex-logs/*`
   - Validation: Verify not referenced in .gitignore or scripts
   - Impact: Zero production impact

2. **Stale Environment Files**
   - Classification: REMOVE
   - Risk: SAFE
   - Files: `.env.vercel.production.account`, `.env.vercel.production.hub`, `.env.pull.hub`
   - Validation: Check not used in deployment scripts
   - Impact: Zero production impact

3. **Build Artifacts**
   - Classification: REMOVE
   - Risk: SAFE
   - Files: `*.tsbuildinfo`, `.next/trace*`, build logs
   - Validation: Verify in .gitignore
   - Impact: Zero production impact

4. **Duplicate Package Directories**
   - Classification: INVESTIGATE → REMOVE or KEEP
   - Risk: MEDIUM
   - Files: `apps/packages/brand/` (duplicate of `packages/brand/`)
   - Validation: Check if symlink or actual duplicate
   - Impact: Could break imports if not handled correctly

5. **StaffSurfaceRetired Component**
   - Classification: REMOVE (after verifying no usage)
   - Risk: SAFE
   - Files: `packages/ui/src/staff-surface-retired.tsx`
   - Validation: Grep search shows no imports in apps
   - Impact: Zero production impact (already unused)

### Medium-Risk Consolidations (REPLACE)

These require careful migration but have clear benefits:

1. **Auth System Consolidation**
   - Classification: REPLACE
   - Risk: HIGH
   - Current: 3 different requireRoles implementations
   - Target: Single @henryco/auth package
   - Affected Apps: care, property, staff, (future: all apps)
   - Validation: Unit tests, integration tests, manual auth flow testing
   - Rollback: Keep old implementations until migration complete
   - Impact: HIGH - affects all authenticated routes

2. **Navigation Pattern Consolidation**
   - Classification: KEEP_WITH_REFINEMENT
   - Risk: MEDIUM
   - Current: Custom navigation in each app
   - Target: Shared utilities, app-specific configs
   - Affected Apps: staff, studio, marketplace, logistics, hub
   - Validation: Visual regression tests, navigation flow tests
   - Rollback: Revert to app-specific implementations
   - Impact: MEDIUM - affects UI but not functionality

3. **Proxy Middleware Standardization**
   - Classification: KEEP_WITH_REFINEMENT
   - Risk: LOW
   - Current: Similar but slightly different proxy.ts in each app
   - Target: Shared utilities, standardized patterns
   - Affected Apps: All Next.js apps (10+)
   - Validation: Test cookie handling, header forwarding
   - Rollback: Revert individual proxy.ts files
   - Impact: LOW - mostly code organization

4. **Database Migration Consolidation**
   - Classification: KEEP_WITH_REFINEMENT
   - Risk: MEDIUM
   - Current: Migrations scattered across apps/*/supabase/migrations
   - Target: Centralized migration tracking, clear ownership docs
   - Affected: All apps with Supabase
   - Validation: Migration history verification, schema comparison
   - Rollback: N/A (migrations are append-only)
   - Impact: MEDIUM - affects deployment process

### High-Risk Architecture Changes (DEFER or Careful Planning)

These need extensive planning and should not be rushed:

1. **apps/apps/hub Duplicate Investigation**
   - Classification: DEFER
   - Risk: CRITICAL
   - Issue: Duplicate hub directory structure
   - Action: Investigate purpose, check if symlink, determine if safe to remove
   - Impact: UNKNOWN - needs investigation first

2. **Retired Staff Routes Removal**
   - Classification: REPLACE (with redirects)
   - Risk: HIGH
   - Current: Retired staff routes in division apps
   - Target: Remove routes, add redirects to staffhq
   - Affected: care, jobs, marketplace, property, learn, studio, hub
   - Validation: Test all redirect paths, verify no broken links
   - Rollback: Restore route files
   - Impact: HIGH - affects staff workflows

3. **Shared UI Component Consolidation**
   - Classification: KEEP_WITH_REFINEMENT
   - Risk: MEDIUM
   - Current: Duplicate buttons, forms, modals across apps
   - Target: Consolidated @henryco/ui components
   - Affected: All apps
   - Validation: Visual regression tests, accessibility tests
   - Rollback: Revert to app-specific components
   - Impact: MEDIUM - affects UI consistency

4. **Type Safety Improvements**
   - Classification: KEEP_WITH_REFINEMENT
   - Risk: MEDIUM
   - Current: Inconsistent TypeScript configs, some `any` usage
   - Target: Strict TypeScript, shared types
   - Affected: All apps
   - Validation: Type checking, build verification
   - Rollback: Revert tsconfig changes
   - Impact: MEDIUM - may surface hidden bugs

### Do-Not-Touch-Yet Areas

These should be explicitly avoided in initial cleanup phases:

1. **Mobile Apps (company-hub, super-app)**
   - Reason: Different tech stack (React Native), separate concerns
   - Action: Defer to separate mobile cleanup initiative

2. **Production Database Schema Changes**
   - Reason: Requires careful migration planning, data backup
   - Action: Document schema issues, plan migrations separately

3. **Public-Facing UI Redesigns**
   - Reason: Not a cleanup task, requires product decisions
   - Action: Focus on code organization, not visual changes

4. **Build System Overhaul (Turborepo)**
   - Reason: Major infrastructure change, needs separate planning
   - Action: Document current build issues, plan separately

5. **Supabase RLS Policy Changes**
   - Reason: Security-critical, needs careful audit
   - Action: Document missing policies, plan security review



## Detailed Cleanup Areas

### 1. Auth/Session/Routing Correctness

#### Current State
- **3 different requireRoles implementations**:
  - `apps/care/lib/auth/server.ts`: requireRoles(allowed: AppRole[])
  - `apps/property/app/api/property/route.ts`: requireRoles(viewer, allowed: PropertyRole[])
  - `apps/staff/lib/staff-auth.ts`: requireStaff() → WorkspaceViewer
- **Inconsistent role types**: AppRole, PropertyRole, WorkspaceViewer
- **Duplicate session logic**: Each app implements getAuthenticatedProfile differently
- **Security gap**: apps/care/app/admin/page.tsx has auth but pattern not enforced everywhere

#### Target State
- Single @henryco/auth package with canonical types
- Consistent requireRoles, requireUser, getViewer across all apps
- Enforced authentication on all admin/staff routes
- Backward compatibility during migration

#### Why It Matters
- **Security**: Inconsistent auth = potential security gaps
- **Maintainability**: Changes must be made in 3+ places
- **Type Safety**: Different role types cause confusion

#### Risks
- **HIGH**: Breaking authentication breaks entire apps
- **Migration complexity**: Must maintain backward compatibility
- **Testing burden**: Must test auth flows in all apps

#### Affected Apps/Packages
- Apps: care, property, staff, (future: all apps)
- New package: @henryco/auth
- Shared: @henryco/config (for URL helpers)

#### Validation Steps
1. Create @henryco/auth package with types and utilities
2. Write unit tests for auth utilities
3. Migrate one app at a time (start with care)
4. Test authentication flows manually
5. Run integration tests
6. Deploy to staging, verify auth works
7. Deploy to production with monitoring

#### Rollback Considerations
- Keep old auth implementations until migration complete
- Feature flag for new auth system
- Can revert individual apps without affecting others
- Database/session format unchanged (no data migration needed)

---

### 2. Public vs Account vs HQ vs Staff HQ Boundary Clarity

#### Current State
- **Subdomain routing works** but not well-documented
- **Retired staff routes** still exist in division apps
- **Unclear boundaries** between Owner HQ (hq.*) and Staff HQ (staffhq.*)
- **Cross-app navigation** works but patterns inconsistent

#### Target State
- Clear documentation of subdomain boundaries
- Retired staff routes removed with redirects to staffhq
- Explicit routing rules documented
- Consistent cross-app navigation patterns

#### Why It Matters
- **User confusion**: Staff don't know where to go
- **Maintenance burden**: Maintaining retired routes
- **Navigation clarity**: Clear mental model of app boundaries

#### Risks
- **MEDIUM**: Removing routes could break bookmarks
- **Redirect complexity**: Must handle all edge cases
- **Documentation drift**: Docs must stay updated

#### Affected Apps/Packages
- Apps: care, jobs, marketplace, property, learn, studio, hub, staff
- Docs: architecture-summary.md, routing documentation

#### Validation Steps
1. Document current subdomain routing
2. Identify all retired staff routes
3. Create redirect mapping
4. Implement redirects in proxy.ts
5. Test all redirect paths
6. Update documentation
7. Remove retired route files

#### Rollback Considerations
- Redirects can be removed easily
- Route files can be restored from git
- No database changes required
- Low risk if redirects tested thoroughly

---

### 3. Shared Public Shell / Navigation / Identity Consistency

#### Current State
- **Navigation patterns** vary across apps
- **Identity utilities** are strong (@henryco/config/identity.ts)
- **Public shell** components not fully shared
- **Theme consistency** varies

#### Target State
- Shared navigation utilities (filtering, grouping)
- App-specific nav configs using shared utilities
- Consistent public shell components
- Documented theme system

#### Why It Matters
- **Consistency**: Users expect similar navigation across divisions
- **Maintainability**: Changes to nav patterns require updates in multiple places
- **Developer experience**: Clear patterns for adding new apps

#### Risks
- **LOW**: Mostly code organization, not functionality
- **Visual regression**: Must ensure UI doesn't break
- **Migration effort**: Each app needs updates

#### Affected Apps/Packages
- Apps: staff, studio, marketplace, logistics, hub
- Packages: @henryco/ui (or new @henryco/navigation)

#### Validation Steps
1. Extract common navigation patterns
2. Create shared utilities
3. Migrate one app at a time
4. Visual regression tests
5. Manual navigation testing
6. Document patterns

#### Rollback Considerations
- Can revert to app-specific implementations
- No data changes
- Low risk

---

### 4. Removal of Retired or Stale Staff Surfaces

#### Current State
- **StaffSurfaceRetired component** exists but unused
- **Retired staff routes** in multiple apps:
  - apps/care: /staff/* routes (retired)
  - apps/jobs: /recruiter/*, /moderation (retired)
  - apps/marketplace: /owner, /operations, /moderation (retired)
  - apps/property: /operations, /moderation, /owner (retired)
  - apps/learn: /owner/* (retired)
  - apps/studio: /owner (retired)
  - apps/hub: /workspace/* (retired)

#### Target State
- StaffSurfaceRetired component removed
- Retired routes removed
- Redirects to staffhq.henrycogroup.com
- Documentation updated

#### Why It Matters
- **Code cleanliness**: Remove confusing placeholder UI
- **User experience**: Clear redirects instead of "retired" messages
- **Maintenance**: No need to maintain dead routes

#### Risks
- **MEDIUM**: Staff may have bookmarks to old routes
- **Redirect complexity**: Must handle all paths correctly
- **Communication**: Staff need to know about changes

#### Affected Apps/Packages
- Apps: care, jobs, marketplace, property, learn, studio, hub
- Package: @henryco/ui (remove StaffSurfaceRetired)

#### Validation Steps
1. Verify StaffSurfaceRetired has no imports (already done)
2. Map all retired routes to new staffhq routes
3. Implement redirects
4. Test redirect paths
5. Remove route files
6. Remove StaffSurfaceRetired component
7. Update documentation
8. Communicate changes to staff

#### Rollback Considerations
- Route files can be restored
- Redirects can be removed
- Component can be restored
- Low risk with proper testing

---

### 5. Security Hardening and Role/Permission Correctness

#### Current State
- **Admin routes**: Some have auth (care/admin), pattern not enforced
- **API routes**: Inconsistent auth checking
- **RLS policies**: Not fully audited
- **Permission checking**: Inconsistent patterns

#### Target State
- All admin routes require authentication
- All API routes with sensitive operations require auth
- RLS policies audited and documented
- Consistent permission checking via @henryco/auth

#### Why It Matters
- **Security**: Unauthorized access is critical risk
- **Compliance**: Need audit trail of access controls
- **Trust**: Users expect secure systems

#### Risks
- **CRITICAL**: Security issues are highest priority
- **Breaking changes**: Adding auth may break existing flows
- **Testing complexity**: Must test all auth scenarios

#### Affected Apps/Packages
- Apps: All apps with admin/staff routes
- Package: @henryco/auth
- Database: RLS policies

#### Validation Steps
1. Audit all /admin routes for auth
2. Audit all API routes for auth
3. Add missing authentication
4. Audit RLS policies
5. Add missing RLS policies
6. Security testing
7. Penetration testing
8. Document security boundaries

#### Rollback Considerations
- Can remove auth checks if needed
- RLS policies can be dropped
- HIGH RISK - must be careful with security changes

---

### 6. Dead Code / Stale Files / Duplicate Abstractions

#### Current State
- **Temporary directories**: .tmp-*, .codex-logs
- **Stale .env files**: Multiple .env.vercel.* files
- **Build artifacts**: *.tsbuildinfo, .next/trace
- **Duplicate packages**: apps/packages/brand vs packages/brand
- **Unused components**: StaffSurfaceRetired
- **Commented code**: TODO/FIXME comments

#### Target State
- Temporary directories removed
- Stale .env files removed
- Build artifacts in .gitignore
- Duplicate packages resolved
- Unused components removed
- Commented code cleaned up

#### Why It Matters
- **Code cleanliness**: Easier to navigate codebase
- **Repository size**: Reduce unnecessary files
- **Developer experience**: Less confusion

#### Risks
- **SAFE**: Most dead code removal is low risk
- **Verification needed**: Must ensure truly unused
- **Git history**: Files can be restored if needed

#### Affected Apps/Packages
- All apps and packages

#### Validation Steps
1. Identify dead code with grep/ripgrep
2. Verify no imports/references
3. Remove files
4. Verify builds still pass
5. Verify tests still pass
6. Commit changes

#### Rollback Considerations
- Files can be restored from git
- Very low risk
- Easy to rollback

---

### 7. Build/Deploy Reliability

#### Current State
- **CI pipeline**: Runs lint, typecheck, test, build
- **Build times**: Not optimized
- **Caching**: No Turborepo or similar
- **Parallel execution**: Limited

#### Target State
- Faster CI pipeline
- Better caching strategy
- Parallel build execution
- Documented build process

#### Why It Matters
- **Developer productivity**: Faster feedback loops
- **CI costs**: Faster builds = lower costs
- **Deployment speed**: Faster deploys

#### Risks
- **MEDIUM**: Build system changes can break CI
- **Complexity**: Turborepo adds complexity
- **Migration effort**: Significant setup work

#### Affected Apps/Packages
- All apps
- Root package.json
- CI configuration

#### Validation Steps
1. Measure current build times
2. Evaluate Turborepo or similar
3. Implement caching strategy
4. Test CI pipeline
5. Measure improvements
6. Document build process

#### Rollback Considerations
- Can revert to old build scripts
- Medium risk
- Requires testing

---

### 8. Light/Dark Theme Correctness

#### Current State
- **Theme system**: Exists but not fully consistent
- **Color variables**: Defined per division
- **Dark mode**: Implemented in some apps

#### Target State
- Consistent theme system
- Documented color variables
- Dark mode working in all apps

#### Why It Matters
- **User experience**: Consistent theming
- **Brand consistency**: Proper color usage
- **Accessibility**: Dark mode support

#### Risks
- **LOW**: Mostly visual changes
- **Testing**: Visual regression tests needed

#### Affected Apps/Packages
- All apps
- @henryco/ui

#### Validation Steps
1. Audit theme implementations
2. Document color system
3. Fix inconsistencies
4. Visual regression tests
5. Manual testing

#### Rollback Considerations
- Can revert CSS changes
- Low risk

---

### 9. Button/Loading/Error State Consistency

#### Current State
- **Button components**: Some duplication
- **Loading states**: Inconsistent patterns
- **Error states**: Inconsistent patterns

#### Target State
- Shared button components in @henryco/ui
- Consistent loading patterns
- Consistent error patterns

#### Why It Matters
- **User experience**: Consistent interactions
- **Maintainability**: Single source of truth
- **Accessibility**: Consistent ARIA patterns

#### Risks
- **MEDIUM**: UI changes need careful testing
- **Visual regression**: Must ensure no breaks

#### Affected Apps/Packages
- All apps
- @henryco/ui

#### Validation Steps
1. Audit button/loading/error components
2. Consolidate into @henryco/ui
3. Migrate apps one at a time
4. Visual regression tests
5. Accessibility tests

#### Rollback Considerations
- Can revert to app-specific components
- Medium risk



## Prior AI Work Classification

### Authentication Implementations

**apps/care/lib/auth/server.ts**
- Classification: **REPLACE**
- Rationale: Well-implemented but should be consolidated into @henryco/auth
- Strengths: Good error handling, frozen account checks, force reauth logic
- Migration: Extract patterns into shared package, keep as reference

**apps/property/app/api/property/route.ts (requireRoles)**
- Classification: **REPLACE**
- Rationale: Inline implementation should use shared auth package
- Strengths: Simple role checking logic
- Migration: Replace with @henryco/auth after package created

**apps/staff/lib/staff-auth.ts**
- Classification: **KEEP WITH REFINEMENT**
- Rationale: Most sophisticated implementation, good model for shared package
- Strengths: Division memberships, permission system, activity-based access
- Migration: Use as primary reference for @henryco/auth design

### Navigation Implementations

**apps/staff/lib/navigation.ts**
- Classification: **KEEP WITH REFINEMENT**
- Rationale: Good pattern for permission-based filtering
- Strengths: Clean NavItem type, section grouping, permission filtering
- Migration: Extract utilities to shared package, keep config in app

**apps/studio/lib/studio/navigation.ts**
- Classification: **KEEP WITH REFINEMENT**
- Rationale: App-specific but could use shared utilities
- Migration: Refactor to use shared filtering/grouping utilities

**apps/marketplace/lib/marketplace/navigation.ts**
- Classification: **KEEP WITH REFINEMENT**
- Rationale: Similar to studio, could use shared utilities
- Migration: Refactor to use shared filtering/grouping utilities

### Identity Utilities

**packages/config/identity.ts**
- Classification: **KEEP**
- Rationale: Excellent implementation, widely used, no changes needed
- Strengths: Comprehensive normalization, error handling, avatar resolution
- Action: No changes, document as canonical implementation

**packages/config/urls.ts**
- Classification: **KEEP**
- Rationale: Security-conscious, well-tested, no changes needed
- Strengths: Trusted redirect validation, cookie domain handling
- Action: No changes, document as canonical implementation

### Proxy Middleware

**All apps/*/proxy.ts files**
- Classification: **KEEP WITH REFINEMENT**
- Rationale: Required by Next.js, but can standardize patterns
- Strengths: Cookie handling, header forwarding
- Migration: Extract shared logic to @henryco/config/middleware, keep files in apps

### UI Components

**packages/ui/src/staff-surface-retired.tsx**
- Classification: **REMOVE**
- Rationale: No longer used, safe to delete
- Action: Delete after final verification

**Other @henryco/ui components**
- Classification: **KEEP WITH REFINEMENT**
- Rationale: Good foundation, needs expansion
- Action: Add more shared components (buttons, forms, modals)

### Database Migrations

**apps/*/supabase/migrations/*.sql**
- Classification: **KEEP WITH REFINEMENT**
- Rationale: Migrations are correct, need better organization
- Action: Document ownership, create migration guidelines

### Configuration

**packages/config/company.ts**
- Classification: **KEEP**
- Rationale: Comprehensive division config, well-structured
- Action: No changes, document as canonical source



## Phased Execution Plan

### Phase 1: Safe High-Value Cleanup (Week 1)

**Goal**: Remove dead code and stale files with zero production risk

**Tasks**:
1. Remove temporary directories (.tmp-*, .codex-logs)
2. Remove stale .env files
3. Remove unused StaffSurfaceRetired component
4. Clean up build artifacts
5. Update .gitignore to prevent future accumulation
6. Document cleanup process

**Files Touched**:
- `.tmp-*` directories (delete)
- `.codex-logs/*` (delete)
- `.env.vercel.production.account` (delete)
- `.env.vercel.production.hub` (delete)
- `packages/ui/src/staff-surface-retired.tsx` (delete)
- `.gitignore` (update)

**Apps Affected**: None (no code changes)

**Validation**:
```bash
# Verify builds still pass
pnpm run build:all

# Verify types still pass
pnpm run typecheck:all

# Verify linting passes
pnpm run lint:all

# Verify no broken imports
grep -r "staff-surface-retired" apps/
```

**Deployment Impact**: LOW (no code changes)

**Success Criteria**:
- All builds pass
- All tests pass
- Repository size reduced
- No broken imports

**Rollback**: Restore files from git if needed (very low risk)

---

### Phase 2: Auth Consolidation Foundation (Week 2-3)

**Goal**: Create @henryco/auth package and migrate first app

**Tasks**:
1. Create @henryco/auth package structure
2. Define canonical types (PlatformRole, DivisionRole, WorkspacePermission)
3. Implement getViewer, requireUser, requireRoles
4. Write unit tests for auth utilities
5. Migrate apps/care to use @henryco/auth
6. Test care app authentication flows
7. Document migration pattern

**Files Touched**:
- `packages/auth/` (create)
- `packages/auth/src/types.ts` (create)
- `packages/auth/src/server.ts` (create)
- `packages/auth/src/permissions.ts` (create)
- `packages/auth/package.json` (create)
- `apps/care/lib/auth/server.ts` (update to use @henryco/auth)
- `apps/care/app/(staff)/**/page.tsx` (update imports)

**Apps Affected**: care (first migration)

**Validation**:
```bash
# Build care app
pnpm --filter @henryco/care build

# Test care app
pnpm --filter @henryco/care test

# Manual testing
# 1. Test login flow
# 2. Test role-based access (owner, manager, support, staff, rider)
# 3. Test frozen account handling
# 4. Test force reauth flow
# 5. Test logout flow
```

**Deployment Impact**: MEDIUM (affects care app authentication)

**Success Criteria**:
- @henryco/auth package builds
- Care app builds with new auth
- All auth flows work in care app
- No regressions in care app
- Unit tests pass

**Rollback**: Revert care app to old auth implementation

---

### Phase 3: Navigation Consolidation (Week 3-4)

**Goal**: Extract shared navigation utilities

**Tasks**:
1. Create shared navigation utilities in @henryco/ui or new package
2. Extract filtering and grouping logic from apps/staff
3. Migrate apps/staff to use shared utilities
4. Migrate apps/studio to use shared utilities
5. Document navigation patterns

**Files Touched**:
- `packages/ui/src/navigation.ts` (create)
- `apps/staff/lib/navigation.ts` (refactor)
- `apps/studio/lib/studio/navigation.ts` (refactor)
- `apps/marketplace/lib/marketplace/navigation.ts` (refactor)
- `apps/logistics/lib/logistics/navigation.ts` (refactor)

**Apps Affected**: staff, studio, marketplace, logistics

**Validation**:
```bash
# Build affected apps
pnpm --filter @henryco/staff build
pnpm --filter @henryco/studio build
pnpm --filter @henryco/marketplace build
pnpm --filter @henryco/logistics build

# Visual regression tests
# Manual navigation testing in each app
```

**Deployment Impact**: LOW (mostly code organization)

**Success Criteria**:
- Shared utilities work
- All apps build
- Navigation works in all apps
- No visual regressions

**Rollback**: Revert to app-specific implementations

---

### Phase 4: Retired Routes Removal (Week 4-5)

**Goal**: Remove retired staff routes and add redirects

**Tasks**:
1. Document all retired routes
2. Map retired routes to new staffhq routes
3. Implement redirects in proxy.ts files
4. Test all redirect paths
5. Remove retired route files
6. Update documentation
7. Communicate changes to staff

**Files Touched**:
- `apps/care/app/(staff)/*` (remove old staff routes)
- `apps/jobs/app/recruiter/*` (remove)
- `apps/jobs/app/moderation/*` (remove)
- `apps/marketplace/app/owner/*` (remove)
- `apps/marketplace/app/operations/*` (remove)
- `apps/marketplace/app/moderation/*` (remove)
- `apps/property/app/operations/*` (remove)
- `apps/property/app/moderation/*` (remove)
- `apps/property/app/owner/*` (remove)
- `apps/learn/app/owner/*` (remove)
- `apps/studio/app/owner/*` (remove)
- `apps/hub/app/workspace/*` (remove)
- `apps/*/proxy.ts` (add redirects)

**Apps Affected**: care, jobs, marketplace, property, learn, studio, hub

**Validation**:
```bash
# Test redirects
curl -I https://care.henrycogroup.com/staff
# Should redirect to https://staffhq.henrycogroup.com/care

# Test all redirect paths
# Manual testing of bookmarks
```

**Deployment Impact**: MEDIUM (affects staff workflows)

**Success Criteria**:
- All redirects work
- No broken links
- Staff can access new routes
- Documentation updated

**Rollback**: Restore route files, remove redirects

---

### Phase 5: Security Hardening (Week 5-6)

**Goal**: Ensure all admin/staff routes have authentication

**Tasks**:
1. Audit all /admin routes
2. Audit all API routes
3. Add missing authentication
4. Audit RLS policies
5. Add missing RLS policies
6. Security testing
7. Document security boundaries

**Files Touched**:
- `apps/*/app/admin/**/page.tsx` (add auth)
- `apps/*/app/api/**/route.ts` (add auth)
- `apps/*/supabase/migrations/*` (add RLS policies)

**Apps Affected**: All apps with admin/staff routes

**Validation**:
```bash
# Security testing
# 1. Test unauthenticated access to admin routes (should fail)
# 2. Test unauthorized role access (should fail)
# 3. Test RLS policies with different users
# 4. Penetration testing
```

**Deployment Impact**: HIGH (security changes)

**Success Criteria**:
- All admin routes require auth
- All API routes with sensitive ops require auth
- RLS policies complete
- Security audit passes

**Rollback**: Remove auth checks if needed (HIGH RISK)

---

### Phase 6: Auth Migration Completion (Week 6-8)

**Goal**: Migrate remaining apps to @henryco/auth

**Tasks**:
1. Migrate apps/property to @henryco/auth
2. Migrate apps/staff to @henryco/auth
3. Migrate remaining apps
4. Remove old auth implementations
5. Update documentation

**Files Touched**:
- `apps/property/app/api/property/route.ts` (update)
- `apps/staff/lib/staff-auth.ts` (update)
- `apps/*/lib/auth/*` (update or remove)

**Apps Affected**: property, staff, all remaining apps

**Validation**:
```bash
# Test each app after migration
# Manual auth flow testing
# Integration tests
```

**Deployment Impact**: HIGH (affects all apps)

**Success Criteria**:
- All apps use @henryco/auth
- Old implementations removed
- All auth flows work
- No regressions

**Rollback**: Revert individual apps

---

### Phase 7: UI Component Consolidation (Week 8-10)

**Goal**: Consolidate duplicate UI components

**Tasks**:
1. Audit button components
2. Audit loading state components
3. Audit error state components
4. Consolidate into @henryco/ui
5. Migrate apps to use shared components
6. Visual regression tests

**Files Touched**:
- `packages/ui/src/button.tsx` (create or update)
- `packages/ui/src/loading.tsx` (create or update)
- `packages/ui/src/error.tsx` (create or update)
- `apps/*/components/*` (update to use shared)

**Apps Affected**: All apps

**Validation**:
```bash
# Visual regression tests
# Accessibility tests
# Manual testing
```

**Deployment Impact**: MEDIUM (UI changes)

**Success Criteria**:
- Shared components work
- No visual regressions
- Accessibility maintained

**Rollback**: Revert to app-specific components

---

### Phase 8: Documentation and Validation (Week 10-11)

**Goal**: Complete documentation and final validation

**Tasks**:
1. Update architecture-summary.md
2. Document app boundaries
3. Document auth system
4. Document navigation patterns
5. Document routing rules
6. Create cleanup completion report
7. Final validation

**Files Touched**:
- `docs/architecture-summary.md` (update)
- `docs/auth-system.md` (create)
- `docs/navigation-patterns.md` (create)
- `docs/routing-rules.md` (create)
- `.kiro/specs/monorepo-cleanup-consolidation/completion-report.md` (create)

**Apps Affected**: None (documentation only)

**Validation**:
```bash
# Final validation
pnpm run ci:validate

# Manual testing of all apps
# Staging environment verification
```

**Deployment Impact**: LOW (documentation only)

**Success Criteria**:
- All documentation updated
- All builds pass
- All tests pass
- Staging environment works
- Completion report created

**Rollback**: N/A (documentation)



## Production Safety

### What Can Be Safely Changed Without Immediate Deploy

**Safe Changes** (can be merged to main without immediate deployment):

1. **Dead Code Removal**
   - Temporary directories
   - Stale .env files
   - Unused components
   - Build artifacts
   - Risk: SAFE (no runtime impact)

2. **Documentation Updates**
   - Architecture docs
   - README files
   - Code comments
   - Risk: SAFE (no runtime impact)

3. **Test Additions**
   - Unit tests
   - Integration tests
   - Test utilities
   - Risk: SAFE (tests don't affect production)

4. **Linting/Formatting**
   - ESLint config updates
   - Prettier config updates
   - Code formatting
   - Risk: SAFE (no runtime impact)

5. **Type Definitions**
   - Adding new types
   - Improving type safety
   - Type exports
   - Risk: SAFE (compile-time only)

### What Will Require Coordinated Redeploys

**Coordinated Changes** (require careful deployment planning):

1. **Auth System Changes**
   - Requires: Deploy all apps using new auth at once
   - Reason: Shared session format, cookie handling
   - Strategy: Feature flag, gradual rollout
   - Risk: HIGH

2. **Database Schema Changes**
   - Requires: Run migrations before deploying code
   - Reason: Code expects new schema
   - Strategy: Backward-compatible migrations first
   - Risk: HIGH

3. **Shared Package Updates**
   - Requires: Deploy all apps using package at once
   - Reason: Breaking changes in shared code
   - Strategy: Semantic versioning, backward compatibility
   - Risk: MEDIUM

4. **Routing Changes**
   - Requires: Deploy all apps with redirects at once
   - Reason: Broken links if partial deployment
   - Strategy: Deploy redirects first, remove routes later
   - Risk: MEDIUM

5. **RLS Policy Changes**
   - Requires: Apply policies before deploying code
   - Reason: Code expects policies to exist
   - Strategy: Additive policies first, restrictive later
   - Risk: HIGH

### What Could Break Live Behavior If Done Incorrectly

**High-Risk Changes** (require extreme caution):

1. **Authentication Logic**
   - Impact: Users locked out, unauthorized access
   - Mitigation: Extensive testing, feature flags, gradual rollout
   - Rollback: Keep old auth code, revert quickly

2. **Database Migrations**
   - Impact: Data loss, broken queries, app crashes
   - Mitigation: Backup database, test migrations, backward compatibility
   - Rollback: Restore backup, revert migrations

3. **RLS Policies**
   - Impact: Data leaks, unauthorized access, broken queries
   - Mitigation: Test policies thoroughly, audit access patterns
   - Rollback: Drop policies, restore old policies

4. **Session/Cookie Handling**
   - Impact: Users logged out, session loss
   - Mitigation: Test cookie handling, verify cross-domain cookies
   - Rollback: Revert cookie changes

5. **API Route Changes**
   - Impact: Broken integrations, data corruption
   - Mitigation: Versioned APIs, backward compatibility
   - Rollback: Revert API changes

6. **Routing/Redirects**
   - Impact: Broken links, 404 errors, lost users
   - Mitigation: Test all redirect paths, verify bookmarks
   - Rollback: Remove redirects, restore routes

### Deployment Strategy

**Recommended Approach**:

1. **Staging First**
   - Deploy all changes to staging
   - Run full test suite
   - Manual testing of critical flows
   - Verify no regressions

2. **Gradual Production Rollout**
   - Deploy non-critical apps first
   - Monitor for errors
   - Deploy critical apps (account, hub, staff) last
   - Monitor closely

3. **Feature Flags**
   - Use feature flags for major changes
   - Enable for internal users first
   - Gradually roll out to all users
   - Quick rollback if issues

4. **Monitoring**
   - Set up alerts for errors
   - Monitor authentication flows
   - Monitor API error rates
   - Monitor database query performance

5. **Rollback Plan**
   - Document rollback steps for each phase
   - Keep old code available
   - Test rollback procedure
   - Have rollback scripts ready



## Stop Conditions

### Changes That Should Not Be Made Automatically

**Manual Review Required**:

1. **Database Schema Changes**
   - Reason: Risk of data loss
   - Action: Manual review, backup, testing
   - Approval: Database admin

2. **RLS Policy Changes**
   - Reason: Security implications
   - Action: Security audit, manual review
   - Approval: Security engineer

3. **Authentication Logic Changes**
   - Reason: Risk of lockout
   - Action: Extensive testing, gradual rollout
   - Approval: Tech lead

4. **Production Environment Variables**
   - Reason: Risk of service disruption
   - Action: Manual verification, staging test
   - Approval: DevOps engineer

5. **Routing Changes**
   - Reason: Risk of broken links
   - Action: Test all paths, verify redirects
   - Approval: Product owner

### Areas That Require Explicit Review Before Implementation

**Explicit Approval Needed**:

1. **Mobile Apps (company-hub, super-app)**
   - Reason: Different tech stack, separate concerns
   - Reviewer: Mobile team lead
   - Timeline: Separate initiative

2. **Build System Changes (Turborepo)**
   - Reason: Infrastructure change
   - Reviewer: DevOps team
   - Timeline: Separate planning

3. **Shared Package Breaking Changes**
   - Reason: Affects all apps
   - Reviewer: Tech lead
   - Timeline: Coordinated deployment

4. **Public-Facing UI Changes**
   - Reason: User-facing impact
   - Reviewer: Product owner
   - Timeline: Product planning

5. **Third-Party Integrations**
   - Reason: External dependencies
   - Reviewer: Integration owner
   - Timeline: Vendor coordination

### Things That Look Messy But Are Too Risky to Clean in First Pass

**Defer to Later**:

1. **apps/apps/hub Duplicate**
   - Why Messy: Duplicate directory structure
   - Why Risky: Unknown purpose, may be symlink or build artifact
   - Action: Investigate thoroughly before touching
   - Timeline: Phase 2 or later

2. **Legacy Role Type Mappings**
   - Why Messy: Multiple role type systems
   - Why Risky: Breaking changes affect all apps
   - Action: Gradual migration with backward compatibility
   - Timeline: Phases 2-6

3. **Database Migration History**
   - Why Messy: Migrations scattered across apps
   - Why Risky: Cannot modify migration history
   - Action: Document ownership, improve future process
   - Timeline: Ongoing

4. **Proxy Middleware Duplication**
   - Why Messy: Similar code in each app
   - Why Risky: Next.js requires proxy.ts in each app
   - Action: Extract shared logic, keep files
   - Timeline: Phase 3

5. **Theme System Inconsistencies**
   - Why Messy: Different theme implementations
   - Why Risky: Visual regressions, brand consistency
   - Action: Gradual standardization
   - Timeline: Phase 7

6. **API Route Patterns**
   - Why Messy: Inconsistent patterns
   - Why Risky: Breaking changes affect integrations
   - Action: Document patterns, improve new routes
   - Timeline: Ongoing

7. **Error Handling Patterns**
   - Why Messy: Inconsistent error handling
   - Why Risky: May hide bugs, affect monitoring
   - Action: Gradual standardization
   - Timeline: Phase 7

8. **Loading State Patterns**
   - Why Messy: Inconsistent loading states
   - Why Risky: Visual regressions
   - Action: Gradual standardization
   - Timeline: Phase 7

### Red Flags That Should Stop Execution

**Immediate Stop Conditions**:

1. **Build Failures**
   - If any app fails to build after changes
   - Action: Rollback immediately, investigate

2. **Test Failures**
   - If any test fails after changes
   - Action: Fix tests or rollback changes

3. **Type Errors**
   - If TypeScript compilation fails
   - Action: Fix types or rollback changes

4. **Authentication Failures**
   - If users cannot log in
   - Action: Rollback immediately, investigate

5. **Database Errors**
   - If queries fail or data is corrupted
   - Action: Restore backup, rollback changes

6. **Production Errors**
   - If error rate increases significantly
   - Action: Rollback immediately, investigate

7. **Performance Degradation**
   - If response times increase significantly
   - Action: Investigate, rollback if severe

8. **Security Vulnerabilities**
   - If security issues are discovered
   - Action: Fix immediately or rollback



## Error Handling

### Error Detection Strategy

**Build-Time Errors**:
- TypeScript compilation errors
- ESLint errors
- Test failures
- Build failures

**Runtime Errors**:
- Authentication failures
- Authorization failures
- Database query errors
- API errors
- Routing errors

**Monitoring**:
- Error rate monitoring (Sentry)
- Performance monitoring
- Authentication flow monitoring
- Database query performance

### Error Recovery

**Rollback Procedures**:

1. **Code Changes**
   ```bash
   # Revert last commit
   git revert HEAD
   
   # Revert specific commit
   git revert <commit-hash>
   
   # Redeploy
   vercel --prod
   ```

2. **Database Migrations**
   ```sql
   -- Rollback migration
   -- (depends on migration tool)
   -- Restore from backup if needed
   ```

3. **Environment Variables**
   ```bash
   # Restore old values in Vercel dashboard
   # Or use vercel env commands
   ```

4. **Feature Flags**
   ```typescript
   // Disable feature flag
   const useNewAuth = false;
   ```

### Error Logging

**Log Levels**:
- ERROR: Critical issues requiring immediate attention
- WARN: Potential issues that should be investigated
- INFO: Normal operations
- DEBUG: Detailed debugging information

**Log Context**:
- User ID
- Request ID
- App name
- Route path
- Error stack trace
- Timestamp

**Log Aggregation**:
- Sentry for error tracking
- Vercel logs for deployment logs
- Supabase logs for database logs



## Testing Strategy

### Unit Testing

**Auth Package Tests**:
```typescript
// packages/auth/src/__tests__/server.test.ts
describe("requireRoles", () => {
  it("should allow access for authorized roles", async () => {
    // Test implementation
  });
  
  it("should deny access for unauthorized roles", async () => {
    // Test implementation
  });
  
  it("should redirect to login for unauthenticated users", async () => {
    // Test implementation
  });
  
  it("should handle frozen accounts", async () => {
    // Test implementation
  });
  
  it("should handle force reauth", async () => {
    // Test implementation
  });
});
```

**Navigation Tests**:
```typescript
// packages/ui/src/__tests__/navigation.test.ts
describe("filterNavItems", () => {
  it("should filter items by permissions", () => {
    // Test implementation
  });
  
  it("should filter items by divisions", () => {
    // Test implementation
  });
  
  it("should keep items without requirements", () => {
    // Test implementation
  });
});
```

**Identity Tests**:
```typescript
// packages/config/__tests__/identity.test.ts
describe("normalizeEmail", () => {
  it("should lowercase emails", () => {
    expect(normalizeEmail("TEST@EXAMPLE.COM")).toBe("test@example.com");
  });
  
  it("should handle null/undefined", () => {
    expect(normalizeEmail(null)).toBe(null);
  });
});

describe("normalizePhone", () => {
  it("should normalize Nigerian phone numbers", () => {
    expect(normalizePhone("08012345678")).toBe("2348012345678");
  });
  
  it("should handle international format", () => {
    expect(normalizePhone("+2348012345678")).toBe("2348012345678");
  });
});
```

### Integration Testing

**Auth Flow Tests**:
```typescript
// apps/care/__tests__/auth.integration.test.ts
describe("Care App Authentication", () => {
  it("should allow owner to access owner routes", async () => {
    // Test implementation
  });
  
  it("should deny customer access to staff routes", async () => {
    // Test implementation
  });
  
  it("should redirect unauthenticated users to login", async () => {
    // Test implementation
  });
});
```

**Navigation Tests**:
```typescript
// apps/staff/__tests__/navigation.integration.test.ts
describe("Staff App Navigation", () => {
  it("should show division nav items for users with division access", async () => {
    // Test implementation
  });
  
  it("should hide division nav items for users without access", async () => {
    // Test implementation
  });
});
```

### Manual Testing Checklist

**Phase 1: Dead Code Removal**
- [ ] All apps build successfully
- [ ] All tests pass
- [ ] No broken imports
- [ ] Repository size reduced

**Phase 2: Auth Consolidation**
- [ ] Login flow works
- [ ] Logout flow works
- [ ] Role-based access works (test each role)
- [ ] Frozen account handling works
- [ ] Force reauth works
- [ ] Session persistence works
- [ ] Cross-domain cookies work

**Phase 3: Navigation Consolidation**
- [ ] Navigation renders correctly
- [ ] Permission filtering works
- [ ] Division filtering works
- [ ] Section grouping works
- [ ] Icons display correctly
- [ ] Active state works

**Phase 4: Retired Routes Removal**
- [ ] All redirects work
- [ ] No broken links
- [ ] Bookmarks redirect correctly
- [ ] Staff can access new routes
- [ ] Documentation updated

**Phase 5: Security Hardening**
- [ ] Admin routes require auth
- [ ] API routes require auth
- [ ] RLS policies work
- [ ] Unauthorized access denied
- [ ] Security audit passes

**Phase 6: Auth Migration Completion**
- [ ] All apps use @henryco/auth
- [ ] Old implementations removed
- [ ] All auth flows work
- [ ] No regressions

**Phase 7: UI Component Consolidation**
- [ ] Shared components render correctly
- [ ] No visual regressions
- [ ] Accessibility maintained
- [ ] Interactions work

**Phase 8: Documentation and Validation**
- [ ] All documentation updated
- [ ] All builds pass
- [ ] All tests pass
- [ ] Staging environment works
- [ ] Production deployment successful

### Automated Testing

**CI Pipeline**:
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '24'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Lint
        run: pnpm run lint:all
      
      - name: Type check
        run: pnpm run typecheck:all
      
      - name: Test
        run: pnpm run test:workspace
      
      - name: Build
        run: pnpm run build:all
```

### Visual Regression Testing

**Recommended Tools**:
- Playwright for E2E testing
- Percy or Chromatic for visual regression
- Storybook for component testing

**Example Test**:
```typescript
// apps/staff/__tests__/visual.spec.ts
import { test, expect } from '@playwright/test';

test('staff dashboard renders correctly', async ({ page }) => {
  await page.goto('https://staffhq.henrycogroup.com/');
  await expect(page).toHaveScreenshot('staff-dashboard.png');
});
```



## Recommended Kiro Steering Files and Hooks

### Steering Files

**1. Auth Pattern Enforcement**

`.kiro/steering/auth-patterns.md`:
```markdown
# Authentication Patterns

## Required Patterns

1. All admin routes MUST use requireRoles from @henryco/auth
2. All API routes with sensitive operations MUST check authentication
3. All staff routes MUST use requireStaff or requireRoles
4. Never implement custom auth logic - use @henryco/auth

## Examples

Good:
```typescript
import { requireRoles } from '@henryco/auth';

export default async function AdminPage() {
  await requireRoles(['owner', 'manager']);
  // ...
}
```

Bad:
```typescript
// Custom auth implementation
const user = await getUser();
if (!user) redirect('/login');
```

## Enforcement

- Pre-commit hook checks for custom auth patterns
- CI fails if auth patterns violated
- Code review checklist includes auth verification
```

**2. Navigation Pattern Enforcement**

`.kiro/steering/navigation-patterns.md`:
```markdown
# Navigation Patterns

## Required Patterns

1. Use shared navigation utilities from @henryco/ui
2. Define nav configs in app-specific files
3. Use permission-based filtering
4. Follow NavItem type structure

## Examples

Good:
```typescript
import { filterNavItems, type NavItem } from '@henryco/ui/navigation';

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', requiredPermissions: ['workspace.view'] }
];

const filtered = filterNavItems(navItems, viewer);
```

Bad:
```typescript
// Custom navigation filtering
const filtered = navItems.filter(item => {
  // Custom logic
});
```
```

**3. Dead Code Prevention**

`.kiro/steering/dead-code-prevention.md`:
```markdown
# Dead Code Prevention

## Rules

1. No unused imports (enforced by ESLint)
2. No commented-out code blocks (use git history instead)
3. No TODO comments older than 30 days without issue link
4. No temporary files committed (.tmp-*, *.log)

## Enforcement

- ESLint rule: no-unused-vars
- Pre-commit hook removes commented code
- CI fails on old TODO comments
- .gitignore prevents temporary files
```

**4. Type Safety Standards**

`.kiro/steering/type-safety.md`:
```markdown
# Type Safety Standards

## Rules

1. Strict TypeScript mode enabled
2. No `any` types without explicit justification
3. Shared types in packages, not duplicated
4. Export types from shared packages

## Examples

Good:
```typescript
import type { PlatformRole } from '@henryco/auth';

function checkRole(role: PlatformRole) {
  // ...
}
```

Bad:
```typescript
function checkRole(role: any) {
  // ...
}
```
```

### Hooks

**1. Pre-commit Hook**

`.kiro/hooks/pre-commit.sh`:
```bash
#!/bin/bash

# Check for temporary files
if git diff --cached --name-only | grep -E '\\.tmp-|\\.(log|err|out)$'; then
  echo "Error: Attempting to commit temporary files"
  exit 1
fi

# Check for stale TODO comments
if git diff --cached --name-only | xargs grep -n "TODO" | grep -v "TODO("; then
  echo "Warning: TODO comments should include issue link: TODO(#123)"
fi

# Run linting on staged files
pnpm run lint:staged

# Run type checking
pnpm run typecheck:all
```

**2. Pre-push Hook**

`.kiro/hooks/pre-push.sh`:
```bash
#!/bin/bash

# Run full test suite
pnpm run test:workspace

# Check for auth pattern violations
if git diff origin/main --name-only | xargs grep -l "requireRoles" | xargs grep -L "@henryco/auth"; then
  echo "Error: Custom auth implementation detected. Use @henryco/auth"
  exit 1
fi

# Check for navigation pattern violations
if git diff origin/main --name-only | xargs grep -l "filterNavItems" | xargs grep -L "@henryco/ui"; then
  echo "Error: Custom navigation filtering detected. Use @henryco/ui"
  exit 1
fi
```

**3. Commit Message Hook**

`.kiro/hooks/commit-msg.sh`:
```bash
#!/bin/bash

# Enforce conventional commits
commit_msg=$(cat "$1")

if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\\(.+\\))?: .+"; then
  echo "Error: Commit message must follow conventional commits format"
  echo "Examples:"
  echo "  feat(auth): add requireRoles utility"
  echo "  fix(navigation): correct permission filtering"
  echo "  docs(readme): update setup instructions"
  exit 1
fi
```

**4. Post-merge Hook**

`.kiro/hooks/post-merge.sh`:
```bash
#!/bin/bash

# Check if package.json changed
if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep --quiet "package.json"; then
  echo "package.json changed, running pnpm install"
  pnpm install
fi

# Check if migrations changed
if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep --quiet "supabase/migrations"; then
  echo "Migrations changed, consider running migrations"
  echo "Run: pnpm run migrate:up"
fi
```

### Maintenance Checklist

**Monthly Cleanup Checklist**:

`.kiro/checklists/monthly-cleanup.md`:
```markdown
# Monthly Cleanup Checklist

## Dead Code
- [ ] Run unused import detection
- [ ] Check for unreferenced files
- [ ] Review TODO comments
- [ ] Clean up temporary files

## Dependencies
- [ ] Update dependencies
- [ ] Remove unused dependencies
- [ ] Check for security vulnerabilities
- [ ] Update lockfile

## Documentation
- [ ] Update architecture docs
- [ ] Update API docs
- [ ] Update README files
- [ ] Update changelog

## Testing
- [ ] Review test coverage
- [ ] Add missing tests
- [ ] Update test fixtures
- [ ] Remove obsolete tests

## Performance
- [ ] Review build times
- [ ] Review bundle sizes
- [ ] Review query performance
- [ ] Review error rates

## Security
- [ ] Review auth patterns
- [ ] Review RLS policies
- [ ] Review API security
- [ ] Review dependency vulnerabilities
```

**Code Review Checklist**:

`.kiro/checklists/code-review.md`:
```markdown
# Code Review Checklist

## Auth
- [ ] Uses @henryco/auth for authentication
- [ ] Proper role checking
- [ ] No custom auth logic
- [ ] Session handling correct

## Navigation
- [ ] Uses shared navigation utilities
- [ ] Permission filtering correct
- [ ] Nav items properly typed
- [ ] Icons display correctly

## Types
- [ ] No `any` types without justification
- [ ] Shared types used
- [ ] Types exported from packages
- [ ] TypeScript strict mode enabled

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing performed
- [ ] Edge cases covered

## Documentation
- [ ] Code comments added
- [ ] README updated
- [ ] API docs updated
- [ ] Changelog updated

## Performance
- [ ] No unnecessary re-renders
- [ ] Queries optimized
- [ ] Bundle size acceptable
- [ ] Loading states added

## Security
- [ ] Auth checks present
- [ ] Input validation added
- [ ] SQL injection prevented
- [ ] XSS prevention added
```



## Final Summary

### Top 10 Highest-Value Cleanup Actions

1. **Create @henryco/auth Package**
   - Value: Eliminates 3 duplicate auth implementations
   - Impact: Improves security, maintainability, consistency
   - Risk: HIGH (requires careful migration)
   - Priority: P1_HIGH

2. **Remove Dead Code and Stale Files**
   - Value: Cleaner codebase, reduced repository size
   - Impact: Easier navigation, less confusion
   - Risk: SAFE
   - Priority: P1_HIGH

3. **Consolidate Navigation Patterns**
   - Value: Consistent navigation across apps
   - Impact: Better UX, easier maintenance
   - Risk: LOW
   - Priority: P1_HIGH

4. **Remove Retired Staff Routes**
   - Value: Eliminates confusing placeholder UI
   - Impact: Clearer staff workflows
   - Risk: MEDIUM
   - Priority: P1_HIGH

5. **Security Hardening (Auth on Admin Routes)**
   - Value: Prevents unauthorized access
   - Impact: Critical security improvement
   - Risk: MEDIUM
   - Priority: P0_CRITICAL

6. **Standardize Proxy Middleware**
   - Value: Consistent cookie/header handling
   - Impact: Easier debugging, better patterns
   - Risk: LOW
   - Priority: P2_MEDIUM

7. **Consolidate UI Components**
   - Value: Consistent UI, less duplication
   - Impact: Better UX, easier maintenance
   - Risk: MEDIUM
   - Priority: P2_MEDIUM

8. **Document Architecture Boundaries**
   - Value: Clear mental model of system
   - Impact: Easier onboarding, better decisions
   - Risk: SAFE
   - Priority: P1_HIGH

9. **Improve Type Safety**
   - Value: Catch bugs at compile time
   - Impact: Fewer runtime errors
   - Risk: MEDIUM
   - Priority: P2_MEDIUM

10. **Establish Maintenance Patterns**
    - Value: Prevent future technical debt
    - Impact: Long-term code quality
    - Risk: SAFE
    - Priority: P1_HIGH

### Top 10 Highest-Risk Cleanup Actions

1. **Auth System Migration**
   - Risk: CRITICAL (breaking auth breaks everything)
   - Mitigation: Extensive testing, gradual rollout, feature flags
   - Rollback: Keep old implementations, quick revert

2. **Database Schema Changes**
   - Risk: CRITICAL (data loss, broken queries)
   - Mitigation: Backups, backward-compatible migrations, testing
   - Rollback: Restore backup, revert migrations

3. **RLS Policy Changes**
   - Risk: CRITICAL (data leaks, unauthorized access)
   - Mitigation: Security audit, thorough testing
   - Rollback: Drop policies, restore old policies

4. **Retired Routes Removal**
   - Risk: HIGH (broken bookmarks, lost users)
   - Mitigation: Comprehensive redirect testing
   - Rollback: Restore routes, remove redirects

5. **Session/Cookie Handling Changes**
   - Risk: HIGH (users logged out, session loss)
   - Mitigation: Test cross-domain cookies, verify persistence
   - Rollback: Revert cookie changes

6. **Shared Package Breaking Changes**
   - Risk: HIGH (affects all apps)
   - Mitigation: Semantic versioning, backward compatibility
   - Rollback: Revert package version

7. **API Route Changes**
   - Risk: HIGH (broken integrations)
   - Mitigation: Versioned APIs, backward compatibility
   - Rollback: Revert API changes

8. **Build System Changes**
   - Risk: MEDIUM (broken CI/CD)
   - Mitigation: Test thoroughly, gradual rollout
   - Rollback: Revert build scripts

9. **UI Component Consolidation**
   - Risk: MEDIUM (visual regressions)
   - Mitigation: Visual regression tests, manual testing
   - Rollback: Revert to app-specific components

10. **Type Safety Improvements**
    - Risk: MEDIUM (may surface hidden bugs)
    - Mitigation: Gradual strictness increase, thorough testing
    - Rollback: Revert TypeScript config

### 5 Best Quick Wins to Execute First

1. **Remove Temporary Directories**
   - Effort: 5 minutes
   - Value: Cleaner repository
   - Risk: SAFE
   - Command: `rm -rf .tmp-* .codex-logs`

2. **Remove Stale .env Files**
   - Effort: 10 minutes
   - Value: Less confusion
   - Risk: SAFE
   - Files: `.env.vercel.production.*`, `.env.pull.*`

3. **Remove StaffSurfaceRetired Component**
   - Effort: 5 minutes
   - Value: Remove unused code
   - Risk: SAFE
   - File: `packages/ui/src/staff-surface-retired.tsx`

4. **Update .gitignore**
   - Effort: 10 minutes
   - Value: Prevent future temporary files
   - Risk: SAFE
   - Add: `.tmp-*`, `*.log`, `*.err`, `*.out`

5. **Document Current Architecture**
   - Effort: 1 hour
   - Value: Clear understanding of system
   - Risk: SAFE
   - File: `docs/architecture-summary.md`

### 5 Things to Absolutely Avoid Breaking

1. **User Authentication**
   - Impact: Users locked out, cannot access apps
   - Prevention: Extensive testing, feature flags, gradual rollout
   - Monitoring: Auth flow metrics, error rates

2. **Database Integrity**
   - Impact: Data loss, corrupted data
   - Prevention: Backups, backward-compatible migrations, testing
   - Monitoring: Query error rates, data validation

3. **Production Deployments**
   - Impact: Service downtime, broken apps
   - Prevention: Staging testing, gradual rollout, monitoring
   - Monitoring: Error rates, response times

4. **Cross-App Navigation**
   - Impact: Broken links, lost users
   - Prevention: Test all redirect paths, verify cookies
   - Monitoring: 404 rates, navigation flows

5. **API Integrations**
   - Impact: Broken integrations, data sync issues
   - Prevention: Versioned APIs, backward compatibility
   - Monitoring: API error rates, integration health

---

## Conclusion

This cleanup plan prioritizes production safety while delivering high-value improvements to the HenryCo monorepo. By following the phased approach, starting with safe quick wins and gradually tackling higher-risk consolidations, we can improve code quality, maintainability, and consistency without breaking existing functionality.

The key to success is:
1. **Explicit risk classification** for every change
2. **Thorough testing** at each phase
3. **Gradual rollout** with monitoring
4. **Clear rollback plans** for every change
5. **Documentation** of all decisions and patterns

This is not a random redesign—it's a careful, methodical cleanup that preserves what works, refines what's promising, and removes what's clearly problematic.

