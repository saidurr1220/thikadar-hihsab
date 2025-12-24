import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";

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
      expense_categories (name_bn),
      expense_subcategories (name_bn)
    `
    )
    .eq("tender_id", params.tenderId)
    .order("activity_date", { ascending: false })
    .limit(50);

  const total = activities?.reduce((sum, a) => sum + a.amount, 0) || 0;

  // Group by category
  const byCategory = activities?.reduce((acc: any, a) => {
    const catName = a.expense_categories?.name_bn || "অন্যান্য";
    if (!acc[catName]) acc[catName] = 0;
    acc[catName] += a.amount;
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
              ← টেন্ডার ড্যাশবোর্ড
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              {labels.activityRegister}
            </h1>
          </div>
          <Link href={`/tender/${params.tenderId}/activities/add`}>
            <Button>+ নতুন খরচ</Button>
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                মোট খরচ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(total)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                মোট এন্ট্রি
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activities?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        {byCategory && Object.keys(byCategory).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>বিভাগ অনুযায়ী</CardTitle>
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

        {/* Activities List */}
        <Card>
          <CardHeader>
            <CardTitle>সাম্প্রতিক খরচ সমূহ</CardTitle>
          </CardHeader>
          <CardContent>
            {!activities || activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">কোন খরচ নেই</p>
                <Link href={`/tender/${params.tenderId}/activities/add`}>
                  <Button>প্রথম খরচ যোগ করুন</Button>
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
                            {activity.expense_categories?.name_bn}
                          </span>
                          {activity.expense_subcategories && (
                            <span className="text-xs text-gray-600">
                              • {activity.expense_subcategories.name_bn}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-1">
                          {activity.description}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{formatDate(activity.activity_date)}</p>
                          {activity.quantity && activity.unit && (
                            <p>
                              পরিমাণ: {activity.quantity} {activity.unit}
                              {activity.rate && ` × ৳${activity.rate}`}
                            </p>
                          )}
                          {activity.vendor && (
                            <p>বিক্রেতা: {activity.vendor}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(activity.amount)}
                        </p>
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
