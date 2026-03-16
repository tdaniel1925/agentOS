/**
 * Rep Dashboard
 * Shows rep's subscribers, MRR, and signup link
 * Commission calculation happens on Apex side
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function RepDashboardPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get rep record from agentos_reps - using untyped query
  const repResult: any = await (supabase as any)
    .from('agentos_reps')
    .select('*')
    .eq('email', user.email)
    .single()

  const rep = repResult.data

  if (!rep) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1B3A7D] to-[#0F2347] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1B3A7D]/10 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[#1B3A7D]">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#1B3A7D] mb-3">
            Rep Access Required
          </h1>
          <p className="text-gray-600 mb-2">
            Your account is not registered as a rep in the system.
          </p>
          <p className="text-sm text-gray-500">
            Contact support if you believe this is an error.
          </p>
        </div>
      </div>
    )
  }

  if (!rep.active) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1B3A7D] to-[#0F2347] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[#C7181F]">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m15 9-6 6"></path>
              <path d="m9 9 6 6"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#C7181F] mb-3">
            Account Inactive
          </h1>
          <p className="text-gray-600 mb-2">
            Your rep account has been deactivated.
          </p>
          <p className="text-sm text-gray-500">
            Contact your upline or Apex support for details.
          </p>
        </div>
      </div>
    )
  }

  // Get rep's subscribers - using untyped query
  const subscribersResult: any = await (supabase as any)
    .from('subscribers')
    .select(`
      id,
      business_name,
      current_mrr,
      status,
      created_at,
      feature_flags (
        feature_name,
        enabled
      )
    `)
    .eq('rep_code', rep.apex_rep_code)
    .order('created_at', { ascending: false })

  const subscribers = subscribersResult.data

  const activeSubscribers = subscribers?.filter((s: any) => s.status === 'active') || []
  const totalMRR = activeSubscribers.reduce((sum: number, s: any) => sum + (s.current_mrr || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1B3A7D] to-[#2A4A8D] rounded-lg flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1B3A7D]">
                  {rep.name}
                </h1>
                <p className="text-sm text-gray-500">
                  Rep Code: <span className="font-medium text-gray-700">{rep.apex_rep_code}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-[#C7181F] font-medium transition-colors"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                Active Subscribers
              </span>
              <div className="w-12 h-12 bg-[#1B3A7D]/10 rounded-xl flex items-center justify-center text-[#1B3A7D]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-[#1B3A7D]">
              {activeSubscribers.length}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                Total MRR
              </span>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" x2="12" y1="2" y2="22"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-green-600">
              ${totalMRR.toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1B3A7D] to-[#2A4A8D] rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white/80 uppercase tracking-wide">
                Commission
              </span>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M3 3v18h18"></path>
                  <path d="m19 9-5 5-4-4-3 3"></path>
                </svg>
              </div>
            </div>
            <div className="text-xl font-bold text-white/90 mb-2">
              See Apex Portal
            </div>
            <a
              href="https://reachtheapex.net"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors group"
            >
              reachtheapex.net
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Subscriber List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-5 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-900">
              My Subscribers
            </h2>
            <Link
              href="/demos/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C7181F] hover:bg-[#A01419] text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Send Demo
            </Link>
          </div>

          {subscribers && subscribers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Business
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Plan
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">
                      MRR
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscribers.map((sub: any) => {
                    const activeSkills = sub.feature_flags
                      ?.filter((f: any) => f.enabled)
                      ?.map((f: any) => f.feature_name) || []

                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{sub.business_name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {new Date(sub.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-3 py-1 bg-[#1B3A7D]/10 text-[#1B3A7D] text-xs font-medium rounded-full">
                              Base
                            </span>
                            {activeSkills.map((skill: string) => (
                              <span
                                key={skill}
                                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize"
                              >
                                {skill.replace(/-/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">${sub.current_mrr}</span>
                          <span className="text-gray-500">/mo</span>
                        </td>
                        <td className="px-6 py-4">
                          {sub.status === 'active' ? (
                            <div className="flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-600">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="m9 12 2 2 4-4"></path>
                              </svg>
                              <span className="text-sm font-medium text-green-700">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-600">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="m15 9-6 6"></path>
                                <path d="m9 9 6 6"></path>
                              </svg>
                              <span className="text-sm font-medium text-red-700 capitalize">{sub.status}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-400">
                  <path d="M12 8V4H8"></path>
                  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                  <path d="M2 14h2"></path>
                  <path d="M20 14h2"></path>
                  <path d="M15 13v2"></path>
                  <path d="M9 13v2"></path>
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-1">No subscribers yet</p>
              <p className="text-sm text-gray-500 mb-4">Send demos to start building your client base</p>
              <Link
                href="/demos/new"
                className="inline-flex items-center gap-2 text-sm text-[#1B3A7D] font-medium hover:underline"
              >
                Send your first demo
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* My Signup Link */}
        <div className="bg-gradient-to-br from-[#1B3A7D] to-[#2A4A8D] rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </div>
            <h2 className="font-bold text-xl">
              My Signup Link
            </h2>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
            <code className="text-sm text-white/90 font-mono block break-all">
              https://reachtheapex.net/join/{rep.apex_rep_code}
            </code>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `https://reachtheapex.net/join/${rep.apex_rep_code}`
                )
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#1B3A7D] font-bold rounded-lg hover:bg-white/90 transition-all shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
              Copy Link
            </button>
            <Link
              href="/demos/share"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect width="5" height="5" x="3" y="3" rx="1"></rect>
                <rect width="5" height="5" x="16" y="3" rx="1"></rect>
                <rect width="5" height="5" x="3" y="16" rx="1"></rect>
                <rect width="5" height="5" x="16" y="16" rx="1"></rect>
              </svg>
              QR Code
            </Link>
          </div>

          <p className="text-sm text-white/80 leading-relaxed">
            Share this link with prospects. When they sign up, they'll automatically be assigned to you and you'll earn commission on their subscription.
          </p>
        </div>

      </main>
    </div>
  )
}
