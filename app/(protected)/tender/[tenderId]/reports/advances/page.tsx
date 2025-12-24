import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default async function AdvancesRegisterPage({
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

  const { data: balances } = await supabase.rpc("get_person_balances", {
    p_tender_id: params.tenderId,
  });

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
              {labels.advanceLedger}
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
              <CardTitle>ব্যক্তিভিত্তিক হিসাব</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">ব্যক্তি</th>
                    <th className="text-left py-2">ভূমিকা</th>
                    <th className="text-right py-2">মোট অগ্রিম</th>
                    <th className="text-right py-2">মোট খরচ</th>
                    <th className="text-right py-2">ব্যালেন্স</th>
                  </tr>
                </thead>
                <tbody>
                  {balances?.map((bal: any) => (
                    <tr key={bal.person_id} className="border-b">
                      <td className="py-2">{bal.person_name}</td>
                      <td className="py-2">{bal.role}</td>
                      <td className="text-right py-2">
                        {formatCurrency(bal.total_advances)}
                      </td>
                      <td className="text-right py-2">
                        {formatCurrency(bal.total_expenses)}
                      </td>
                      <td
                        className={`text-right py-2 font-semibold ${
                          bal.balance > 0
                            ? "text-green-600"
                            : bal.balance < 0
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        {formatCurrency(Math.abs(bal.balance))}
                        {bal.balance > 0
                          ? " (বাকি)"
                          : bal.balance < 0
                          ? " (পাওনা)"
                          : ""}
                      </td>
                    </tr>
                  ))}
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
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}
