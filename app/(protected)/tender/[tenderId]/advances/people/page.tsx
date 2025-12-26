import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function PeopleAdvanceHubPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  // Get all person advances for this tender
  const { data: personAdvances } = await supabase
    .from("person_advances")
    .select(`
      *,
      person:persons!person_advances_person_id_fkey (id, full_name, role)
    `)
    .eq("tender_id", params.tenderId)
    .order("advance_date", { ascending: false });

  // Get all person expenses for this tender
  const { data: personExpenses } = await supabase
    .from("person_expenses")
    .select(`
      *,
      person:persons!person_expenses_person_id_fkey (id, full_name, role)
    `)
    .eq("tender_id", params.tenderId);

  // Calculate balances per person
  const balanceMap = new Map();

  personAdvances?.forEach((adv: any) => {
    const personId = adv.person_id;
    const personName = adv.person?.full_name || "Unknown";
    const role = adv.person?.role || "";
    
    if (!balanceMap.has(personId)) {
      balanceMap.set(personId, {
        person_id: personId,
        person_name: personName,
        role: role,
        total_advances: 0,
        total_expenses: 0,
        balance: 0,
      });
    }
    
    const balance = balanceMap.get(personId);
    balance.total_advances += Number(adv.amount || 0);
    balance.balance += Number(adv.amount || 0);
  });

  personExpenses?.forEach((exp: any) => {
    const personId = exp.person_id;
    const personName = exp.person?.full_name || "Unknown";
    const role = exp.person?.role || "";
    
    if (!balanceMap.has(personId)) {
      balanceMap.set(personId, {
        person_id: personId,
        person_name: personName,
        role: role,
        total_advances: 0,
        total_expenses: 0,
        balance: 0,
      });
    }
    
    const balance = balanceMap.get(personId);
    balance.total_expenses += Number(exp.amount || 0);
    balance.balance -= Number(exp.amount || 0);
  });

  const balances = Array.from(balanceMap.values());

  const totalAdvances =
    balances?.reduce(
      (sum: number, b: any) => sum + Number(b.total_advances || 0),
      0
    ) || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href={`/tender/${params.tenderId}`}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Tender dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              Staff Advances
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Advance and expense ledger by person
            </p>
          </div>
          <Link href={`/tender/${params.tenderId}/advances/give`}>
            <Button>+ Give advance</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total advances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalAdvances)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total people
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balances?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Each person has a split view for advances and expenses.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>People</CardTitle>
          </CardHeader>
          <CardContent>
            {!balances || balances.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No people yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {balances.map((bal: any) => (
                  <Link
                    key={bal.person_id}
                    href={`/tender/${params.tenderId}/advances/people/${bal.person_id}`}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">
                          {bal.person_name}
                        </p>
                        <p className="text-sm text-gray-600">{bal.role}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            bal.balance > 0
                              ? "text-green-600"
                              : bal.balance < 0
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {formatCurrency(Math.abs(bal.balance))}
                        </p>
                        <p className="text-xs text-gray-500">
                          {bal.balance > 0
                            ? "Advance due"
                            : bal.balance < 0
                            ? "Overpaid"
                            : "Settled"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
