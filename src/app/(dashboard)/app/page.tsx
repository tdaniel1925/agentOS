/**
 * Subscriber Dashboard
 * Main app interface for subscribers
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get subscriber data
  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (!subscriber) {
    redirect('/onboard')
  }

  // Get today's stats
  const today = new Date().toISOString().split('T')[0]

  const { count: callsToday } = await supabase
    .from('call_summaries')
    .select('*', { count: 'exact', head: true })
    .eq('subscriber_id', subscriber.id)
    .gte('created_at', `${today}T00:00:00`)

  const { count: commandsToday } = await supabase
    .from('commands_log')
    .select('*', { count: 'exact', head: true })
    .eq('subscriber_id', subscriber.id)
    .gte('created_at', `${today}T00:00:00`)

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from('commands_log')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get active features
  const { data: features } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .eq('enabled', true)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1B3A7D]">
              AgentOS
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{subscriber.name}</span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {greeting}, {subscriber.name.split(' ')[0]}!
          </h2>
          <p className="text-gray-600">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Today's Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Calls Today"
            value={callsToday || 0}
            icon="📞"
          />
          <StatCard
            title="Commands Executed"
            value={commandsToday || 0}
            icon="⚡"
          />
          <StatCard
            title="Bot Status"
            value={subscriber.status === 'active' ? 'Online' : 'Offline'}
            icon={subscriber.status === 'active' ? '🟢' : '🔴'}
            valueColor={subscriber.status === 'active' ? 'text-green-600' : 'text-red-600'}
          />
        </div>

        {/* Quick Commands */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Commands</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickButton label="Daily Report" icon="📊" />
            <QuickButton label="Schedule Post" icon="📱" />
            <QuickButton label="New Campaign" icon="✉️" />
            <QuickButton label="Activity Log" icon="📋" href="/app/activity" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <Link
              href="/app/activity"
              className="text-sm text-[#1B3A7D] hover:underline"
            >
              View All
            </Link>
          </div>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.skill_triggered || 'Command'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.raw_message?.substring(0, 50)}...
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>

        {/* Active Skills */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Active Skills</h3>
            <Link
              href="/app/skills"
              className="text-sm text-[#1B3A7D] hover:underline"
            >
              Add More
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {features && features.length > 0 ? (
              features.map((feature) => (
                <div
                  key={feature.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {feature.feature_name}
                    </span>
                    <span className="text-green-500 text-sm">●</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm col-span-3">No active skills</p>
            )}
          </div>
        </div>

        {/* Bot Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {subscriber.bot_name}'s Info
          </h3>
          <div className="space-y-3">
            <InfoRow label="Business Number" value={subscriber.vapi_phone_number || 'Setting up...'} />
            <InfoRow label="Control SMS" value={process.env.TWILIO_PHONE_NUMBER || '+1 (651) 728-7626'} />
            <InfoRow label="Industry Pack" value={subscriber.business_type || 'General'} />
            <InfoRow label="Current Plan" value={`$${subscriber.current_mrr}/month`} />
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

function QuickButton({ label, icon, href }: { label: string; icon: string; href?: string }) {
  const className = "flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"

  if (href) {
    return (
      <Link href={href} className={className}>
        <span className="text-2xl mb-2">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </Link>
    )
  }

  return (
    <button className={className}>
      <span className="text-2xl mb-2">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}:</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
