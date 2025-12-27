import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { ArrowLeft, TrendingDown, Receipt, Filter, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExpensesOverviewPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const { data: expenses } = await supabase
    .from("expense_rollup")
    .select("*")
    .eq("tender_id", params.tenderId)
    .order("entry_date", { ascending: false });

  const total =
    expenses?.reduce((sum, e: any) => sum + Number(e.amount || 0), 0) || 0;

  // Group by source type
  const expensesByType = expenses?.reduce((acc: any, e: any) => {
    if (!acc[e.source_type]) {
      acc[e.source_type] = { total: 0, count: 0 };
    }
    acc[e.source_type].total += Number(e.amount || 0);
    acc[e.source_type].count += 1;
    return acc;
  }, {});

  const getSourceTypeLabel = (type: string) => {
    const labels: any = {
      vendor_purchase: "Vendor Purchases",
      material_purchase: "Material Purchases",
      labor_entry: "Labor Entries",
      activity_expense: "Site Expenses",
    };
    return labels[type] || type;
  };

  const getSourceTypeColor = (type: string) => {
    const colors: any = {
      vendor_purchase: "bg-purple-50 border-purple-200 text-purple-700",
      material_purchase: "bg-green-50 border-green-200 text-green-700",
      labor_entry: "bg-blue-50 border-blue-200 text-blue-700",
      activity_expense: "bg-amber-50 border-amber-200 text-amber-700",
    };
    return colors[type] || "bg-gray-50 border-gray-200 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href={`/tender/${params.tenderId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tender dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Receipt className="h-8 w-8 text-blue-600" />
                All Expenses Overview
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Complete expense breakdown across all categories
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(total)}</div>
              <p className="text-xs text-blue-100 mt-1">
                {expenses?.length || 0} total entries
              </p>
            </CardContent>
          </Card>

          {expensesByType &&
            Object.entries(expensesByType)
              .slice(0, 3)
              .map(([type, data]: [string, any]) => (
                <Card
                  key={type}
                  className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      {getSourceTypeLabel(type)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(data.total)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.count} entries
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Expenses List */}
        <Card className="shadow-md border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Expense Details
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                {expenses?.length || 0} entries
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!expenses || expenses.length === 0 ? (
              <div className="text-center py-16">
                <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  No expenses yet
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Start adding expenses to see them here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expenses.map((e: any, idx: number) => (
                  <div
                    key={`${e.source_type}-${idx}`}
                    className="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-gray-900">
                            {formatDate(e.entry_date)}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${getSourceTypeColor(
                              e.source_type
                            )}`}
                          >
                            {getSourceTypeLabel(e.source_type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {e.description || "No description"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(e.amount)}
                        </p>
                      </div>
                    </div>
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
