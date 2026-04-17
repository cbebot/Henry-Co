import Link from "next/link";
import { RouteLiveRefresh } from "@henryco/ui";
import {
  Inbox,
  MailWarning,
  Reply,
  Search,
  ShieldCheck,
  Siren,
  UserRoundPlus,
} from "lucide-react";
import EmptyState from "@/components/owner/EmptyState";
import MetricCard from "@/components/owner/MetricCard";
import { MessagingHubNav } from "@/components/owner/MessagingHubNav";
import { OwnerNotice, OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { formatDateTime, timeAgo } from "@/lib/format";
import { getOwnerIncomingEmailData, type OwnerInboxItem } from "@/lib/owner-messaging-data";

export const dynamic = "force-dynamic";

type PageSearchParams = {
  q?: string | string[];
  state?: string | string[];
  mailbox?: string | string[];
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

function buildQuery(input: { q?: string; state?: string; mailbox?: string }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.state && input.state !== "all") params.set("state", input.state);
  if (input.mailbox && input.mailbox !== "all") params.set("mailbox", input.mailbox);
  const query = params.toString();
  return query ? `/owner/messaging/inbox?${query}` : "/owner/messaging/inbox";
}

function attentionClasses(item: OwnerInboxItem) {
  if (item.attentionState === "resolved") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
  }
  if (item.attentionState === "needs_reply") {
    return "border-amber-500/25 bg-amber-500/10 text-amber-200";
  }
  if (item.attentionState === "unassigned") {
    return "border-red-500/25 bg-red-500/10 text-red-200";
  }
  if (item.attentionState === "needs_triage") {
    return "border-cyan-500/25 bg-cyan-500/10 text-cyan-200";
  }
  return "border-[var(--acct-line)] bg-[var(--acct-bg-soft)] text-[var(--acct-muted)]";
}

function sourceLabel(item: OwnerInboxItem) {
  if (item.source === "provider+log") return "Provider + support log";
  if (item.source === "provider_only") return "Provider only";
  return "Support log";
}

