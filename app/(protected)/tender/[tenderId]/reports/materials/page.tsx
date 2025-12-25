import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default async function MaterialsRegisterPage({
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

  const { data: materials } = await supabase
    .from("material_purchases")
    .select("*, materials(name_bn)")
    .eq("tender_id", params.tenderId)
    .order("purchase_date", { ascending: false })
    .limit(100);

  const total =
    materials?.reduce((sum, m) => sum + Number(m.total_amount || 0), 0) || 0;

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
              {labels.materialsRegister}
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
              <CardTitle>মালামাল ক্রয় সমূহ</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">তারিখ</th>
                    <th className="text-left py-2">মালামাল</th>
                    <th className="text-right py-2">পরিমাণ</th>
                    <th className="text-right py-2">দর</th>
                    <th className="text-right py-2">মোট</th>
                    <th className="text-left py-2">সরবরাহকারী</th>
                  </tr>
                </thead>
                <tbody>
                  {materials?.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="py-2">{formatDate(m.purchase_date)}</td>
                      <td className="py-2">
                        {m.materials?.name_bn || m.custom_item_name}
                        {m.is_bulk_breakdown && " *"}
                      </td>
                      <td className="text-right py-2">
                        {m.quantity} {m.unit}
                      </td>
                      <td className="text-right py-2">
                        {formatCurrency(m.unit_rate)}
                      </td>
                      <td className="text-right py-2 font-semibold">
                        {formatCurrency(m.total_amount)}
                      </td>
                      <td className="py-2">{m.supplier || "-"}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2">
                    <td colSpan={4} className="text-right py-2">
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
  );
}
