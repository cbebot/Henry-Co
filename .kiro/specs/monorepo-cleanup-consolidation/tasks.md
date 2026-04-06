# Implementation Plan: Monorepo Cleanup and Consolidation

## Overview

This taskbook provides a detailed, production-safe implementation plan for cleaning up and consolidating the HenryCo monorepo. The plan follows an 8-phase approach starting with safe quick wins and progressing to more complex consolidations. Each task includes exact files to modify, validation steps, risk labels, and rollback procedures.

**Critical Context**: This is a flagship production release. Every task must be executed with extreme care, validated thoroughly, and deployed with monitoring.

**Execution Principles**:
- Preserve what is strong
- Refine what is promising
- Replace what is weak
- Remove what is stale
- Defer what is too risky
- Verify every important change
- Optimize for production-grade results

---

## Page/System Coverage Matrix

Track cleanup status across all applications and surfaces:

### Division Apps (Customer-Facing)
- **care.henrycogroup.com**: Auth consolidation needed, retired staff routes to remove
- **marketplace.henrycogroup.com**: Navigation consolidation, retired routes to remove
- **studio.henrycogroup.com**: Navigation consolidation, retired routes to remove
- **jobs.henrycogroup.com**: Retired routes to remove
- **property.henrycogroup.com**: Auth consolidation needed, retired routes to remove
- **learn.henrycogroup.com**: Retired routes to remove
- **logistics.henrycogroup.com**: Navigation consolidation

### Platform Apps (Internal/Shared)
- **account.henrycogroup.com**: Security hardening, auth boundary verification
- **henrycogroup.com (hub)**: Retired workspace routes to remove, owner nav consolidation
- **staffhq.henrycogroup.com (staff)**: Auth consolidation needed, navigation refinement

### Owner Surfaces
- **hq.henrycogroup.com (owner)**: Navigation consolidation, security verification

### Mobile Apps (DEFERRED)
- **company-hub**: Separate initiative (React Native)
- **super-app**: Separate initiative (React Native)

### Shared Packages
- **@henryco/config**: KEEP (strong implementation)
- **@henryco/ui**: Expand with consolidated components
- **@henryco/i18n**: KEEP (no changes needed)
- **@henryco/brand**: KEEP (no changes needed)
- **@henryco/auth**: CREATE (new package for auth consolidation)

---

## Tasks

### Phase 0: Expand Design into Implementation Taskbook

- [x] 0.1 Create detailed implementation taskbook
  - Created this comprehensive task breakdown
  - Included page/system coverage matrix
  - Documented validation strategy for each phase
  - Added risk labels and rollback procedures
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [x] 0.2 Create page/system coverage matrix
  - Documented all 13 applications
  - Tracked cleanup needs per app
  - Identified security needs per surface
  - Created verification tracking structure
  - _Requirements: 1.1, 1.2, 1.3, 1.9_

- [x] 0.3 Document validation strategy
  - Defined validation steps for each phase
  - Created manual testing checklists
  - Documented automated testing approach
  - Established success criteria per phase
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

---

### Phase 1: Safe Quick Wins

**Goal**: Remove dead code and stale files with zero production risk

**Risk Level**: SAFE
**Deployment Impact**: LOW (no code changes)
**Estimated Duration**: 1-2 hours

- [x] 1.1 Remove temporary directories
  - **Files to delete**:
    - `.tmp-edge-supabase-profile/` (entire directory)
    - `.codex-logs/` (entire directory)
  - **Validation**:
    ```bash
    # Verify directories don't exist
    ls -la .tmp-* .codex-logs 2>/dev/null && echo "ERROR: Directories still exist" || echo "SUCCESS: Directories removed"
    
    # Verify no references in code
    grep -r "\.tmp-" apps/ packages/ && echo "ERROR: References found" || echo "SUCCESS: No references"
    grep -r "codex-logs" apps/ packages/ && echo "ERROR: References found" || echo "SUCCESS: No references"
    
    # Verify builds pass
    pnpm run build:all
    ```
  - **Risk**: SAFE - These are local development artifacts
  - **Rollback**: Can restore from git if needed (very unlikely)
  - **Deployment Impact**: None
  - _Requirements: 7.6, 7.7, 7.8_

