"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  Home,
  MapPin,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import BookingSuccessNotice from "@/components/care/BookingSuccessNotice";
import PaymentProofForm from "@/components/care/PaymentProofForm";
import TrackTimeline from "@/components/care/TrackTimeline";
import { CareLoadingGlyph, CareLoadingStage } from "@/components/ui/CareLoading";
import {
  getServiceFamilyLabel,
  isReviewEligibleStatus,
  getTrackingStatusLabel,
  getTrackingTone,
  isRecurringService,
  type CareServiceFamily,
  type ServiceSummaryDetails,
} from "@/lib/care-tracking";

type CareBookingTrackRow = {
  tracking_code: string;
  customer_name: string;
  phone: string;
  service_type: string;
  item_summary: string | null;
  pickup_address: string;
  pickup_date: string;
  pickup_slot: string;
  special_instructions: string | null;
  status: string;
  quoted_total?: number | null;
  balance_due?: number | null;
  payment_status?: string | null;
  created_at: string;
  updated_at?: string | null;
  family: CareServiceFamily;
  service_summary: ServiceSummaryDetails | null;
  payment?: {
    verificationStatus: string;
    verificationLabel: string;
    verificationMessage: string;
    amountDue: number;
    amountPaidRecorded: number;
    balanceDue: number;
    paymentStatus: string | null;
    supportEmail: string | null;
    supportWhatsApp: string | null;
    canSubmitReceipt: boolean;
  } | null;
};

function toneClasses(tone: ReturnType<typeof getTrackingTone>) {
  if (tone === "emerald") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
  if (tone === "blue") {
    return "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
  }
  if (tone === "violet") {
    return "border-violet-400/30 bg-violet-500/10 text-violet-100";
  }
  if (tone === "red") {
    return "border-red-400/30 bg-red-500/10 text-red-100";
  }
  return "border-amber-400/30 bg-amber-500/10 text-amber-100";
}

