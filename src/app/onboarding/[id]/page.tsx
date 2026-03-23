'use client'

/**
 * Onboarding Flow Page
 *
 * Route: /onboarding/[id]
 *
 * State machine:
 * 1. loading - Initial state, fetching subscriber
 * 2. provisioning - Creating VAPI assistant (automated, polls every 3s)
 * 3. choose_number - User selects ZIP code and number
 * 4. complete - All done, show success screen
 *
 * Flow:
 * - After payment → Redirect here
 * - Poll /api/subscribers/[id] until vapi_assistant_id exists
 * - Show progress bar 0-100%
 * - When ready → Show number selection UI
 * - After provision → Show success
 * - Redirect to /dashboard
 */

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ProvisioningProgress } from '@/components/onboarding/ProvisioningProgress'
import { NumberChooser } from '@/components/onboarding/NumberChooser'
import { ProvisioningComplete } from '@/components/onboarding/ProvisioningComplete'

type OnboardingState =
  | 'loading'           // Checking subscriber status
  | 'provisioning'      // Creating assistant (automated)
  | 'choose_number'     // User selects ZIP & number
  | 'complete'          // All done

interface SubscriberData {
  id: string
  name: string
  email: string
  business_name: string | null
  vapi_assistant_id: string | null
  vapi_phone_number: string | null
  phone_number_status: string | null
}

export default function OnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()

  const [state, setState] = useState<OnboardingState>('loading')
  const [subscriber, setSubscriber] = useState<SubscriberData | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  // Check for payment status in URL
  useEffect(() => {
    if (typeof window === 'undefined') return

    const urlParams = new URLSearchParams(window.location.search)
    const payment = urlParams.get('payment')

    if (payment) {
      setPaymentStatus(payment)
      // Clear the URL parameter
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  // Fetch subscriber data
  useEffect(() => {
    async function fetchSubscriber(): Promise<void> {
      try {
        const res = await fetch(`/api/subscribers/${resolvedParams.id}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load subscriber')
        }

        setSubscriber(data)

        // Check what state we should be in
        if (data.vapi_assistant_id && data.vapi_phone_number) {
          // Already has everything - go to complete
          setState('complete')
        } else if (data.vapi_assistant_id) {
          // Has assistant but no number - choose number
          setState('choose_number')
        } else {
          // No assistant yet - provisioning
          setState('provisioning')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load subscriber'
        setError(message)
      }
    }

    fetchSubscriber()
  }, [resolvedParams.id])

  // Poll for assistant creation
  useEffect(() => {
    if (state !== 'provisioning') return

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/subscribers/${resolvedParams.id}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to check status')
        }

        setSubscriber(data)
        setPollCount((prev) => prev + 1)

        // Increment progress based on poll count
        // Typical assistant creation takes 30-60 seconds
        // Poll every 3s = 10-20 polls = 5-10% per poll
        const newProgress = Math.min(95, progress + 8)
        setProgress(newProgress)

        // Check if assistant is ready
        if (data.vapi_assistant_id) {
          setProgress(100)
          // Small delay to show 100% complete
          setTimeout(() => {
            setState('choose_number')
          }, 800)
          clearInterval(pollInterval)
        }
      } catch (err) {
        console.error('Poll error:', err)
        // Continue polling despite errors
      }
    }, 3000) // Poll every 3 seconds

    // Timeout after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      setError('Provisioning is taking longer than expected. Support has been notified.')
    }, 300000) // 5 minutes

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [state, resolvedParams.id, progress])

  // Handle completion
  function handleComplete(): void {
    // Refetch subscriber to get the new phone number
    fetch(`/api/subscribers/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        setSubscriber(data)
        setState('complete')
      })
      .catch((err) => {
        console.error('Failed to refetch subscriber:', err)
        // Go to complete anyway
        setState('complete')
      })
  }

  function handleContinue(): void {
    router.push('/app')
  }

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1B3A7D]/10 rounded-full mb-4">
            <svg className="animate-spin h-8 w-8 text-[#1B3A7D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="text-gray-600">Loading your account...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-red-600">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something Went Wrong
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold hover:bg-[#152d63] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Provisioning state
  if (state === 'provisioning') {
    return <ProvisioningProgress progress={progress} />
  }

  // Choose number state
  if (state === 'choose_number' && subscriber) {
    return (
      <>
        {/* Payment status banners */}
        {paymentStatus === 'cancelled' && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-600 flex-shrink-0">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path>
                <path d="M12 9v4"></path>
                <path d="M12 17h.01"></path>
              </svg>
              <div>
                <p className="font-semibold text-yellow-900">Payment Cancelled</p>
                <p className="text-sm text-yellow-800">
                  No charge was made. Select a number and try again when you're ready.
                </p>
              </div>
            </div>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="bg-green-50 border-b border-green-200 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-600 flex-shrink-0">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              <div>
                <p className="font-semibold text-green-900">Payment Successful!</p>
                <p className="text-sm text-green-800">
                  Your phone number is being set up now. This takes about 30 seconds...
                </p>
              </div>
            </div>
          </div>
        )}

        <NumberChooser
          subscriberId={subscriber.id}
          onComplete={handleComplete}
        />
      </>
    )
  }

  // Complete state
  if (state === 'complete' && subscriber?.vapi_phone_number) {
    return (
      <ProvisioningComplete
        phoneNumber={subscriber.vapi_phone_number}
        onContinue={handleContinue}
      />
    )
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1B3A7D]/10 rounded-full mb-4">
          <svg className="animate-spin h-8 w-8 text-[#1B3A7D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div className="text-gray-600">Setting up your account...</div>
      </div>
    </div>
  )
}