- [x] 1.2 Remove stale environment files
  - **Files to delete**:
    - `.env.vercel.production.account`
    - `.env.vercel.production.hub`
    - Any other `.env.pull.*` or `.env.vercel.*` files found
  - **Validation**:
    ```bash
    # Verify files don't exist
    ls -la .env.vercel.* .env.pull.* 2>/dev/null && echo "ERROR: Files still exist" || echo "SUCCESS: Files removed"
    
    # Verify no references in deployment scripts
    grep -r "env.vercel.production" .github/ vercel.json && echo "WARNING: Check references" || echo "SUCCESS: No references"
    
    # Verify builds pass
    pnpm run typecheck:all
    ```
  - **Risk**: SAFE - These are stale config files not used in deployment
  - **Rollback**: Restore from git if deployment issues occur
  - **Deployment Impact**: None (verify Vercel env vars are set correctly)
  - _Requirements: 9.10, 7.8_

- [x] 1.3 Remove unused StaffSurfaceRetired component
  - **Files to delete**:
    - `packages/ui/src/staff-surface-retired.tsx`
  - **Files to update**:
    - `packages/ui/src/index.ts` (remove export if present)
  - **Validation**:
    ```bash
    # Verify no imports of StaffSurfaceRetired
    grep -r "StaffSurfaceRetired" apps/ packages/ && echo "ERROR: Still imported" || echo "SUCCESS: No imports"
    grep -r "staff-surface-retired" apps/ packages/ && echo "ERROR: Still imported" || echo "SUCCESS: No imports"
    
    # Verify package builds
    pnpm --filter @henryco/ui build
    
    # Verify all apps build
    pnpm run build:all
    ```
  - **Risk**: SAFE - Component is already unused (verified in design doc)
  - **Rollback**: Restore file from git
  - **Deployment Impact**: None
  - _Requirements: 3.1, 3.10, 7.3_

- [x] 1.4 Update .gitignore to prevent future accumulation
  - **File to update**: `.gitignore`
  - **Add these patterns**:
    ```
    # Temporary directories
    .tmp-*
    
    # Log files
    *.log
    *.err
    *.out
    .codex-logs/
    
    # Build artifacts
    *.tsbuildinfo
    .next/trace
    
    # Environment files (use .env.example instead)
    .env.local
    .env.*.local
    .env.pull.*
    .env.vercel.*
    ```
  - **Validation**:
    ```bash
    # Test gitignore patterns
    touch .tmp-test .codex-logs/test.log test.tsbuildinfo
    git status | grep -E "(tmp-test|codex-logs|tsbuildinfo)" && echo "ERROR: Patterns not working" || echo "SUCCESS: Patterns work"
    rm .tmp-test test.tsbuildinfo
    
    # Verify no accidental ignores
    git status | grep "packages/" && echo "SUCCESS: Packages visible" || echo "ERROR: Packages ignored"
    ```
  - **Risk**: SAFE - Only affects git tracking
  - **Rollback**: Revert .gitignore changes
  - **Deployment Impact**: None
  - _Requirements: 7.8, 16.2_

- [x] 1.5 Document architecture and current state
  - **Files to create/update**:
    - `docs/architecture-summary.md` (update with cleanup context)
    - `docs/cleanup-phase1-completion.md` (create completion report)
  - **Content to document**:
    - Current monorepo structure (13 apps, 4 packages)
    - Application boundaries (public vs internal vs owner surfaces)
    - Authentication boundaries (current fragmented state)
    - Routing boundaries (subdomain routing)
    - Database boundaries (shared vs division-specific tables)
    - Phase 1 completion status and findings
  - **Validation**:
    ```bash
    # Verify documentation exists
    test -f docs/architecture-summary.md && echo "SUCCESS: Architecture doc exists" || echo "ERROR: Missing doc"
    test -f docs/cleanup-phase1-completion.md && echo "SUCCESS: Completion report exists" || echo "ERROR: Missing report"
    
    # Verify markdown is valid
    npx markdownlint docs/architecture-summary.md docs/cleanup-phase1-completion.md
    ```
  - **Risk**: SAFE - Documentation only
  - **Rollback**: N/A
  - **Deployment Impact**: None
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.14_

