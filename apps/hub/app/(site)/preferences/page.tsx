import type { Metadata } from "next";
import { getConsentCopy } from "@henryco/i18n/server";
import { getHubPublicLocale } from "../../../lib/locale-server";
import PreferencesClient from "./PreferencesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preferences — Henry & Co.",
  description:
    "Manage your language, privacy, personalization, and experience preferences across all Henry & Co. sites.",
};

export default async function PreferencesPage() {
  const locale = await getHubPublicLocale();
  const consentCopy = getConsentCopy(locale);

  return <PreferencesClient initialLocale={locale} copy={consentCopy} />;
}
