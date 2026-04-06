# Requirements Document: Monorepo Cleanup and Consolidation

## Introduction

This document defines requirements for a comprehensive cleanup and consolidation effort across the HenryCo monorepo ecosystem. The monorepo contains 13 applications (account, care, hub, jobs, learn, logistics, marketplace, property, staff, studio, company-hub, super-app, and apps/apps/hub) and 4 shared packages (brand, config, i18n, ui). The system has accumulated technical debt including duplicated code, conflicting implementations, weak abstractions, stale files, fragile auth/routing assumptions, and inconsistent patterns.

The cleanup must improve organization, maintainability, reliability, consistency, and production-readiness while preserving strong existing implementations and ensuring all builds, types, routes, and boundaries continue to work correctly.

## Glossary

- **Monorepo**: The HenryCo workspace containing multiple apps and shared packages managed by pnpm workspaces
- **Division_App**: A Next.js application representing a business vertical (care, marketplace, jobs, learn, studio, property, logistics)
- **Staff_Surface**: Internal operational UI for staff members to manage division operations
- **Owner_HQ**: Executive dashboard at hq.henrycogroup.com/owner for company-wide oversight
- **Staff_HQ**: Unified staff platform (apps/staff) for cross-division operational work
- **Role_System**: Authentication and authorization implementation defining user roles and permissions
- **Public_Shell**: Shared UI layout and navigation for customer-facing surfaces
- **Workspace_Tables**: Database tables (workspace_staff_memberships, workspace_queue_items, etc.) for staff platform
- **StaffSurfaceRetired**: Component marking deprecated staff UI surfaces
- **Auth_Adapter**: Authentication implementation pattern (requireRoles, requireUser, getViewer)
- **Navigation_Config**: Route and menu configuration for application navigation
- **Shared_Package**: Workspace package (@henryco/config, @henryco/ui, @henryco/i18n, @henryco/brand)
- **RLS_Policy**: Row-level security policy in Supabase database
- **Dead_Code**: Unused imports, stale files, unreachable routes, or deprecated implementations
- **Design_System**: Shared UI components, themes, and styling patterns

## Requirements

### Requirement 1: Audit and Classify Codebase

**User Story:** As a developer, I want a comprehensive audit of the monorepo, so that I can understand what code exists, its quality, and what actions to take.

#### Acceptance Criteria

