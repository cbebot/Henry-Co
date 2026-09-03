import { redirect } from "next/navigation";

/**
 * The onboarding orphan is retired (Vendor Studio Stage C). Its checklist now
 * lives on the overview's first-run block, so old links land safely there.
 */
export default function VendorOnboardingPage() {
  redirect("/vendor");
}
