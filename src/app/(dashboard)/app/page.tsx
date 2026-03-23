/**
 * Subscriber Dashboard
 * Main app interface for subscribers
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import UsageDashboard from '@/components/UsageDashboard'
import TrialBanner from '@/components/dashboard/TrialBanner'
import PaymentMethodAlert from '@/components/dashboard/PaymentMethodAlert'
import PhoneProvisioningAlert from '@/components/dashboard/PhoneProvisioningAlert'
import CalendarSetupAlert from '@/components/dashboard/CalendarSetupAlert'
import EmailForwardingCard from '@/components/dashboard/EmailForwardingCard'
import { assignJordynEmailAddress } from '@/lib/email/address-generator'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user - auth check is handled by layout.tsx
  const { data: { user } } = await supabase.auth.getUser()

  // If no user, return early - layout will redirect
  if (!user) {
    return <div>Loading...</div>
  }

  // Get subscriber data - using untyped query to bypass TypeScript inference issue
  const subscriberResult: any = await (supabase as any)
    .from('subscribers')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  const subscriber = subscriberResult.data

  // If no subscriber, show message - don't redirect
  if (!subscriber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    )
  }

  // Assign Jordyn email address if not already assigned
  if (!subscriber.jordyn_email_address) {
    try {
      subscriber.jordyn_email_address = await assignJordynEmailAddress(subscriber.id)
    } catch (error) {
      console.error('Failed to assign Jordyn email address:', error)
    }
  }

  // Get today's stats
  const today = new Date().toISOString().split('T')[0]

  const callsTodayResult: any = await (supabase as any)
    .from('call_summaries')
    .select('*', { count: 'exact', head: true })
    .eq('subscriber_id', subscriber.id)
    .gte('created_at', `${today}T00:00:00`)

  const callsToday = callsTodayResult.count

  const commandsTodayResult: any = await (supabase as any)
    .from('commands_log')
    .select('*', { count: 'exact', head: true })
    .eq('subscriber_id', subscriber.id)
    .gte('created_at', `${today}T00:00:00`)

  const commandsToday = commandsTodayResult.count

  // Get recent activity
  const recentActivityResult: any = await (supabase as any)
    .from('commands_log')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentActivity = recentActivityResult.data

  // Get active features
  const featuresResult: any = await (supabase as any)
    .from('feature_flags')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .eq('enabled', true)

  const features = featuresResult.data

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Trial Banner - Show for trialing users */}
      {subscriber.billing_status === 'trialing' && subscriber.trial_ends_at && (
        <TrialBanner
          trialEndsAt={subscriber.trial_ends_at}
          businessName={subscriber.business_name}
          botName={subscriber.bot_name}
        />
      )}

      {/* Payment Method Alert - Show if trial user hasn't added payment method */}
      {subscriber.billing_status === 'trialing' && !subscriber.payment_method_added && (
        <PaymentMethodAlert
          checkoutSessionUrl={subscriber.stripe_checkout_session_url}
          subscriberId={subscriber.id}
        />
      )}

      {/* Phone Provisioning Alert - Show if phone number not provisioned */}
      {!subscriber.phone_number && subscriber.vapi_assistant_id && (
        <PhoneProvisioningAlert
          subscriberId={subscriber.id}
          businessName={subscriber.business_name}
        />
      )}

      {/* Calendar Setup Alert - Show if calendar not connected */}
      {!subscriber.calendar_url && (
        <CalendarSetupAlert
          calendarConnected={!!subscriber.calendar_url}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1B3A7D] to-[#2A4A8D] rounded-lg flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                  <path d="M12 8V4H8"></path>
                  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                  <path d="M2 14h2"></path>
                  <path d="M20 14h2"></path>
                  <path d="M15 13v2"></path>
                  <path d="M9 13v2"></path>
                </svg>
              </div>
              <span className="text-2xl font-bold text-[#1B3A7D]">AgentOS</span>
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
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {greeting}, {subscriber.name.split(' ')[0]}!
          </h1>
          <p className="text-lg text-gray-600">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Calls Today"
            value={callsToday || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
              </svg>
            }
          />
          <StatCard
            title="Commands Executed"
            value={commandsToday || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="m13 2-2 2.5L9 7"></path>
                <path d="M10.75 9.25 9 13"></path>
                <path d="m8.5 14.5-.5 3.5"></path>
                <path d="m15 7-2.5 2.5L10 12"></path>
                <path d="m7 21 5-5"></path>
                <path d="m13.5 9.5 2.5-2.5L19 4"></path>
              </svg>
            }
          />
          <StatCard
            title="Bot Status"
            value={subscriber.status === 'active' ? 'Online' : 'Offline'}
            icon={
              subscriber.status === 'active' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" x2="9" y1="9" y2="15"></line>
                  <line x1="9" x2="15" y1="9" y2="15"></line>
                </svg>
              )
            }
            valueColor={subscriber.status === 'active' ? 'text-green-600' : 'text-red-600'}
          />
        </div>

        {/* Quick Commands */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickButton
              label="Daily Report"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                  <path d="M18 17V9"></path>
                  <path d="M13 17V5"></path>
                  <path d="M8 17v-3"></path>
                </svg>
              }
            />
            <QuickButton
              label="Schedule Post"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                  <path d="M12 18h.01"></path>
                </svg>
              }
            />
            <QuickButton
              label="New Campaign"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                </svg>
              }
            />
            <QuickButton
              label="Activity Log"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
              }
              href="/app/activity"
            />
          </div>
        </div>

        {/* Email Forwarding Card - Show if user has Jordyn email */}
        {subscriber.jordyn_email_address && (
          <div className="mb-8">
            <EmailForwardingCard
              jordynEmail={subscriber.jordyn_email_address}
              businessName={subscriber.business_name}
            />
          </div>
        )}

        {/* Usage Dashboard */}
        <div className="mb-8">
          <UsageDashboard subscriberId={subscriber.id} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              <Link
                href="/app/activity"
                className="text-sm text-[#1B3A7D] hover:text-[#C7181F] font-medium transition-colors"
              >
                View All →
              </Link>
            </div>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1B3A7D]/10 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#1B3A7D]">
                        <path d="m13 2-2 2.5L9 7"></path>
                        <path d="M10.75 9.25 9 13"></path>
                        <path d="m8.5 14.5-.5 3.5"></path>
                        <path d="m15 7-2.5 2.5L10 12"></path>
                        <path d="m7 21 5-5"></path>
                        <path d="m13.5 9.5 2.5-2.5L19 4"></path>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.skill_triggered || 'Command'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {activity.raw_message || 'No details'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-400">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            )}
          </div>

          {/* Active Skills */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Active Skills</h3>
              <Link
                href="/app/skills"
                className="text-sm text-[#1B3A7D] hover:text-[#C7181F] font-medium transition-colors"
              >
                Add More →
              </Link>
            </div>
            <div className="space-y-3">
              {features && features.length > 0 ? (
                features.map((feature: any) => (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#1B3A7D]/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900 capitalize">
                        {feature.feature_name.replace(/-/g, ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium">Active</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-400">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-2">No active skills</p>
                  <Link href="/app/skills" className="text-sm text-[#1B3A7D] hover:underline font-medium">
                    Add your first skill →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bot Info */}
        <div className="bg-gradient-to-br from-[#1B3A7D] to-[#2A4A8D] rounded-2xl shadow-xl p-6 text-white">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 8V4H8"></path>
              <rect width="16" height="12" x="4" y="8" rx="2"></rect>
              <path d="M2 14h2"></path>
              <path d="M20 14h2"></path>
              <path d="M15 13v2"></path>
              <path d="M9 13v2"></path>
            </svg>
            {subscriber.bot_name}&apos;s Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <InfoRow label="Business Number" value={subscriber.phone_number || 'Setting up...'} />
            <InfoRow label="Control SMS" value={process.env.TWILIO_PHONE_NUMBER || '+1 (651) 728-7626'} />
            <InfoRow label="Industry Pack" value={subscriber.business_type || 'General'} />
            <InfoRow label="Current Plan" value={`$${subscriber.current_mrr}/month`} />
          </div>

          {/* Google Calendar Connection */}
          <div className="border-t border-white/20 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" x2="16" y1="2" y2="6"></line>
                    <line x1="8" x2="8" y1="2" y2="6"></line>
                    <line x1="3" x2="21" y1="10" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-white">Google Calendar</div>
                  <div className="text-sm text-white/70">
                    {subscriber.google_calendar_connected ? 'Connected' : 'Not connected'}
                  </div>
                </div>
              </div>
              {subscriber.google_calendar_connected ? (
                <div className="flex items-center gap-2 text-green-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                  <span className="text-sm font-medium">Active</span>
                </div>
              ) : (
                <Link
                  href="/api/auth/google"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#1B3A7D] font-bold rounded-lg hover:bg-white/90 transition-all text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                  Connect
                </Link>
              )}
            </div>
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

function QuickButton({ label, icon, href }: { label: string; icon: React.ReactNode; href?: string }) {
  const className = "flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl hover:border-[#1B3A7D] hover:shadow-md hover:bg-[#1B3A7D]/5 transition-all group"

  if (href) {
    return (
      <Link href={href} className={className}>
        <div className="w-12 h-12 bg-[#1B3A7D]/10 rounded-xl flex items-center justify-center mb-3 text-[#1B3A7D] group-hover:bg-[#1B3A7D] group-hover:text-white transition-all">
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-700 text-center">{label}</span>
      </Link>
    )
  }

  return (
    <button className={className}>
      <div className="w-12 h-12 bg-[#1B3A7D]/10 rounded-xl flex items-center justify-center mb-3 text-[#1B3A7D] group-hover:bg-[#1B3A7D] group-hover:text-white transition-all">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700 text-center">{label}</span>
    </button>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 rounded-lg p-4">
      <div className="text-xs text-white/60 mb-1">{label}</div>
      <div className="text-sm font-bold text-white">{value}</div>
    </div>
  )
}
