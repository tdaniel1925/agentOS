/**
 * Welcome Page
 * Shows onboarding progress and success message
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function WelcomePage() {
  const searchParams = useSearchParams()
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
      <div className="min-h-screen bg-gradient-to-b from-[#1B3A7D] to-[#0F2347] flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-12">
          <h1 className="text-3xl font-bold text-[#1B3A7D] mb-8 text-center">
            Setting Up {subscriber?.bot_name || 'Your Bot'}...
          </h1>

          <div className="space-y-6">
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
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-[#C7181F] h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-gray-600 mt-4 text-sm">
              This usually takes 2-3 minutes...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B3A7D] to-[#0F2347] py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-12">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-[#1B3A7D] mb-2">
            {subscriber.bot_name} is Ready!
          </h1>
          <p className="text-xl text-gray-600">
            Your AI employee is now working for you
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-lg text-[#1B3A7D] mb-2">
              Your New Business Number
            </h3>
            <p className="text-3xl font-bold text-[#C7181F] mb-2">
              {subscriber.vapi_phone_number}
            </p>
            <p className="text-gray-600">
              Share this with clients or forward your existing number. {subscriber.bot_name} will answer every call professionally.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-lg text-[#1B3A7D] mb-2">
              Control via SMS
            </h3>
            <p className="text-lg font-bold mb-2">
              Text: {process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+1 (651) 728-7626'}
            </p>
            <p className="text-gray-600 mb-3">
              Send commands like:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• "What can you do?"</li>
              <li>• "How many calls today?"</li>
              <li>• "Schedule a social post"</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-800">
            📱 <strong>Check your phone!</strong> {subscriber.bot_name} just sent you a welcome text with all your details.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/app"
            className="inline-block bg-[#1B3A7D] hover:bg-[#0F2347] text-white font-bold text-lg px-12 py-4 rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="text-center text-gray-600 mt-8 text-sm">
          Your first weekly report will arrive Monday morning.
        </p>
      </div>
    </div>
  )
}

function ProgressStep({ label, complete, active }: { label: string; complete: boolean; active: boolean }) {
  return (
    <div className="flex items-center space-x-4">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        complete ? 'bg-green-500' : active ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
      }`}>
        {complete ? (
          <span className="text-white font-bold">✓</span>
        ) : (
          <div className={`w-4 h-4 rounded-full ${active ? 'bg-white' : 'bg-gray-400'}`} />
        )}
      </div>
      <span className={`text-lg ${complete ? 'text-gray-900' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )
}
