import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { normalizeTrustedRedirect } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import Logo from "@/components/brand/Logo";
import { getAccountAppLocale } from "@/lib/locale-server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { resolvePaymentCallbackReference } from "@/lib/payment-callback-reference";
import { CallbackCard } from "./CallbackCard";
import { PaymentCallbackClient } from "./PaymentCallbackClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment — Henry Onyx" };

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4 py-10">
      <div className="w-full max-w-md acct-fade-in">
        <div className="mb-8 flex items-center justify-center">
          <Logo size={44} />
        </div>
        {children}
      </div>
    </div>
  );
}

export default async function PaymentCallbackPage({
  searchParams,
}: {
  // Paystack returns ?reference=&trxref=; Flutterwave returns ?tx_ref=&status=&
  // transaction_id= (V3-16). The resolver maps either onto our intent UUID.
  searchParams: Promise<{
    reference?: string;
    trxref?: string;
    tx_ref?: string;
    transaction_id?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  // Provider-agnostic: the value IS our payment_intents.id, shape-validated before
  // any DB cast. null → missing/invalid (handled below as the error card).
  const reference = resolvePaymentCallbackReference(params);

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The buyer carries their session back from hosted checkout; if it is missing
  // (deep-link / different browser), send them through login preserving the return.
  if (!user) {
    const back = `/payments/callback${reference ? `?reference=${encodeURIComponent(reference)}` : ""}`;
    redirect(`/login?next=${encodeURIComponent(normalizeTrustedRedirect(back))}`);
  }

  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  if (!reference) {
    return (
      <Shell>
        <CallbackCard
          tone="error"
          eyebrow={t("Payment")}
          title={t("We couldn't find this payment")}
          body={t("This payment link is missing or invalid. Open your account to review your payments.")}
        />
      </Shell>
    );
  }

  // RLS (payment_intents_select_own) scopes this to the buyer's own intent.
  const { data, error } = await supabase
    .from("payment_intents")
    .select("id, amount_minor, currency, status, metadata")
    .eq("id", reference)
    .maybeSingle();
  const intent = (data ?? null) as
    | { id: string; amount_minor: number; currency: string; status: string; metadata: { return_to?: string } | null }
    | null;

  if (error || !intent) {
    return (
      <Shell>
        <CallbackCard
          tone="error"
          eyebrow={t("Payment")}
          title={t("We couldn't find this payment")}
          body={t("We couldn't match this payment to your account. Open your account to review your payments.")}
        />
      </Shell>
    );
  }

  // Bring the buyer back to exactly where they started (their order/project),
  // re-validated against trusted Henry Onyx targets (defense in depth — the
  // value was already validated at initiation). "/" means no real origin.
  const rawReturn = intent.metadata?.return_to ?? null;
  const normalizedReturn = rawReturn ? normalizeTrustedRedirect(rawReturn) : "/";
  const returnTo = normalizedReturn !== "/" ? normalizedReturn : null;

  return (
    <Shell>
      <PaymentCallbackClient
        intentId={intent.id}
        initialStatus={intent.status}
        amountMinor={intent.amount_minor}
        currency={intent.currency}
        locale={locale}
        returnTo={returnTo}
      />
    </Shell>
  );
}
