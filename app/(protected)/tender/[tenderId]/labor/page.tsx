import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default async function LaborListPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const { data: laborEntries } = await supabase
    .from("labor_entries")
    .select(
      `
      *,
      work_types (name_bn)
    `
    )
    .eq("tender_id", params.tenderId)
    .order("entry_date", { ascending: false })
    .limit(50);

  const contractEntries =
    laborEntries?.filter((l) => l.labor_type === "contract") || [];
  const dailyEntries =
    laborEntries?.filter((l) => l.labor_type === "daily") || [];

  const contractTotal = contractEntries.reduce(
    (sum, l) => sum + (l.khoraki_total || 0) + (l.wage_total || 0),
    0
  );
  const dailyTotal = dailyEntries.reduce(
    (sum, l) => sum + (l.khoraki_total || 0) + (l.wage_total || 0),
    0
  );
  const grandTotal = contractTotal + dailyTotal;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Link
              href={`/tender/${params.tenderId}`}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← টেন্ডার ড্যাশবোর্ড
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              {labels.laborRegister}
            </h1>
          </div>
          <Link href={`/tender/${params.tenderId}/labor/add`}>
            <Button>+ নতুন এন্ট্রি</Button>
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                মোট
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(grandTotal)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {labels.contract}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(contractTotal)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {contractEntries.length} entries
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {labels.daily}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dailyTotal)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {dailyEntries.length} entries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Entries List */}
        <Card>
          <CardHeader>
            <CardTitle>সাম্প্রতিক এন্ট্রি সমূহ</CardTitle>
          </CardHeader>
          <CardContent>
            {!laborEntries || laborEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">কোন এন্ট্রি নেই</p>
                <Link href={`/tender/${params.tenderId}/labor/add`}>
                  <Button>প্রথম এন্ট্রি যোগ করুন</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {laborEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            entry.labor_type === "contract"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {entry.labor_type === "contract"
                            ? labels.contract
                            : labels.daily}
                        </span>
                        <h3 className="font-semibold text-lg mt-2">
                          {entry.crew_name || entry.labor_name || "শ্রমিক"}
                        </h3>
                        {entry.work_types && (
                          <p className="text-sm text-gray-600">
                            {entry.work_types.name_bn}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {formatDate(entry.entry_date)}
                        </p>
                        <p className="text-xl font-bold text-blue-600 mt-1">
                          {formatCurrency(
                            (entry.khoraki_total || 0) + (entry.wage_total || 0)
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t text-sm">
                      {entry.headcount && (
                        <div>
                          <p className="text-gray-600">{labels.headcount}</p>
                          <p className="font-medium">{entry.headcount}</p>
                        </div>
                      )}
                      {entry.khoraki_total && (
                        <div>
                          <p className="text-gray-600">{labels.khoraki}</p>
                          <p className="font-medium">
                            {formatCurrency(entry.khoraki_total)}
                          </p>
                        </div>
                      )}
                      {entry.wage_total && (
                        <div>
                          <p className="text-gray-600">{labels.wage}</p>
                          <p className="font-medium">
                            {formatCurrency(entry.wage_total)}
                          </p>
                        </div>
                      )}
                    </div>

                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-3 pt-3 border-t">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