- [x] 1.6 Phase 1 Checkpoint - Verify all builds and tests pass
  - **Validation checklist**:
    ```bash
    # Run full validation suite
    pnpm run lint:all
    pnpm run typecheck:all
    pnpm run test:workspace
    pnpm run build:all
    
    # Verify repository size reduced
    du -sh . && echo "Check if size decreased from baseline"
    
    # Verify no broken imports
    grep -r "staff-surface-retired" apps/ packages/ && echo "ERROR: Broken imports" || echo "SUCCESS: No broken imports"
    ```
  - **Success criteria**:
    - All linting passes
    - All type checking passes
    - All tests pass
    - All apps build successfully
    - Repository size reduced
    - No broken imports
  - **If any check fails**: Stop and investigate before proceeding to Phase 2
  - _Requirements: 15.1, 15.2, 15.3, 15.7_

---

### Phase 2: Auth/Routing/Boundary Consolidation

**Goal**: Create @henryco/auth package and begin migration

**Risk Level**: HIGH
**Deployment Impact**: HIGH (affects authentication)
**Estimated Duration**: 2-3 weeks

**ADDENDUM INTEGRATION**: This phase now includes cross-site signed-in recognition fixes and profile picture rendering fixes as part of auth/session consolidation.

- [ ] 2.1 Create @henryco/auth package structure
  - **Files to create**:
    - `packages/auth/package.json`
    - `packages/auth/tsconfig.json`
    - `packages/auth/src/index.ts`
    - `packages/auth/src/types.ts`
    - `packages/auth/src/server.ts`
    - `packages/auth/src/permissions.ts`
    - `packages/auth/src/session.ts`
    - `packages/auth/README.md`
  - **package.json content**:
    ```json
    {
      "name": "@henryco/auth",
      "version": "0.1.0",
      "main": "./src/index.ts",
      "types": "./src/index.ts",
      "exports": {
        ".": "./src/index.ts",
        "./server": "./src/server.ts",
        "./types": "./src/types.ts"
      },
      "dependencies": {
        "@supabase/ssr": "workspace:*",
        "@supabase/supabase-js": "^2.39.0"
      },
      "devDependencies": {
        "@types/node": "^20.0.0",
        "typescript": "^5.3.0"
      }
    }
    ```
  - **Validation**:
    ```bash
    # Verify package structure
    test -d packages/auth && echo "SUCCESS: Package directory exists" || echo "ERROR: Missing directory"
    test -f packages/auth/package.json && echo "SUCCESS: package.json exists" || echo "ERROR: Missing package.json"
    
    # Install dependencies
    pnpm install
    
    # Verify package recognized by workspace
    pnpm list --filter @henryco/auth
    ```
  - **Risk**: SAFE - Just creating structure
  - **Rollback**: Delete packages/auth directory
  - **Deployment Impact**: None (not used yet)
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2.2 Define canonical auth types in @henryco/auth
  - **File**: `packages/auth/src/types.ts`
  - **Types to define**:
    ```typescript
    // Platform-wide roles
    export type PlatformRole =
      | "customer"
      | "owner"
      | "manager"
      | "support"
      | "staff"
      | "rider"
      | "finance";
    
    // Division-specific roles
    export type DivisionRole =
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
    
    // Workspace permissions
    export type WorkspacePermission =
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
    
    // Auth profile
    export type AuthProfile = {
      id: string;
      full_name: string | null;
      role: PlatformRole;
      is_frozen: boolean;
      force_reauth_after: string | null;
      deleted_at: string | null;
    };
    
    // Auth viewer
    export type AuthViewer = {
      user: User;
      profile: AuthProfile;
    };
    
    // Legacy role mapping for backward compatibility
    export type LegacyRoleMapping = {
      app: string;
      legacyRole: string;
      canonicalRole: PlatformRole | DivisionRole;
    };
    ```
  - **Validation**:
    ```bash
    # Verify types file exists and compiles
    pnpm --filter @henryco/auth exec tsc --noEmit
    
    # Verify exports
    grep "export type" packages/auth/src/types.ts | wc -l
    # Should show multiple type exports
    ```
  - **Risk**: SAFE - Type definitions only
  - **Rollback**: Revert types.ts
  - **Deployment Impact**: None
  - _Requirements: 2.2, 2.3, 18.7_



---

## ADDENDUM PHASES: Production Quality Elevation

**Added**: April 6, 2026
**Priority**: HIGH
**Context**: These phases address critical production quality issues that must be resolved before final deployment.

### Phase A: Care Public Experience Rebuild

**Goal**: Elevate Care website to premium, professional standard

**Risk Level**: MODERATE
**Deployment Impact**: MEDIUM (affects Care public website)
**Estimated Duration**: 1-2 weeks

