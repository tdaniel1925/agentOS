/**
 * Activity Log Page
 * Full history of all subscriber commands and actions
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ActivityLogPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get subscriber data - using untyped query to bypass TypeScript inference issue
  const subscriberResult: any = await (supabase as any)
    .from('subscribers')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  const subscriber = subscriberResult.data

  if (!subscriber) {
    redirect('/onboard')
  }

  // Get all commands (paginated - last 100)
  const commandsResult: any = await (supabase as any)
    .from('commands_log')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const commands = commandsResult.data

  // Get all calls (paginated - last 100)
  const callsResult: any = await (supabase as any)
    .from('call_summaries')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const calls = callsResult.data

  // Get stats
  const totalCommandsResult: any = await (supabase as any)
    .from('commands_log')
    .select('*', { count: 'exact', head: true })
    .eq('subscriber_id', subscriber.id)

  const totalCommands = totalCommandsResult.count

  const totalCallsResult: any = await (supabase as any)
    .from('call_summaries')
    .select('*', { count: 'exact', head: true })
    .eq('subscriber_id', subscriber.id)

  const totalCalls = totalCallsResult.count

  const successfulCommandsResult: any = await (supabase as any)
    .from('commands_log')
    .select('*', { count: 'exact', head: true })
    .eq('subscriber_id', subscriber.id)
    .eq('success', true)

  const successfulCommands = successfulCommandsResult.count

  const successRate = totalCommands ? Math.round((successfulCommands || 0) / totalCommands * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/app"
                className="flex items-center gap-2 text-[#1B3A7D] hover:text-[#0F2347] font-medium transition-colors group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:-translate-x-1 transition-transform">
                  <path d="m12 19-7-7 7-7"></path>
                  <path d="M19 12H5"></path>
                </svg>
                Back
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1B3A7D] to-[#2A4A8D] rounded-lg flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                    <path d="M3 3v18h18"></path>
                    <path d="m19 9-5 5-4-4-3 3"></path>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-[#1B3A7D]">
                  Activity Log
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-gray-900">{subscriber.name}</div>
                <div className="text-xs text-gray-500">{subscriber.business_name}</div>
              </div>
              <Link
                href="/api/auth/signout"
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
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Commands"
            value={totalCommands || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            }
          />
          <StatCard
            title="Total Calls"
            value={totalCalls || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
              </svg>
            }
          />
          <StatCard
            title="Success Rate"
            value={`${successRate}%`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            }
            valueColor={successRate >= 95 ? 'text-green-600' : successRate >= 80 ? 'text-yellow-600' : 'text-red-600'}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex -mb-px px-6">
              <TabButton label="Commands" active={true} />
              <TabButton label="Calls" active={false} />
            </nav>
          </div>

          {/* Commands Table */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Recent Commands
              </h2>
              <span className="text-sm text-gray-500">
                Last 100 commands
              </span>
            </div>

            {commands && commands.length > 0 ? (
              <div className="overflow-x-auto -mx-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Channel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Command
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Skill
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {commands.map((command: any) => (
                      <tr key={command.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(command.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ChannelBadge channel={command.channel} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {command.raw_message || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {command.skill_triggered ? (
                            <span className="px-3 py-1 bg-[#1B3A7D]/10 text-[#1B3A7D] text-xs font-medium rounded-full">
                              {command.skill_triggered}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {command.success ? (
                            <div className="flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-600">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="m9 12 2 2 4-4"></path>
                              </svg>
                              <span className="text-xs font-medium text-green-700">Success</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-600">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="m15 9-6 6"></path>
                                <path d="m9 9 6 6"></path>
                              </svg>
                              <span className="text-xs font-medium text-red-700">Failed</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {command.duration_ms ? `${command.duration_ms}ms` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-400">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"></path>
                  </svg>
                </div>
                <p className="text-gray-600 font-medium mb-1">No commands yet</p>
                <p className="text-sm text-gray-500">
                  Commands will appear here when {subscriber.bot_name} executes actions
                </p>
              </div>
            )}
          </div>

          {/* Calls Section (hidden for now, can be activated with tabs) */}
          <div className="p-6 hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Recent Calls
              </h2>
              <span className="text-sm text-gray-500">
                Last 100 calls
              </span>
            </div>

            {calls && calls.length > 0 ? (
              <div className="space-y-3">
                {calls.map((call: any) => (
                  <div
                    key={call.id}
                    className="border border-gray-200 rounded-xl p-5 hover:border-[#1B3A7D]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {call.call_type === 'inbound' ? (
                            <div className="flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-600">
                                <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
                              </svg>
                              <span className="font-medium text-gray-900">Inbound</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                              </svg>
                              <span className="font-medium text-gray-900">Outbound</span>
                            </div>
                          )}
                          <span className="text-sm text-gray-600">
                            from {call.caller_number}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(call.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-900 px-3 py-1 bg-gray-100 rounded-lg">
                        {Math.floor((call.duration_seconds || 0) / 60)}:{String((call.duration_seconds || 0) % 60).padStart(2, '0')}
                      </span>
                    </div>

                    {call.summary && (
                      <p className="text-sm text-gray-700 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        {call.summary}
                      </p>
                    )}

                    {call.action_required && (
                      <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3 flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5">
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path>
                          <path d="M12 9v4"></path>
                          <path d="M12 17h.01"></path>
                        </svg>
                        <p className="text-xs font-medium text-yellow-800">
                          Action Required
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-400">
                    <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
                  </svg>
                </div>
                <p className="text-gray-600 font-medium mb-1">No calls yet</p>
                <p className="text-sm text-gray-500">
                  Call history will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, valueColor = 'text-[#1B3A7D]' }: {
  title: string
  value: string | number
  icon: React.ReactNode
  valueColor?: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">{title}</span>
        <div className="w-12 h-12 bg-[#1B3A7D]/10 rounded-xl flex items-center justify-center text-[#1B3A7D]">
          {icon}
        </div>
      </div>
      <div className={`text-4xl font-bold ${valueColor}`}>
        {value}
      </div>
    </div>
  )
}

function TabButton({ label, active }: { label: string; active: boolean }) {
  return (
    <button
      className={`px-6 py-4 text-sm font-bold border-b-2 transition-all ${
        active
          ? 'border-[#1B3A7D] text-[#1B3A7D]'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  )
}

function ChannelBadge({ channel }: { channel: string | null }) {
  const channelConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    sms: {
      color: 'bg-blue-100 text-blue-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
    },
    email: {
      color: 'bg-purple-100 text-purple-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <rect width="20" height="16" x="2" y="4" rx="2"></rect>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
        </svg>
      ),
    },
    phone: {
      color: 'bg-green-100 text-green-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
        </svg>
      ),
    },
    discord: {
      color: 'bg-indigo-100 text-indigo-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="19" cy="12" r="1"></circle>
          <circle cx="5" cy="12" r="1"></circle>
        </svg>
      ),
    },
    app: {
      color: 'bg-gray-100 text-gray-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <rect width="18" height="18" x="3" y="3" rx="2"></rect>
          <path d="M9 3v18"></path>
        </svg>
      ),
    },
  }

  const config = channel ? channelConfig[channel] || channelConfig.app : channelConfig.app

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${config.color}`}>
      {config.icon}
      {channel || 'unknown'}
    </span>
  )
}
