import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils/format";

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}/expenses/vendors`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Vendor expenses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            All Expenses
          </h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Total expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(total)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense list</CardTitle>
          </CardHeader>
          <CardContent>
            {!expenses || expenses.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No expenses yet.
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((e: any, idx: number) => (
                  <div key={`${e.source_type}-${idx}`} className="border rounded-lg p-3 bg-white">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">
                          {formatDate(e.entry_date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {e.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {e.source_type}
                        </p>
                      </div>
                      <p className="font-bold text-red-600">
                        {formatCurrency(e.amount)}
                      </p>
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
