"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, User } from "lucide-react";

export default function AddPurchasePage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [purchaseType, setPurchaseType] = useState<"material" | "vendor">("material");
  const [isNewVendor, setIsNewVendor] = useState(false);
  
  const [formData, setFormData] = useState({
    purchaseDate: new Date().toISOString().split("T")[0],
    vendorId: "",
    newVendorName: "",
    newVendorPhone: "",
    newVendorCategory: "",
    materialId: "",
    customItemName: "",
    quantity: "",
    unit: "",
    unitRate: "",
    transportCost: "",
    unloadCost: "",
    totalAmount: "",
    paymentMethod: "cash" as "cash" | "bank" | "due",
    paymentRef: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();

    const [vendorsRes, materialsRes, categoriesRes] = await Promise.all([
      supabase
        .from("vendors")
        .select("*")
        .eq("tender_id", params.tenderId)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("materials")
        .select("*")
        .eq("is_active", true)
        .order("name_bn"),
      supabase
        .from("vendor_categories")
        .select("*")
        .eq("is_active", true)
        .order("name"),
    ]);

    setVendors(vendorsRes.data || []);
    setMaterials(materialsRes.data || []);
    setCategories(categoriesRes.data || []);
    setLoadingData(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-calculate total
    if (name === "quantity" || name === "unitRate" || name === "transportCost" || name === "unloadCost") {
      const qty = name === "quantity" ? parseFloat(value) : parseFloat(formData.quantity);
      const rate = name === "unitRate" ? parseFloat(value) : parseFloat(formData.unitRate);
      const transport = name === "transportCost" ? parseFloat(value || "0") : parseFloat(formData.transportCost || "0");
      const unload = name === "unloadCost" ? parseFloat(value || "0") : parseFloat(formData.unloadCost || "0");
      
      if (!isNaN(qty) && !isNaN(rate)) {
        const baseAmount = qty * rate;
        const totalWithCosts = baseAmount + transport + unload;
        setFormData((prev) => ({
          ...prev,
          totalAmount: totalWithCosts.toFixed(2),
        }));
      }
    }

    // Auto-fill unit from material
    if (name === "materialId" && value) {
      const material = materials.find((m) => m.id === value);
      if (material) {
        setFormData((prev) => ({
          ...prev,
          unit: material.unit || "",
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");

      let vendorId = formData.vendorId;

      // Create new vendor if needed
      if (isNewVendor && formData.newVendorName) {
        const { data: newVendor, error: vendorError } = await supabase
          .from("vendors")
          .insert({
            name: formData.newVendorName,
            phone: formData.newVendorPhone || null,
            category_id: formData.newVendorCategory || null,
            tender_id: params.tenderId,
            created_by: auth.user.id,
          })
          .select()
          .single();

        if (vendorError) throw vendorError;
        vendorId = newVendor.id;
      }

      if (purchaseType === "material") {
        // Create material purchase
        const { error: purchaseError } = await supabase
          .from("material_purchases")
          .insert({
            tender_id: params.tenderId,
            purchase_date: formData.purchaseDate,
            material_id: formData.materialId || null,
            custom_item_name: formData.customItemName || null,
            quantity: parseFloat(formData.quantity),
            unit: formData.unit,
            unit_rate: parseFloat(formData.unitRate),
            total_amount: parseFloat(formData.totalAmount),
            transport_vara_cost: formData.transportCost ? parseFloat(formData.transportCost) : null,
            unload_cost: formData.unloadCost ? parseFloat(formData.unloadCost) : null,
            vendor_id: vendorId || null,
            supplier: vendorId
              ? vendors.find((v) => v.id === vendorId)?.name
              : formData.newVendorName || null,
            payment_method: formData.paymentMethod,
            payment_ref: formData.paymentRef || null,
            notes: formData.notes || null,
            created_by: auth.user.id,
          });

        if (purchaseError) throw purchaseError;
      } else {
        // Create vendor purchase
        if (!vendorId) throw new Error("Vendor is required for vendor purchases");

        const { error: purchaseError } = await supabase
          .from("vendor_purchases")
          .insert({
            tender_id: params.tenderId,
            vendor_id: vendorId,
            purchase_date: formData.purchaseDate,
            item_name: formData.customItemName,
            quantity: parseFloat(formData.quantity),
            unit: formData.unit,
            unit_price: parseFloat(formData.unitRate),
            total_amount: parseFloat(formData.totalAmount),
            transport_vara_cost: formData.transportCost ? parseFloat(formData.transportCost) : null,
            payment_ref: formData.paymentRef || null,
            notes: formData.notes || null,
            created_by: auth.user.id,
          });

        if (purchaseError) throw purchaseError;
      }

      router.push(`/tender/${params.tenderId}/purchases`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}/purchases`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to purchases
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6 text-blue-600" />
              Add New Purchase
            </CardTitle>
            <p className="text-sm text-slate-600 mt-2">
              Record a new material or vendor purchase
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Purchase Type Selection */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Purchase Type</Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setPurchaseType("material")}
                    className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${
                      purchaseType === "material"
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-semibold mb-1">Material Purchase</div>
                    <div className="text-xs text-slate-600">
                      Sand, cement, bricks, etc.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseType("vendor")}
                    className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${
                      purchaseType === "vendor"
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-semibold mb-1">Vendor Item</div>
                    <div className="text-xs text-slate-600">
                      Other purchases from vendors
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div>
                  <Label htmlFor="purchaseDate">Purchase Date *</Label>
                  <Input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Vendor Selection */}
                <div>
                  <Label className="flex items-center justify-between">
                    <span>Vendor *</span>
                    <button
                      type="button"
                      onClick={() => setIsNewVendor(!isNewVendor)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <User className="h-3 w-3" />
                      {isNewVendor ? "Select Existing" : "Add New"}
                    </button>
                  </Label>
                  {isNewVendor ? (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Input
                        name="newVendorName"
                        placeholder="Vendor Name *"
                        value={formData.newVendorName}
                        onChange={handleChange}
                        required
                      />
                      <Input
                        name="newVendorPhone"
                        placeholder="Phone (optional)"
                        value={formData.newVendorPhone}
                        onChange={handleChange}
                      />
                      <select
                        name="newVendorCategory"
                        value={formData.newVendorCategory}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Category (optional)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name_bn || c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <select
                      id="vendorId"
                      name="vendorId"
                      value={formData.vendorId}
                      onChange={handleChange}
                      required={!isNewVendor}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select vendor...</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.phone ? `(${v.phone})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Item Details */}
              {purchaseType === "material" && (
                <div>
                  <Label htmlFor="materialId">Material</Label>
                  <select
                    id="materialId"
                    name="materialId"
                    value={formData.materialId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select material or enter custom below</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name_bn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(!formData.materialId || purchaseType === "vendor") && (
                <div>
                  <Label htmlFor="customItemName">
                    {purchaseType === "material" ? "Custom Item Name" : "Item Name *"}
                  </Label>
                  <Input
                    id="customItemName"
                    name="customItemName"
                    value={formData.customItemName}
                    onChange={handleChange}
                    placeholder="Enter item name"
                    required={purchaseType === "vendor" || !formData.materialId}
                  />
                </div>
              )}

              {/* Quantity and Unit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    placeholder="kg, bag, cft"
                  />
                </div>
                <div>
                  <Label htmlFor="unitRate">Unit Rate *</Label>
                  <Input
                    id="unitRate"
                    name="unitRate"
                    type="number"
                    step="0.01"
                    value={formData.unitRate}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Additional Costs */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Additional Costs (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transportCost">Transportation Cost</Label>
                    <Input
                      id="transportCost"
                      name="transportCost"
                      type="number"
                      step="0.01"
                      value={formData.transportCost}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unloadCost">Unload Cost</Label>
                    <Input
                      id="unloadCost"
                      name="unloadCost"
                      type="number"
                      step="0.01"
                      value={formData.unloadCost}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              <div>
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  required
                  className="text-lg font-semibold text-blue-600"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Base amount + transportation + unload costs
                </p>
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="due">Due/Credit</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="paymentRef">Payment Reference</Label>
                  <Input
                    id="paymentRef"
                    name="paymentRef"
                    value={formData.paymentRef}
                    onChange={handleChange}
                    placeholder="Check no, TxID, etc."
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Saving..." : "Save Purchase"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
