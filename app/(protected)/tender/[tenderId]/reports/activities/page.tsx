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
    .order("activity_date", { ascending: false })
    .limit(100);

  const total = activities?.reduce((sum, a) => sum + a.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 no-print">
          <Link
            href={`/tender/${params.tenderId}/reports`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← রিপোর্ট মেনু
          </Link>
        </div>

        <div className="print-content">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">থিকাদারি হিসাব</h1>
            <h2 className="text-xl font-semibold mb-4">
              {labels.activityRegister}
            </h2>
            <div className="text-sm space-y-1">
              <p>
                <strong>টেন্ডার কোড:</strong> {tender?.tender_code}
              </p>
              <p>
                <strong>প্রকল্পের নাম:</strong> {tender?.project_name}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>কাজের খরচ সমূহ</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">তারিখ</th>
                    <th className="text-left py-2">বিভাগ</th>
                    <th className="text-left py-2">বিবরণ</th>
                    <th className="text-right py-2">পরিমাণ</th>
                    <th className="text-left py-2">বিক্রেতা</th>
                  </tr>
                </thead>
                <tbody>
                  {activities?.map((a) => (
                    <tr key={a.id} className="border-b">
                      <td className="py-2">{formatDate(a.activity_date)}</td>
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
                      মোট:
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

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}
