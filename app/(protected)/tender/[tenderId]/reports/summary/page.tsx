"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useEffect, useState } from "react";

export default function TenderSummaryPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [tender, setTender] = useState<any>(null);
  const [labor, setLabor] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Load tender info
      const { data: tenderData } = await supabase
        .from("tenders")
        .select("*")
        .eq("id", params.tenderId)
        .single();
      setTender(tenderData);

      // Load all data
      const { data: laborData } = await supabase
        .from("labor_entries")
        .select("*")
        .eq("tender_id", params.tenderId);
      setLabor(laborData || []);

      const { data: materialsData } = await supabase
        .from("material_purchases")
        .select("*, materials(name_bn)")
        .eq("tender_id", params.tenderId);
      setMaterials(materialsData || []);

      const { data: activitiesData } = await supabase
        .from("activity_expenses")
        .select("*, expense_categories(name_bn)")
        .eq("tender_id", params.tenderId);
      setActivities(activitiesData || []);

      const { data: advancesData } = await supabase
        .from("advances")
        .select("*")
        .eq("tender_id", params.tenderId);
      setAdvances(advancesData || []);

      const { data: expensesData } = await supabase
        .from("expense_submissions")
        .select("*")
        .eq("tender_id", params.tenderId)
        .eq("status", "approved");
      setExpenses(expensesData || []);

      // Person balances
      const { data: balancesData } = await supabase.rpc("get_person_balances", {
        p_tender_id: params.tenderId,
      });
      setBalances(balancesData || []);

      setLoading(false);
    };

    loadData();
  }, [params.tenderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">লোড হচ্ছে...</div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const laborTotal =
    labor?.reduce(
      (sum, l) =>
        sum + Number(l.khoraki_total || 0) + Number(l.wage_total || 0),
      0
    ) || 0;
  const materialsTotal =
    materials?.reduce((sum, m) => sum + Number(m.total_amount || 0), 0) || 0;
  const activitiesTotal =
    activities?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;
  const advancesTotal =
    advances?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;
  const expensesTotal =
    expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

  const grandTotal = laborTotal + materialsTotal + activitiesTotal;
  const pendingAdvances = advancesTotal - expensesTotal;

  // Top materials
  const materialsByItem = materials?.reduce((acc: any, m) => {
    const name = m.materials?.name_bn || m.custom_item_name;
    if (!acc[name]) {
      acc[name] = { name, quantity: 0, unit: m.unit, total: 0 };
    }
    acc[name].quantity += Number(m.quantity || 0);
    acc[name].total += Number(m.total_amount || 0);
    return acc;
  }, {});

  const topMaterials = Object.values(materialsByItem || {})
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);

  // Top activities by category
  const activitiesByCategory = activities?.reduce((acc: any, a) => {
    const cat = a.expense_categories?.name_bn || "অন্যান্য";
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += Number(a.amount || 0);
    return acc;
  }, {});

  const topActivities = Object.entries(activitiesByCategory || {})
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5);

  const laborPercent = grandTotal > 0 ? (laborTotal / grandTotal) * 100 : 0;
  const materialsPercent =
    grandTotal > 0 ? (materialsTotal / grandTotal) * 100 : 0;
  const activitiesPercent =
    grandTotal > 0 ? (activitiesTotal / grandTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 no-print">
          <Link
            href={`/tender/${params.tenderId}/reports`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← রিপোর্ট মেনু
          </Link>
        </div>

        <div className="print-content">
          {/* Header */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">থিকাদারি হিসাব</h1>
            <h2 className="text-xl font-semibold mb-4">
              {labels.tenderSummary}
            </h2>
            <div className="text-sm space-y-1">
              <p>
                <strong>টেন্ডার কোড:</strong> {tender?.tender_code}
              </p>
              <p>
                <strong>প্রকল্পের নাম:</strong> {tender?.project_name}
              </p>
              {tender?.location && (
                <p>
                  <strong>স্থান:</strong> {tender.location}
                </p>
              )}
              {tender?.start_date && (
                <p>
                  <strong>শুরুর তারিখ:</strong> {formatDate(tender.start_date)}
                </p>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>আর্থিক সারসংক্ষেপ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(grandTotal)}
                </p>
                <p className="text-gray-600">মোট খরচ</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span>শ্রমিক খরচ:</span>
                  <div className="text-right">
                    <span className="font-semibold">
                      {formatCurrency(laborTotal)}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({laborPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span>মালামাল:</span>
                  <div className="text-right">
                    <span className="font-semibold">
                      {formatCurrency(materialsTotal)}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({materialsPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span>কাজের খরচ:</span>
                  <div className="text-right">
                    <span className="font-semibold">
                      {formatCurrency(activitiesTotal)}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({activitiesPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t-2">
                <div className="flex justify-between items-center py-2">
                  <span>অগ্রিম প্রদান:</span>
                  <span className="font-semibold">
                    {formatCurrency(advancesTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>খরচ জমা:</span>
                  <span className="font-semibold">
                    {formatCurrency(expensesTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 text-lg font-bold">
                  <span>বাকি অগ্রিম:</span>
                  <span className="text-green-600">
                    {formatCurrency(pendingAdvances)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Materials */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>শীর্ষ ৫ মালামাল</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">মালামাল</th>
                    <th className="text-right py-2">পরিমাণ</th>
                    <th className="text-right py-2">মোট খরচ</th>
                  </tr>
                </thead>
                <tbody>
                  {topMaterials.map((m: any, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">{m.name}</td>
                      <td className="text-right py-2">
                        {m.quantity} {m.unit}
                      </td>
                      <td className="text-right py-2 font-semibold">
                        {formatCurrency(m.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Top Activities */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>শীর্ষ ৫ কাজের খরচ</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">বিভাগ</th>
                    <th className="text-right py-2">মোট খরচ</th>
                  </tr>
                </thead>
                <tbody>
                  {topActivities.map(([cat, amt]: any, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">{cat}</td>
                      <td className="text-right py-2 font-semibold">
                        {formatCurrency(amt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Person Balances */}
          {balances && balances.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>ব্যক্তিভিত্তিক ব্যালেন্স</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">ব্যক্তি</th>
                      <th className="text-left py-2">ভূমিকা</th>
                      <th className="text-right py-2">অগ্রিম</th>
                      <th className="text-right py-2">খরচ</th>
                      <th className="text-right py-2">ব্যালেন্স</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((bal: any) => (
                      <tr key={bal.person_id} className="border-b">
                        <td className="py-2">{bal.person_name}</td>
                        <td className="py-2">{bal.role}</td>
                        <td className="text-right py-2">
                          {formatCurrency(bal.total_advances)}
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(bal.total_expenses)}
                        </td>
                        <td
                          className={`text-right py-2 font-semibold ${
                            bal.balance > 0
                              ? "text-green-600"
                              : bal.balance < 0
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          {formatCurrency(Math.abs(bal.balance))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-content {
            padding: 20px;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}
