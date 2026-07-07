"use client";

/**
 * Interactions gallery (dev-only) — visual + interaction verification for
 * the @henryco/interactions engines. Wraps everything in the DI providers
 * with a console telemetry sink so every Part-VI event is visible in
 * DevTools while you click.
 *
 * Gallery chrome copy is intentionally plain English: this route is a dev
 * harness (guarded out of production), not a user-facing surface — the
 * i18n strict gate applies to shipped pages, not dev tooling. The ENGINE
 * copy, by contrast, is injected via labels props exactly as a real
 * consumer would.
 */

import { useCallback, useEffect, useState } from "react";
import {
  BoostControls,
  ConciergeHandoff,
  CtaButton,
  EarnWithUs,
  InteractionTelemetryProvider,
  JoyState,
  NewsletterEarn,
  PriceReveal,
  PromotedLabel,
  TrustOutcome,
  TrustPaymentMarks,
  TrustQuote,
  TrustSafetyNet,
  TrustStair,
  createConsoleSink,
} from "@henryco/interactions";

const sink = createConsoleSink();

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-zinc-200/85 bg-white p-6 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[#0b1018]/85 sm:p-7">
      <h2 className="text-lg font-semibold tracking-[-0.01em] text-zinc-900 dark:text-white">{title}</h2>
      {note ? <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-white/55">{note}</p> : null}
      <div className="mt-5 flex flex-wrap items-center gap-4">{children}</div>
    </section>
  );
}

