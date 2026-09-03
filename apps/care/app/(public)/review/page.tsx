import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { CheckCircle2 } from "lucide-react";
import ReviewForm from "@/components/care/ReviewForm";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

export const metadata: Metadata = {
  title: "Verified Review | Henry Onyx Fabric Care",
  description: "Leave a verified review for a completed Henry Onyx Fabric Care booking.",
};

export default async function ReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{
    code?: string;
    phone?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const code = String(params.code || "").trim().toUpperCase();
  const phone = String(params.phone || "").trim();

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="px-4 pb-24 pt-10 sm:px-6 lg:px-10"
      style={
        {
          "--accent": CARE_ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-[92rem] grid items-start gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <section>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--home-accent-text)]">
            Verified customer voice
          </p>
          <h1 className="mt-5 max-w-3xl text-balance care-display text-[color:var(--home-ink)]">
            Leave a review tied to a real completed booking.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[color:var(--home-ink-70)] sm:text-lg">
            Henry Onyx Fabric Care keeps public feedback genuine and linked to completed bookings. Garment
            care, home cleaning, and office cleaning clients can all share their experience here.
          </p>

          <div className="mt-8">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
              What you need
            </p>
            <ul className="mt-5 divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)]">
              {[
                "The booking tracking code.",
                "The phone number used on that booking.",
                "A service that has already reached its completed stage.",
                "An optional photo if you want to show the finished result.",
              ].map((item) => (
                <li key={item} className="flex gap-3 py-3">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--home-accent-text)]" />
                  <p className="text-sm leading-7 text-[color:var(--home-ink-70)]">{item}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-l-2 border-[color:var(--accent)]/55 pl-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-accent-text)]">
              Verified, not vanity
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--home-ink-70)]">
              Every review is tied to a completed booking. We publish what you write — unedited — and
              nothing from a booking that never completed.
            </p>
          </div>
        </section>

        <ReviewForm initialTrackingCode={code} initialPhone={phone} />
      </div>
    </main>
  );
}
