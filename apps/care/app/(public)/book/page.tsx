import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { getDivisionConfig } from "@henryco/config";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  Truck,
  Wallet,
} from "lucide-react";

import BookingSuccessNotice from "@/components/care/BookingSuccessNotice";
import BookPickupForm from "@/components/care/BookPickupForm";
import { getCareBookingCatalog, getCarePricing, getCareSettings } from "@/lib/care-data";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createPublicBookingAction } from "./actions";

export const revalidate = 60;

const care = getDivisionConfig("care");
const ACCENT = CARE_ACCENT;

export const metadata: Metadata = {
  title: `Book Service | ${care.name}`,
  description:
    "Book garment care, home cleaning, or office cleaning with HenryCo Care. Clear estimates, premium support, and straightforward tracking from the first request.",
};

const FEATURES = [
  {
    icon: Tags,
    title: "One premium request desk",
    text: "Move between garment care, residential cleaning, and workplace service without losing the details needed for a smooth experience.",
  },
  {
    icon: ClipboardList,
    title: "Clear service detail",
    text: "Every request captures timing, address notes, service choices, and the estimate you need before you submit.",
  },
  {
    icon: Wallet,
    title: "Clear estimate preview",
    text: "Review the current estimate for garment care or cleaning before you send the request.",
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Choose your service type",
    text: "Start with garment care, home cleaning, or office cleaning, then choose the options that fit the request.",
  },
  {
    step: "02",
    title: "Add the important details",
    text: "Set contact details, preferred windows, access notes, and any extras that shape timing or price.",
  },
  {
    step: "03",
    title: "Receive one tracking code",
    text: "You receive one tracking code for the request, then follow the right timeline for delivery or on-site completion.",
  },
] as const;

const VALUE_POINTS = [
  {
    icon: Truck,
    title: "Reliable follow-through",
    text: "Built for pickup, on-site service timing, payment guidance, and clear updates after booking.",
  },
  {
    icon: ShieldCheck,
    title: "Traceable from the start",
    text: "One garment order or one cleaning request stays under one readable record with a trackable code.",
  },
] as const;

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
          ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
          : "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100"
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
  }>;
}) {
  const params = (await searchParams) ?? {};
  const ok = String(params.ok || params.success || "").trim();
  const error = String(params.error || "").trim();
  const tracking = String(params.tracking || "").trim();

  const [pricingItems, catalog, settings, bookingIdentity] = await Promise.all([
    getCarePricing(),
    getCareBookingCatalog(),
    getCareSettings(),
    getBookingIdentity(),
  ]);

  return (
    <main
      className="care-page min-h-screen overflow-hidden px-4 py-8 text-zinc-950 sm:px-6 sm:py-10 dark:text-white"
      style={
        {
          "--accent": ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <div className="mx-auto grid min-h-[85vh] max-w-[92rem] items-start gap-8 2xl:grid-cols-[0.78fr_1.22fr]">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-3xl border border-black/8 bg-white/82 px-5 py-3 text-sm font-semibold text-zinc-700 shadow-[0_16px_50px_rgba(16,19,31,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] dark:text-white/75">
            <CalendarCheck2 className="h-5 w-5 text-[color:var(--accent)]" />
            Service booking
          </div>

          <div>
            <h1 className="max-w-4xl text-balance care-display text-zinc-950 dark:text-white">
              Book the right service with less friction and more clarity.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-white/68 sm:text-lg xl:text-xl">
              Use one premium booking flow for garment pickup, home cleaning, or office service,
              with clear pricing, polished wording, and reliable follow-up.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-black/10 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                    <Icon className="h-5 w-5 text-[color:var(--accent)]" />
                  </div>

                  <div className="mt-4 text-lg font-semibold">{item.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="care-sheen rounded-[32px] border border-black/10 bg-white/75 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                <CheckCircle2 className="h-4 w-4" />
              What the request captures
              </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {STEPS.map((item) => (
                <div
                  key={item.step}
                  className="care-sheen rounded-3xl border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.05]"
                >
                  <div className="text-sm font-black tracking-[0.16em] text-[color:var(--accent)]">
                    {item.step}
                  </div>
                  <div className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">
                    {item.title}
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-sm font-semibold text-zinc-900 dark:text-white">
              What happens after submission
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
              The request records scope, the current estimate, schedule context, and any access
              notes. If payment is required before service continues, the confirmation email
              explains exactly what to do next.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="care-card care-sheen rounded-[2rem] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                Wardrobe service
              </div>
              <div className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">
                Garments end in return delivery.
              </div>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/66">
                Pickup, treatment, finishing, packing, and return delivery remain visible in their own tracking timeline.
              </p>
            </div>

            <div className="care-card care-sheen rounded-[2rem] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                On-site service
              </div>
              <div className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">
                Homes and offices end in completed work.
              </div>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/66">
                Home and office services focus on scheduling, arrival, service completion, and final sign-off rather than delivery movement.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/track"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              <Search className="h-4 w-4 text-[color:var(--accent)]" />
              Track an existing request
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              <Wallet className="h-4 w-4 text-[color:var(--accent)]" />
              Review pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {VALUE_POINTS.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-black/10 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
                    <Icon className="h-4 w-4 text-[color:var(--accent)]" />
                    {item.title}
                  </div>
                  <div className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                    {item.text}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="relative">
            <div className="overflow-hidden rounded-[38px] border border-black/10 bg-white/80 p-5 shadow-[0_25px_90px_rgba(0,0,0,0.10)] backdrop-blur-2xl sm:p-6 dark:border-white/10 dark:bg-white/[0.05]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[color:var(--accent)]/12 blur-3xl" />

            <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)] dark:border-white/10 dark:bg-white/[0.05]">
              <Sparkles className="h-4 w-4" />
              Booking form
            </div>

              <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.03em]">
                Share the details with confidence.
              </h2>

              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/65">
                Choose the service, add the right details, review the current estimate, and send a
                clear request in one polished step.
              </p>

              <div className="mt-5 grid gap-4">
                {ok ? <MessageCard kind="success" text={ok} /> : null}
                {error ? <MessageCard kind="error" text={error} /> : null}
              </div>

              {tracking ? <BookingSuccessNotice tracking={tracking} /> : null}

              <div className="mt-6">
            <BookPickupForm
              pricingItems={pricingItems}
              catalog={catalog}
              savedAddresses={bookingIdentity.addresses}
              defaultContact={bookingIdentity.contact}
              paymentSettings={{
                accountName: settings.payment_account_name || settings.company_account_name,
                accountNumber: settings.payment_account_number || settings.company_account_number,
                bankName: settings.payment_bank_name || settings.company_bank_name,
                currency: settings.payment_currency || "NGN",
                supportEmail: settings.payment_support_email || settings.support_email,
                supportWhatsApp: settings.payment_support_whatsapp || settings.payment_whatsapp,
                instructions: settings.payment_instructions,
              }}
              action={createPublicBookingAction}
            />
              </div>
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
  const [{ data: profile }, { data: addresses }] = await Promise.all([
    admin.from("customer_profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    admin
      .from("customer_addresses")
      .select("id, label, line1, line2, city, state, country, is_default")
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
      label: String(row.label || row.line1 || "Saved address"),
      fullAddress: [row.line1, row.line2, row.city, row.state, row.country]
        .map((part) => String(part || "").trim())
        .filter(Boolean)
        .join(", "),
      isDefault: Boolean(row.is_default),
    })),
  };
}
