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

export default function CashExpensePage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split("T")[0],
    categoryId: "",
    subcategoryId: "",
    description: "",
    amount: "",
    vendor: "",
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

      // Insert as activity expense with cash payment
      const { error: insertError } = await supabase
        .from("activity_expenses")
        .insert({
          tender_id: params.tenderId,
          activity_date: formData.expenseDate,
          category_id: formData.categoryId,
          subcategory_id: formData.subcategoryId || null,
          description: formData.description,
          amount: parseFloat(formData.amount),
          vendor: formData.vendor || null,
          payment_method: "cash",
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
            <CardTitle>নগদ খরচ (সরাসরি)</CardTitle>
            <p className="text-sm text-gray-600">
              অগ্রিম ছাড়া সরাসরি নগদ খরচ - দৈনিক সাইট খরচের জন্য
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 এই খরচ সরাসরি নগদে পরিশোধ করা হয়েছে এবং কাজের খরচ হিসেবে
                  রেকর্ড হবে। কোন ব্যক্তির অগ্রিম থেকে কাটা হবে না।
                </p>
              </div>

              <div>
                <Label htmlFor="expenseDate">{labels.date} *</Label>
                <Input
                  id="expenseDate"
                  name="expenseDate"
                  type="date"
                  value={formData.expenseDate}
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
                  placeholder="বিক্রেতার নাম (ঐচ্ছিক)"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="paymentRef">পেমেন্ট রেফারেন্স</Label>
                <Input
                  id="paymentRef"
                  name="paymentRef"
                  value={formData.paymentRef}
                  onChange={handleChange}
                  placeholder="রশিদ নম্বর বা রেফারেন্স (ঐচ্ছিক)"
                  disabled={loading}
                />
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
