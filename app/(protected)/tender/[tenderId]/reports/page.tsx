"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { createClient } from "@/lib/supabase/client";
import { exportAllReports } from "@/lib/utils/excel";
import { FileSpreadsheet, Download } from "lucide-react";

export default function ReportsMenuPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const [exporting, setExporting] = useState(false);

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const supabase = createClient();
      await exportAllReports(params.tenderId, supabase);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };
  const reports = [
    {
      id: "daily",
      title: labels.dailySheet,
      description: "একদিনের সব খরচ",
      icon: "📅",
      href: `/tender/${params.tenderId}/reports/daily`,
    },
    {
      id: "labor",
      title: labels.laborRegister,
      description: "শ্রমিক খতিয়ান",
      icon: "👷",
      href: `/tender/${params.tenderId}/reports/labor`,
    },
    {
      id: "materials",
      title: labels.materialsRegister,
      description: "মালামাল খতিয়ান",
      icon: "🧱",
      href: `/tender/${params.tenderId}/reports/materials`,
    },
    {
      id: "activities",
      title: labels.activityRegister,
      description: "কাজভিত্তিক খরচ খতিয়ান",
      icon: "🏗️",
      href: `/tender/${params.tenderId}/reports/activities`,
    },
    {
      id: "advances",
      title: labels.advanceLedger,
      description: "অগ্রিম হিসাব",
      icon: "💰",
      href: `/tender/${params.tenderId}/reports/advances`,
    },
    {
      id: "summary",
      title: labels.tenderSummary,
      description: "সারসংক্ষেপ এক পাতায়",
      icon: "📊",
      href: `/tender/${params.tenderId}/reports/summary`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/tender/${params.tenderId}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← টেন্ডার ড্যাশবোর্ড
          </Link>
          <Button
            onClick={handleExportAll}
            disabled={exporting}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Export হচ্ছে..." : "সম্পূর্ণ রিপোর্ট Export করুন"}
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            {labels.reports}
          </h1>
          <p className="text-gray-600 mt-2">রিপোর্ট নির্বাচন করুন</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Link key={report.id} href={report.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="text-4xl mb-2">{report.icon}</div>
                  <CardTitle className="text-xl">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{report.description}</p>
                  <Button className="w-full">{labels.view}</Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
