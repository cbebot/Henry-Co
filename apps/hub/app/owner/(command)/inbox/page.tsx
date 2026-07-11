import Link from "next/link";
import { Archive, Inbox, Mail, Paperclip, ShieldAlert } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { translateSurfaceLabel } from "@henryco/i18n";
import { BRAND_EMAIL_DOMAIN, COMPANY } from "@henryco/config";
import { requireOwner } from "@/lib/owner-auth";
import { OwnerPageHeader, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import { getInboxList } from "@/lib/owner-inbox/repository";
import { formatDateTime } from "@/lib/format";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

type SearchParams = { address?: string; view?: string };

export default async function OwnerInboxPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Defense in depth: the (command) layout gates the group, but inbox reads use
  // the service-role client (RLS-bypassing) so we re-assert owner access here.
  await requireOwner();
  const sp = await searchParams;
  const locale = await getHubPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const archived = sp.view === "archived";
  const address = sp.address?.trim().toLowerCase() || null;
  const { items, summary, connected } = await getInboxList({ address, archived });

  const baseQuery = (params: { address?: string | null; view?: string | null }) => {
    const q = new URLSearchParams();
    if (params.address) q.set("address", params.address);
    if (params.view) q.set("view", params.view);
    const s = q.toString();
    return s ? `/owner/inbox?${s}` : "/owner/inbox";
  };

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh intervalMs={20000} />

      <OwnerPageHeader
        eyebrow={`${COMPANY.group.name} · ${t("Inbox")}`}
        title={t("Every message to the company, in one place")}
        description={t(
          `Mail sent to any address on ${BRAND_EMAIL_DOMAIN} — support@, contact@, owner@, and the rest — is captured here. Owner-only, content private, attachments held in private storage.`,
        )}
        actions={
          <>
            <Link
              href={baseQuery({ address, view: archived ? null : "archived" })}
              className="acct-button-secondary"
            >
              {archived ? t("Back to inbox") : t("Archived")}
            </Link>
          </>
        }
      />

      {!connected ? (
        <OwnerNotice
          tone="warning"
          title={t("Inbox backend not connected")}
          body={t(
            "The Supabase environment for the hub is not configured here, so received mail cannot be read. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for this deployment.",
          )}
        />
      ) : null}

      {/* ── Filter chips: All + one per address that has received mail ── */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          href={baseQuery({ address: null, view: archived ? "archived" : null })}
          active={!address}
          label={t("All")}
          count={archived ? summary.totalArchived : summary.totalAll}
          unread={archived ? 0 : summary.totalUnread}
        />
        {summary.addresses.map((a) => (
          <FilterChip
            key={a.address}
            href={baseQuery({ address: a.address, view: archived ? "archived" : null })}
            active={address === a.address}
            label={a.label}
            count={a.total}
            unread={a.unread}
          />
        ))}
      </div>

      {summary.addressesCapped ? (
        <p className="text-xs text-[var(--acct-muted)]">
          {t("Per-address counts are approximate for very large inboxes; the header totals are exact.")}
        </p>
      ) : null}

      {/* ── Message list ── */}
      <section className="acct-card overflow-hidden p-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--owner-accent-soft)] text-[var(--owner-accent)]">
              <Inbox size={22} />
            </span>
            <p className="text-base font-semibold text-[var(--acct-ink)]">
              {archived ? t("Nothing archived yet") : t("No mail yet")}
            </p>
            <p className="max-w-md text-sm text-[var(--acct-muted)]">
              {connected
                ? t(
                    "Once Cloudflare Email Routing is enabled on the domain, every message sent to a company address will appear here automatically.",
                  )
                : t("Connect the inbox backend to see received mail.")}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--acct-line)]">
            {items.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/owner/inbox/${m.id}`}
                  prefetch={false}
                  className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--acct-bg-soft)] sm:px-6"
                >
                  <span
                    aria-hidden
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                      m.isRead ? "bg-transparent" : "bg-[var(--owner-accent)]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`truncate text-sm ${
                          m.isRead
                            ? "text-[var(--acct-muted)]"
                            : "font-semibold text-[var(--acct-ink)]"
                        }`}
                      >
                        {m.fromName || m.fromAddress}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-[var(--acct-muted)]">
                        {formatDateTime(m.receivedAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className={`truncate text-sm ${
                          m.isRead ? "text-[var(--acct-muted)]" : "text-[var(--acct-ink)]"
                        }`}
                      >
                        {m.subject}
                      </span>
                      {m.hasAttachments ? (
                        <Paperclip size={13} className="shrink-0 text-[var(--acct-muted)]" />
                      ) : null}
                      {m.isSpam ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--acct-red-soft)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--acct-red-text)]">
                          <ShieldAlert size={11} /> {t("Spoof?")}
                        </span>
                      ) : null}
                    </div>
                    {m.snippet ? (
                      <p className="mt-0.5 truncate text-xs text-[var(--acct-muted)]">{m.snippet}</p>
                    ) : null}
                  </div>
                  <span className="ml-1 hidden shrink-0 items-center gap-1 rounded-full border border-[var(--acct-line)] px-2 py-0.5 text-[10px] font-medium text-[var(--acct-muted)] sm:inline-flex">
                    <Mail size={11} /> {m.toAddress.split("@")[0]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {items.length > 0 ? (
        <p className="flex items-center gap-2 text-xs text-[var(--acct-muted)]">
          <Archive size={13} />
          {t("Showing")} {items.length}{" "}
          {archived ? t("archived messages") : t("messages")}
          {address ? ` · ${address}` : ""}
        </p>
      ) : null}
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
  count,
  unread,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  unread: number;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-[var(--owner-accent)] bg-[var(--owner-accent-soft)] text-[var(--owner-accent)]"
          : "border-[var(--acct-line)] text-[var(--acct-muted)] hover:border-[var(--owner-accent)]/40 hover:text-[var(--acct-ink)]"
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums opacity-70">{count}</span>
      {unread > 0 ? (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--acct-gold)] px-1 text-[10px] font-bold text-[var(--hc-ink-on-accent,#1A1814)]">
          {unread}
        </span>
      ) : null}
    </Link>
  );
}
