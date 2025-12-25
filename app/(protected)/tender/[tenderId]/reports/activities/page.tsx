import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default async function ActivitiesRegisterPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const { data: tender } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", params.tenderId)
    .single();

  const { data: activities } = await supabase
    .from("activity_expenses")
    .select("*, expense_categories(name_bn), expense_subcategories(name_bn)")
    .eq("tender_id", params.tenderId)
    .order("expense_date", { ascending: false })
    .limit(100);

  const total =
    activities?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 no-print">
          <Link
            href={`/tender/${params.tenderId}/reports`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            â† à¦°à¦¿à¦ªà§‹à¦°à§à¦Ÿ à¦®à§‡à¦¨à§
          </Link>
        </div>

        <div className="print-content">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">
              à¦¥à¦¿à¦•à¦¾à¦¦à¦¾à¦°à¦¿ à¦¹à¦¿à¦¸à¦¾à¦¬
            </h1>
            <h2 className="text-xl font-semibold mb-4">
              {labels.activityRegister}
            </h2>
            <div className="text-sm space-y-1">
              <p>
                <strong>à¦Ÿà§‡à¦¨à§à¦¡à¦¾à¦° à¦•à§‹à¦¡:</strong>{" "}
                {tender?.tender_code}
              </p>
              <p>
                <strong>à¦ªà§à¦°à¦•à¦²à§à¦ªà§‡à¦° à¦¨à¦¾à¦®:</strong>{" "}
                {tender?.project_name}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>à¦•à¦¾à¦œà§‡à¦° à¦–à¦°à¦š à¦¸à¦®à§‚à¦¹</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">à¦¤à¦¾à¦°à¦¿à¦–</th>
                    <th className="text-left py-2">à¦¬à¦¿à¦­à¦¾à¦—</th>
                    <th className="text-left py-2">à¦¬à¦¿à¦¬à¦°à¦£</th>
                    <th className="text-right py-2">à¦ªà¦°à¦¿à¦®à¦¾à¦£</th>
                    <th className="text-left py-2">à¦¬à¦¿à¦•à§à¦°à§‡à¦¤à¦¾</th>
                  </tr>
                </thead>
                <tbody>
                  {activities?.map((a) => (
                    <tr key={a.id} className="border-b">
                      <td className="py-2">{formatDate(a.expense_date)}</td>
                      <td className="py-2">
                        {a.expense_categories?.name_bn}
                        {a.expense_subcategories &&
                          ` - ${a.expense_subcategories.name_bn}`}
                      </td>
                      <td className="py-2">{a.description}</td>
                      <td className="text-right py-2 font-semibold">
                        {formatCurrency(a.amount)}
                      </td>
                      <td className="py-2">{a.vendor || "-"}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2">
                    <td colSpan={3} className="text-right py-2">
                      à¦®à§‹à¦Ÿ:
                    </td>
                    <td className="text-right py-2">{formatCurrency(total)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
