"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils/format";

type PersonInfo = {
  name: string;
  role: string | null;
  isUser: boolean;
};

export default function PersonAdvanceLedgerPage({
  params,
}: {
  params: { tenderId: string; personId: string };
}) {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<PersonInfo | null>(null);
  const [advances, setAdvances] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [advanceForm, setAdvanceForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    method: "cash",
    ref: "",
    purpose: "",
    notes: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    notes: "",
  });

  const totals = useMemo(() => {
    const totalAdvances =
      advances.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;
    const totalExpenses =
      expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
    return { totalAdvances, totalExpenses, balance: totalAdvances - totalExpenses };
  }, [advances, expenses]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError("");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", params.personId)
      .maybeSingle();

    const { data: personRow } = await supabase
      .from("persons")
      .select("full_name, role")
      .eq("id", params.personId)
      .maybeSingle();

    const { data: assignment } = await supabase
      .from("tender_assignments")
      .select("role")
      .eq("tender_id", params.tenderId)
      .or(`user_id.eq.${params.personId},person_id.eq.${params.personId}`)
      .maybeSingle();

    const isUser = !!profile;
    setPerson({
      name: profile?.full_name || personRow?.full_name || "Unknown",
      role: assignment?.role || null,
      isUser,
    });

    const { data: advanceData, error: advanceError } = await supabase
      .from("person_advances")
      .select("*")
      .eq("tender_id", params.tenderId)
      .or(`user_id.eq.${params.personId},person_id.eq.${params.personId}`)
      .order("advance_date", { ascending: false });

    if (advanceError) {
      setError(advanceError.message);
    }

    const { data: expenseData, error: expenseError } = await supabase
      .from("person_expenses")
      .select("*")
      .eq("tender_id", params.tenderId)
      .or(`user_id.eq.${params.personId},person_id.eq.${params.personId}`)
      .order("expense_date", { ascending: false });

    if (expenseError) {
      setError(expenseError.message);
    }

    setAdvances(advanceData || []);
    setExpenses(expenseData || []);
    setLoading(false);
  };

  const submitAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    const payload = {
      tender_id: params.tenderId,
      advance_date: advanceForm.date,
      amount: parseFloat(advanceForm.amount || "0"),
      payment_method: advanceForm.method as any,
      payment_ref: advanceForm.ref || null,
      purpose: advanceForm.purpose || null,
      notes: advanceForm.notes || null,
      created_by: userId,
      user_id: person.isUser ? params.personId : null,
      person_id: person.isUser ? null : params.personId,
    };

    const { error: insertError } = await supabase
      .from("person_advances")
      .insert(payload);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setAdvanceForm((prev) => ({
      ...prev,
      amount: "",
      ref: "",
      purpose: "",
      notes: "",
    }));
    loadAll();
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    const payload = {
      tender_id: params.tenderId,
      expense_date: expenseForm.date,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount || "0"),
      notes: expenseForm.notes || null,
      created_by: userId,
      user_id: person.isUser ? params.personId : null,
      person_id: person.isUser ? null : params.personId,
    };

    const { error: insertError } = await supabase
      .from("person_expenses")
      .insert(payload);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setExpenseForm((prev) => ({
      ...prev,
      amount: "",
      description: "",
      notes: "",
    }));
    loadAll();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}/advances/people`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Staff advances
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{person?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{person?.role || "-"}</p>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
              <p className="text-gray-500">Total advances</p>
                  <p className="font-semibold">
                    {formatCurrency(totals.totalAdvances)}
                  </p>
                </div>
                <div>
              <p className="text-gray-500">Total expenses</p>
                  <p className="font-semibold">
                    {formatCurrency(totals.totalExpenses)}
                  </p>
                </div>
                <div>
              <p className="text-gray-500">Balance</p>
                  <p
                    className={`font-semibold ${
                      totals.balance > 0
                        ? "text-green-600"
                        : totals.balance < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {formatCurrency(Math.abs(totals.balance))}
                  </p>
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600 mt-3">{error}</p>
              )}
            </CardContent>
          </Card>

          <Card className="w-full lg:w-80">
            <CardHeader>
            <CardTitle className="text-base">Quick entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={submitAdvance} className="space-y-2">
                <h4 className="font-semibold text-sm">Give advance</h4>
                <Input
                  type="date"
                  value={advanceForm.date}
                  onChange={(e) =>
                    setAdvanceForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={advanceForm.amount}
                  onChange={(e) =>
                    setAdvanceForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  required
                />
                <select
                  className="w-full h-10 border rounded-md px-3 text-sm"
                  value={advanceForm.method}
                  onChange={(e) =>
                    setAdvanceForm((p) => ({ ...p, method: e.target.value }))
                  }
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="mfs">MFS</option>
                </select>
                <Input
                  placeholder="Reference"
                  value={advanceForm.ref}
                  onChange={(e) =>
                    setAdvanceForm((p) => ({ ...p, ref: e.target.value }))
                  }
                />
                <Input
                  placeholder="Purpose"
                  value={advanceForm.purpose}
                  onChange={(e) =>
                    setAdvanceForm((p) => ({ ...p, purpose: e.target.value }))
                  }
                />
                <Button type="submit" className="w-full">
                  Add advance
                </Button>
              </form>

              <form onSubmit={submitExpense} className="space-y-2">
                <h4 className="font-semibold text-sm">Add expense</h4>
                <Input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  required
                />
                <Input
                  placeholder="Description"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  required
                />
                <Button type="submit" variant="outline" className="w-full">
                  Add expense
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Advances</CardTitle>
            </CardHeader>
            <CardContent>
              {advances.length === 0 ? (
                <p className="text-gray-500 text-sm">No advances yet</p>
              ) : (
                <div className="space-y-3">
                  {advances.map((a) => (
                    <div
                      key={a.id}
                      className="border rounded-lg p-3 bg-white"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold">
                            {formatDate(a.advance_date)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {a.purpose || "Advance"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {a.payment_method}
                          </p>
                        </div>
                        <p className="font-bold text-green-600">
                          {formatCurrency(a.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-gray-500 text-sm">No expenses yet</p>
              ) : (
                <div className="space-y-3">
                  {expenses.map((e) => (
                    <div
                      key={e.id}
                      className="border rounded-lg p-3 bg-white"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold">
                            {formatDate(e.expense_date)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {e.description}
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
    </div>
  );
}
