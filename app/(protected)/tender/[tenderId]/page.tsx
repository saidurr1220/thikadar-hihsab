import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency } from "@/lib/utils/format";

export default async function TenderDashboardPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get tender
  const { data: tender } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", params.tenderId)
    .single();

  if (!tender) {
    return <div className="p-8">টেন্ডার পাওয়া যায়নি</div>;
  }

  // Get summary data (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: laborEntries } = await supabase
    .from("labor_entries")
    .select("khoraki_total, wage_total, entry_date")
    .eq("tender_id", params.tenderId)
    .gte("entry_date", thirtyDaysAgo.toISOString().split("T")[0]);

  const { data: materialPurchases } = await supabase
    .from("material_purchases")
    .select("total_amount, purchase_date")
    .eq("tender_id", params.tenderId)
    .gte("purchase_date", thirtyDaysAgo.toISOString().split("T")[0]);

  const { data: activityExpenses } = await supabase
    .from("activity_expenses")
    .select("amount, expense_date")
    .eq("tender_id", params.tenderId)
    .gte("expense_date", thirtyDaysAgo.toISOString().split("T")[0]);

  // Calculate totals
  const laborTotal =
    laborEntries?.reduce(
      (sum, l) => sum + (l.khoraki_total || 0) + (l.wage_total || 0),
      0
    ) || 0;
  const materialsTotal =
    materialPurchases?.reduce((sum, m) => sum + m.total_amount, 0) || 0;
  const activitiesTotal =
    activityExpenses?.reduce((sum, a) => sum + a.amount, 0) || 0;
  const grandTotal = laborTotal + materialsTotal + activitiesTotal;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
              >
                ← {labels.dashboard}
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {tender.project_name}
              </h1>
              <p className="text-gray-600 mt-1">
                {tender.tender_code} {tender.location && `• ${tender.location}`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                মোট খরচ (৩০ দিন)
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
                {labels.labor}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(laborTotal)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {grandTotal > 0
                  ? `${((laborTotal / grandTotal) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {labels.materials}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(materialsTotal)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {grandTotal > 0
                  ? `${((materialsTotal / grandTotal) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {labels.activities}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(activitiesTotal)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {grandTotal > 0
                  ? `${((activitiesTotal / grandTotal) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>দ্রুত এন্ট্রি</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Link href={`/tender/${params.tenderId}/labor/add`}>
                <Button className="w-full" variant="outline">
                  👷 {labels.labor}
                </Button>
              </Link>
              <Link href={`/tender/${params.tenderId}/materials/add`}>
                <Button className="w-full" variant="outline">
                  🧱 {labels.materials}
                </Button>
              </Link>
              <Link href={`/tender/${params.tenderId}/activities/add`}>
                <Button className="w-full" variant="outline">
                  🔧 {labels.activities}
                </Button>
              </Link>
              <Link href={`/tender/${params.tenderId}/advances/give`}>
                <Button className="w-full" variant="outline">
                  💰 {labels.advances}
                </Button>
              </Link>
              <Link href={`/tender/${params.tenderId}/cash-expense`}>
                <Button className="w-full" variant="outline">
                  💵 নগদ খরচ
                </Button>
              </Link>
              <Link href={`/tender/${params.tenderId}/expenses/submit`}>
                <Button className="w-full" variant="outline">
                  📝 {labels.expenses}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href={`/tender/${params.tenderId}/labor`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">👷</span>
                  {labels.laborRegister}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  চুক্তি ও দৈনিক শ্রমিক হিসাব দেখুন
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/tender/${params.tenderId}/materials`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🧱</span>
                  {labels.materialsRegister}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  মালামাল ক্রয় হিসাব দেখুন
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/tender/${params.tenderId}/activities`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔧</span>
                  {labels.activityRegister}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">কাজভিত্তিক খরচ দেখুন</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/tender/${params.tenderId}/advances`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  {labels.advanceLedger}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">অগ্রিম ও হিসাব সমন্বয়</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/tender/${params.tenderId}/reports`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  {labels.reports}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  সকল রিপোর্ট দেখুন ও প্রিন্ট করুন
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/tender/${params.tenderId}/settings`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">⚙️</span>
                  {labels.settings}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  টেন্ডার সেটিংস ও ব্যবহারকারী
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