export default async function OwnerMessagingInboxPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const q = readParam(params.q);
  const state = readParam(params.state) || "all";
  const mailbox = readParam(params.mailbox) || "all";
  const data = await getOwnerIncomingEmailData({ q, state, mailbox, limit: 72 });

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh />

      <OwnerPageHeader
        eyebrow="Incoming Company Email"
        title="Owner inbox for live domain mail"
        description="This workspace surfaces real inbound mail captured on HenryCo support mailboxes, reconciles it against support-thread history where possible, and tells you explicitly when a mailbox is only declared in configuration instead of being proven live."
        actions={
          <>
            <a href="https://care.henrycogroup.com/support/inbox" className="acct-button-secondary">
              Open care support desk
            </a>
            <Link href="/owner/messaging/alerts" className="acct-button-primary">
              Review owner alerts
            </Link>
          </>
        }
      />

      <MessagingHubNav />

      <OwnerNotice
        tone={data.provider.configured ? "info" : "warning"}
        title={data.truth.title}
        body={data.truth.body}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Inbound emails" value={data.metrics.total} subtitle="Visible in this owner inbox" icon={Inbox} />
        <MetricCard label="Needs triage" value={data.metrics.needsTriage} subtitle="No confirmed thread linkage yet" icon={MailWarning} />
        <MetricCard label="Needs reply" value={data.metrics.needsReply} subtitle="Customer spoke last" icon={Reply} />
        <MetricCard label="Unassigned" value={data.metrics.unassigned} subtitle="Owner routing still required" icon={UserRoundPlus} />
        <MetricCard label="Mailboxes tracked" value={data.metrics.trackedMailboxes} subtitle="Declared or verified addresses" icon={ShieldCheck} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <OwnerPanel
          title="Inbound feed"
          description="Every row here is a real incoming email event or live provider mailbox item. Nothing is presented as synced if the support trail does not exist."
        >
          <form method="get" className="mb-5 grid gap-3 rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto]">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Search</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--acct-muted)]" />
                <input
                  type="search"
                  name="q"
                  defaultValue={data.filters.q}
                  placeholder="Subject, sender, mailbox, thread ref"
                  className="h-11 w-full rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] pl-10 pr-3 text-sm text-[var(--acct-ink)] outline-none transition focus:border-[var(--owner-accent)]/40"
                />
              </div>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">State</span>
              <select
                name="state"
                defaultValue={data.filters.state}
                className="h-11 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 text-sm text-[var(--acct-ink)] outline-none transition focus:border-[var(--owner-accent)]/40"
              >
                <option value="all">All states</option>
                <option value="needs_triage">Needs triage</option>
                <option value="unassigned">Needs owner routing</option>
                <option value="needs_reply">Customer waiting</option>
                <option value="monitor">Under control</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Mailbox</span>
              <select
                name="mailbox"
                defaultValue={data.filters.mailbox}
                className="h-11 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 text-sm text-[var(--acct-ink)] outline-none transition focus:border-[var(--owner-accent)]/40"
              >
                <option value="all">All tracked mailboxes</option>
                {data.filters.mailboxes.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2 pt-[1.55rem]">
              <button type="submit" className="acct-button-primary">
                Filter
              </button>
              <Link href="/owner/messaging/inbox" className="acct-button-secondary">
                Clear
              </Link>
            </div>
          </form>

          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "needs_triage", label: "Needs triage" },
              { value: "unassigned", label: "Needs routing" },
              { value: "needs_reply", label: "Needs reply" },
              { value: "monitor", label: "Under control" },
              { value: "resolved", label: "Resolved" },
            ].map((chip) => {
              const active = data.filters.state === chip.value;
              return (
                <Link
                  key={chip.value}
                  href={buildQuery({ q: data.filters.q, mailbox: data.filters.mailbox, state: chip.value })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-[var(--acct-gold-soft)] text-[var(--acct-ink)] ring-1 ring-[var(--acct-gold)]/35"
                      : "border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] text-[var(--acct-muted)] hover:text-[var(--acct-ink)]"
                  }`}
                >
                  {chip.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 space-y-4">
            {data.items.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No inbound emails matched this view"
                description="Widen the filters or check the care support desk if you are expecting a newly arrived customer reply."
                action={{ label: "Open care support desk", href: "https://care.henrycogroup.com/support/inbox" }}
              />
            ) : (
              data.items.map((item) => (
                <article key={item.id} className="rounded-[1.35rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${attentionClasses(item)}`}>
                          {item.attentionLabel}
                        </span>
                        <span className="rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                          {sourceLabel(item)}
                        </span>
                        {item.threadRef ? (
                          <span className="rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-ink)]">
                            {item.threadRef}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-lg font-semibold text-[var(--acct-ink)]">
                        {item.subject}
                      </h2>
                      <p className="mt-2 text-sm text-[var(--acct-muted)]">
                        From <span className="font-medium text-[var(--acct-ink)]">{item.senderName || item.senderEmail || "Unknown sender"}</span>
                        {item.senderEmail ? ` • ${item.senderEmail}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-[var(--acct-muted)]">
                        Mailbox: <span className="font-medium text-[var(--acct-ink)]">{item.mailbox || "Unresolved inbox"}</span>
                        {item.receivedAt ? ` • Received ${formatDateTime(item.receivedAt)}` : ""}
                        {item.receivedAt || item.capturedAt ? ` • ${timeAgo(item.receivedAt || item.capturedAt || "")}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a href={item.actionHref} className="acct-button-secondary">
                        Open support desk
                      </a>
                      {item.replyHref ? (
                        <a href={item.replyHref} className="acct-button-primary">
                          Reply from care desk
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {item.preview ? (
                    <p className="mt-4 rounded-[1rem] border border-[var(--acct-line)] bg-[var(--acct-bg)] px-4 py-3 text-sm leading-7 text-[var(--acct-muted)]">
                      {item.preview}
                    </p>
                  ) : null}

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[1rem] border border-[var(--acct-line)] bg-[var(--acct-bg)] px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Thread status</div>
                      <div className="mt-2 text-sm font-medium text-[var(--acct-ink)]">{item.threadStatus || "Not linked yet"}</div>
                    </div>
                    <div className="rounded-[1rem] border border-[var(--acct-line)] bg-[var(--acct-bg)] px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Assigned to</div>
                      <div className="mt-2 text-sm font-medium text-[var(--acct-ink)]">{item.assignedToName || "Needs routing"}</div>
                      <div className="mt-1 text-xs text-[var(--acct-muted)]">{item.assignedToRole || "Owner or support manager should assign this."}</div>
                    </div>
                    <div className="rounded-[1rem] border border-[var(--acct-line)] bg-[var(--acct-bg)] px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Support replies</div>
                      <div className="mt-2 text-sm font-medium text-[var(--acct-ink)]">{item.replyCount}</div>
                      <div className="mt-1 text-xs text-[var(--acct-muted)]">
                        {item.lastSupportReplyAt ? `Last reply ${timeAgo(item.lastSupportReplyAt)}` : "No confirmed support reply yet."}
                      </div>
                    </div>
                    <div className="rounded-[1rem] border border-[var(--acct-line)] bg-[var(--acct-bg)] px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Attachments</div>
                      <div className="mt-2 text-sm font-medium text-[var(--acct-ink)]">{item.attachmentCount}</div>
                      <div className="mt-1 text-xs text-[var(--acct-muted)]">
                        {item.fetchReason || (item.providerMessageId ? "Provider message captured." : "No provider fetch note recorded.")}
                      </div>
                    </div>
                  </div>

                  {item.recipients.length > 0 || item.cc.length > 0 || item.bcc.length > 0 ? (
                    <div className="mt-4 rounded-[1rem] border border-[var(--acct-line)] bg-[var(--acct-bg)] px-4 py-3 text-sm text-[var(--acct-muted)]">
                      <div><span className="font-semibold text-[var(--acct-ink)]">To:</span> {item.recipients.length ? item.recipients.join(", ") : "—"}</div>
                      <div className="mt-1"><span className="font-semibold text-[var(--acct-ink)]">CC:</span> {item.cc.length ? item.cc.join(", ") : "—"}</div>
                      <div className="mt-1"><span className="font-semibold text-[var(--acct-ink)]">BCC:</span> {item.bcc.length ? item.bcc.join(", ") : "—"}</div>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </OwnerPanel>

        <div className="space-y-6">
          <OwnerPanel
            title="Mailbox coverage"
            description="Every company-domain support address is labeled with receiving truth so the owner never confuses a declared email address with a live routed inbox."
          >
            <div className="space-y-3">
              {data.coverage.map((mailboxItem) => (
                <div key={mailboxItem.email} className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--acct-ink)]">{mailboxItem.label}</div>
                      <div className="mt-1 text-sm text-[var(--acct-muted)]">{mailboxItem.email}</div>
                    </div>
                    <span className="rounded-full border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-ink)]">
                      {mailboxItem.mode.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">{mailboxItem.note}</p>
                  <p className="mt-3 text-xs text-[var(--acct-muted)]">
                    Recent inbound items: <span className="font-semibold text-[var(--acct-ink)]">{mailboxItem.recentCount}</span>
                    {mailboxItem.lastReceivedAt ? ` • Last seen ${formatDateTime(mailboxItem.lastReceivedAt)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </OwnerPanel>

          <OwnerPanel
            title="Provider and sync status"
            description="These diagnostics explain whether the owner inbox is reading live mailbox state, webhook-only support history, or neither."
          >
            <div className="space-y-3">
              <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
                  {data.provider.configured ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <MailWarning className="h-4 w-4 text-amber-300" />}
                  Provider state
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">{data.provider.reason}</p>
                <p className="mt-3 text-xs text-[var(--acct-muted)]">
                  Support inbox: <span className="font-semibold text-[var(--acct-ink)]">{data.provider.supportInbox || "Not configured"}</span>
                </p>
              </div>

              <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-ink)]">
                  <Siren className="h-4 w-4 text-[var(--owner-accent)]" />
                  Latest inbound sync
                </div>
                <div className="mt-3 space-y-2 text-sm text-[var(--acct-muted)]">
                  <p>Completed: <span className="font-semibold text-[var(--acct-ink)]">{data.sync.lastCompletedAt ? formatDateTime(data.sync.lastCompletedAt) : "No successful sync logged yet"}</span></p>
                  <p>Processed: <span className="font-semibold text-[var(--acct-ink)]">{data.sync.lastProcessedCount}</span> • Duplicates: <span className="font-semibold text-[var(--acct-ink)]">{data.sync.lastDuplicateCount}</span> • Ignored: <span className="font-semibold text-[var(--acct-ink)]">{data.sync.lastIgnoredCount}</span></p>
                  <p>Last failure: <span className="font-semibold text-[var(--acct-ink)]">{data.sync.lastFailureAt ? formatDateTime(data.sync.lastFailureAt) : "No recent failure"}</span></p>
                  {data.sync.lastFailureReason ? (
                    <p className="rounded-[0.9rem] border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-xs leading-6 text-[var(--acct-muted)]">
                      {data.sync.lastFailureReason}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <div className="text-sm font-semibold text-[var(--acct-ink)]">Recommended owner actions</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href="https://care.henrycogroup.com/support/inbox" className="acct-button-secondary">
                    Review support desk
                  </a>
                  <a href="https://care.henrycogroup.com/support/inbox?mailbox=unreplied" className="acct-button-secondary">
                    Check unreplied threads
                  </a>
                  <Link href="/owner/messaging/queues" className="acct-button-secondary">
                    Delivery queues
                  </Link>
                </div>
              </div>
            </div>
          </OwnerPanel>
        </div>
      </div>
    </div>
  );
}
