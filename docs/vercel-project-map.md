# Vercel project map (production hardening baseline)

This map is the deployment source of truth for web apps in this monorepo.

## Web projects

| App | Root directory | Primary domain | Preview requirement | Shared package impact |
| --- | --- | --- | --- | --- |
| Hub | `apps/hub` | `hq.henrycogroup.com` | Required for owner/workspace PRs | `@henryco/config`, `@henryco/ui`, `@henryco/i18n` |
| Account | `apps/account` | `account.henrycogroup.com` | Required for account/support/wallet PRs | `@henryco/config`, `@henryco/ui`, `@henryco/intelligence` |
| Staff | `apps/staff` | `staff.henrycogroup.com` | Required for staff workflow PRs | `@henryco/config`, `@henryco/ui`, `@henryco/intelligence` |
| Care | `apps/care` | `care.henrycogroup.com` | Required for support/booking PRs | `@henryco/config`, `@henryco/ui` |
| Studio | `apps/studio` | `studio.henrycogroup.com` | Required for project/support PRs | `@henryco/config`, `@henryco/ui` |
| Marketplace | `apps/marketplace` | `marketplace.henrycogroup.com` | Required for catalog/order/moderation PRs | `@henryco/config`, `@henryco/ui` |
| Property | `apps/property` | `property.henrycogroup.com` | Required for listing/submission PRs | `@henryco/config`, `@henryco/ui` |
| Logistics | `apps/logistics` | `logistics.henrycogroup.com` | Required for automation/tracking PRs | `@henryco/config`, `@henryco/ui` |
| Jobs | `apps/jobs` | `jobs.henrycogroup.com` | Required for alerts/applications PRs | `@henryco/config`, `@henryco/ui` |
| Learn | `apps/learn` | `learn.henrycogroup.com` | Required for learner/instructor PRs | `@henryco/config`, `@henryco/ui` |

## Release safety rules

- Any change under `packages/*` must trigger redeploy of all affected apps in `docs/redeploy-impact-matrix.md`.
- Any change under `apps/*/app/api/**` requires endpoint smoke checks before production promotion.
- Any change to role or auth logic requires staff/hub access sanity checks before promotion.
- Production promotion must only happen after preview smoke checks pass and required reviewer approval is complete.

