import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import PrintButton from "./PrintButton";

// Disable caching for fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LedgerSummaryPage({
  params,
  searchParams,
}: {
  params: { tenderId: string };
  searchParams: { from?: string; to?: string };
}) {
  const supabase = createClient();

  // Get date range (default: last 30 days)
  const toDate = searchParams.to || new Date().toISOString().split("T")[0];
  const fromDate =
    searchParams.from ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Get tender info
  const { data: tender } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", params.tenderId)
    .single();

  // Get all expenses by category (Khata)
  const { data: labor } = await supabase
    .from("labor_entries")
    .select("khoraki_total, wage_total, entry_date")
    .eq("tender_id", params.tenderId)
    .gte("entry_date", fromDate)
    .lte("entry_date", toDate);

  const { data: materials } = await supabase
    .from("material_purchases")
    .select("total_amount, purchase_date")
    .eq("tender_id", params.tenderId)
    .gte("purchase_date", fromDate)
    .lte("purchase_date", toDate);

  const { data: activities } = await supabase
    .from("activity_expenses")
    .select("amount, expense_date, expense_categories!left(name_bn)")
    .eq("tender_id", params.tenderId)
    .gte("expense_date", fromDate)
    .lte("expense_date", toDate);

  const { data: advances } = await supabase
    .from("advances")
    .select("amount, advance_date")
    .eq("tender_id", params.tenderId)
    .gte("advance_date", fromDate)
    .lte("advance_date", toDate);

  // Calculate totals
  const laborTotal =
    labor?.reduce(
      (sum, l) =>
        sum +
        Number(l.khoraki_total || 0) +
        Number(l.wage_total || 0),
      0
    ) || 0;

  const materialsTotal =
    materials?.reduce((sum, m) => sum + Number(m.total_amount || 0), 0) || 0;

  const activitiesTotal =
    activities?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;

  const advancesTotal =
    advances?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;

  const grandTotal = laborTotal + materialsTotal + activitiesTotal;

  // Group activities by category
  const activitiesByCategory = activities?.reduce((acc: any, a) => {
    const cat = (a.expense_categories as any)?.name_bn || "অন্যান্য";
    if (!acc[cat]) {
      acc[cat] = { total: 0, count: 0 };
    }
    acc[cat].total += Number(a.amount || 0);
    acc[cat].count += 1;
    return acc;
  }, {});

  // Create Khata summary
  const khataList = [
    {
      name: "à¦¶à§à¦°à¦®à¦¿à¦• à¦–à¦¾à¦¤à¦¾",
      name_en: "Labor Account",
      total: laborTotal,
      count: labor?.length || 0,
      icon: "ðŸ‘·",
      color: "blue",
    },
    {
      name: "à¦®à¦¾à¦²à¦¾à¦®à¦¾à¦² à¦–à¦¾à¦¤à¦¾",
      name_en: "Materials Account",
      total: materialsTotal,
      count: materials?.length || 0,
      icon: "ðŸ§±",
      color: "green",
    },
    {
      name: "à¦…à¦—à§à¦°à¦¿à¦® à¦–à¦¾à¦¤à¦¾",
      name_en: "Advance Account",
      total: advancesTotal,
      count: advances?.length || 0,
      icon: "ðŸ’°",
      color: "yellow",
    },
  ];

  // Add activity categories as separate khatas
  if (activitiesByCategory) {
    Object.entries(activitiesByCategory).forEach(
      ([cat, data]: [string, any]) => {
        khataList.push({
          name: `${cat} à¦–à¦¾à¦¤à¦¾`,
          name_en: `${cat} Account`,
          total: data.total,
          count: data.count,
          icon: "ðŸ”§",
          color: "purple",
        });
      }
    );
  }

  // Sort by total (descending)
  khataList.sort((a, b) => b.total - a.total);

  const daysDiff = Math.ceil(
    (new Date(toDate).getTime() - new Date(fromDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            â† à¦Ÿà§‡à¦¨à§à¦¡à¦¾à¦° à¦¡à§à¦¯à¦¾à¦¶à¦¬à§‹à¦°à§à¦¡
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                à¦–à¦¾à¦¤à¦¾ à¦¸à¦¾à¦°à¦¸à¦‚à¦•à§à¦·à§‡à¦ª
              </h1>
              <p className="text-gray-600">
                {tender?.project_name} â€¢ {tender?.tender_code}
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <PrintButton />
              <div className="text-right">
                <p className="text-sm text-gray-600">à¦¸à¦®à¦¯à¦¼à¦•à¦¾à¦²</p>
                <p className="font-semibold">
                  {formatDate(fromDate)} - {formatDate(toDate)}
                </p>
                <p className="text-sm text-gray-600 mt-1">{daysDiff} à¦¦à¦¿à¦¨</p>
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
            <p className="text-sm opacity-90 mb-1">à¦®à§‹à¦Ÿ à¦–à¦°à¦š</p>
            <p className="text-4xl font-bold">{formatCurrency(grandTotal)}</p>
            <p className="text-sm opacity-90 mt-2">
              à¦¦à§ˆà¦¨à¦¿à¦• à¦—à¦¡à¦¼: {formatCurrency(grandTotal / daysDiff)}
            </p>
          </div>
        </div>

        {/* Khata Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {khataList.map((khata, idx) => (
            <Card
              key={idx}
              className="hover:shadow-lg transition-shadow border-l-4"
              style={{
                borderLeftColor:
                  khata.color === "blue"
                    ? "#3b82f6"
                    : khata.color === "green"
                    ? "#10b981"
                    : khata.color === "yellow"
                    ? "#f59e0b"
                    : "#8b5cf6",
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{khata.icon}</span>
                  <span className="text-xs font-medium text-gray-500">
                    {khata.count} à¦à¦¨à§à¦Ÿà§à¦°à¦¿
                  </span>
                </div>
                <CardTitle className="text-lg mt-2">{khata.name}</CardTitle>
                <p className="text-xs text-gray-500">{khata.name_en}</p>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(khata.total)}
                </p>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">à¦®à§‹à¦Ÿ à¦–à¦°à¦šà§‡à¦°</span>
                    <span className="font-semibold text-blue-600">
                      {((khata.total / grandTotal) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">à¦¦à§ˆà¦¨à¦¿à¦• à¦—à¦¡à¦¼</span>
                    <span className="font-semibold">
                      {formatCurrency(khata.total / daysDiff)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦¹à¦¿à¦¸à¦¾à¦¬</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-3 px-4">à¦–à¦¾à¦¤à¦¾à¦° à¦¨à¦¾à¦®</th>
                    <th className="text-right py-3 px-4">à¦à¦¨à§à¦Ÿà§à¦°à¦¿ à¦¸à¦‚à¦–à§à¦¯à¦¾</th>
                    <th className="text-right py-3 px-4">à¦®à§‹à¦Ÿ à¦Ÿà¦¾à¦•à¦¾</th>
                    <th className="text-right py-3 px-4">à¦¶à¦¤à¦¾à¦‚à¦¶</th>
                    <th className="text-right py-3 px-4">à¦¦à§ˆà¦¨à¦¿à¦• à¦—à¦¡à¦¼</th>
                  </tr>
                </thead>
                <tbody>
                  {khataList.map((khata, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{khata.icon}</span>
                          <div>
                            <p className="font-semibold">{khata.name}</p>
                            <p className="text-xs text-gray-500">
                              {khata.name_en}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {khata.count}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold">
                        {formatCurrency(khata.total)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                          {((khata.total / grandTotal) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {formatCurrency(khata.total / daysDiff)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-50 border-t-2">
                    <td className="py-3 px-4">à¦¸à¦°à§à¦¬à¦®à§‹à¦Ÿ</td>
                    <td className="text-right py-3 px-4">
                      {khataList.reduce((sum, k) => sum + k.count, 0)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(grandTotal)}
                    </td>
                    <td className="text-right py-3 px-4">100%</td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(grandTotal / daysDiff)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Date Range Filter */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>à¦¸à¦®à¦¯à¦¼à¦•à¦¾à¦² à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à§à¦¨</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="get" className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  à¦¶à§à¦°à§à¦° à¦¤à¦¾à¦°à¦¿à¦–
                </label>
                <input
                  type="date"
                  name="from"
                  defaultValue={fromDate}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  à¦¶à§‡à¦· à¦¤à¦¾à¦°à¦¿à¦–
                </label>
                <input
                  type="date"
                  name="to"
                  defaultValue={toDate}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                à¦¦à§‡à¦–à§à¦¨
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

