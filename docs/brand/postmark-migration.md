# Email migration: Amazon SES → Postmark (EMAIL-POSTMARK, 2026-07-14)

Henry Onyx outbound email now ships exclusively through **Postmark**. Amazon SES — and the
earlier Resend/Brevo rails — are permanently retired. This is a code invariant, not an env
toggle: `resolveProviderChain()` in `packages/email/send.ts` is structurally `["postmark"]`,
so a stray `AWS_SES_*` / `RESEND_*` / `BREVO_*` value on any deployment can never re-route
mail through a dead vendor.

Every email that leaves the company — from the founder/owner dashboard, division apps, cron
workers, auth hooks, newsletters — routes through the one shared entrypoint
`sendTransactionalEmail()` and therefore through Postmark.

> **Inbound is separate.** Receiving customer replies (support threads) still uses Resend
> inbound webhooks. That is mail coming *in*, not going *out*, and is intentionally **not**
> migrated here. It can be moved to Postmark Inbound as a follow-up.

## Architecture

| Piece | File |
| --- | --- |
| Single send entrypoint | `packages/email/send.ts` → `sendTransactionalEmail()` |
| Postmark provider (dependency-free HTTPS) | `packages/email/providers/postmark.ts` |
| Per-division From identity | `packages/email/sender-identity.ts` |
| `purpose` → Message Stream mapping | `resolvePostmarkStream()` in the provider |
| DB constraint allowing `email_provider='postmark'` | `apps/hub/supabase/migrations/20260714090000_email_provider_allow_postmark.sql` |

The provider talks to Postmark's HTTP API directly (a single `X-Postmark-Server-Token` header),
so there is **no `postmark` SDK dependency** and it runs on both the Node and Edge runtimes —
the same zero-dependency approach the SES rail used.

## One shared token, all subdomains

`POSTMARK_SERVER_TOKEN` (alias `POSTMARK_API_TOKEN`) is the **only** credential. A single
Postmark **Server** token can access **every Message Stream** on that server, so one secret
in the shared environment system (Vercel team env / Doppler / Infisical / SSM) auto-syncs to
every subdomain deployment after merge. **Do not** create per-subdomain or per-division tokens.

## Message Streams (create these in the Postmark dashboard before cutover)

Streams isolate sender reputation so a bounce storm in one division can't taint another.

| Purpose(s) | Stream ID | Type |
| --- | --- | --- |
| auth, support, generic, jobs, learn, logistics, marketplace | `outbound` (Postmark built-in) | Transactional |
| care | `fabric-care` | Transactional |
| studio | `studio-notifications` | Transactional |
| property | `property-inquiries` | Transactional |
| security / owner reports | `software-alerts` | Transactional |
| newsletter | `marketing-broadcast` | Broadcast |

Transactional purposes ride Postmark's built-in `outbound` stream (always present, zero setup).
Only the five custom streams above must be created. A specific send can override its stream via
the `messageStream` field on `sendTransactionalEmail(...)`.

## Pre-merge: Postmark dashboard steps

1. Create a **Server** (e.g. "Henry Onyx Production"); copy its **Server API Token**.
2. Create the five custom **Message Streams** above (transactional-type, plus one broadcast).
3. Add a **verified sending domain** for `henryonyx.com`: publish Postmark's **DKIM** TXT and
   **Return-Path CNAME** records. One domain verification covers every `@henryonyx.com` alias.
4. Confirm/adjust **DMARC** for `henryonyx.com` (Postmark can monitor it).

## Post-merge checklist

- [ ] Set `POSTMARK_SERVER_TOKEN` in the **shared** env system (never in `vercel-env-exports/`).
- [ ] Optionally set the per-division `HENRYCO_*_EMAIL` aliases (see `packages/email/.env.example`).
- [ ] Confirm DKIM / Return-Path / DMARC are green in Postmark.
- [ ] Apply the DB migration (`...allow_postmark.sql`) so delivery logging accepts `'postmark'`.
- [ ] Send a test from each stream/division; confirm From alias + stream are correct.
- [ ] **Rotate the old Amazon SES IAM access keys** and remove the SES sending identity / IAM
      policy — nothing references them anymore.
- [ ] **Rotate** any secrets that were ever present in `vercel-env-exports/` and keep that
      directory out of git (now enforced by `.gitignore`).

## Security notes

- No secrets are hardcoded: the token comes only from env; `packages/email/.env.example` holds
  placeholders and a retired-vars tombstone.
- The provider never logs the token or the request body; provider errors are truncated to a
  safe 280-char string via `safeProviderError`.
- `.gitignore` was hardened to deny `.env`, `.env.*` (except `.env.example`),
  `.env.production`, and `vercel-env-exports/`, so live secrets can't be committed by accident.

## Rollback

Because routing is env-gated by the presence of `POSTMARK_SERVER_TOKEN`, unsetting it makes the
router report `skipped` (no crash). A true rollback to a prior vendor would require restoring
that provider module from git history — deliberately not kept in-tree.
