import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers3,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/env";
import { getStudioViewer } from "@/lib/studio/auth";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { getStudioTemplateBySlug } from "@/lib/studio/templates";
import { reserveStudioTemplateAction } from "@/lib/studio/template-actions";

export const dynamic = "force-dynamic";

const ERROR_COPY: Record<string, string> = {
  missing_fields:
    "Please fill in your name and email so we can issue the deposit invoice.",
  consent_required:
    "Tick the engagement-terms checkbox to continue. We need your agreement before we can issue an invoice.",
  invalid_email: "That email looks off. Double-check it before we send the invoice.",
  server_error:
    "Something went wrong on our side. Try again in a moment, or contact support if it persists.",
};

const BRAND_VIBES = [
  {
    value: "Quiet luxury and high-trust",
    label: "Quiet luxury",
    body: "Soft type, generous whitespace, deep contrast.",
  },
  {
    value: "Bold and editorial",
    label: "Bold editorial",
    body: "Confident typography, strong imagery, clear hierarchy.",
  },
  {
    value: "Warm and human",
    label: "Warm and human",
    body: "Friendly tone, organic shapes, approachable colour.",
  },
  {
    value: "Confident and corporate",
    label: "Confident corporate",
    body: "Sharp grid, restrained palette, executive feel.",
  },
  {
    value: "Modern and minimal",
    label: "Modern minimal",
    body: "Light, fast, with a single accent doing the work.",
  },
];

