"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError("ইমেইল বা পাসওয়ার্ড ভুল হয়েছে");
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if user has profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, is_active")
          .eq("id", data.user.id)
          .single();

        if (!profile) {
          setError("ব্যবহারকারী প্রোফাইল পাওয়া যায়নি");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (!profile.is_active) {
          setError("আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("লগইন করতে সমস্যা হয়েছে");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              থিকাদারি হিসাব
            </h1>
            <p className="text-gray-600">Construction Contractor Accounting</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ইমেইল / ফোন
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@example.com"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                পাসওয়ার্ড
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "লগইন হচ্ছে..." : "লগইন করুন"}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              নতুন ব্যবহারকারী?{" "}
              <Link
                href="/signup"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                রেজিস্টার করুন
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-500 text-center mb-2">ডেমো লগইন:</p>
            <div className="bg-gray-50 rounded p-3 text-xs text-gray-600">
              <p>
                <strong>Email:</strong> admin@example.com
              </p>
              <p>
                <strong>Password:</strong> Admin@123
              </p>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              (প্রথমে Supabase এ user তৈরি করুন)
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← হোম পেজে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
