"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TenderSettingsPage({
  params,
}: {
  params: { tenderId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!password) {
      setError("পাসওয়ার্ড লিখুন");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Verify password
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !user.email) {
        setError("ব্যবহারকারী পাওয়া যায়নি");
        setLoading(false);
        return;
      }

      // Try to sign in with password to verify
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        setError("পাসওয়ার্ড ভুল হয়েছে");
        setLoading(false);
        return;
      }

      // Delete tender
      const { error: deleteError } = await supabase
        .from("tenders")
        .delete()
        .eq("id", params.tenderId);

      if (deleteError) {
        setError(deleteError.message);
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "টেন্ডার মুছতে সমস্যা হয়েছে");
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
            <CardTitle>টেন্ডার সেটিংস</CardTitle>
            <p className="text-sm text-gray-600">
              টেন্ডার ম্যানেজমেন্ট এবং বিপজ্জনক কাজ
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Danger Zone */}
            <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
              <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                <span>⚠️</span>
                বিপজ্জনক এলাকা
              </h3>
              <p className="text-sm text-red-700 mb-4">
                এই কাজগুলো অপরিবর্তনীয়। সাবধানে এগিয়ে যান।
              </p>

              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  টেন্ডার মুছে ফেলুন
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white border-2 border-red-300 rounded-lg p-4">
                    <h4 className="font-bold text-red-900 mb-2">
                      আপনি কি নিশ্চিত?
                    </h4>
                    <p className="text-sm text-red-700 mb-4">
                      এই টেন্ডার এবং এর সাথে সম্পর্কিত সব ডেটা (শ্রমিক, মালামাল,
                      খরচ, অগ্রিম ইত্যাদি) স্থায়ীভাবে মুছে যাবে। এই কাজ আর
                      ফিরিয়ে আনা যাবে না।
                    </p>

                    {error && (
                      <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
                        <p className="text-red-800 text-sm">{error}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="password" className="text-red-900">
                          নিশ্চিত করতে আপনার পাসওয়ার্ড লিখুন *
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="পাসওয়ার্ড"
                          disabled={loading}
                          className="border-red-300"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleDelete}
                          disabled={loading || !password}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {loading ? "মুছছি..." : "হ্যাঁ, মুছে ফেলুন"}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setPassword("");
                            setError("");
                          }}
                          variant="outline"
                          disabled={loading}
                        >
                          না, বাতিল করুন
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Other Settings (Future) */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                সাধারণ সেটিংস
              </h3>
              <p className="text-sm text-gray-600">
                টেন্ডার নাম, লোকেশন ইত্যাদি পরিবর্তন করার অপশন শীঘ্রই আসছে...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
