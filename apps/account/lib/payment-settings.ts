import "server-only";

import { cache } from "react";
import { createAdminSupabase } from "@/lib/supabase";

type SharedPaymentRail = {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  currency: string;
  instructions: string;
  supportEmail: string | null;
  supportWhatsApp: string | null;
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableText(value: unknown) {
  const text = asText(value);
  return text || null;
}

export const getSharedPaymentRail = cache(async (): Promise<SharedPaymentRail> => {
  const admin = createAdminSupabase();
  const { data } = await admin.from("care_settings").select("*").limit(1).maybeSingle();

  return {
    bankName:
      asNullableText(data?.payment_bank_name) ??
      asNullableText(data?.company_bank_name) ??
      "Finance configuration pending",
    accountName:
      asNullableText(data?.payment_account_name) ??
      asNullableText(data?.company_account_name) ??
      "Henry & Co.",
    accountNumber:
      asNullableText(data?.payment_account_number) ??
      asNullableText(data?.company_account_number),
    currency: asText(data?.payment_currency) || "NGN",
    instructions:
      asText(data?.payment_instructions) ||
      "Transfer the exact amount shown, keep the reference intact, and upload proof immediately so the HenryCo team can confirm the funding request.",
    supportEmail:
      asNullableText(data?.payment_support_email) ?? asNullableText(data?.support_email),
    supportWhatsApp:
      asNullableText(data?.payment_support_whatsapp) ??
      asNullableText(data?.payment_whatsapp) ??
      asNullableText(data?.support_phone),
  };
});
