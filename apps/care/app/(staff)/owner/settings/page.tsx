import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Globe,
  Image as ImageIcon,
  Mail,
  Phone,
  Settings2,
} from "lucide-react";
import CareAssetUploadField from "@/components/admin/CareAssetUploadField";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { requireRoles } from "@/lib/auth/server";
import { getAdminSettings } from "@/lib/admin/care-admin";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { saveSettingsAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Settings | Henry & Co. Fabric Care",
  description:
    "Owner settings for public presentation, domains, payment details, media, and customer messaging.",
};

export default async function OwnerSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ ok?: string; error?: string }>;
}) {
  await requireRoles(["owner"]);
  await logProtectedPageAccess("/owner/settings");

  const settings = await getAdminSettings();
  const params = (await searchParams) ?? {};
  const ok = String(params.ok || "").trim();
  const error = String(params.error || "").trim();

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-black/10 bg-white/80 p-8 shadow-[0_22px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-deep)] dark:text-[color:var(--accent)]">
          Owner settings
        </div>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.03em] text-zinc-950 dark:text-white sm:text-5xl">
          Shape the public brand, payment guidance, and customer communication.
        </h1>
        <p className="mt-4 max-w-3xl text-zinc-600 dark:text-white/65">
          These settings drive the public presentation, support contact details, payment instructions, and the service updates customers receive after booking.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <QuickLink href="/owner">Owner dashboard</QuickLink>
          <QuickLink href="/owner/pricing">Pricing</QuickLink>
          <QuickLink href="/owner/finance">Finance</QuickLink>
          <QuickLink href="/owner/bookings">Bookings</QuickLink>
        </div>

        {ok ? (
          <div className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100">
            {ok}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">
            {error}
          </div>
        ) : null}
      </section>

      <form action={saveSettingsAction} className="grid gap-8">
        <input type="hidden" name="source_route" value="/owner/settings" />

        <SectionCard
          icon={Settings2}
          eyebrow="Core presentation"
          title="Public brand and company story"
          subtitle="These fields shape the public face of the care division."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Hero badge">
              <input name="hero_badge" defaultValue={settings?.hero_badge || ""} className={inputCls} />
            </Field>
            <Field label="Pickup hours">
              <input name="pickup_hours" defaultValue={settings?.pickup_hours || ""} className={inputCls} />
            </Field>
          </div>

          <Field label="Hero title">
            <input name="hero_title" defaultValue={settings?.hero_title || ""} className={inputCls} />
          </Field>

          <Field label="Hero subtitle">
            <textarea
              name="hero_subtitle"
              defaultValue={settings?.hero_subtitle || ""}
              rows={4}
              className={textareaCls}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="About title">
              <input name="about_title" defaultValue={settings?.about_title || ""} className={inputCls} />
            </Field>
            <Field label="Pricing note">
              <input name="pricing_note" defaultValue={settings?.pricing_note || ""} className={inputCls} />
            </Field>
          </div>

          <Field label="About body">
            <textarea
              name="about_body"
              defaultValue={settings?.about_body || ""}
              rows={5}
              className={textareaCls}
            />
          </Field>
        </SectionCard>

        <SectionCard
          icon={Globe}
          eyebrow="Domains and links"
          title="Public site routing"
          subtitle="Keep the care division, hub, and public site references clean and editable."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Public site URL">
              <input name="public_site_url" defaultValue={settings?.public_site_url || ""} className={inputCls} />
            </Field>
            <Field label="Care domain">
              <input name="care_domain" defaultValue={settings?.care_domain || ""} className={inputCls} />
            </Field>
            <Field label="Hub domain">
              <input name="hub_domain" defaultValue={settings?.hub_domain || ""} className={inputCls} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={ImageIcon}
          eyebrow="Visual assets"
          title="Media and identity"
          subtitle="Upload directly to Cloudinary, auto-fill the asset URL, and preview what the public app will render."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <CareAssetUploadField
              label="Logo URL"
              name="logo_url"
              value={settings?.logo_url || ""}
              folder="brand/logo"
              publicIdPrefix="logo"
              hint="Used in the staff shell, public navigation, and metadata fallback surfaces."
            />
            <CareAssetUploadField
              label="Favicon URL"
              name="favicon_url"
              value={settings?.favicon_url || ""}
              folder="brand/favicon"
              publicIdPrefix="favicon"
              hint="Used for metadata icons and browser chrome."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CareAssetUploadField
              label="Hero image URL"
              name="hero_image_url"
              value={settings?.hero_image_url || ""}
              folder="brand/hero"
              publicIdPrefix="hero"
              hint="Rendered on the public homepage hero and should be a wide editorial image."
            />
            <CareAssetUploadField
              label="Promo video URL"
              name="promo_video_url"
              value={settings?.promo_video_url || ""}
              folder="brand/promo"
              publicIdPrefix="promo"
              assetKind="video"
              hint="Ideal for a short service reel, behind-the-scenes clip, or premium brand motion asset."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Promo video title">
              <input name="promo_video_title" defaultValue={settings?.promo_video_title || ""} className={inputCls} />
            </Field>
            <Field label="Promo video body">
              <input name="promo_video_body" defaultValue={settings?.promo_video_body || ""} className={inputCls} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={Phone}
          eyebrow="Contact"
          title="Support communication"
          subtitle="These details can be shown publicly and reused in customer communication."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Support email">
              <input name="support_email" defaultValue={settings?.support_email || ""} className={inputCls} />
            </Field>
            <Field label="Support phone">
              <input name="support_phone" defaultValue={settings?.support_phone || ""} className={inputCls} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={CreditCard}
          eyebrow="Payment details"
          title="Company account information"
          subtitle="Customers can receive this payment context by email immediately, and support can reuse the same fallback channels during verification."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Account name">
              <input
                name="company_account_name"
                defaultValue={settings?.company_account_name || ""}
                className={inputCls}
              />
            </Field>
            <Field label="Account number">
              <input
                name="company_account_number"
                defaultValue={settings?.company_account_number || ""}
                className={inputCls}
              />
            </Field>
            <Field label="Bank name">
              <input
                name="company_bank_name"
                defaultValue={settings?.company_bank_name || ""}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Payment currency">
              <input
                name="payment_currency"
                defaultValue={settings?.payment_currency || "NGN"}
                className={inputCls}
              />
            </Field>
            <Field label="Payment WhatsApp">
              <input
                name="payment_whatsapp"
                defaultValue={settings?.payment_whatsapp || ""}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Payment support email">
              <input
                name="payment_support_email"
                defaultValue={settings?.payment_support_email || ""}
                className={inputCls}
              />
            </Field>
            <Field label="Payment support WhatsApp">
              <input
                name="payment_support_whatsapp"
                defaultValue={settings?.payment_support_whatsapp || ""}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Payment instructions">
              <textarea
                name="payment_instructions"
                defaultValue={settings?.payment_instructions || ""}
                rows={4}
                className={textareaCls}
              />
          </Field>
        </SectionCard>

        <SectionCard
          icon={Mail}
          eyebrow="Notification identity"
          title="Sender and reply routing"
          subtitle="Keep transactional messaging looking deliberate, and route replies back to the right Care inbox."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Notification sender name">
              <input
                name="notification_sender_name"
                defaultValue={settings?.notification_sender_name || ""}
                className={inputCls}
              />
            </Field>
            <Field label="Notification reply-to email">
              <input
                name="notification_reply_to_email"
                defaultValue={settings?.notification_reply_to_email || ""}
                className={inputCls}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={Mail}
          eyebrow="Picked-up email"
          title="Customer email template"
          subtitle="This is the template the payment request flow can read when an order is marked picked up or ready for payment follow-through."
        >
          <Field label="Email subject">
            <input
              name="picked_up_email_subject"
              defaultValue={
                settings?.picked_up_email_subject ||
                "Your order has been picked up — payment details inside"
              }
              className={inputCls}
            />
          </Field>

          <Field label="Email body">
            <textarea
              name="picked_up_email_body"
              defaultValue={
                settings?.picked_up_email_body ||
                `Hello {customer_name},

Your order with tracking code {tracking_code} has now been picked up successfully.

Amount due: {amount_due}

Please make payment to:
Account name: {account_name}
Account number: {account_number}
Bank: {bank_name}

After payment, kindly send proof to our company email or WhatsApp.
{payment_instructions}

Thank you,
Henry & Co. Fabric Care`
              }
              rows={10}
              className={textareaCls}
            />
          </Field>

          <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
            Suggested template variables:{" "}
            <span className="font-semibold">
              {"{customer_name}, {tracking_code}, {amount_due}, {account_name}, {account_number}, {bank_name}, {payment_instructions}"}
            </span>
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center gap-3">
          <PendingSubmitButton
            label="Save settings"
            pendingLabel="Saving settings"
            className="h-12 rounded-2xl px-6 text-[#07111F]"
          />

          <Link
            href="/owner"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-black/10 bg-white px-6 text-sm font-semibold text-zinc-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            Back to dashboard
          </Link>
        </div>
      </form>
    </div>
  );
}

function QuickLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function SectionCard({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-6 w-6 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]" />
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-deep)] dark:text-[color:var(--accent)]">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-3xl font-bold text-zinc-950 dark:text-white">{title}</h2>
      <p className="mt-2 text-zinc-600 dark:text-white/65">{subtitle}</p>
      <div className="mt-6 grid gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-800 dark:text-white/85">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

const textareaCls =
  "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";
