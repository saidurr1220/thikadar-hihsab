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

export default function AddLaborPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [laborType, setLaborType] = useState<"contract" | "daily">("contract");
  const [workTypes, setWorkTypes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    crewName: "",
    workTypeId: "",
    workTypeCustom: "",
    laborName: "",
    headcount: "",
    khorakiRatePerHead: "",
    khorakiTotal: "",
    wageTotal: "",
    notes: "",
  });

  useEffect(() => {
    loadWorkTypes();
  }, []);

  const loadWorkTypes = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("work_types")
      .select("*")
      .eq("is_active", true)
      .order("name_bn");

    if (data) setWorkTypes(data);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-calculate khoraki total
    if (name === "headcount" || name === "khorakiRatePerHead") {
      const headcount =
        name === "headcount"
          ? parseFloat(value)
          : parseFloat(formData.headcount);
      const rate =
        name === "khorakiRatePerHead"
          ? parseFloat(value)
          : parseFloat(formData.khorakiRatePerHead);

      if (headcount && rate) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          khorakiTotal: (headcount * rate).toString(),
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

      // Validation
      if (laborType === "contract" && !formData.crewName) {
        setError("দলের নাম আবশ্যক");
        setLoading(false);
        return;
      }

      if (!formData.khorakiTotal && !formData.wageTotal) {
        setError("খোরাকি বা মজুরি অন্তত একটি প্রয়োজন");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("labor_entries")
        .insert({
          tender_id: params.tenderId,
          entry_date: formData.entryDate,
          labor_type: laborType,
          crew_name: laborType === "contract" ? formData.crewName : null,
          work_type_id: formData.workTypeId || null,
          work_type_custom: formData.workTypeCustom || null,
          labor_name: laborType === "daily" ? formData.laborName : null,
          headcount: formData.headcount ? parseInt(formData.headcount) : null,
          khoraki_rate_per_head: formData.khorakiRatePerHead
            ? parseFloat(formData.khorakiRatePerHead)
            : null,
          khoraki_total: formData.khorakiTotal
            ? parseFloat(formData.khorakiTotal)
            : null,
          wage_total: formData.wageTotal
            ? parseFloat(formData.wageTotal)
            : null,
          notes: formData.notes || null,
          created_by: user.id,
        });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push(`/tender/${params.tenderId}/labor`);
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
            <CardTitle>শ্রমিক এন্ট্রি যোগ করুন</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Labor Type Tabs */}
              <div className="flex gap-2 border-b">
                <button
                  type="button"
                  onClick={() => setLaborType("contract")}
                  className={`px-4 py-2 font-medium ${
                    laborType === "contract"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {labels.contract}
                </button>
                <button
                  type="button"
                  onClick={() => setLaborType("daily")}
                  className={`px-4 py-2 font-medium ${
                    laborType === "daily"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {labels.daily}
                </button>
              </div>

              {/* Date */}
              <div>
                <Label htmlFor="entryDate">{labels.date} *</Label>
                <Input
                  id="entryDate"
                  name="entryDate"
                  type="date"
                  value={formData.entryDate}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {/* Contract Fields */}
              {laborType === "contract" && (
                <>
                  <div>
                    <Label htmlFor="crewName">{labels.crewName} *</Label>
                    <Input
                      id="crewName"
                      name="crewName"
                      value={formData.crewName}
                      onChange={handleChange}
                      placeholder="করিম দল"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {/* Daily Fields */}
              {laborType === "daily" && (
                <div>
                  <Label htmlFor="laborName">{labels.laborName}</Label>
                  <Input
                    id="laborName"
                    name="laborName"
                    value={formData.laborName}
                    onChange={handleChange}
                    placeholder="শ্রমিকের নাম (ঐচ্ছিক)"
                    disabled={loading}
                  />
                </div>
              )}

              {/* Work Type */}
              <div>
                <Label htmlFor="workTypeId">{labels.workType}</Label>
                <select
                  id="workTypeId"
                  name="workTypeId"
                  value={formData.workTypeId}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  disabled={loading}
                >
                  <option value="">নির্বাচন করুন</option>
                  {workTypes.map((wt) => (
                    <option key={wt.id} value={wt.id}>
                      {wt.name_bn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Headcount */}
              <div>
                <Label htmlFor="headcount">{labels.headcount}</Label>
                <Input
                  id="headcount"
                  name="headcount"
                  type="number"
                  value={formData.headcount}
                  onChange={handleChange}
                  placeholder="১২"
                  disabled={loading}
                />
              </div>

              {/* Khoraki */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="khorakiRatePerHead">
                    {labels.khorakiPerHead}
                  </Label>
                  <Input
                    id="khorakiRatePerHead"
                    name="khorakiRatePerHead"
                    type="number"
                    step="0.01"
                    value={formData.khorakiRatePerHead}
                    onChange={handleChange}
                    placeholder="৩০০"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="khorakiTotal">{labels.khorakiTotal}</Label>
                  <Input
                    id="khorakiTotal"
                    name="khorakiTotal"
                    type="number"
                    step="0.01"
                    value={formData.khorakiTotal}
                    onChange={handleChange}
                    placeholder="৩৬০০"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Wage */}
              <div>
                <Label htmlFor="wageTotal">{labels.wageTotal}</Label>
                <Input
                  id="wageTotal"
                  name="wageTotal"
                  type="number"
                  step="0.01"
                  value={formData.wageTotal}
                  onChange={handleChange}
                  placeholder="৪০০০"
                  disabled={loading}
                />
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
                  placeholder="অতিরিক্ত তথ্য..."
                  disabled={loading}
                />
              </div>

              {/* Total Display */}
              {(formData.khorakiTotal || formData.wageTotal) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold">
                    মোট: ৳{" "}
                    {(
                      (parseFloat(formData.khorakiTotal) || 0) +
                      (parseFloat(formData.wageTotal) || 0)
                    ).toFixed(2)}
                  </p>
                </div>
              )}

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
