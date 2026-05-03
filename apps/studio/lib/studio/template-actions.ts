"use server";

import { redirect } from "next/navigation";
import { getStudioViewer } from "@/lib/studio/auth";
import { reserveStudioTemplate } from "@/lib/studio/template-reservation";
import { writeStudioLog } from "@/lib/studio/store";

const ALLOWED_DOMAIN_STATUS = new Set(["have", "new", "later"] as const);
const ALLOWED_BRAND_VIBES = new Set([
  "Quiet luxury and high-trust",
  "Bold and editorial",
  "Warm and human",
  "Confident and corporate",
  "Modern and minimal",
]);

function clean(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export async function reserveStudioTemplateAction(formData: FormData) {
  const slug = clean(formData.get("templateSlug"));
  const customerName = clean(formData.get("customerName"));
  const email = clean(formData.get("email")).toLowerCase();
  const phone = clean(formData.get("phone")) || null;
  const companyName = clean(formData.get("companyName")) || null;
  const brandVibe = clean(formData.get("brandVibe"));
  const domainStatusRaw = clean(formData.get("domainStatus"));
  const domainPreference = clean(formData.get("domainPreference")) || null;
  const notes = clean(formData.get("notes")) || null;
  const consent = clean(formData.get("consent"));

  if (!slug) {
    redirect(`/pick`);
  }

  if (!customerName || !email) {
    redirect(`/checkout/template/${slug}?error=missing_fields`);
  }

  if (consent !== "agreed") {
    redirect(`/checkout/template/${slug}?error=consent_required`);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`/checkout/template/${slug}?error=invalid_email`);
  }

  const viewer = await getStudioViewer();

  const safeBrandVibe = ALLOWED_BRAND_VIBES.has(brandVibe)
    ? brandVibe
    : "Quiet luxury and high-trust";
  const safeDomainStatus = (
    ALLOWED_DOMAIN_STATUS.has(domainStatusRaw as never) ? domainStatusRaw : "later"
  ) as "have" | "new" | "later";

  try {
    const result = await reserveStudioTemplate({
      templateSlug: slug,
      customerName,
      email,
      phone,
      companyName,
      brandVibe: safeBrandVibe,
      domainStatus: safeDomainStatus,
      domainPreference,
      notes,
      userId: viewer.user?.id ?? null,
    });

    await writeStudioLog({
      eventType: "studio_template_reserved",
      route: `/checkout/template/${slug}`,
      success: true,
      meta: {
        userId: viewer.user?.id ?? null,
        email,
        role: "client",
      },
      details: {
        template_slug: slug,
        invoice_id: result.invoiceId,
        project_id: result.projectId,
        amount_kobo: result.amountKobo,
      },
    });

    redirect(`/payment?invoice=${result.invoiceToken}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    await writeStudioLog({
      eventType: "studio_template_reservation_failed",
      route: `/checkout/template/${slug}`,
      success: false,
      meta: {
        userId: viewer.user?.id ?? null,
        email,
        role: "client",
      },
      details: {
        template_slug: slug,
        error: error instanceof Error ? error.message : "unknown",
      },
    });
    redirect(`/checkout/template/${slug}?error=server_error`);
  }
}
