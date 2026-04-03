import type { Metadata } from "next";
import ReviewForm from "@/components/care/ReviewForm";

export const metadata: Metadata = {
  title: "Verified Review | HenryCo Care",
  description:
    "Leave a verified review for a completed HenryCo Care booking.",
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
    <main className="pb-24 pt-10">
      <section className="mx-auto grid max-w-6xl gap-8 px-6 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-3xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold text-zinc-700 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] dark:text-white/75">
            Verified customer voice
          </div>
          <div>
            <h1 className="text-balance text-5xl font-black leading-[0.95] tracking-[-0.05em] text-zinc-950 dark:text-white sm:text-6xl">
              Leave a review tied to a real completed booking.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-white/68">
              HenryCo Care keeps public feedback genuine and linked to completed bookings. Garment
              care, home cleaning, and office cleaning clients can all share their experience here.
            </p>
          </div>

          <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              What you need
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-600 dark:text-white/65">
              <li>The booking tracking code.</li>
              <li>The phone number used on that booking.</li>
              <li>A service that has already reached its completed stage.</li>
              <li>An optional photo if you want to show the finished result.</li>
            </ul>
          </div>
        </div>

        <ReviewForm initialTrackingCode={code} initialPhone={phone} />
      </section>
    </main>
  );
}
