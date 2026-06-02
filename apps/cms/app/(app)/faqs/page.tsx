import type { Metadata } from "next";
import { listFaqGroups } from "@/lib/cms/faqs";
import { FaqsManager } from "./FaqsManager";

export const metadata: Metadata = { title: "FAQs — Owner CMS" };
export const dynamic = "force-dynamic";

export default async function FaqsIndex() {
  const groups = await listFaqGroups();
  return <FaqsManager groups={groups} />;
}
