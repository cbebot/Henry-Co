import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveSite } from "@/lib/site-lookup";
import { BundleRenderer } from "@/app/components/bundle-renderer";

/**
 * The multi-tenant catch-all. Reads the request host, resolves the live (or
 * token-gated preview) bundle for it, and renders it. Host-based serving is the
 * hub-rewrite precedent generalized: one Vercel project serves every client
 * site by host. No arbitrary client code executes — only a validated bundle.
 */

export const dynamic = "force-dynamic";

export default async function SitePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "";
  const { preview } = await searchParams;

  const resolved = await resolveSite(host, preview ?? null);
  if (!resolved.ok) {
    if (resolved.reason === "preview_locked") {
      return (
        <main style={{ padding: "4rem 1.5rem", textAlign: "center", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
          <h1 style={{ fontSize: "1.4rem" }}>This preview is private</h1>
          <p style={{ color: "#555", marginTop: "0.75rem" }}>
            Open it from your Henry Onyx Studio project to review.
          </p>
        </main>
      );
    }
    notFound();
  }

  return <BundleRenderer bundle={resolved.bundle} preview={resolved.status === "preview"} />;
}
