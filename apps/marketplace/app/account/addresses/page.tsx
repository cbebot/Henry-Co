import { SUPPORTED_COUNTRIES } from "@henryco/config";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import type { MarketplaceAddress } from "@/lib/marketplace/types";
import { accountNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

type SearchParams = {
  edit?: string;
  saved?: string;
  deleted?: string;
  default?: string;
  error?: string;
};

export default async function AccountAddressesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireMarketplaceUser("/account/addresses");
  const [data, params] = await Promise.all([getBuyerDashboardData(), searchParams]);
  const editing = params.edit
    ? data.addresses.find((address) => address.id === params.edit) || null
    : null;

  const toast = params.saved
    ? { tone: "success" as const, label: "Address saved." }
    : params.deleted
      ? { tone: "success" as const, label: "Address removed." }
      : params.default
        ? { tone: "success" as const, label: "Default address updated." }
        : params.error
          ? { tone: "error" as const, label: "Could not update address. Try again." }
          : null;

  return (
    <WorkspaceShell
      title="Addresses"
      description="Saved addresses stay tied to the shared account so future HenryCo services can reuse the same customer context."
      nav={accountNav("/account/addresses")}
    >
      {toast ? (
        <div
          className={`rounded-[1.25rem] border px-4 py-3 text-sm font-medium ${
            toast.tone === "success"
              ? "border-[rgba(76,201,160,0.35)] bg-[rgba(76,201,160,0.12)] text-[var(--market-success,#4CC9A0)]"
              : "border-[rgba(232,88,88,0.35)] bg-[rgba(232,88,88,0.12)] text-[var(--market-alert,#F87171)]"
          }`}
        >
          {toast.label}
        </div>
      ) : null}

      <form
        action="/api/marketplace"
        method="POST"
        className="market-paper rounded-[1.75rem] p-5"
      >
        <input type="hidden" name="intent" value="address_upsert" />
        <input type="hidden" name="return_to" value="/account/addresses" />
        {editing ? (
          <input type="hidden" name="address_id" value={editing.id} />
        ) : null}

        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="market-kicker">
              {editing ? "Edit address" : "Add new address"}
            </p>
            <p className="mt-1 text-xs text-[var(--market-muted)]">
              Address lines are verified at checkout. Phone numbers must match the
              country dial code for delivery SMS to reach the recipient.
            </p>
          </div>
          {editing ? (
            <a
              href="/account/addresses"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)] hover:text-[var(--market-paper-white)]"
            >
              Cancel edit
            </a>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="label"
            className="market-input rounded-2xl px-4 py-3"
            placeholder="Label: Home, Office..."
            defaultValue={editing?.label || ""}
            required
          />
          <input
            name="recipient_name"
            className="market-input rounded-2xl px-4 py-3"
            placeholder="Recipient name"
            defaultValue={editing?.recipient || ""}
            required
          />
          <input
            name="phone"
            className="market-input rounded-2xl px-4 py-3"
            placeholder="Phone number"
            defaultValue={editing?.phone || ""}
            required
          />
          <input
            name="city"
            className="market-input rounded-2xl px-4 py-3"
            placeholder="City"
            defaultValue={editing?.city || ""}
            required
          />
          <input
            name="region"
            className="market-input rounded-2xl px-4 py-3"
            placeholder="Region / State"
            defaultValue={editing?.region || ""}
            required
          />
          <select
            name="country"
            className="market-input rounded-2xl px-4 py-3"
            defaultValue={editing?.country || "Nigeria"}
            required
          >
            {SUPPORTED_COUNTRIES.map((country) => (
              <option key={country.code} value={country.name}>
                {country.flag} {country.name} ({country.currency})
              </option>
            ))}
          </select>
          <input
            name="line1"
            className="market-input rounded-2xl px-4 py-3 md:col-span-2"
            placeholder="Address line 1"
            defaultValue={editing?.line1 || ""}
            required
          />
          <input
            name="line2"
            className="market-input rounded-2xl px-4 py-3 md:col-span-2"
            placeholder="Address line 2 (optional)"
            defaultValue={editing?.line2 || ""}
          />
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-[1.25rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-3 text-sm text-[var(--market-ink)]">
          <input
            type="checkbox"
            name="is_default"
            defaultChecked={Boolean(editing?.isDefault)}
          />
          Set as default address
        </label>
        <button className="market-button-primary mt-4 rounded-full px-5 py-3 text-sm font-semibold">
          {editing ? "Update address" : "Save address"}
        </button>
      </form>

      {data.addresses.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.addresses.map((address: MarketplaceAddress) => (
            <article
              key={address.id}
              className="market-paper flex flex-col justify-between rounded-[1.75rem] p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="market-kicker">{address.label}</p>
                  {address.isDefault ? (
                    <span className="rounded-full bg-[rgba(246,240,222,0.14)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]">
                      Default
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 text-xl font-semibold text-[var(--market-ink)]">
                  {address.recipient}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                  {address.region}, {address.country}
                </p>
                <p className="mt-1 text-xs text-[var(--market-muted)]">
                  {address.phone}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={`/account/addresses?edit=${address.id}`}
                  className="rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)] hover:bg-[rgba(255,255,255,0.08)]"
                >
                  Edit
                </a>
                {address.isDefault ? null : (
                  <form action="/api/marketplace" method="POST">
                    <input
                      type="hidden"
                      name="intent"
                      value="address_set_default"
                    />
                    <input type="hidden" name="address_id" value={address.id} />
                    <input
                      type="hidden"
                      name="return_to"
                      value="/account/addresses"
                    />
                    <button className="rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)] hover:bg-[rgba(255,255,255,0.08)]">
                      Set default
                    </button>
                  </form>
                )}
                <form action="/api/marketplace" method="POST">
                  <input type="hidden" name="intent" value="address_delete" />
                  <input type="hidden" name="address_id" value={address.id} />
                  <input
                    type="hidden"
                    name="return_to"
                    value="/account/addresses"
                  />
                  <button className="rounded-full border border-[rgba(232,88,88,0.35)] bg-[rgba(232,88,88,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-alert,#F87171)] hover:bg-[rgba(232,88,88,0.16)]">
                    Delete
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved addresses."
          body="Add an address above or one will be created automatically at checkout."
        />
      )}
    </WorkspaceShell>
  );
}
