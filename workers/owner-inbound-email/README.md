# Henry Onyx — owner inbound-email Worker

Cloudflare Email Worker that receives **every** message sent to any address on
`henryonyx.com` (via Email Routing's catch-all rule), then forwards an HMAC-signed
bundle (Cloudflare's trusted envelope + auth verdict + the raw RFC822 message,
size-capped) to the hub app's `/api/inbound/email` webhook. The app parses the
MIME and stores it in the owner-only inbox with attachments in a private bucket.

**Dependency-free** by design: no npm imports, no `nodejs_compat`. It pastes and
deploys cleanly in the Cloudflare dashboard's code editor, and holds **no**
database/storage credentials — only the shared HMAC secret + the destination URL.

## Architecture

```
sender → support@ / contact@ / owner@ / anything @henryonyx.com
   │   MX: route1/2/3.mx.cloudflare.net   (added by enabling Email Routing)
   ▼
Cloudflare Email Routing  ──catch-all → Send to a Worker──▶  this Worker
   │  read trusted envelope + auth verdict · cap raw size · HMAC-sign
   ▼
POST https://hq.henryonyx.com/api/inbound/email   (x-henry-timestamp, x-henry-signature)
   ▼
hub: verify HMAC → parse MIME (postal-mime, server-side) → received_emails
     (+ private attachments) → /owner/inbox
```

## Settings (dashboard or wrangler)

| Name | Type | Value |
|---|---|---|
| `INBOUND_WEBHOOK_URL` | Variable | `https://hq.henryonyx.com/api/inbound/email` |
| `MAX_RAW_BYTES` | Variable | `2500000` (optional; default 2.5 MB) |
| `INBOUND_EMAIL_WEBHOOK_SECRET` | **Secret** | a strong random string — the SAME value set on the hub app |

## Activation

1. **Email Routing enabled** on `henryonyx.com` (adds the MX records). ✅ done.
   - SPF note: Email Routing's onboarding may replace the root SPF. Resend sends
     via the `send.henryonyx.com` subdomain (SES) + root DKIM, so sending still
     authenticates; optionally re-add `include:_spf.resend.com` to the root SPF
     for belt-and-suspenders.
2. **Deploy this Worker** — `npm install && npx wrangler deploy` (or paste
   `src/index.ts` into the dashboard editor). Set the 2 variables + the secret.
3. **Set the matching secret on the hub** (Vercel env): `INBOUND_EMAIL_WEBHOOK_SECRET`.
4. **Catch-all → Worker** — Email Routing → Routing Rules → enable Catch-all →
   Action **Send to a Worker** → `henry-onyx-inbound-email`.

## Notes / limits

- **Inbound size:** Email Routing rejects messages > 25 MiB at SMTP time.
- **Raw cap:** messages over `MAX_RAW_BYTES` (~2.5 MB) are forwarded truncated;
  the app flags `attachments_truncated`. Headers + text/html almost always fit.
- **No bounces:** on a forward failure the Worker throws (logged) but never
  `setReject()`s — senders are not bounced.
- **Workers plan:** this Worker is light (no MIME parsing), so the Free plan is
  fine; parsing happens in the app.
