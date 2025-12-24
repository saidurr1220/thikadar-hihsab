"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labels } from "@/lib/utils/bangla";

export default function AddMaterialPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isBulk, setIsBulk] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    purchaseDate: new Date().toISOString().split("T")[0],
    materialId: "",
    customItemName: "",
    unit: "",
    quantity: "",
    unitRate: "",
    totalAmount: "",
    // Bulk breakdown
    baseRatePerCft: "",
    qtyCft: "",
    transportVaraCost: "",
    unloadRatePerCft: "",
    baseCost: "",
    unloadCost: "",
    // Common
    supplier: "",
    paymentMethod: "cash",
    paymentRef: "",
    notes: "",
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("materials")
      .select("*")
      .eq("is_active", true)
      .order("name_bn");

    if (data) setMaterials(data);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-calculate for regular purchase
    if (!isBulk) {
      if (name === "quantity" || name === "unitRate") {
        const qty =
          name === "quantity"
            ? parseFloat(value)
            : parseFloat(formData.quantity);
        const rate =
          name === "unitRate"
            ? parseFloat(value)
            : parseFloat(formData.unitRate);

        if (qty && rate) {
          setFormData((prev) => ({
            ...prev,
            [name]: value,
            totalAmount: (qty * rate).toFixed(2),
          }));
        } else {
          setFormData((prev) => ({ ...prev, [name]: value }));
        }
      }
    }

    // Auto-calculate for bulk breakdown
    if (isBulk) {
      if (
        name === "qtyCft" ||
        name === "baseRatePerCft" ||
        name === "transportVaraCost" ||
        name === "unloadRatePerCft"
      ) {
        const qty =
          name === "qtyCft" ? parseFloat(value) : parseFloat(formData.qtyCft);
        const baseRate =
          name === "baseRatePerCft"
            ? parseFloat(value)
            : parseFloat(formData.baseRatePerCft);
        const transport =
          name === "transportVaraCost"
            ? parseFloat(value)
            : parseFloat(formData.transportVaraCost);
        const unloadRate =
          name === "unloadRatePerCft"
            ? parseFloat(value)
            : parseFloat(formData.unloadRatePerCft);

        if (qty && baseRate) {
          const baseCost = qty * baseRate;
          const unloadCost = qty * (unloadRate || 0);
          const total = baseCost + (transport || 0) + unloadCost;

          setFormData((prev) => ({
            ...prev,
            [name]: value,
            baseCost: baseCost.toFixed(2),
            unloadCost: unloadCost.toFixed(2),
            totalAmount: total.toFixed(2),
          }));
        } else {
          setFormData((prev) => ({ ...prev, [name]: value }));
        }
      }
    }

    // Auto-fill unit when material selected
    if (name === "materialId") {
      const material = materials.find((m) => m.id === value);
      if (material) {
        setFormData((prev) => ({
          ...prev,
          materialId: value,
          unit: material.unit,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("আপনি লগইন করা নেই");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("material_purchases")
        .insert({
          tender_id: params.tenderId,
          purchase_date: formData.purchaseDate,
          material_id: formData.materialId || null,
          custom_item_name: formData.customItemName || null,
          unit: formData.unit,
          quantity: parseFloat(formData.quantity),
          unit_rate: parseFloat(formData.unitRate),
          total_amount: parseFloat(formData.totalAmount),
          is_bulk_breakdown: isBulk,
          base_rate_per_cft:
            isBulk && formData.baseRatePerCft
              ? parseFloat(formData.baseRatePerCft)
              : null,
          qty_cft:
            isBulk && formData.qtyCft ? parseFloat(formData.qtyCft) : null,
          transport_vara_cost:
            isBulk && formData.transportVaraCost
              ? parseFloat(formData.transportVaraCost)
              : null,
          unload_rate_per_cft:
            isBulk && formData.unloadRatePerCft
              ? parseFloat(formData.unloadRatePerCft)
              : null,
          base_cost:
            isBulk && formData.baseCost ? parseFloat(formData.baseCost) : null,
          unload_cost:
            isBulk && formData.unloadCost
              ? parseFloat(formData.unloadCost)
              : null,
          supplier: formData.supplier || null,
          payment_method: formData.paymentMethod as any,
          payment_ref: formData.paymentRef || null,
          notes: formData.notes || null,
          created_by: user.id,
        });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push(`/tender/${params.tenderId}/materials`);
    } catch (err) {
      setError("এন্ট্রি যোগ করতে সমস্যা হয়েছে");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← টেন্ডার ড্যাশবোর্ড
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>মালামাল ক্রয় যোগ করুন</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Purchase Type Toggle */}
              <div className="flex gap-2 border-b">
                <button
                  type="button"
                  onClick={() => setIsBulk(false)}
                  className={`px-4 py-2 font-medium ${
                    !isBulk
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  সাধারণ
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulk(true)}
                  className={`px-4 py-2 font-medium ${
                    isBulk
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {labels.bulkBreakdown} (বালু/পাথর)
                </button>
              </div>

              {/* Date */}
              <div>
                <Label htmlFor="purchaseDate">{labels.date} *</Label>
                <Input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {/* Material Selection */}
              <div>
                <Label htmlFor="materialId">{labels.item}</Label>
                <select
                  id="materialId"
                  name="materialId"
                  value={formData.materialId}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  disabled={loading}
                >
                  <option value="">নির্বাচন করুন</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name_bn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Item Name */}
              {!formData.materialId && (
                <div>
                  <Label htmlFor="customItemName">কাস্টম আইটেম নাম</Label>
                  <Input
                    id="customItemName"
                    name="customItemName"
                    value={formData.customItemName}
                    onChange={handleChange}
                    placeholder="আইটেমের নাম লিখুন"
                    disabled={loading}
                  />
                </div>
              )}

              {!isBulk ? (
                /* Regular Purchase Fields */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">{labels.quantity} *</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        step="0.001"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">{labels.unit} *</Label>
                      <Input
                        id="unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        required
                        placeholder="ব্যাগ/কেজি/ঘনফুট"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unitRate">{labels.rate} *</Label>
                      <Input
                        id="unitRate"
                        name="unitRate"
                        type="number"
                        step="0.01"
                        value={formData.unitRate}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalAmount">{labels.total} *</Label>
                      <Input
                        id="totalAmount"
                        name="totalAmount"
                        type="number"
                        step="0.01"
                        value={formData.totalAmount}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Bulk Breakdown Fields */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="qtyCft">পরিমাণ (ঘনফুট) *</Label>
                      <Input
                        id="qtyCft"
                        name="qtyCft"
                        type="number"
                        step="0.001"
                        value={formData.qtyCft}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="baseRatePerCft">দর (প্রতি ঘনফুট) *</Label>
                      <Input
                        id="baseRatePerCft"
                        name="baseRatePerCft"
                        type="number"
                        step="0.01"
                        value={formData.baseRatePerCft}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="transportVaraCost">
                      {labels.transportCost}
                    </Label>
                    <Input
                      id="transportVaraCost"
                      name="transportVaraCost"
                      type="number"
                      step="0.01"
                      value={formData.transportVaraCost}
                      onChange={handleChange}
                      placeholder="পরিবহন খরচ (লাম্পসাম)"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="unloadRatePerCft">
                      খালাস দর (প্রতি ঘনফুট)
                    </Label>
                    <Input
                      id="unloadRatePerCft"
                      name="unloadRatePerCft"
                      type="number"
                      step="0.01"
                      value={formData.unloadRatePerCft}
                      onChange={handleChange}
                      placeholder="৩-৪ টাকা"
                      disabled={loading}
                    />
                  </div>

                  {/* Breakdown Display */}
                  {formData.baseCost && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold">ব্রেকডাউন:</h4>
                      <div className="space-y-1 text-sm">
                        <p>মূল খরচ: ৳ {formData.baseCost}</p>
                        {formData.transportVaraCost && (
                          <p>পরিবহন: ৳ {formData.transportVaraCost}</p>
                        )}
                        {formData.unloadCost && (
                          <p>খালাস: ৳ {formData.unloadCost}</p>
                        )}
                        <p className="font-bold pt-2 border-t">
                          সর্বমোট: ৳ {formData.totalAmount}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Supplier */}
              <div>
                <Label htmlFor="supplier">{labels.supplier}</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="সরবরাহকারীর নাম"
                  disabled={loading}
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label htmlFor="paymentMethod">{labels.paymentMethod}</Label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  disabled={loading}
                >
                  <option value="cash">{labels.cash}</option>
                  <option value="bank">{labels.bank}</option>
                  <option value="mfs">{labels.mfs}</option>
                  <option value="advance">{labels.advance}</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">{labels.notes}</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? labels.loading : labels.save}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  {labels.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
