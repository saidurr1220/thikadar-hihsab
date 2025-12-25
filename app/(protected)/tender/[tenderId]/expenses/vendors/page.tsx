"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/format";

export default function VendorExpenseHubPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const supabase = createClient();

  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [totalPurchasesAll, setTotalPurchasesAll] = useState(0);
  const [vendorTotals, setVendorTotals] = useState<
    Record<string, { purchases: number; paid: number }>
  >({});
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: "",
    phone: "",
    categoryId: "",
  });

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    const { data: categoryData } = await supabase
      .from("vendor_categories")
      .select("*")
      .eq("is_active", true)
      .order("name");

    const { data: vendorData } = await supabase
      .from("vendors")
      .select("*")
      .eq("is_active", true)
      .order("name");

    const { data: purchaseData } = await supabase
      .from("vendor_purchases")
      .select("vendor_id, total_cost")
      .eq("tender_id", params.tenderId);

    const { data: paymentData } = await supabase
      .from("vendor_payments")
      .select("vendor_id, amount")
      .eq("tender_id", params.tenderId);

    setCategories(categoryData || []);
    setVendors(vendorData || []);
    setTotalPurchasesAll(
      purchaseData?.reduce(
        (sum, p) => sum + Number(p.total_cost || 0),
        0
      ) || 0
    );

    const totals: Record<string, { purchases: number; paid: number }> = {};

    purchaseData?.forEach((p: any) => {
      if (!p.vendor_id) return;
      if (!totals[p.vendor_id]) {
        totals[p.vendor_id] = { purchases: 0, paid: 0 };
      }
      totals[p.vendor_id].purchases += Number(p.total_cost || 0);
    });

    paymentData?.forEach((p: any) => {
      if (!p.vendor_id) return;
      if (!totals[p.vendor_id]) {
        totals[p.vendor_id] = { purchases: 0, paid: 0 };
      }
      totals[p.vendor_id].paid += Number(p.amount || 0);
    });

    setVendorTotals(totals);
  };

  const filteredVendors = useMemo(() => {
    if (activeCategory === "all") return vendors;
    return vendors.filter((v) => v.category_id === activeCategory);
  }, [vendors, activeCategory]);

  const totalDue = filteredVendors.reduce((sum, v) => {
    const t = vendorTotals[v.id];
    const balance = (t?.purchases || 0) - (t?.paid || 0);
    return sum + balance;
  }, 0);

  const totalPurchases = totalPurchasesAll;

  const addVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.name) return;

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    setAdding(true);
    const { error } = await supabase.from("vendors").insert({
      name: newVendor.name,
      phone: newVendor.phone || null,
      category_id: newVendor.categoryId || null,
      created_by: userId,
    });

    setAdding(false);
    if (!error) {
      setNewVendor({ name: "", phone: "", categoryId: "" });
      loadAll();
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(254,243,199,0.6),rgba(255,255,255,0))]">
      <div className="bg-gradient-to-br from-amber-50 via-white to-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Link
                href={`/tender/${params.tenderId}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to tender dashboard
              </Link>
              <h1 className="text-3xl font-bold text-slate-900 mt-2">
                Vendor expenses
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Vendor purchases, payments, and dues.
              </p>
            </div>
            <Link href={`/tender/${params.tenderId}/expenses/overview`}>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                All expenses
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Total vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {vendors.length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Total purchases (all time)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalPurchases)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Total due (filtered)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalDue)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border-slate-200/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {categories.length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/80 border-slate-200/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Plus className="h-4 w-4" />
                Add vendor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                onSubmit={addVendor}
              >
                <div className="md:col-span-2">
                  <Label htmlFor="vendorName">Name *</Label>
                  <Input
                    id="vendorName"
                    value={newVendor.name}
                    onChange={(e) =>
                      setNewVendor((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vendorPhone">Phone</Label>
                  <Input
                    id="vendorPhone"
                    value={newVendor.phone}
                    onChange={(e) =>
                      setNewVendor((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="vendorCategory">Category</Label>
                  <select
                    id="vendorCategory"
                    className="w-full h-10 border rounded-md px-3 text-sm"
                    value={newVendor.categoryId}
                    onChange={(e) =>
                      setNewVendor((p) => ({ ...p, categoryId: e.target.value }))
                    }
                  >
                    <option value="">All</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_bn || c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4">
                  <Button type="submit" disabled={adding}>
                    {adding ? "Adding..." : "Add vendor"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              onClick={() => setActiveCategory("all")}
              size="sm"
            >
              All
            </Button>
            {categories.map((c) => (
              <Button
                key={c.id}
                variant={activeCategory === c.id ? "default" : "outline"}
                onClick={() => setActiveCategory(c.id)}
                size="sm"
              >
                {c.name_bn || c.name}
              </Button>
            ))}
          </div>

          <Card className="bg-white/80 border-slate-200/70 shadow-sm">
            <CardHeader>
              <CardTitle>Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredVendors.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No vendors yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVendors.map((v) => {
                    const t = vendorTotals[v.id];
                    const purchases = t?.purchases || 0;
                    const paid = t?.paid || 0;
                    const balance = purchases - paid;
                    const showPaid = balance <= 0;
                    const displayAmount = showPaid ? paid : balance;

                    return (
                      <Link
                        key={v.id}
                        href={`/tender/${params.tenderId}/expenses/vendors/${v.id}`}
                        className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-lg text-slate-900">
                              {v.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {categories.find((c) => c.id === v.category_id)
                                ?.name_bn || "Other"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                showPaid ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {formatCurrency(displayAmount)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
