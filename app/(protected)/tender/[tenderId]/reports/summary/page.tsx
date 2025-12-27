"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
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
          title: "টেন্ডার সারসংক্ষেপ",
          text: "টেন্ডার রিপোর্ট দেখুন",
          url,
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
    alert("লিংক কপি হয়েছে!");
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

      const { data: tenderData } = await supabase
        .from("tenders")
        .select("*")
        .eq("id", params.tenderId)
        .single();
      setTender(tenderData);

      const { data: laborData } = await supabase
        .from("labor_entries")
        .select("*")
        .eq("tender_id", params.tenderId)
        .order("entry_date", { ascending: false });
      setLabor(laborData || []);

      const { data: materialsData } = await supabase
        .from("material_purchases")
        .select("*, materials(name_bn), vendors(name)")
        .eq("tender_id", params.tenderId)
        .order("purchase_date", { ascending: false });
      setMaterials(materialsData || []);

      const { data: vendorPurchasesData } = await supabase
        .from("vendor_purchases")
        .select("*, vendors(name)")
        .eq("tender_id", params.tenderId)
        .order("purchase_date", { ascending: false });
      setVendorPurchases(vendorPurchasesData || []);

      const { data: activitiesData } = await supabase
        .from("activity_expenses")
        .select(
          "*, activity_categories!activity_expenses_category_id_fkey(name_bn)"
        )
        .eq("tender_id", params.tenderId)
        .order("expense_date", { ascending: false });
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

      const { data: rollupData } = await supabase
        .from("expense_rollup")
        .select("amount, source_type")
        .eq("tender_id", params.tenderId);
      setRollupExpenses(rollupData || []);

      const { data: personAdvancesData } = await supabase
        .from("person_advances")
        .select(
          `
          *,
          user:profiles!person_advances_user_id_fkey (full_name),
          person:persons!person_advances_person_id_fkey (full_name, role)
        `
        )
        .eq("tender_id", params.tenderId);

      const { data: personExpensesData } = await supabase
        .from("person_expenses")
        .select(
          `
          *,
          user:profiles!person_expenses_user_id_fkey (full_name),
          person:persons!person_expenses_person_id_fkey (full_name, role)
        `
        )
        .eq("tender_id", params.tenderId);

      const personBalanceMap = new Map();

      personAdvancesData?.forEach((adv: any) => {
        const personId = adv.user_id || adv.person_id;
        const personName =
          adv.user?.full_name || adv.person?.full_name || "অজানা";
        const role = adv.person?.role || "staff";

        if (!personBalanceMap.has(personId)) {
          personBalanceMap.set(personId, {
            person_id: personId,
            person_name: personName,
            role,
            total_advances: 0,
            total_expenses: 0,
            balance: 0,
          });
        }

        const balance = personBalanceMap.get(personId);
        balance.total_advances += Number(adv.amount || 0);
        balance.balance += Number(adv.amount || 0);
      });

      personExpensesData?.forEach((exp: any) => {
        const personId = exp.user_id || exp.person_id;
        const personName =
          exp.user?.full_name || exp.person?.full_name || "অজানা";
        const role = exp.person?.role || "staff";

        if (!personBalanceMap.has(personId)) {
          personBalanceMap.set(personId, {
            person_id: personId,
            person_name: personName,
            role,
            total_advances: 0,
            total_expenses: 0,
            balance: 0,
          });
        }

        const balance = personBalanceMap.get(personId);
        balance.total_expenses += Number(exp.amount || 0);
        balance.balance -= Number(exp.amount || 0);
      });

      const calculatedBalances = Array.from(personBalanceMap.values());

      setBalances(calculatedBalances);
      setLoading(false);
    };

    loadData();
  }, [params.tenderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">লোড হচ্ছে...</div>
        </div>
      </div>
    );
  }

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

  const vendorsByName: Record<
    string,
    {
      name: string;
      total: number;
      items: Record<
        string,
        { item: string; quantity: number; unit: string; amount: number }
      >;
    }
  > = {};

  const addVendorItem = (
    vendorName: string,
    itemName: string,
    quantity: number,
    unit: string,
    amount: number
  ) => {
    const safeVendor = vendorName || "অজানা ভেন্ডার";
    const safeItem = itemName || "অজানা মালামাল";
    if (!vendorsByName[safeVendor]) {
      vendorsByName[safeVendor] = { name: safeVendor, total: 0, items: {} };
    }
    const key = `${safeItem}__${unit || ""}`;
    if (!vendorsByName[safeVendor].items[key]) {
      vendorsByName[safeVendor].items[key] = {
        item: safeItem,
        quantity: 0,
        unit: unit || "",
        amount: 0,
      };
    }
    const entry = vendorsByName[safeVendor].items[key];
    entry.quantity += Number(quantity || 0);
    entry.amount += Number(amount || 0);
    vendorsByName[safeVendor].total += Number(amount || 0);
  };

  materials?.forEach((m) => {
    const vendorName = m.vendors?.name || m.supplier || "অজানা ভেন্ডার";
    const itemName =
      m.materials?.name_bn || m.custom_item_name || "অজানা মালামাল";
    addVendorItem(
      vendorName,
      itemName,
      Number(m.quantity || 0),
      m.unit || "",
      Number(m.total_amount || 0)
    );
  });

  vendorPurchases?.forEach((v) => {
    const vendorName = v.vendors?.name || "অজানা ভেন্ডার";
    addVendorItem(
      vendorName,
      v.item_name || "অজানা মালামাল",
      Number(v.quantity || 0),
      v.unit || "",
      Number(v.total_cost || 0)
    );
  });

  const activityTotals = activities?.reduce((acc: any, a) => {
    const cat = a.activity_categories?.name_bn || "অন্যান্য";
    if (!acc[cat]) {
      acc[cat] = 0;
    }
    acc[cat] += Number(a.amount || 0);
    return acc;
  }, {});

  const sortedVendors = Object.values(vendorsByName || {})
    .map((vendor: any) => ({
      ...vendor,
      items: Object.values(vendor.items || {}).sort(
        (a: any, b: any) => b.amount - a.amount
      ),
    }))
    .sort((a: any, b: any) => b.total - a.total);

  const sortedActivities = Object.entries(activityTotals || {})
    .map(([category, total]) => ({
      category,
      total: Number(total || 0),
    }))
    .sort((a, b) => b.total - a.total);

  const sortedBalances = [...(balances || [])].sort(
    (a, b) => Number(b.total_advances || 0) - Number(a.total_advances || 0)
  );

  const maxVendors = 8;
  const maxVendorItems = 4;
  const maxActivities = 6;
  const maxBalances = 8;

  const visibleVendors = sortedVendors.slice(0, maxVendors);
  const visibleActivities = sortedActivities.slice(0, maxActivities);
  const visibleBalances = sortedBalances.slice(0, maxBalances);

  const laborPercent = grandTotal > 0 ? (laborTotal / grandTotal) * 100 : 0;
  const materialsPercent =
    grandTotal > 0 ? (totalMaterials / grandTotal) * 100 : 0;
  const activitiesPercent =
    grandTotal > 0 ? (activitiesTotal / grandTotal) * 100 : 0;
  const otherPercent =
    grandTotal > 0 ? (otherExpensesTotal / grandTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between no-print">
          <Link
            href={`/tender/${params.tenderId}/reports`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm"
          >
            ← রিপোর্ট মেনু
          </Link>
          <PrintButtons />
        </div>

        <div className="print-content bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="report-header px-6 py-4 border-b border-slate-200">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    মেসার্স সোনালী ট্রেডার্স
                  </h1>
                  <p className="text-sm text-slate-600">
                    ঠিকানাঃ ১৪৫, হোমনা সরকারি কলেজ রোড, হোমনা, কুমিল্লা।
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    টেন্ডার সারসংক্ষেপ
                  </p>
                </div>
                <div className="text-right text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">রিপোর্ট তারিখ:</span>{" "}
                    {formatDate(new Date().toISOString().split("T")[0])}
                  </p>
                  <p>
                    <span className="font-semibold">টেন্ডার কোড:</span>{" "}
                    {tender?.tender_code}
                  </p>
                </div>
              </div>
              <div className="text-sm text-slate-700">
                <p>
                  <span className="font-semibold">টেন্ডার:</span>{" "}
                  {tender?.project_name}
                </p>
                {tender?.location && (
                  <p>
                    <span className="font-semibold">স্থান:</span>{" "}
                    {tender.location}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="content-body p-6 space-y-6">
            <div className="summary-grid grid gap-4 lg:grid-cols-3">
              <div className="summary-total rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-600">মোট প্রকল্প খরচ</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {formatCurrency(grandTotal)}
                </p>
              </div>

              <div className="lg:col-span-2 rounded-lg border border-slate-200 p-4">
                <h3 className="section-title text-sm font-semibold text-slate-700 mb-2">
                  খরচের সারসংক্ষেপ
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="text-left py-2">খাত</th>
                      <th className="text-right py-2">টাকা</th>
                      <th className="text-right py-2">শতাংশ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-2">শ্রমিক</td>
                      <td className="text-right py-2">
                        {formatCurrency(laborTotal)}
                      </td>
                      <td className="text-right py-2">
                        {laborPercent.toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2">মালামাল</td>
                      <td className="text-right py-2">
                        {formatCurrency(totalMaterials)}
                      </td>
                      <td className="text-right py-2">
                        {materialsPercent.toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                      <td className="py-1 pl-4">- সরাসরি ক্রয়</td>
                      <td className="text-right py-1">
                        {formatCurrency(materialsTotal)}
                      </td>
                      <td></td>
                    </tr>
                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                      <td className="py-1 pl-4">- ভেন্ডার ক্রয়</td>
                      <td className="text-right py-1">
                        {formatCurrency(vendorTotal)}
                      </td>
                      <td></td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2">সাইট খরচ</td>
                      <td className="text-right py-2">
                        {formatCurrency(activitiesTotal)}
                      </td>
                      <td className="text-right py-2">
                        {activitiesPercent.toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2">অন্যান্য</td>
                      <td className="text-right py-2">
                        {formatCurrency(otherExpensesTotal)}
                      </td>
                      <td className="text-right py-2">
                        {otherPercent.toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="font-semibold">
                      <td className="pt-2">সর্বমোট</td>
                      <td className="text-right pt-2">
                        {formatCurrency(grandTotal)}
                      </td>
                      <td className="text-right pt-2">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="section">
              <h3 className="section-title text-sm font-semibold text-slate-700 mb-2">
                ভেন্ডার ভিত্তিক হিসাব
              </h3>
              <div className="vendor-table border border-slate-200 rounded-lg overflow-hidden">
                <div className="vendor-header grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-700">
                  <div className="col-span-3">ভেন্ডার</div>
                  <div className="col-span-7">আইটেম</div>
                  <div className="col-span-2 text-right">মোট</div>
                </div>
                {visibleVendors.length > 0 ? (
                  visibleVendors.map((v: any) => (
                    <div
                      key={v.name}
                      className="vendor-row grid grid-cols-12 gap-2 px-3 py-2 border-t border-slate-100"
                    >
                      <div className="col-span-3 text-sm font-medium text-slate-800">
                        {v.name}
                      </div>
                      <div className="col-span-7 text-xs text-slate-600">
                        <div className="space-y-1">
                          {v.items
                            .slice(0, maxVendorItems)
                            .map((item: any, i: number) => {
                              const quantityLabel =
                                item.quantity && item.unit
                                  ? ` (${item.quantity} ${item.unit})`
                                  : item.quantity
                                  ? ` (${item.quantity})`
                                  : "";
                              return (
                                <div key={i}>
                                  {item.item}
                                  {quantityLabel} -{" "}
                                  {formatCurrency(item.amount)}
                                </div>
                              );
                            })}
                          {v.items.length > maxVendorItems && (
                            <div className="text-[11px] text-slate-500">
                              ...এবং আরও {v.items.length - maxVendorItems}টি
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold text-slate-800">
                        {formatCurrency(v.total)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-slate-500">
                    কোনো ভেন্ডার তথ্য পাওয়া যায়নি।
                  </div>
                )}
              </div>
              {sortedVendors.length > maxVendors && (
                <p className="text-xs text-slate-500 mt-2">
                  ...এবং আরও {sortedVendors.length - maxVendors} জন ভেন্ডার
                </p>
              )}
            </div>

            <div className="section grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="section-title text-sm font-semibold text-slate-700 mb-2">
                  সাইট খরচ সারসংক্ষেপ
                </h3>
                {visibleActivities.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="text-left py-2">ক্যাটাগরি</th>
                        <th className="text-right py-2">মোট</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleActivities.map((a: any) => (
                        <tr
                          key={a.category}
                          className="border-b border-slate-100"
                        >
                          <td className="py-2">{a.category}</td>
                          <td className="text-right py-2">
                            {formatCurrency(a.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-slate-500">
                    কোনো তথ্য পাওয়া যায়নি।
                  </p>
                )}
                {sortedActivities.length > maxActivities && (
                  <p className="text-xs text-slate-500 mt-2">
                    ...এবং আরও {sortedActivities.length - maxActivities}টি
                    ক্যাটাগরি
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="section-title text-sm font-semibold text-slate-700 mb-2">
                  ব্যক্তিভিত্তিক হিসাব
                </h3>
                {visibleBalances.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="text-left py-2">ব্যক্তি</th>
                        <th className="text-right py-2">অগ্রিম</th>
                        <th className="text-right py-2">খরচ</th>
                        <th className="text-right py-2">ব্যালেন্স</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleBalances.map((bal: any) => (
                        <tr
                          key={bal.person_id}
                          className="border-b border-slate-100"
                        >
                          <td className="py-2 text-sm font-medium text-slate-800">
                            {bal.person_name}
                          </td>
                          <td className="text-right py-2">
                            {formatCurrency(bal.total_advances)}
                          </td>
                          <td className="text-right py-2">
                            {formatCurrency(bal.total_expenses)}
                          </td>
                          <td
                            className={`text-right py-2 font-semibold ${
                              bal.balance > 0
                                ? "text-green-700"
                                : bal.balance < 0
                                ? "text-red-700"
                                : "text-slate-700"
                            }`}
                          >
                            {bal.balance >= 0
                              ? formatCurrency(bal.balance)
                              : `(${formatCurrency(Math.abs(bal.balance))})`}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-semibold">
                        <td className="pt-2">সর্বমোট</td>
                        <td className="text-right pt-2">
                          {formatCurrency(advancesTotal)}
                        </td>
                        <td className="text-right pt-2">
                          {formatCurrency(expensesTotal)}
                        </td>
                        <td
                          className={`text-right pt-2 ${
                            pendingAdvances > 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {formatCurrency(Math.abs(pendingAdvances))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-slate-500">
                    কোনো তথ্য পাওয়া যায়নি।
                  </p>
                )}
                {sortedBalances.length > maxBalances && (
                  <p className="text-xs text-slate-500 mt-2">
                    ...এবং আরও {sortedBalances.length - maxBalances} জন
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            @page {
              size: A4 portrait;
              margin: 12mm;
            }

            body {
              background: white !important;
              font-size: 9pt !important;
              line-height: 1.3 !important;
            }

            aside,
            nav,
            header,
            footer,
            .no-print {
              display: none !important;
            }

            main {
              overflow: visible !important;
            }

            .h-screen {
              height: auto !important;
            }

            .overflow-hidden {
              overflow: visible !important;
            }

            .print-content {
              box-shadow: none !important;
              border-radius: 0 !important;
              border: none !important;
            }

            .report-header {
              padding: 0 0 0.4rem 0 !important;
              border-bottom: 1px solid #e5e7eb !important;
            }

            .content-body {
              padding: 0.4rem 0 0 !important;
              gap: 0.4rem !important;
            }

            .summary-grid {
              gap: 0.4rem !important;
              grid-template-columns: 1fr 2fr !important;
            }

            .summary-total {
              padding: 0.4rem !important;
            }

            .section {
              margin-top: 0.4rem !important;
            }

            .section-title {
              font-size: 9pt !important;
              margin-bottom: 0.2rem !important;
            }

            table {
              font-size: 8pt !important;
            }

            th,
            td {
              padding-top: 0.2rem !important;
              padding-bottom: 0.2rem !important;
            }

            .vendor-header,
            .vendor-row {
              grid-template-columns: 3fr 7fr 2fr !important;
            }

            .vendor-row {
              padding-top: 0.2rem !important;
              padding-bottom: 0.2rem !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
