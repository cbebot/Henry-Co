import { formatCurrency } from "@/lib/env";
import {
  saveStudioPackageAction,
  saveStudioPlatformSettingsAction,
  saveStudioServiceAction,
  saveStudioTeamAction,
} from "@/lib/studio/actions";
import { requireStudioRoles } from "@/lib/studio/auth";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { ownerNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import {
  StudioMetricCard,
  StudioWorkspaceShell,
} from "@/components/studio/workspace/shell";

export default async function OwnerDashboardPage() {
  await requireStudioRoles(["studio_owner"], "/owner");
  const [snapshot, catalog] = await Promise.all([
    getStudioSnapshot(),
    getStudioCatalog({ includeUnpublished: true }),
  ]);
  const platform = catalog.platform;

  return (
    <StudioWorkspaceShell
      kicker="Owner oversight"
      title="See revenue posture, delivery load, and control the public Studio catalog from one surface."
      description="This is the executive operating layer for conversion, package pricing, team positioning, and project pressure."
      nav={ownerNav("/owner")}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <StudioMetricCard label="Leads" value={String(snapshot.leads.length)} hint="Total Studio inquiries recorded in the operating model." />
        <StudioMetricCard label="Projects" value={String(snapshot.projects.length)} hint="All active, pending, and delivered Studio engagements." />
        <StudioMetricCard label="Collected" value={formatCurrency(snapshot.payments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + payment.amount, 0))} hint="Confirmed payment volume already recognized inside the Studio pipeline." />
        <StudioMetricCard label="Open support" value={String((snapshot.supportThreads ?? []).filter((thread) => thread.status !== "closed").length)} hint="Support conversations still active or awaiting reply." />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Revenue visibility</div>
          <div className="mt-5 space-y-4">
            {snapshot.proposals.slice(0, 5).map((proposal) => (
              <div key={proposal.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-semibold text-[var(--studio-ink)]">{proposal.title}</div>
                  <div className="text-sm text-[var(--studio-signal)]">
                    {formatCurrency(proposal.investment, proposal.currency)}
                  </div>
                </div>
                <div className="mt-2 text-sm text-[var(--studio-ink-soft)]">
                  {proposal.status.replaceAll("_", " ")}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Operational pressure</div>
          <div className="mt-5 space-y-4">
            {snapshot.projects.slice(0, 5).map((project) => (
              <div key={project.id} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-semibold text-[var(--studio-ink)]">{project.title}</div>
                  <div className="text-sm text-[var(--studio-signal)]">{project.status.replaceAll("_", " ")}</div>
                </div>
                <div className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{project.nextAction}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="studio-panel rounded-[1.75rem] p-6">
        <div className="studio-kicker">Platform controls</div>
        <form action={saveStudioPlatformSettingsAction} className="mt-5 grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="redirectPath" value="/owner" />
          <input
            name="supportEmail"
            defaultValue={platform.supportEmail || ""}
            placeholder="Support email"
            className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none"
          />
          <input
            name="supportPhone"
            defaultValue={platform.supportPhone || ""}
            placeholder="Support phone"
            className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none"
          />
          <input
            name="primaryCta"
            defaultValue={platform.primaryCta}
            placeholder="Primary CTA"
            className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2"
          />
          <div className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5 lg:col-span-2">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              Shared company payment profile
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
              Studio now uses the live HenryCo company account record from the shared database as the
              default payment source. These values let Studio override copy, routing, or account data
              only when the public experience needs a Studio-specific payment posture.
            </p>
          </div>
          <input
            name="paymentBankName"
            defaultValue={platform.paymentBankName || ""}
            placeholder="Payment bank name"
            className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none"
          />
          <input
            name="paymentAccountName"
            defaultValue={platform.paymentAccountName || ""}
            placeholder="Payment account name"
            className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none"
          />
          <input
            name="paymentAccountNumber"
            defaultValue={platform.paymentAccountNumber || ""}
            placeholder="Payment account number"
            className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none"
          />
          <input
            name="paymentCurrency"
            defaultValue={platform.paymentCurrency}
            placeholder="Currency"
            className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none"
          />
          <input
            name="paymentSupportEmail"
            defaultValue={platform.paymentSupportEmail || ""}
            placeholder="Payment support email"
            className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none"
          />
          <input
            name="paymentSupportWhatsApp"
            defaultValue={platform.paymentSupportWhatsApp || ""}
            placeholder="Payment support WhatsApp"
            className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none"
          />
          <input
            name="companyBankName"
            defaultValue={platform.companyBankName || ""}
            placeholder="Company bank name"
            className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none"
          />
          <input
            name="companyAccountName"
            defaultValue={platform.companyAccountName || ""}
            placeholder="Company account name"
            className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none"
          />
          <input
            name="companyAccountNumber"
            defaultValue={platform.companyAccountNumber || ""}
            placeholder="Company account number"
            className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2"
          />
          <textarea
            name="paymentInstructions"
            defaultValue={platform.paymentInstructions}
            rows={4}
            className="min-h-28 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2"
            placeholder="Explain exactly how payment should be made and how proof should be submitted."
          />
          <textarea
            name="trustSignals"
            defaultValue={catalog.trustSignals.join(", ")}
            rows={4}
            className="min-h-28 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2"
            placeholder="Comma-separated trust signals"
          />
          <textarea
            name="process"
            defaultValue={catalog.process.join(", ")}
            rows={4}
            className="min-h-28 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2"
            placeholder="Comma-separated process steps"
          />
          <div>
            <button type="submit" className="studio-button-primary rounded-full px-5 py-3 text-sm font-semibold">
              Save platform settings
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-6">
        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Service architecture</div>
          <div className="mt-5 space-y-5">
            {catalog.services.map((service) => (
              <form key={service.id} action={saveStudioServiceAction} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <input type="hidden" name="redirectPath" value="/owner" />
                <input type="hidden" name="id" value={service.id} />
                <input type="hidden" name="kind" value={service.kind} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <input name="name" defaultValue={service.name} className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none" />
                  <input name="deliveryWindow" defaultValue={service.deliveryWindow} className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none" />
                  <input name="headline" defaultValue={service.headline} className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2" />
                  <textarea name="summary" defaultValue={service.summary} rows={3} className="min-h-24 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2" />
                  <input name="startingPrice" defaultValue={String(service.startingPrice)} className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none" />
                  <label className="flex items-center gap-3 rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink-soft)]">
                    <input type="checkbox" name="isPublished" defaultChecked={service.isPublished !== false} />
                    Published
                  </label>
                  <textarea name="stack" defaultValue={service.stack.join(", ")} rows={2} className="min-h-20 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none" />
                  <textarea name="outcomes" defaultValue={service.outcomes.join(", ")} rows={2} className="min-h-20 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none" />
                  <textarea name="scoreBoosts" defaultValue={service.scoreBoosts.join(", ")} rows={2} className="min-h-20 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2" />
                </div>
                <div className="mt-4">
                  <button type="submit" className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs font-semibold text-[var(--studio-ink)]">
                    Save service
                  </button>
                </div>
              </form>
            ))}
          </div>
        </article>

        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Packages and pricing</div>
          <div className="mt-5 space-y-5">
            {catalog.packages.map((pkg) => (
              <form key={pkg.id} action={saveStudioPackageAction} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <input type="hidden" name="redirectPath" value="/owner" />
                <input type="hidden" name="id" value={pkg.id} />
                <input type="hidden" name="serviceId" value={pkg.serviceId} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <input name="name" defaultValue={pkg.name} className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none" />
                  <input name="price" defaultValue={String(pkg.price)} className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none" />
                  <textarea name="summary" defaultValue={pkg.summary} rows={3} className="min-h-24 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2" />
                  <input name="depositRate" defaultValue={String(pkg.depositRate)} className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none" />
                  <input name="timelineWeeks" defaultValue={String(pkg.timelineWeeks)} className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none" />
                  <input name="bestFor" defaultValue={pkg.bestFor} className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2" />
                  <textarea name="includes" defaultValue={pkg.includes.join(", ")} rows={2} className="min-h-20 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2" />
                  <label className="flex items-center gap-3 rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink-soft)]">
                    <input type="checkbox" name="isPublished" defaultChecked={pkg.isPublished !== false} />
                    Published
                  </label>
                </div>
                <div className="mt-4">
                  <button type="submit" className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs font-semibold text-[var(--studio-ink)]">
                    Save package
                  </button>
                </div>
              </form>
            ))}
          </div>
        </article>

        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Team positioning</div>
          <div className="mt-5 space-y-5">
            {catalog.teams.map((team) => (
              <form key={team.id} action={saveStudioTeamAction} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <input type="hidden" name="redirectPath" value="/owner" />
                <input type="hidden" name="id" value={team.id} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <input name="name" defaultValue={team.name} className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none" />
                  <input name="label" defaultValue={team.label} className="w-full rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink)] outline-none" />
                  <textarea name="summary" defaultValue={team.summary} rows={3} className="min-h-24 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2" />
                  <select name="availability" defaultValue={team.availability} className="studio-select rounded-full px-4 py-3 text-sm">
                    {["open", "limited", "waitlist"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-3 rounded-full border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink-soft)]">
                    <input type="checkbox" name="isPublished" defaultChecked={team.isPublished !== false} />
                    Published
                  </label>
                  <textarea name="focus" defaultValue={team.focus.join(", ")} rows={2} className="min-h-20 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none" />
                  <textarea name="industries" defaultValue={team.industries.join(", ")} rows={2} className="min-h-20 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none" />
                  <textarea name="stack" defaultValue={team.stack.join(", ")} rows={2} className="min-h-20 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none" />
                  <textarea name="highlights" defaultValue={team.highlights.join(", ")} rows={2} className="min-h-20 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none" />
                  <textarea name="scoreBiases" defaultValue={team.scoreBiases.join(", ")} rows={2} className="min-h-20 w-full rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm text-[var(--studio-ink)] outline-none lg:col-span-2" />
                </div>
                <div className="mt-4">
                  <button type="submit" className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs font-semibold text-[var(--studio-ink)]">
                    Save team
                  </button>
                </div>
              </form>
            ))}
          </div>
        </article>
      </section>
    </StudioWorkspaceShell>
  );
}
