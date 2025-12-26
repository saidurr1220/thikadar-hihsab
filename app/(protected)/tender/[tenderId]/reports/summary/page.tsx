"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useEffect, useState } from "react";
import { Printer, Share2 } from "lucide-react";

function PrintButtons() {
  const [showMenu, setShowMenu] = useState(false);

  const handlePrint = () => {
    window.print();
    setShowMenu(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'টেন্ডার সারসংক্ষেপ',
          text: 'টেন্ডার রিপোর্ট দেখুন',
          url: url,
        });
      } catch (err) {
        copyLink(url);
      }
    } else {
      copyLink(url);
    }
    setShowMenu(false);
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('লিংক কপি হয়েছে!');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
      >
        <Printer className="w-4 h-4" />
        <span>প্রিন্ট/শেয়ার</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-xl z-50 min-w-[200px]">
          <button
            onClick={handlePrint}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 border-b"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট/PDF সেভ</span>
          </button>
          <button
            onClick={handleShare}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3"
          >
            <Share2 className="w-4 h-4" />
            <span>লিংক শেয়ার করুন</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function TenderSummaryPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [tender, setTender] = useState<any>(null);
  const [labor, setLabor] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [vendorPurchases, setVendorPurchases] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [rollupExpenses, setRollupExpenses] = useState<any[]>([]);
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

      // Load vendor purchases
      const { data: vendorPurchasesData } = await supabase
        .from("vendor_purchases")
        .select("*, vendors(name)")
        .eq("tender_id", params.tenderId);
      setVendorPurchases(vendorPurchasesData || []);

      const { data: activitiesData } = await supabase
        .from("activity_expenses")
        .select(
          "*, activity_categories!activity_expenses_category_id_fkey(name_bn)"
        )
        .eq("tender_id", params.tenderId);
      setActivities(activitiesData || []);

      const { data: advancesData } = await supabase
        .from("person_advances")
        .select("*")
        .eq("tender_id", params.tenderId);
      setAdvances(advancesData || []);

      const { data: expensesData } = await supabase
        .from("person_expenses")
        .select("*")
        .eq("tender_id", params.tenderId);
      setExpenses(expensesData || []);

      // Load rollup expenses (person_expenses + MFS charges)
      const { data: rollupData } = await supabase
        .from("expense_rollup")
        .select("amount, source_type")
        .eq("tender_id", params.tenderId);
      setRollupExpenses(rollupData || []);

      // Person balances - Calculate manually instead of using RPC
      const { data: personAdvancesData } = await supabase
        .from("person_advances")
        .select(`
          *,
          user:profiles!person_advances_user_id_fkey (full_name),
          person:persons!person_advances_person_id_fkey (full_name, role)
        `)
        .eq("tender_id", params.tenderId);

      const { data: personExpensesData } = await supabase
        .from("person_expenses")
        .select(`
          *,
          user:profiles!person_expenses_user_id_fkey (full_name),
          person:persons!person_expenses_person_id_fkey (full_name, role)
        `)
        .eq("tender_id", params.tenderId);

      // Calculate person-wise summary manually
      const personBalanceMap = new Map();
      
      personAdvancesData?.forEach((adv: any) => {
        const personId = adv.user_id || adv.person_id;
        const personName = adv.user?.full_name || adv.person?.full_name || "Unknown";
        const role = adv.person?.role || "staff";
        
        if (!personBalanceMap.has(personId)) {
          personBalanceMap.set(personId, {
            person_id: personId,
            person_name: personName,
            role: role,
            total_advances: 0,
            total_expenses: 0,
            balance: 0
          });
        }
        
        const balance = personBalanceMap.get(personId);
        balance.total_advances += Number(adv.amount || 0);
        balance.balance += Number(adv.amount || 0);
      });

      personExpensesData?.forEach((exp: any) => {
        const personId = exp.user_id || exp.person_id;
        const personName = exp.user?.full_name || exp.person?.full_name || "Unknown";
        const role = exp.person?.role || "staff";
        
        if (!personBalanceMap.has(personId)) {
          personBalanceMap.set(personId, {
            person_id: personId,
            person_name: personName,
            role: role,
            total_advances: 0,
            total_expenses: 0,
            balance: 0
          });
        }
        
        const balance = personBalanceMap.get(personId);
        balance.total_expenses += Number(exp.amount || 0);
        balance.balance -= Number(exp.amount || 0);
      });

      const calculatedBalances = Array.from(personBalanceMap.values());
      console.log("Calculated balances:", calculatedBalances);
      
      setBalances(calculatedBalances);
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
  const vendorTotal =
    vendorPurchases?.reduce((sum, v) => sum + Number(v.total_cost || 0), 0) ||
    0;
  const totalMaterials = materialsTotal + vendorTotal;
  const activitiesTotal =
    activities?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;
  const advancesTotal =
    advances?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;
  const expensesTotal =
    expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

  // Calculate rollup expenses (person_expenses + MFS charges, excluding vendor_purchase)
  const rollupTotal =
    rollupExpenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
  const vendorRollupTotal =
    rollupExpenses
      ?.filter((e) => e.source_type === "vendor_purchase")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
  const otherExpensesTotal = rollupTotal - vendorRollupTotal;

  const grandTotal =
    laborTotal + totalMaterials + activitiesTotal + otherExpensesTotal;
  const pendingAdvances = advancesTotal - expensesTotal;

  // Top materials (including vendor purchases)
  const materialsByItem = materials?.reduce((acc: any, m) => {
    const name = m.materials?.name_bn || m.custom_item_name;
    if (!acc[name]) {
      acc[name] = { name, quantity: 0, unit: m.unit, total: 0 };
    }
    acc[name].quantity += Number(m.quantity || 0);
    acc[name].total += Number(m.total_amount || 0);
    return acc;
  }, {});

  // Add vendor purchases to materials
  vendorPurchases?.forEach((v) => {
    const name = v.item_name || "ভেন্ডর ক্রয়";
    if (!materialsByItem[name]) {
      materialsByItem[name] = {
        name,
        quantity: 0,
        unit: v.unit || "",
        total: 0,
      };
    }
    if (v.quantity) {
      materialsByItem[name].quantity += Number(v.quantity || 0);
    }
    materialsByItem[name].total += Number(v.total_cost || 0);
  });

  const topMaterials = Object.values(materialsByItem || {})
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 5);

  // Top activities by category
  const activitiesByCategory = activities?.reduce((acc: any, a) => {
    const cat = a.activity_categories?.name_bn || "অন্যান্য";
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += Number(a.amount || 0);
    return acc;
  }, {});

  const topActivities = Object.entries(activitiesByCategory || {})
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5);

  const laborPercent = grandTotal > 0 ? (laborTotal / grandTotal) * 100 : 0;
  const materialsPercent =
    grandTotal > 0 ? (totalMaterials / grandTotal) * 100 : 0;
  const activitiesPercent =
    grandTotal > 0 ? (activitiesTotal / grandTotal) * 100 : 0;
  const otherPercent =
    grandTotal > 0 ? (otherExpensesTotal / grandTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between no-print">
          <Link
            href={`/tender/${params.tenderId}/reports`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← রিপোর্ট মেনু
          </Link>
          <PrintButtons />
        </div>

        <div className="print-content bg-white">
          {/* Professional Header - Shows on every page */}
          <div className="report-header">
            <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                মেসার্স সোনালী ট্রেডার্স
              </h1>
              <p className="text-sm text-gray-600 mb-1">
                ঠিকানাঃ ১৪৫, হোমনা সরকারি কলেজ রোড, হোমনা, কুমিল্লা।
              </p>
              <h2 className="text-xl font-semibold text-blue-700 mt-3">
                {labels.tenderSummary}
              </h2>
            </div>

            {/* Tender Information */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p>
                  <strong>টেন্ডার কোড:</strong> {tender?.tender_code}
                </p>
                <p>
                  <strong>প্রকল্পের নাম:</strong> {tender?.project_name}
                </p>
              </div>
              <div className="text-right">
                {tender?.location && (
                  <p>
                    <strong>স্থান:</strong> {tender.location}
                  </p>
                )}
                {tender?.start_date && (
                  <p>
                    <strong>শুরুর তারিখ:</strong>{" "}
                    {formatDate(tender.start_date)}
                  </p>
                )}
                <p>
                  <strong>রিপোর্টের তারিখ:</strong>{" "}
                  {formatDate(new Date().toISOString().split("T")[0])}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="mb-6 page-break-inside-avoid">
            <h3 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">
              আর্থিক সারসংক্ষেপ
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg text-center mb-4">
              <p className="text-4xl font-bold text-blue-700">
                {formatCurrency(grandTotal)}
              </p>
              <p className="text-gray-700 font-semibold">মোট খরচ</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left py-2">খাত</th>
                  <th className="text-right py-2">টাকা</th>
                  <th className="text-right py-2">শতাংশ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-semibold">শ্রমিক খরচ</td>
                  <td className="text-right py-2">
                    {formatCurrency(laborTotal)}
                  </td>
                  <td className="text-right py-2">
                    {laborPercent.toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold">মালামাল</td>
                  <td className="text-right py-2">
                    {formatCurrency(totalMaterials)}
                  </td>
                  <td className="text-right py-2">
                    {materialsPercent.toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-b pl-4">
                  <td className="py-1 pl-6 text-gray-600 text-xs">
                    - সাধারণ মালামাল
                  </td>
                  <td className="text-right py-1 text-gray-700">
                    {formatCurrency(materialsTotal)}
                  </td>
                  <td></td>
                </tr>
                <tr className="border-b">
                  <td className="py-1 pl-6 text-gray-600 text-xs">
                    - ভেন্ডর ক্রয়
                  </td>
                  <td className="text-right py-1 text-gray-700">
                    {formatCurrency(vendorTotal)}
                  </td>
                  <td></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold">কাজের খরচ</td>
                  <td className="text-right py-2">
                    {formatCurrency(activitiesTotal)}
                  </td>
                  <td className="text-right py-2">
                    {activitiesPercent.toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-semibold">অন্যান্য খরচ</td>
                  <td className="text-right py-2">
                    {formatCurrency(otherExpensesTotal)}
                  </td>
                  <td className="text-right py-2">
                    {otherPercent.toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-t-2 border-gray-800 font-bold">
                  <td className="py-3">সর্বমোট</td>
                  <td className="text-right py-3 text-lg">
                    {formatCurrency(grandTotal)}
                  </td>
                  <td className="text-right py-3">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

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

          {/* Person-wise Advances & Expenses */}
          <div className="mb-6 page-break-inside-avoid">
            <h3 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">
              ব্যক্তিভিত্তিক অগ্রিম ও খরচ হিসাব
            </h3>
            {balances && balances.length > 0 ? (
              <>
                <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="text-left py-2 px-2">ব্যক্তি</th>
                    <th className="text-left py-2 px-2">পদবি</th>
                    <th className="text-right py-2 px-2">অগ্রিম প্রদান</th>
                    <th className="text-right py-2 px-2">খরচ জমা</th>
                    <th className="text-right py-2 px-2">ব্যালেন্স</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((bal: any) => (
                    <tr key={bal.person_id} className="border-b">
                      <td className="py-2 px-2 font-medium">
                        {bal.person_name}
                      </td>
                      <td className="py-2 px-2 text-gray-600">{bal.role}</td>
                      <td className="text-right py-2 px-2">
                        {formatCurrency(bal.total_advances)}
                      </td>
                      <td className="text-right py-2 px-2">
                        {formatCurrency(bal.total_expenses)}
                      </td>
                      <td
                        className={`text-right py-2 px-2 font-semibold ${
                          bal.balance > 0
                            ? "text-green-700"
                            : bal.balance < 0
                            ? "text-red-700"
                            : ""
                        }`}
                      >
                        {bal.balance >= 0
                          ? formatCurrency(bal.balance)
                          : `(${formatCurrency(Math.abs(bal.balance))})`}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-800 font-bold">
                    <td colSpan={2} className="py-3 px-2">
                      সর্বমোট
                    </td>
                    <td className="text-right py-3 px-2">
                      {formatCurrency(advancesTotal)}
                    </td>
                    <td className="text-right py-3 px-2">
                      {formatCurrency(expensesTotal)}
                    </td>
                    <td
                      className={`text-right py-3 px-2 text-lg ${
                        pendingAdvances > 0 ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {formatCurrency(Math.abs(pendingAdvances))}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-3 p-3 bg-gray-50 border border-gray-300 rounded text-xs">
                <p>
                  <strong>নোট:</strong>
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>সবুজ = ব্যক্তির কাছে টাকা বাকি আছে</li>
                  <li>লাল (বন্ধনীতে) = ব্যক্তি বেশি খরচ করেছে</li>
                </ul>
              </div>
              </>
            ) : (
              <p className="text-gray-600 text-sm py-4">কোনো ব্যক্তিভিত্তিক তথ্য পাওয়া যায়নি।</p>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-content {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 15mm 12mm;
          }
          
          /* Page header - shows on every page */
          .report-header {
            display: block;
          }
          
          /* Page breaks */
          .page-break-before {
            page-break-before: always;
            padding-top: 20px;
          }
          
          .page-break-after {
            page-break-after: always;
          }
          
          /* Control page breaks - allow breaks when needed */
          .page-break-before {
            page-break-before: always;
          }
          
          /* Keep table headers with content */
          thead {
            display: table-header-group;
          }
          
          tbody {
            display: table-row-group;
          }
          
          /* Prevent orphaned rows */
          tr {
            page-break-inside: avoid;
          }
          
          /* Table styling for print */
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          th {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Ensure colors print */
          .text-green-700, .text-green-600 {
            color: #15803d !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .text-red-700, .text-red-600 {
            color: #b91c1c !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .bg-blue-50, .bg-gray-50 {
            background-color: #f8f9fa !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Font sizes for readability */
          body {
            font-size: 11pt;
            line-height: 1.4;
          }
          
          h1 {
            font-size: 18pt;
          }
          
          h2 {
            font-size: 14pt;
          }
          
          h3 {
            font-size: 12pt;
          }
        }
      `}</style>
    </div>
  );
}
