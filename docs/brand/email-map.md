# HenryCo Brand Email Map

**Canonical source of truth:** `packages/config/brand-emails.ts` (typed export `BRAND_EMAILS`).
**Domain:** `henrycogroup.com` (all divisions sit on the parent group domain; division split is by local-part, not subdomain).

Every visible email address rendered on a HenryCo surface — public page, dashboard, footer,
email template, transactional notification, PDF, error page, support thread — must read from
`BRAND_EMAILS` (or the equivalent `getDivisionConfig(key).supportEmail` derived from it).
Hardcoded literals are not allowed; PASS 23 swept the repo and the regression check
(`grep -rn "@henrycogroup.com" --exclude-dir=node_modules` outside the allow list below) must
stay at zero. Allowed surfaces:
- `packages/config/brand-emails.ts` (the source of truth itself)
- `apps/company-hub/src/lib/brand-emails.ts` (Expo / RN local mirror — Metro is not yet wired
  for monorepo workspace package resolution)
- Documentation under `docs/brand/`, `docs/v3/`, `docs/staging-dataset.md`
- Database seed scripts (`apps/learn/lib/learn/seed.ts`,
  `apps/marketplace/scripts/seed-marketplace.mjs`)
- Demo / fixture data (`apps/marketplace/lib/marketplace/demo.ts`,
  `apps/property/lib/property/demo.ts`)
- SQL migrations (any file under `supabase/migrations/`)
- Input placeholder hints — already centralised in `BRAND_EMAIL_PLACEHOLDERS`

---

## Division → email map

| Division (key)              | Email                          | Used for                                                                 |
| --------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| Hub / group (`hub`)         | `hello@henrycogroup.com`       | General Henry & Co. inquiries from the group hub and the mobile app.     |
| Fabric Care (`care`)        | `care@henrycogroup.com`        | Care bookings, pickup/delivery support, customer service for Care.       |
| Building (`building`)       | `building@henrycogroup.com`    | Construction & project delivery enquiries (placeholder — site WIP).      |
| Hotels (`hotel`)            | `hotel@henrycogroup.com`       | Hospitality bookings and guest support (placeholder — site WIP).         |
| Marketplace (`marketplace`) | `marketplace@henrycogroup.com` | Marketplace buyers, vendors, vendor onboarding, automation alerts.       |
| Property (`property`)       | `property@henrycogroup.com`    | Listings, viewings, owner submissions, managed-property operations.      |
| Logistics (`logistics`)     | `logistics@henrycogroup.com`   | Pickup, dispatch, fleet, and tracking support.                           |
| Studio (`studio`)           | `studio@henrycogroup.com`      | Studio engagements, proposals, project workspace, payment workspace.     |
| Jobs (`jobs`)               | `jobs@henrycogroup.com`        | Hiring, talent, employer onboarding, jobs help.                          |
| Learn (`learn`)             | `learn@henrycogroup.com`       | Learner support, course questions, certificate verification.             |

## Cross-cutting addresses

These are functional, not divisional. They appear in legal docs, finance flows, and
account-system messaging.

| Purpose            | Email                          | Used for                                                                       |
| ------------------ | ------------------------------ | ------------------------------------------------------------------------------ |
| General/group      | `hello@henrycogroup.com`       | The hub, group company-info pages, mobile-app contact screen.                  |
| Generic support    | `support@henrycogroup.com`     | Default email-template footer when a division wasn't named.                    |
| Account system     | `accounts@henrycogroup.com`    | Auth emails, password recovery, magic links, account notifications.            |
| Finance            | `finance@henrycogroup.com`     | Invoice queries, refund disputes, payment reconciliation.                      |
| Billing            | `billing@henrycogroup.com`     | Document footers (invoices, receipts) issued by `apps/account` PDF generator.  |
| Privacy            | `privacy@henrycogroup.com`     | NDPA data-subject requests, privacy enquiries.                                 |
| Security           | `security@henrycogroup.com`    | Vulnerability disclosure, responsible-disclosure intake.                       |
| Abuse              | `abuse@henrycogroup.com`       | Acceptable-use violation reports.                                              |
| Automation actor   | `automation@henrycogroup.com`  | Synthetic actor for system-initiated audit log entries (no inbox; logs only).  |
| Noreply            | `noreply@henrycogroup.com`     | Outbound `From:` for transactional mail when a division alias isn't verified.  |

## Outbound sender configuration

`packages/email/sender-identity.ts` resolves the `From:` address per email purpose. The
fallback chain is **purpose env var → noreply env var → hard noreply literal**, with a
purpose-branded display name (e.g. "HenryCo Studio") attached so the sender label remains
correct even when only the noreply alias is verified.

To send division-branded mail from the matching alias in production, set the per-purpose
env vars (per `apps/<division>/.env` or Vercel project env):

```
HENRYCO_ACCOUNTS_EMAIL=accounts@henrycogroup.com
HENRYCO_SUPPORT_EMAIL=support@henrycogroup.com
HENRYCO_CARE_EMAIL=care@henrycogroup.com
HENRYCO_STUDIO_EMAIL=studio@henrycogroup.com
HENRYCO_MARKETPLACE_EMAIL=marketplace@henrycogroup.com
HENRYCO_JOBS_EMAIL=jobs@henrycogroup.com
HENRYCO_LEARN_EMAIL=learn@henrycogroup.com
HENRYCO_PROPERTY_EMAIL=property@henrycogroup.com
HENRYCO_LOGISTICS_EMAIL=logistics@henrycogroup.com
HENRYCO_NEWSLETTER_EMAIL=editorial@henrycogroup.com
HENRYCO_SECURITY_EMAIL=security@henrycogroup.com
HENRYCO_GENERIC_EMAIL=hello@henrycogroup.com
HENRYCO_NOREPLY_EMAIL=noreply@henrycogroup.com
```

Until each alias is DNS/SPF/DKIM verified at the sending provider (Brevo / Resend),
outbound mail will continue to leave from `noreply@henrycogroup.com` with the
division-branded display name. Visible *contact* lines (mailto links, footers, reply-to
hints) already read from `BRAND_EMAILS` and therefore display the correct division
address regardless of provider verification status.

## Pending confirmations

- `building@henrycogroup.com` and `hotel@henrycogroup.com` are reserved division aliases —
  the public sites are still pre-launch and the inboxes are not yet operationally
  monitored. They render correctly on division surfaces but should be confirmed live before
  the building/hotel sites go public.
- `editorial@henrycogroup.com` (newsletter) is the documented default name for the
  newsletter purpose; if the brand prefers `newsletter@`, update `BRAND_EMAILS.newsletter`
  and re-deploy.
