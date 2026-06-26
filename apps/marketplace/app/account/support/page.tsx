import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageSquare, ShieldCheck } from "lucide-react";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData, getMarketplaceHomeData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { formatDate } from "@/lib/utils";
import type { MarketplaceSupportThread } from "@/lib/marketplace/types";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplaceCustomerAccountCopy } from "@henryco/i18n";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  open: "text-emerald-300",
  pending: "text-amber-300",
  awaiting_buyer: "text-amber-300",
  resolved: "text-[var(--market-muted)]",
  closed: "text-[var(--market-muted)]",
};

const SUBJECT_PRESET_VALUES = [
  "order",
  "payment",
  "vendor",
  "account",
  "trust",
  "other",
] as const;

function formatStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

/**
 * Customer-facing support ticket page.
 *
 * Linked from `/help` (the public help centre) when the visitor cannot
 * find an answer in the FAQ. Auth-gated via `requireMarketplaceUser`
 * so the ticket attaches to the buyer's account, orders, and dispute
 * history without re-typing context on every reply.
 *
 * Form posts to the existing `/api/marketplace` route with intent
 * `support_thread_create`, which inserts into
 * `marketplace_support_threads` + `marketplace_support_messages` and
 * routes an `owner_alert` event to the staff inbox. Vendor scope is
 * preserved from `?vendor=<slug>` query param so a visitor coming
 * from a vendor page lands here with the right store attached.
 */
export default async function AccountSupportPage({
  searchParams,
}: {
  searchParams?: Promise<{ vendor?: string; thread?: string }>;
}) {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplaceCustomerAccountCopy(locale);
  const params = (await searchParams) ?? {};

  const subjectLabels: Record<(typeof SUBJECT_PRESET_VALUES)[number], string> = {
    order: copy.support.subjectOrder,
    payment: copy.support.subjectPayment,
    vendor: copy.support.subjectVendor,
    account: copy.support.subjectAccount,
    trust: copy.support.subjectTrust,
    other: copy.support.subjectOther,
  };
  const subjectPresets = SUBJECT_PRESET_VALUES.map((value) => ({
    value,
    label: subjectLabels[value],
  }));
  const vendorSlug =
    typeof params.vendor === "string" ? params.vendor.trim().toLowerCase() : "";
  const justSubmitted = params.thread === "1";

  const returnPath = vendorSlug
    ? `/account/support?vendor=${encodeURIComponent(vendorSlug)}`
    : "/account/support";

  await requireMarketplaceUser(returnPath);
  const [data, snapshot] = await Promise.all([
    getBuyerDashboardData(),
    getMarketplaceHomeData(),
  ]);

  const vendorRecord = vendorSlug
    ? snapshot.vendors.find((vendor) => vendor.slug === vendorSlug) ?? null
    : null;
  const threads = data.supportThreads ?? [];
  const openThreads = threads.filter(
    (thread) => thread.status === "open" || thread.status === "pending" || thread.status === "awaiting_buyer"
  );
  const closedThreads = threads.filter(
    (thread) => thread.status === "resolved" || thread.status === "closed"
  );
  const supportEmail =
    process.env.RESEND_SUPPORT_INBOX || "support@marketplace.henryonyx.com";

  return (
    <WorkspaceShell
      title={copy.support.title}
      description={copy.support.description}
      {...accountWorkspaceNav("/account/support", locale)}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* ── Form column ─────────────────────────────────────────── */}
        <section>
          {justSubmitted ? (
            <div
              className="
                mb-6 overflow-hidden rounded-[1.4rem]
                border border-[rgba(74,222,128,0.32)]
                bg-gradient-to-br from-[rgba(74,222,128,0.08)] via-transparent to-transparent
                p-5 sm:p-6
              "
              role="status"
            >
              <p className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
                <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                {copy.support.threadOpened}
              </p>
              <h2 className="mt-3 text-balance text-[1.2rem] font-semibold leading-[1.22] tracking-[-0.012em] text-[var(--market-ink)] sm:text-[1.35rem]">
                {copy.support.submittedHeading}
              </h2>
              <p className="mt-3 max-w-xl text-[13.5px] leading-7 text-[var(--market-muted)]">
                {copy.support.submittedBody}
              </p>
            </div>
          ) : null}

          <div className="market-paper rounded-[1.75rem] p-5 sm:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="market-kicker">{copy.support.openTicketKicker}</p>
              {vendorRecord ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--market-line)] bg-black/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-paper-white)]">
                  <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--market-brass)]" />
                  {copy.support.storePrefix.replace("{name}", vendorRecord.name)}
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 text-balance text-[1.4rem] font-semibold leading-[1.16] tracking-[-0.014em] text-[var(--market-ink)] sm:text-[1.65rem]">
              {copy.support.formHeading}
            </h2>
            <p className="mt-3 max-w-xl text-[13.5px] leading-7 text-[var(--market-muted)]">
              {copy.support.formIntro}
            </p>

            <form
              action="/api/marketplace"
              method="POST"
              className="mt-6 space-y-5"
            >
              <input type="hidden" name="intent" value="support_thread_create" />
              <input type="hidden" name="return_to" value={returnPath} />
              {vendorRecord ? (
                <input type="hidden" name="vendor_slug" value={vendorRecord.slug} />
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                    {copy.support.yourName}
                  </span>
                  <input
                    name="contact_name"
                    defaultValue={data.viewer.user?.fullName ?? ""}
                    required
                    autoComplete="name"
                    className="market-input rounded-2xl px-4 py-3"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                    {copy.support.replyToEmail}
                  </span>
                  <input
                    name="contact_email"
                    type="email"
                    defaultValue={data.viewer.user?.email ?? ""}
                    required
                    autoComplete="email"
                    inputMode="email"
                    className="market-input rounded-2xl px-4 py-3"
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  {copy.support.thisIsAbout}
                </span>
                <select
                  name="topic"
                  defaultValue={vendorRecord ? "vendor" : "order"}
                  className="market-input rounded-2xl px-4 py-3"
                >
                  {subjectPresets.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  {copy.support.subjectLabel}
                </span>
                <input
                  name="subject"
                  required
                  maxLength={140}
                  placeholder={copy.support.subjectPlaceholder}
                  className="market-input rounded-2xl px-4 py-3"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  {copy.support.whatHappened}
                </span>
                <textarea
                  name="message"
                  required
                  rows={6}
                  placeholder={copy.support.whatHappenedPlaceholder}
                  className="market-textarea rounded-[1.5rem] px-4 py-3"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  {copy.support.orderNumberOptional}
                </span>
                <input
                  name="order_no"
                  placeholder={copy.support.orderNumberPlaceholder}
                  className="market-input rounded-2xl px-4 py-3"
                />
              </label>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[var(--market-line)] pt-5">
                <button
                  type="submit"
                  className="
                    market-button-primary inline-flex items-center gap-2
                    rounded-full px-5 py-3 text-sm font-semibold transition outline-none
                    focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55
                    focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d]
                    active:translate-y-[0.5px]
                  "
                >
                  <MessageSquare className="h-4 w-4" />
                  {copy.support.openTheTicket}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--market-muted)] underline-offset-4 transition hover:text-[var(--market-ink)] hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {copy.support.backToHelp}
                </Link>
              </div>
            </form>
          </div>

          {/* Trust + privacy footnote — quiet hairline panel */}
          <p className="mt-5 flex items-start gap-2 text-[12px] leading-6 text-[var(--market-muted)]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--market-brass)]" aria-hidden />
            <span>
              {copy.support.privacyNote}{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="font-semibold text-[var(--market-paper-white)] underline-offset-4 hover:underline"
              >
                {copy.support.orEmail.replace("{email}", supportEmail)}
              </a>
              .
            </span>
          </p>
        </section>

        {/* ── Threads column ──────────────────────────────────────── */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <ThreadList
            heading={copy.support.openThreadsHeading}
            kicker={copy.support.activeSuffix.replace("{count}", String(openThreads.length))}
            updatedLabel={copy.support.updatedRelative}
            empty={
              <EmptyThreadHint
                title={copy.support.noOpenThreadsTitle}
                body={copy.support.noOpenThreadsBody}
              />
            }
            threads={openThreads}
          />

          {closedThreads.length > 0 ? (
            <ThreadList
              heading={copy.support.closedHeading}
              kicker={copy.support.resolvedSuffix.replace("{count}", String(closedThreads.length))}
              updatedLabel={copy.support.updatedRelative}
              empty={null}
              threads={closedThreads.slice(0, 5)}
            />
          ) : null}

          {threads.length === 0 ? (
            <EmptyState
              title={copy.support.noTicketsTitle}
              body={copy.support.noTicketsBody}
              ctaHref="/help"
              ctaLabel={copy.support.noTicketsCta}
            />
          ) : null}
        </aside>
      </div>
    </WorkspaceShell>
  );
}

