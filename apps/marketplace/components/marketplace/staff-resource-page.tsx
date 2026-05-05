import { EmptyState, MetricCard, WorkspaceShell } from "@/components/marketplace/shell";
import {
  getMarketplaceHomeData,
  getStaffOverviewData,
  getStaffQueueData,
} from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

type StaffRoot = "/admin" | "/finance" | "/moderation" | "/operations" | "/owner" | "/support";

const rootMeta: Record<StaffRoot, { title: string; description: string }> = {
  "/admin": {
    title: "Admin",
    description: "Catalog, seller, campaign, and notification resources live here with cleaner operational control.",
  },
  "/finance": {
    title: "Finance",
    description: "Payments, verification, payouts, and money-linked audit trails stay isolated here.",
  },
  "/moderation": {
    title: "Moderation",
    description: "Product approvals, risk signals, disputes, and audit visibility stay grouped here.",
  },
  "/operations": {
    title: "Operations",
    description: "Orders, low stock, delays, and automation pressure stay visible before support fires erupt.",
  },
  "/owner": {
    title: "Owner",
    description: "Executive alerts, digest views, settings, and audit visibility stay concentrated here.",
  },
  "/support": {
    title: "Support",
    description: "Disputes, returns, support threads, and notification health stay traceable here.",
  },
};

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function StaffResourcePage({
  root,
  resource,
}: {
  root: StaffRoot;
  resource: string;
}) {
  const [snapshot, queue, overview] = await Promise.all([
    getMarketplaceHomeData(),
    getStaffQueueData(),
    getStaffOverviewData(),
  ]);

  const nav = staffNav(`${root}/${resource}`, root);
  const title = titleCase(resource);

  if (root === "/admin" && resource === "seller-applications") {
    return (
      <WorkspaceShell title="Seller applications" description="Review and action seller onboarding requests." nav={nav}>
        <div className="space-y-4">
          {queue.applications.length ? (
            queue.applications.map((application: Record<string, unknown>) => (
              <article key={String(application.id)} className="market-paper rounded-[1.75rem] p-5">
                <p className="market-kicker">{String(application.status || "submitted")}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
                  {String(application.store_name || application.proposed_store_slug || "Store application")}
                </h2>
                <p className="mt-2 text-sm text-[var(--market-muted)]">
                  {formatDate(String(application.submitted_at || new Date().toISOString()))}
                </p>
                <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-3">
                  <input type="hidden" name="intent" value="admin_vendor_application_decision" />
                  <input type="hidden" name="application_id" value={String(application.id)} />
                  <input type="hidden" name="return_to" value={`${root}/${resource}`} />
                  <input name="review_note" className="market-input min-w-[220px] rounded-full px-4 py-2" placeholder="Review note" />
                  <button name="decision" value="approved" className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">Approve</button>
                  <button name="decision" value="changes_requested" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Changes</button>
                  <button name="decision" value="rejected" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Reject</button>
                </form>
              </article>
            ))
          ) : (
            <EmptyState title="No seller applications are waiting." body="New seller applications will appear here with review controls and moderation notes." />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if ((root === "/admin" && resource === "products") || (root === "/moderation" && resource === "product-approvals")) {
    const items =
      root === "/moderation"
        ? queue.products.filter((item: Record<string, unknown>) => String(item.approval_status) !== "approved")
        : queue.products;

    return (
      <WorkspaceShell title={title} description="Review catalog quality, stock posture, and approval state." nav={nav}>
        <div className="space-y-4">
          {items.length ? (
            items.map((product: Record<string, unknown>) => (
              <article key={String(product.id)} className="market-paper rounded-[1.75rem] p-5">
                <p className="market-kicker">{String(product.approval_status || "draft")}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
                  {String(product.title || "Product")}
                </h2>
                <p className="mt-2 text-sm text-[var(--market-muted)]">
                  Stock: {String(product.total_stock || 0)}
                </p>
                <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-3">
                  <input type="hidden" name="intent" value="admin_product_decision" />
                  <input type="hidden" name="product_id" value={String(product.id)} />
                  <input type="hidden" name="return_to" value={`${root}/${resource}`} />
                  <input name="review_note" className="market-input min-w-[220px] rounded-full px-4 py-2" placeholder="Moderation note" />
                  <button name="decision" value="approved" className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">Approve</button>
                  <button name="decision" value="changes_requested" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Changes</button>
                  <button name="decision" value="rejected" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Reject</button>
                </form>
              </article>
            ))
          ) : (
            <EmptyState title="No products are waiting." body="Approved and pending catalog items will appear here." />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if (root === "/admin" && resource === "categories") {
    return (
      <WorkspaceShell title="Categories" description="Category structure and merchandising context." nav={nav}>
        <div className="grid gap-5 md:grid-cols-2">
          {snapshot.categories.map((category) => (
            <article key={category.id} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{category.slug}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{category.name}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{category.description}</p>
            </article>
          ))}
        </div>
      </WorkspaceShell>
    );
  }

  if (root === "/admin" && resource === "brands") {
    return (
      <WorkspaceShell title="Brands" description="Brand records and presentation accents stay organized here." nav={nav}>
        <div className="grid gap-5 md:grid-cols-2">
          {snapshot.brands.map((brand) => (
            <article key={brand.id} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{brand.slug}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{brand.name}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{brand.description}</p>
            </article>
          ))}
        </div>
      </WorkspaceShell>
    );
  }

  if (root === "/admin" && resource === "collections") {
    return (
      <WorkspaceShell title="Collections" description="Editorial collection rails, curation, and product grouping." nav={nav}>
        <div className="grid gap-5 md:grid-cols-2">
          {snapshot.collections.map((collection) => (
            <article key={collection.id} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{collection.kicker}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{collection.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{collection.description}</p>
              <p className="mt-4 text-sm font-semibold text-[var(--market-ink)]">
                {collection.productSlugs.length} linked product{collection.productSlugs.length === 1 ? "" : "s"}
              </p>
            </article>
          ))}
        </div>
      </WorkspaceShell>
    );
  }

  if (root === "/admin" && resource === "sellers") {
    return (
      <WorkspaceShell title="Sellers" description="Approved vendor passports and storefront accountability." nav={nav}>
        <div className="grid gap-5 md:grid-cols-2">
          {snapshot.vendors.map((vendor) => (
            <article key={vendor.id} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{vendor.verificationLevel}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{vendor.name}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{vendor.description}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MetricCard label="Trust" value={`${vendor.trustScore}%`} hint="Public trust passport score." />
                <MetricCard label="SLA" value={`${vendor.responseSlaHours}h`} hint="Average response expectation." />
                <MetricCard label="Followers" value={String(vendor.followersCount)} hint="Saved buyers and followers." />
              </div>
            </article>
          ))}
        </div>
      </WorkspaceShell>
    );
  }

  if ((root === "/admin" && resource === "campaigns") || (root === "/owner" && resource === "digest")) {
    return (
      <WorkspaceShell title={title} description="Campaign and executive summary visibility." nav={nav}>
        <div className="grid gap-5 md:grid-cols-2">
          {snapshot.campaigns.map((campaign) => (
            <article key={campaign.id} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{campaign.surface}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{campaign.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{campaign.description}</p>
              <p className="mt-4 text-sm font-semibold text-[var(--market-ink)]">{campaign.countdown || "Always-on campaign surface"}</p>
            </article>
          ))}
        </div>
      </WorkspaceShell>
    );
  }

  if (root === "/admin" && resource === "notifications") {
    return (
      <WorkspaceShell title="Notifications" description="Email, WhatsApp, and queue diagnostics." nav={nav}>
        <div className="space-y-4">
          {queue.notifications.length ? (
            queue.notifications.map((item: Record<string, unknown>) => (
              <article key={String(item.id)} className="market-paper rounded-[1.75rem] p-5">
                <p className="market-kicker">{String(item.channel || "notification")} · {String(item.status || "queued")}</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--market-ink)]">
                  {String(item.template_key || item.recipient || "Notification")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
                  Recipient: {String(item.recipient || "unknown")} · {formatDate(String(item.created_at || new Date().toISOString()))}
                </p>
              </article>
            ))
          ) : (
            <EmptyState title="No notification records yet." body="Delivery logs and queue backlog will appear here." />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if (
    (root === "/admin" && resource === "email-logs") ||
    (root === "/support" && resource === "email-logs")
  ) {
    const items = queue.notifications.filter((item: Record<string, unknown>) => String(item.channel || "") === "email");

    return (
      <WorkspaceShell title="Email logs" description="Email delivery attempts and failure visibility." nav={nav}>
        <div className="space-y-4">
          {items.length ? (
            items.map((item: Record<string, unknown>) => (
              <article key={String(item.id)} className="market-paper rounded-[1.75rem] p-5">
                <p className="market-kicker">{String(item.status || "queued")} · {String(item.provider || "email")}</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--market-ink)]">
                  {String(item.template_key || "Email notification")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
                  {String(item.recipient || "unknown recipient")} · {formatDate(String(item.created_at || new Date().toISOString()))}
                </p>
                {item.last_error ? (
                  <p className="mt-3 rounded-[1.2rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-3 text-sm text-[var(--market-alert)]">
                    {String(item.last_error)}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState title="No email records yet." body="Email delivery logs will appear here with status and retry context." />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if (
    (root === "/admin" && resource === "whatsapp-logs") ||
    (root === "/support" && resource === "whatsapp-logs")
  ) {
    const items = queue.notifications.filter((item: Record<string, unknown>) => String(item.channel || "") === "whatsapp");

    return (
      <WorkspaceShell title="WhatsApp logs" description="WhatsApp delivery attempts, skips, and provider visibility." nav={nav}>
        <div className="space-y-4">
          {items.length ? (
            items.map((item: Record<string, unknown>) => (
              <article key={String(item.id)} className="market-paper rounded-[1.75rem] p-5">
                <p className="market-kicker">{String(item.status || "queued")} · {String(item.provider || "whatsapp")}</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--market-ink)]">
                  {String(item.template_key || "WhatsApp notification")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
                  {String(item.recipient || "unknown recipient")} · {formatDate(String(item.created_at || new Date().toISOString()))}
                </p>
                {item.skipped_reason || item.last_error ? (
                  <p className="mt-3 rounded-[1.2rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-3 text-sm text-[var(--market-alert)]">
                    {String(item.skipped_reason || item.last_error)}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState title="No WhatsApp records yet." body="WhatsApp delivery diagnostics will appear here when provider-backed sends run." />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if ((root === "/finance" && resource === "payments") || (root === "/finance" && resource === "payment-verification")) {
    const items =
      resource === "payment-verification"
        ? queue.payments.filter((payment: Record<string, unknown>) => String(payment.status || "pending") !== "verified")
        : queue.payments;

    return (
      <WorkspaceShell title={title} description="Payment records and verification actions." nav={nav}>
        <div className="space-y-4">
          {items.length ? (
            items.map((item: Record<string, unknown>) => (
              <article key={String(item.id)} className="market-paper rounded-[1.75rem] p-5">
                <p className="market-kicker">{String(item.order_no || item.reference || "Payment")}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
                  {formatCurrency(Number(item.amount || 0))}
                </h2>
                <p className="mt-2 text-sm text-[var(--market-muted)]">
                  {String(item.status || item.payment_status || "pending")}
                </p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                      Method
                    </dt>
                    <dd className="mt-1 font-semibold capitalize text-[var(--market-ink)]">
                      {String(item.method || "bank_transfer").replace(/_/g, " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                      Reference
                    </dt>
                    <dd className="mt-1 font-semibold text-[var(--market-ink)]">
                      {String(item.reference || item.bank_reference || "Pending")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                      Proof
                    </dt>
                    <dd className="mt-1 font-semibold text-[var(--market-ink)]">
                      {item.proof_url ? (
                        <a
                          href={String(item.proof_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--market-brass)]"
                        >
                          {String(item.proof_name || "View proof")}
                        </a>
                      ) : item.wallet_transaction_id ? (
                        "Wallet debit"
                      ) : (
                        "Not attached"
                      )}
                    </dd>
                  </div>
                </dl>
                {resource === "payment-verification" ? (
                  <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-3">
                    <input type="hidden" name="intent" value="payment_verify" />
                    <input type="hidden" name="order_no" value={String(item.order_no || "")} />
                    <input type="hidden" name="return_to" value={`${root}/${resource}`} />
                    <input name="review_note" className="market-input min-w-[220px] rounded-full px-4 py-2" placeholder="Verification note" />
                    <button className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">Verify payment</button>
                  </form>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState title="No finance items are waiting." body="Payments and verification backlogs will appear here." />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if (root === "/finance" && resource === "payouts") {
    return (
      <WorkspaceShell title="Payouts" description="Vendor payout review and decisioning." nav={nav}>
        <div className="space-y-4">
          {queue.payouts.map((payout: Record<string, unknown>) => (
            <article key={String(payout.id)} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{String(payout.reference || "Payout")}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{formatCurrency(Number(payout.amount || 0))}</h2>
              <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-3">
                <input type="hidden" name="intent" value="payout_decision" />
                <input type="hidden" name="payout_id" value={String(payout.id)} />
                <input type="hidden" name="return_to" value={`${root}/${resource}`} />
                <input name="note" className="market-input min-w-[220px] rounded-full px-4 py-2" placeholder="Finance note" />
                <button name="decision" value="approved" className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">Approve</button>
                <button name="decision" value="released" className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">Release</button>
                <button name="decision" value="frozen" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Freeze</button>
                <button name="decision" value="rejected" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Reject</button>
              </form>
            </article>
          ))}
        </div>
      </WorkspaceShell>
    );
  }

  if ((root === "/support" && resource === "disputes") || (root === "/moderation" && resource === "disputes")) {
    return (
      <WorkspaceShell title="Disputes" description="Dispute triage, notes, and resolution actions." nav={nav}>
        <div className="space-y-4">
          {queue.disputes.map((dispute: Record<string, unknown>) => (
            <article key={String(dispute.id)} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{String(dispute.dispute_no || "Dispute")}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{String(dispute.reason || "Issue")}</h2>
              <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-3">
                <input type="hidden" name="intent" value="dispute_update" />
                <input type="hidden" name="dispute_id" value={String(dispute.id)} />
                <input type="hidden" name="return_to" value={`${root}/${resource}`} />
                <input name="note" className="market-input min-w-[220px] rounded-full px-4 py-2" placeholder="Support note" />
                <select name="resolution_type" className="market-select rounded-full px-4 py-2">
                  <option value="manual_review">Manual review</option>
                  <option value="refund_to_buyer">Refund buyer</option>
                  <option value="release_to_seller">Release seller payout</option>
                </select>
                <input name="refund_amount" type="number" className="market-input min-w-[160px] rounded-full px-4 py-2" placeholder="Refund amount" />
                <button name="status" value="investigating" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Investigating</button>
                <button name="status" value="resolved" className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">Resolve</button>
              </form>
            </article>
          ))}
        </div>
      </WorkspaceShell>
    );
  }

  if (root === "/moderation" && resource === "risk") {
    const items = queue.products
      .filter((product: Record<string, unknown>) => {
        const stock = Number(product.total_stock || 0);
        const summary = String(product.summary || "");
        const price = Number(product.base_price || 0);
        return stock <= 2 || summary.length < 36 || price <= 0;
      })
      .slice(0, 20);

    return (
      <WorkspaceShell title="Risk signals" description="Thin metadata, stock stress, and approval pressure grouped into one moderation queue." nav={nav}>
        <div className="space-y-4">
          {items.length ? (
            items.map((product: Record<string, unknown>) => (
              <article key={String(product.id)} className="market-paper rounded-[1.75rem] p-5">
                <p className="market-kicker">{String(product.approval_status || "draft")}</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--market-ink)]">
                  {String(product.title || "Product")}
                </h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <MetricCard
                    label="Stock"
                    value={String(product.total_stock || 0)}
                    hint="Low stock and availability pressure."
                  />
                  <MetricCard
                    label="Summary"
                    value={`${String(product.summary || "").length} ch`}
                    hint="Thin copy can delay approvals and conversion."
                  />
                  <MetricCard
                    label="Price"
                    value={formatCurrency(Number(product.base_price || 0))}
                    hint="Price anomalies or unset pricing are flagged."
                  />
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="No immediate moderation risks." body="Metadata weakness, stock pressure, and pricing anomalies will surface here." />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if (root === "/moderation" && resource === "reviews") {
    return (
      <WorkspaceShell title="Reviews" description="Published review quality and verification outcomes." nav={nav}>
        <div className="grid gap-5 md:grid-cols-2">
          {snapshot.reviews.length ? (
            snapshot.reviews.map((review) => (
              <article key={review.id} className="market-paper rounded-[1.75rem] p-5">
                <p className="market-kicker">{review.verifiedPurchase ? "verified purchase" : "manual review"}</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--market-ink)]">{review.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{review.body}</p>
              </article>
            ))
          ) : (
            <EmptyState title="No review records yet." body="Review quality and moderation outcomes will appear here." />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if (root === "/support" && resource === "returns") {
    return (
      <WorkspaceShell title="Returns" description="Returns and reversal workflow visibility." nav={nav}>
        <div className="space-y-4">
          {queue.returns.length ? (
            queue.returns.map((item: Record<string, unknown>) => (
              <article key={String(item.id)} className="market-paper rounded-[1.75rem] p-5">
                <p className="market-kicker">{String(item.status || "requested")}</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--market-ink)]">
                  {String(item.reason || "Return request")}
                </h2>
              </article>
            ))
          ) : (
            <EmptyState title="No returns are open." body="Return requests will appear here with support ownership." />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if (root === "/support" && resource === "threads") {
    return (
      <WorkspaceShell title="Support threads" description="Buyer support threads and escalations." nav={nav}>
        <div className="space-y-4">
          {queue.supportThreads.length ? (
            queue.supportThreads.map((thread: Record<string, unknown>) => (
              <article key={String(thread.id)} className="market-paper rounded-[1.75rem] p-5">
                <p className="market-kicker">{String(thread.channel || "web")} · {String(thread.status || "open")}</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--market-ink)]">{String(thread.subject || "Support thread")}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{String(thread.last_message || "Awaiting latest reply.")}</p>
              </article>
            ))
          ) : (
            <EmptyState title="No support threads are open." body="Buyer help threads will appear here with escalation context." />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if ((root === "/operations" && resource === "orders") || (root === "/operations" && resource === "delays")) {
    const items =
      resource === "delays"
        ? queue.orders.filter((order: Record<string, unknown>) =>
            ["placed", "awaiting_payment", "processing"].includes(String(order.status || ""))
          )
        : queue.orders;

    return (
      <WorkspaceShell title={title} description="Order pressure and delay visibility." nav={nav}>
        <div className="space-y-4">
          {items.map((order: Record<string, unknown>) => (
            <article key={String(order.id)} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{String(order.order_no || "Order")}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{String(order.status || "placed")}</h2>
              <p className="mt-2 text-sm text-[var(--market-muted)]">
                Payment: {String(order.payment_status || "pending")}
              </p>
            </article>
          ))}
        </div>
      </WorkspaceShell>
    );
  }

  if (root === "/operations" && resource === "low-stock") {
    const items = queue.products.filter((product: Record<string, unknown>) => Number(product.total_stock || 0) <= 5);

    return (
      <WorkspaceShell title="Low stock" description="Inventory watchlist for at-risk listings." nav={nav}>
        <div className="space-y-4">
          {items.length ? (
            items.map((product: Record<string, unknown>) => (
              <article key={String(product.id)} className="market-paper rounded-[1.75rem] p-5">
                <p className="market-kicker">{String(product.approval_status || "approved")}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{String(product.title || "Product")}</h2>
                <p className="mt-2 text-sm text-[var(--market-muted)]">Stock: {String(product.total_stock || 0)}</p>
              </article>
            ))
          ) : (
            <EmptyState title="No low-stock pressure." body="Listings that are near stockout will appear here." />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if ((root === "/operations" && resource === "automation-health") || (root === "/owner" && resource === "alerts")) {
    const failedNotifications = queue.notifications.filter((item: Record<string, unknown>) => String(item.status || "") === "failed");
    const queuedNotifications = queue.notifications.filter((item: Record<string, unknown>) => String(item.status || "") === "queued");

    return (
      <WorkspaceShell title={title} description="Automation backlog, alerting pressure, and delivery health." nav={nav}>
        <div className="grid gap-5 md:grid-cols-3">
          <MetricCard label="Failed notifications" value={String(failedNotifications.length)} hint="Delivery failures requiring intervention." />
          <MetricCard label="Queued notifications" value={String(queuedNotifications.length)} hint="Messages waiting in the delivery queue." />
          <MetricCard label="Stalled orders" value={String(overview.stalledOrders)} hint="Operational pressure affecting delivery confidence." />
        </div>
      </WorkspaceShell>
    );
  }

  if ((root === "/operations" && resource === "notifications") || (root === "/owner" && resource === "automation-health")) {
    const failedNotifications = queue.notifications.filter((item: Record<string, unknown>) => String(item.status || "") === "failed");
    const queuedNotifications = queue.notifications.filter((item: Record<string, unknown>) => String(item.status || "") === "queued");

    return (
      <WorkspaceShell title={title} description="Notification backlog, retries, and automation diagnostics." nav={nav}>
        <div className="grid gap-5 md:grid-cols-3">
          <MetricCard label="Queued" value={String(queuedNotifications.length)} hint="Pending sends waiting for provider delivery." />
          <MetricCard label="Failed" value={String(failedNotifications.length)} hint="Messages requiring retries or operator review." />
          <MetricCard label="Audit entries" value={String(queue.auditLogs.length)} hint="Most recent logged operator and automation actions." />
        </div>
        <div className="mt-6 space-y-4">
          {queue.notifications.slice(0, 12).map((item: Record<string, unknown>) => (
            <article key={String(item.id)} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{String(item.channel || "notification")} · {String(item.status || "queued")}</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--market-ink)]">
                {String(item.template_key || "Notification")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
                {String(item.recipient || "unknown recipient")}
              </p>
            </article>
          ))}
        </div>
      </WorkspaceShell>
    );
  }

  if ((root === "/owner" && resource === "audit") || (root === "/finance" && resource === "audit") || (root === "/moderation" && resource === "audit")) {
    return (
      <WorkspaceShell title="Audit" description="Latest operator and automation audit trail." nav={nav}>
        <div className="space-y-4">
          {queue.auditLogs.length ? (
            queue.auditLogs.map((item: Record<string, unknown>) => (
              <article key={String(item.id)} className="market-paper rounded-[1.75rem] p-5">
                <p className="market-kicker">{String(item.event_type || "audit_event")}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
                  {String(item.entity_type || "system")} · {formatDate(String(item.created_at || new Date().toISOString()))}
                </p>
              </article>
            ))
          ) : (
            <EmptyState title="Audit trail is still empty." body="Operator and automation audit entries will appear here." />
          )}
        </div>
      </WorkspaceShell>
    );
  }

  if (root === "/owner" && resource === "settings") {
    return (
      <WorkspaceShell title="Owner settings" description="Executive settings and high-level controls." nav={nav}>
        <div className="grid gap-5 md:grid-cols-3">
          <MetricCard label="Pending applications" value={String(overview.pendingApplications)} hint="Seller approval backlog." />
          <MetricCard label="Open disputes" value={String(overview.openDisputes)} hint="Support and moderation pressure." />
          <MetricCard label="Pending payouts" value={String(overview.pendingPayouts)} hint="Finance review backlog." />
        </div>
      </WorkspaceShell>
    );
  }

  if ((root === "/finance" && resource === "refunds") || (root === "/admin" && resource === "settings")) {
    return (
      <WorkspaceShell
        title={title}
        description={
          root === "/finance"
            ? "Refund posture and reversal visibility."
            : "Marketplace configuration guardrails and operational defaults."
        }
        nav={nav}
      >
        <div className="grid gap-5 md:grid-cols-3">
          <MetricCard label="Open disputes" value={String(overview.openDisputes)} hint="Disputes drive most refund pressure." />
          <MetricCard label="Pending payouts" value={String(overview.pendingPayouts)} hint="Finance backlog tied to payout and refund timing." />
          <MetricCard label="Stalled orders" value={String(overview.stalledOrders)} hint="Orders needing operational or payment intervention." />
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell title={title} description={rootMeta[root].description} nav={nav}>
      <EmptyState
        title={`${title} is ready for expansion.`}
        body="This resource surface now exists in the workspace and is ready to be populated with the next layer of data, controls, and diagnostics."
      />
    </WorkspaceShell>
  );
}
