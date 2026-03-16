/**
 * Welcome Page
 * Shows onboarding progress and success message
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function WelcomePage() {
  const [loading, setLoading] = useState(true)
  const [subscriber, setSubscriber] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    loadSubscriber()
  }, [])

  async function loadSubscriber() {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Poll for subscriber data with bot info
    const interval = setInterval(async () => {
      const result: any = await (supabase as any)
        .from('subscribers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      const { data } = result

      if (data) {
        setSubscriber(data)

        // Update progress based on what's complete
        let currentProgress = 0
        if (data.stripe_customer_id) currentProgress = 25
        if (data.vapi_assistant_id) currentProgress = 50
        if (data.vapi_phone_number) currentProgress = 75
        if (data.status === 'active') currentProgress = 100

        setProgress(currentProgress)

        if (currentProgress === 100) {
          setLoading(false)
          clearInterval(interval)
        }
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }

  if (loading || !subscriber) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1B3A7D] to-[#0F2347] flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-[#1B3A7D]">
                  <path d="M12 8V4H8"></path>
                  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                  <path d="M2 14h2"></path>
                  <path d="M20 14h2"></path>
                  <path d="M15 13v2"></path>
                  <path d="M9 13v2"></path>
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">AgentOS</span>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-12 border border-gray-100">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1B3A7D]/10 rounded-full mb-4">
                <svg className="animate-spin h-10 w-10 text-[#1B3A7D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-[#1B3A7D] mb-2">
                Setting Up {subscriber?.bot_name || 'Your Bot'}...
              </h1>
              <p className="text-gray-600">This usually takes 2-3 minutes</p>
            </div>

            <div className="space-y-5 mb-8">
              <ProgressStep
                label="Creating your profile"
                complete={progress >= 25}
                active={progress < 25}
              />
              <ProgressStep
                label={`Training ${subscriber?.bot_name || 'your bot'} on ${subscriber?.business_type || 'your industry'}`}
                complete={progress >= 50}
                active={progress >= 25 && progress < 50}
              />
              <ProgressStep
                label="Setting up your phone number"
                complete={progress >= 75}
                active={progress >= 50 && progress < 75}
              />
              <ProgressStep
                label="Running final checks"
                complete={progress >= 100}
                active={progress >= 75 && progress < 100}
              />
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#1B3A7D] to-[#C7181F] h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B3A7D] to-[#0F2347] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-[#1B3A7D]">
                <path d="M12 8V4H8"></path>
                <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                <path d="M2 14h2"></path>
                <path d="M20 14h2"></path>
                <path d="M15 13v2"></path>
                <path d="M9 13v2"></path>
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">AgentOS</span>
          </div>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-12 border border-gray-100">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 text-green-600">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-[#1B3A7D] mb-3">
              {subscriber.bot_name} is Ready!
            </h1>
            <p className="text-xl text-gray-600">
              Your AI employee is now working for you
            </p>
          </div>

          {/* Info Cards */}
          <div className="space-y-4 mb-8">
            {/* Business Number */}
            <div className="bg-gradient-to-br from-[#1B3A7D] to-[#2A4A8D] rounded-xl p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Your New Business Number</h3>
                  <p className="text-3xl font-bold mb-3">{subscriber.vapi_phone_number}</p>
                  <p className="text-white/80 text-sm">
                    Share this with clients or forward your existing number. {subscriber.bot_name} will answer every call professionally.
                  </p>
                </div>
              </div>
            </div>

            {/* Control via SMS */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1B3A7D]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#1B3A7D]">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-[#1B3A7D] mb-2">Control via SMS</h3>
                  <p className="text-lg font-bold text-gray-900 mb-3">
                    Text: {process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+1 (651) 728-7626'}
                  </p>
                  <p className="text-gray-600 text-sm mb-3">Send commands like:</p>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#1B3A7D] rounded-full"></span>
                      "What can you do?"
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#1B3A7D] rounded-full"></span>
                      "How many calls today?"
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#1B3A7D] rounded-full"></span>
                      "Schedule a social post"
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Text Alert */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-8 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">
              <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
              <path d="M12 18h.01"></path>
            </svg>
            <p className="text-sm text-blue-800">
              <strong>Check your phone!</strong> {subscriber.bot_name} just sent you a welcome text with all your details.
            </p>
          </div>

          {/* CTA Button */}
          <Link
            href="/app"
            className="block w-full bg-[#C7181F] hover:bg-[#A01419] text-white font-bold text-lg px-12 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
          >
            Go to Dashboard →
          </Link>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Your first weekly report will arrive Monday morning.
          </p>
        </div>
      </div>
    </div>
  )
}

function ProgressStep({ label, complete, active }: { label: string; complete: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        complete ? 'bg-green-500' : active ? 'bg-[#1B3A7D] animate-pulse' : 'bg-gray-300'
      }`}>
        {complete ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        ) : (
          <div className={`w-5 h-5 rounded-full ${active ? 'bg-white' : 'bg-gray-400'}`} />
        )}
      </div>
      <span className={`text-lg font-medium ${complete ? 'text-gray-900' : active ? 'text-[#1B3A7D]' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )
}
