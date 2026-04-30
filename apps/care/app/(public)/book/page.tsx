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

  const captureItems = [
    {
      icon: ClipboardList,
      title: t("Clear request detail"),
      body: t(
        "Service type, address notes, timing, and delivery-vs-on-site context are readable before you submit."
      ),
    },
    {
      icon: Wallet,
      title: t("Estimate before submit"),
      body: t("Review the current estimate and payment guidance before the request is sent."),
    },
  ] as const;

  const flowSteps = [
    {
      step: "01",
      title: t("Choose your service type"),
      body: t(
        "Start with garment pickup, home cleaning, or office cleaning, then choose the service options that match the request."
      ),
    },
    {
      step: "02",
      title: t("Add the important details"),
      body: t(
        "Add contact details, schedule windows, access notes, and anything that affects delivery or on-site completion."
      ),
    },
    {
      step: "03",
      title: t("Receive one tracking code"),
      body: t(
        "You get one tracking code, then follow the correct timeline for return delivery or on-site completion."
      ),
    },
  ] as const;

  return (
    <main
      className="care-page min-h-screen px-4 py-10 text-zinc-950 sm:px-6 sm:py-12 lg:px-10 dark:text-white"
      style={
        {
          "--accent": ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <div className="mx-auto grid max-w-[92rem] items-start gap-12 2xl:grid-cols-[0.85fr_1.15fr]">
        <section className="space-y-12">
          <div>
            <p className="care-kicker inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.32em] text-[color:var(--accent)]">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              {t("Service booking")}
            </p>
            <h1 className="mt-5 max-w-3xl text-balance care-display text-zinc-950 dark:text-white">
              {t("Book a service. One calm form.")}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-zinc-600 sm:text-lg dark:text-white/68">
              {t(
                "Garments move into tracked return delivery. Home and office requests end in on-site completion and sign-off. The form makes the difference clear before you submit."
              )}
            </p>
          </div>

          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
              {t("What the request captures")}
            </p>
            <ul className="mt-5 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
              {captureItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex gap-4 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/60 text-[color:var(--accent)] dark:border-white/10 dark:bg-white/[0.04]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-white/68">
                        {item.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
              {t("How a request flows")}
            </p>
            <ol className="mt-5 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
              {flowSteps.map((item) => (
                <li
                  key={item.step}
                  className="grid gap-3 py-4 sm:grid-cols-[auto,1fr] sm:gap-6"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
                    {t("Step")} {item.step}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-white/68">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-10 md:grid-cols-2 md:divide-x md:divide-black/10 dark:md:divide-white/10">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
                {t("Wardrobe service")}
              </p>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                {t("Garments end in return delivery.")}
              </h3>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
                {t(
                  "Pickup, treatment, finishing, packing, and return delivery remain visible in their own tracking timeline."
                )}
              </p>
            </div>
            <div className="md:pl-10">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
                {t("On-site service")}
              </p>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                {t("Homes and offices end in completed work.")}
              </h3>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
                {t(
                  "Home and office services focus on scheduling, arrival, service completion, and final sign-off rather than delivery movement."
                )}
              </p>
            </div>
          </div>

          <div className="border-l-2 border-[color:var(--accent)]/55 pl-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
              {t("Booking truth")}
            </p>
            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
              {t(
                "One garment order or one cleaning request stays under one readable tracking code, with payment guidance and follow-up attached to the same record."
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/track"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:border-[color:var(--accent)]/50 hover:bg-white dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
            >
              <Search className="h-4 w-4 text-[color:var(--accent)]" />
              {t("Track an existing request")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:border-[color:var(--accent)]/50 hover:bg-white dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
            >
              <Wallet className="h-4 w-4 text-[color:var(--accent)]" />
              {t("Review pricing")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section>
          <div className="rounded-[2.4rem] border border-black/10 bg-white/85 p-6 shadow-[0_18px_60px_rgba(16,19,31,0.06)] backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
              {t("Booking form")}
            </p>
            <h2 className="mt-3 text-balance text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.02em] text-zinc-950 sm:text-[1.95rem] dark:text-white">
              {t("Share the details with confidence.")}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/68">
              {t(
                "Choose the service, add the right details, review the current estimate, and send a clear request in one polished step."
              )}
            </p>

            <div className="mt-6 grid gap-4">
              {ok ? <MessageCard kind="success" text={ok} /> : null}
              {error ? <MessageCard kind="error" text={error} /> : null}
            </div>

            {tracking ? (
              <div className="mt-6">
                <BookingSuccessNotice locale={locale} tracking={tracking} />
              </div>
            ) : null}

            <div className="mt-7 border-t border-black/10 pt-7 dark:border-white/10">
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

            <p className="mt-7 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-white/55">
              <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              {t("One tracking code per request")}
            </p>
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