1. THE Audit_System SHALL scan all files in apps/* and packages/* directories
2. THE Audit_System SHALL classify each finding as KEEP, KEEP WITH REFINEMENT, REPLACE, REMOVE, or DEFER
3. FOR ALL findings, THE Audit_System SHALL document the rationale for classification
4. THE Audit_System SHALL identify duplicate implementations across apps
5. THE Audit_System SHALL identify conflicting implementations of the same functionality
6. THE Audit_System SHALL identify stale files with no imports or references
7. THE Audit_System SHALL identify dead routes with no navigation paths
8. THE Audit_System SHALL identify weak abstractions that should be consolidated
9. THE Audit_System SHALL produce a structured audit report with file paths and classifications
10. THE Audit_System SHALL prioritize findings by impact on production safety and maintainability

### Requirement 2: Consolidate Authentication Systems

**User Story:** As a developer, I want a unified authentication system, so that role checking and permission logic is consistent across all apps.

#### Acceptance Criteria

1. THE Auth_Consolidation_System SHALL create a single @henryco/auth shared package
2. THE Auth_Consolidation_System SHALL define canonical PlatformRole types in the shared package
3. THE Auth_Consolidation_System SHALL define canonical WorkspacePermission types in the shared package
4. THE Auth_Consolidation_System SHALL provide requireRoles utility function
5. THE Auth_Consolidation_System SHALL provide requireUser utility function
6. THE Auth_Consolidation_System SHALL provide getViewer utility function
7. WHEN an app requires authentication, THE app SHALL use @henryco/auth utilities
8. THE Auth_Consolidation_System SHALL map existing per-app role types to canonical roles
9. THE Auth_Consolidation_System SHALL preserve existing RLS policies during migration
10. THE Auth_Consolidation_System SHALL maintain backward compatibility during transition period
11. THE Auth_Consolidation_System SHALL remove duplicate requireRoles implementations from apps/care, apps/property, and other apps
12. THE Auth_Consolidation_System SHALL document migration path for each app

### Requirement 3: Remove Retired Staff Surfaces

**User Story:** As a developer, I want retired staff surfaces removed or redirected, so that the codebase doesn't contain confusing placeholder UI.

#### Acceptance Criteria

1. THE Cleanup_System SHALL identify all usages of StaffSurfaceRetired component
2. THE Cleanup_System SHALL remove retired staff routes from apps/care (staff)/* paths
3. THE Cleanup_System SHALL remove retired staff routes from apps/jobs /recruiter/* and /moderation paths
4. THE Cleanup_System SHALL remove retired staff routes from apps/marketplace /owner, /operations, /moderation paths
5. THE Cleanup_System SHALL remove retired staff routes from apps/property /operations, /moderation, /owner paths
6. THE Cleanup_System SHALL remove retired staff routes from apps/learn /owner/* paths
7. THE Cleanup_System SHALL remove retired staff routes from apps/studio /owner path
8. THE Cleanup_System SHALL remove retired staff routes from apps/hub /workspace/* path
9. WHEN a retired route is accessed, THE System SHALL redirect to appropriate Staff_HQ or Owner_HQ route
10. THE Cleanup_System SHALL remove StaffSurfaceRetired component after all usages are eliminated
11. THE Cleanup_System SHALL update documentation to reflect removed routes

### Requirement 4: Consolidate Navigation Systems

**User Story:** As a developer, I want consistent navigation patterns, so that adding or modifying routes is predictable across apps.

#### Acceptance Criteria

1. THE Navigation_System SHALL audit navigation implementations in all apps
2. THE Navigation_System SHALL identify duplicate navigation patterns
3. THE Navigation_System SHALL create shared navigation utilities in @henryco/ui or new package
4. THE Navigation_System SHALL define standard navigation item structure
5. THE Navigation_System SHALL define standard navigation filtering by role/permission
6. THE Navigation_System SHALL consolidate apps/staff/lib/navigation.ts patterns
7. THE Navigation_System SHALL consolidate apps/studio/lib/studio/navigation.ts patterns
8. THE Navigation_System SHALL consolidate apps/marketplace/lib/marketplace/navigation.ts patterns
9. THE Navigation_System SHALL consolidate apps/logistics/lib/logistics/navigation.ts patterns
10. THE Navigation_System SHALL consolidate apps/hub/lib/owner-navigation.ts patterns
11. WHEN an app needs navigation, THE app SHALL use shared navigation utilities
12. THE Navigation_System SHALL preserve role-based filtering capabilities

### Requirement 5: Fix Authentication Security Gaps

**User Story:** As a security engineer, I want all admin surfaces protected by authentication, so that unauthorized users cannot access internal operations.

#### Acceptance Criteria

1. THE Security_System SHALL audit all /admin routes for authentication checks
2. IF apps/care/app/admin/page.tsx lacks requireRoles, THEN THE Security_System SHALL add authentication
3. THE Security_System SHALL verify all staff routes have server-side authentication
4. THE Security_System SHALL verify all API routes handling sensitive operations require authentication
5. THE Security_System SHALL verify RLS policies exist for workspace_* tables
6. THE Security_System SHALL verify RLS policies exist for division-specific tables
7. WHEN RLS policies are missing, THE Security_System SHALL create appropriate policies
8. THE Security_System SHALL audit middleware.ts and proxy.ts for auth gaps
9. THE Security_System SHALL document all authentication boundaries
10. THE Security_System SHALL create security audit report with P0, P1, P2 classifications

### Requirement 6: Consolidate Shared UI Components

**User Story:** As a developer, I want consistent UI components, so that the user experience is uniform and maintenance is simplified.

#### Acceptance Criteria

1. THE UI_System SHALL audit component usage across all apps
2. THE UI_System SHALL identify duplicate button, form, modal, and layout components
3. THE UI_System SHALL identify inconsistent styling patterns
4. THE UI_System SHALL identify theme inconsistencies
5. THE UI_System SHALL consolidate duplicate components into @henryco/ui package
6. THE UI_System SHALL create shared staff shell components (StaffShellLayout, StaffSidebar, StaffCommandBar)
7. THE UI_System SHALL create shared public shell components if not already present
8. THE UI_System SHALL define standard component API patterns
9. WHEN apps need common UI, THE apps SHALL import from @henryco/ui
10. THE UI_System SHALL maintain design system documentation
11. THE UI_System SHALL preserve accessibility compliance in consolidated components

### Requirement 7: Remove Dead Code and Stale Files

**User Story:** As a developer, I want dead code removed, so that the codebase is easier to navigate and understand.

#### Acceptance Criteria

1. THE Dead_Code_Detector SHALL scan for unused imports in all TypeScript files
2. THE Dead_Code_Detector SHALL scan for unreferenced files
3. THE Dead_Code_Detector SHALL scan for unreachable routes
4. THE Dead_Code_Detector SHALL scan for commented-out code blocks
5. THE Dead_Code_Detector SHALL scan for TODO/FIXME comments older than 90 days
6. THE Dead_Code_Detector SHALL identify files in .tmp-* and .codex-logs directories
7. THE Dead_Code_Detector SHALL identify stale environment variable files
8. THE Dead_Code_Detector SHALL produce removal report with safe-to-delete classifications
9. WHEN dead code is identified, THE System SHALL remove it if safe
10. WHEN removal is risky, THE System SHALL document the risk and defer
11. THE Dead_Code_Detector SHALL verify builds pass after each removal batch

### Requirement 8: Consolidate Database Schema and Migrations

**User Story:** As a database administrator, I want consistent schema management, so that migrations are reliable and tables are properly documented.

#### Acceptance Criteria

1. THE Schema_System SHALL audit all Supabase migration files
2. THE Schema_System SHALL identify tables referenced in code but missing DDL
3. THE Schema_System SHALL identify duplicate table definitions
4. THE Schema_System SHALL verify workspace_* tables have complete RLS policies
5. THE Schema_System SHALL verify division-specific tables have complete RLS policies
6. WHEN tables are missing DDL, THE Schema_System SHALL create migration files
7. THE Schema_System SHALL consolidate migration files into canonical location
8. THE Schema_System SHALL document table ownership (which app owns which tables)
9. THE Schema_System SHALL verify foreign key relationships are correct
10. THE Schema_System SHALL create schema documentation with table purposes and relationships

### Requirement 9: Standardize Configuration Management

**User Story:** As a developer, I want consistent configuration patterns, so that environment variables and settings are managed uniformly.

#### Acceptance Criteria

1. THE Config_System SHALL audit all .env files across apps
2. THE Config_System SHALL identify duplicate environment variable definitions
3. THE Config_System SHALL identify unused environment variables
4. THE Config_System SHALL identify missing environment variable documentation
5. THE Config_System SHALL consolidate shared configuration into @henryco/config
6. THE Config_System SHALL define standard patterns for app-specific config
7. THE Config_System SHALL create environment variable documentation
8. WHEN apps need shared config, THE apps SHALL import from @henryco/config
9. THE Config_System SHALL verify all required env vars are documented in docs/env-vars.md
10. THE Config_System SHALL remove stale .env files (.env.vercel.production.account, etc.)

### Requirement 10: Improve Error Handling and Loading States

**User Story:** As a user, I want consistent error and loading states, so that the application feels polished and reliable.

#### Acceptance Criteria

1. THE Error_System SHALL audit error handling patterns across apps
2. THE Error_System SHALL identify inconsistent error message formats
3. THE Error_System SHALL identify missing error boundaries
4. THE Error_System SHALL identify inconsistent loading state implementations
5. THE Error_System SHALL create shared error boundary components
6. THE Error_System SHALL create shared loading state components
7. THE Error_System SHALL create shared empty state components
8. THE Error_System SHALL define standard error logging patterns
9. WHEN errors occur, THE System SHALL display consistent error UI
10. WHEN data is loading, THE System SHALL display consistent loading UI
11. THE Error_System SHALL integrate with monitoring (Sentry) for error tracking

### Requirement 11: Consolidate Routing and URL Patterns

**User Story:** As a developer, I want consistent routing patterns, so that URL structure is predictable across apps.

#### Acceptance Criteria

1. THE Routing_System SHALL audit route structures across all apps
2. THE Routing_System SHALL identify inconsistent route naming patterns
3. THE Routing_System SHALL identify conflicting route definitions
4. THE Routing_System SHALL document public vs internal route boundaries
5. THE Routing_System SHALL document account vs division route boundaries
6. THE Routing_System SHALL verify proxy.ts configurations are correct
7. THE Routing_System SHALL verify subdomain routing (hq.*, workspace.*, staffhq.*) is correct
8. THE Routing_System SHALL create routing documentation with URL patterns
9. WHEN routes are added, THE System SHALL follow documented patterns
10. THE Routing_System SHALL verify all route redirects are correct

### Requirement 12: Improve Build and CI Performance

**User Story:** As a developer, I want faster builds, so that I can iterate quickly and CI completes in reasonable time.

#### Acceptance Criteria

1. THE Build_System SHALL audit current CI pipeline performance
2. THE Build_System SHALL identify slow build steps
3. THE Build_System SHALL identify unnecessary build dependencies
4. THE Build_System SHALL evaluate adding Turborepo for caching
5. THE Build_System SHALL optimize TypeScript compilation settings
6. THE Build_System SHALL optimize Next.js build configurations
7. THE Build_System SHALL implement parallel build execution where possible
8. THE Build_System SHALL measure build time improvements
9. WHEN CI runs, THE System SHALL complete in under 15 minutes for full validation
10. THE Build_System SHALL document build optimization techniques

### Requirement 13: Consolidate Identity and Profile Logic

**User Story:** As a developer, I want consistent identity handling, so that user profile logic is not duplicated across apps.

#### Acceptance Criteria

1. THE Identity_System SHALL audit identity resolution logic across apps
2. THE Identity_System SHALL identify duplicate email normalization implementations
3. THE Identity_System SHALL identify duplicate phone normalization implementations
4. THE Identity_System SHALL identify duplicate avatar resolution logic
5. THE Identity_System SHALL verify @henryco/config/identity.ts is used consistently
6. THE Identity_System SHALL identify apps not using shared identity utilities
7. WHEN apps need identity normalization, THE apps SHALL use @henryco/config utilities
8. THE Identity_System SHALL consolidate resolveUserAvatarFromSources usage
9. THE Identity_System SHALL consolidate normalizeEmail usage
10. THE Identity_System SHALL consolidate normalizePhone usage
11. THE Identity_System SHALL remove duplicate implementations after migration

### Requirement 14: Document Architecture and Boundaries

**User Story:** As a developer, I want clear architecture documentation, so that I understand system boundaries and responsibilities.

#### Acceptance Criteria

1. THE Documentation_System SHALL update docs/architecture-summary.md with cleanup changes
2. THE Documentation_System SHALL document app responsibilities and boundaries
3. THE Documentation_System SHALL document shared package responsibilities
4. THE Documentation_System SHALL document public vs internal surface boundaries
5. THE Documentation_System SHALL document Owner_HQ vs Staff_HQ boundaries
6. THE Documentation_System SHALL document division app vs shared platform boundaries
7. THE Documentation_System SHALL create decision log for major consolidation choices
8. THE Documentation_System SHALL document migration paths for deprecated patterns
9. THE Documentation_System SHALL update docs/known-issues.md with remaining issues
10. THE Documentation_System SHALL create cleanup completion report

### Requirement 15: Validate Production Safety

**User Story:** As a release manager, I want validation that cleanup changes are production-safe, so that deployments don't break existing functionality.

#### Acceptance Criteria

1. THE Validation_System SHALL verify all apps build successfully after cleanup
2. THE Validation_System SHALL verify all TypeScript types are correct after cleanup
3. THE Validation_System SHALL verify all tests pass after cleanup
4. THE Validation_System SHALL verify all route relationships still work
5. THE Validation_System SHALL verify authentication boundaries still hold
6. THE Validation_System SHALL verify database migrations apply cleanly
7. THE Validation_System SHALL verify no broken imports exist
8. THE Validation_System SHALL verify no broken links in documentation
9. WHEN validation fails, THE System SHALL document the failure and rollback
10. THE Validation_System SHALL create production deployment checklist
11. THE Validation_System SHALL verify staging environment works after cleanup

### Requirement 16: Establish Maintenance Patterns

**User Story:** As a team lead, I want established patterns for ongoing maintenance, so that the codebase stays clean over time.

#### Acceptance Criteria

1. THE Maintenance_System SHALL create linting rules to prevent duplicate code
2. THE Maintenance_System SHALL create linting rules to prevent dead code accumulation
3. THE Maintenance_System SHALL create pre-commit hooks for code quality
4. THE Maintenance_System SHALL document code review checklist for new features
5. THE Maintenance_System SHALL document when to add to shared packages vs app-specific code
6. THE Maintenance_System SHALL document when to create new apps vs extend existing
7. THE Maintenance_System SHALL create monthly cleanup checklist
8. THE Maintenance_System SHALL document technical debt tracking process
9. THE Maintenance_System SHALL create guidelines for deprecating features
10. THE Maintenance_System SHALL document escalation path for architecture decisions

### Requirement 17: Consolidate API Route Patterns

**User Story:** As a developer, I want consistent API route patterns, so that backend endpoints follow predictable conventions.

#### Acceptance Criteria

1. THE API_System SHALL audit all API routes across apps
2. THE API_System SHALL identify duplicate API endpoint implementations
3. THE API_System SHALL identify inconsistent request/response patterns
4. THE API_System SHALL identify inconsistent error handling in API routes
5. THE API_System SHALL identify missing authentication checks in API routes
6. THE API_System SHALL create shared API utilities for common patterns
7. THE API_System SHALL define standard API response format
8. THE API_System SHALL define standard API error format
9. WHEN apps create API routes, THE apps SHALL follow standard patterns
10. THE API_System SHALL document API conventions and examples

### Requirement 18: Improve Type Safety and Shared Types

**User Story:** As a developer, I want strong type safety, so that type errors are caught at compile time.

#### Acceptance Criteria

1. THE Type_System SHALL audit TypeScript configurations across apps
2. THE Type_System SHALL identify duplicate type definitions
3. THE Type_System SHALL identify weak type definitions (any, unknown overuse)
4. THE Type_System SHALL consolidate shared types into packages
5. THE Type_System SHALL verify strict TypeScript settings are enabled
6. THE Type_System SHALL identify missing type exports from shared packages
7. THE Type_System SHALL create shared type definitions for common domain objects
8. WHEN apps need shared types, THE apps SHALL import from shared packages
9. THE Type_System SHALL verify no TypeScript errors exist after consolidation
10. THE Type_System SHALL document type organization patterns

### Requirement 19: Standardize Logging and Monitoring

**User Story:** As an operations engineer, I want consistent logging, so that debugging production issues is straightforward.

#### Acceptance Criteria

1. THE Logging_System SHALL audit logging implementations across apps
2. THE Logging_System SHALL identify inconsistent log formats
3. THE Logging_System SHALL identify missing error logging
4. THE Logging_System SHALL identify missing security event logging
5. THE Logging_System SHALL create shared logging utilities
6. THE Logging_System SHALL define standard log levels (debug, info, warn, error)
7. THE Logging_System SHALL define standard log structure (timestamp, level, message, context)
8. THE Logging_System SHALL integrate with monitoring systems (Sentry)
9. WHEN apps log events, THE apps SHALL use shared logging utilities
10. THE Logging_System SHALL document logging best practices

### Requirement 20: Create Cleanup Execution Plan

**User Story:** As a project manager, I want a phased execution plan, so that cleanup work is organized and trackable.

#### Acceptance Criteria

1. THE Planning_System SHALL create Phase 1 plan for critical security fixes
2. THE Planning_System SHALL create Phase 2 plan for auth and role consolidation
3. THE Planning_System SHALL create Phase 3 plan for UI and component consolidation
4. THE Planning_System SHALL create Phase 4 plan for dead code removal
5. THE Planning_System SHALL create Phase 5 plan for documentation and validation
6. THE Planning_System SHALL estimate effort for each phase
7. THE Planning_System SHALL identify dependencies between phases
8. THE Planning_System SHALL identify risks for each phase
9. THE Planning_System SHALL define success criteria for each phase
10. THE Planning_System SHALL create rollback plan for each phase
11. THE Planning_System SHALL assign ownership for each phase
12. THE Planning_System SHALL create progress tracking mechanism