function formatDate(value?: string | null) {
  if (!value) return "Not yet scheduled";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

import { formatMoney } from "@/lib/format";

function extractReturnAddress(specialInstructions?: string | null) {
  const raw = String(specialInstructions || "").trim();
  if (!raw) return null;
  const marker = "return address:";
  const idx = raw.toLowerCase().indexOf(marker);
  if (idx < 0) return null;
  const tail = raw.slice(idx + marker.length).trim();
  if (!tail) return null;
  const pipeIndex = tail.indexOf("|");
  const result = (pipeIndex >= 0 ? tail.slice(0, pipeIndex) : tail).trim();
  return result || null;
}

function familyIcon(family: CareServiceFamily) {
  if (family === "home") return Home;
  if (family === "office") return Building2;
  return Package;
}

function familyHeadline(family: CareServiceFamily) {
  if (family === "home") return "Home cleaning visit status";
  if (family === "office") return "Office cleaning visit status";
  return "Wardrobe care order status";
}

function familySubcopy(family: CareServiceFamily) {
  if (family === "home") {
    return "Cleaner scheduling, arrival, on-site work, inspection, and visit completion are tracked here.";
  }
  if (family === "office") {
    return "Schedule confirmation, site access, execution progress, checklist completion, and sign-off are tracked here.";
  }
  return "Pickup, facility handling, finishing, quality checks, and return delivery are tracked here.";
}

function experienceCards(family: CareServiceFamily) {
  if (family === "home") {
    return [
      {
        title: "Visit clarity",
        body: "Residential teams can move from scheduled to en route, in progress, completed, and inspection-confirmed without ambiguity.",
        icon: Home,
      },
      {
        title: "Recurring visibility",
        body: "Recurring-home bookings keep their cadence and preferred window visible inside the same tracking view.",
        icon: Calendar,
      },
      {
        title: "Trust after completion",
        body: "Customers can see when the work finished, when inspection closed, and when follow-up should happen.",
        icon: CheckCircle2,
      },
    ];
  }

  if (family === "office") {
    return [
      {
        title: "Operational readiness",
        body: "Commercial visits now show schedule confirmation, access readiness, and on-site execution states clearly.",
        icon: Building2,
      },
      {
        title: "Checklist confidence",
        body: "Office-cleaning progress is structured around section completion and sign-off, not garment-style movement statuses.",
        icon: ShieldCheck,
      },
      {
        title: "Contract continuity",
        body: "Recurring service cadence stays visible so contract-style customers are not left guessing.",
        icon: Calendar,
      },
    ];
  }

  return [
      {
        title: "Transparent movement",
        body: "Pickup, facility intake, finishing, packing, and return delivery now follow a wardrobe-specific movement timeline.",
        icon: Truck,
      },
    {
      title: "Cleaner communication",
      body: "The status language follows the real garment-care journey instead of generic service terms.",
      icon: Sparkles,
    },
    {
      title: "Trust through clarity",
      body: "Customers can understand exactly where the order is in the care cycle without needing support intervention.",
      icon: CheckCircle2,
    },
  ];
}

export default function TrackLookupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bootstrapped = useRef(false);

  const initialCode = useMemo(
    () => searchParams.get("code") || searchParams.get("tracking_code") || "",
    [searchParams]
  );
  const initialPhone = useMemo(() => searchParams.get("phone") || "", [searchParams]);
  const justBooked = useMemo(() => searchParams.get("booked") === "1", [searchParams]);

  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(Boolean(initialCode));
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<CareBookingTrackRow | null>(null);
  const [searched, setSearched] = useState(Boolean(initialCode));

  async function lookup(nextCode?: string, nextPhone?: string) {
    const finalCode = (nextCode ?? code).trim().toUpperCase();
    const finalPhone = (nextPhone ?? phone).trim();

    if (!finalCode) {
      setError("Please enter your tracking code.");
      setBooking(null);
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const params = new URLSearchParams({ code: finalCode });
      if (finalPhone) params.set("phone", finalPhone);

      router.replace(`/track?${params.toString()}`);

      const res = await fetch(`/api/care/track?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setBooking(null);
        setError(data?.error || "No matching booking found.");
        return;
      }

      setBooking(data.booking as CareBookingTrackRow);
    } catch {
      setBooking(null);
      setError("Unable to fetch tracking details right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (bootstrapped.current || !initialCode) return;
    bootstrapped.current = true;
    void lookup(initialCode, initialPhone);
    // `lookup` closes over live input state for manual searches; the initial bootstrap
    // intentionally runs once from the URL payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, initialPhone]);

  const family = booking?.family ?? "garment";
  const Icon = familyIcon(family);
  const summary = booking?.service_summary ?? null;
  const recurring = isRecurringService(summary);
  const reviewEligible = booking ? isReviewEligibleStatus(family, booking.status) : false;
  const payment = booking?.payment ?? null;
  const returnAddress = extractReturnAddress(booking?.special_instructions);

  return (
    <main className="overflow-hidden bg-transparent pb-24 pt-8">
      <section className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="relative overflow-hidden rounded-[44px] border border-black/10 bg-white/85 px-8 py-16 shadow-[0_14px_34px_rgba(0,0,0,0.08)] backdrop-blur-0 md:shadow-[0_24px_80px_rgba(0,0,0,0.08)] md:backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_100px_rgba(0,0,0,0.28)] sm:py-20 lg:px-14 lg:py-24">
          <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-[color:var(--accent)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-zinc-300/30 blur-3xl dark:bg-white/5" />

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-3xl border border-black/10 bg-white/75 px-6 py-3 text-sm font-medium text-zinc-700 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] dark:text-white/72">
              <Package className="h-5 w-5 text-[color:var(--accent)]" />
              <span>Service tracking</span>
            </div>

            <h1 className="mt-8 text-balance text-6xl font-black leading-[0.95] tracking-[-0.055em] text-zinc-950 dark:text-white sm:text-7xl lg:text-[82px]">
              Track the exact
              <br />
              stage of service.
            </h1>

            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-zinc-600 dark:text-white/68">
              Wardrobe care follows movement and delivery. Home and office cleaning follow
              on-site execution and completion quality. The timeline shown here matches the type
              of service you booked.
            </p>

            {justBooked && initialCode ? <BookingSuccessNotice tracking={initialCode} /> : null}
          </div>

          <form
            className="mt-12 max-w-3xl"
            onSubmit={(event) => {
              event.preventDefault();
              void lookup();
            }}
          >
            <div className="relative grid gap-4 md:grid-cols-[2fr_1.5fr_auto]">
              <div className="relative">
                <div className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-[color:var(--accent)]">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  name="code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="TRK-XXXXXXXXXX"
                  className="h-16 w-full rounded-3xl border border-black/10 bg-white/80 pl-14 pr-6 text-lg font-medium uppercase text-zinc-900 placeholder:text-zinc-400 focus:border-[color:var(--accent)]/50 focus:outline-none dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/35"
                  required
                />
              </div>

              <input
                name="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number (optional)"
                className="h-16 rounded-3xl border border-black/10 bg-white/80 px-6 text-lg font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-[color:var(--accent)]/50 focus:outline-none dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/35"
              />

              <button
                type="submit"
                disabled={loading}
                className="care-button-primary group inline-flex h-16 items-center justify-center gap-3 rounded-3xl px-10 text-base font-semibold transition-[transform,opacity,filter] duration-200 md:hover:scale-[1.02] disabled:opacity-70"
              >
                {loading ? (
                  <CareLoadingGlyph size="md" className="text-[#07111F]" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
                {loading ? "Checking..." : "Track service"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-xs font-medium uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
            Use your real booking code, for example: TRK-N0RFUKI5
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-6 sm:px-8 lg:px-10">
        {!searched ? (
          <div className="rounded-3xl border border-black/10 bg-white/85 p-12 text-center shadow-[0_14px_34px_rgba(0,0,0,0.06)] backdrop-blur-0 md:shadow-[0_18px_60px_rgba(0,0,0,0.06)] md:backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
              <Package className="h-10 w-10 text-[color:var(--accent)]" />
            </div>
            <p className="mt-8 text-2xl font-semibold text-zinc-950 dark:text-white">
              Your service details are one code away
            </p>
            <p className="mt-4 text-lg text-zinc-600 dark:text-white/65">
              Enter the tracking code above to see the current stage, the right timeline for the
              service, and the next step you should expect.
            </p>
          </div>
        ) : loading ? (
          <CareLoadingStage
            variant="panel"
            eyebrow="HenryCo Care tracking"
            title="Looking up your service"
            description="Checking the latest status, payment details, and what happens next."
            bullets={[
              "Looking up your tracking reference",
              "Loading the service timeline",
              "Preparing the next verified handoff",
            ]}
          />
        ) : booking ? (
          <div className="space-y-10">
            <div className="rounded-[36px] border border-black/10 bg-white/85 p-10 shadow-[0_14px_34px_rgba(0,0,0,0.06)] backdrop-blur-0 md:shadow-[0_18px_60px_rgba(0,0,0,0.06)] md:backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
                    Tracking Code
                  </div>
                  <div className="mt-2 font-mono text-4xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-5xl">
                    {booking.tracking_code}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-3xl border border-black/10 bg-zinc-50 px-5 py-4 text-center dark:border-white/10 dark:bg-white/[0.05]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-white/70">
                      <Icon className="h-4 w-4 text-[color:var(--accent)]" />
                      {getServiceFamilyLabel(family)}
                    </div>
                  </div>
                  <div
                    className={`rounded-3xl border px-8 py-4 text-center text-lg font-semibold ${toneClasses(
                      getTrackingTone(booking.status, family)
                    )}`}
                  >
                    {getTrackingStatusLabel(booking.status, family)}
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-[30px] border border-black/10 bg-zinc-50/90 p-6 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                  {familyHeadline(family)}
                </div>
                <div className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {booking.service_type}
                </div>
                <div className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                  {familySubcopy(family)}
                </div>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <DataCard icon={User} label="Customer">
                  {booking.customer_name}
                </DataCard>
                <DataCard icon={Package} label="Service">
                  {booking.service_type}
                </DataCard>
                <DataCard icon={Calendar} label={family === "garment" ? "Pickup date" : "Visit date"}>
                  {formatDate(booking.pickup_date)}
                </DataCard>
                <DataCard icon={Clock3} label={family === "garment" ? "Pickup slot" : "Service window"}>
                  {summary?.serviceWindow || booking.pickup_slot || "Not yet scheduled"}
                </DataCard>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-black/10 bg-zinc-50 p-7 dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
                    <MapPin className="h-4 w-4 text-[color:var(--accent)]" />
                    Service address
                  </div>
                  <div className="mt-4 text-[17px] leading-relaxed text-zinc-950 dark:text-white">
                    {booking.pickup_address}
                  </div>
                </div>

                <div className="rounded-3xl border border-black/10 bg-zinc-50 p-7 dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
                    <Wallet className="h-4 w-4 text-[color:var(--accent)]" />
                    Payment snapshot
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MiniInfo label="Quoted total">{formatMoney(booking.quoted_total)}</MiniInfo>
                    <MiniInfo label="Balance due">{formatMoney(booking.balance_due)}</MiniInfo>
                    <MiniInfo label="Payment status">
                      {payment?.verificationLabel || booking.payment_status || "unpaid"}
                    </MiniInfo>
                    <MiniInfo label="Last update">{formatDate(booking.updated_at || booking.created_at)}</MiniInfo>
                  </div>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-black/10 bg-zinc-50 p-7 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
                  <MapPin className="h-4 w-4 text-[color:var(--accent)]" />
                  Return / delivery address
                </div>
                <div className="mt-4 text-[17px] leading-relaxed text-zinc-950 dark:text-white">
                  {returnAddress || "Same as pickup address unless changed during booking."}
                </div>
              </div>

              {payment ? (
                <PaymentProofForm
                  trackingCode={booking.tracking_code}
                  initialPhone={booking.phone}
                  amountDue={payment.amountDue}
                  canSubmit={payment.canSubmitReceipt}
                  statusLabel={payment.verificationLabel}
                  statusMessage={payment.verificationMessage}
                  supportEmail={payment.supportEmail}
                  supportWhatsApp={payment.supportWhatsApp}
                  onSubmitted={async () => {
                    await lookup(booking.tracking_code, booking.phone || phone);
                  }}
                />
              ) : null}

              {booking.phone ? (
                <div className="mt-6 rounded-3xl border border-black/10 bg-zinc-50 p-7 dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
                    <Phone className="h-4 w-4 text-[color:var(--accent)]" />
                    Contact number
                  </div>
                  <div className="mt-4 text-[17px] leading-relaxed text-zinc-950 dark:text-white">
                    {booking.phone}
                  </div>
                </div>
              ) : null}

              {summary ? (
                <div className="mt-6 rounded-3xl border border-black/10 bg-zinc-50 p-7 dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
                    <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
                    Service details
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      summary.categoryLabel,
                      summary.serviceLabel,
                      summary.frequencyLabel,
                      summary.urgencyLabel,
                      summary.zoneLabel,
                      summary.propertyLabel,
                      summary.siteContactName,
                      ...summary.preferredDays.map((day) => `Day: ${day}`),
                      ...summary.addOnLabels,
                    ]
                      .filter(Boolean)
                      .map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
                        >
                          {item}
                        </span>
                      ))}
                  </div>

                  {recurring ? (
                    <div className="mt-5 rounded-2xl border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 p-4 text-sm text-zinc-700 dark:text-white/80">
                      This booking is tied to a recurring service cadence. The current visit window is visible here, and
                      the recurring pattern is {summary.frequencyLabel?.toLowerCase()}.
                    </div>
                  ) : null}
                </div>
              ) : booking.item_summary ? (
                <div className="mt-6 rounded-3xl border border-black/10 bg-zinc-50 p-7 dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
                    <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
                    Order summary
                  </div>
                  <div className="mt-4 text-[17px] leading-relaxed text-zinc-950 dark:text-white">
                    {booking.item_summary}
                  </div>
                </div>
              ) : null}

              {booking.special_instructions ? (
                <div className="mt-6 rounded-3xl border border-black/10 bg-zinc-50 p-7 dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
                    <ShieldCheck className="h-4 w-4 text-[color:var(--accent)]" />
                    Special instructions
                  </div>
                  <div className="mt-4 text-[17px] leading-relaxed text-zinc-950 dark:text-white">
                    {booking.special_instructions}
                  </div>
                </div>
              ) : null}
            </div>

            <TrackTimeline family={family} status={booking.status} />

            <div className="grid gap-6 lg:grid-cols-3">
              {experienceCards(family).map((card) => {
                const CardIcon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="rounded-3xl border border-black/10 bg-white/85 p-8 shadow-[0_14px_34px_rgba(0,0,0,0.06)] backdrop-blur-0 md:shadow-[0_18px_60px_rgba(0,0,0,0.06)] md:backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.24)]"
                  >
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                      <CardIcon className="h-6 w-6 text-[color:var(--accent)]" />
                    </div>
                    <div className="mt-5 text-2xl font-semibold text-zinc-950 dark:text-white">
                      {card.title}
                    </div>
                    <div className="mt-3 text-[15.5px] leading-relaxed text-zinc-600 dark:text-white/65">
                      {card.body}
                    </div>
                  </div>
                );
              })}
            </div>

            {reviewEligible ? (
              <div className="rounded-[32px] border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 p-8">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                  Completed booking
                </div>
                <div className="mt-3 text-3xl font-bold tracking-[-0.03em] text-zinc-950 dark:text-white">
                  Leave a verified review for this service.
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-white/68">
                  This service has been completed, so you can now share a verified review linked to
                  your tracking code and booking phone number.
                </p>
                <Link
                  href={`/review?code=${encodeURIComponent(booking.tracking_code)}&phone=${encodeURIComponent(booking.phone || "")}`}
                  className="care-button-primary mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Share your review
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-12 text-center">
            <div className="text-xl font-semibold text-red-100">Tracking lookup failed</div>
            <div className="mt-3 text-sm leading-relaxed text-red-100/85">{error || "No matching booking was found."}</div>
            <button
              type="button"
              onClick={() => {
                setSearched(false);
                setError("");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-100"
            >
              Try again
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <CareLoadingStage
            variant="panel"
            eyebrow="HenryCo Care tracking"
            title="Finalizing your tracking lookup"
            description="Preparing service status and timeline details."
            bullets={[
              "Loading booking identity",
              "Resolving latest movement stage",
              "Preparing your next-step guidance",
            ]}
          />
        )}
      </section>
    </main>
  );
}

function DataCard({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-5 rounded-3xl border border-black/10 bg-zinc-50 p-7 dark:border-white/10 dark:bg-white/[0.05]">
      <Icon className="mt-1 h-6 w-6 text-[color:var(--accent)]" />
      <div className="flex-1">
        <div className="text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
          {label}
        </div>
        <div className="mt-3 text-xl font-semibold text-zinc-950 dark:text-white">{children}</div>
      </div>
    </div>
  );
}

function MiniInfo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500 dark:text-white/55">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">{children}</div>
    </div>
  );
}
