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
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/app"
                className="text-[#1B3A7D] hover:text-[#0F2347]"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-[#1B3A7D]">
                Activity Log
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{subscriber.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Commands"
            value={totalCommands || 0}
            icon="⚡"
          />
          <StatCard
            title="Total Calls"
            value={totalCalls || 0}
            icon="📞"
          />
          <StatCard
            title="Success Rate"
            value={`${successRate}%`}
            icon="✅"
            valueColor={successRate >= 95 ? 'text-green-600' : successRate >= 80 ? 'text-yellow-600' : 'text-red-600'}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <TabButton label="Commands" active={true} />
              <TabButton label="Calls" active={false} />
            </nav>
          </div>

          {/* Commands Table */}
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Recent Commands
            </h2>

            {commands && commands.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Channel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Command
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Skill
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commands.map((command: any) => (
                      <tr key={command.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(command.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ChannelBadge channel={command.channel} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {command.raw_message?.substring(0, 50) || '—'}
                          {command.raw_message && command.raw_message.length > 50 ? '...' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {command.skill_triggered || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {command.success ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              Success
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                              Failed
                            </span>
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
              <div className="text-center py-12">
                <p className="text-gray-500">No commands yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Commands will appear here when {subscriber.bot_name} executes actions
                </p>
              </div>
            )}
          </div>

          {/* Calls Section (hidden for now, can be activated with tabs) */}
          <div className="p-6 hidden">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Recent Calls
            </h2>

            {calls && calls.length > 0 ? (
              <div className="space-y-4">
                {calls.map((call: any) => (
                  <div
                    key={call.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {call.call_type === 'inbound' ? '📞 Inbound' : '📱 Outbound'}
                          </span>
                          <span className="text-sm text-gray-600">
                            from {call.caller_number}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(call.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.floor((call.duration_seconds || 0) / 60)}:{String((call.duration_seconds || 0) % 60).padStart(2, '0')}
                      </span>
                    </div>

                    {call.summary && (
                      <p className="text-sm text-gray-700 mt-2">
                        {call.summary}
                      </p>
                    )}

                    {call.action_required && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                        <p className="text-xs font-medium text-yellow-800">
                          ⚠️ Action Required
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No calls yet</p>
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
  icon: string
  valueColor?: string
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${valueColor}`}>
        {value}
      </div>
    </div>
  )
}

function TabButton({ label, active }: { label: string; active: boolean }) {
  return (
    <button
      className={`px-6 py-3 text-sm font-medium border-b-2 ${
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
  const colors: Record<string, string> = {
    sms: 'bg-blue-100 text-blue-800',
    email: 'bg-purple-100 text-purple-800',
    phone: 'bg-green-100 text-green-800',
    discord: 'bg-indigo-100 text-indigo-800',
    app: 'bg-gray-100 text-gray-800',
  }

  const color = channel ? colors[channel] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${color}`}>
      {channel || 'unknown'}
    </span>
  )
}
