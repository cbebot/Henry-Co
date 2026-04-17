# Vercel Third-Party Services Rollout

This pass standardizes HenryCo third-party service wiring around shared helpers and explicit public-vs-server environment boundaries.

## Shared integration files

- `packages/config/integrations.ts`
  - Public env registry for OneSignal, Fingerprint, Mapbox, Stripe, Typesense, Google Calendar, and Sentry.
- `packages/config/server-integrations.ts`
  - Server-only registry for Stripe, Typesense admin/search clients, Twilio, Freshdesk, DeepL, SignWell, Mapbox secret, OpenRate, and Sentry build config.
- `packages/config/payments-client.ts`
  - Browser-safe Stripe loader for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- `packages/config/email.ts`
  - Shared Brevo transactional email transport for all server actions and routes.
- `packages/ui/src/public-shell/third-party-runtime-providers.tsx`
  - Safe client runtime wrapper for FingerprintJS Pro and the OneSignal web SDK, gated by stored HenryCo consent before optional browser runtimes initialize.

## Apps updated to use shared runtime providers

- `apps/account/app/layout.tsx`
- `apps/care/app/layout.tsx`
- `apps/hub/app/layout.tsx`
- `apps/jobs/app/layout.tsx`
- `apps/learn/app/layout.tsx`
- `apps/logistics/app/layout.tsx`
- `apps/marketplace/app/layout.tsx`
- `apps/property/app/layout.tsx`
- `apps/studio/app/layout.tsx`

## Apps updated to use Brevo for outbound email

- `apps/account/lib/email/send.ts`
- `apps/care/lib/email/send.ts`
- `apps/hub/lib/owner-reporting.ts`
- `apps/jobs/lib/jobs/notifications.ts`
- `apps/learn/lib/email/learn-templates.ts`
- `apps/logistics/lib/logistics/notify-customer.ts`
- `apps/marketplace/lib/marketplace/notifications.ts`
- `apps/property/lib/property/notifications.ts`
- `apps/studio/lib/studio/email/send.ts`

## Inbound email truth

Outbound transactional email now goes through Brevo.

Inbound support-mail routing is still explicitly treated as a separate lane. The owner inbox and Care inbound helpers now prefer generic `INBOUND_*` variables, but they still use the current provider-specific receiving path until Brevo inbound parsing is fully provisioned.

## Recommended Vercel environment groups

