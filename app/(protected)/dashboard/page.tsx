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
    { name: "Labor", value: laborTotal, color: "#3b82f6" },
    { name: "Materials", value: materialsTotal, color: "#10b981" },
    { name: "Activities", value: activitiesTotal, color: "#f59e0b" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Dashboard
              </h1>
              <p className="text-xs text-gray-500">{profile.full_name}</p>
            </div>
            <form action="/api/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total tenders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active tenders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTenders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{profile.role}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total expenses (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalExpenses)}
              </div>
            </CardContent>
          </Card>
        </div>

        {totalExpenses > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <DashboardCharts expenseData={expenseData} />
          </div>
        )}

        {(profile.role === "owner" || profile.role === "admin") && (
          <div className="mb-8">
            <Link href="/admin/tenders/create">
              <Button>Create new tender</Button>
            </Link>
          </div>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your tenders</CardTitle>
          </CardHeader>
          <CardContent>
            {tenders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tenders found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenders.map((tender: any) => (
                  <Link
                    key={tender.id}
                    href={`/tender/${tender.id}`}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {tender.project_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tender.tender_code}
                        </p>
                        {tender.location && (
                          <p className="text-xs text-gray-500 mt-1">
                            {tender.location}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          tender.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tender.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Docs</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/docs" className="text-blue-600 hover:text-blue-800">
                Open documentation
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href="https://supabase.com/dashboard/project/qrnbpeowkkinjfksxavz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                Supabase dashboard
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href="/settings/profile"
                className="text-blue-600 hover:text-blue-800"
              >
                Manage profile
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
