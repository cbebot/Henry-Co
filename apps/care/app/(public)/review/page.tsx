import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { CheckCircle2 } from "lucide-react";
import ReviewForm from "@/components/care/ReviewForm";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

export const metadata: Metadata = {
  title: "Verified Review | HenryCo Care",
  description: "Leave a verified review for a completed HenryCo Care booking.",
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
      className="px-4 pb-24 pt-10 sm:px-6 lg:px-10"
      style={
        {
          "--accent": CARE_ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-[88rem] grid items-start gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <section>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--accent)]">
            Verified customer voice
          </p>
          <h1 className="mt-5 max-w-3xl text-balance care-display text-zinc-950 dark:text-white">
            Leave a review tied to a real completed booking.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-zinc-600 sm:text-lg dark:text-white/68">
            HenryCo Care keeps public feedback genuine and linked to completed bookings. Garment
            care, home cleaning, and office cleaning clients can all share their experience here.
          </p>

          <div className="mt-8">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
              What you need
            </p>
            <ul className="mt-5 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
              {[
                "The booking tracking code.",
                "The phone number used on that booking.",
                "A service that has already reached its completed stage.",
                "An optional photo if you want to show the finished result.",
              ].map((item) => (
                <li key={item} className="flex gap-3 py-3">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
                  <p className="text-sm leading-7 text-zinc-600 dark:text-white/68">{item}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-l-2 border-[color:var(--accent)]/55 pl-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
              Why we ask for the code
            </p>
            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
              Tying reviews to a tracking code keeps the feedback honest. We never publish reviews
              from bookings that did not complete, and we never invent or rewrite what you submit.
            </p>
          </div>
        </section>

        <ReviewForm initialTrackingCode={code} initialPhone={phone} />
      </div>
    </main>
  );
}
