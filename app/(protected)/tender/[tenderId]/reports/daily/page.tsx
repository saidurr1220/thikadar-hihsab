"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function DailySheetPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    labor: [],
    materials: [],
    activities: [],
    advances: [],
  });
  const [tender, setTender] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    // Load tender info
    const { data: tenderData } = await supabase
      .from("tenders")
      .select("*")
      .eq("id", params.tenderId)
      .single();
    setTender(tenderData);

    // Load labor entries
    const { data: labor } = await supabase
      .from("labor_entries")
      .select("*, work_types(name_bn)")
      .eq("tender_id", params.tenderId)
      .eq("entry_date", date);

    // Load materials
    const { data: materials } = await supabase
      .from("material_purchases")
      .select("*, materials(name_bn)")
      .eq("tender_id", params.tenderId)
      .eq("purchase_date", date);

    // Load activities
    const { data: activities } = await supabase
      .from("activity_expenses")
      .select("*, expense_categories(name_bn)")
      .eq("tender_id", params.tenderId)
      .eq("activity_date", date);

    // Load advances
    const { data: advances } = await supabase
      .from("advances")
      .select("*, users(full_name)")
      .eq("tender_id", params.tenderId)
      .eq("advance_date", date);

    setData({
      labor: labor || [],
      materials: materials || [],
      activities: activities || [],
      advances: advances || [],
    });
    setLoading(false);
  };

  const laborTotal =
    data.labor.reduce(
      (sum: number, l: any) =>
        sum + (l.khoraki_total || 0) + (l.wage_total || 0),
      0
    ) || 0;
  const materialsTotal =
    data.materials.reduce((sum: number, m: any) => sum + m.total_amount, 0) ||
    0;
  const activitiesTotal =
    data.activities.reduce((sum: number, a: any) => sum + a.amount, 0) || 0;
  const advancesTotal =
    data.advances.reduce((sum: number, a: any) => sum + a.amount, 0) || 0;
  const grandTotal =
    laborTotal + materialsTotal + activitiesTotal + advancesTotal;

  const handlePrint = () => {
    window.print();
  };

  const changeDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate.toISOString().split("T")[0]);
  };

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

        {/* Controls */}
        <Card className="mb-6 no-print">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Button onClick={() => changeDate(-1)}>← আগের দিন</Button>
              <div className="flex-1">
                <Label htmlFor="date">তারিখ নির্বাচন করুন</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <Button onClick={() => changeDate(1)}>পরের দিন →</Button>
              <Button onClick={handlePrint} className="bg-green-600">
                {labels.print}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-center">{labels.loading}</p>
        ) : (
          <div className="print-content">
            {/* Report Header */}
            <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">থিকাদারি হিসাব</h1>
              <h2 className="text-xl font-semibold mb-4">
                {labels.dailySheet}
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
                <p>
                  <strong>তারিখ:</strong> {formatDate(date)}
                </p>
              </div>
            </div>

            {/* Labor Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>শ্রমিক খরচ</CardTitle>
              </CardHeader>
              <CardContent>
                {data.labor.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    কোন এন্ট্রি নেই
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">ধরন</th>
                        <th className="text-left py-2">বিবরণ</th>
                        <th className="text-right py-2">লোক</th>
                        <th className="text-right py-2">খোরাকি</th>
                        <th className="text-right py-2">মজুরি</th>
                        <th className="text-right py-2">মোট</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.labor.map((l: any) => (
                        <tr key={l.id} className="border-b">
                          <td className="py-2">
                            {l.labor_type === "contract" ? "চুক্তি" : "দৈনিক"}
                          </td>
                          <td className="py-2">
                            {l.crew_name || l.labor_name || "-"}
                            {l.work_types && ` - ${l.work_types.name_bn}`}
                          </td>
                          <td className="text-right py-2">
                            {l.headcount || "-"}
                          </td>
                          <td className="text-right py-2">
                            {l.khoraki_total
                              ? formatCurrency(l.khoraki_total)
                              : "-"}
                          </td>
                          <td className="text-right py-2">
                            {l.wage_total ? formatCurrency(l.wage_total) : "-"}
                          </td>
                          <td className="text-right py-2 font-semibold">
                            {formatCurrency(
                              (l.khoraki_total || 0) + (l.wage_total || 0)
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td colSpan={5} className="text-right py-2">
                          উপমোট:
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(laborTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Materials Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>মালামাল ক্রয়</CardTitle>
              </CardHeader>
              <CardContent>
                {data.materials.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    কোন এন্ট্রি নেই
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">মালামাল</th>
                        <th className="text-right py-2">পরিমাণ</th>
                        <th className="text-right py-2">দর</th>
                        <th className="text-right py-2">মোট</th>
                        <th className="text-left py-2">সরবরাহকারী</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.materials.map((m: any) => (
                        <tr key={m.id} className="border-b">
                          <td className="py-2">
                            {m.materials?.name_bn || m.custom_item_name}
                            {m.is_bulk_breakdown && " *"}
                          </td>
                          <td className="text-right py-2">
                            {m.quantity} {m.unit}
                          </td>
                          <td className="text-right py-2">
                            {formatCurrency(m.unit_rate)}
                          </td>
                          <td className="text-right py-2 font-semibold">
                            {formatCurrency(m.total_amount)}
                          </td>
                          <td className="py-2">{m.supplier || "-"}</td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td colSpan={3} className="text-right py-2">
                          উপমোট:
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(materialsTotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Activities Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>কাজের খরচ</CardTitle>
              </CardHeader>
              <CardContent>
                {data.activities.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    কোন এন্ট্রি নেই
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">বিভাগ</th>
                        <th className="text-left py-2">বিবরণ</th>
                        <th className="text-right py-2">পরিমাণ</th>
                        <th className="text-left py-2">বিক্রেতা</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.activities.map((a: any) => (
                        <tr key={a.id} className="border-b">
                          <td className="py-2">
                            {a.expense_categories?.name_bn}
                          </td>
                          <td className="py-2">{a.description}</td>
                          <td className="text-right py-2 font-semibold">
                            {formatCurrency(a.amount)}
                          </td>
                          <td className="py-2">{a.vendor || "-"}</td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td colSpan={2} className="text-right py-2">
                          উপমোট:
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(activitiesTotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Advances Section */}
            {data.advances.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>অগ্রিম প্রদান</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">ব্যক্তি</th>
                        <th className="text-left py-2">উদ্দেশ্য</th>
                        <th className="text-right py-2">পরিমাণ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.advances.map((a: any) => (
                        <tr key={a.id} className="border-b">
                          <td className="py-2">{a.users?.full_name}</td>
                          <td className="py-2">{a.purpose}</td>
                          <td className="text-right py-2 font-semibold">
                            {formatCurrency(a.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td colSpan={2} className="text-right py-2">
                          উপমোট:
                        </td>
                        <td className="text-right py-2">
                          {formatCurrency(advancesTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>দিনের সারসংক্ষেপ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span>শ্রমিক খরচ:</span>
                    <span className="font-semibold">
                      {formatCurrency(laborTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>মালামাল:</span>
                    <span className="font-semibold">
                      {formatCurrency(materialsTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>কাজের খরচ:</span>
                    <span className="font-semibold">
                      {formatCurrency(activitiesTotal)}
                    </span>
                  </div>
                  {advancesTotal > 0 && (
                    <div className="flex justify-between py-2 border-b">
                      <span>অগ্রিম:</span>
                      <span className="font-semibold">
                        {formatCurrency(advancesTotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 text-lg font-bold border-t-2">
                    <span>মোট:</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 pt-8 border-t-2 grid grid-cols-3 gap-8 text-center text-sm">
              <div>
                <p className="mb-8">প্রস্তুতকারী</p>
                <p className="border-t pt-2">স্বাক্ষর ও তারিখ</p>
              </div>
              <div>
                <p className="mb-8">পরীক্ষক</p>
                <p className="border-t pt-2">স্বাক্ষর ও তারিখ</p>
              </div>
              <div>
                <p className="mb-8">অনুমোদনকারী</p>
                <p className="border-t pt-2">স্বাক্ষর ও তারিখ</p>
              </div>
            </div>
          </div>
        )}
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