**Business Context**: Care is NOT only fabric/laundry. Care represents broader cleaning services including:
- Dry cleaning
- Garment care
- Home cleaning
- Office cleaning
- Related premium cleaning/care services

- [x] A.1 Audit current Care public experience
  - **Pages to audit**:
    - `apps/care/app/(public)/page.tsx` - Homepage
    - `apps/care/app/(public)/services/page.tsx` - Services
    - `apps/care/app/(public)/how-it-works/page.tsx` - How it works
    - `apps/care/app/(public)/pricing/page.tsx` - Pricing
    - `apps/care/app/(public)/book/page.tsx` - Booking entry
  - **Audit criteria**:
    - Service positioning clarity
    - Brand feel and trust signals
    - UX clarity and flow
    - Copy quality and hierarchy
    - Conversion flow strength
    - Mobile responsiveness
    - Theme/light-mode readability
  - **Validation**:
    ```bash
    # Review each page manually
    # Document findings in audit report
    # Identify weak areas for improvement
    ```
  - **Risk**: SAFE - Audit only
  - **Rollback**: N/A
  - **Deployment Impact**: None
  - _Requirements: User experience, brand consistency_

- [ ] A.2 Rebuild Care homepage with premium positioning
  - **File**: `apps/care/app/(public)/page.tsx`
  - **Improvements needed**:
    - Clearer service positioning (not just fabric/laundry)
    - Stronger trust signals
    - Better visual hierarchy
    - Premium brand feel
    - Clear CTAs
    - Better mobile experience
  - **Validation**:
    ```bash
    # Build Care app
    pnpm --filter @henryco/care build
    
    # Manual testing
    # - Desktop: Check visual hierarchy, CTAs, trust signals
    # - Mobile: Check responsiveness, touch targets
    # - Light mode: Check readability
    # - Dark mode: Check contrast
    ```
  - **Risk**: MODERATE - Visual changes need careful testing
  - **Rollback**: Revert page.tsx
  - **Deployment Impact**: MEDIUM - affects Care homepage
  - _Requirements: Premium UX, brand consistency_

- [ ] A.3 Improve Care services explanation
  - **File**: `apps/care/app/(public)/services/page.tsx`
  - **Improvements needed**:
    - Broader service positioning
    - Clear service categories
    - Better descriptions
    - Trust signals
    - Clear next steps
  - **Validation**:
    ```bash
    # Build and test
    pnpm --filter @henryco/care build
    
    # Manual review of service clarity
    ```
  - **Risk**: MODERATE
  - **Rollback**: Revert services page
  - **Deployment Impact**: MEDIUM
  - _Requirements: Service clarity, user understanding_

- [ ] A.4 Strengthen Care booking flow
  - **Files**:
    - `apps/care/app/(public)/book/page.tsx`
    - `apps/care/app/(authenticated)/book/*` (if exists)
  - **Improvements needed**:
    - Auth gating clarity
    - Post-auth return-to-intent
    - Form clarity
    - Success states
    - Error handling
  - **Validation**:
    ```bash
    # Test booking flow end-to-end
    # - Unauthenticated user
    # - Authenticated user
    # - Form validation
    # - Success/error states
    ```
  - **Risk**: HIGH - Affects core conversion flow
  - **Rollback**: Revert booking pages
  - **Deployment Impact**: HIGH
  - _Requirements: Booking reliability, user satisfaction_

- [ ] A.5 Verify Care booking backend reliability
  - **Files to audit**:
    - `apps/care/app/api/bookings/route.ts` (if exists)
    - Backend write logic
    - Data validation
    - Success/failure handling
  - **Validation**:
    ```bash
    # Test booking writes
    # - Verify data reaches database
    # - Verify validation works
    # - Verify error handling
    # - Verify success confirmations
    ```
  - **Risk**: HIGH - Backend reliability critical
  - **Rollback**: Revert API changes
  - **Deployment Impact**: HIGH
  - _Requirements: Data integrity, reliability_

---

### Phase B: Cross-Site Signed-In Recognition Fix

**Goal**: Fix false signed-out states across public websites

**Risk Level**: HIGH
**Deployment Impact**: HIGH (affects all public sites)
**Estimated Duration**: 1 week

