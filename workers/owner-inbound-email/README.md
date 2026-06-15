# Henry Onyx — owner inbound-email Worker

Cloudflare Email Worker that receives **every** message sent to any address on
`henryonyx.com` (via Email Routing's catch-all rule), parses it, and forwards a
signed JSON payload to the hub app's `/api/inbound/email` webhook. The hub stores
it in the owner-only inbox (Supabase) with attachments in a private bucket.

This Worker holds **no** database or storage credentials — only the shared HMAC
secret and the destination URL. It is deployed independently of the pnpm
monorepo (it is not in `pnpm-workspace.yaml`).

## Architecture

```
sender → support@ / contact@ / owner@ / anything @henryonyx.com
   │   MX: route1/2/3.mx.cloudflare.net   (added by enabling Email Routing)
   ▼
Cloudflare Email Routing  ──catch-all → Send to a Worker──▶  this Worker
   │  parse MIME (postal-mime), cap big attachments, HMAC-sign
   ▼
POST https://<hub>/api/inbound/email     (x-henry-timestamp, x-henry-signature)
   ▼
hub: verify HMAC → store in received_emails (+ private attachments) → /owner/inbox
```

## One-time activation (owner)

**Prerequisite — enable Email Routing on the domain (adds the MX records).**
`henryonyx.com` is already on Cloudflare DNS, so this is a few clicks:

1. Cloudflare dashboard → **Email Service → Email Routing → Onboard Domain** →
   choose `henryonyx.com`. It adds the MX + routing SPF/DKIM records.
   - ⚠️ **SPF merge:** the existing record is `v=spf1 include:_spf.resend.com ~all`.
     When prompted, the routing SPF must be **merged**, not overwritten:
     `v=spf1 include:_spf.resend.com include:_spf.mx.cloudflare.net ~all`.
     Overwriting it would break outbound Resend mail (SPF failure). Leave the
     Resend sending records (`cf-bounce` / DKIM) alone.

**Deploy the Worker:**

```bash
cd workers/owner-inbound-email
npm install

# Generate a strong shared secret (use the SAME value on the hub app):
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npx wrangler secret put INBOUND_EMAIL_WEBHOOK_SECRET

# Set INBOUND_WEBHOOK_URL in wrangler.toml to the deployed hub URL first, then:
npx wrangler deploy
```

**Point the catch-all at the Worker:**

3. Cloudflare dashboard → **Email Routing → Routing Rules** → enable the
   **Catch-all rule** → Action **Send to a Worker** → select
   `henry-onyx-inbound-email`. (Catch-all captures every local-part, including
   addresses not in `brand-emails.ts` such as `contact@` and `owner@`.)

**Set the matching secret on the hub app** (Vercel env or `.env`):

```
INBOUND_EMAIL_WEBHOOK_SECRET=<same value as the Worker secret>
```

## Notes / limits

- **Inbound size:** Email Routing rejects messages > 25 MiB at SMTP time.
- **Attachment cap:** attachments beyond `MAX_INLINE_BASE64_BYTES` (default
  ~3.5 MB total) are recorded as metadata-only (`captured:false`) so the POST
  stays under the app's serverless body limit. The owner UI shows when an
  attachment was too large to capture. To capture large attachments in future,
  have the Worker upload them to R2/Supabase directly (needs a scoped token).
- **Workers plan:** parsing a large MIME message can be CPU-heavy. On the
  Workers **Free** plan a complex message may hit `EXCEEDED_CPU`; the Paid plan
  ($5/mo) raises the limit. Failed invocations show in Workers logs.
- **No bounces:** on a forward failure the Worker throws (logged + retried) but
  never `setReject()`s — we don't bounce the sender.
- **Local dev:** `npx wrangler dev` then send a test message per
  <https://developers.cloudflare.com/email-service/local-development/routing/>.
