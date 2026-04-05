import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { getFinanceCenterData } from "@/lib/owner-data";
import { formatCurrencyAmount } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FinanceRevenuePage() {
  const data = await getFinanceCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Revenue"
        title="Revenue snapshot by division"
        description="This page groups live recognized revenue from care payments, marketplace payment verification, and paid shared invoices."
      />

      <OwnerPanel title="Revenue lines" description="Current recognizable revenue surfaces that are already live in Supabase.">
        <table className="owner-table">
          <thead>
            <tr>
              <th>Division</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.revenueByDivision.map((item) => (
              <tr key={item.slug}>
                <td>
                  <div className="flex items-center gap-3">
                    <DivisionBadge division={item.slug} />
                    <span>{item.label}</span>
                  </div>
                </td>
                <td>{formatCurrencyAmount(item.valueNaira)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </OwnerPanel>
    </div>
  );
}
