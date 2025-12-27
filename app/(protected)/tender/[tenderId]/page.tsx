import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  ClipboardList,
  Coins,
  FileText,
  HardHat,
  Package,
  Settings,
  Truck,
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Wrench,
  Building2,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const { data: tender } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", params.tenderId)
    .single();

  if (!tender) {
    return <div className="p-8">Tender not found.</div>;
  }

  const { data: laborEntries } = await supabase
    .from("labor_entries")
    .select("khoraki_total, wage_total, entry_date, payment_method")
    .eq("tender_id", params.tenderId);

  const { data: materialPurchases } = await supabase
    .from("material_purchases")
    .select("total_amount, purchase_date")
    .eq("tender_id", params.tenderId);

  const { data: activityExpenses } = await supabase
    .from("activity_expenses")
    .select("amount, expense_date")
    .eq("tender_id", params.tenderId);

  const { data: rollupExpenses } = await supabase
    .from("expense_rollup")
    .select("amount, source_type")
    .eq("tender_id", params.tenderId);

  const laborTotal =
    laborEntries?.reduce(
      (sum, l) =>
        sum + Number(l.khoraki_total || 0) + Number(l.wage_total || 0),
      0
    ) || 0;
  const materialsTotal =
    materialPurchases?.reduce(
      (sum, m) => sum + Number(m.total_amount || 0),
      0
    ) || 0;
  const activitiesTotal =
    activityExpenses?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;
  const rollupTotal =
    rollupExpenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
  const vendorTotal =
    rollupExpenses
      ?.filter((e) => e.source_type === "vendor_purchase")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
  const otherTotal = rollupTotal - vendorTotal;
  const grandTotal =
    laborTotal + materialsTotal + activitiesTotal + rollupTotal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
      <div>
        <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to dashboard
                </Link>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                      {tender.project_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="rounded-full border-2 border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                        {tender.tender_code}
                      </span>
                      {tender.location ? (
                        <span className="rounded-full border-2 border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                          📍 {tender.location}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`/tender/${params.tenderId}/reports`}>
                  <Button variant="outline" className="gap-2 border-2 hover:bg-blue-50 hover:border-blue-300 transition-all">
                    <BarChart3 className="h-4 w-4" />
                    Reports
                  </Button>
                </Link>
                <Link href={`/tender/${params.tenderId}/settings`}>
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-indigo-100 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {formatCurrency(grandTotal)}
                </p>
                <p className="text-[10px] text-indigo-100 mt-0.5">All-time</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-blue-100 flex items-center gap-1">
                  <HardHat className="h-3.5 w-3.5" />
                  Labor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {formatCurrency(laborTotal)}
                </p>
                <p className="text-[10px] text-blue-100 mt-0.5">
                  {grandTotal > 0
                    ? `${((laborTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-green-100 flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {formatCurrency(materialsTotal)}
                </p>
                <p className="text-[10px] text-green-100 mt-0.5">
                  {grandTotal > 0
                    ? `${((materialsTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-amber-100 flex items-center gap-1">
                  <Wrench className="h-3.5 w-3.5" />
                  Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {formatCurrency(activitiesTotal)}
                </p>
                <p className="text-[10px] text-amber-100 mt-0.5">
                  {grandTotal > 0
                    ? `${((activitiesTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-purple-100 flex items-center gap-1">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {formatCurrency(vendorTotal)}
                </p>
                <p className="text-[10px] text-purple-100 mt-0.5">
                  {grandTotal > 0
                    ? `${((vendorTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-500 to-slate-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-100 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Other
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {formatCurrency(otherTotal)}
                </p>
                <p className="text-[10px] text-slate-100 mt-0.5">
                  {grandTotal > 0
                    ? `${((otherTotal / grandTotal) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 bg-white border-slate-200 shadow-md">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Link href={`/tender/${params.tenderId}/labor/add`}>
                    <Button variant="outline" className="w-full gap-2 h-10 text-sm border-2 hover:bg-blue-50 hover:border-blue-300 transition-all">
                      <HardHat className="h-4 w-4 text-blue-600" />
                      Labor
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/purchases/add`}>
                    <Button variant="outline" className="w-full gap-2 h-10 text-sm border-2 hover:bg-green-50 hover:border-green-300 transition-all">
                      <Package className="h-4 w-4 text-green-600" />
                      Purchase
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/activities/add`}>
                    <Button variant="outline" className="w-full gap-2 h-10 text-sm border-2 hover:bg-amber-50 hover:border-amber-300 transition-all">
                      <ClipboardList className="h-4 w-4 text-amber-600" />
                      Activity
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/advances/people`}>
                    <Button variant="outline" className="w-full gap-2 h-10 text-sm border-2 hover:bg-purple-50 hover:border-purple-300 transition-all">
                      <Users className="h-4 w-4 text-purple-600" />
                      Advances
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/purchases`}>
                    <Button variant="outline" className="w-full gap-2 h-10 text-sm border-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all">
                      <Truck className="h-4 w-4 text-indigo-600" />
                      Purchases
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/expenses/overview`}>
                    <Button variant="outline" className="w-full gap-2 h-10 text-sm border-2 hover:bg-slate-50 hover:border-slate-300 transition-all">
                      <Coins className="h-4 w-4 text-slate-600" />
                      Overview
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-md">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  Balance Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <Link href={`/tender/${params.tenderId}/advances/people`}>
                  <Button variant="outline" className="w-full gap-2 h-10 text-sm border-2 hover:bg-purple-50 hover:border-purple-300 transition-all">
                    <Users className="h-4 w-4 text-purple-600" />
                    Staff Balances
                  </Button>
                </Link>
                <Link href={`/tender/${params.tenderId}/purchases`}>
                  <Button variant="outline" className="w-full gap-2 h-10 text-sm border-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all">
                    <Truck className="h-4 w-4 text-indigo-600" />
                    Vendor Balances
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link href={`/tender/${params.tenderId}/labor`}>
              <Card className="group cursor-pointer bg-white border-slate-200 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg hover:border-blue-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <HardHat className="h-4 w-4 text-blue-600" />
                    </div>
                    Labor Register
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Daily crews, wages, and food allowance.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/purchases`}>
              <Card className="group cursor-pointer bg-white border-slate-200 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg hover:border-green-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-900 group-hover:text-green-600 transition-colors">
                    <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Package className="h-4 w-4 text-green-600" />
                    </div>
                    Purchases & Vendors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Purchase management with vendor profiles.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/activities`}>
              <Card className="group cursor-pointer bg-white border-slate-200 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg hover:border-amber-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                    <div className="p-1.5 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                      <ClipboardList className="h-4 w-4 text-amber-600" />
                    </div>
                    Activity Register
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Operational work and activity costs.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/advances/people`}>
              <Card className="group cursor-pointer bg-white border-slate-200 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg hover:border-purple-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                    <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    Staff Advances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Staff advances and expenses.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/expenses/overview`}>
              <Card className="group cursor-pointer bg-white border-slate-200 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg hover:border-slate-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-900 group-hover:text-slate-600 transition-colors">
                    <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                      <FileText className="h-4 w-4 text-slate-600" />
                    </div>
                    Expense Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Overview of all project expenses.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
