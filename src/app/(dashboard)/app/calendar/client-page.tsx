'use client'

/**
 * Calendar Setup Page - Client Component
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CalendarSetupForm from '@/components/dashboard/CalendarSetupForm'

export default function CalendarSetupClientPage() {
  const [loading, setLoading] = useState(true)
  const [subscriber, setSubscriber] = useState<any>(null)

  useEffect(() => {
    async function loadSubscriber() {
      try {
        const supabase = createClient()

        // Get current user (layout already verified auth)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('📅 Calendar: No user found (unexpected - layout should handle auth)')
          setLoading(false)
          return
        }

        console.log('📅 Calendar: Loading data for', user.email)

        // Get subscriber data with calendar info
        const subscriberResult: any = await (supabase as any)
          .from('subscribers')
          .select('id, business_name, timezone, google_calendar_connected, microsoft_calendar_connected, calendar_type, calendar_url')
          .eq('auth_user_id', user.id)
          .single()

        if (subscriberResult.data) {
          setSubscriber(subscriberResult.data)
          console.log('📅 Calendar: Data loaded')
        } else {
          console.error('📅 Calendar: No subscriber found')
        }
      } catch (error) {
        console.error('📅 Calendar: Error', error)
      } finally {
        setLoading(false)
      }
    }

    loadSubscriber()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="text-gray-600">Loading calendar settings...</div>
        </div>
      </div>
    )
  }

  if (!subscriber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">Unable to load calendar settings</p>
        </div>
      </div>
    )
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