- [x] B.1 Audit cross-site session detection
  - **Files to audit**:
    - `packages/ui/src/public-shell/use-public-session.tsx`
    - `apps/*/middleware.ts` or `apps/*/proxy.ts`
    - Cookie handling logic
    - Session detection logic
  - **Issues to identify**:
    - Where signed-in state is not recognized
    - Cookie domain issues
    - Session detection failures
    - Account chip not rendering when signed in
  - **Validation**:
    ```bash
    # Manual testing across sites
    # 1. Sign in on account.henrycogroup.com
    # 2. Navigate to care.henrycogroup.com
    # 3. Verify signed-in state recognized
    # 4. Repeat for all division sites
    ```
  - **Risk**: SAFE - Audit only
  - **Rollback**: N/A
  - **Deployment Impact**: None
  - _Requirements: Session consistency_

- [ ] B.2 Fix shared session detection logic
  - **Files to update**:
    - `packages/ui/src/public-shell/use-public-session.tsx`
    - Cookie handling in proxy.ts files
  - **Fixes needed**:
    - Ensure cookie domain is `.henrycogroup.com`
    - Verify session detection works cross-subdomain
    - Fix account chip rendering logic
  - **Validation**:
    ```bash
    # Test cross-site recognition
    # - Sign in on one site
    # - Navigate to another site
    # - Verify account chip appears
    # - Verify profile dropdown works
    ```
  - **Risk**: HIGH - Affects authentication
  - **Rollback**: Revert session detection changes
  - **Deployment Impact**: HIGH
  - _Requirements: Auth consistency_

- [ ] B.3 Verify signed-in recognition across all sites
  - **Sites to test**:
    - care.henrycogroup.com
    - marketplace.henrycogroup.com
    - studio.henrycogroup.com
    - jobs.henrycogroup.com
    - learn.henrycogroup.com
    - logistics.henrycogroup.com
    - property.henrycogroup.com
  - **Test cases**:
    - Sign in on account site
    - Navigate to each division site
    - Verify account chip appears
    - Verify profile picture renders
    - Verify dropdown works
  - **Risk**: SAFE - Testing only
  - **Rollback**: N/A
  - **Deployment Impact**: None
  - _Requirements: Cross-site consistency_

---

### Phase C: Profile Picture Rendering Fix

**Goal**: Fix avatar/profile image rendering across all surfaces

**Risk Level**: MODERATE
**Deployment Impact**: MEDIUM (affects UI consistency)
**Estimated Duration**: 3-5 days

- [x] C.1 Audit profile picture rendering logic
  - **Files to audit**:
    - `packages/ui/src/public-shell/account-dropdown.tsx`
    - `packages/ui/src/public-shell/avatar-fallback.tsx`
    - `packages/config/identity.ts` (resolveUserAvatarFromSources)
  - **Issues to identify**:
    - Where real images don't display
    - Where initials show instead of images
    - Broken image URL handling
    - Image resolution/sharpness issues
  - **Validation**:
    ```bash
    # Manual testing
    # - User with profile picture
    # - User without profile picture
    # - Broken image URL
    # - Various image sizes
    ```
  - **Risk**: SAFE - Audit only
  - **Rollback**: N/A
  - **Deployment Impact**: None
  - _Requirements: Visual consistency_

- [ ] C.2 Fix avatar rendering logic
  - **Files to update**:
    - `packages/ui/src/public-shell/account-dropdown.tsx`
    - `packages/ui/src/public-shell/avatar-fallback.tsx`
  - **Fixes needed**:
    - Ensure real images display when available
    - Proper fallback to initials only when no image
    - Handle broken URLs gracefully
    - Ensure sharp rendering
  - **Validation**:
    ```bash
    # Test avatar rendering
    # - With valid image URL
    # - With broken image URL
    # - With no image URL
    # - Check sharpness and sizing
    ```
  - **Risk**: MODERATE - Visual changes
  - **Rollback**: Revert avatar components
  - **Deployment Impact**: MEDIUM
  - _Requirements: Visual quality_

- [ ] C.3 Verify profile pictures across all surfaces
  - **Surfaces to test**:
    - Public site account chips
    - Account dropdowns
    - Profile pages
    - Staff surfaces (if applicable)
  - **Test cases**:
    - User with Cloudinary image
    - User with Gravatar
    - User with no image
    - Various screen sizes
  - **Risk**: SAFE - Testing only
  - **Rollback**: N/A
  - **Deployment Impact**: None
  - _Requirements: Consistency verification_

---

### Phase D: Logistics Mobile UX Fixes

