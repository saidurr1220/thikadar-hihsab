import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Get user's tenders
  const { data: assignments } = await supabase
    .from("tender_assignments")
    .select(
      `
      *,
      tenders (
        id,
        tender_code,
        project_name,
        location,
        is_active
      )
    `
    )
    .eq("user_id", user.id);

  const tenders = assignments?.map((a) => a.tenders).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🏗️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  থিকাদারি হিসাব
                </h1>
                <p className="text-sm text-gray-600">
                  স্বাগতম, {profile.full_name}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {(profile.role === "owner" || profile.role === "admin") && (
                <Link
                  href="/admin/tenders/create"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  + নতুন টেন্ডার
                </Link>
              )}
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  লগআউট
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">📊</span>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                মোট
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{tenders.length}</p>
            <p className="text-sm text-gray-600">টেন্ডার</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">✅</span>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                সক্রিয়
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {tenders.filter((t: any) => t.is_active).length}
            </p>
            <p className="text-sm text-gray-600">চলমান প্রকল্প</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">👤</span>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded capitalize">
                {profile.role}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {profile.full_name}
            </p>
            <p className="text-sm text-gray-600">আপনার ভূমিকা</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">🎯</span>
            </div>
            <p className="text-2xl font-bold">সব ঠিক আছে!</p>
            <p className="text-sm text-blue-100">সিস্টেম চলছে</p>
          </div>
        </div>

        {/* Tenders Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                আপনার টেন্ডার সমূহ
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                সব প্রকল্প এক জায়গায়
              </p>
            </div>
            {(profile.role === "owner" || profile.role === "admin") && (
              <Link
                href="/admin/tenders/create"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
              >
                <span>+ নতুন টেন্ডার</span>
              </Link>
            )}
          </div>

          {tenders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                কোন টেন্ডার নেই
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                আপনাকে এখনও কোন টেন্ডারে assign করা হয়নি। নতুন প্রকল্প শুরু
                করুন।
              </p>
              {(profile.role === "owner" || profile.role === "admin") && (
                <Link
                  href="/admin/tenders/create"
                  className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  প্রথম টেন্ডার তৈরি করুন
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenders.map((tender: any) => (
                <Link
                  key={tender.id}
                  href={`/tender/${tender.id}`}
                  className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-xl p-6 hover:border-blue-300 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {tender.project_name}
                      </h3>
                      <p className="text-sm text-gray-600 font-mono">
                        {tender.tender_code}
                      </p>
                    </div>
                    {tender.is_active ? (
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                        সক্রিয়
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                        বন্ধ
                      </span>
                    )}
                  </div>
                  {tender.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <span>📍</span>
                      <span>{tender.location}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                      বিস্তারিত দেখুন
                    </span>
                    <span className="text-blue-600 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/docs"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
              📚
            </div>
            <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              ডকুমেন্টেশন
            </h3>
            <p className="text-sm text-gray-600">
              সম্পূর্ণ সিস্টেম গাইড এবং সাহায্য
            </p>
          </Link>

          <a
            href="https://supabase.com/dashboard/project/qrnbpeowkkinjfksxavz"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-green-300 hover:shadow-lg transition-all group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
              🗄️
            </div>
            <h3 className="font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
              Database
            </h3>
            <p className="text-sm text-gray-600">Supabase dashboard খুলুন</p>
          </a>

          <Link
            href="/settings/profile"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-purple-300 hover:shadow-lg transition-all group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
              ⚙️
            </div>
            <h3 className="font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
              সেটিংস
            </h3>
            <p className="text-sm text-gray-600">প্রোফাইল এবং preferences</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
