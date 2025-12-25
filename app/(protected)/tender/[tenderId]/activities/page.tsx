import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import EntryActions from "@/components/EntryActions";

export const dynamic = "force-dynamic";

export default async function ActivitiesListPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const { data: activities } = await supabase
    .from("activity_expenses")
    .select(
      `
      *,
      activity_categories!activity_expenses_category_id_fkey (name),
      activity_subcategories:activity_categories!activity_expenses_subcategory_id_fkey (name)
    `
    )
    .eq("tender_id", params.tenderId)
    .order("expense_date", { ascending: false })
    .limit(50);

  const total =
    activities?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;

  const byCategory = activities?.reduce((acc: any, a) => {
    const catName = a.activity_categories?.name || "Other";
    if (!acc[catName]) acc[catName] = 0;
    acc[catName] += Number(a.amount || 0);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Link
              href={`/tender/${params.tenderId}`}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Back to tender dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              {labels.activityRegister}
            </h1>
          </div>
          <Link href={`/tender/${params.tenderId}/activities/add`}>
            <Button>+ Add activity</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(total)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activities?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {byCategory && Object.keys(byCategory).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Category breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(byCategory).map(([cat, amt]: [string, any]) => (
                  <div
                    key={cat}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <span className="font-medium">{cat}</span>
                    <span className="text-blue-600 font-semibold">
                      {formatCurrency(amt)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent activity expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {!activities || activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No activities yet.</p>
                <Link href={`/tender/${params.tenderId}/activities/add`}>
                  <Button>Add your first activity</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {activity.activity_categories?.name || "Other"}
                          </span>
                          {activity.activity_subcategories?.name && (
                              <span className="text-xs text-gray-600">
                                • {activity.activity_subcategories.name}
                              </span>
                            )}
                        </div>
                        <h3 className="font-semibold text-lg mb-1">
                          {activity.description}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{formatDate(activity.expense_date)}</p>
                          {activity.quantity && activity.unit && (
                            <p>
                              Quantity: {activity.quantity} {activity.unit}
                              {activity.rate && ` @ ${activity.rate}`}
                            </p>
                          )}
                          {activity.vendor && <p>Vendor: {activity.vendor}</p>}
                        </div>
                      </div>
                      <div className="flex items-start gap-3 ml-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">
                            {formatCurrency(activity.amount)}
                          </p>
                        </div>
                        <EntryActions
                          entryId={activity.id}
                          tableName="activity_expenses"
                          editUrl={`/tender/${params.tenderId}/activities/edit/${activity.id}`}
                        />
                      </div>
                    </div>
                    {activity.notes && (
                      <p className="text-sm text-gray-600 mt-3 pt-3 border-t">
                        {activity.notes}
                      </p>
                    )}
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