### Client-safe

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY` | Google Calendar browser access |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | OneSignal browser app id |
| `NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID` | OneSignal Safari web id |
| `NEXT_PUBLIC_TYPESENSE_HOST` | Typesense browser host |
| `NEXT_PUBLIC_TYPESENSE_PORT` | Typesense browser port |
| `NEXT_PUBLIC_TYPESENSE_PROTOCOL` | Typesense browser protocol |
| `NEXT_PUBLIC_TYPESENSE_NODES` | Typesense browser node list |
| `NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY` | Typesense search-only key |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox public token |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js test publishable key |
| `NEXT_PUBLIC_SENTRY_DSN` | Public Sentry DSN |
| `NEXT_PUBLIC_FINGERPRINTJS_API_KEY` | FingerprintJS Pro public API key |
| `NEXT_PUBLIC_FINGERPRINTJS_REGION` | FingerprintJS Pro region |

### Server-only

| Variable | Purpose |
| --- | --- |
| `BREVO_API_KEY` | Brevo transactional email |
| `BREVO_SENDER_NAME` | Shared sender display name |
| `BREVO_SENDER_EMAIL` | Shared sender mailbox |
| `BREVO_REPLY_TO_EMAIL` | Shared reply-to mailbox |
| `OWNER_ALERT_EMAIL` | Owner notification target |
| `MARKETPLACE_OWNER_ALERT_EMAIL` | Marketplace owner alert mailbox |
| `MARKETPLACE_SENDER_EMAIL` | Marketplace-specific sender mailbox |
| `DEEPL_API_KEY` | DeepL translation |
| `TYPESENSE_ADMIN_API_KEY` | Typesense admin key |
| `TYPESENSE_SEARCH_API_KEY` | Optional server-side search key |
| `TYPESENSE_HOST` | Typesense server host |
| `TYPESENSE_PORT` | Typesense server port |
| `TYPESENSE_PROTOCOL` | Typesense server protocol |
| `TYPESENSE_NODES` | Typesense server node list |
| `SIGNWELL_API_KEY` | SignWell API |
| `MAPBOX_SECRET_TOKEN` | Mapbox secret token |
| `TWILIO_ACCOUNT_SID` | Twilio account id |
| `TWILIO_API_KEY_SID` | Twilio API key sid |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | WhatsApp sender number |
| `STRIPE_SECRET_KEY` | Stripe test secret key |
| `SENTRY_DSN` | Server-side Sentry DSN |
| `SENTRY_AUTH_TOKEN` | Sentry build auth token |
| `SENTRY_ORG` | Sentry org slug |
| `SENTRY_PROJECT` | Sentry project slug |
| `OPENRATE_APP_ID` | OpenRate app id |
| `FRESHDESK_DOMAIN` | Freshdesk tenant domain |
| `FRESHDESK_API_KEY` | Freshdesk API key |
| `GOOGLE_CALENDAR_API_KEY` | Optional server-side calendar key |

### Inbound company-mail routing

| Variable | Purpose |
| --- | --- |
| `INBOUND_EMAIL_PROVIDER` | Current receiving provider label |
| `INBOUND_EMAIL_API_KEY` | Receiving-provider API key |
| `INBOUND_EMAIL_WEBHOOK_SECRET` | Receiving-provider webhook secret |
| `INBOUND_SUPPORT_INBOX` | Active receiving inbox |

## Example usage

### Brevo server action or route

```ts
import { sendTransactionalEmail } from "@henryco/config/email";

await sendTransactionalEmail({
  to: "customer@example.com",
  subject: "HenryCo update",
  html: "<p>Your update is ready.</p>",
  text: "Your update is ready.",
  fromName: "HenryCo",
  fromEmail: "noreply@henrycogroup.com",
  replyTo: "support@henrycogroup.com",
  tags: ["account", "transactional"],
});
```

### Stripe client and server

```ts
import { getStripeJs } from "@henryco/config/payments-client";
import { getStripeServerClient } from "@henryco/config/server-integrations";

const stripeJs = await getStripeJs();
const stripe = getStripeServerClient();
```

### Typesense

```ts
import {
  getTypesenseAdminClient,
  getTypesenseSearchClient,
} from "@henryco/config/server-integrations";

const adminClient = getTypesenseAdminClient();
const searchClient = getTypesenseSearchClient();
```

### FingerprintJS Pro

```tsx
"use client";

import { useHenryCoVisitorData } from "@henryco/ui/public-shell";

export function VisitorExample() {
  const { data, isLoading, error } = useHenryCoVisitorData({ extended: true }, { immediate: true });

  if (isLoading) return <p>Checking device trust…</p>;
  if (error) return <p>Fingerprint unavailable.</p>;

  return <p>Visitor id: {data?.visitorId ?? "missing"}</p>;
}
```

### Freshdesk

```ts
import { getFreshdeskConfig } from "@henryco/config/server-integrations";

const { apiKey, baseUrl } = getFreshdeskConfig();
const auth = Buffer.from(`${apiKey}:X`).toString("base64");

await fetch(`${baseUrl}/tickets`, {
  headers: { Authorization: `Basic ${auth}` },
});
```

## Notes

- Stripe is wired for test mode only in this pass.
- Fingerprint uses the official React package `@fingerprintjs/fingerprintjs-pro-react`.
- OneSignal is loaded with `next/script` after hydration to avoid client/server mismatches.
- FingerprintJS Pro stays disabled until the visitor has explicitly enabled the HenryCo `analytics` consent category.
- OneSignal stays disabled until the visitor has explicitly enabled the HenryCo `marketing` consent category.
- Mapbox now prefers `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`; `NEXT_PUBLIC_MAPBOX_TOKEN` remains a compatibility fallback in logistics.