**Goal**: Fix mobile input zoom and improve booking UX

**Risk Level**: MODERATE
**Deployment Impact**: MEDIUM (affects Logistics mobile experience)
**Estimated Duration**: 3-5 days

- [ ] D.1 Fix Logistics mobile input zoom
  - **Files to update**:
    - `apps/logistics/app/(public)/book/page.tsx` (or similar)
    - Input components causing zoom
  - **Fixes needed**:
    - Add `font-size: 16px` to inputs (prevents iOS zoom)
    - Fix focus ring behavior
    - Fix whitespace/overlay issues
    - Improve touch targets
  - **Validation**:
    ```bash
    # Test on mobile devices
    # - iOS Safari
    # - Android Chrome
    # - Test input focus behavior
    # - Verify no zoom on focus
    ```
  - **Risk**: MODERATE - Mobile UX changes
  - **Rollback**: Revert input styling
  - **Deployment Impact**: MEDIUM
  - _Requirements: Mobile usability_

- [ ] D.2 Add smart address reuse for logged-in users
  - **Files to update**:
    - `apps/logistics/app/(public)/book/page.tsx`
    - Booking form logic
  - **Feature to add**:
    - Detect if user is logged in
    - Offer to use saved default address
    - Make booking flow smoother
    - Professional, friendly helper
  - **Validation**:
    ```bash
    # Test booking flow
    # - Logged-in user with saved address
    # - Logged-in user without saved address
    # - Logged-out user
    # - Verify address prefill works
    ```
  - **Risk**: MODERATE - New feature
  - **Rollback**: Revert booking form changes
  - **Deployment Impact**: MEDIUM
  - _Requirements: User convenience_

- [ ] D.3 Audit and fix Logistics form polish
  - **Files to audit**:
    - All Logistics form pages
    - Input styling
    - Button states
    - Loading states
  - **Fixes needed**:
    - Remove ugly ring behavior
    - Fix whitespace issues
    - Improve focus states
    - Polish mobile interactions
  - **Validation**:
    ```bash
    # Manual testing
    # - Desktop forms
    # - Mobile forms
    # - Focus states
    # - Loading states
    ```
  - **Risk**: MODERATE - Visual changes
  - **Rollback**: Revert styling changes
  - **Deployment Impact**: MEDIUM
  - _Requirements: Visual polish_

---

### Phase E: Shared System Preservation

**Goal**: Verify and preserve strongest shared systems

**Risk Level**: SAFE
**Deployment Impact**: LOW (verification only)
**Estimated Duration**: 2-3 days

- [ ] E.1 Verify shared loading screens work consistently
  - **Files to verify**:
    - `packages/ui/src/public-shell/public-route-loader.tsx`
    - `packages/ui/src/loading/HenryCoActivityIndicator.tsx`
  - **Verification**:
    - Loading screens render correctly
    - Consistent across all apps
    - No regressions
  - **Risk**: SAFE - Verification only
  - **Rollback**: N/A
  - **Deployment Impact**: None
  - _Requirements: Consistency_

- [ ] E.2 Verify profile drawer/account chip consistency
  - **Files to verify**:
    - `packages/ui/src/public-shell/account-dropdown.tsx`
    - `packages/ui/src/public/public-account-chip.tsx`
  - **Verification**:
    - Account chip renders consistently
    - Profile dropdown works
    - No regressions
  - **Risk**: SAFE - Verification only
  - **Rollback**: N/A
  - **Deployment Impact**: None
  - _Requirements: Consistency_

- [ ] E.3 Verify theme behavior consistency
  - **Files to verify**:
    - `packages/ui/src/theme/*`
    - Theme provider implementations
  - **Verification**:
    - Light mode readable
    - Dark mode works
    - Theme toggle works
    - No white/ghost surfaces
  - **Risk**: SAFE - Verification only
  - **Rollback**: N/A
  - **Deployment Impact**: None
  - _Requirements: Theme consistency_

---

### Phase F: Light Mode / Readability Verification

**Goal**: Ensure text remains readable in light mode

**Risk Level**: SAFE
**Deployment Impact**: LOW (verification only)
**Estimated Duration**: 1-2 days

- [ ] F.1 Audit light mode readability across all apps
  - **Apps to audit**:
    - All division apps
    - Account app
    - Hub app
    - Staff app
  - **Audit criteria**:
    - Text contrast sufficient
    - No white/ghost surfaces blocking content
    - No washed/over-transparent surfaces
    - Buttons visible and clickable
  - **Risk**: SAFE - Audit only
  - **Rollback**: N/A
  - **Deployment Impact**: None
  - _Requirements: Readability_

