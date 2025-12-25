"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditMaterialPurchasePage({
  params,
}: {
  params: { tenderId: string; purchaseId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [purchaseDate, setPurchaseDate] = useState("");
  const [customItemName, setCustomItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [supplier, setSupplier] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadPurchase();
  }, []);

  const loadPurchase = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("material_purchases")
        .select("*")
        .eq("id", params.purchaseId)
        .single();

      if (error) throw error;

      if (data) {
        setPurchaseDate(data.purchase_date);
        setCustomItemName(data.custom_item_name || "");
        setQuantity(data.quantity?.toString() || "");
        setUnit(data.unit || "");
        setSupplier(data.supplier || "");
        setTotalAmount(data.total_amount?.toString() || "");
        setNotes(data.notes || "");
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("material_purchases")
        .update({
          purchase_date: purchaseDate,
          custom_item_name: customItemName,
          quantity: parseFloat(quantity),
          unit: unit,
          supplier: supplier || null,
          total_amount: parseFloat(totalAmount),
          notes: notes || null,
        })
        .eq("id", params.purchaseId);

      if (error) throw error;

      router.push(`/tender/${params.tenderId}/materials`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/tender/${params.tenderId}/materials`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← মালামাল রেজিস্টার
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>মালামাল ক্রয় সম্পাদনা</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-300 rounded p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label>তারিখ *</Label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>মালামালের নাম *</Label>
                <Input
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="যেমন: সিমেন্ট, বালু, রড"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>পরিমাণ *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="০"
                    required
                  />
                </div>
                <div>
                  <Label>একক *</Label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="যেমন: বস্তা, CFT"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>সরবরাহকারী</Label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="সরবরাহকারীর নাম"
                />
              </div>

              <div>
                <Label>মোট টাকা *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="০"
                  required
                />
              </div>

              <div>
                <Label>নোট</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="অতিরিক্ত তথ্য..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "সংরক্ষণ করছি..." : "সংরক্ষণ করুন"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  বাতিল
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
