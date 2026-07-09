# Henry Onyx Brand Email Map

**Canonical source of truth:** `packages/config/brand-emails.ts` (typed export `BRAND_EMAILS`).
**Domain:** `henryonyx.com` (all divisions sit on the parent group domain; the division
split is by local-part, not subdomain).
**Transport:** Amazon **SES only** (`packages/email/providers/ses.ts`). Resend and Brevo are
permanently retired — see `packages/email/send.ts` (`resolveProviderChain` is structurally
`["ses"]`).

Every visible email address rendered on a Henry Onyx surface — public page, dashboard,
footer, email template, transactional notification, PDF, error page, support thread — must
read from `BRAND_EMAILS` (or the equivalent `getDivisionConfig(key).supportEmail` derived
from it). Hardcoded literals are not allowed; the regression check
(`grep -rn "@henrycogroup.com"` for the retired domain, and hardcoded `@henryonyx.com`
outside the allow list below) must stay at zero. Allowed surfaces:
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

| Division (key)              | Email                        | Used for                                                                 |
| --------------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| Hub / group (`hub`)         | `hello@henryonyx.com`        | General Henry Onyx inquiries from the group hub and the mobile app.      |
| Fabric Care (`care`)        | `care@henryonyx.com`         | Care bookings, pickup/delivery support, customer service for Care.       |
| Building (`building`)       | `building@henryonyx.com`     | Construction & project delivery enquiries (placeholder — site WIP).      |
| Hotels (`hotel`)            | `hotel@henryonyx.com`        | Hospitality bookings and guest support (placeholder — site WIP).         |
| Marketplace (`marketplace`) | `marketplace@henryonyx.com`  | Marketplace buyers, vendors, vendor onboarding, automation alerts.       |
| Property (`property`)       | `property@henryonyx.com`     | Listings, viewings, owner submissions, managed-property operations.      |
| Logistics (`logistics`)     | `logistics@henryonyx.com`    | Pickup, dispatch, fleet, and tracking support.                           |
| Studio (`studio`)           | `studio@henryonyx.com`       | Studio engagements, proposals, project workspace, payment workspace.     |
| Jobs (`jobs`)               | `jobs@henryonyx.com`         | Hiring, talent, employer onboarding, jobs help.                          |
| Learn (`learn`)             | `learn@henryonyx.com`        | Learner support, course questions, certificate verification.            |

## Cross-cutting addresses

These are functional, not divisional. They appear in legal docs, finance flows, and
account-system messaging.

| Purpose            | Email                        | Used for                                                                       |
| ------------------ | ---------------------------- | ------------------------------------------------------------------------------ |
| General/group      | `hello@henryonyx.com`        | The hub, group company-info pages, mobile-app contact screen.                  |
| Generic support    | `support@henryonyx.com`      | Default email-template footer when a division wasn't named.                    |
| Account system     | `accounts@henryonyx.com`     | Auth emails, password recovery, magic links, account notifications.            |
| Finance            | `finance@henryonyx.com`      | Invoice queries, refund disputes, payment reconciliation.                      |
| Billing            | `billing@henryonyx.com`      | Document footers (invoices, receipts) issued by `apps/account` PDF generator.  |
| Privacy            | `privacy@henryonyx.com`      | NDPA data-subject requests, privacy enquiries.                                 |
| Legal              | `legal@henryonyx.com`        | Legal notices and contract correspondence.                                     |
| DPO                | `dpo@henryonyx.com`          | Data-protection officer contact.                                               |
| Security           | `security@henryonyx.com`     | Vulnerability disclosure, responsible-disclosure intake.                       |
| Abuse              | `abuse@henryonyx.com`        | Acceptable-use violation reports.                                              |
| Newsletter         | `editorial@henryonyx.com`    | Editorial / newsletter sends.                                                  |
| Automation actor   | `automation@henryonyx.com`   | Synthetic actor for system-initiated audit log entries (no inbox; logs only).  |
| Noreply            | `noreply@henryonyx.com`      | Outbound `From:` fallback for transactional mail when a division alias isn't set. |

## Outbound sender configuration (SES)

`packages/email/sender-identity.ts` resolves the `From:` address **per division/purpose**,
so each subdomain sends under its own sender identity. The fallback chain is
**purpose env var → noreply env var → hard noreply literal**, with a purpose-branded display
name (e.g. "Henry Onyx Studio") attached so the sender label stays correct even when only the
noreply alias is set.

The from-addresses are verified in the **Amazon SES console**. To route division-branded mail
from the matching alias, set the per-purpose env vars (per `apps/<division>/.env` or the
Vercel project env). The values are `<local>@henryonyx.com` from the map above:

```
HENRYCO_ACCOUNTS_EMAIL=accounts@henryonyx.com      # "Henry Onyx Accounts"
HENRYCO_SUPPORT_EMAIL=support@henryonyx.com        # "Henry Onyx Support"
HENRYCO_CARE_EMAIL=care@henryonyx.com              # "Henry Onyx Care"
HENRYCO_STUDIO_EMAIL=studio@henryonyx.com          # "Henry Onyx Studio"
HENRYCO_MARKETPLACE_EMAIL=marketplace@henryonyx.com# "Henry Onyx Marketplace"
HENRYCO_JOBS_EMAIL=jobs@henryonyx.com              # "Henry Onyx Jobs"
HENRYCO_LEARN_EMAIL=learn@henryonyx.com            # "Henry Onyx Learn"
HENRYCO_PROPERTY_EMAIL=property@henryonyx.com      # "Henry Onyx Property"
HENRYCO_LOGISTICS_EMAIL=logistics@henryonyx.com    # "Henry Onyx Logistics"
HENRYCO_NEWSLETTER_EMAIL=editorial@henryonyx.com   # "Henry Onyx Editorial"
HENRYCO_SECURITY_EMAIL=security@henryonyx.com      # "Henry Onyx Security"
HENRYCO_GENERIC_EMAIL=hello@henryonyx.com          # "Henry Onyx"
HENRYCO_NOREPLY_EMAIL=noreply@henryonyx.com        # noreply fallback
AWS_SES_FROM_EMAIL=noreply@henryonyx.com           # SES-level default From (when no purpose var)
```

> The `HENRYCO_*` env-var **names** keep the internal code shorthand — they are identifiers,
> never rendered. The display names and addresses are all "Henry Onyx" / `@henryonyx.com`.

Set `AWS_SES_ACCESS_KEY_ID` / `AWS_SES_SECRET_ACCESS_KEY` / `AWS_SES_REGION` (or the standard
`AWS_*` equivalents) to activate SES. With no SES credentials the router reports `skipped`
(no vendor fallback — Resend/Brevo are gone).

## Pending confirmations

- `building@henryonyx.com` and `hotel@henryonyx.com` are reserved division aliases — the
  public sites are still pre-launch and the inboxes are not yet operationally monitored.
- If the brand prefers `newsletter@` over `editorial@`, update `BRAND_EMAILS.newsletter` and
  redeploy.
