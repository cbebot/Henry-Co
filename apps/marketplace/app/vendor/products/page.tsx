import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import { approvalStatusLabel, listingGuidance } from "@/lib/marketplace/vendor/listing-guidance";
import { formatVendorMoney } from "@/lib/marketplace/vendor/money";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function VendorProductsPage() {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/products");
  const data = await getVendorWorkspaceData();

  return (
    <WorkspaceShell
      title={t("Products")}
      description={t("Seller product management keeps draft, submission, and moderation state obvious.")}
      {...vendorWorkspaceNav("/vendor/products", locale)}
      actions={
        <Link href="/vendor/products/new" className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">
          {t("New product")}
        </Link>
      }
    >
      {data.products.length === 0 ? (
        <EmptyState
          title={t("No products yet")}
          body={t(
            "Your first listing opens the storefront. Add a photo, honest detail, and a clear delivery promise — moderation reads all three.",
          )}
          ctaHref="/vendor/products/new"
          ctaLabel={t("New product")}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
          <section className="space-y-4">
            {data.products.map((product) => (
              <article key={product.id} className="market-paper rounded-[1.9rem] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <p className="market-kicker">{approvalStatusLabel(product.approvalStatus, t)}</p>
                    <h2 className="text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{product.title}</h2>
                    <p className="text-sm leading-7 text-[var(--market-muted)]">{product.summary || product.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-[var(--market-muted)]">
                      <span>
                        {t("{price} base").replace(
                          "{price}",
                          formatVendorMoney(Math.round(product.basePrice * 100), locale),
                        )}
                      </span>
                      <span>{t("{count} in stock").replace("{count}", String(product.stock))}</span>
                      <span>{product.leadTime || t("Lead time pending")}</span>
                    </div>
                    <p className="text-sm leading-6 text-[var(--market-muted)]">
                      {listingGuidance(product.filterData, t)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/product/${product.slug}`} className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
                      {t("Preview")}
                    </Link>
                    <Link href={`/vendor/products/${product.id}`} className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">
                      {t("Manage")}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="space-y-4">
            <article className="market-paper rounded-[1.9rem] p-6">
              <p className="market-kicker">{t("Catalog guidance")}</p>
              <div className="mt-5 space-y-4">
                {[
                  t(
                    "Listings with clearer summaries, stronger trust badges, and realistic lead times move through moderation faster.",
                  ),
                  t(
                    "Use compare-at pricing sparingly and keep stock current to avoid conversion leakage and dispute pressure.",
                  ),
                  t(
                    "Keep one strong primary image and concise delivery notes so product cards stay sharp across mobile discovery.",
                  ),
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.35rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4 text-sm leading-7 text-[var(--market-ink)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </div>
      )}
    </WorkspaceShell>
  );
}
