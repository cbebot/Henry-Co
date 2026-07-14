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
        ? `We received your proof (${payment.proofName}). We're verifying it against your transfer now — your workspace updates automatically once it's confirmed, usually within one business day.`
        : "Your proof has been received. We're reviewing it now and will confirm shortly, usually within one business day.",
    };
  }
  if (payment.status === "overdue") {
    return {
      phase: "Payment overdue",
      detail: "This checkpoint is past due. Please complete the transfer or reach out to us if you need to discuss timing.",
    };
  }
  return {
    phase: "Awaiting payment",
    detail: "Transfer the exact amount shown, then upload your receipt or screenshot below so our team can verify and move your project forward.",
  };
}
