"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("পাসওয়ার্ড মিলছে না");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          role: "viewer", // Default role
          is_active: true,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError("রেজিস্ট্রেশন করতে সমস্যা হয়েছে");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            রেজিস্ট্রেশন সফল!
          </h2>
          <p className="text-gray-600 mb-4">
            আপনার অ্যাকাউন্ট তৈরি হয়েছে। লগইন পেজে redirect হচ্ছে...
          </p>
          <p className="text-sm text-gray-500">
            Admin আপনার অ্যাকাউন্ট approve করলে আপনি সম্পূর্ণ access পাবেন।
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              নতুন অ্যাকাউন্ট তৈরি করুন
            </h1>
            <p className="text-gray-600">থিকাদারি হিসাব</p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                পূর্ণ নাম *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="মোঃ করিম"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ইমেইল *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="karim@example.com"
                disabled={loading}
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ফোন নম্বর
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="01712345678"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                পাসওয়ার্ড *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="কমপক্ষে ৬ অক্ষর"
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                পাসওয়ার্ড নিশ্চিত করুন *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="পাসওয়ার্ড আবার লিখুন"
                disabled={loading}
              />
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
            >
              {loading ? "রেজিস্টার হচ্ছে..." : "রেজিস্টার করুন"}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                লগইন করুন
              </Link>
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