- [ ] F.2 Fix any light mode contrast issues found
  - **Files to update**: TBD based on audit
  - **Fixes needed**: TBD based on audit
  - **Risk**: MODERATE - Visual changes
  - **Rollback**: Revert styling changes
  - **Deployment Impact**: MEDIUM
  - _Requirements: Accessibility_

---

### Phase G: Addendum Validation

**Goal**: Validate all addendum changes

**Risk Level**: SAFE
**Deployment Impact**: LOW (validation only)
**Estimated Duration**: 2-3 days

- [ ] G.1 Build validation
  - **Command**: `pnpm run build:all`
  - **Expected**: All apps build successfully
  - **Risk**: SAFE
  - _Requirements: Build reliability_

- [ ] G.2 Type validation
  - **Command**: `pnpm run typecheck:all`
  - **Expected**: No type errors
  - **Risk**: SAFE
  - _Requirements: Type safety_

- [ ] G.3 Lint validation
  - **Command**: `pnpm run lint:all`
  - **Expected**: No lint errors
  - **Risk**: SAFE
  - _Requirements: Code quality_

- [ ] G.4 Cross-site signed-in recognition validation
  - **Manual testing**:
    - Sign in on account site
    - Navigate to all division sites
    - Verify account chip appears
    - Verify profile picture renders
  - **Risk**: SAFE - Testing only
  - _Requirements: Auth consistency_

- [ ] G.5 Profile picture rendering validation
  - **Manual testing**:
    - Test with real profile pictures
    - Test with no profile pictures
    - Test with broken URLs
    - Verify fallback behavior
  - **Risk**: SAFE - Testing only
  - _Requirements: Visual consistency_

- [ ] G.6 Care booking flow validation
  - **Manual testing**:
    - Test unauthenticated booking
    - Test authenticated booking
    - Test form validation
    - Test success/error states
  - **Risk**: SAFE - Testing only
  - _Requirements: Booking reliability_

- [ ] G.7 Logistics mobile validation
  - **Manual testing**:
    - Test on iOS Safari
    - Test on Android Chrome
    - Verify no input zoom
    - Verify address reuse works
  - **Risk**: SAFE - Testing only
  - _Requirements: Mobile usability_

- [ ] G.8 Light mode readability validation
  - **Manual testing**:
    - Test all apps in light mode
    - Verify text contrast
    - Verify no ghost surfaces
    - Verify buttons visible
  - **Risk**: SAFE - Testing only
  - _Requirements: Readability_

- [ ] G.9 Desktop/mobile responsiveness validation
  - **Manual testing**:
    - Test all changed pages on desktop
    - Test all changed pages on mobile
    - Verify responsive behavior
    - Verify touch targets
  - **Risk**: SAFE - Testing only
  - _Requirements: Responsiveness_

- [ ] G.10 Shared system consistency validation
  - **Manual testing**:
    - Verify loading screens consistent
    - Verify profile drawer consistent
    - Verify navigation consistent
    - Verify theme behavior consistent
  - **Risk**: SAFE - Testing only
  - _Requirements: System consistency_

---

## Addendum Summary

**Total Addendum Phases**: 7 (A-G)
**Total Addendum Tasks**: 30+
**Estimated Total Duration**: 4-6 weeks
**Overall Risk Level**: MODERATE to HIGH
**Overall Deployment Impact**: MEDIUM to HIGH

**Critical Path**:
1. Phase A: Care rebuild (1-2 weeks)
2. Phase B: Cross-site auth (1 week)
3. Phase C: Profile pictures (3-5 days)
4. Phase D: Logistics mobile (3-5 days)
5. Phase E-F: Verification (3-4 days)
6. Phase G: Validation (2-3 days)

**Success Criteria**:
- ✅ Care website feels premium and professional
- ✅ Cross-site signed-in recognition works
- ✅ Profile pictures render correctly
- ✅ Logistics mobile experience polished
- ✅ All shared systems preserved
- ✅ Light mode readable everywhere
- ✅ All validation passes

**Next Steps After Addendum**:
- Continue with original Phase 2 (Auth consolidation)
- Continue with original Phase 3 (Navigation consolidation)
- Final production deployment preparation