function ThreadList({
  heading,
  kicker,
  updatedLabel,
  empty,
  threads,
}: {
  heading: string;
  kicker: string;
  updatedLabel: string;
  empty: React.ReactNode;
  threads: MarketplaceSupportThread[];
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--market-muted)]">
          {heading}
        </h3>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
          {kicker}
        </span>
      </div>

      {threads.length === 0 ? (
        empty ?? null
      ) : (
        <ol className="mt-3 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
          {threads.map((thread) => {
            const tone = STATUS_TONE[thread.status] ?? "text-[var(--market-muted)]";
            return (
              <li key={thread.id} className="py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[14.5px] font-semibold leading-snug tracking-[-0.005em] text-[var(--market-ink)]">
                    {thread.subject}
                  </p>
                  <span className={`text-[10.5px] font-semibold uppercase tracking-[0.22em] ${tone}`}>
                    {formatStatusLabel(thread.status)}
                  </span>
                </div>
                {thread.lastMessage ? (
                  <p className="mt-1.5 line-clamp-2 max-w-md text-[12.5px] leading-6 text-[var(--market-muted)]">
                    {thread.lastMessage}
                  </p>
                ) : null}
                <p className="mt-2 text-[10.5px] uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  {updatedLabel.replace("{relative}", formatDate(thread.updatedAt))}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function EmptyThreadHint({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-3 rounded-[1.2rem] border border-[var(--market-line)] bg-black/15 px-5 py-4">
      <p className="text-[13px] font-semibold tracking-[-0.005em] text-[var(--market-ink)]">
        {title}
      </p>
      <p className="mt-1.5 text-[12px] leading-6 text-[var(--market-muted)]">{body}</p>
    </div>
  );
}
