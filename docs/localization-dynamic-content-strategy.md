# Localization Dynamic Content Strategy

## Scope

This document defines the safe localization boundary for HenryCo dynamic content after the final localization reliability pass.

Static UI copy is translated in-repo through `@henryco/i18n`.
Dynamic content does not translate automatically just because the UI locale changes.

## Current production-safe model

1. Static UI copy
   Repo-controlled labels, buttons, validation text, consent copy, shell copy, and account/care/auth surfaces use `@henryco/i18n`.

2. System-generated dynamic copy
   Notifications, activity summaries, and transactional messages should use a stable `message_key` plus `params`, then render through locale-aware templates.

3. User-generated content
   Support messages, marketplace listings, job postings, property descriptions, course copy, and similar authored content remain in the original language unless an approved server-side translation workflow is explicitly invoked.

4. Machine translation
   DeepL stays server-side only. The client must never call DeepL directly or hold DeepL credentials.

## Supported record shapes

For dynamic records that can safely store curated translations, use one of these shapes:

```ts
type LocalizedRecordShape = {
  title?: string | null;
  title_i18n?: Partial<Record<AppLocale, string>> | null;
  description?: string | null;
  description_i18n?: Partial<Record<AppLocale, string>> | null;
  locale_overrides?: {
    [field: string]: Partial<Record<AppLocale, string>>;
  } | {
    [locale in AppLocale]?: Record<string, string>;
  } | null;
};
```

`packages/i18n/src/dynamic-content.ts` currently resolves dynamic fields in this order:

1. `<field>_i18n[locale]`
2. `locale_overrides[field][locale]`
3. `locale_overrides[locale][field]`
4. source field value when source locale matches
5. optional server-side DeepL translation
6. supplied fallback

## Notification and system-message model

System-generated notifications should store localization metadata in `detail_payload.localization`:

```ts
type NotificationLocalizationPayload = {
  key: string;
  locale: AppLocale;
  params: Record<string, unknown>;
  rendered: {
    title: string;
    body: string;
  };
};
```

Required rules:

- `key` is the durable template identifier.
- `params` contains only serializable render inputs.
- `rendered` keeps the original fallback text so older clients and unknown keys do not break.
- UI renderers should prefer locale-aware template rendering, then fall back to stored rendered text.
- User-authored message bodies must not be replaced by machine-translated versions in-place.

## Recommended storage targets by domain

- `customer_notifications`
  Use `detail_payload.localization` for system notifications.
- `customer_activity`
  Prefer `activity_type` plus typed metadata for future localized summaries instead of storing final English-only prose.
- `support_threads` and `support_messages`
  Keep customer/staff authored text original. If translated views are added later, store them separately from the source message.
- Marketplace products and stores
  Add `name_i18n`, `summary_i18n`, and `description_i18n` only for merchant-approved or curated translations.
- Jobs
  Add `title_i18n`, `summary_i18n`, `requirements_i18n`, and `benefits_i18n` only when employers or ops explicitly approve translated variants.
- Learn courses
  Add localized title/summary/module fields only for reviewed educational content.
- Property listings
  Keep seller-authored descriptions original unless translated by an approved moderation flow.
- Care service records
  Service catalog and operational status copy can use repo or ops-managed localized fields. Customer notes stay original.

## Caching approach

- Cache translated dynamic fields by `record_id + field + source_hash + locale`.
- Invalidate cache when the source field or reviewed localized field changes.
- Do not cache machine-translated text forever without a source hash.
- Prefer database-stored reviewed translations over regeneration.

## Moderation and safety constraints

- User-authored content may contain abuse, regulated claims, PII, or legal/commercial nuance. Translation can amplify moderation risk.
- Never overwrite the source text with translated output.
- Preserve the original language and the source locale when storing approved translations.
- Flag machine-translated content as machine-generated if it is ever shown to staff or customers.
- Review regulated flows separately: hiring, property, medical-adjacent care notes, payments, compliance, and dispute content.

## Deferred follow-up work

1. Add typed `message_key` registries for more notification categories beyond support creation.
2. Replace freeform English `customer_activity.title` and `customer_activity.description` writes with typed keys plus params where possible.
3. Introduce reviewed translation columns for marketplace, jobs, learn, property, and care catalog records.
4. Add translation cache tables keyed by source hash and locale.
5. Add staff moderation tooling for approving translated variants.
6. Plan Resend to Brevo migration separately from localization so email provider risk stays isolated.
