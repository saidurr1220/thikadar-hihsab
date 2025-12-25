import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import DashboardCharts from "./DashboardCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: assignments } = await supabase
    .from("tender_assignments")
    .select(
      `
      *,
      tenders (
        id,
        tender_code,
        project_name,
        location,
        is_active,
        created_at
      )
    `
    )
    .eq("user_id", user.id);

  const tenders = assignments?.map((a) => a.tenders).filter(Boolean) || [];
  const activeTenders = tenders.filter((t: any) => t.is_active);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateFilter = thirtyDaysAgo.toISOString().split("T")[0];

  let totalExpenses = 0;
  let laborTotal = 0;
  let materialsTotal = 0;
  let activitiesTotal = 0;

  for (const tender of tenders) {
    const tenderId = (tender as any).id;

    const { data: labor } = await supabase
      .from("labor_entries")
      .select("khoraki_total, wage_total")
      .eq("tender_id", tenderId)
      .gte("entry_date", dateFilter);

    const { data: materials } = await supabase
      .from("material_purchases")
      .select("total_amount")
      .eq("tender_id", tenderId)
      .gte("purchase_date", dateFilter);

    const { data: activities } = await supabase
      .from("activity_expenses")
      .select("amount")
      .eq("tender_id", tenderId)
      .gte("expense_date", dateFilter);

    laborTotal +=
      labor?.reduce(
        (sum, l) => sum + (l.khoraki_total || 0) + (l.wage_total || 0),
        0
      ) || 0;
    materialsTotal +=
      materials?.reduce((sum, m) => sum + m.total_amount, 0) || 0;
    activitiesTotal += activities?.reduce((sum, a) => sum + a.amount, 0) || 0;
  }

  totalExpenses = laborTotal + materialsTotal + activitiesTotal;

  const expenseData = [
    { name: "শ্রমিক", value: laborTotal, color: "#3b82f6" },
    { name: "মালামাল", value: materialsTotal, color: "#10b981" },
    { name: "কাজের খরচ", value: activitiesTotal, color: "#f59e0b" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                থ
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  থিকাদারি হিসাব
                </h1>
                <p className="text-xs text-gray-600">{profile.full_name}</p>
              </div>
            </div>
            <form action="/api/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm" className="shadow-sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                মোট টেন্ডার
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold">{tenders.length}</div>
              <p className="text-xs text-blue-100 mt-1">সর্বমোট প্রজেক্ট</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                সক্রিয় টেন্ডার
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold">{activeTenders.length}</div>
              <p className="text-xs text-green-100 mt-1">চলমান প্রজেক্ট</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                ভূমিকা
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold capitalize">{profile.role}</div>
              <p className="text-xs text-purple-100 mt-1">আপনার অধিকার</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">
                মোট খরচ (৩০ দিন)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-xs text-orange-100 mt-1">গত এক মাসের</p>
            </CardContent>
          </Card>
        </div>

        {/* Expense Breakdown */}
        {totalExpenses > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">খরচের বিশ্লেষণ</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <Card className="bg-white border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    শ্রমিক খরচ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {formatCurrency(laborTotal)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {totalExpenses > 0 ? ((laborTotal / totalExpenses) * 100).toFixed(1) : 0}% মোট খরচের
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-green-200 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    মালামাল খরচ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">
                    {formatCurrency(materialsTotal)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {totalExpenses > 0 ? ((materialsTotal / totalExpenses) * 100).toFixed(1) : 0}% মোট খরচের
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    কাজের খরচ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                    {formatCurrency(activitiesTotal)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {totalExpenses > 0 ? ((activitiesTotal / totalExpenses) * 100).toFixed(1) : 0}% মোট খরচের
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <DashboardCharts expenseData={expenseData} />
            </div>
          </div>
        )}

        {/* Create Tender Button */}
        {(profile.role === "owner" || profile.role === "admin") && (
          <div className="mb-6 sm:mb-8">
            <Link href="/admin/tenders/create">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all">
                + নতুন টেন্ডার তৈরি করুন
              </Button>
            </Link>
          </div>
        )}

        {/* Tenders List */}
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">আপনার টেন্ডার সমূহ</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {tenders.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">কোনো টেন্ডার পাওয়া যায়নি</p>
                <p className="text-sm text-gray-400 mt-2">নতুন টেন্ডার যুক্ত করুন</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenders.map((tender: any) => (
                  <Link
                    key={tender.id}
                    href={`/tender/${tender.id}`}
                    className="group relative bg-white border-2 border-slate-200 rounded-xl p-4 sm:p-5 hover:border-blue-400 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                          {tender.project_name}
                        </h3>
                        <p className="text-xs font-mono text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded">
                          {tender.tender_code}
                        </p>
                      </div>
                    </div>
                    
                    {tender.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{tender.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          tender.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tender.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </span>
                      <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
