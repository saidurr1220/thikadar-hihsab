import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default async function LaborRegisterPage({
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

  const { data: labor } = await supabase
    .from("labor_entries")
    .select("*, work_types(name_bn)")
    .eq("tender_id", params.tenderId)
    .order("entry_date", { ascending: false })
    .limit(100);

  const total =
    labor?.reduce(
      (sum, l) =>
        sum + Number(l.khoraki_total || 0) + Number(l.wage_total || 0),
      0
    ) || 0;

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
            <h1 className="text-2xl font-bold mb-2">ঠিকাদারি হিসাব</h1>
            <h2 className="text-xl font-semibold mb-4">
              {labels.laborRegister}
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
              <CardTitle>শ্রমিক এন্ট্রি সমূহ</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">তারিখ</th>
                    <th className="text-left py-2">ধরন</th>
                    <th className="text-left py-2">বিবরণ</th>
                    <th className="text-right py-2">লোক</th>
                    <th className="text-right py-2">খোরাকি</th>
                    <th className="text-right py-2">মজুরি</th>
                    <th className="text-right py-2">মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {labor?.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className="py-2">{formatDate(l.entry_date)}</td>
                      <td className="py-2">
                        {l.labor_type === "contract" ? "চুক্তি" : "দৈনিক"}
                      </td>
                      <td className="py-2">
                        {l.crew_name || l.labor_name || "-"}
                        {l.work_types && ` - ${l.work_types.name_bn}`}
                      </td>
                      <td className="text-right py-2">{l.headcount || "-"}</td>
                      <td className="text-right py-2">
                        {l.khoraki_total
                          ? formatCurrency(l.khoraki_total)
                          : "-"}
                      </td>
                      <td className="text-right py-2">
                        {l.wage_total ? formatCurrency(l.wage_total) : "-"}
                      </td>
                      <td className="text-right py-2 font-semibold">
                        {formatCurrency(
                          (l.khoraki_total || 0) + (l.wage_total || 0)
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2">
                    <td colSpan={6} className="text-right py-2">
                      মোট:
                    </td>
                    <td className="text-right py-2">{formatCurrency(total)}</td>
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
