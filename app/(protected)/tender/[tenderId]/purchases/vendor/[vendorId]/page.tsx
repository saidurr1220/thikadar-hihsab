"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CreditCard,
  Phone,
  Calendar,
  Plus,
  DollarSign,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface Transaction {
  id: string;
  date: string;
  type: "purchase" | "payment";
  item_name?: string;
  quantity?: number;
  unit?: string;
  amount: number;
  payment_method?: string;
  notes?: string;
  source?: "vendor_purchase" | "material_purchase" | "payment";
}

export default function VendorDetailPage({
  params,
}: {
  params: { tenderId: string; vendorId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalPaid: 0,
    balance: 0,
    purchaseCount: 0,
    paymentCount: 0,
  });

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendorEdit, setVendorEdit] = useState({
    name: "",
    phone: "",
    categoryIds: [] as string[],
    notes: "",
  });
  const [updating, setUpdating] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMethod: "cash",
    reference: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("vendor_categories")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (data) setCategories(data);
  };

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    // Load vendor details
    const { data: vendorData } = await supabase
      .from("vendors")
      .select("*, vendor_categories(name, name_bn)")
      .eq("id", params.vendorId)
      .single();

    // Load vendor category mappings
    const { data: mappingsData } = await supabase
      .from("vendor_category_mappings")
      .select("category_id")
      .eq("vendor_id", params.vendorId);

    if (vendorData) {
      vendorData.categoryIds = mappingsData?.map((m) => m.category_id) || [];
    }

    // Load vendor purchases
    const { data: vendorPurchases } = await supabase
      .from("vendor_purchases")
      .select("*")
      .eq("vendor_id", params.vendorId)
      .order("purchase_date", { ascending: false });

    // Load material purchases
    const { data: materialPurchases } = await supabase
      .from("material_purchases")
      .select("*, material:materials(name_bn)")
      .eq("vendor_id", params.vendorId)
      .order("purchase_date", { ascending: false });

    // Load payments
    const { data: payments } = await supabase
      .from("vendor_payments")
      .select("*")
      .eq("vendor_id", params.vendorId)
      .order("payment_date", { ascending: false });

    // Combine transactions
    const allTransactions: Transaction[] = [];

    vendorPurchases?.forEach((vp) => {
      allTransactions.push({
        id: vp.id,
        date: vp.purchase_date,
        type: "purchase",
        item_name: vp.item_name,
        quantity: vp.quantity,
        unit: vp.unit,
        amount: Number(vp.total_amount || 0),
        notes: vp.notes,
        payment_method: vp.payment_method,
        source: "vendor_purchase",
      });
    });

    materialPurchases?.forEach((mp) => {
      allTransactions.push({
        id: mp.id,
        date: mp.purchase_date,
        type: "purchase",
        item_name: mp.material?.name_bn || mp.custom_item_name,
        quantity: mp.quantity,
        unit: mp.unit,
        amount: Number(mp.total_amount || 0),
        payment_method: mp.payment_method,
        notes: mp.notes,
        source: "material_purchase",
      });
    });

    payments?.forEach((p) => {
      // Skip auto-generated payments (to avoid duplicate lines)
      if (p.notes && (p.notes.includes('Auto payment for') || p.notes.includes('auto payment'))) {
        return;
      }
      
      allTransactions.push({
        id: p.id,
        date: p.payment_date,
        type: "payment",
        amount: Number(p.amount || 0),
        payment_method: p.payment_method,
        notes: p.notes,
        source: "payment",
      });
    });

    // Sort by date
    allTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate stats
    const totalPurchases =
      (vendorPurchases?.reduce(
        (sum, p) => sum + Number(p.total_amount || 0),
        0
      ) || 0) +
      (materialPurchases?.reduce(
        (sum, p) => sum + Number(p.total_amount || 0),
        0
      ) || 0);

    const totalPaid =
      payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    setVendor(vendorData);
    setTransactions(allTransactions);
    setStats({
      totalPurchases,
      totalPaid,
      balance: totalPurchases - totalPaid,
      purchaseCount:
        (vendorPurchases?.length || 0) + (materialPurchases?.length || 0),
      paymentCount: payments?.length || 0,
    });
    setLoading(false);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("vendor_payments").insert({
        tender_id: params.tenderId,
        vendor_id: params.vendorId,
        payment_date: paymentData.paymentDate,
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.paymentMethod,
        reference: paymentData.reference || null,
        notes: paymentData.notes || null,
        recorded_by: auth.user.id,
      });

      if (error) throw error;

      setShowPaymentForm(false);
      setPaymentData({
        paymentDate: new Date().toISOString().split("T")[0],
        amount: "",
        paymentMethod: "cash",
        reference: "",
        notes: "",
      });
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (txn: Transaction) => {
    if (!confirm(`Delete this ${txn.type}? This cannot be undone.`)) return;

    try {
      const supabase = createClient();
      let error;

      if (txn.type === "payment") {
        const result = await supabase
          .from("vendor_payments")
          .delete()
          .eq("id", txn.id);
        error = result.error;
      } else {
        // Delete purchase
        if (txn.source === "vendor_purchase") {
          // First, find and delete any auto-generated payment for this specific purchase
          // The payment would have been created on the same date with matching amount
          const { data: relatedPayments } = await supabase
            .from("vendor_payments")
            .select("id")
            .eq("vendor_id", params.vendorId)
            .eq("payment_date", txn.date)
            .eq("amount", txn.amount)
            .ilike("notes", `%Auto payment for%`);

          if (relatedPayments && relatedPayments.length > 0) {
            await supabase
              .from("vendor_payments")
              .delete()
              .in("id", relatedPayments.map(p => p.id));
          }

          // Then delete the purchase itself
          const result = await supabase
            .from("vendor_purchases")
            .delete()
            .eq("id", txn.id);
          error = result.error;
        } else if (txn.source === "material_purchase") {
          // First, find and delete any auto-generated payment for this specific material purchase
          const { data: relatedPayments } = await supabase
            .from("vendor_payments")
            .select("id")
            .eq("vendor_id", params.vendorId)
            .eq("payment_date", txn.date)
            .eq("amount", txn.amount)
            .ilike("notes", `%Auto payment for%`);

          if (relatedPayments && relatedPayments.length > 0) {
            await supabase
              .from("vendor_payments")
              .delete()
              .in("id", relatedPayments.map(p => p.id));
          }

          // Then delete the material purchase itself
          const result = await supabase
            .from("material_purchases")
            .delete()
            .eq("id", txn.id);
          error = result.error;
        }
      }

      if (error) throw error;

      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleEditTransaction = (txn: Transaction) => {
    // Redirect to appropriate edit page
    if (txn.source === "vendor_purchase") {
      router.push(`/tender/${params.tenderId}/expenses/vendors/${params.vendorId}?edit=${txn.id}`);
    } else if (txn.source === "material_purchase") {
      router.push(`/tender/${params.tenderId}/materials/edit/${txn.id}`);
    }
  };

  const handleEditVendor = () => {
    setVendorEdit({
      name: vendor.name || "",
      phone: vendor.phone || "",
      categoryIds: vendor.categoryIds || [],
      notes: vendor.notes || "",
    });
    setShowEditForm(true);
  };

  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorEdit.name.trim()) {
      alert("Vendor name is required");
      return;
    }

    setUpdating(true);
    try {
      const supabase = createClient();

      // Update vendor basic info
      const { error: updateError } = await supabase
        .from("vendors")
        .update({
          name: vendorEdit.name,
          phone: vendorEdit.phone || null,
          notes: vendorEdit.notes || null,
        })
        .eq("id", params.vendorId);

      if (updateError) throw updateError;

      // Delete old category mappings
      await supabase
        .from("vendor_category_mappings")
        .delete()
        .eq("vendor_id", params.vendorId);

      // Insert new category mappings
      if (vendorEdit.categoryIds.length > 0) {
        const { error: mappingError } = await supabase
          .from("vendor_category_mappings")
          .insert(
            vendorEdit.categoryIds.map((catId) => ({
              vendor_id: params.vendorId,
              category_id: catId,
            }))
          );

        if (mappingError) throw mappingError;
      }

      setShowEditForm(false);
      loadData();
    } catch (err: any) {
      alert("Error updating vendor: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Vendor not found</p>
          <Button
            onClick={() => router.push(`/tender/${params.tenderId}/purchases`)}
            className="mt-4"
          >
            Back to Purchases
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:pl-8 pl-20">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/tender/${params.tenderId}/purchases`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to purchases
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {vendor.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                {vendor.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {vendor.phone}
                  </div>
                )}
                {vendor.categoryIds && vendor.categoryIds.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {vendor.categoryIds.map((catId: string) => {
                      const cat = categories.find((c) => c.id === catId);
                      return cat ? (
                        <span
                          key={catId}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                        >
                          {cat.name_bn || cat.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleEditVendor}
                variant="outline"
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                onClick={() =>
                  router.push(
                    `/tender/${params.tenderId}/purchases/add?vendor=${vendor.id}`
                  )
                }
                variant="outline"
                className="gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Add Purchase
              </Button>
              <Button
                onClick={() => setShowPaymentForm(true)}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4" />
                Record Payment
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Total Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalPurchases)}
              </div>
              <p className="text-xs opacity-80 mt-1">
                {stats.purchaseCount} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Total Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalPaid)}
              </div>
              <p className="text-xs opacity-80 mt-1">
                {stats.paymentCount} payments
              </p>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br ${
              stats.balance > 0
                ? "from-red-500 to-red-600"
                : "from-emerald-500 to-emerald-600"
            } text-white`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {stats.balance > 0 ? "Due Balance" : "Overpaid"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(Math.abs(stats.balance))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Payment Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalPurchases > 0
                  ? Math.round((stats.totalPaid / stats.totalPurchases) * 100)
                  : 0}
                %
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{
                    width: `${
                      stats.totalPurchases > 0
                        ? Math.min(
                            (stats.totalPaid / stats.totalPurchases) * 100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Vendor Form */}
        {showEditForm && (
          <Card className="mb-8 border-2 border-blue-200 shadow-lg">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Edit className="h-5 w-5" />
                Edit Vendor Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdateVendor} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendorName">Vendor Name *</Label>
                    <Input
                      id="vendorName"
                      value={vendorEdit.name}
                      onChange={(e) =>
                        setVendorEdit((p) => ({ ...p, name: e.target.value }))
                      }
                      required
                      disabled={updating}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendorPhone">Phone Number</Label>
                    <Input
                      id="vendorPhone"
                      value={vendorEdit.phone}
                      onChange={(e) =>
                        setVendorEdit((p) => ({ ...p, phone: e.target.value }))
                      }
                      disabled={updating}
                    />
                  </div>
                </div>

                <div>
                  <Label>Categories (select multiple)</Label>
                  <div className="border rounded-md p-4 max-h-48 overflow-y-auto bg-white">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={vendorEdit.categoryIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVendorEdit((p) => ({
                                  ...p,
                                  categoryIds: [...p.categoryIds, c.id],
                                }));
                              } else {
                                setVendorEdit((p) => ({
                                  ...p,
                                  categoryIds: p.categoryIds.filter(
                                    (id) => id !== c.id
                                  ),
                                }));
                              }
                            }}
                            disabled={updating}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {c.name_bn || c.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="vendorNotes">Notes</Label>
                  <textarea
                    id="vendorNotes"
                    value={vendorEdit.notes}
                    onChange={(e) =>
                      setVendorEdit((p) => ({ ...p, notes: e.target.value }))
                    }
                    disabled={updating}
                    rows={3}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="Additional notes about this vendor..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={updating}>
                    {updating ? "Updating..." : "Update Vendor"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditForm(false)}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Payment Form */}
        {showPaymentForm && (
          <Card className="mb-8 border-2 border-green-200 shadow-lg">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CreditCard className="h-5 w-5" />
                Record Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentDate">Payment Date *</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentData.paymentDate}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          paymentDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          amount: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <select
                      id="paymentMethod"
                      value={paymentData.paymentMethod}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="check">Check</option>
                      <option value="mfs">MFS (bKash, Nagad)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="reference">Reference/TxID</Label>
                    <Input
                      id="reference"
                      value={paymentData.reference}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          reference: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={paymentData.notes}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Optional notes..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? "Recording..." : "Record Payment"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPaymentForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      let runningBalance = 0;
                      return transactions.map((txn) => {
                        // For purchases, check if they were paid immediately (cash/bank)
                        if (txn.type === "purchase") {
                          // If payment method is cash or bank, it's already paid (no balance change)
                          if (txn.payment_method === "cash" || txn.payment_method === "bank") {
                            // Purchase was paid immediately, so no due amount
                          } else {
                            // Due payment - add to balance
                            runningBalance += txn.amount;
                          }
                        } else {
                          // Manual payment - subtract from balance
                          runningBalance -= txn.amount;
                        }

                        return (
                          <tr key={txn.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-900">
                              {formatDate(txn.date)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  txn.type === "purchase"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {txn.type === "purchase"
                                  ? "Purchase"
                                  : "Payment"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900">
                              {txn.item_name || "-"}
                              {txn.notes && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {txn.notes}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {txn.quantity
                                ? `${txn.quantity} ${txn.unit}`
                                : "-"}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm font-medium text-right ${
                                txn.type === "purchase"
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {txn.type === "purchase" ? "+" : "-"}
                              {formatCurrency(txn.amount)}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm font-bold text-right ${
                                runningBalance > 0
                                  ? "text-red-600"
                                  : runningBalance < 0
                                  ? "text-green-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {formatCurrency(Math.abs(runningBalance))}
                              {runningBalance > 0
                                ? " due"
                                : runningBalance < 0
                                ? " overpaid"
                                : ""}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {txn.type === "purchase" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditTransaction(txn)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteTransaction(txn)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
