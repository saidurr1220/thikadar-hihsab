import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";

export default function ReportsMenuPage({
  params,
}: {
  params: { tenderId: string };
}) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← টেন্ডার ড্যাশবোর্ড
          </Link>
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
