import "server-only";

import { getAccountUrl, getDivisionConfig, getDivisionUrl } from "@henryco/config";
import { hasAdminSupabaseEnv, createAdminSupabase } from "@/lib/supabase";

/** Studio-owned support contacts, sourced from divisionConfig (single source
 * of truth in `packages/config/company.ts`). Used as the *first* fallback
 * before reading the shared company-wide settings table — without this guard
 * the Studio contact page picked up the Care division support email
 * (care@henrycogroup.com) because the shared settings table is the Care
 * settings table. CHROME-01A. */
const studioDivision = getDivisionConfig("studio");
const STUDIO_DIVISION_SUPPORT_EMAIL = studioDivision.supportEmail || null;
const STUDIO_DIVISION_SUPPORT_PHONE = studioDivision.supportPhone || null;

export type StudioPlatformSettings = {
  currency: string;
  supportEmail: string | null;
  supportPhone: string | null;
  primaryCta: string;
  paymentBankName: string | null;
  paymentAccountName: string | null;
  paymentAccountNumber: string | null;
  paymentCurrency: string;
  paymentInstructions: string;
  paymentSupportEmail: string | null;
  paymentSupportWhatsApp: string | null;
  companyAccountName: string | null;
  companyAccountNumber: string | null;
  companyBankName: string | null;
  accountDashboardUrl: string;
  sharedLoginUrl: string;
};

type SettingsSource = Partial<Record<string, unknown>> | null | undefined;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function asNullableText(value: unknown) {
  const text = asText(value);
  return text || null;
}

export function normalizeStudioPlatformSettings(
  input?: SettingsSource,
  sharedCompanySource?: SettingsSource
): StudioPlatformSettings {
  const source = (input ?? {}) as Record<string, unknown>;
  const shared = (sharedCompanySource ?? {}) as Record<string, unknown>;

  const sharedSupportEmail = asNullableText(shared.support_email) ?? asNullableText(shared.payment_support_email);
  const sharedSupportPhone = asNullableText(shared.support_phone) ?? asNullableText(shared.payment_support_whatsapp);
  const sharedBankName =
    asNullableText(shared.payment_bank_name) ?? asNullableText(shared.company_bank_name);
  const sharedAccountName =
    asNullableText(shared.payment_account_name) ?? asNullableText(shared.company_account_name);
  const sharedAccountNumber =
    asNullableText(shared.payment_account_number) ?? asNullableText(shared.company_account_number);
  const sharedPaymentWhatsapp =
    asNullableText(shared.payment_support_whatsapp) ?? asNullableText(shared.payment_whatsapp);

  const paymentBankName =
    asNullableText(source.payment_bank_name) ??
    asNullableText(source.company_bank_name) ??
    sharedBankName;
  const paymentAccountName =
    asNullableText(source.payment_account_name) ??
    asNullableText(source.company_account_name) ??
    sharedAccountName;
  const paymentAccountNumber =
    asNullableText(source.payment_account_number) ??
    asNullableText(source.company_account_number) ??
    sharedAccountNumber;
  const paymentSupportEmail =
    asNullableText(source.payment_support_email) ??
    asNullableText(source.support_email) ??
    sharedSupportEmail;
  const paymentSupportWhatsApp =
    asNullableText(source.payment_support_whatsapp) ??
    asNullableText(source.payment_whatsapp) ??
    asNullableText(source.support_phone) ??
    sharedPaymentWhatsapp ??
    sharedSupportPhone;

  return {
    currency: asText(source.currency, "NGN"),
    supportEmail:
      asNullableText(source.support_email) ??
      STUDIO_DIVISION_SUPPORT_EMAIL ??
      sharedSupportEmail,
    supportPhone:
      asNullableText(source.support_phone) ??
      STUDIO_DIVISION_SUPPORT_PHONE ??
      sharedSupportPhone,
    primaryCta: asText(source.primary_cta, "Start a Studio project"),
    paymentBankName,
    paymentAccountName,
    paymentAccountNumber,
    paymentCurrency: asText(source.payment_currency, asText(shared.payment_currency, "NGN")),
    paymentInstructions: asText(
      source.payment_instructions,
      "Transfer the exact amount shown below, upload proof immediately inside the project workspace, and HenryCo finance confirms the payment before delivery advances."
    ),
    paymentSupportEmail,
    paymentSupportWhatsApp,
    companyAccountName:
      asNullableText(source.company_account_name) ?? paymentAccountName,
    companyAccountNumber:
      asNullableText(source.company_account_number) ?? paymentAccountNumber,
    companyBankName:
      asNullableText(source.company_bank_name) ?? paymentBankName,
    accountDashboardUrl: getAccountUrl("/studio"),
    sharedLoginUrl: getAccountUrl(
      `/login?next=${encodeURIComponent(getDivisionUrl("studio"))}`
    ),
  };
}

export async function getSharedCompanySettings() {
  if (!hasAdminSupabaseEnv()) return null;

  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin.from("care_settings").select("*").limit(1).maybeSingle();
    if (error) return null;
    return data as Record<string, unknown> | null;
  } catch {
    return null;
  }
}
