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

export default function OnboardingPage({ params }: { params: Promise<{ id: string }> }): JSX.Element {
  const resolvedParams = use(params)
  const router = useRouter()

  const [state, setState] = useState<OnboardingState>('loading')
  const [subscriber, setSubscriber] = useState<SubscriberData | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

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
    router.push('/dashboard')
  }

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
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
          <div className="text-6xl mb-4">⚠️</div>
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
      <NumberChooser
        subscriberId={subscriber.id}
        onComplete={handleComplete}
      />
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
        <div className="text-4xl mb-4">🔄</div>
        <div className="text-gray-600">Setting up your account...</div>
      </div>
    </div>
  )
}
