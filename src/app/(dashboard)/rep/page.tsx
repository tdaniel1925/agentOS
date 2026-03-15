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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1B3A7D] mb-4">
            Rep Access Required
          </h1>
          <p className="text-gray-600">
            Your account is not registered as a rep in the system.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Contact support if you believe this is an error.
          </p>
        </div>
      </div>
    )
  }

  if (!rep.active) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#C7181F] mb-4">
            Account Inactive
          </h1>
          <p className="text-gray-600">
            Your rep account has been deactivated.
          </p>
          <p className="text-sm text-gray-500 mt-2">
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
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1B3A7D' }}>
                {rep.name}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Rep Code: {rep.apex_rep_code}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white border rounded-xl p-6">
            <div className="text-sm text-gray-500 mb-1">
              Active Subscribers
            </div>
            <div className="text-4xl font-bold" style={{ color: '#1B3A7D' }}>
              {activeSubscribers.length}
            </div>
          </div>
          <div className="bg-white border rounded-xl p-6">
            <div className="text-sm text-gray-500 mb-1">
              Total MRR
            </div>
            <div className="text-4xl font-bold" style={{ color: '#1B3A7D' }}>
              ${totalMRR.toLocaleString()}
            </div>
          </div>
          <div className="bg-white border rounded-xl p-6">
            <div className="text-sm text-gray-500 mb-1">
              Commission
            </div>
            <div className="text-xl font-bold text-gray-400 mt-2">
              See Apex Portal
            </div>
            <a
              href="https://reachtheapex.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:underline mt-0.5 inline-block"
            >
              reachtheapex.net →
            </a>
          </div>
        </div>

        {/* Subscriber List */}
        <div className="bg-white border rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="font-semibold text-sm">
              My Subscribers
            </h2>
            <a
              href="/demos/new"
              className="text-xs px-4 py-2 rounded-lg text-white font-medium hover:opacity-90"
              style={{ backgroundColor: '#1B3A7D' }}
            >
              + Send Demo
            </a>
          </div>

          {subscribers && subscribers.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">
                    Business
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">
                    Plan
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">
                    MRR
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub: any) => {
                  const activeSkills = sub.feature_flags
                    ?.filter((f: any) => f.enabled)
                    ?.map((f: any) => f.feature_name) || []

                  return (
                    <tr
                      key={sub.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium">
                        {sub.business_name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            Base
                          </span>
                          {activeSkills.map((skill: string) => (
                            <span
                              key={skill}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full capitalize"
                            >
                              {skill.replace(/-/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        ${sub.current_mrr}/mo
                      </td>
                      <td className="px-6 py-4">
                        {sub.status === 'active' ? (
                          <span className="text-green-600 text-sm">
                            🟢 Active
                          </span>
                        ) : (
                          <span className="text-red-500 text-sm capitalize">
                            🔴 {sub.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-sm mb-4">No subscribers yet</p>
              <a
                href="/demos/new"
                className="inline-block text-sm underline"
                style={{ color: '#1B3A7D' }}
              >
                Send your first demo →
              </a>
            </div>
          )}
        </div>

        {/* My Signup Link */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-sm mb-4">
            My Signup Link
          </h2>
          <div className="flex items-center gap-3">
            <code className="text-sm bg-gray-50 px-4 py-3 rounded-lg flex-1 text-gray-700 font-mono">
              https://reachtheapex.net/join/{rep.apex_rep_code}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `https://reachtheapex.net/join/${rep.apex_rep_code}`
                )
              }}
              className="text-sm px-4 py-3 border rounded-lg hover:bg-gray-50 font-medium"
            >
              Copy
            </button>
            <a
              href="/demos/share"
              className="text-sm px-4 py-3 border rounded-lg hover:bg-gray-50 font-medium"
            >
              QR Code
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Share this link with prospects. When they sign up, they'll
            automatically be assigned to you and you'll earn commission
            on their subscription.
          </p>
        </div>

      </main>
    </div>
  )
}
