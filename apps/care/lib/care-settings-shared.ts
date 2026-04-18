export type CareSettingsRecord = {
  hero_badge: string;
  hero_badge_i18n?: Record<string, unknown> | string | null;
  hero_title: string;
  hero_title_i18n?: Record<string, unknown> | string | null;
  hero_subtitle: string;
  hero_subtitle_i18n?: Record<string, unknown> | string | null;
  about_title: string;
  about_title_i18n?: Record<string, unknown> | string | null;
  about_body: string;
  about_body_i18n?: Record<string, unknown> | string | null;
  locale_overrides?: Record<string, unknown> | string | null;
  pickup_hours: string | null;
  pricing_note: string | null;
  support_email: string | null;
  support_phone: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  hero_image_url: string | null;
  promo_video_url: string | null;
  promo_video_title: string | null;
  promo_video_body: string | null;
  public_site_url: string | null;
  care_domain: string | null;
  hub_domain: string | null;
  payment_bank_name: string | null;
  payment_account_name: string | null;
  payment_account_number: string | null;
  payment_currency: string | null;
  payment_instructions: string | null;
  payment_support_email: string | null;
  payment_support_whatsapp: string | null;
  notification_sender_name: string | null;
  notification_reply_to_email: string | null;
  company_account_name: string | null;
  company_account_number: string | null;
  company_bank_name: string | null;
  payment_whatsapp: string | null;
  picked_up_email_subject: string | null;
  picked_up_email_body: string | null;
};

type SettingsSource = Partial<CareSettingsRecord> | Record<string, unknown> | null | undefined;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function asNullableText(value: unknown) {
  const normalized = asText(value);
  return normalized || null;
}

export function normalizeCareSettings(input?: SettingsSource): CareSettingsRecord {
  const source = (input ?? {}) as Record<string, unknown>;

  const paymentBankName =
    asNullableText(source.payment_bank_name) ?? asNullableText(source.company_bank_name);
  const paymentAccountName =
    asNullableText(source.payment_account_name) ?? asNullableText(source.company_account_name);
  const paymentAccountNumber =
    asNullableText(source.payment_account_number) ?? asNullableText(source.company_account_number);
  const paymentSupportWhatsapp =
    asNullableText(source.payment_support_whatsapp) ?? asNullableText(source.payment_whatsapp);

  return {
    hero_badge: asText(source.hero_badge, "Garment, home, and workplace care"),
    hero_badge_i18n:
      source.hero_badge_i18n && typeof source.hero_badge_i18n === "object"
        ? (source.hero_badge_i18n as Record<string, unknown>)
        : asNullableText(source.hero_badge_i18n),
    hero_title: asText(
      source.hero_title,
      "Quiet service logistics for wardrobes, homes, and workplaces."
    ),
    hero_title_i18n:
      source.hero_title_i18n && typeof source.hero_title_i18n === "object"
        ? (source.hero_title_i18n as Record<string, unknown>)
        : asNullableText(source.hero_title_i18n),
    hero_subtitle: asText(
      source.hero_subtitle,
      "Book pickup, cleaning, and recurring upkeep through one polished system with clearer status, calmer support, and better follow-through."
    ),
    hero_subtitle_i18n:
      source.hero_subtitle_i18n && typeof source.hero_subtitle_i18n === "object"
        ? (source.hero_subtitle_i18n as Record<string, unknown>)
        : asNullableText(source.hero_subtitle_i18n),
    about_title: asText(source.about_title, "Built for disciplined service, not vague promises."),
    about_title_i18n:
      source.about_title_i18n && typeof source.about_title_i18n === "object"
        ? (source.about_title_i18n as Record<string, unknown>)
        : asNullableText(source.about_title_i18n),
    about_body: asText(
      source.about_body,
      "HenryCo Care is structured to keep booking, dispatch, execution, and support readable from the first request to the final handoff."
    ),
    about_body_i18n:
      source.about_body_i18n && typeof source.about_body_i18n === "object"
        ? (source.about_body_i18n as Record<string, unknown>)
        : asNullableText(source.about_body_i18n),
    locale_overrides:
      source.locale_overrides && typeof source.locale_overrides === "object"
        ? (source.locale_overrides as Record<string, unknown>)
        : asNullableText(source.locale_overrides),
    pickup_hours: asNullableText(source.pickup_hours),
    pricing_note: asNullableText(source.pricing_note),
    support_email: asNullableText(source.support_email),
    support_phone: asNullableText(source.support_phone),
    logo_url: asNullableText(source.logo_url),
    favicon_url: asNullableText(source.favicon_url),
    hero_image_url: asNullableText(source.hero_image_url),
    promo_video_url: asNullableText(source.promo_video_url),
    promo_video_title: asNullableText(source.promo_video_title),
    promo_video_body: asNullableText(source.promo_video_body),
    public_site_url: asNullableText(source.public_site_url),
    care_domain: asNullableText(source.care_domain),
    hub_domain: asNullableText(source.hub_domain),
    payment_bank_name: paymentBankName,
    payment_account_name: paymentAccountName,
    payment_account_number: paymentAccountNumber,
    payment_currency: asNullableText(source.payment_currency) ?? "NGN",
    payment_instructions: asNullableText(source.payment_instructions),
    payment_support_email:
      asNullableText(source.payment_support_email) ?? asNullableText(source.support_email),
    payment_support_whatsapp: paymentSupportWhatsapp,
    notification_sender_name: asNullableText(source.notification_sender_name),
    notification_reply_to_email:
      asNullableText(source.notification_reply_to_email) ?? asNullableText(source.support_email),
    company_account_name:
      asNullableText(source.company_account_name) ?? paymentAccountName,
    company_account_number:
      asNullableText(source.company_account_number) ?? paymentAccountNumber,
    company_bank_name: asNullableText(source.company_bank_name) ?? paymentBankName,
    payment_whatsapp: asNullableText(source.payment_whatsapp) ?? paymentSupportWhatsapp,
    picked_up_email_subject:
      asNullableText(source.picked_up_email_subject) ??
      "Your order has been picked up — payment details inside",
    picked_up_email_body: asNullableText(source.picked_up_email_body),
  };
}
