"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { exportActivitiesReport } from "@/lib/utils/excel";
import { FileSpreadsheet, Printer, ChevronLeft } from "lucide-react";

export default function ActivitiesRegisterPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const [tender, setTender] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: tenderData } = await supabase
      .from("tenders")
      .select("*")
      .eq("id", params.tenderId)
      .single();
    setTender(tenderData);

    const { data: activitiesData } = await supabase
      .from("activity_expenses")
      .select("*, expense_categories(name_bn), expense_subcategories(name_bn)")
      .eq("tender_id", params.tenderId)
      .order("expense_date", { ascending: false })
      .limit(200);
    setActivities(activitiesData || []);

    setLoading(false);
  };

  const total =
    activities?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    exportActivitiesReport(activities, tender);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between no-print">
          <Link
            href={`/tender/${params.tenderId}/reports`}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            রিপোর্ট মেনু
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {labels.activityRegister}
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel Export
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-center">{labels.loading}</p>
        ) : (
          <div className="print-content">
            <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">ঠিকাদারি হিসাব</h1>
              <h2 className="text-xl font-semibold mb-4">
                {labels.activityRegister}
              </h2>
              <div className="text-sm space-y-1">
                <p>
                  <strong>à¦Ÿà§‡à¦¨à§à¦¡à¦¾à¦° à¦•à§‹à¦¡:</strong>{" "}
                  {tender?.tender_code}
                </p>
                <p>
                  <strong>à¦ªà§à¦°à¦•à¦²à§à¦ªà§‡à¦° à¦¨à¦¾à¦®:</strong>{" "}
                  {tender?.project_name}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>à¦•à¦¾à¦œà§‡à¦° à¦–à¦°à¦š à¦¸à¦®à§‚à¦¹</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">à¦¤à¦¾à¦°à¦¿à¦–</th>
                      <th className="text-left py-2">à¦¬à¦¿à¦­à¦¾à¦—</th>
                      <th className="text-left py-2">à¦¬à¦¿à¦¬à¦°à¦£</th>
                      <th className="text-right py-2">à¦ªà¦°à¦¿à¦®à¦¾à¦£</th>
                      <th className="text-left py-2">
                        à¦¬à¦¿à¦•à§à¦°à§‡à¦¤à¦¾
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities?.map((a) => (
                      <tr key={a.id} className="border-b">
                        <td className="py-2">{formatDate(a.expense_date)}</td>
                        <td className="py-2">
                          {a.expense_categories?.name_bn}
                          {a.expense_subcategories &&
                            ` - ${a.expense_subcategories.name_bn}`}
                        </td>
                        <td className="py-2">{a.description}</td>
                        <td className="text-right py-2 font-semibold">
                          {formatCurrency(a.amount)}
                        </td>
                        <td className="py-2">{a.vendor || "-"}</td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2">
                      <td colSpan={3} className="text-right py-2">
                        à¦®à§‹à¦Ÿ:
                      </td>
                      <td className="text-right py-2">
                        {formatCurrency(total)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <style>{`
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
