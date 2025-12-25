"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditActivityExpensePage({
  params,
}: {
  params: { tenderId: string; activityId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [activityDate, setActivityDate] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("activity_expenses")
        .select("*")
        .eq("id", params.activityId)
        .single();

      if (error) throw error;

      if (data) {
        setActivityDate(data.expense_date);
        setDescription(data.description || "");
        setQuantity(data.quantity?.toString() || "");
        setUnit(data.unit || "");
        setRate(data.rate?.toString() || "");
        setAmount(data.amount?.toString() || "");
        setVendor(data.vendor || "");
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
        .from("activity_expenses")
        .update({
          expense_date: activityDate,
          description: description,
          quantity: quantity ? parseFloat(quantity) : null,
          unit: unit || null,
          rate: rate ? parseFloat(rate) : null,
          amount: parseFloat(amount),
          vendor: vendor || null,
          notes: notes || null,
        })
        .eq("id", params.activityId);

      if (error) throw error;

      router.push(`/tender/${params.tenderId}/activities`);
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
            href={`/tender/${params.tenderId}/activities`}
            className="text-blue-600 hover:text-blue-800"
          >
            â† à¦•à¦¾à¦œà¦­à¦¿à¦¤à§à¦¤à¦¿à¦• à¦–à¦°à¦š
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>à¦–à¦°à¦š à¦¸à¦®à§à¦ªà¦¾à¦¦à¦¨à¦¾</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-300 rounded p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label>à¦¤à¦¾à¦°à¦¿à¦– *</Label>
                <Input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>à¦¬à¦¿à¦¬à¦°à¦£ *</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="à¦–à¦°à¦šà§‡à¦° à¦¬à¦¿à¦¬à¦°à¦£"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>à¦ªà¦°à¦¿à¦®à¦¾à¦£</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="à§¦"
                  />
                </div>
                <div>
                  <Label>à¦à¦•à¦•</Label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="à¦¯à§‡à¦®à¦¨: à¦¦à¦¿à¦¨, à¦˜à¦£à§à¦Ÿà¦¾"
                  />
                </div>
                <div>
                  <Label>à¦°à§‡à¦Ÿ</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="à§¦"
                  />
                </div>
              </div>

              <div>
                <Label>à¦®à§‹à¦Ÿ à¦Ÿà¦¾à¦•à¦¾ *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="à§¦"
                  required
                />
              </div>

              <div>
                <Label>à¦¬à¦¿à¦•à§à¦°à§‡à¦¤à¦¾</Label>
                <Input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="à¦¬à¦¿à¦•à§à¦°à§‡à¦¤à¦¾à¦° à¦¨à¦¾à¦®"
                />
              </div>

              <div>
                <Label>à¦¨à§‹à¦Ÿ</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="à¦…à¦¤à¦¿à¦°à¦¿à¦•à§à¦¤ à¦¤à¦¥à§à¦¯..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "à¦¸à¦‚à¦°à¦•à§à¦·à¦£ à¦•à¦°à¦›à¦¿..." : "à¦¸à¦‚à¦°à¦•à§à¦·à¦£ à¦•à¦°à§à¦¨"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  à¦¬à¦¾à¦¤à¦¿à¦²
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

