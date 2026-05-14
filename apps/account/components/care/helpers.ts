import type { LinkedCareBooking } from "@/lib/care-sync";

export type CareLocale = "en" | "fr";

const SHORT_MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const SHORT_MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export function formatStamp(iso: string | null | undefined, locale: CareLocale = "en"): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  const months = locale === "fr" ? SHORT_MONTHS_FR : SHORT_MONTHS_EN;
  return `${d.getUTCDate().toString().padStart(2, "0")} ${months[d.getUTCMonth()]}`;
}

export function formatBookingWhen(
  date: string | null | undefined,
  slot: string | null | undefined,
  locale: CareLocale = "en",
): string {
  if (!date) return locale === "fr" ? "À planifier" : "To be scheduled";
  const stamp = formatStamp(date, locale);
  if (!slot) return stamp;
  return `${stamp} · ${slot}`;
}

const NF_NGN = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

export function formatNaira(amount: number | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `₦${NF_NGN.format(n)}`;
}

/* ---- Status taxonomy ------------------------------------------------ */

export type StatusKind = "live" | "scheduled" | "completed" | "issue" | "payment";

const COMPLETED_STATUSES = new Set([
  "delivered",
  "customer_confirmed",
  "inspection_completed",
  "service_completed",
  "supervisor_signoff",
]);

const ISSUE_STATUSES = new Set(["cancelled", "issue", "exception", "rejected"]);

const SCHEDULED_STATUSES = new Set(["booked", "scheduled", "confirmed"]);

const PAYMENT_STATUSES = new Set([
  "awaiting_payment",
  "receipt_submitted",
  "under_review",
  "awaiting_corrected_proof",
  "awaiting_receipt",
]);

export function statusKind(booking: LinkedCareBooking): StatusKind {
  const verification = booking.payment.verificationStatus.toLowerCase();
  const status = String(booking.status || "").toLowerCase();
  if (booking.payment.balanceDue > 0 || PAYMENT_STATUSES.has(verification)) return "payment";
  if (ISSUE_STATUSES.has(status)) return "issue";
  if (COMPLETED_STATUSES.has(status)) return "completed";
  if (SCHEDULED_STATUSES.has(status)) return "scheduled";
  return "live";
}

export function statusLabel(booking: LinkedCareBooking, locale: CareLocale = "en"): string {
  const kind = statusKind(booking);
  if (locale === "fr") {
    if (kind === "payment") return "Paiement à vérifier";
    if (kind === "issue") return "Action requise";
    if (kind === "completed") return "Terminée";
    if (kind === "scheduled") return "Planifiée";
    return "En cours";
  }
  if (kind === "payment") return "Payment review";
  if (kind === "issue") return "Action needed";
  if (kind === "completed") return "Completed";
  if (kind === "scheduled") return "Scheduled";
  return "In service";
}

/* ---- Aggregate stats ----------------------------------------------- */

export type CareStats = {
  total: number;
  inFlight: number;
  scheduled: number;
  completed: number;
  needsPayment: number;
  needsAttention: number;
  outstandingBalanceKobo: number;
  topActiveBooking: LinkedCareBooking | null;
};

export function careStats(bookings: ReadonlyArray<LinkedCareBooking>): CareStats {
  let inFlight = 0;
  let scheduled = 0;
  let completed = 0;
  let needsPayment = 0;
  let needsAttention = 0;
  let outstandingBalanceKobo = 0;
  let topActiveBooking: LinkedCareBooking | null = null;

  for (const booking of bookings) {
    const kind = statusKind(booking);
    if (kind === "payment") {
      needsPayment += 1;
      outstandingBalanceKobo += booking.payment.balanceDue;
    } else if (kind === "issue") {
      needsAttention += 1;
    } else if (kind === "completed") {
      completed += 1;
    } else if (kind === "scheduled") {
      scheduled += 1;
    } else {
      inFlight += 1;
    }

    if (topActiveBooking === null && (kind === "payment" || kind === "issue" || kind === "live" || kind === "scheduled")) {
      topActiveBooking = booking;
    }
  }

  return {
    total: bookings.length,
    inFlight,
    scheduled,
    completed,
    needsPayment,
    needsAttention,
    outstandingBalanceKobo,
    topActiveBooking,
  };
}

/* ---- Hero state + copy --------------------------------------------- */

export type HeroState = "empty" | "calm" | "active" | "attention";

export function heroState(stats: CareStats): HeroState {
  if (stats.total === 0) return "empty";
  if (stats.needsPayment > 0 || stats.needsAttention > 0) return "attention";
  if (stats.inFlight > 0) return "active";
  return "calm";
}

export type HeroCopy = {
  headline: string;
  blurb: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
};

