import { LifeBuoy } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import NewSupportForm from "@/components/support/NewSupportForm";

export const dynamic = "force-dynamic";

export default async function NewSupportPage() {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireAccountUser();

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={t("New Support Request")}
        description={t("Describe your issue and we'll get back to you.")}
        icon={LifeBuoy}
      />
      <NewSupportForm />
    </div>
  );
}
