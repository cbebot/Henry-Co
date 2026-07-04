import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  PaymentSurface,
  buildPaymentRecordView,
  buildPaymentSurfaceContext,
} from "@henryco/payment-surface";
import type { PaymentSurfaceContext } from "@henryco/payment-surface";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { uploadPaymentProofAction } from "@/lib/studio/actions";
import { getStudioViewer } from "@/lib/studio/auth";
import { getPaymentWorkspace } from "@/lib/studio/data";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { getStudioSnapshot } from "@/lib/studio/store";
import {
  getStudioAccountUrl,
  getStudioLoginUrl,
} from "@/lib/studio/links";
import { STUDIO_PAYMENT_THEME } from "@/lib/studio/payment-surface-theme";
import { friendlyPaymentStatus } from "@/lib/studio/project-workspace-copy";
import { withStudioToast } from "@/lib/studio/redirect-with-toast";
import { isStudioCardCheckoutReady, reconcileStudioCardPayment } from "@/lib/studio/card-rail";
import { translateSurfaceLabel } from "@henryco/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Studio · Payment workspace",
  description:
    "Send payment proof and track confirmation for your Henry Onyx Studio engagement.",
  robots: { index: false, follow: false },
};

function relativeProjectPath(projectId: string, accessKey: string | null) {
  const search = accessKey ? `?access=${encodeURIComponent(accessKey)}` : "";
  return `/project/${projectId}${search}`;
}

/**
 * /pay/[paymentId] — focused customer-facing payment workspace.
 *
 * V2-PAYMENT-UNIFICATION: This route now consumes the canonical
 * <PaymentSurface /> from `@henryco/payment-surface`. The composition,
 * tokens, hero card, file field, and submit-button motion language are
 * the same as before — they were extracted into the shared package so
 * marketplace, care, property, jobs, and logistics can render an
 * identical surface from their own data adapters.
 *
 * Access model: same as /project/[projectId]. Either the viewer is
 * authenticated and owns the project's lead, or they hit the route with
 * the project's access key (deep-link from email/proposal). On any
 * mismatch we redirect to login (if no session) or the account hub.
 */
export default async function StudioPaymentWorkspace({
  params,
  searchParams,
}: {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const { paymentId } = await params;
  const { access } = await searchParams;
  const accessKey = access?.trim() || null;

  const [viewer, snapshot] = await Promise.all([
    getStudioViewer(),
    getStudioSnapshot(),
  ]);
  const workspace = await getPaymentWorkspace({
    paymentId,
    accessKey,
    viewer,
    snapshot,
  });

  if (!workspace) {
    if (!viewer.user) {
      redirect(getStudioLoginUrl(`/pay/${paymentId}${accessKey ? `?access=${accessKey}` : ""}`));
    }
    redirect(withStudioToast(getStudioAccountUrl(), "payment_not_found"));
  }

  const { payment, project, milestone, platform, sameProjectPayments } = workspace;

  // Card-rail reconcile on the buyer's return (flag-gated; a no-op otherwise): if the
  // provider confirmed the charge, the row flipped to paid — render that truth now.
  if (isStudioCardCheckoutReady()) {
    const outcome = await reconcileStudioCardPayment(payment).catch(() => "unchanged" as const);
    if (outcome === "paid") payment.status = "paid";
  }

  const projectAccessKey = project.accessKey ?? accessKey;
  const projectHref = relativeProjectPath(project.id, projectAccessKey);
  const paidIndex = sameProjectPayments.findIndex((p) => p.id === payment.id);
  const rankIndex = paidIndex >= 0 ? paidIndex + 1 : 1;
  const rankTotal = sameProjectPayments.length || 1;
  const uploadRedirect = `/pay/${payment.id}${projectAccessKey ? `?access=${projectAccessKey}` : ""}`;

  // WAVE1 — wrap Supabase-row text fields through resolveLocalizedDynamicField
  // so non-EN locales hit the cached DeepL pipeline. Payment label / project
  // title / milestone name surface on the canonical PaymentSurface heading.
  const locale = await getStudioPublicLocale();
  const [localizedPaymentLabel, localizedProjectTitle, localizedMilestoneName] = await Promise.all([
    resolveLocalizedDynamicField({
      record: payment as unknown as Record<string, unknown>,
      field: "label",
      locale,
      fallback: payment.label || "Studio payment",
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: project as unknown as Record<string, unknown>,
      field: "title",
      locale,
      fallback: project.title ?? "",
      machineTranslate: locale !== "en",
    }),
    milestone
      ? resolveLocalizedDynamicField({
          record: milestone as unknown as Record<string, unknown>,
          field: "name",
          locale,
          fallback: milestone.name ?? "",
          machineTranslate: locale !== "en",
        })
      : Promise.resolve(""),
  ]);

  // The card option rides beside bank transfer (never replacing it) — flag-dark, and only
  // for signed-in viewers (the payment intent is user-owned). /card does the POST-only start.
  const cardCta =
    isStudioCardCheckoutReady() && viewer.user && payment.status !== "paid" && payment.status !== "cancelled"
      ? {
          label: translateSurfaceLabel(locale, "Pay with card"),
          href: `/pay/${payment.id}/card${projectAccessKey ? `?access=${encodeURIComponent(projectAccessKey)}` : ""}`,
        }
      : null;

  const ctx: PaymentSurfaceContext = buildPaymentSurfaceContext({
    payment: buildPaymentRecordView({
      id: payment.id,
      label: localizedPaymentLabel || "Studio payment",
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      statusLabel: friendlyPaymentStatus(payment.status),
      dueDate: payment.dueDate,
      proofName: payment.proofName,
      proofUrl: payment.proofUrl,
      updatedAt: payment.updatedAt,
      rank: { index: rankIndex, total: rankTotal },
    }),
    record: {
      title: localizedProjectTitle,
      subtitle: milestone ? localizedMilestoneName : undefined,
      back: { href: projectHref, label: "Project workspace" },
      account: { href: getStudioAccountUrl(), label: "Henry Onyx account home" },
      primaryCta: { href: projectHref, label: "Open project workspace" },
    },
    platform: {
      bankName: platform.paymentBankName,
      accountName: platform.paymentAccountName,
      accountNumber: platform.paymentAccountNumber,
      supportEmail: platform.paymentSupportEmail,
      supportWhatsApp: platform.paymentSupportWhatsApp,
    },
    upload: {
      action: uploadPaymentProofAction,
      redirectPath: uploadRedirect,
      hiddenFields: [
        { name: "paymentId", value: payment.id },
        { name: "accessKey", value: projectAccessKey ?? "" },
      ],
      accept: "image/*,application/pdf",
      submitLabel: "Submit payment proof",
      pendingLabel: "Uploading…",
    },
    copy: {
      bodyByStatus: {
        paid: "Payment confirmed. Thank you — your project lane stays moving.",
        processing:
          "Payment proof received. Finance is verifying — you can track confirmation here.",
        pending:
          "Send your payment using the verified company details below, then attach your proof so finance can confirm and unlock the next milestone.",
      },
      guideTitle: "Send the deposit using the verified company account",
      proofHint:
        "After sending, attach the proof below — finance reviews within one business day. You'll see the status flip to processing here as soon as the upload lands.",
    },
    theme: STUDIO_PAYMENT_THEME,
    cardCta,
  });

  return <PaymentSurface ctx={ctx} />;
}
