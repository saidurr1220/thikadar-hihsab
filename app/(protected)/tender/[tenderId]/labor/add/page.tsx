"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import { labels } from "@/lib/utils/bangla";

type LaborType = "contract" | "daily";

export default function AddLaborPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [laborType, setLaborType] = useState<LaborType>("contract");
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [showNewSubForm, setShowNewSubForm] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubPhone, setNewSubPhone] = useState("");
  const [newSubNotes, setNewSubNotes] = useState("");

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
    subcontractorId: "",
    paymentMethod: "cash",
    paymentRef: "",
  });

  useEffect(() => {
    loadWorkTypes();
    loadSubcontractors();
    const presetSub = searchParams.get("subcontractorId");
    const presetType = searchParams.get("laborType");
    if (presetSub) {
      setFormData((prev) => ({ ...prev, subcontractorId: presetSub }));
    }
    if (presetType === "daily" || presetType === "contract") {
      setLaborType(presetType);
    }
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

  const loadSubcontractors = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("subcontractors")
      .select("*")
      .eq("tender_id", params.tenderId)
      .eq("is_active", true)
      .order("name");
    if (data) setSubcontractors(data);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

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
      }
    }
  };

  const baseTotal =
    (parseFloat(formData.khorakiTotal) || 0) +
    (parseFloat(formData.wageTotal) || 0);
  const fee =
    formData.paymentMethod === "mfs" ? baseTotal * 0.0185 + 10 : 0;

  const handleCreateSubcontractor = async () => {
    if (!newSubName.trim()) {
      setError("Subcontractor name is required.");
      return;
    }
    const supabase = createClient();
    const { error: subError } = await supabase.from("subcontractors").insert({
      tender_id: params.tenderId,
      name: newSubName.trim(),
      phone: newSubPhone || null,
      notes: newSubNotes || null,
    });
    if (subError) {
      setError(subError.message);
      return;
    }
    setNewSubName("");
    setNewSubPhone("");
    setNewSubNotes("");
    setShowNewSubForm(false);
    loadSubcontractors();
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
        setError("Not authenticated.");
        setLoading(false);
        return;
      }
      if (laborType === "contract" && !formData.crewName) {
        setError("Crew name is required for contract labor.");
        setLoading(false);
        return;
      }
      if (!formData.khorakiTotal && !formData.wageTotal) {
        setError("Enter khoraki or wage amount.");
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
          subcontractor_id: formData.subcontractorId || null,
          payment_method: formData.paymentMethod || null,
          payment_ref: formData.paymentRef || null,
          created_by: user.id,
        });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push(`/tender/${params.tenderId}/labor`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
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
            Back to tender dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add labor entry</CardTitle>
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
                <div>
                  <Label htmlFor="crewName">{labels.crewName} *</Label>
                  <Input
                    id="crewName"
                    name="crewName"
                    value={formData.crewName}
                    onChange={handleChange}
                    placeholder="Crew / team name"
                    disabled={loading}
                  />
                </div>
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
                    placeholder="Worker name (optional)"
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
                  <option value="">Select work type</option>
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
                  placeholder="Headcount"
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
                    placeholder="Rate per head"
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
                    placeholder="Total khoraki"
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
                  placeholder="Wage total"
                  disabled={loading}
                />
              </div>

              {/* Subcontractor */}
              <div className="space-y-2">
                <Label htmlFor="subcontractorId">Subcontractor / Team</Label>
                <div className="flex gap-2">
                  <select
                    id="subcontractorId"
                    name="subcontractorId"
                    value={formData.subcontractorId}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    disabled={loading}
                  >
                    <option value="">Select subcontractor</option>
                    {subcontractors.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewSubForm((p) => !p)}
                    disabled={loading}
                  >
                    + New
                  </Button>
                </div>
                {showNewSubForm && (
                  <div className="space-y-2 rounded-md border border-gray-200 p-3 bg-white">
                    <Input
                      placeholder="Name"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      disabled={loading}
                    />
                    <Input
                      placeholder="Phone (optional)"
                      value={newSubPhone}
                      onChange={(e) => setNewSubPhone(e.target.value)}
                      disabled={loading}
                    />
                    <textarea
                      placeholder="Notes (optional)"
                      value={newSubNotes}
                      onChange={(e) => setNewSubNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      disabled={loading}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleCreateSubcontractor}
                        disabled={loading}
                      >
                        Save subcontractor
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowNewSubForm(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment method</Label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    disabled={loading}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="mfs">bKash / MFS</option>
                    <option value="advance">Advance</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="paymentRef">Payment ref (optional)</Label>
                  <Input
                    id="paymentRef"
                    name="paymentRef"
                    value={formData.paymentRef}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
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
                  placeholder="Notes"
                  disabled={loading}
                />
              </div>

              {/* Total Display */}
              {(formData.khorakiTotal || formData.wageTotal) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="font-semibold text-slate-800">
                    Base: {formatCurrency(baseTotal || 0)}
                  </div>
                  {fee > 0 && (
                    <div className="text-sm text-slate-700 mt-1">
                      bKash fee (1.85% + 10): {formatCurrency(fee)}
                    </div>
                  )}
                  <div className="text-sm text-slate-900 mt-1">
                    Your project cost: {formatCurrency(baseTotal + fee)}
                  </div>
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