export function GalleryClient() {
  const [dark, setDark] = useState(false);
  const [joyKey, setJoyKey] = useState(0);
  const [failNext, setFailNext] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [dark]);

  const succeed = useCallback(async () => {
    await wait(1100);
  }, []);

  const failOnceThenSucceed = useCallback(async () => {
    await wait(900);
    if (failNext) {
      setFailNext(false);
      const err = new Error("simulated network failure");
      err.name = "network";
      throw err;
    }
    setFailNext(true);
  }, [failNext]);

  return (
    <InteractionTelemetryProvider sink={sink}>
      <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-[#050816] sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--site-accent,#C9A227)]">
                @henryco/interactions · dev gallery
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.02em] text-zinc-950 dark:text-white">
                Engines — Tranche 1
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-white/55">
                Telemetry logs to the console. Toggle OS reduced-motion to verify graceful degradation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="min-h-[44px] rounded-full border border-zinc-300/80 px-4 text-sm font-medium text-zinc-700 hover:bg-white dark:border-white/15 dark:text-white dark:hover:bg-white/[0.06]"
            >
              {dark ? "Light" : "Dark"}
            </button>
          </header>

          <Section
            title="Engine 1 — CTA · primary"
            note="Press-scale 98% · width-locked · in-flight verb · 1.5s success collapse."
          >
            <CtaButton
              ctaId="gallery_primary"
              surfaceId="dev_gallery"
              variant="primary"
              onAction={succeed}
              labels={{ inflight: "Booking…", success: "Booked", retry: "Try again", confirm: "Confirm", cancel: "Cancel" }}
            >
              Book a service
            </CtaButton>
          </Section>

          <Section
            title="Engine 1 — CTA · failure → inline retry"
            note="First click fails (console shows cta_failed), retry succeeds. Never a toast."
          >
            <CtaButton
              ctaId="gallery_retry"
              surfaceId="dev_gallery"
              variant="primary"
              onAction={failOnceThenSucceed}
              labels={{ inflight: "Saving…", success: "Saved", retry: "Try again", confirm: "Confirm", cancel: "Cancel" }}
            >
              Save provider
            </CtaButton>
          </Section>

          <Section title="Engine 1 — CTA · secondary" note="Supporting-cast affordance; same machine.">
            <CtaButton
              ctaId="gallery_secondary"
              surfaceId="dev_gallery"
              variant="secondary"
              onAction={succeed}
              labels={{ inflight: "Adding…", success: "Added", retry: "Try again", confirm: "Confirm", cancel: "Cancel" }}
            >
              Add to compare
            </CtaButton>
          </Section>

          <Section
            title="Engine 1 — CTA · destructive two-step"
            note="First click reveals inline Confirm + Cancel (3s window). No modal, ever."
          >
            <CtaButton
              ctaId="gallery_destructive"
              surfaceId="dev_gallery"
              variant="destructive"
              onAction={succeed}
              labels={{ inflight: "Removing…", success: "Removed", retry: "Try again", confirm: "Confirm remove", cancel: "Cancel" }}
            >
              Remove saved provider
            </CtaButton>
          </Section>

          <Section
            title="Engine 8 — Pricing Reveal"
            note="Itemized named fee + explainer tooltip + FX disclosure. Integer minor units; banker's rounding."
          >
            <div className="w-full max-w-sm">
              <PriceReveal
                surfaceId="dev_gallery"
                amountMinor={4500000}
                currency="NGN"
                feeRateBps={750}
                labels={{
                  total: "Total",
                  fee: "Henry Onyx platform fee",
                  feeExplainer: "Supports verification, dispute resolution, and 24/7 support.",
                  net: "Goes to your provider",
                  convertedFrom: "Converted from",
                }}
                fx={{ sourceCurrency: "USD", sourceMinor: 2920, rateLabel: "1 USD = ₦1,540.20", asOf: "2026-07-07 09:00 UTC" }}
              />
            </div>
          </Section>

          <Section
            title="Engine 3 — Trust Reveal"
            note="Stages unlock with behavior (scroll + interactions), never dumped on the hero. Scroll this page to advance browse → consider."
          >
            <TrustStair surfaceId="dev_gallery" stages={["browse", "consider", "commit", "pay"]} interactions={0} className="flex w-full flex-col gap-3">
              <TrustOutcome>
                <p className="text-sm text-zinc-600 dark:text-white/70">Stage 1 · outcome evidence — a real provider, a real number, a real city.</p>
              </TrustOutcome>
              <TrustQuote>
                <p className="text-sm italic text-zinc-600 dark:text-white/70">Stage 2 · one verified quote appears here once you engage.</p>
              </TrustQuote>
              <TrustSafetyNet>
                <p className="text-sm text-zinc-600 dark:text-white/70">Stage 3 · safety net (money-back terms, dispute window).</p>
              </TrustSafetyNet>
              <TrustPaymentMarks>
                <p className="text-sm text-zinc-600 dark:text-white/70">Stage 4 · payment trust marks — only here.</p>
              </TrustPaymentMarks>
            </TrustStair>
          </Section>

          <Section
            title="Engine 7 — Newsletter Earn"
            note="Named value, single field, composes the CTA Engine. Only surfaces after a value moment (predicate tested)."
          >
            <div className="w-full">
              <NewsletterEarn
                surfaceId="dev_gallery"
                labels={{
                  valueStatement: "Weekly: the new verified providers in your city, and one short read worth your time.",
                  placeholder: "you@example.com",
                  submit: "Get the letter",
                  cta: { inflight: "Subscribing…", success: "Subscribed", retry: "Try again", confirm: "Confirm", cancel: "Cancel" },
                }}
                onSubscribe={async () => {
                  await wait(800);
                }}
              />
            </div>
          </Section>

          <Section
            title="Engine 6 — Earn-With-Us"
            note="End-of-page invitation + real server-computed proof. Hidden for already-enrolled roles."
          >
            <div className="w-full">
              <EarnWithUs
                role="care_provider"
                enrolledRoles={[]}
                labels={{
                  invitation: "Are you a verified caregiver?",
                  proof: "Verified providers earned an average of ₦120,000 last month on Henry Onyx.",
                  action: "Start earning",
                }}
                onboardingHref="#provider-onboarding"
              />
            </div>
          </Section>

          <Section
            title="Engine 9 — Concierge Handoff"
            note="Opt-in, never modal. Shown here via the post-success trigger; linger (45s) and bounce (3×) also tested."
          >
            <div className="w-full">
              <ConciergeHandoff
                postSuccess
                labels={{
                  offer: "Want a hand picking? Talk to a Henry Onyx specialist — free for the first message.",
                  action: "Ask a specialist",
                }}
                onOpen={(trigger) => sink.emit({ name: "cta_clicked", props: { cta_id: `concierge_${trigger}`, surface_id: "dev_gallery" } })}
              />
            </div>
          </Section>

          <Section
            title="Engine 10 — Local Boost"
            note="Buyer side: clear Promoted label. Seller side: live projection for the bid before paying."
          >
            <div className="flex w-full flex-col gap-4">
              <PromotedLabel text="Promoted by Adaeze's Fabrics" />
              <BoostControls
                labels={{ bidLabel: "Your boost budget", impressions: "Projected impressions", clicks: "Projected clicks" }}
                currency="NGN"
                locale="en-NG"
                baseline={{ cpmMinor: 50_000, ctr: 0.02 }}
                bidStepsMinor={[25_000, 50_000, 100_000]}
              />
            </div>
          </Section>

          <Section
            title="Engine 5 — Joy · care variant"
            note="≤600ms envelope · single 10ms haptic · one optional next action. Replay to re-run."
          >
            <div className="w-full">
              <JoyState
                key={joyKey}
                variant="care"
                ctaId="gallery_primary"
                surfaceId="dev_gallery"
                outcome={{ subject: "Adaeze", when: "Saturday 10am" }}
                labels={{
                  headline: "Booked",
                  detailTemplate: "Booked with {subject} for {when} — we'll text reminders the day before",
                }}
                nextAction={{ label: "Anything to prepare?", onSelect: () => sink.emit({ name: "cta_clicked", props: { cta_id: "joy_next", surface_id: "dev_gallery" } }) }}
              />
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setJoyKey((k) => k + 1)}
                  className="min-h-[44px] rounded-full px-4 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-white/55 dark:hover:text-white"
                >
                  Replay
                </button>
              </div>
            </div>
          </Section>
        </div>
      </main>
    </InteractionTelemetryProvider>
  );
}
