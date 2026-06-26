import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  PaymentSurface,
  buildPaymentRecordView,
  buildPaymentSurfaceContext,
} from "@henryco/payment-surface";
import type {
  PaymentSurfaceContext,
  PaymentSurfaceTheme,
} from "@henryco/payment-surface";
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
import { friendlyPaymentStatus } from "@/lib/studio/project-workspace-copy";
import { withStudioToast } from "@/lib/studio/redirect-with-toast";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Studio · Payment workspace",
  description:
    "Send payment proof and track confirmation for your Henry & Co. Studio engagement.",
  robots: { index: false, follow: false },
};

/**
 * Studio theme adapter — maps studio CSS variables onto the canonical
 * --payment-* token namespace consumed by @henryco/payment-surface.
 * Studio keeps using its own design system; the surface stays of-a-piece
 * with the rest of the studio app.
 */
const STUDIO_PAYMENT_THEME: PaymentSurfaceTheme = {
  accentVar: "var(--studio-signal, #97f4f3)",
  heroTone: "contrast",
  rootStyle: {
    ["--payment-accent" as never]: "var(--studio-signal, #97f4f3)",
    ["--payment-ink" as never]: "var(--studio-ink, white)",
    ["--payment-soft" as never]: "var(--studio-ink-soft, rgba(255,255,255,0.65))",
    ["--payment-line" as never]: "var(--studio-line, rgba(255,255,255,0.18))",
    ["--payment-surface" as never]: "color-mix(in srgb, var(--studio-surface) 88%, transparent)",
  } as CSSProperties,
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
      account: { href: getStudioAccountUrl(), label: "HenryCo account home" },
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
  });

  return <PaymentSurface ctx={ctx} locale={locale} />;
}
