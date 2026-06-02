import type { Metadata } from "next";
import { getSettings } from "@/lib/cms/settings";
import { BrandForm } from "./BrandForm";

export const metadata: Metadata = { title: "Brand & Settings — Owner CMS" };
export const dynamic = "force-dynamic";

export default async function BrandSettingsPage() {
  const settings = await getSettings();
  return <BrandForm settings={settings} />;
}