const CARE_BOOK_URL = "https://care.henrycogroup.com/book";
const CARE_TRACK_URL = "https://care.henrycogroup.com/track";

export function buildHeroCopy(
  state: HeroState,
  stats: CareStats,
  locale: CareLocale = "en",
): HeroCopy {
  if (locale === "fr") {
    if (state === "empty") {
      return {
        headline: "Réservez votre première prestation Care.",
        blurb: "Les services Care que vous réservez ici se synchronisent automatiquement dans cette pièce — code de suivi, paiement, et prochaine étape opérationnelle.",
        ctaPrimary: { label: "Réserver un service", href: CARE_BOOK_URL },
        ctaSecondary: { label: "Ouvrir le suivi", href: CARE_TRACK_URL },
      };
    }
    if (state === "attention") {
      const n = stats.needsPayment + stats.needsAttention;
      return {
        headline: `${n} action${n === 1 ? "" : "s"} à mener.`,
        blurb: "Une ou plusieurs réservations attendent une preuve de paiement ou un suivi. Ouvrez la réservation concernée ci-dessous.",
        ctaPrimary: { label: "Voir les réservations", href: "#care-bookings" },
        ctaSecondary: { label: "Ouvrir le suivi", href: CARE_TRACK_URL },
      };
    }
    if (state === "active") {
      return {
        headline: `${stats.inFlight} prestation${stats.inFlight === 1 ? "" : "s"} en cours.`,
        blurb: "Suivi en direct, paiement vérifié, et étape opérationnelle suivante mirroirés depuis HenryCo Care vers cette pièce.",
        ctaPrimary: { label: "Ouvrir le suivi", href: CARE_TRACK_URL },
        ctaSecondary: { label: "Réserver un service", href: CARE_BOOK_URL },
      };
    }
    return {
      headline: `${stats.total} réservation${stats.total === 1 ? "" : "s"} liée${stats.total === 1 ? "" : "s"}.`,
      blurb: "Vos réservations Care, codes de suivi, reçus et prochaines actions réunis au même endroit — synchronisés en temps réel.",
      ctaPrimary: { label: "Réserver un service", href: CARE_BOOK_URL },
      ctaSecondary: { label: "Ouvrir le suivi", href: CARE_TRACK_URL },
    };
  }

  if (state === "empty") {
    return {
      headline: "Book your first Care service.",
      blurb: "Care services you book here sync automatically into this room — tracking code, payment status, and the next operational step.",
      ctaPrimary: { label: "Book a service", href: CARE_BOOK_URL },
      ctaSecondary: { label: "Open tracking", href: CARE_TRACK_URL },
    };
  }
  if (state === "attention") {
    const n = stats.needsPayment + stats.needsAttention;
    return {
      headline: `${n} ${n === 1 ? "action" : "actions"} to take.`,
      blurb: "One or more bookings are waiting on payment verification or a follow-up. Open the booking below to clear it.",
      ctaPrimary: { label: "Review bookings", href: "#care-bookings" },
      ctaSecondary: { label: "Open tracking", href: CARE_TRACK_URL },
    };
  }
  if (state === "active") {
    return {
      headline: `${stats.inFlight} service${stats.inFlight === 1 ? "" : "s"} in motion.`,
      blurb: "Live tracking, payment verification, and the next operational step are mirrored from HenryCo Care into this room.",
      ctaPrimary: { label: "Open tracking", href: CARE_TRACK_URL },
      ctaSecondary: { label: "Book a service", href: CARE_BOOK_URL },
    };
  }
  return {
    headline: `${stats.total} booking${stats.total === 1 ? "" : "s"} on record.`,
    blurb: "Your Care bookings, tracking codes, receipts, and upcoming actions — all in one place, synced in real time.",
    ctaPrimary: { label: "Book a service", href: CARE_BOOK_URL },
    ctaSecondary: { label: "Open tracking", href: CARE_TRACK_URL },
  };
}

/* ---- Activity helpers (mirror property pattern) -------------------- */

export type CareActivityRow = {
  id: string;
  activityType: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  occurredAt: string;
  actionUrl: string | null;
};

export function toCareActivityRows(
  raw: ReadonlyArray<Record<string, unknown>>,
): CareActivityRow[] {
  return raw.map((row, idx) => ({
    id: String(row.id || `${row.activity_type || "care"}-${idx}`),
    activityType: row.activity_type ? String(row.activity_type) : null,
    title: row.title ? String(row.title) : null,
    description: row.description ? String(row.description) : null,
    status: row.status ? String(row.status) : null,
    occurredAt: String(row.created_at || ""),
    actionUrl: row.action_url ? String(row.action_url) : null,
  }));
}