const DOMAIN_OPTIONS: Array<{ value: "have" | "new" | "later"; label: string; body: string }> = [
  {
    value: "have",
    label: "I already own a domain",
    body: "We connect it cleanly at launch with the right DNS records.",
  },
  {
    value: "new",
    label: "I want HenryCo to source one",
    body: "We check availability and register on your behalf at cost.",
  },
  {
    value: "later",
    label: "Decide before launch",
    body: "Skip this for now — we lock the domain plan at the launch milestone.",
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const template = getStudioTemplateBySlug(slug);
  if (!template) {
    return { title: "Reserve template", robots: { index: false, follow: false } };
  }
  return {
    title: `Reserve ${template.name} | HenryCo Studio`,
    description: `Reserve the ${template.name} build slot. Pay the deposit and we kick off within ${template.readyInDays} days.`,
    alternates: { canonical: `/checkout/template/${template.slug}` },
    robots: { index: false, follow: false },
  };
}

export default async function TemplateCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error: errorKey } = await searchParams;
  const template = getStudioTemplateBySlug(slug);
  if (!template) notFound();

  const viewer = await getStudioViewer();
  const catalog = await getStudioCatalog();
  const platform = catalog.platform;

  const totalKobo = Math.round(template.price * 100);
  const depositKobo = Math.round(totalKobo * template.depositRate);
  const balanceKobo = totalKobo - depositKobo;

  const errorMessage = errorKey ? ERROR_COPY[errorKey] : null;

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="mx-auto max-w-[80rem] px-5 pb-20 pt-8 sm:px-8 sm:pt-12 lg:px-10"
    >
      <Link
        href={`/pick/${template.slug}`}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)]"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to template
      </Link>

      <header className="mt-6 max-w-3xl">
        <p className="studio-kicker">Instant reserve</p>
        <h1 className="mt-3 text-balance text-[2rem] font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.4rem] md:text-[2.8rem]">
          Reserve {template.name} — pay the deposit, we start in {template.readyInDays} days.
        </h1>
        <p className="mt-4 text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)]">
          No long brief. No back-and-forth. The template is fully scoped, the price is fixed, and
          the milestone plan is in writing. Confirm five details below, pay your deposit, and the
          team starts the moment finance verifies the transfer.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        {/* ───────── Reservation form ───────── */}
        <form
          action={reserveStudioTemplateAction}
          className="rounded-[1.5rem] border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] p-6 sm:p-8"
        >
          <input type="hidden" name="templateSlug" value={template.slug} />

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-[rgba(255,143,143,0.4)] bg-[rgba(255,143,143,0.08)] px-4 py-3 text-[13px] leading-5 text-[#ffb8b8]">
              {errorMessage}
            </div>
          ) : null}

          <fieldset className="space-y-5">
            <legend className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              About you
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Full name"
                required
                input={
                  <input
                    type="text"
                    name="customerName"
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                    defaultValue={viewer.user?.fullName ?? ""}
                    className="portal-input"
                    placeholder="Adaeze Okafor"
                  />
                }
              />
              <Field
                label="Email"
                required
                input={
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    defaultValue={viewer.user?.email ?? ""}
                    className="portal-input"
                    placeholder="you@company.com"
                  />
                }
              />
              <Field
                label="Business name"
                hint="Optional, but it helps us personalise the build."
                input={
                  <input
                    type="text"
                    name="companyName"
                    maxLength={140}
                    autoComplete="organization"
                    className="portal-input"
                    placeholder="Acme Capital"
                  />
                }
              />
              <Field
                label="Phone or WhatsApp"
                hint="Optional — but useful if we need a fast clarification."
                input={
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    maxLength={32}
                    className="portal-input"
                    placeholder="+234 …"
                  />
                }
              />
            </div>
          </fieldset>

          <div className="my-7 portal-divider" />

          <fieldset className="space-y-4">
            <legend className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              Brand direction
            </legend>
            <p className="text-[13px] leading-5 text-[var(--studio-ink-soft)]">
              Pick the visual feel closest to where you want to land. We will explore around it
              during customisation, never against it.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {BRAND_VIBES.map((vibe, index) => (
                <label
                  key={vibe.value}
                  className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.02)] px-4 py-3 transition hover:border-[rgba(151,244,243,0.4)] has-[:checked]:border-[rgba(151,244,243,0.55)] has-[:checked]:bg-[rgba(151,244,243,0.06)]"
                >
                  <input
                    type="radio"
                    name="brandVibe"
                    value={vibe.value}
                    defaultChecked={index === 0}
                    className="mt-1 h-3.5 w-3.5 accent-[var(--studio-signal)]"
                  />
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold text-[var(--studio-ink)]">
                      {vibe.label}
                    </div>
                    <div className="mt-0.5 text-[12px] leading-5 text-[var(--studio-ink-soft)]">
                      {vibe.body}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="my-7 portal-divider" />

          <fieldset className="space-y-4">
            <legend className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              Domain
            </legend>
            <div className="space-y-2">
              {DOMAIN_OPTIONS.map((option, index) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.02)] px-4 py-3 transition hover:border-[rgba(151,244,243,0.4)] has-[:checked]:border-[rgba(151,244,243,0.55)] has-[:checked]:bg-[rgba(151,244,243,0.06)]"
                >
                  <input
                    type="radio"
                    name="domainStatus"
                    value={option.value}
                    defaultChecked={index === 2}
                    className="mt-1 h-3.5 w-3.5 accent-[var(--studio-signal)]"
                  />
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold text-[var(--studio-ink)]">
                      {option.label}
                    </div>
                    <div className="mt-0.5 text-[12px] leading-5 text-[var(--studio-ink-soft)]">
                      {option.body}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <Field
              label="Preferred or existing domain (optional)"
              input={
                <input
                  type="text"
                  name="domainPreference"
                  maxLength={120}
                  className="portal-input"
                  placeholder="acmecapital.ng"
                />
              }
            />
          </fieldset>

          <div className="my-7 portal-divider" />

          <fieldset className="space-y-3">
            <legend className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              Anything else
            </legend>
            <Field
              label="Notes for the team (optional)"
              hint="A sentence or two on what success looks like, or anything we should know."
              input={
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={600}
                  className="portal-textarea"
                  placeholder="We need this live before the launch event on the 24th."
                />
              }
            />
          </fieldset>

          <div className="my-7 portal-divider" />

          <label className="flex items-start gap-3 rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
            <input
              type="checkbox"
              name="consent"
              value="agreed"
              required
              className="mt-1 h-3.5 w-3.5 accent-[var(--studio-signal)]"
            />
            <span className="text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
              I have read and agree to the{" "}
              <Link href="/policies/terms" className="font-semibold text-[var(--studio-signal)] hover:underline">
                HenryCo Studio Terms of Engagement
              </Link>
              ,{" "}
              <Link href="/policies/privacy" className="font-semibold text-[var(--studio-signal)] hover:underline">
                Privacy Policy
              </Link>
              , and{" "}
              <Link href="/policies/refunds" className="font-semibold text-[var(--studio-signal)] hover:underline">
                Refund &amp; Cancellation Policy
              </Link>
              . I understand the deposit reserves my build slot and is non-refundable once kickoff
              begins, per the refund schedule.
            </span>
          </label>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] leading-5 text-[var(--studio-ink-soft)]">
              Next: pay the deposit of{" "}
              <strong className="font-semibold text-[var(--studio-ink)]">
                {formatCurrency(template.price * template.depositRate, "NGN")}
              </strong>{" "}
              by bank transfer.
            </p>
            <button type="submit" className="portal-button portal-button-primary">
              Reserve and continue to payment
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* ───────── Sidebar summary ───────── */}
        <aside className="space-y-4">
          <section className="rounded-[1.5rem] border border-[var(--studio-line-strong)] bg-[radial-gradient(120%_100%_at_0%_0%,rgba(151,244,243,0.08),transparent_55%),linear-gradient(180deg,rgba(8,19,28,0.84),rgba(8,16,22,0.96))] p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="studio-kicker">{template.projectTypeLabel}</p>
                <h2 className="mt-2 text-[1.2rem] font-semibold tracking-[-0.015em] text-[var(--studio-ink)]">
                  {template.name}
                </h2>
              </div>
              <span
                aria-hidden
                className="h-12 w-12 shrink-0 rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${template.preview.from} 0%, ${template.preview.to} 100%)`,
                }}
              />
            </div>
            <p className="mt-3 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
              {template.tagline}
            </p>

            <dl className="mt-5 space-y-3 text-[13px]">
              <SummaryRow
                label="Total"
                value={<strong className="text-[var(--studio-ink)]">{formatCurrency(template.price, "NGN")}</strong>}
              />
              <SummaryRow
                label="Deposit (now)"
                value={
                  <strong className="text-[var(--studio-ink)]">
                    {formatCurrency(depositKobo / 100, "NGN")}
                  </strong>
                }
                accent
              />
              <SummaryRow
                label="Balance (at launch)"
                value={formatCurrency(balanceKobo / 100, "NGN")}
              />
              <SummaryRow
                label="Ready in"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {template.readyInDays} days
                  </span>
                }
              />
            </dl>

            <div className="mt-5 rounded-2xl border border-[var(--studio-line)] bg-[rgba(0,0,0,0.18)] p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                Pay to
              </p>
              <p className="mt-2 text-[13.5px] font-semibold text-[var(--studio-ink)]">
                {platform.paymentBankName || "Bank details on next page"}
              </p>
              <p className="mt-1 text-[12.5px] text-[var(--studio-ink-soft)]">
                {platform.paymentAccountName || "Verified company account"}
                {platform.paymentAccountNumber ? ` · ${platform.paymentAccountNumber}` : ""}
              </p>
            </div>

            <ul className="mt-5 space-y-2 text-[12.5px] text-[var(--studio-ink-soft)]">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" />
                Deposit secured by milestone discipline; refundable on the published schedule.
              </li>
              <li className="flex items-start gap-2">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" />
                Encrypted in transit; private data covered by our NDPA-aligned privacy policy.
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" />
                IP transfers to you on full payment, in writing.
              </li>
            </ul>
          </section>

          <section className="rounded-[1.5rem] border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] p-5">
            <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              <Layers3 className="h-3.5 w-3.5" />
              Included with this template
            </p>
            <ul className="mt-3 space-y-1.5 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
              {template.features.slice(0, 6).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[var(--studio-signal)]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-center text-[11.5px] text-[var(--studio-ink-soft)]">
            Need scope refinement instead?{" "}
            <Link
              href={`/request?template=${template.slug}`}
              className="font-semibold text-[var(--studio-signal)] hover:underline"
            >
              Open the full brief
            </Link>
            .
          </p>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  required,
  input,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  input: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
        {label}
        {required ? <span className="ml-1 text-[#ff8f8f]">*</span> : null}
      </span>
      <div className="mt-2">{input}</div>
      {hint ? (
        <span className="mt-1 block text-[11.5px] leading-5 text-[var(--studio-ink-soft)]">{hint}</span>
      ) : null}
    </label>
  );
}

function SummaryRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${
        accent ? "rounded-xl border border-[rgba(151,244,243,0.35)] bg-[rgba(151,244,243,0.06)] px-3 py-2" : ""
      }`}
    >
      <dt className="text-[var(--studio-ink-soft)]">{label}</dt>
      <dd className="font-semibold text-[var(--studio-ink)]">{value}</dd>
    </div>
  );
}
