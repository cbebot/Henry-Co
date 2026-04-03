import { redirect } from "next/navigation";
import { getSharedAccountPropertyUrl } from "@/lib/property/links";

export const dynamic = "force-dynamic";

export default function PropertySavedBridgePage() {
  redirect(getSharedAccountPropertyUrl("saved"));
}
