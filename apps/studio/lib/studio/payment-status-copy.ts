import type { StudioPayment } from "@/lib/studio/types";

export function studioPaymentCheckpointCopy(payment: StudioPayment): {
  phase: string;
  detail: string;
} {
  if (payment.status === "paid") {
    return {
      phase: "Payment confirmed",
      detail: "This payment has been verified and recorded against your project. No further action needed.",
    };
  }
  if (payment.status === "processing") {
    return {
      phase: "Verification in progress",
      detail: payment.proofName
        ? `We received your proof (${payment.proofName}). Our finance team is matching it to the transfer — your workspace will update automatically once confirmed.`
        : "Your proof has been received. Our finance team is reviewing it and will confirm shortly.",
    };
  }
  if (payment.status === "overdue") {
    return {
      phase: "Payment overdue",
      detail: "This checkpoint is past due. Please complete the transfer or reach out to our finance team if you need to discuss timing.",
    };
  }
  return {
    phase: "Awaiting payment",
    detail: "Transfer the exact amount shown, then upload your receipt or screenshot below so our team can verify and move your project forward.",
  };
}
