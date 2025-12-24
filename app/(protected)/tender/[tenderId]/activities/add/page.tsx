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

export default function AddActivityPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [showMiniBOQ, setShowMiniBOQ] = useState(false);

  const [formData, setFormData] = useState({
    activityDate: new Date().toISOString().split("T")[0],
    categoryId: "",
    subcategoryId: "",
    description: "",
    quantity: "",
    unit: "",
    rate: "",
    amount: "",
    vendor: "",
    paymentMethod: "cash",
    paymentRef: "",
    notes: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("expense_categories")
      .select("*")
      .eq("is_active", true)
      .order("name_bn");

    if (data) setCategories(data);
  };

  const loadSubcategories = async (categoryId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("expense_subcategories")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .order("name_bn");

    if (data) setSubcategories(data);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "categoryId") {
      loadSubcategories(value);
      setFormData((prev) => ({
        ...prev,
        categoryId: value,
        subcategoryId: "",
      }));
    }

    // Auto-calculate amount from mini-BOQ
    if (name === "quantity" || name === "rate") {
      const qty =
        name === "quantity" ? parseFloat(value) : parseFloat(formData.quantity);
      const rate =
        name === "rate" ? parseFloat(value) : parseFloat(formData.rate);

      if (qty && rate) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          amount: (qty * rate).toFixed(2),
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
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

      if (!formData.amount) {
        setError("পরিমাণ আবশ্যক");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("activity_expenses")
        .insert({
          tender_id: params.tenderId,
          activity_date: formData.activityDate,
          category_id: formData.categoryId,
          subcategory_id: formData.subcategoryId || null,
          description: formData.description,
          quantity: formData.quantity ? parseFloat(formData.quantity) : null,
          unit: formData.unit || null,
          rate: formData.rate ? parseFloat(formData.rate) : null,
          amount: parseFloat(formData.amount),
          vendor: formData.vendor || null,
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

      router.push(`/tender/${params.tenderId}/activities`);
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
            <CardTitle>কাজের খরচ যোগ করুন</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="activityDate">{labels.date} *</Label>
                <Input
                  id="activityDate"
                  name="activityDate"
                  type="date"
                  value={formData.activityDate}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="categoryId">{labels.category} *</Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  required
                  disabled={loading}
                >
                  <option value="">নির্বাচন করুন</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_bn}
                    </option>
                  ))}
                </select>
              </div>

              {formData.categoryId && (
                <div>
                  <Label htmlFor="subcategoryId">{labels.subcategory}</Label>
                  <select
                    id="subcategoryId"
                    name="subcategoryId"
                    value={formData.subcategoryId}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    disabled={loading}
                  >
                    <option value="">নির্বাচন করুন</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name_bn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label htmlFor="description">{labels.description} *</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="বিস্তারিত বিবরণ"
                  required
                  disabled={loading}
                />
              </div>

              {/* Mini-BOQ Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowMiniBOQ(!showMiniBOQ)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showMiniBOQ ? "− মিনি-BOQ লুকান" : "+ মিনি-BOQ যোগ করুন"}
                </button>
              </div>

              {showMiniBOQ && (
                <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="quantity">{labels.quantity}</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        step="0.001"
                        value={formData.quantity}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">{labels.unit}</Label>
                      <Input
                        id="unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        placeholder="ঘণ্টা/দিন"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rate">{labels.rate}</Label>
                      <Input
                        id="rate"
                        name="rate"
                        type="number"
                        step="0.01"
                        value={formData.rate}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="amount">{labels.amount} *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="vendor">{labels.vendor}</Label>
                <Input
                  id="vendor"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  placeholder="বিক্রেতার নাম"
                  disabled={loading}
                />
              </div>

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
