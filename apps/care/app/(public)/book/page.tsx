import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { getDivisionConfig } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import BookingSuccessNotice from "@/components/care/BookingSuccessNotice";
import BookPickupForm from "@/components/care/BookPickupForm";
import { getCareBookingCatalog, getCarePricing, getCareSettings } from "@/lib/care-data";
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
      "Book garment care, home cleaning, or office cleaning with HenryCo Care. Clear estimates, premium support, and straightforward tracking from the first request."
    ),
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
  const locale = await getCarePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const features = [
    {
      icon: ClipboardList,
      title: t("Clear request detail"),
      text: t(
        "The form keeps service type, address notes, timing, and delivery-vs-on-site context readable before you submit.",
      ),
    },
    {
      icon: Wallet,
      title: t("Estimate before submit"),
      text: t("Review the current estimate and payment guidance before the request is sent."),
    },
  ] as const;
  const steps = [
    {
      step: "01",
      title: t("Choose your service type"),
      text: t(
        "Start with garment pickup, home cleaning, or office cleaning, then choose the service options that match the request.",
      ),
    },
    {
      step: "02",
      title: t("Add the important details"),
      text: t(
        "Add contact details, schedule windows, access notes, and anything that affects delivery or on-site completion.",
      ),
    },
    {
      step: "03",
      title: t("Receive one tracking code"),
      text: t(
        "You get one tracking code, then follow the correct timeline for return delivery or on-site completion.",
      ),
    },
  ] as const;

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
            {t("Service booking")}
          </div>

          <div>
            <h1 className="max-w-3xl text-balance care-display text-zinc-950 dark:text-white">
              {t("Book a service. One calm form.")}
            </h1>

            <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-white/68 sm:text-lg xl:text-xl">
              {t(
                "Garments move into tracked return delivery. Home and office requests end in on-site completion and sign-off. The form makes the difference clear before you submit.",
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((item) => {
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
                {t("What the request captures")}
              </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {steps.map((item) => (
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
              {t("What happens after submission")}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
              {t(
                "The request records scope, estimate, schedule context, and access notes. Garment jobs continue into pickup and return delivery. Home and office jobs continue into scheduled on-site work and final completion checks.",
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="care-card care-sheen rounded-[2rem] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                {t("Wardrobe service")}
              </div>
              <div className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">
                {t("Garments end in return delivery.")}
              </div>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/66">
                {t(
                  "Pickup, treatment, finishing, packing, and return delivery remain visible in their own tracking timeline.",
                )}
              </p>
            </div>

            <div className="care-card care-sheen rounded-[2rem] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                {t("On-site service")}
              </div>
              <div className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">
                {t("Homes and offices end in completed work.")}
              </div>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/66">
                {t(
                  "Home and office services focus on scheduling, arrival, service completion, and final sign-off rather than delivery movement.",
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/track"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              <Search className="h-4 w-4 text-[color:var(--accent)]" />
              {t("Track an existing request")}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              <Wallet className="h-4 w-4 text-[color:var(--accent)]" />
              {t("Review pricing")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
              <ShieldCheck className="h-4 w-4 text-[color:var(--accent)]" />
              {t("Booking truth")}
            </div>
            <div className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
              {t(
                "One garment order or one cleaning request stays under one readable tracking code, with payment guidance and follow-up attached to the same record.",
              )}
            </div>
          </div>
        </section>

        <section className="relative">
            <div className="overflow-hidden rounded-[38px] border border-black/10 bg-white/80 p-5 shadow-[0_25px_90px_rgba(0,0,0,0.10)] backdrop-blur-2xl sm:p-6 dark:border-white/10 dark:bg-white/[0.05]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[color:var(--accent)]/12 blur-3xl" />

            <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)] dark:border-white/10 dark:bg-white/[0.05]">
              <Sparkles className="h-4 w-4" />
              {t("Booking form")}
            </div>

              <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.03em]">
                {t("Share the details with confidence.")}
              </h2>

              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/65">
                {t(
                  "Choose the service, add the right details, review the current estimate, and send a clear request in one polished step.",
                )}
              </p>

              <div className="mt-5 grid gap-4">
                {ok ? <MessageCard kind="success" text={ok} /> : null}
                {error ? <MessageCard kind="error" text={error} /> : null}
              </div>

              {tracking ? <BookingSuccessNotice locale={locale} tracking={tracking} /> : null}

              <div className="mt-6">
            <BookPickupForm
              locale={locale}
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
