/**
 * Processing Overlay Component
 * Full-screen overlay shown during account setup after Stripe payment
 * Displays progress bar and status updates while VAPI assistant is being created
 */

'use client'

import { useEffect, useState } from 'react'

interface ProcessingOverlayProps {
  subscriberId: string
  onComplete: () => void
  onError: (error: string) => void
}

export default function ProcessingOverlay({
  subscriberId,
  onComplete,
  onError,
}: ProcessingOverlayProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('Creating your AI assistant')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isTimeout, setIsTimeout] = useState(false)

  useEffect(() => {
    // Timer to track elapsed time
    const timeInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    // Timeout after 5 minutes
    const timeoutTimer = setTimeout(() => {
      setIsTimeout(true)
      onError(
        'Setup is taking longer than expected. Please contact support at support@theapexbots.com'
      )
    }, 300000) // 5 minutes

    return () => {
      clearInterval(timeInterval)
      clearTimeout(timeoutTimer)
    }
  }, [onError])

  useEffect(() => {
    // Poll for subscriber status
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/subscribers/${subscriberId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check setup status')
        }

        // Check if setup is complete
        const hasAssistant = data.vapi_assistant_id && data.vapi_assistant_id !== null
        const isActive = data.stripe_subscription_status === 'active'

        if (hasAssistant && isActive) {
          setProgress(100)
          setCurrentStep('Setup complete')
          clearInterval(pollInterval)
          setTimeout(() => {
            onComplete()
          }, 500)
          return
        }

        // Update progress based on available data
        if (data.stripe_subscription_status === 'active') {
          setProgress(40)
          setCurrentStep('Setting up your phone number')
        } else if (data.vapi_assistant_id) {
          setProgress(80)
          setCurrentStep('Finalizing setup')
        } else {
          // Still creating assistant
          setProgress((prev) => Math.min(prev + 5, 35))
        }
      } catch (error) {
        console.error('Polling error:', error)
        // Don't immediately fail - keep trying
      }
    }, 2000) // Poll every 2 seconds

    return () => {
      clearInterval(pollInterval)
    }
  }, [subscriberId, onComplete, onError])

  // Update step text based on progress
  useEffect(() => {
    if (progress < 40) {
      setCurrentStep('Creating your AI assistant')
    } else if (progress < 80) {
      setCurrentStep('Setting up your phone number')
    } else if (progress < 100) {
      setCurrentStep('Finalizing setup')
    }
  }, [progress])

  if (isTimeout) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-red-600"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" x2="12" y1="8" y2="12"></line>
                <line x1="12" x2="12.01" y1="16" y2="16"></line>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Setup Delayed
            </h2>
            <p className="text-gray-600 mb-6">
              Your account setup is taking longer than expected. Our team has been
              notified and will complete your setup within 24 hours.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You can safely close this window. We'll send you an email at the
              address you provided when your account is ready.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Need help?</strong> Contact us at{' '}
                <a
                  href="mailto:support@theapexbots.com"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  support@theapexbots.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1B3A7D] to-[#2A4A8D] rounded-2xl shadow-lg mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-white"
            >
              <path d="M12 8V4H8"></path>
              <rect width="16" height="12" x="4" y="8" rx="2"></rect>
              <path d="M2 14h2"></path>
              <path d="M20 14h2"></path>
              <path d="M15 13v2"></path>
              <path d="M9 13v2"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#1B3A7D] mb-2">
            Setting up your account...
          </h2>
          <p className="text-gray-600 text-sm">
            Usually takes 30-60 seconds
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4 mb-6">
          <ProgressStep
            label="Creating your AI assistant"
            active={progress < 40}
            complete={progress >= 40}
          />
          <ProgressStep
            label="Setting up your phone number"
            active={progress >= 40 && progress < 80}
            complete={progress >= 80}
          />
          <ProgressStep
            label="Finalizing setup"
            active={progress >= 80 && progress < 100}
            complete={progress >= 100}
          />
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
            <span>{currentStep}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#1B3A7D] to-[#C7181F] h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Spinner */}
        <div className="flex justify-center mb-4">
          <svg
            className="animate-spin h-8 w-8 text-[#1B3A7D]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>

        {/* Info Text */}
        <p className="text-center text-xs text-gray-500">
          Please don't close this window. Elapsed time: {elapsedSeconds}s
        </p>
      </div>
    </div>
  )
}

function ProgressStep({
  label,
  active,
  complete,
}: {
  label: string
  active: boolean
  complete: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          complete
            ? 'bg-green-500'
            : active
            ? 'bg-[#1B3A7D] animate-pulse'
            : 'bg-gray-300'
        }`}
      >
        {complete ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-white"
          >
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        ) : active ? (
          <div className="w-3 h-3 rounded-full bg-white" />
        ) : (
          <div className="w-3 h-3 rounded-full bg-gray-400" />
        )}
      </div>
      <span
        className={`text-sm font-medium ${
          complete
            ? 'text-gray-900'
            : active
            ? 'text-[#1B3A7D] font-semibold'
            : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
