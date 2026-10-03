import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { getDivisionConfig } from "@henryco/config";
import { getServicesCopy, resolveLocalizedDynamicField, translateSurfaceLabel } from "@henryco/i18n/server";
import { ArrowRight, Search, Wallet } from "lucide-react";

import BookingSuccessNotice from "@/components/care/BookingSuccessNotice";
import BookPickupForm from "@/components/care/BookPickupForm";
import { getCareBookingCatalog, getCarePricing, getCareSettings, getServicesCatalog } from "@/lib/care-data";
import { findServiceBySlugAnyVertical } from "@/lib/services-catalog";
import { emitServiceBookingStarted } from "@/lib/services-telemetry";
import { getCarePublicLocale } from "@/lib/locale-server";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createPublicBookingAction } from "./actions";

export const revalidate = 60;

const care = getDivisionConfig("care");
const ACCENT = CARE_ACCENT;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCarePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return {
    title: `${t("Book Service")} | ${care.name}`,
    description: t(
      `Book garment care, home cleaning, or office cleaning with ${care.name}. See the estimate before you send.`
    ),
    alternates: { canonical: "/book" },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${t("Book Service")} | ${care.name}`,
      description: t(
        "Garment care, home cleaning, office cleaning. Clear estimates and premium support — book in one calm form."
      ),
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${t("Book Service")} | ${care.name}`,
    },
  };
}

function MessageCard({
  kind,
  text,
}: {
  kind: "success" | "error";
  text: string;
}) {
  const isSuccess = kind === "success";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        isSuccess
          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-600"
          : "border-red-400/30 bg-red-500/10 text-red-600"
      }`}
    >
      {text}
    </div>
  );
}

export default async function BookPage({
  searchParams,
}: {
  searchParams?: Promise<{
    ok?: string;
    error?: string;
    success?: string;
    tracking?: string;
    service?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const ok = String(params.ok || params.success || "").trim();
  const error = String(params.error || "").trim();
  const tracking = String(params.tracking || "").trim();
  const serviceSlug = String(params.service || "").trim();

  const [pricingItems, catalog, settings, bookingIdentity, servicesCatalog] = await Promise.all([
    getCarePricing(),
    getCareBookingCatalog(),
    getCareSettings(),
    getBookingIdentity(),
    getServicesCatalog(),
  ]);
  const locale = await getCarePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  // V3-49 — a catalogue handoff (/book?service=<slug>): surface a calm context
  // note and record the booking-started event. No booking logic is added here —
  // slot/provider preselection is V3-51's engine; this only carries the intent.
  const handoffService = serviceSlug
    ? findServiceBySlugAnyVertical(servicesCatalog, serviceSlug)
    : null;
  if (handoffService) {
    emitServiceBookingStarted({
      verticalSlug: handoffService.vertical_slug,
      serviceSlug: handoffService.slug,
    });
  }
  const servicesCopy = getServicesCopy(locale);
  const handoffServiceName = handoffService
    ? await resolveLocalizedDynamicField({
        record: handoffService as unknown as Record<string, unknown>,
        field: "name",
        locale,
        fallback: handoffService.name,
        machineTranslate: locale !== "en",
      })
    : null;

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="care-page min-h-screen px-3 py-8 text-[color:var(--home-ink)] sm:px-6 sm:py-12 lg:px-10"
      style={
        {
          "--accent": ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <div className="mx-auto grid max-w-[92rem] items-start gap-12 2xl:grid-cols-[1.15fr_0.85fr]">
        <section className="order-2 space-y-12 2xl:order-2">
          <div>
            <h1 className="max-w-3xl text-balance care-display text-[color:var(--home-ink)]">
              {t("Book a service.")}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/track"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-surface-04)] px-5 py-2.5 text-sm font-semibold text-[color:var(--home-ink)] transition hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--home-surface-07)]"
            >
              <Search className="h-4 w-4 text-[color:var(--home-accent-text)]" />
              {t("Track an existing request")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-surface-04)] px-5 py-2.5 text-sm font-semibold text-[color:var(--home-ink)] transition hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--home-surface-07)]"
            >
              <Wallet className="h-4 w-4 text-[color:var(--home-accent-text)]" />
              {t("Review pricing")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section className="order-1 2xl:order-1">
          <div className="rounded-[1.6rem] border border-[color:var(--home-line)] bg-[color:var(--home-sheet)] p-5 shadow-[0_18px_60px_rgba(16,19,31,0.06)] backdrop-blur-xl sm:rounded-[2.4rem] sm:p-8">
            <h2 className="text-balance text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.02em] text-[color:var(--home-ink)] sm:text-[1.95rem]">
              {t("Tell us what the job needs.")}
            </h2>

            {handoffServiceName ? (
              <div className="mt-5 rounded-2xl border border-[color:var(--accent)]/30 bg-[color:var(--home-surface-04)] px-4 py-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-accent-text)]">
                  {servicesCopy.book.continuingFrom}
                </p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--home-ink-70)]">
                  {servicesCopy.book.continuingService.replace("{service}", handoffServiceName)}
                </p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-4">
              {ok ? <MessageCard kind="success" text={ok} /> : null}
              {error ? <MessageCard kind="error" text={error} /> : null}
            </div>

            {tracking ? (
              <div className="mt-6">
                <BookingSuccessNotice locale={locale} tracking={tracking} />
              </div>
            ) : null}

            <div className="mt-7 border-t border-[color:var(--home-line)] pt-7">
              <BookPickupForm
                locale={locale}
                pricingItems={pricingItems}
                catalog={catalog}
                savedAddresses={bookingIdentity.addresses}
                defaultContact={bookingIdentity.contact}
                paymentSettings={{
                  accountName: settings.payment_account_name || settings.company_account_name,
                  accountNumber:
                    settings.payment_account_number || settings.company_account_number,
                  bankName: settings.payment_bank_name || settings.company_bank_name,
                  currency: settings.payment_currency || "NGN",
                  supportEmail: settings.payment_support_email || settings.support_email,
                  supportWhatsApp:
                    settings.payment_support_whatsapp || settings.payment_whatsapp,
                  instructions: settings.payment_instructions,
                }}
                action={createPublicBookingAction}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

async function getBookingIdentity() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return { addresses: [], contact: null };
  }

  const admin = createAdminSupabase();
  // V2-ADDR-01: read from canonical user_addresses (replaces customer_addresses).
  const [{ data: profile }, { data: addresses }] = await Promise.all([
    admin.from("customer_profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    admin
      .from("user_addresses")
      .select(
        "id, label, street, city, state, country, postal_code, formatted_address, is_default, kyc_verified"
      )
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return {
    contact: {
      fullName:
        String(profile?.full_name || "").trim() ||
        String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim() ||
        null,
      phone: String(profile?.phone || "").trim() || null,
      email: user.email || null,
    },
    addresses: (addresses ?? []).map((row) => ({
      id: String(row.id),
      label: String(row.label || "Saved address"),
      fullAddress:
        String(row.formatted_address || "").trim() ||
        [row.street, row.city, row.state, row.country]
          .map((part) => String(part || "").trim())
          .filter(Boolean)
          .join(", "),
      isDefault: Boolean(row.is_default),
    })),
  };
}
