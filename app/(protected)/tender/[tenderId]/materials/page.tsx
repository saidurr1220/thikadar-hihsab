import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/utils/bangla";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default async function MaterialsListPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const { data: purchases } = await supabase
    .from("material_purchases")
    .select(
      `
      *,
      materials (name_bn, unit_bn)
    `
    )
    .eq("tender_id", params.tenderId)
    .order("purchase_date", { ascending: false })
    .limit(50);

  const total = purchases?.reduce((sum, p) => sum + p.total_amount, 0) || 0;
  const bulkCount = purchases?.filter((p) => p.is_bulk_breakdown).length || 0;

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
              {labels.materialsRegister}
            </h1>
          </div>
          <Link href={`/tender/${params.tenderId}/materials/add`}>
            <Button>+ নতুন ক্রয়</Button>
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <div className="text-2xl font-bold">{purchases?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                বাল্ক ব্রেকডাউন
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bulkCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Purchases List */}
        <Card>
          <CardHeader>
            <CardTitle>সাম্প্রতিক ক্রয় সমূহ</CardTitle>
          </CardHeader>
          <CardContent>
            {!purchases || purchases.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">কোন ক্রয় নেই</p>
                <Link href={`/tender/${params.tenderId}/materials/add`}>
                  <Button>প্রথম ক্রয় যোগ করুন</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        {purchase.is_bulk_breakdown && (
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mb-2">
                            বাল্ক ব্রেকডাউন
                          </span>
                        )}
                        <h3 className="font-semibold text-lg">
                          {purchase.materials?.name_bn ||
                            purchase.custom_item_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {purchase.quantity} {purchase.unit}
                          {purchase.supplier && ` • ${purchase.supplier}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {formatDate(purchase.purchase_date)}
                        </p>
                        <p className="text-xl font-bold text-blue-600 mt-1">
                          {formatCurrency(purchase.total_amount)}
                        </p>
                      </div>
                    </div>

                    {purchase.is_bulk_breakdown && (
                      <div className="mt-4 pt-4 border-t bg-gray-50 rounded p-3 text-sm">
                        <p className="font-semibold mb-2">ব্রেকডাউন:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <p className="text-gray-600">মূল খরচ</p>
                            <p className="font-medium">
                              {formatCurrency(purchase.base_cost || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">পরিবহন</p>
                            <p className="font-medium">
                              {formatCurrency(
                                purchase.transport_vara_cost || 0
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">খালাস</p>
                            <p className="font-medium">
                              {formatCurrency(purchase.unload_cost || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">সর্বমোট</p>
                            <p className="font-medium">
                              {formatCurrency(purchase.total_amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {purchase.notes && (
                      <p className="text-sm text-gray-600 mt-3 pt-3 border-t">
                        {purchase.notes}
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
