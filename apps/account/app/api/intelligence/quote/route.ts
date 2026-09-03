import { NextResponse, type NextRequest } from "next/server";

import { quoteCapability } from "@henryco/ai-gateway/server";
import { getCapability } from "@henryco/ai-gateway";
import { resolveDisplayCurrencyForCountry, convertMinorUnits, SYSTEM_BASE_CURRENCY } from "@henryco/pricing";
import { createSupabaseServer } from "@/lib/supabase/server";
import { intelligenceCorsHeaders as corsHeaders, intelligencePreflight } from "@/lib/intelligence/cors";

export const runtime = "nodejs";

export function OPTIONS(request: NextRequest) {
  return intelligencePreflight(request);
}

/**
 * POST /api/intelligence/quote — the exact price of a chargeable deep-work capability, shown
 * BEFORE it runs. No wallet is touched here; this only computes the upper-bound total (the
 * same figure the run reserves), so the person sees the truth before confirming. Deep work is
 * paid, so it requires a signed-in person (an anonymous visitor has no wallet).
 *
 * Flag-dark behind NEXT_PUBLIC_INTELLIGENCE_LIVE, same as the launcher.
 */
export async function POST(request: NextRequest) {
  const cors = corsHeaders(request);
  if (process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE !== "1") {
    return NextResponse.json({ error: "Not available." }, { status: 404, headers: cors });
  }

  const body = (await request.json().catch(() => null)) as {
    capabilityKey?: unknown;
    input?: unknown;
  } | null;
  const capabilityKey = typeof body?.capabilityKey === "string" ? body.capabilityKey : "";
  const input = typeof body?.input === "string" ? body.input.slice(0, 6000) : "";

  const capability = getCapability(capabilityKey);
  if (!capability) {
    return NextResponse.json({ error: "That deep-work option is not available." }, { status: 400, headers: cors });
  }

  // Paid work needs a wallet, so it needs a signed-in person (identity from the cookie).
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to run this, so it can be charged to your wallet.", needsSignIn: true },
      { status: 401, headers: cors },
    );
  }

  const quoted = quoteCapability({ capabilityKey, inputText: input });
  if (!quoted.ok) {
    return NextResponse.json({ error: quoted.error.message }, { status: 502, headers: cors });
  }

  // The charge settles in NGN today (every division is NGN-settlement). But this is a
  // multi-currency company, so we SHOW the price in the payer's own currency when we can,
  // clearly marked approximate, and tell them the charge is in NGN. This is M0 display-honesty.
  const chargeCurrency = quoted.value.currency; // NGN
  const countryCode = String(user.user_metadata?.country ?? "").trim().toUpperCase();
  const displayCurrency = resolveDisplayCurrencyForCountry(countryCode);

  let display: { amountMinor: number; currency: string; approximate: boolean } = {
    amountMinor: quoted.value.totalKobo,
    currency: chargeCurrency,
    approximate: false,
  };
  if (displayCurrency !== chargeCurrency && displayCurrency !== SYSTEM_BASE_CURRENCY) {
    const converted = await convertMinorUnits(quoted.value.totalKobo, chargeCurrency, displayCurrency).catch(() => null);
    if (converted) {
      // Shown in the payer's currency, but the actual debit is still NGN, so mark it approximate.
      display = { amountMinor: converted.converted, currency: displayCurrency, approximate: true };
    }
  }

  return NextResponse.json(
    {
      capability: { key: capability.key, title: capability.title, blurb: capability.blurb },
      // The real charge (NGN, what the wallet is debited).
      charge: { amountKobo: quoted.value.totalKobo, vatKobo: quoted.value.vatKobo, currency: chargeCurrency },
      // What to show the person: their currency when available (approximate), else NGN.
      display,
    },
    { headers: cors },
  );
}
