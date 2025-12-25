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
  Wallet,
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(254,243,199,0.6),rgba(255,255,255,0))]">
      <div className="bg-gradient-to-br from-amber-50 via-white to-slate-50">
        <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to dashboard
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">
                  {tender.project_name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                    Tender {tender.tender_code}
                  </span>
                  {tender.location ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                      {tender.location}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/tender/${params.tenderId}/reports`}>
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Reports
                  </Button>
                </Link>
                <Link href={`/tender/${params.tenderId}/settings`}>
                  <Button className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6">
            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  All time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(grandTotal)}
                </p>
                <p className="text-sm text-slate-500 mt-1">Total expenses</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Labor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(laborTotal)}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {grandTotal > 0
                    ? `${((laborTotal / grandTotal) * 100).toFixed(1)}% share`
                    : "0% share"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(materialsTotal)}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {grandTotal > 0
                    ? `${((materialsTotal / grandTotal) * 100).toFixed(1)}% share`
                    : "0% share"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(activitiesTotal)}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {grandTotal > 0
                    ? `${((activitiesTotal / grandTotal) * 100).toFixed(1)}% share`
                    : "0% share"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(vendorTotal)}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {grandTotal > 0
                    ? `${((vendorTotal / grandTotal) * 100).toFixed(1)}% share`
                    : "0% share"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Other expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(otherTotal)}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {grandTotal > 0
                    ? `${((otherTotal / grandTotal) * 100).toFixed(1)}% share`
                    : "0% share"}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Quick access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Link href={`/tender/${params.tenderId}/labor/add`}>
                    <Button variant="outline" className="w-full gap-2">
                      <HardHat className="h-4 w-4" />
                      Add labor
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/materials/add`}>
                    <Button variant="outline" className="w-full gap-2">
                      <Package className="h-4 w-4" />
                      Add materials
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/activities/add`}>
                    <Button variant="outline" className="w-full gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Add activity
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/advances/people`}>
                    <Button variant="outline" className="w-full gap-2">
                      <Users className="h-4 w-4" />
                      Staff advances
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/expenses/vendors`}>
                    <Button variant="outline" className="w-full gap-2">
                      <Truck className="h-4 w-4" />
                      Vendor expenses
                    </Button>
                  </Link>
                  <Link href={`/tender/${params.tenderId}/expenses/overview`}>
                    <Button variant="outline" className="w-full gap-2">
                      <Coins className="h-4 w-4" />
                      Expense overview
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Balance view
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/tender/${params.tenderId}/ledger-summary`}>
                  <Button variant="outline" className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    Ledger summary
                  </Button>
                </Link>
                <Link href={`/tender/${params.tenderId}/advances`}>
                  <Button variant="outline" className="w-full gap-2">
                    <Wallet className="h-4 w-4" />
                    Advance ledger
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href={`/tender/${params.tenderId}/labor`}>
              <Card className="group cursor-pointer bg-white/80 border-slate-200/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <HardHat className="h-5 w-5 text-amber-500" />
                    Labor register
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    Daily crews, wages, and food allowance tracking.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/materials`}>
              <Card className="group cursor-pointer bg-white/80 border-slate-200/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Package className="h-5 w-5 text-sky-500" />
                    Materials register
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    Purchase logs, suppliers, and quantity breakdowns.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/activities`}>
              <Card className="group cursor-pointer bg-white/80 border-slate-200/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <ClipboardList className="h-5 w-5 text-emerald-500" />
                    Activity register
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    Track operational work and site activity costs.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/advances/people`}>
              <Card className="group cursor-pointer bg-white/80 border-slate-200/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Users className="h-5 w-5 text-violet-500" />
                    Staff advances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    Split view of staff advances and expenses.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/expenses/vendors`}>
              <Card className="group cursor-pointer bg-white/80 border-slate-200/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Truck className="h-5 w-5 text-orange-500" />
                    Vendor expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    Vendor purchases, payments, and balances.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/tender/${params.tenderId}/ledger-summary`}>
              <Card className="group cursor-pointer bg-white/80 border-slate-200/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <FileText className="h-5 w-5 text-slate-600" />
                    Ledger summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    Combined balances across people and vendors.
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
