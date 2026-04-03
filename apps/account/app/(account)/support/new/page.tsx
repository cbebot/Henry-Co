import { LifeBuoy } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import PageHeader from "@/components/layout/PageHeader";
import NewSupportForm from "@/components/support/NewSupportForm";

export const dynamic = "force-dynamic";

export default async function NewSupportPage() {
  await requireAccountUser();

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="New Support Request"
        description="Describe your issue and we'll get back to you."
        icon={LifeBuoy}
      />
      <NewSupportForm />
    </div>
  );
}
