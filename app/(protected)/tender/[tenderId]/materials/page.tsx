import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EntryActions from "@/components/EntryActions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { labels } from "@/lib/utils/bangla";

export const dynamic = "force-dynamic";

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

  const calcDisplayTotal = (p: any) => {
    const base = Number(p.base_cost || 0);
    const transport = Number(p.transport_vara_cost || 0);
    const unload = Number(p.unload_cost || 0);
    return Number(p.total_amount ?? base + transport + unload);
  };

  const total =
    purchases?.reduce((sum, p) => sum + calcDisplayTotal(p), 0) || 0;
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
              Back to tender dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              {labels.materialsRegister}
            </h1>
          </div>
          <Link href={`/tender/${params.tenderId}/materials/add`}>
            <Button>+ Add purchase</Button>
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total purchases
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
              <div className="text-2xl font-bold">{purchases?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bulk breakdown entries
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
            <CardTitle>Recent purchases</CardTitle>
          </CardHeader>
          <CardContent>
            {!purchases || purchases.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  No purchases yet for this tender.
                </p>
                <Link href={`/tender/${params.tenderId}/materials/add`}>
                  <Button>Add your first purchase</Button>
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
                      <div className="flex-1">
                        {purchase.is_bulk_breakdown && (
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mb-2">
                            Bulk breakdown
                          </span>
                        )}
                        <h3 className="font-semibold text-lg">
                          {purchase.materials?.name_bn ||
                            purchase.custom_item_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {purchase.is_bulk_breakdown
                            ? `${purchase.qty_cft ?? purchase.quantity ?? 0} cft`
                            : `${purchase.quantity ?? 0} ${
                                purchase.unit ||
                                purchase.materials?.unit_bn ||
                                ""
                              }`}
                          {purchase.supplier && ` · ${purchase.supplier}`}
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {formatDate(purchase.purchase_date)}
                          </p>
                          <p className="text-xl font-bold text-blue-600 mt-1">
                            {formatCurrency(calcDisplayTotal(purchase))}
                          </p>
                        </div>
                        <EntryActions
                          entryId={purchase.id}
                          tableName="material_purchases"
                          editUrl={`/tender/${params.tenderId}/materials/edit/${purchase.id}`}
                        />
                      </div>
                    </div>

                    {purchase.is_bulk_breakdown && (
                      <div className="mt-4 pt-4 border-t bg-gray-50 rounded p-3 text-sm">
                        <p className="font-semibold mb-2">Breakdown:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <p className="text-gray-600">Base cost</p>
                            <p className="font-medium">
                              {formatCurrency(purchase.base_cost || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Transport</p>
                            <p className="font-medium">
                              {formatCurrency(
                                purchase.transport_vara_cost || 0
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Unload</p>
                            <p className="font-medium">
                              {formatCurrency(purchase.unload_cost || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Total</p>
                            <p className="font-medium">
                              {formatCurrency(calcDisplayTotal(purchase))}
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
