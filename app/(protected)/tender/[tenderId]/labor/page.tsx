import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import EntryActions from "@/components/EntryActions";

export const dynamic = "force-dynamic";

export default async function LaborListPage({
  params,
  searchParams,
}: {
  params: { tenderId: string };
  searchParams?: { tab?: string };
}) {
  const supabase = createClient();

  const { data: laborEntries } = await supabase
    .from("labor_entries")
    .select(
      `
      *,
      work_types (name_bn),
      subcontractors (name)
    `
    )
    .eq("tender_id", params.tenderId)
    .order("entry_date", { ascending: false })
    .limit(50);

  const calcBase = (entry: any) =>
    Number(entry.khoraki_total || 0) + Number(entry.wage_total || 0);

  const dailyEntries = (laborEntries || []).filter(
    (l) => l.labor_type === "daily"
  );
  const contractEntries = (laborEntries || []).filter(
    (l) => l.labor_type === "contract"
  );

  const dailyTotal =
    dailyEntries?.reduce((sum, l) => sum + calcBase(l), 0) || 0;
  const contractTotal =
    contractEntries?.reduce((sum, l) => sum + calcBase(l), 0) || 0;
  const combinedTotal = dailyTotal + contractTotal;

  const activeTab = searchParams?.tab === "daily" ? "daily" : "contract";
  const activeEntries =
    activeTab === "contract" ? contractEntries : dailyEntries;
  const activeTotal = activeTab === "contract" ? contractTotal : dailyTotal;

  const tabClass = (tab: "daily" | "contract") =>
    [
      "flex-1 rounded-md border px-3 py-2 text-center text-sm font-medium transition",
      activeTab === tab
        ? "border-blue-600 bg-blue-50 text-blue-700"
        : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700",
    ].join(" ");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link
              href={`/tender/${params.tenderId}`}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <span className="text-base">ƒ+?</span>
              Back to tender dashboard
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Site workforce
              </p>
              <h1 className="text-3xl font-bold text-gray-900">
                Labor & Subcontractors
              </h1>
              <p className="text-sm text-gray-600">
                Daily labor stays with your expenses; contract crews track
                khoraki separately.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/tender/${params.tenderId}/labor/add`}>
              <Button className="shadow-sm">+ Add labor</Button>
            </Link>
            <Link href={`/tender/${params.tenderId}/labor/subcontractors/add`}>
              <Button variant="outline">+ Add subcontractor</Button>
            </Link>
          </div>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Daily labor (expense)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-gray-900">
                {formatCurrency(dailyTotal)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {dailyEntries.length} entries
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Contract labor (khoraki)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-gray-900">
                {formatCurrency(contractTotal)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {contractEntries.length} entries
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-white via-slate-50 to-slate-100 border-slate-200 shadow-sm">
            <CardHeader className="pb-3 flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                All labor (for totals)
              </CardTitle>
              <Link
                href={`/tender/${params.tenderId}/labor/subcontractors`}
                className="text-xs text-blue-600 hover:underline"
              >
                View by subcontractor
              </Link>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-semibold text-gray-900">
                {formatCurrency(combinedTotal)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Daily + contract shown separately below
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Link
            href={`/tender/${params.tenderId}/labor?tab=daily`}
            className={tabClass("daily")}
          >
            Daily labor
          </Link>
          <Link
            href={`/tender/${params.tenderId}/labor?tab=contract`}
            className={tabClass("contract")}
          >
            Contract labor
          </Link>
        </div>

        {/* Entries List */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>
              {activeTab === "contract"
                ? "Contract labor khoraki"
                : "Daily labor expense"}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {activeEntries.length} entries · {formatCurrency(activeTotal)}
            </p>
          </CardHeader>
          <CardContent>
            {activeEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {activeTab === "contract"
                    ? "No contract labor entries yet."
                    : "No daily labor entries yet."}
                </p>
                <Link
                  href={`/tender/${params.tenderId}/labor/add?laborType=${activeTab}`}
                >
                  <Button>Add your first entry</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-blue-200 hover:shadow-sm transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatDate(entry.entry_date)}</span>
                        <span
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                          title={
                            entry.labor_type === "contract"
                              ? "Contract labor"
                              : "Daily labor"
                          }
                        >
                          {entry.labor_type === "contract"
                            ? "Contract"
                            : "Daily"}
                        </span>
                        {entry.subcontractors?.name && (
                          <span>Aú {entry.subcontractors.name}</span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {entry.crew_name || entry.labor_name || "Unnamed crew"}
                      </div>
                      {entry.work_types?.name_bn && (
                        <div className="text-xs text-gray-500">
                          {entry.work_types.name_bn}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">
                          {formatCurrency(calcBase(entry))}
                        </div>
                      </div>
                      <EntryActions
                        entryId={entry.id}
                        tableName="labor_entries"
                        editUrl={`/tender/${params.tenderId}/labor/edit/${entry.id}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
