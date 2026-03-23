/**
 * Calendar Setup Page
 * Allows subscribers to connect Google/Outlook and set timezone
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CalendarSetupForm from '@/components/dashboard/CalendarSetupForm'

export default async function CalendarSetupPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log('📅 Calendar page: User check', {
    hasUser: !!user,
    email: user?.email,
    error: userError?.message
  })

  if (!user) {
    console.log('📅 Calendar page: No user found, redirecting to login')
    redirect('/login')
  }

  // Get subscriber data with calendar info
  const subscriberResult: any = await (supabase as any)
    .from('subscribers')
    .select('id, business_name, timezone, google_calendar_connected, microsoft_calendar_connected, calendar_type, calendar_url')
    .eq('auth_user_id', user.id)
    .single()

  // Check for errors first
  if (subscriberResult.error) {
    console.error('Calendar page - subscriber query error:', subscriberResult.error)
    redirect('/onboard')
  }

  const subscriber = subscriberResult.data

  if (!subscriber) {
    console.error('Calendar page - no subscriber found for user:', user.id)
    redirect('/onboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Calendar Setup</h1>
          <p className="mt-2 text-gray-600">
            Connect your calendar so Jordyn can manage appointments automatically
          </p>
        </div>

        {/* Calendar Setup Form */}
        <CalendarSetupForm subscriber={subscriber} />
      </div>
    </div>
  )
}
